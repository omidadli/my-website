import { Env, requireAuth, json, unauthorized, getClientIp } from './_shared';

/**
 * Public comment endpoints (WordPress-style: visitors submit, admin moderates).
 *
 * GET    /api/comments          → public: approved comments (emails stripped). With admin token: all.
 * POST   /api/comments          → public submit { postId, authorName, authorEmail, content } (rate-limited, held for moderation).
 * PATCH  /api/comments          → admin: { id, isApproved?, reply? }
 * DELETE /api/comments?id=…     → admin.
 */

const rowToComment = (r: any, stripEmail: boolean) => ({
  id: r.id,
  postId: r.post_id,
  authorName: r.author_name,
  authorEmail: stripEmail ? '' : r.author_email,
  content: r.content,
  date: r.date,
  isApproved: !!r.is_approved,
  reply: r.reply || '',
});

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await requireAuth(request, env);
  try {
    if (admin) {
      const rows = await env.DB.prepare(`SELECT * FROM comments ORDER BY date DESC LIMIT 1000`).all();
      return json({ ok: true, items: (rows.results || []).map((r) => rowToComment(r, false)) });
    }
    const rows = await env.DB.prepare(`SELECT * FROM comments WHERE is_approved = 1 ORDER BY date DESC LIMIT 1000`).all();
    return new Response(JSON.stringify({ ok: true, items: (rows.results || []).map((r) => rowToComment(r, true)) }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30' },
    });
  } catch {
    return json({ ok: false, error: 'خطا در خواندن دیدگاه‌ها.' }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ip = getClientIp(request);

  // Rate limit: max 5 comments per IP per hour.
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const row = await env.DB.prepare(`SELECT COUNT(*) AS c FROM comments WHERE ip = ?1 AND date > ?2`).bind(ip, since).first<{ c: number }>();
    if ((row?.c || 0) >= 5) {
      return json({ ok: false, error: 'تعداد دیدگاه‌های ارسالی شما در یک ساعت اخیر بیش از حد مجاز است. لطفاً بعداً دوباره تلاش کنید.' }, { status: 429 });
    }
  } catch {
    /* table missing — fall through, insert will fail loudly instead */
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const postId = String(body?.postId || '').trim();
  const authorName = String(body?.authorName || '').trim().slice(0, 80);
  const authorEmail = String(body?.authorEmail || '').trim().slice(0, 160);
  const content = String(body?.content || '').trim().slice(0, 3000);
  const honeypot = String(body?.website || ''); // bots fill hidden fields; humans never do

  if (honeypot) return json({ ok: true, id: 'ignored' }); // silently swallow spam
  if (!postId || !authorName || !authorEmail || content.length < 3) {
    return json({ ok: false, error: 'لطفاً تمام فیلدهای نام، ایمیل و متن دیدگاه را تکمیل کنید.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    return json({ ok: false, error: 'آدرس ایمیل معتبر نیست.' }, { status: 400 });
  }

  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4))).map((b) => b.toString(16).padStart(2, '0')).join('');
  const id = `c-${Date.now()}-${rand}`;
  const date = new Date().toLocaleString('fa-IR');

  await env.DB.prepare(
    `INSERT INTO comments (id, post_id, author_name, author_email, content, date, is_approved, reply, ip)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, '', ?7)`
  ).bind(id, postId, authorName, authorEmail, content, date, ip).run();

  return json({ ok: true, id });
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAuth(request, env);
  if (!user) return unauthorized();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
  const id = String(body?.id || '');
  if (!id.startsWith('c-')) return json({ ok: false, error: 'شناسه دیدگاه نامعتبر است.' }, { status: 400 });

  if (typeof body?.isApproved === 'boolean') {
    await env.DB.prepare(`UPDATE comments SET is_approved = ?1 WHERE id = ?2`).bind(body.isApproved ? 1 : 0, id).run();
  }
  if (typeof body?.reply === 'string') {
    await env.DB.prepare(`UPDATE comments SET reply = ?1 WHERE id = ?2`).bind(body.reply.slice(0, 3000), id).run();
  }
  return json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAuth(request, env);
  if (!user) return unauthorized();
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!id.startsWith('c-')) return json({ ok: false, error: 'شناسه دیدگاه نامعتبر است.' }, { status: 400 });
  await env.DB.prepare(`DELETE FROM comments WHERE id = ?1`).bind(id).run();
  return json({ ok: true });
};
