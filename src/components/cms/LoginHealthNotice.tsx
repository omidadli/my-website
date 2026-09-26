import React, { useState } from 'react';
import { ShieldAlert, Timer, PlugZap, RefreshCw, ExternalLink } from 'lucide-react';
import type { AuthHealth } from '../../services/api';

interface LoginHealthNoticeProps {
  /** Live /api/health snapshot (null = not probed yet, or API not deployed → nothing to show). */
  health: AuthHealth | null;
  /** Re-probe /api/health. */
  onRecheck?: () => Promise<void> | void;
  /** Tighter layout for the quick edit-mode modal. */
  compact?: boolean;
}

/**
 * Explains, before the user types anything, why admin login cannot succeed right now.
 *
 * A rejected login has three very different causes and they all used to look like
 * "wrong username or password":
 *   • the Cloudflare env vars (ADMIN_USERNAME / ADMIN_PASSWORD / AUTH_SECRET) never reached
 *     this deployment — Pages binds secrets at deploy time, so a secret added in the
 *     dashboard only applies to the NEXT deployment,
 *   • this IP is temporarily locked out after too many failed attempts,
 *   • the D1 binding is missing.
 * Only those infrastructure problems are reported here; a plain wrong password stays a
 * normal form error so nothing about the credentials is leaked.
 */
export const LoginHealthNotice: React.FC<LoginHealthNoticeProps> = ({ health, onRecheck, compact }) => {
  const [busy, setBusy] = useState(false);

  if (!health) return null;

  const missing = health.auth?.configured ? [] : (health.auth?.missing || []);
  const locked = !!health.login?.locked;
  const noDb = !health.dev && health.bindings ? !health.bindings.d1 : false;
  if (!missing.length && !locked && !noDb) return null;

  const recheck = async () => {
    if (!onRecheck) return;
    setBusy(true);
    try {
      await onRecheck();
    } finally {
      setBusy(false);
    }
  };

  const title = missing.length
    ? 'ورود ممکن نیست — سرویس احراز هویت پیکربندی نشده'
    : locked
      ? 'ورود موقتاً قفل شده است'
      : 'دیتابیس (D1) به این دیپلویمنت وصل نیست';

  const Icon = missing.length ? ShieldAlert : locked ? Timer : PlugZap;
  const hints = Array.isArray(health.hints) ? health.hints.slice(0, compact ? 2 : 4) : [];

  return (
    <div className="rounded-2xl border border-[#fecaca] bg-[#fff5f5] p-4 space-y-2.5 text-right" role="status">
      <div className="flex items-start gap-2.5">
        <Icon className="w-4.5 h-4.5 shrink-0 text-[#b91c1c] mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-extrabold text-[#b91c1c] leading-relaxed">{title}</p>
          <p className="text-[11px] text-[#7f1d1d] leading-relaxed">
            {missing.length
              ? `متغیرهای ${missing.join(' و ')} در Cloudflare به این نسخه‌ی در حال سرویس نرسیده‌اند، پس هر نام کاربری/رمزی رد می‌شود. این ربطی به رمزِ شما ندارد.`
              : locked
                ? `به دلیل ${health.login.failedAttempts} تلاش ناموفق از این IP، حدود ${health.login.retryAfterMinutes} دقیقه دیگر می‌توانید دوباره امتحان کنید — در این فاصله حتی رمز درست هم پذیرفته نمی‌شود.`
                : 'بدون بایندینگ DB محدودیت تلاش ورود کار نمی‌کند؛ آن را در تنظیمات Functions پروژه‌ی Pages اضافه کنید.'}
          </p>
        </div>
      </div>

      {!compact && hints.length > 0 && (
        <ul className="space-y-1.5 pr-7">
          {hints.map((h, i) => (
            <li key={i} className="text-[10.5px] leading-relaxed text-[#7f1d1d] flex gap-1.5">
              <span className="shrink-0 font-extrabold">{i + 1}.</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 pr-7 pt-0.5">
        <a
          href="/api/health"
          target="_blank"
          rel="noreferrer noopener"
          dir="ltr"
          className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-[#b91c1c] hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          /api/health
        </a>
        {onRecheck && (
          <button
            type="button"
            onClick={recheck}
            disabled={busy}
            className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-[#b91c1c] hover:underline disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
            {busy ? 'در حال بررسی…' : 'بررسی مجدد'}
          </button>
        )}
      </div>
    </div>
  );
};
