/**
 * Frontend display metadata for the paid AI tools (محصولات هوشمند).
 * The AI personas / prompts / security live server-side in lib/tools.ts —
 * this file only holds what the UI needs to render cards and the chat shell.
 * Keep `id` values in sync with lib/tools.ts.
 */

export interface AiToolMeta {
  id: string;
  name: string;
  tagline: string;
  description: string;
  audience: string;
  iconName: string;
  glow: 'magenta' | 'blue' | 'purple' | 'emerald';
  badge: string;
  /** short "how it works" steps shown on the card / gate */
  how: string[];
  /** input placeholder for the chat box */
  placeholder: string;
  /** example exchange shown on the locked gate so visitors grasp the value */
  sample: { role: 'user' | 'assistant'; text: string }[];
}

export const AI_TOOLS: AiToolMeta[] = [
  {
    id: 'business-therapist',
    name: 'تراپیست بیزینسی',
    tagline: 'یک منتور مارکتینگ که هم می‌فهمدت، هم راه نشانت می‌دهد',
    description:
      'همه‌چیز درباره‌ی مارکتینگ و رشد کسب‌وکار می‌داند. دغدغه، سردرگمی یا چالشت را پیشش می‌گذاری و مثل یک جلسه‌ی تراپی هم شنیده می‌شوی، هم مشورتِ دقیق و داده‌محور می‌گیری.',
    audience: 'مارکترها، فریلنسرها و صاحبان کسب‌وکاری که یک هم‌فکرِ باتجربه‌ی همیشه‌دردسترس می‌خواهند.',
    iconName: 'megaphone',
    glow: 'magenta',
    badge: 'مشاور مارکتینگ',
    placeholder: 'دغدغه یا چالش کاری‌ات رو راحت بنویس…',
    how: ['چالش یا دغدغه‌ات را راحت بگو', 'با نگاه تحلیلی و همدلانه گوش می‌دهد', 'راهکارِ عملیِ همین‌هفته می‌گیری'],
    sample: [
      { role: 'user', text: 'هرچی تبلیغ می‌کنم فروش بالا نمی‌ره، خسته شدم.' },
      { role: 'assistant', text: 'کاملاً درکت می‌کنم؛ این حسِ گیر افتادن طبیعیه. بگو ببینم نرخ تبدیل صفحه‌ی فرودت رو اندازه گرفتی؟ معمولاً مشکل نه در تبلیغ، که در ادامه‌ی مسیرِ فروشه…' },
    ],
  },
  {
    id: 'growth-path',
    name: 'مسیرساز توسعه فردی',
    tagline: 'هدفت را بگو، نقشه‌ی راه و چک‌لیستش را بگیر',
    description:
      'هدفی که در ذهن داری را توصیف می‌کنی و او مسیرِ رسیدن به آن را به قدم‌های شفاف، مرحله‌بندی‌شده و یک چک‌لیستِ قابلِ تیک‌زدن تبدیل می‌کند؛ متناسب با زمان و شرایطِ واقعیِ تو.',
    audience: 'هرکسی که یک هدف دارد ولی نمی‌داند از کجا و با چه ترتیبی شروع کند.',
    iconName: 'rocket',
    glow: 'blue',
    badge: 'نقشه‌ی راه هوشمند',
    placeholder: 'هدفت رو با جزئیات بنویس (زمان، شرایط، نقطه‌ی فعلی)…',
    how: ['هدفت را با جزئیات بنویس', 'به فازها و مراحل تقسیمش می‌کند', 'چک‌لیستِ همین‌هفته و اولین قدم را می‌دهد'],
    sample: [
      { role: 'user', text: 'می‌خوام تا ۶ ماه دیگه یه بیزینس آنلاین راه بندازم.' },
      { role: 'assistant', text: 'عالیه! مرحله ۱: انتخاب بازار و پیشنهاد ارزش (هفته ۱–۳). چک‌لیست این هفته:\n- [ ] ۳ ایده‌ی بازار بنویس\n- [ ] با ۵ مشتری بالقوه حرف بزن' },
    ],
  },
  {
    id: 'problem-solver',
    name: 'راه‌حل‌یاب',
    tagline: 'مشکلت را بگو، چند سوال می‌پرسم و چند راه‌حل می‌دهم',
    description:
      'مشکلت را تعریف می‌کنی؛ اول با چند سوالِ هوشمند دقیق می‌فهمد ماجرا چیست، بعد چند راه‌حلِ متفاوت با مزایا و معایب و یک پیشنهادِ نهایی جلوی پایت می‌گذارد.',
    audience: 'وقتی گیر کرده‌ای و به یک ذهنِ ساختارمند برای باز کردنِ گره نیاز داری.',
    iconName: 'target',
    glow: 'purple',
    badge: 'حل مسئله‌ی ساختارمند',
    placeholder: 'مشکلت رو توضیح بده…',
    how: ['مشکلت را توضیح بده', 'چند سوالِ کوتاه می‌پرسد تا دقیق بفهمد', 'چند راه‌حل + پیشنهادِ نهایی می‌دهد'],
    sample: [
      { role: 'user', text: 'نمی‌دونم روی کدوم شبکه‌ی اجتماعی تمرکز کنم.' },
      { role: 'assistant', text: 'چند سوال:\n۱. مخاطبت بیشتر کجاست؟\n۲. محتوای تصویری راحت‌تری یا نوشتاری؟\n۳. هدفت فروش مستقیمه یا برندسازی؟' },
    ],
  },
  {
    id: 'mock-customer',
    name: 'مشتری فرضی',
    tagline: 'محصولت را برایش توصیف کن، مثل یک مشتری واقعی باهات حرف می‌زند',
    description:
      'یک مشتریِ فرضیِ واقع‌گرایانه که محصول یا خدمتت را برایش توصیف می‌کنی و او دقیقاً مثل یک خریدارِ بالقوه سوال می‌پرسد، مخالفت می‌کند و بازخورد می‌دهد؛ عالی برای تمرینِ ارائه و فروش.',
    audience: 'کسانی که می‌خواهند پیامِ فروش یا ارائه‌شان را قبل از مشتریِ واقعی تست و پخته کنند.',
    iconName: 'chart',
    glow: 'emerald',
    badge: 'شبیه‌ساز فروش',
    placeholder: 'محصول یا خدمتت رو توصیف کن…',
    how: ['محصول یا خدمتت را توصیف کن', 'نقشِ یک مشتریِ واقعی را بازی می‌کند', 'بنویس «بازخورد» تا کوچِ فروش شود'],
    sample: [
      { role: 'user', text: 'دوره‌ی آموزش دیجیتال مارکتینگ آنلاین می‌فروشم.' },
      { role: 'assistant', text: 'جالبه، ولی من قبلاً چند تا دوره‌ی رایگان دیدم. دوره‌ی تو چه فرقی داره که ارزشِ پول دادن داشته باشه؟' },
    ],
  },
];

export const getToolMeta = (id: string): AiToolMeta | undefined => AI_TOOLS.find((t) => t.id === id);
