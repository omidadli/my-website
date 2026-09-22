/**
 * CMS API client — talks to the Cloudflare Pages Functions in /functions/api.
 *
 * Graceful degradation:
 *  - If the API is not deployed (local dev without wrangler), `probe()` returns false
 *    and the app falls back to localStorage-only mode.
 *  - Auth token is kept in localStorage and sent as `Authorization: Bearer …`.
 */

import { compressImage } from '../utils/image';

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
      // Compress images client-side (fits the free D1 storage path + faster site).
      const prepared = await compressImage(file);
      const form = new FormData();
      form.append('file', prepared);
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

  /** Public comment submission (held for moderation server-side). */
  async postComment(comment: { postId: string; authorName: string; authorEmail: string; content: string }): Promise<{ ok: boolean; error?: string }> {
    try {
      const r = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comment),
      });
      const j = await r.json().catch(() => ({}));
      return r.ok && j?.ok ? { ok: true } : { ok: false, error: j?.error || `خطای سرور (${r.status})` };
    } catch {
      return { ok: false, error: 'اتصال به سرور برقرار نشد.' };
    }
  },

  /** Admin moderation of cloud comments. */
  async patchComment(id: string, patch: { isApproved?: boolean; reply?: string }): Promise<boolean> {
    try {
      const r = await fetch('/api/comments', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...headers() }, body: JSON.stringify({ id, ...patch }) });
      return r.ok;
    } catch {
      return false;
    }
  },

  async deleteComment(id: string): Promise<boolean> {
    try {
      const r = await fetch(`/api/comments?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: headers() });
      return r.ok;
    } catch {
      return false;
    }
  },

  /**
   * AI consultant conversation.
   *
   * The endpoint answers with a single JSON document today, but the client is
   * stream-ready: if the server replies `text/event-stream` (SSE) or
   * newline-delimited JSON, the partial text is handed to `onDelta` as it
   * arrives while keeping the exact same resolve contract. The mascot
   * controller consumes those deltas *throttled*, so a token storm can never
   * thrash the animation.
   */
  async sendChat(
    messages: { role: 'user' | 'model'; content: string }[],
    mascotContext?: { name?: string; page?: string; daypart?: string; bodyState?: string },
    opts?: { signal?: AbortSignal; onDelta?: (partialText: string) => void }
  ): Promise<{ ok: boolean; answer?: string; act?: { pose?: string; hold?: number; bubble?: string; then?: string }; mode?: 'ai' | 'local'; error?: string }> {
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
        body: JSON.stringify({ messages, mascot: mascotContext }),
        signal: opts?.signal,
      });

      const ctype = r.headers.get('Content-Type') || '';
      if (r.ok && r.body && (ctype.includes('text/event-stream') || ctype.includes('application/x-ndjson'))) {
        return await readStreamedAnswer(r, opts?.onDelta);
      }

      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) return { ok: false, error: j?.error || `خطای سرور (${r.status})` };
      const answer = String(j.answer || '');
      opts?.onDelta?.(answer);
      return { ok: true, answer, act: j.act, mode: j.mode };
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return { ok: false, error: 'درخواست لغو شد.' };
      return { ok: false, error: 'اتصال به سرور برقرار نشد.' };
    }
  },

  /** Admin: conversation history (behavior monitoring). */
  async listChats(): Promise<{ id: string; question: string; answer: string; mode: string; created_at: string; ip: string }[]> {
    try {
      const r = await fetch('/api/chat', { headers: headers() });
      if (!r.ok) return [];
      const j = await r.json();
      return j?.ok ? j.items : [];
    } catch {
      return [];
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

/**
 * Consume an SSE / NDJSON AI answer.
 *
 * Accepted chunk shapes: `data: {"delta":"…"}`, `data: {"text":"…"}`,
 * `data: {"answer":"…"}` and a bare `data: …` string. A final
 * `data: {"done":true, "answer": "…"}` (or `[DONE]`) closes the stream.
 * Anything unparseable is ignored rather than thrown — a malformed chunk must
 * never take the chat down.
 */
export async function readStreamedAnswer(
  r: Response,
  onDelta?: (partialText: string) => void
): Promise<{ ok: boolean; answer?: string; act?: Record<string, unknown>; mode?: 'ai' | 'local'; error?: string }> {
  const reader = r.body?.getReader();
  if (!reader) return { ok: false, error: 'پاسخ جریانی قابل خواندن نبود.' };
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let act: Record<string, unknown> | undefined;
  let mode: 'ai' | 'local' | undefined;
  let done = false;

  const handle = (payload: string) => {
    const payloadTrimmed = payload.trim();
    if (!payloadTrimmed || payloadTrimmed === '[DONE]') {
      if (payloadTrimmed === '[DONE]') done = true;
      return;
    }
    try {
      const j = JSON.parse(payloadTrimmed) as Record<string, unknown>;
      const chunk = typeof j.delta === 'string' ? j.delta : typeof j.text === 'string' ? j.text : typeof j.answer === 'string' ? j.answer : '';
      if (chunk) {
        text += chunk;
        onDelta?.(text);
      }
      if (j.act && typeof j.act === 'object') act = j.act as Record<string, unknown>;
      if (j.mode === 'ai' || j.mode === 'local') mode = j.mode;
      if (j.done === true) done = true;
      if (j.error) throw new Error(String(j.error));
    } catch (err) {
      if ((err as Error)?.message && !(err instanceof SyntaxError)) throw err;
      /* not JSON → treat as a raw text chunk */
      text += payloadTrimmed;
      onDelta?.(text);
    }
  };

  try {
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });
      let nl = buffer.indexOf('\n');
      while (nl !== -1) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        handle(line.startsWith('data:') ? line.slice(5) : line);
        nl = buffer.indexOf('\n');
      }
    }
    if (buffer.trim()) handle(buffer.trim());
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return { ok: false, error: 'درخواست لغو شد.' };
    return { ok: false, error: (e as Error)?.message || 'خواندن پاسخ ناموفق بود.' };
  }

  if (!text) return { ok: false, error: 'پاسخی دریافت نشد؛ دوباره تلاش کنید.' };
  return { ok: true, answer: text, act, mode };
}
