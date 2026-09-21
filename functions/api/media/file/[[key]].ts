import { Env, json } from '../../_shared';

/** GET /api/media/file/<key…> — streams a file from R2 (public read, write stays admin-only). */
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!env.MEDIA) {
    return json({ ok: false, error: 'فضای ذخیره‌سازی R2 فعال نیست.' }, { status: 503 });
  }
  const parts = Array.isArray(params.key) ? params.key : [params.key];
  const key = parts.map(decodeURIComponent).join('/');
  if (!key || !key.startsWith('uploads/') || key.includes('..')) {
    return json({ ok: false, error: 'کلید نامعتبر است.' }, { status: 400 });
  }

  const object = await env.MEDIA.get(key);
  if (!object) {
    return json({ ok: false, error: 'فایل یافت نشد.' }, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/octet-stream');
  }
  // SVGs can carry scripts — force download-ish rendering protection:
  if ((object.httpMetadata?.contentType || '').includes('svg')) {
    headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
    headers.set('X-Content-Type-Options', 'nosniff');
  }

  if (request.headers.get('If-None-Match') === object.httpEtag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(object.body, { headers, status: 200 });
};
