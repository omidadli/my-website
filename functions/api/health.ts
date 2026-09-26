import {
  Env,
  json,
  getClientIp,
  authConfigStatus,
  LOGIN_WINDOW_MINUTES,
  LOGIN_MAX_FAILURES,
} from './_shared';

/**
 * GET /api/health — public, read-only self-diagnosis for the admin login pipeline.
 *
 * Why this exists: a rejected login has three completely different causes and the login form
 * used to show the same "نام کاربری یا رمز عبور اشتباه است" for all of them —
 *   1. the Cloudflare env vars never reached the running deployment (503),
 *   2. the IP is temporarily locked out after too many failed attempts (429),
 *   3. the credentials really are wrong (401).
 * Opening https://<site>/api/health tells you which one it is in one request.
 *
 * Security: reports NAMES and booleans only — never a secret value, never the expected
 * username/password — so there is nothing here an attacker can use beyond what the public
 * login form already tells them.
 */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = authConfigStatus(env);
  const bindings = { d1: !!env.DB, r2: !!env.MEDIA };

  const database: { reachable: boolean | null; loginAttemptsTable: boolean | null } = {
    reachable: null,
    loginAttemptsTable: null,
  };
  const login = {
    locked: false,
    failedAttempts: 0,
    maxFailures: LOGIN_MAX_FAILURES,
    windowMinutes: LOGIN_WINDOW_MINUTES,
    retryAfterMinutes: 0,
  };

  if (bindings.d1) {
    try {
      const since = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString();
      const rows = await env.DB.prepare(
        `SELECT attempted_at FROM login_attempts WHERE ip = ?1 AND success = 0 AND attempted_at > ?2 ORDER BY attempted_at ASC`,
      )
        .bind(getClientIp(request), since)
        .all<{ attempted_at: string }>();
      database.reachable = true;
      database.loginAttemptsTable = true;
      const attempts = rows.results || [];
      login.failedAttempts = attempts.length;
      if (attempts.length >= LOGIN_MAX_FAILURES) {
        login.locked = true;
        // Attempts expire one by one: the lock lifts as soon as enough of them fall out of the window.
        const cutoff = attempts[attempts.length - LOGIN_MAX_FAILURES]?.attempted_at;
        const cutoffMs = cutoff ? Date.parse(cutoff) : NaN;
        login.retryAfterMinutes = Number.isNaN(cutoffMs)
          ? LOGIN_WINDOW_MINUTES
          : Math.max(1, Math.ceil((cutoffMs + LOGIN_WINDOW_MINUTES * 60 * 1000 - Date.now()) / 60000));
      }
    } catch {
      database.reachable = true;
      database.loginAttemptsTable = false; // table missing — login still works, counting is skipped
    }
  }

  const hints: string[] = [];
  if (!auth.configured) {
    hints.push(
      `متغیرهای ${auth.missing.join(' و ')} در این دیپلویمنت تعریف نشده‌اند. در Cloudflare: Workers & Pages → پروژه‌ی Pages → Settings → Variables and Secrets → محیط Production → افزودن با نوع «Secret (encrypted)».`,
    );
    hints.push(
      'نکته‌ی کلیدی: Pages سکرت‌ها را در زمان دیپلوی به بیلد تزریق می‌کند. بعد از افزودن/تغییر سکرت حتماً یک دیپلوی جدید بزنید (Retry deployment یا push روی main) وگرنه نسخه‌ی در حال سرویس همچنان آن‌ها را نمی‌بیند.',
    );
    hints.push(
      'اگر پروژه wrangler.toml دارد (این پروژه دارد)، متغیرهای معمولی/متنی از طریق داشبورد مدیریت نمی‌شوند و ممکن است با هر دیپلوی پاک شوند — نام کاربری و رمز را حتماً با نوع Secret بگذارید یا از `wrangler pages secret put` استفاده کنید.',
    );
    hints.push(
      'سکرت‌های GitHub Actions (Settings → Secrets and variables → Actions) فقط برای ورک‌فلوهای همگام‌سازی محتوا هستند و هیچ تاثیری روی ورود به پنل ندارند؛ منبع واقعی ورود، متغیرهای Cloudflare Pages است.',
    );
  }
  if (!bindings.d1) {
    hints.push(
      'بایندینگ دیتابیس D1 با نام DB وصل نیست: Pages → Settings → Functions → D1 database bindings (برای محدودیت تلاش ورود لازم است).',
    );
  }
  if (login.locked) {
    hints.push(
      `به دلیل ${login.failedAttempts} تلاش ناموفق، ورود از این IP موقتاً قفل است — حدود ${login.retryAfterMinutes} دقیقه دیگر دوباره امتحان کنید (رمز درست هم در این مدت رد می‌شود).`,
    );
  }
  if (auth.configured && bindings.d1 && !login.locked) {
    hints.push(
      'پیکربندی سرویس ورود کامل است؛ اگر هنوز پیام «نام کاربری یا رمز عبور اشتباه» می‌گیرید، مقدار ذخیره‌شده در Cloudflare با چیزی که تایپ می‌کنید متفاوت است (فاصله/خطای تایپی، حرف بزرگ و کوچک، یا newline اضافه‌شده هنگام `echo … | wrangler pages secret put`). نام کاربری و رمز به بزرگی/کوچکی حروف حساس‌اند.',
    );
  }

  const ready = auth.configured && bindings.d1 && !login.locked;
  const message = !auth.configured
    ? 'سرویس ورود پیکربندی نشده است — سکرت‌های Cloudflare به این دیپلویمنت نرسیده‌اند.'
    : login.locked
      ? 'ورود موقتاً برای این IP قفل شده است.'
      : !bindings.d1
        ? 'سرویس ورود بالا است ولی بایندینگ D1 وصل نیست.'
        : 'سرویس ورود آماده است؛ نام کاربری و رمز عبور با مقدارهای Cloudflare بررسی می‌شوند.';

  return json({
    ok: true,
    service: 'admin-auth',
    ready,
    message,
    auth,
    bindings,
    database,
    login,
    hints,
    checkedAt: new Date().toISOString(),
  });
};
