#!/usr/bin/env node
/**
 * omidadli-site-mcp — an MCP server that lets Claude read & edit the site's
 * content (CMS) through the live admin API. Content edits go straight to the
 * live site's database; run `npm run content:export` in the repo afterwards if
 * you want Git to stay the source of truth.
 *
 * Transport: stdio (works with Claude Desktop and Claude Code).
 *
 * Required environment variables:
 *   SITE_URL         base URL of the site   (e.g. https://my-website.pages.dev)
 *   ADMIN_USERNAME   admin username
 *   ADMIN_PASSWORD   admin password
 *
 * See mcp/README.md for the Claude Desktop config snippet.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { SiteClient, setByPath, getByPath } from '../scripts/site-client.mjs';

const client = new SiteClient();

const ok = (obj) => ({ content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2) }] });
const fail = (msg) => ({ isError: true, content: [{ type: 'text', text: `❌ ${msg}` }] });
const truncate = (str, max = 12000) =>
  str.length <= max ? str : `${str.slice(0, max)}\n\n…[truncated ${str.length - max} chars — narrow the request with a "section" or "path" argument]`;

const server = new McpServer({ name: 'omidadli-site-mcp', version: '1.0.0' });

// --- connectivity / auth check ---------------------------------------------
server.registerTool(
  'ping',
  {
    title: 'Check connection',
    description: 'Verify the MCP can reach the site and authenticate with the admin credentials. Returns the site URL and whether login works.',
    inputSchema: {},
  },
  async () => {
    try {
      await client.login();
      const content = await client.getContent();
      return ok({ ok: true, siteUrl: client.baseUrl, authenticated: true, sections: content ? Object.keys(content).length : 0 });
    } catch (e) {
      return fail(`Could not connect/authenticate to ${client.baseUrl}: ${e.message}`);
    }
  }
);

// --- read content -----------------------------------------------------------
server.registerTool(
  'get_content',
  {
    title: 'Read site content',
    description: 'Read the site content (CMS). Pass a top-level "section" (e.g. PERSONAL_INFO, PRODUCTS, AI_TOOLS_CONFIG, PRODUCTS_PAGE_DATA) to read just that part; omit it to list all section names.',
    inputSchema: {
      section: z.string().optional().describe('Top-level section key to read. Omit to list all section names.'),
    },
  },
  async ({ section }) => {
    try {
      const content = await client.getContent();
      if (!content) return fail('The site returned empty content.');
      if (!section) return ok({ sections: Object.keys(content) });
      if (!(section in content)) return fail(`Unknown section "${section}". Available: ${Object.keys(content).join(', ')}`);
      return ok(truncate(JSON.stringify(content[section], null, 2)));
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.registerTool(
  'get_field',
  {
    title: 'Read a field by path',
    description: 'Read a single value by dot-path, e.g. "PERSONAL_INFO.name", "PRODUCTS.0.title", or "AI_TOOLS_CONFIG.tools.business-therapist.enabled".',
    inputSchema: { path: z.string().describe('Dot-path into the content, e.g. PERSONAL_INFO.tagline') },
  },
  async ({ path }) => {
    try {
      const content = await client.getContent();
      const value = getByPath(content, path);
      if (value === undefined) return fail(`No value found at path "${path}".`);
      return ok(truncate(JSON.stringify(value, null, 2)));
    } catch (e) {
      return fail(e.message);
    }
  }
);

// --- write content ----------------------------------------------------------
server.registerTool(
  'set_field',
  {
    title: 'Update a field by path',
    description: 'Set a single value at a dot-path and save it to the live site. "value" may be a string, number, boolean, object, or array. Example: path="PERSONAL_INFO.tagline", value="متن جدید". This is the safest way to make targeted edits.',
    inputSchema: {
      path: z.string().describe('Dot-path to set, e.g. PRODUCTS_PAGE_DATA.headline'),
      value: z.any().describe('New value (JSON: string/number/boolean/object/array).'),
    },
  },
  async ({ path, value }) => {
    try {
      const content = await client.getContent();
      if (!content) return fail('The site returned empty content; refusing to write.');
      setByPath(content, path, value);
      const r = await client.putContent(content);
      return ok({ ok: true, path, savedAt: r.updatedAt });
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.registerTool(
  'replace_section',
  {
    title: 'Replace a whole section',
    description: 'Overwrite an entire top-level section (e.g. PRODUCTS, AI_TOOLS_CONFIG) with the provided JSON value, then save. Use with care — this replaces the whole section.',
    inputSchema: {
      section: z.string().describe('Top-level section key to replace.'),
      value: z.any().describe('New section value (JSON object or array).'),
    },
  },
  async ({ section, value }) => {
    try {
      const content = await client.getContent();
      if (!content) return fail('The site returned empty content; refusing to write.');
      content[section] = value;
      const r = await client.putContent(content);
      return ok({ ok: true, section, savedAt: r.updatedAt });
    } catch (e) {
      return fail(e.message);
    }
  }
);

// --- AI tools (products) convenience ---------------------------------------
server.registerTool(
  'list_products',
  {
    title: 'List AI tools & pricing config',
    description: 'Summarise the paid AI tools: which are enabled, their plan-price overrides, and the free-trial count.',
    inputSchema: {},
  },
  async () => {
    try {
      const content = await client.getContent();
      const cfg = content?.AI_TOOLS_CONFIG || {};
      const tools = cfg.tools || {};
      return ok({
        enabled: cfg.enabled !== false,
        freeTrialCount: cfg.freeTrialCount ?? 3,
        socialProof: cfg.socialProof || '',
        urgency: cfg.urgency || '',
        tools: Object.entries(tools).map(([id, t]) => ({ id, enabled: t?.enabled !== false, planPrices: t?.planPrices || {} })),
      });
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.registerTool(
  'set_tool_enabled',
  {
    title: 'Show/hide an AI tool',
    description: 'Enable or disable a paid AI tool on the products page.',
    inputSchema: {
      toolId: z.enum(['business-therapist', 'growth-path', 'problem-solver', 'mock-customer']),
      enabled: z.boolean(),
    },
  },
  async ({ toolId, enabled }) => {
    try {
      const content = await client.getContent();
      setByPath(content, `AI_TOOLS_CONFIG.tools.${toolId}.enabled`, enabled);
      const r = await client.putContent(content);
      return ok({ ok: true, toolId, enabled, savedAt: r.updatedAt });
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.registerTool(
  'set_plan_price',
  {
    title: 'Override a plan price',
    description: 'Override the displayed price label of one plan of one tool (e.g. toolId="business-therapist", planId="pro", price="۱٬۴۹۰٬۰۰۰ تومان").',
    inputSchema: {
      toolId: z.enum(['business-therapist', 'growth-path', 'problem-solver', 'mock-customer']),
      planId: z.enum(['basic', 'pro', 'vip']),
      price: z.string().describe('Price label to display (Persian). Empty string clears the override.'),
    },
  },
  async ({ toolId, planId, price }) => {
    try {
      const content = await client.getContent();
      setByPath(content, `AI_TOOLS_CONFIG.tools.${toolId}.planPrices.${planId}`, price);
      const r = await client.putContent(content);
      return ok({ ok: true, toolId, planId, price, savedAt: r.updatedAt });
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.registerTool(
  'set_free_trial',
  {
    title: 'Set free-trial message count',
    description: 'Set how many free trial messages each device gets per tool (0 = fully locked, no trial).',
    inputSchema: { count: z.number().int().min(0).max(100) },
  },
  async ({ count }) => {
    try {
      const content = await client.getContent();
      setByPath(content, 'AI_TOOLS_CONFIG.freeTrialCount', count);
      const r = await client.putContent(content);
      return ok({ ok: true, freeTrialCount: count, savedAt: r.updatedAt });
    } catch (e) {
      return fail(e.message);
    }
  }
);

// --- tool-access grants -----------------------------------------------------
server.registerTool(
  'list_grants',
  {
    title: 'List access grants',
    description: 'List all paid-tool access grants (phone, tool, code, status, quota, devices, expiry).',
    inputSchema: {},
  },
  async () => {
    try {
      return ok(await client.listGrants());
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.registerTool(
  'grant_access',
  {
    title: 'Grant tool access',
    description: 'Grant (or refresh) access for a phone number. Provide a planId to auto-fill duration/quota/devices from the plan, or set them explicitly. Returns the access code to send to the buyer.',
    inputSchema: {
      phone: z.string().describe('Iranian mobile, e.g. 09xxxxxxxxx'),
      productId: z.string().default('all').describe('Tool id, or "all" for a full subscription.'),
      planId: z.enum(['basic', 'pro', 'vip']).optional(),
      days: z.number().int().positive().optional(),
      maxDevices: z.number().int().positive().optional(),
      messageQuota: z.number().int().min(0).optional().describe('0 = unlimited'),
      note: z.string().optional(),
      newCode: z.boolean().optional().describe('Force a new access code when refreshing.'),
    },
  },
  async (args) => {
    try {
      const r = await client.grant(args);
      return ok(r);
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.registerTool(
  'revoke_access',
  {
    title: 'Revoke access',
    description: 'Revoke a grant by its id (get ids from list_grants).',
    inputSchema: { id: z.string() },
  },
  async ({ id }) => {
    try {
      await client.revoke(id);
      return ok({ ok: true, revoked: id });
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.registerTool(
  'reset_devices',
  {
    title: 'Reset bound devices',
    description: 'Clear the bound devices of a grant so the buyer can re-activate on a new device.',
    inputSchema: { id: z.string() },
  },
  async ({ id }) => {
    try {
      await client.resetDevices(id);
      return ok({ ok: true, resetDevices: id });
    } catch (e) {
      return fail(e.message);
    }
  }
);

server.registerTool(
  'list_tool_usage',
  {
    title: 'Recent AI-tool usage',
    description: 'Show the most recent AI-tool messages (monitoring): phone/device, tool, question, answer, time.',
    inputSchema: { limit: z.number().int().min(1).max(200).default(30) },
  },
  async ({ limit }) => {
    try {
      const items = await client.listToolMessages();
      return ok(items.slice(0, limit));
    } catch (e) {
      return fail(e.message);
    }
  }
);

// --- boot -------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr (stdout is reserved for the MCP protocol).
  console.error(`[omidadli-site-mcp] ready — target: ${client.baseUrl}`);
}

main().catch((e) => {
  console.error('[omidadli-site-mcp] fatal:', e);
  process.exit(1);
});
