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
  if (!env.MEDIA) {
    return json({ ok: false, error: 'فضای ذخیره‌سازی R2 هنوز فعال نشده است. ابتدا R2 را در داشبورد Cloudflare فعال کرده و binding را اضافه کنید (راهنما: CMS-DEPLOY.md).' }, { status: 503 });
  }

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
  const ext = (file.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
  const key = `uploads/${new Date().toISOString().slice(0, 7)}/${rand}-${sanitizeName(file.name)}${ext}`;

  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { title: String(form.get('title') || file.name), alt: String(form.get('alt') || '') },
  });

  const url = `/api/media/file/${key}`;
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO media (key, url, title, alt, size_kb, content_type, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
  ).bind(key, url, String(form.get('title') || file.name), String(form.get('alt') || ''), Math.round(file.size / 1024), file.type, now).run();

  return json({
    ok: true,
    item: { id: key, key, url, title: String(form.get('title') || file.name), alt: String(form.get('alt') || ''), sizeKb: Math.round(file.size / 1024), contentType: file.type, createdAt: now },
  });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAuth(request, env);
  if (!user) return unauthorized();
  if (!env.MEDIA) {
    return json({ ok: false, error: 'فضای ذخیره‌سازی R2 فعال نیست.' }, { status: 503 });
  }

  const key = new URL(request.url).searchParams.get('key');
  if (!key || !key.startsWith('uploads/')) {
    return json({ ok: false, error: 'کلید فایل نامعتبر است.' }, { status: 400 });
  }
  await env.MEDIA.delete(key);
  await env.DB.prepare(`DELETE FROM media WHERE key = ?1`).bind(key).run();
  return json({ ok: true });
};
