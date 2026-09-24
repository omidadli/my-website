/**
 * site-client.mjs — a tiny, dependency-free client for the site's admin API.
 *
 * Shared by scripts/sync-content.mjs and the MCP server (mcp/server.mjs).
 * Auth model: POST /api/auth { username, password } → { token }; the token is
 * then sent as `Authorization: Bearer <token>` on every admin call.
 *
 * Configure via environment variables:
 *   SITE_URL        base URL of the live site   (e.g. https://my-website.pages.dev)
 *   ADMIN_USERNAME  admin username              (same as the Cloudflare secret)
 *   ADMIN_PASSWORD  admin password              (same as the Cloudflare secret)
 */

export class SiteClient {
  constructor({ baseUrl, username, password } = {}) {
    this.baseUrl = (baseUrl || process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
    this.username = username || process.env.ADMIN_USERNAME || '';
    this.password = password || process.env.ADMIN_PASSWORD || '';
    this._token = null;
  }

  async _req(path, { method = 'GET', body, auth = true } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      if (!this._token) await this.login();
      headers.Authorization = `Bearer ${this._token}`;
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!res.ok || data?.ok === false) {
      throw new Error(`${method} ${path} → ${res.status}: ${data?.error || text || 'request failed'}`);
    }
    return data;
  }

  /** Authenticate and cache the bearer token. */
  async login() {
    if (!this.username || !this.password) {
      throw new Error('Missing ADMIN_USERNAME / ADMIN_PASSWORD (set them as env vars).');
    }
    const data = await this._req('/api/auth', {
      method: 'POST',
      auth: false,
      body: { username: this.username, password: this.password },
    });
    if (!data?.token) throw new Error('Login succeeded but no token was returned.');
    this._token = data.token;
    return this._token;
  }

  /** Read the entire content state (the CMS blob). */
  async getContent() {
    const data = await this._req('/api/content', { method: 'GET' });
    return data.data; // { ...ContentState }
  }

  /** Overwrite the entire content state. `content` is the ContentState object. */
  async putContent(content) {
    return this._req('/api/content', { method: 'PUT', body: { data: content } });
  }

  // --- Paid AI tools (محصولات هوشمند) -------------------------------------
  async listGrants() {
    const data = await this._req('/api/tools', { method: 'GET' });
    return data.items || [];
  }
  async listToolMessages() {
    const data = await this._req('/api/tools?view=messages', { method: 'GET' });
    return data.items || [];
  }
  async grant({ phone, productId = 'all', planId, days, maxDevices, messageQuota, note, newCode }) {
    return this._req('/api/tools', {
      method: 'POST',
      body: { action: 'grant', phone, productId, planId, days, maxDevices, messageQuota, note, newCode },
    });
  }
  async revoke(id) {
    return this._req('/api/tools', { method: 'POST', body: { action: 'revoke', id } });
  }
  async resetDevices(id) {
    return this._req('/api/tools', { method: 'POST', body: { action: 'resetDevices', id } });
  }
}

/**
 * Set a value at a dot-path inside an object, creating intermediate objects.
 * Handles hyphenated keys (e.g. AI_TOOLS_CONFIG.tools.business-therapist.enabled).
 * Numeric segments create/index arrays.
 */
export function setByPath(root, path, value) {
  const parts = String(path).split('.').filter(Boolean);
  let node = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextIsIndex = /^\d+$/.test(parts[i + 1]);
    if (node[key] === undefined || node[key] === null || typeof node[key] !== 'object') {
      node[key] = nextIsIndex ? [] : {};
    }
    node = node[key];
  }
  node[parts[parts.length - 1]] = value;
  return root;
}

/** Read a value at a dot-path (undefined if any segment is missing). */
export function getByPath(root, path) {
  return String(path).split('.').filter(Boolean).reduce((n, k) => (n == null ? undefined : n[k]), root);
}
