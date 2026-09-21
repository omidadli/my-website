import { Env, requireAuth, json, unauthorized, MAX_UPLOAD_BYTES, ALLOWED_MEDIA_TYPES } from './_shared';

const sanitizeName = (name: string): string =>
  (name || 'file')
    .replace(/\.[^.]+$/, '') // strip extension
    .replace(/\u200c/g, '-')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'file';

/**
 * GET    /api/media        → public list of media library items.
 * POST   /api/media        → admin upload (multipart: file, title?, alt?) → stored in R2 + indexed in D1.
 * DELETE /api/media?key=…  → admin delete (removes from R2 + D1).
 */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const rows = await env.DB.prepare(
      `SELECT key, url, title, alt, size_kb, content_type, created_at FROM media ORDER BY created_at DESC LIMIT 500`
    ).all();
    const items = (rows.results || []).map((r: any) => ({
      id: r.key,
      key: r.key,
      url: r.url,
      title: r.title,
      alt: r.alt || '',
      sizeKb: r.size_kb,
      contentType: r.content_type,
      createdAt: r.created_at,
    }));
    return new Response(JSON.stringify({ ok: true, items }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30' },
    });
  } catch {
    return json({ ok: false, error: 'خطا در خواندن کتابخانه رسانه.' }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAuth(request, env);
  if (!user) return unauthorized();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'درخواست آپلود نامعتبر است.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return json({ ok: false, error: 'فایلی ارسال نشده است.' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return json({ ok: false, error: 'حجم فایل بیش از ۱۰ مگابایت است.' }, { status: 413 });
  }
  if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
    return json({ ok: false, error: `نوع فایل (${file.type || 'نامشخص'}) مجاز نیست. فقط تصاویر و PDF.` }, { status: 415 });
  }

  const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const title = String(form.get('title') || file.name);
  const alt = String(form.get('alt') || '');
  const now = new Date().toISOString();
  const sizeKb = Math.round(file.size / 1024);

  if (env.MEDIA) {
    // Preferred: Cloudflare R2 (when activated).
    const ext = (file.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
    const key = `uploads/${new Date().toISOString().slice(0, 7)}/${rand}-${sanitizeName(file.name)}${ext}`;
    await env.MEDIA.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { title, alt },
    });
    const url = `/api/media/file/${key}`;
    await env.DB.prepare(
      `INSERT INTO media (key, url, title, alt, size_kb, content_type, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    ).bind(key, url, title, alt, sizeKb, file.type, now).run();
    return json({ ok: true, item: { id: key, key, url, title, alt, sizeKb, contentType: file.type, createdAt: now } });
  }

  // Free fallback (no card needed): store the compressed file inside D1 itself.
  const MAX_D1_BYTES = 1_400_000; // ~1.4MB binary → ~1.9MB base64, safe for D1 rows
  if (file.size > MAX_D1_BYTES) {
    return json({ ok: false, error: 'بدون R2، حجم هر فایل حداکثر ۱.۴ مگابایت است (تصاویر به‌صورت خودکار فشرده می‌شوند؛ اگر این پیام را می‌بینید فایل بزرگ‌تر از حد فشرده‌سازی است).' }, { status: 413 });
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    bin += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  const b64 = btoa(bin);
  const key = `d1-${Date.now()}-${rand}`;
  const url = `/api/media/file/${key}`;
  await env.DB.prepare(
    `INSERT INTO media_files (id, name, content_type, size_kb, data_b64, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
  ).bind(key, title, file.type, sizeKb, b64, now).run();
  await env.DB.prepare(
    `INSERT INTO media (key, url, title, alt, size_kb, content_type, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
  ).bind(key, url, title, alt, sizeKb, file.type, now).run();
  return json({ ok: true, item: { id: key, key, url, title, alt, sizeKb, contentType: file.type, createdAt: now } });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAuth(request, env);
  if (!user) return unauthorized();

  const key = new URL(request.url).searchParams.get('key');
  if (!key || !(key.startsWith('uploads/') || key.startsWith('d1-'))) {
    return json({ ok: false, error: 'کلید فایل نامعتبر است.' }, { status: 400 });
  }
  if (key.startsWith('d1-')) {
    await env.DB.prepare(`DELETE FROM media_files WHERE id = ?1`).bind(key).run();
  } else if (env.MEDIA) {
    await env.MEDIA.delete(key);
  }
  await env.DB.prepare(`DELETE FROM media WHERE key = ?1`).bind(key).run();
  return json({ ok: true });
};
