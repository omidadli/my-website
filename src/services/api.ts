/**
 * CMS API client — talks to the Cloudflare Pages Functions in /functions/api.
 *
 * Graceful degradation:
 *  - If the API is not deployed (local dev without wrangler), `probe()` returns false
 *    and the app falls back to localStorage-only mode.
 *  - Auth token is kept in localStorage and sent as `Authorization: Bearer …`.
 */

const TOKEN_KEY = 'nd_admin_token';

let cloudAvailable: boolean | null = null;

export interface CloudMediaItem {
  id: string;
  key: string;
  url: string;
  title: string;
  alt: string;
  sizeKb?: number;
  contentType?: string;
  createdAt: string;
}

const headers = (auth = true): Record<string, string> => {
  const h: Record<string, string> = {};
  if (auth) {
    const t = getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
};

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token?: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

/** True when the Cloudflare Functions API responds on /api/content. */
export const probe = async (): Promise<boolean> => {
  if (cloudAvailable !== null) return cloudAvailable;
  try {
    const r = await fetch('/api/content', { method: 'GET', cache: 'no-store' });
    // Any real API response (200/401/500) means functions exist; a Vite/SPA 404 HTML page means they don't.
    const ct = r.headers.get('Content-Type') || '';
    cloudAvailable = ct.includes('application/json');
  } catch {
    cloudAvailable = false;
  }
  return cloudAvailable;
};

export const api = {
  probe,
  getToken,
  setToken,

  async getContent(): Promise<{ data: any; updatedAt: string | null } | null> {
    try {
      const r = await fetch('/api/content', { cache: 'no-store' });
      if (!r.ok) return null;
      const j = await r.json();
      return j?.ok ? { data: j.data, updatedAt: j.updatedAt } : null;
    } catch {
      return null;
    }
  },

  async saveContent(data: any): Promise<{ ok: boolean; error?: string }> {
    try {
      const r = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ data }),
      });
      const j = await r.json().catch(() => ({}));
      return r.ok && j?.ok ? { ok: true } : { ok: false, error: j?.error || `خطای سرور (${r.status})` };
    } catch {
      return { ok: false, error: 'اتصال به سرور برقرار نشد.' };
    }
  },

  async login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j?.ok && j.token) {
        setToken(j.token);
        return { ok: true };
      }
      return { ok: false, error: j?.error || 'ورود ناموفق بود.' };
    } catch {
      return { ok: false, error: 'اتصال به سرور برقرار نشد.' };
    }
  },

  async verify(): Promise<boolean> {
    if (!getToken()) return false;
    try {
      const r = await fetch('/api/auth', { headers: headers() });
      if (r.ok) {
        const j = await r.json().catch(() => ({}));
        return !!j?.ok;
      }
      if (r.status === 401) setToken(null);
      return false;
    } catch {
      return false;
    }
  },

  logout() {
    setToken(null);
  },

  async listMedia(): Promise<CloudMediaItem[] | null> {
    try {
      const r = await fetch('/api/media', { cache: 'no-store' });
      if (!r.ok) return null;
      const j = await r.json();
      return j?.ok ? j.items : null;
    } catch {
      return null;
    }
  },

  async uploadMedia(file: File, title?: string, alt?: string): Promise<CloudMediaItem | null> {
    try {
      const form = new FormData();
      form.append('file', file);
      if (title) form.append('title', title);
      if (alt) form.append('alt', alt);
      const r = await fetch('/api/media', { method: 'POST', headers: headers(), body: form });
      const j = await r.json().catch(() => ({}));
      return r.ok && j?.ok ? j.item : null;
    } catch {
      return null;
    }
  },

  async deleteMedia(key: string): Promise<boolean> {
    try {
      const r = await fetch(`/api/media?key=${encodeURIComponent(key)}`, { method: 'DELETE', headers: headers() });
      return r.ok;
    } catch {
      return false;
    }
  },

  /** English slug for a Persian title — Gemini translation on the server, transliteration fallback. */
  async makeSlug(title: string): Promise<string | null> {
    try {
      const r = await fetch('/api/slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ title }),
      });
      const j = await r.json().catch(() => ({}));
      return r.ok && j?.ok ? String(j.slug) : null;
    } catch {
      return null;
    }
  },
};
