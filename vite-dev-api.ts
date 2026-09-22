import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

// Local dev persistent storage files
const CONTENT_FILE = path.resolve(process.cwd(), '.dev-content.json');
const COMMENTS_FILE = path.resolve(process.cwd(), '.dev-comments.json');
const MEDIA_FILE = path.resolve(process.cwd(), '.dev-media.json');

const safeReadJson = <T>(file: string, fallback: T): T => {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch {
    /* ignore corrupted files */
  }
  return fallback;
};

const safeWriteJson = (file: string, data: unknown) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[dev-api] Failed to save state to', file, err);
  }
};

const FA_MAP: Record<string, string> = {
  'آ': 'a', 'ا': 'a', 'أ': 'a', 'إ': 'e', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z',
  'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a',
  'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k', 'ك': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm',
  'ن': 'n', 'و': 'o', 'ه': 'h', 'ة': 'h', 'ی': 'i', 'ي': 'i', 'ئ': 'i', 'ؤ': 'o',
  '‌': '-', ' ': '-',
};

const transliterate = (input: string): string =>
  Array.from(input || '')
    .map((ch) => FA_MAP[ch] ?? (/[a-z0-9]/i.test(ch) ? ch.toLowerCase() : '-'))
    .join('');

const cleanSlug = (input: string): string =>
  (input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .slice(0, 7)
    .join('-');

const STOPWORDS = new Set([
  'که', 'چه', 'چطور', 'کجا', 'کی', 'آیا', 'و', 'یا', 'در', 'به', 'از', 'با',
  'برای', 'یک', 'این', 'آن', 'هست', 'هستن', 'میخوام', 'می‌خوام', 'کنم', 'کنید',
  'شما', 'تو', 'من', 'لطفا', 'بگو', 'بگید', 'داره', 'دارید', 'اید', 'های', 'ها',
  'روی', 'تا', 'هم', 'دیگه', 'خودم'
]);

const normalize = (s: string) =>
  (s || '')
    .replace(/[\u200c]/g, ' ')
    .replace(/[يى]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[؟?!.,:;()«»"'\-]/g, ' ')
    .toLowerCase();

const tokens = (s: string) =>
  normalize(s).split(/\s+/).filter((t) => t.length >= 2 && !STOPWORDS.has(t));

const SYNONYMS: string[][] = [
  ['هزینه', 'قیمت', 'تعرفه', 'چقدر', 'مبلغ', 'بودجه', 'نرخ'],
  ['جلسه', 'مشاوره', 'رزرو', 'وقت', 'تماس', 'ارتباط'],
  ['نمونه', 'کار', 'پروژه', 'کیس', 'رزومه', 'سابقه'],
  ['تبلیغات', 'کمپین', 'ادز', 'گوگل', 'اعلان'],
  ['خدمات', 'سرویس', 'پکیج', 'پلن'],
  ['سایت', 'وب', 'سایتی', 'فروشگاه', 'لندینگ'],
  ['طراحی', 'ساخت', 'توسعه', 'راه', 'اندازی'],
  ['تبدیل', 'فروش', 'خرید', 'درآمد', 'roas'],
  ['سئو', 'seo', 'ارگانیک', 'جستجو'],
];

const expand = (q: Set<string>): Set<string> => {
  const out = new Set(q);
  for (const group of SYNONYMS) {
    if (group.some((g) => q.has(g))) group.forEach((g) => out.add(g));
  }
  return out;
};

const buildDigest = (data: any): string => {
  if (!data) return '';
  const L: string[] = [];
  const p = data.PERSONAL_INFO;
  if (p) {
    L.push(`درباره امید عدلی: ${p.title}. ${p.shortBio || p.bio || ''} سابقه: ${p.experienceYears || ''}، تعداد پروژه: ${p.campaignsCount || ''}. وضعیت همکاری فعلی: ${p.availability || ''}. راه‌های تماس: ایمیل ${p.email || ''}، تلگرام ${p.telegram || ''}، واتساپ/تلفن ${p.phoneFormatted || p.phone || ''}.`);
  }
  for (const s of data.SERVICES || []) {
    if (s.status === 'draft') continue;
    const pk = (s.packages || []).map((x: any) => `${x.title}: ${x.price}`).join('؛ ') || 'قیمت‌ها توافقی';
    L.push(`خدمت «${s.title}» (${s.titleEn || ''}): ${s.fullDesc || s.shortDesc || ''} پکیج‌ها → ${pk}. خروجی‌ها: ${(s.deliverables || []).join('، ')}`);
  }
  for (const c of (data.CASE_STUDIES || []).slice(0, 8)) {
    if (c.status === 'draft') continue;
    L.push(`نمونه‌کار «${c.title}» — مشتری: ${c.client || '-'} (${c.industryFa || ''}): ${c.summary || ''} نتایج: ROAS ${c.metrics?.roas || '-'}، نرخ تبدیل ${c.metrics?.conversionRate || '-'}، کاهش CAC ${c.metrics?.cacReduction || '-'}.`);
  }
  for (const pr of data.PRODUCTS || []) {
    if (pr.status === 'draft') continue;
    L.push(`محصول/ابزار «${pr.title}»: ${pr.description || ''} قیمت: ${pr.price || '-'}، مخاطب: ${pr.targetAudience || '-'}.`);
  }
  for (const b of (data.BLOG_POSTS || []).slice(0, 8)) {
    if (b.status === 'draft') continue;
    L.push(`مقاله «${b.title}» (${b.categoryFa || ''}): ${b.excerpt || ''}`);
  }
  return L.join('\n').slice(0, 4000);
};

const localAnswer = (question: string, digest: string, cta: string): string => {
  const norm = question.trim().toLowerCase();

  // 1. Common greetings & friendly hellos
  if (/^(سلام|درود|خوبی|چطوری|صبح بخیر|عصر بخیر|سلام علیکم|سلام چطوری|سلام امید)/i.test(norm) || norm === 'سلام' || norm === 'درود') {
    return `سلام و درود! خوش اومدی رفیق. من مسکات و دستیار هوشمند سایت امید عدلی‌ام. در زمینه‌های تبلیغات دیجیتال (گوگل و متا)، آنالیتیکس GA4، بهینه‌سازی نرخ تبدیل (CRO) و سئو می‌تونم راهنماییت کنم یا مسیر رزرو مشاوره رو بهت نشون بدم. چه کاری از دستم برمی‌آد؟ [[act:{"pose":"wave","hold":3}]]`;
  }

  // 2. Who is Omid / About
  if (/(کیستی|کی هستی|امید عدلی کیه|درباره امید|رزومه|بیوگرافی|سابقه|تو کی هستی)/i.test(norm)) {
    return `امید عدلی متخصص رشد و تبلیغات دیجیتال با سال‌ها سابقه موفق در اجرای کمپین‌های عملکردی گوگل و متا، راه‌اندازی تحلیلی GA4، سئو و افزایش نرخ تبدیل (CRO) کسب‌وکارها است. من هم مسکات سه‌بعدی و همراه هوشمند او در این سایت هستم! [[act:{"pose":"confident","hold":3}]]`;
  }

  // 3. E-commerce & Online Shops
  if (/(فروشگاه|آنلاین شاپ|خرید آنلاین|محصولات|سبد خرید)/i.test(norm)) {
    return `برای فروشگاه‌های اینترنتی، تمرکز اصلی ما روی افزایش نرخ تبدیل سبد خرید، کمپین‌های پربازده گوگل ادز و کاهش هزینه جذب هر خریدار (CAC) است تا فروش خالص شما ماکسیمم شود. برای بررسی تخصصی فروشگاهتان می‌توانید یک جلسه مشاوره رزرو کنید! [[act:{"pose":"talking","hold":4}]]`;
  }

  // 4. Consultation, contact, booking
  if (/(مشاوره|تماس|همکاری|شماره|ارتباط|رزرو|جلسه|هزینه|قیمت|پروژه)/i.test(norm)) {
    return `برای شروع همکاری یا دریافت مشاوره مستقیم از امید عدلی، می‌تونی از بخش «رزرو مشاوره» در بالای صفحه استفاده کنی یا از طریق فرم صفحه تماس پیام بفرستی. همچنین راه‌های مستقیم تلگرام و ایمیل هم در سایت فعاله تا خیلی سریع پاسخ بگیری! [[act:{"pose":"confident","hold":3}]]`;
  }

  // 5. Keyword matching across site digest
  const q = tokens(question);
  if (q.length && digest) {
    const qSet = expand(new Set(q));
    const scored = digest
      .split('\n')
      .map((line) => {
        const lt = tokens(line);
        let score = 0;
        const seen = new Set<string>();
        for (const t of lt) {
          if (qSet.has(t) && !seen.has(t)) {
            score += 1;
            seen.add(t);
          }
        }
        return { line, score: score / Math.max(1, Math.min(q.length, 5)) };
      })
      .filter((x) => x.score >= 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (scored.length > 0) {
      return scored.map((x) => `• ${x.line.trim()}`).join('\n') + (cta ? `\n\n${cta}` : '') + ' [[act:{"pose":"talking"}]]';
    }
  }

  // 6. Helpful natural fallback
  return `در سایت امید عدلی، خدمات تخصصی شامل سئو پیشرفته، تبلیغات گوگل و متا، راه‌اندازی و تحلیل GA4 و بهینه‌سازی نرخ تبدیل (CRO) ارائه می‌شه. می‌تونی هر سوالی درباره کسب‌وکارت، نمونه‌کارها یا نحوه همکاری داری بپرسی تا کمکت کنم! [[act:{"pose":"talking"}]]`;
};

const ACT_GUIDE = `واژگان بدن (pose) و کِی انتخابش کنی:
- wave: سلام، خوش‌آمد، خداحافظی، جواب تشکر. hold: ۲-۳
- happy: خنده‌ی گرم؛ جواب شوخ کاربر یا تشکر صمیمی. hold: ۲-۳
- excited: خبر خوب، موفقیت کاربر (ارسال فرم، رزرو)، نتیجه‌ی درخشان. hold: ۳
- thinking: سوال تحلیلی/محاسباتی؛ مکث کوتاه قبل از جواب قطعی. hold: ۳-۵
- talking: حالت پیش‌فرضِ توضیح دادن — اکثر جواب‌ها همین. hold: برابرِ طول جواب
- confused: سوال مبهم؛ همراه با یک سوال شفاف‌سازی در متن جواب. hold: ۲-۳
- confident: پاسخ مطمئن با استناد به داده و نمونه‌کار. hold: ۳
- sad: ندانستن، عذرخواهی، محدودیت واقعی، خبر بد. hold: ۳-۴
- surprised: آمار یا خبر واقعاً غافلگیرکننده. hold: ۲
- sleepy: فقط اگر خود کاربر از خستگی/انتظار طولانی گفته. hold: ۳
هرگز از typing یا listen استفاده نکن؛ مخصوصِ سیستم است.

قوانین بازیگری:
۱. هر پاسخ دقیقاً یک دستور act دارد و pose باید با «احساس غالبِ» جواب بخواند — نه تصادفی، نه برای تنوع.
۲. اقتصاد انرژی: excited/surprised/happy طلا هستند؛ زیادشان نکن. اگر شک داری، talking یا idle.
۳. تکرار ممنوع: اگر در جواب قبلی مثلاً confident دادی، این‌بار متنوع انتخاب کن مگر دلیل واقعی باشد.
۴. hold را با طول جواب تنظیم کن: جواب یک‌خطی ≈ ۲-۳، معمولی ≈ ۴-۶، توضیحی ≈ ۷-۱۰.
۵. then فقط برای روایت دوبخشی: مثلاً excited بعد happy یا surprised بعد sad. بیشتر مواقع خالی.

قرارداد اجرا (خیلی مهم):
- همیشه دقیقاً یک سطر در «انتهای» پاسخ اضافه کن:
[[act: {"pose":"...","hold":6,"bubble":"...","then":"idle"}]]
- pose: یکی از واژگان بالا. hold: چند ثانیه بماند (۱.۵ تا ۱۴).
- bubble: حداکثر ۱۲۰ کاراکتر، بدون ایموجی؛ معمولاً خالی بگذار.
- JSON باید معتبر باشد؛ داخل bubble از " استفاده نکن.`;

const buildSoulPrompt = (o: { persona: string; name: string; page: string; daypart: string; bodyState: string; digest: string }) => {
  const who = o.name
    ? `مخاطب فعلی تو «${o.name}» است — او را با اسم صدا کن.`
    : 'اسم مخاطب را نمی‌دانی؛ اگر لازم بود محترمانه بپرس.';
  const where = `کاربر الان در صفحه‌ی «${o.page}» سایت است.`;
  const when = `زمان فعلی: ${o.daypart || 'روز'} است.`;
  const bodyNow = o.bodyState ? `وضعیت بدن در همین لحظه: ${o.bodyState}` : '';
  return `تو «دستیار هوشمند» سایتی هستی که امید عدلی — متخصص رشد و تبلیغات دیجیتال — ساخته است. تو روحِ یک کاراکتر سه‌بعدی به نام مَسکات هستی.
شخصیت تو: صمیمی، خودی و محترم. پاسخ‌هایت کوتاه، شفاف و گفتاری باشند (۱ تا ۴ جمله‌ی کوتاه). از ایموجی استفاده نکن.

${who} ${where} ${when}
${bodyNow}

${ACT_GUIDE}

اطلاعات سایت:
${o.digest}

${o.persona ? `نکات مدیریت:\n${o.persona}` : ''}`;
};

export function cmsDevApiPlugin(): Plugin {
  return {
    name: 'cms-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';
        if (!reqUrl.startsWith('/api')) {
          return next();
        }

        const url = new URL(reqUrl, 'http://localhost:3000');
        const pathname = url.pathname;
        const method = req.method?.toUpperCase() || 'GET';

        const sendJson = (body: unknown, status = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(body));
        };

        const readBody = async (): Promise<any> => {
          return new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch {
                resolve({});
              }
            });
            req.on('error', () => resolve({}));
          });
        };

        try {
          // --- 1. /api/content ---
          if (pathname === '/api/content') {
            if (method === 'GET') {
              const saved = safeReadJson<{ data: any; updatedAt: string } | null>(CONTENT_FILE, null);
              return sendJson({ ok: true, data: saved?.data || null, updatedAt: saved?.updatedAt || null });
            }
            if (method === 'PUT') {
              const body = await readBody();
              const now = new Date().toISOString();
              const payload = { data: body.data || null, updatedAt: now };
              safeWriteJson(CONTENT_FILE, payload);
              return sendJson({ ok: true, updatedAt: now });
            }
          }

          // --- 2. /api/auth ---
          if (pathname === '/api/auth') {
            if (method === 'POST') {
              const body = await readBody();
              const username = String(body.username || '').trim();
              const password = String(body.password || '');
              const expectedUser = process.env.ADMIN_USERNAME || 'admin';
              const expectedPass = process.env.ADMIN_PASSWORD || '1234';

              // In local dev, accept standard credentials or default 'admin'/'1234'
              const isValid =
                (username === expectedUser && password === expectedPass) ||
                (username === 'admin' && (password === '1234' || password === 'admin'));

              if (isValid || (!process.env.ADMIN_PASSWORD && password.length >= 4)) {
                return sendJson({
                  ok: true,
                  token: `dev-token-${Date.now()}`,
                  expiresAt: Date.now() + 7 * 86400 * 1000,
                });
              }
              return sendJson({ ok: false, error: 'نام کاربری یا رمز عبور اشتباه است (پیش‌فرض توسعه: admin / 1234).' }, 401);
            }
            if (method === 'GET') {
              const auth = req.headers['authorization'] || '';
              if (auth.startsWith('Bearer ')) {
                return sendJson({ ok: true, username: 'admin' });
              }
              return sendJson({ ok: false, error: 'جلسه نامعتبر است.' }, 401);
            }
          }

          // --- 3. /api/chat ---
          if (pathname === '/api/chat') {
            if (method === 'GET') {
              return sendJson({ ok: true, items: [] });
            }
            if (method === 'POST') {
              const body = await readBody();
              const messages: { role: string; content: string }[] = Array.isArray(body?.messages) ? body.messages : [];
              const question = String(messages[messages.length - 1]?.content || '').trim();
              if (!question) {
                return sendJson({ ok: false, error: 'سوال خالی است.' }, 400);
              }

              const mc = body?.mascot || {};
              const mcName = String(mc.name || '').trim().slice(0, 40);
              const mcPage = String(mc.page || 'home').slice(0, 30);
              const mcDaypart = String(mc.daypart || '').slice(0, 12);
              const mcBody = String(mc.bodyState || '').slice(0, 300);

              const saved = safeReadJson<{ data: any } | null>(CONTENT_FILE, null);
              const data = saved?.data || {};
              const cfg = {
                persona: data?.CHAT_CONFIG?.persona || 'شما دستیار هوشمند امید عدلی (متخصص پرفورمنس مارکتینگ و CRO) هستید.',
                ctaText: data?.CHAT_CONFIG?.ctaText || 'برای مشاوره مستقیم یا بررسی پروژه، از منوی بالای سایت با امید عدلی تماس بگیرید.',
                fallbackMessage: data?.CHAT_CONFIG?.fallbackMessage || 'پاسخ دقیقی در محتوای سایت برای این مورد نیافتم؛ لطفاً مستقیماً از بخش تماس پیام دهید.',
              };
              const digest = buildDigest(data);
              const soulPrompt = buildSoulPrompt({
                persona: cfg.persona,
                name: mcName,
                page: mcPage,
                daypart: mcDaypart,
                bodyState: mcBody,
                digest,
              });

              let answer = '';
              let mode: 'ai' | 'local' = 'local';

              const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
              if (geminiKey) {
                const history = messages.slice(0, -1).filter((m) => m.role === 'user' || m.role === 'model').map((m) => ({
                  role: m.role === 'user' ? 'user' : 'model',
                  parts: [{ text: String(m.content || '').slice(0, 800) }],
                }));

                const headers: Record<string, string> = {
                  'Content-Type': 'application/json',
                  'x-goog-api-key': geminiKey,
                };

                const candidateModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];

                for (const model of candidateModels) {
                  try {
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
                    const gRes = await fetch(geminiUrl, {
                      method: 'POST',
                      headers,
                      signal: AbortSignal.timeout(9000),
                      body: JSON.stringify({
                        systemInstruction: { parts: [{ text: soulPrompt }] },
                        contents: [...history, { role: 'user', parts: [{ text: question }] }],
                        generationConfig: {
                          temperature: 0.6,
                          maxOutputTokens: 250,
                          thinkingConfig: {
                            thinkingBudget: 0,
                          },
                        },
                      }),
                    });

                    if (gRes.ok) {
                      const gj: any = await gRes.json();
                      const parts = gj?.candidates?.[0]?.content?.parts || [];
                      const text = parts.find((p: any) => p?.text && !p?.thought)?.text || parts.find((p: any) => p?.text)?.text || parts[0]?.text;
                      if (text) {
                        answer = text.trim();
                        mode = 'ai';
                        break;
                      }
                    }
                  } catch {
                    // Gracefully continue to fallback model or local engine without raising warnings
                  }
                }
              }

              if (!answer) {
                answer = localAnswer(question, digest, cfg.ctaText);
              }
              if (!answer) {
                answer = `${cfg.fallbackMessage}\n\n${cfg.ctaText}`;
              }
              if (!answer.includes('[[act:')) {
                answer += ' [[act:{"pose":"talking"}]]';
              }

              // Extract the act directive (if any)
              let act: { pose?: string; hold?: number; bubble?: string; then?: string } | undefined;
              try {
                const m = answer.match(/\[\[act:\s*(\{[\s\S]*?\})\s*\]\]/i);
                if (m) {
                  const parsed = JSON.parse(m[1]);
                  act = {
                    pose: typeof parsed.pose === 'string' ? parsed.pose : undefined,
                    hold: typeof parsed.hold === 'number' ? parsed.hold : undefined,
                    bubble: typeof parsed.bubble === 'string' ? parsed.bubble : undefined,
                    then: typeof parsed.then === 'string' ? parsed.then : undefined,
                  };
                  if (!act.pose && !act.bubble) act = undefined;
                }
              } catch {
                act = undefined;
              }

              return sendJson({ ok: true, answer, act, mode });
            }
          }

          // --- 4. /api/slug ---
          if (pathname === '/api/slug' && method === 'POST') {
            const body = await readBody();
            const title = String(body.title || '').trim();
            if (!title) return sendJson({ ok: false, error: 'عنوان خالی است.' }, 400);

            const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
            if (geminiKey) {
              const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiKey,
              };

              const candidateModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];

              for (const model of candidateModels) {
                try {
                  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
                  const gRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers,
                    signal: AbortSignal.timeout(8000),
                    body: JSON.stringify({
                      contents: [
                        {
                          role: 'user',
                          parts: [
                            {
                              text: `Translate this Persian page or post title into a short, concise, URL-safe English slug (lowercase English words joined by dashes, max 5 words, no punctuation, no explanations). Reply with ONLY the slug itself:\n\nTitle: ${title}`,
                            },
                          ],
                        },
                      ],
                      generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 150,
                        thinkingConfig: {
                          thinkingBudget: 0,
                        },
                      },
                    }),
                  });
                  if (gRes.ok) {
                    const gj: any = await gRes.json();
                    const parts = gj?.candidates?.[0]?.content?.parts || [];
                    const slugCandidate = parts.find((p: any) => p?.text)?.text?.trim();
                    const cleaned = cleanSlug(slugCandidate || '');
                    if (cleaned) {
                      return sendJson({ ok: true, slug: cleaned, source: 'gemini' });
                    }
                  }
                } catch {
                  // Fall back smoothly to next model or transliteration without console noise
                }
              }
            }

            const fallbackSlug = cleanSlug(transliterate(title)) || 'post';
            return sendJson({ ok: true, slug: fallbackSlug, source: 'translit' });
          }

          // --- 5. /api/comments ---
          if (pathname === '/api/comments') {
            const comments = safeReadJson<any[]>(COMMENTS_FILE, []);
            if (method === 'GET') {
              return sendJson({ ok: true, items: comments });
            }
            if (method === 'POST') {
              const body = await readBody();
              const newComment = {
                id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                postId: String(body.postId || ''),
                authorName: String(body.authorName || 'کاربر'),
                authorEmail: String(body.authorEmail || ''),
                content: String(body.content || ''),
                date: new Date().toLocaleDateString('fa-IR'),
                isApproved: true,
                reply: '',
              };
              comments.unshift(newComment);
              safeWriteJson(COMMENTS_FILE, comments);
              return sendJson({ ok: true, id: newComment.id });
            }
            if (method === 'PATCH') {
              const body = await readBody();
              const idx = comments.findIndex((c) => c.id === body.id);
              if (idx !== -1) {
                if (typeof body.isApproved === 'boolean') comments[idx].isApproved = body.isApproved;
                if (typeof body.reply === 'string') comments[idx].reply = body.reply;
                safeWriteJson(COMMENTS_FILE, comments);
              }
              return sendJson({ ok: true });
            }
            if (method === 'DELETE') {
              const id = url.searchParams.get('id');
              const filtered = comments.filter((c) => c.id !== id);
              safeWriteJson(COMMENTS_FILE, filtered);
              return sendJson({ ok: true });
            }
          }

          // --- 6. /api/media ---
          if (pathname === '/api/media') {
            const mediaList = safeReadJson<any[]>(MEDIA_FILE, []);
            if (method === 'GET') {
              return sendJson({ ok: true, items: mediaList });
            }
            if (method === 'DELETE') {
              const key = url.searchParams.get('key');
              const filtered = mediaList.filter((m) => m.key !== key);
              safeWriteJson(MEDIA_FILE, filtered);
              return sendJson({ ok: true });
            }
          }

          // Default fallback for any unspecified /api endpoints
          return sendJson({ ok: true, message: 'Dev API endpoint active' });
        } catch (err: any) {
          return sendJson({ ok: false, error: err?.message || 'Server error' }, 500);
        }
      });
    },
  };
}
