import { Env, createToken, requireAuth, safeEqual, json, unauthorized, getClientIp, ensureCoreTablesSafe } from './_shared';

const WINDOW_MINUTES = 15;
const MAX_FAILURES = 8;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD || !env.AUTH_SECRET) {
    return json({ ok: false, error: 'سرویس ورود پیکربندی نشده است. Secrets را در پنل Cloudflare تنظیم کنید.' }, { status: 503 });
  }

  const ip = getClientIp(request);
  await ensureCoreTablesSafe(env);

  // Rate limit: too many failed attempts from this IP recently → lock out temporarily.
  try {
    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS c FROM login_attempts WHERE ip = ?1 AND success = 0 AND attempted_at > ?2`
    ).bind(ip, since).first<{ c: number }>();
    if ((row?.c || 0) >= MAX_FAILURES) {
      return json({ ok: false, error: `تلاش‌های ناموفق زیاد. لطفاً ${WINDOW_MINUTES} دقیقه دیگر دوباره امتحان کنید.` }, { status: 429 });
    }
  } catch {
    /* table may not exist yet — fail open for counting, credentials still required */
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  const userOk = await safeEqual(username, env.ADMIN_USERNAME, env.AUTH_SECRET);
  const passOk = await safeEqual(password, env.ADMIN_PASSWORD, env.AUTH_SECRET);

  try {
    await env.DB.prepare(
      `INSERT INTO login_attempts (ip, attempted_at, success) VALUES (?1, ?2, ?3)`
    ).bind(ip, new Date().toISOString(), userOk && passOk ? 1 : 0).run();
    // Housekeeping: drop old rows beyond the window (best-effort).
    await env.DB.prepare(
      `DELETE FROM login_attempts WHERE attempted_at < ?1`
    ).bind(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).run();
  } catch {
    /* non-fatal */
  }

  if (!userOk || !passOk) {
    return json({ ok: false, error: 'نام کاربری یا رمز عبور اشتباه است.' }, { status: 401 });
  }

  const { token, expiresAt } = await createToken(username, env.AUTH_SECRET);
  return json({ ok: true, token, expiresAt });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAuth(request, env);
  if (!user) return unauthorized('جلسه معتبر نیست یا منقضی شده است.');
  return json({ ok: true, username: user });
};
