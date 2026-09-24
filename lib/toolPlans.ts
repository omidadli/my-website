/**
 * lib/toolPlans.ts — pricing plans + gamification defaults for the paid AI tools.
 *
 * Pure data (no fetch/crypto), imported by BOTH the server (functions +
 * vite-dev-api, via lib/tools.ts) and the client (src/data/tools.ts +
 * components) so pricing/quota never drift.
 *
 * Pricing model: usage-based tiers. Because one buyer chats a lot and another
 * a little, each tool has 3 plans differing in message quota + duration, all
 * priced from 400,000 Toman upward. The middle "حرفه‌ای" plan is the anchored
 * "most popular" tier (classic decoy/anchor psychology).
 *
 * Prices are the DEFAULT display labels; the admin can override any plan price
 * from the panel (AI_TOOLS_CONFIG.tools[id].planPrices[planId]).
 */

export interface ToolPlan {
  id: 'basic' | 'pro' | 'vip';
  name: string;
  /** default price label (Persian) — overridable per-tool from the CMS */
  price: string;
  /** access duration in days */
  durationDays: number;
  /** message quota over the plan window; 0 = unlimited */
  messageQuota: number;
  /** device count allowed */
  maxDevices: number;
  /** short value line */
  tagline: string;
  /** bullet perks shown on the card */
  perks: string[];
  /** highlighted (anchored) tier */
  popular?: boolean;
  /** ribbon text */
  badge?: string;
}

/** Number of free "taster" messages per device per tool (gamification hook). */
export const DEFAULT_FREE_TRIAL = 3;

const P = (
  id: ToolPlan['id'],
  name: string,
  price: string,
  durationDays: number,
  messageQuota: number,
  maxDevices: number,
  tagline: string,
  perks: string[],
  extra: Partial<ToolPlan> = {}
): ToolPlan => ({ id, name, price, durationDays, messageQuota, maxDevices, tagline, perks, ...extra });

export const TOOL_PLANS: Record<string, ToolPlan[]> = {
  'business-therapist': [
    P('basic', 'پایه', '۵۹۰٬۰۰۰ تومان', 30, 200, 1, 'برای شروع و بررسی چند چالش',
      ['۳۰ روز دسترسی', '۲۰۰ پیام گفتگو', 'مشاوره‌ی داده‌محورِ کامل', 'روی ۱ دستگاه']),
    P('pro', 'حرفه‌ای', '۱٬۲۹۰٬۰۰۰ تومان', 90, 700, 2, 'انتخابِ بیشترِ مارکترها',
      ['۹۰ روز دسترسی', '۷۰۰ پیام گفتگو', 'حافظه‌ی بلندترِ گفتگو', 'اولویت پاسخ‌دهی', 'روی ۲ دستگاه'],
      { popular: true, badge: 'محبوب‌ترین' }),
    P('vip', 'نامحدود VIP', '۲٬۴۹۰٬۰۰۰ تومان', 180, 0, 3, 'برای استفاده‌ی جدی و روزمره',
      ['۱۸۰ روز دسترسی', 'پیام نامحدود', 'بالاترین صرفه', 'پشتیبانی ویژه', 'روی ۳ دستگاه'],
      { badge: 'بیشترین صرفه' }),
  ],
  'growth-path': [
    P('basic', 'پایه', '۴۹۰٬۰۰۰ تومان', 30, 150, 1, 'برای ساخت اولین نقشه‌ی راه',
      ['۳۰ روز دسترسی', '۱۵۰ پیام گفتگو', 'نقشه‌ی راه و چک‌لیست کامل', 'روی ۱ دستگاه']),
    P('pro', 'حرفه‌ای', '۹۹۰٬۰۰۰ تومان', 90, 500, 2, 'برای پیگیریِ مستمرِ هدف',
      ['۹۰ روز دسترسی', '۵۰۰ پیام گفتگو', 'به‌روزرسانیِ مسیر در طول زمان', 'اولویت پاسخ‌دهی', 'روی ۲ دستگاه'],
      { popular: true, badge: 'محبوب‌ترین' }),
    P('vip', 'نامحدود VIP', '۱٬۹۹۰٬۰۰۰ تومان', 180, 0, 3, 'برای چند هدفِ موازی',
      ['۱۸۰ روز دسترسی', 'پیام نامحدود', 'بالاترین صرفه', 'پشتیبانی ویژه', 'روی ۳ دستگاه'],
      { badge: 'بیشترین صرفه' }),
  ],
  'problem-solver': [
    P('basic', 'پایه', '۴۹۰٬۰۰۰ تومان', 30, 150, 1, 'برای حلِ چند مسئله‌ی مشخص',
      ['۳۰ روز دسترسی', '۱۵۰ پیام گفتگو', 'راه‌حل‌های ساختارمند', 'روی ۱ دستگاه']),
    P('pro', 'حرفه‌ای', '۹۹۰٬۰۰۰ تومان', 90, 500, 2, 'همراهِ همیشگیِ تصمیم‌گیری',
      ['۹۰ روز دسترسی', '۵۰۰ پیام گفتگو', 'تحلیل عمیق‌ترِ مسئله', 'اولویت پاسخ‌دهی', 'روی ۲ دستگاه'],
      { popular: true, badge: 'محبوب‌ترین' }),
    P('vip', 'نامحدود VIP', '۱٬۹۹۰٬۰۰۰ تومان', 180, 0, 3, 'برای استفاده‌ی حرفه‌ای و تیمی',
      ['۱۸۰ روز دسترسی', 'پیام نامحدود', 'بالاترین صرفه', 'پشتیبانی ویژه', 'روی ۳ دستگاه'],
      { badge: 'بیشترین صرفه' }),
  ],
  'mock-customer': [
    P('basic', 'پایه', '۴۹۰٬۰۰۰ تومان', 30, 200, 1, 'برای تمرینِ اولین ارائه‌ها',
      ['۳۰ روز دسترسی', '۲۰۰ پیام تمرین', 'شبیه‌سازیِ مشتریِ واقعی', 'روی ۱ دستگاه']),
    P('pro', 'حرفه‌ای', '۱٬۰۹۰٬۰۰۰ تومان', 90, 700, 2, 'برای پخته‌کردنِ پیامِ فروش',
      ['۹۰ روز دسترسی', '۷۰۰ پیام تمرین', 'کوچِ فروش بعد از هر تمرین', 'اولویت پاسخ‌دهی', 'روی ۲ دستگاه'],
      { popular: true, badge: 'محبوب‌ترین' }),
    P('vip', 'نامحدود VIP', '۱٬۹۹۰٬۰۰۰ تومان', 180, 0, 3, 'برای تیم‌های فروش',
      ['۱۸۰ روز دسترسی', 'تمرین نامحدود', 'بالاترین صرفه', 'پشتیبانی ویژه', 'روی ۳ دستگاه'],
      { badge: 'بیشترین صرفه' }),
  ],
};

export const getPlans = (toolId: string): ToolPlan[] => TOOL_PLANS[toolId] || [];
export const getPlan = (toolId: string, planId: string): ToolPlan | undefined => getPlans(toolId).find((p) => p.id === planId);

/** Resolve the effective price label for a plan (CMS override wins). */
export const resolvePlanPrice = (toolId: string, plan: ToolPlan, data?: any): string => {
  const override = data?.AI_TOOLS_CONFIG?.tools?.[toolId]?.planPrices?.[plan.id];
  return (typeof override === 'string' && override.trim()) ? override : plan.price;
};

/** The cheapest plan's price label — used for the "از … تومان" hook on cards. */
export const startingPrice = (toolId: string, data?: any): string => {
  const plans = getPlans(toolId);
  if (!plans.length) return '';
  return resolvePlanPrice(toolId, plans[0], data);
};

/** Free-trial count from CMS config, falling back to the default. */
export const resolveFreeTrial = (data?: any): number => {
  const v = data?.AI_TOOLS_CONFIG?.freeTrialCount;
  return typeof v === 'number' && v >= 0 ? v : DEFAULT_FREE_TRIAL;
};
