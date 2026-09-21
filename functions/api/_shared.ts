/* Shared helpers for the CMS API (Cloudflare Pages Functions).
 * Security model:
 *  - Admin credentials live ONLY in Cloudflare secrets (ADMIN_USERNAME / ADMIN_PASSWORD) — never in the repo.
 *  - Sessions are stateless HMAC-SHA256 signed tokens (AUTH_SECRET) with expiry.
 *  - Login is rate-limited per IP via the D1 `login_attempts` table.
 *  - Mutating endpoints require `Authorization: Bearer <token>`.
 */

export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  AUTH_SECRET: string;
  GEMINI_API_KEY?: string;
}

export interface Ctx {
  env: Env;
  request: Request;
}

const encoder = new TextEncoder();

export const b64url = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const b64urlDecode = (s: string): string => {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  return atob(padded);
};

const getHmacKey = async (secret: string) =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export const createToken = async (username: string, secret: string, ttlMs = 7 * 24 * 60 * 60 * 1000): Promise<{ token: string; expiresAt: number }> => {
  const exp = Date.now() + ttlMs;
  const payload = b64url(encoder.encode(JSON.stringify({ sub: username, exp })));
  const key = await getHmacKey(secret);
  const sig = b64url(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
  return { token: `${payload}.${sig}`, expiresAt: exp };
};

export const verifyToken = async (token: string | null, secret: string): Promise<string | null> => {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  try {
    const key = await getHmacKey(secret);
    const ok = await crypto.subtle.verify('HMAC', key, Uint8Array.from(b64urlDecode(sig), (c) => c.charCodeAt(0)), encoder.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(b64urlDecode(payload));
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return String(data.sub || '');
  } catch {
    return null;
  }
};

export const getBearer = (request: Request): string | null => {
  const h = request.headers.get('Authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
};

export const requireAuth = async (request: Request, env: Env): Promise<string | null> => {
  if (!env.AUTH_SECRET) return null;
  return verifyToken(getBearer(request), env.AUTH_SECRET);
};

/** Constant-time-ish string comparison (compare HMAC digests to avoid leaking length/char timing). */
export const safeEqual = async (a: string, b: string, secret: string): Promise<boolean> => {
  const key = await getHmacKey(secret || 'fallback-compare-key');
  const [ha, hb] = await Promise.all([
    crypto.subtle.sign('HMAC', key, encoder.encode(a)),
    crypto.subtle.sign('HMAC', key, encoder.encode(b)),
  ]);
  const ua = new Uint8Array(ha);
  const ub = new Uint8Array(hb);
  if (ua.length !== ub.length) return false;
  let diff = 0;
  for (let i = 0; i < ua.length; i++) diff |= ua[i] ^ ub[i];
  return diff === 0;
};

export const json = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...(init.headers || {}),
    },
  });

export const unauthorized = (msg = 'احراز هویت ناموفق است.') => json({ ok: false, error: msg }, { status: 401 });

export const getClientIp = (request: Request): string =>
  request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

export const MAX_CONTENT_BYTES = 5 * 1024 * 1024; // 5MB for content JSON
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB per media file
export const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif', 'application/pdf'];
