import { Env, requireAuth, json, unauthorized, getClientIp, ensureCoreTablesSafe } from './_shared';

/**
 * Lead capture — the site's conversion data must never be lost.
 *
 * POST /api/leads  → public (contact form + booking calendar), rate-limited
 *                    to 10 leads/hour/IP, honeypot field `homepage`.
 * GET  /api/leads  → admin only; newest 200 leads for the admin panel.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAuth(request, env);
  if (!user) return unauthorized();
  try {
    const rows = await env.DB.prepare(
      `SELECT id, source, name, email, contact, website, goal, service, details, booking_date, booking_time, created_at, ip
       FROM leads ORDER BY created_at DESC LIMIT 200`
    ).all();
    return json({ ok: true, items: rows.results || [] });
  } catch {
    /* table not migrated yet */
    return json({ ok: true, items: [] });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ip = getClientIp(request);
  await ensureCoreTablesSafe(env);

  // Rate limit: max 10 leads per IP per hour.
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const row = await env.DB.prepare(`SELECT COUNT(*) AS c FROM leads WHERE ip = ?1 AND created_at > ?2`).bind(ip, since).first<{ c: number }>();
    if ((row?.c || 0) >= 10) {
      return json({ ok: false, error: 'تعداد درخواست‌های شما در یک ساعت اخیر بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.' }, { status: 429 });
    }
  } catch {
    /* table missing — fall through (validation still applies) */
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const honeypot = String(body?.homepage || ''); // bots fill hidden fields; humans never do
  if (honeypot) return json({ ok: true, id: 'ignored' }); // silently swallow spam

  const name = String(body?.name || '').trim().slice(0, 80);
  const email = String(body?.email || '').trim().slice(0, 160);
  const contact = String(body?.contact || '').trim().slice(0, 40);
  const website = String(body?.website || '').trim().slice(0, 200);
  const goal = String(body?.goal || '').trim().slice(0, 200);
  const service = String(body?.service || '').trim().slice(0, 200);
  const details = String(body?.details || '').trim().slice(0, 2000);
  const source = String(body?.source || 'contact').trim().slice(0, 20);
  const bookingDate = String(body?.bookingDate || '').trim().slice(0, 40);
  const bookingTime = String(body?.bookingTime || '').trim().slice(0, 40);

  if (!name) return json({ ok: false, error: 'لطفاً نام خود را وارد کنید.' }, { status: 400 });
  if (!email && !contact) {
    return json({ ok: false, error: 'لطفاً ایمیل یا شماره تماس خود را وارد کنید.' }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'آدرس ایمیل معتبر نیست.' }, { status: 400 });
  }
  if (!details) return json({ ok: false, error: 'لطفاً توضیح کوتاهی بنویسید.' }, { status: 400 });

  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4))).map((b) => b.toString(16).padStart(2, '0')).join('');
  const id = `lead-${Date.now()}-${rand}`;
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO leads (id, source, name, email, contact, website, goal, service, details, booking_date, booking_time, created_at, ip)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`
    ).bind(id, source, name, email, contact, website, goal, service, details, bookingDate, bookingTime, now, ip).run();
  } catch (e) {
    return json({ ok: false, error: 'ثبت درخواست ناموفق بود؛ لطفاً از واتساپ یا تلگرام پیام دهید.' }, { status: 500 });
  }

  return json({ ok: true, id });
};
