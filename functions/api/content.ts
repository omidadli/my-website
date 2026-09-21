import { Env, requireAuth, json, unauthorized, MAX_CONTENT_BYTES } from './_shared';

/**
 * GET /api/content  → public read of the whole content state (cached 30s at edge).
 * PUT /api/content  → admin-only full save ({ data: ContentState }).
 */
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const row = await env.DB.prepare(`SELECT data, updated_at FROM content WHERE id = 1`).first<{ data: string; updated_at: string }>();
    if (!row) {
      return json({ ok: true, data: null, updatedAt: null }, { headers: { 'Cache-Control': 'public, max-age=30' } });
    }
    return new Response(JSON.stringify({ ok: true, data: JSON.parse(row.data), updatedAt: row.updated_at }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (e) {
    return json({ ok: false, error: 'خطا در خواندن محتوا از دیتابیس.' }, { status: 500 });
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAuth(request, env);
  if (!user) return unauthorized();

  const raw = await request.text();
  if (raw.length > MAX_CONTENT_BYTES) {
    return json({ ok: false, error: 'حجم محتوا بیش از حد مجاز (۵ مگابایت) است.' }, { status: 413 });
  }
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'JSON نامعتبر است.' }, { status: 400 });
  }
  const data = payload?.data;
  if (!data || typeof data !== 'object') {
    return json({ ok: false, error: 'ساختار داده نامعتبر است.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO content (id, data, updated_at) VALUES (1, ?1, ?2)
     ON CONFLICT(id) DO UPDATE SET data = ?1, updated_at = ?2`
  ).bind(JSON.stringify(data), now).run();

  return json({ ok: true, updatedAt: now });
};
