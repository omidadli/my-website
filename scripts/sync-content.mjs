#!/usr/bin/env node
/**
 * sync-content.mjs — round-trip the site content between Git and the live site.
 *
 *   node scripts/sync-content.mjs export   # live site  → content/site-content.json
 *   node scripts/sync-content.mjs import   # content/site-content.json → live site
 *
 * `import` is what CI runs on push so that any change committed to
 * content/site-content.json lands on the live site automatically.
 * `export` pulls the current live content back into the repo (run it after
 * editing via the admin panel or the MCP so Git stays the source of truth).
 *
 * Env: SITE_URL, ADMIN_USERNAME, ADMIN_PASSWORD  (see scripts/site-client.mjs)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SiteClient } from './site-client.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_FILE = resolve(__dirname, '../content/site-content.json');

const mode = (process.argv[2] || '').toLowerCase();
const client = new SiteClient();

const log = (...a) => console.log('[sync-content]', ...a);

async function doExport() {
  log(`fetching content from ${client.baseUrl} …`);
  const content = await client.getContent();
  if (!content) throw new Error('The live site returned empty content.');
  // Comments are canonical in their own table — do not freeze them into Git.
  if (Array.isArray(content.BLOG_COMMENTS)) delete content.BLOG_COMMENTS;
  mkdirSync(dirname(CONTENT_FILE), { recursive: true });
  writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2) + '\n', 'utf8');
  log(`wrote ${CONTENT_FILE}`);
}

async function doImport() {
  log(`reading ${CONTENT_FILE} …`);
  let content;
  try {
    content = JSON.parse(readFileSync(CONTENT_FILE, 'utf8'));
  } catch (e) {
    throw new Error(`Cannot read/parse ${CONTENT_FILE}: ${e.message}`);
  }
  if (!content || typeof content !== 'object') throw new Error('content file is not a JSON object.');
  log(`pushing content to ${client.baseUrl} …`);
  const r = await client.putContent(content);
  log(`done. updatedAt=${r.updatedAt || '?'}`);
}

(async () => {
  try {
    if (mode === 'export') await doExport();
    else if (mode === 'import') await doImport();
    else {
      console.error('Usage: node scripts/sync-content.mjs <export|import>');
      process.exit(2);
    }
  } catch (e) {
    console.error('[sync-content] ERROR:', e.message);
    process.exit(1);
  }
})();
