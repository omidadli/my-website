import { Env, json } from '../../_shared';

/** GET /api/media/file/<key…> — streams a file from R2 (public read, write stays admin-only). */
export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const parts = Array.isArray(params.key) ? params.key : [params.key];
  const key = parts.map(decodeURIComponent).join('/');
  if (!key || key.includes('..') || !(key.startsWith('uploads/') || key.startsWith('d1-'))) {
    return json({ ok: false, error: 'کلید نامعتبر است.' }, { status: 400 });
  }

  // D1-stored file (free fallback when R2 is not activated)
  if (key.startsWith('d1-')) {
    const row = await env.DB.prepare(`SELECT name, content_type, data_b64 FROM media_files WHERE id = ?1`).bind(key).first<{ name: string; content_type: string; data_b64: string }>();
    if (!row) return json({ ok: false, error: 'فایل یافت نشد.' }, { status: 404 });
    const binStr = atob(row.data_b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    const headers = new Headers({
      'Content-Type': row.content_type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    if ((row.content_type || '').includes('svg')) {
      headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
    }
    return new Response(bytes, { headers, status: 200 });
  }

  if (!env.MEDIA) {
    return json({ ok: false, error: 'فضای ذخیره‌سازی R2 فعال نیست.' }, { status: 503 });
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
