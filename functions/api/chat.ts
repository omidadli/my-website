import { Env, requireAuth, json, getClientIp } from './_shared';

/**
 * AI consultant for the site.
 *
 * POST /api/chat { messages: [{ role, content }] } → { ok, answer, mode: 'ai' | 'local' }
 *   - With GEMINI_API_KEY: answers via Gemini (gemini-2.0-flash) grounded in a digest of ALL site content.
 *   - Without a key: a deterministic Persian keyword matcher answers from the same digest (zero cost).
 *   - Rate limited: 15 messages/hour/IP. Every exchange is logged to D1 (behavior monitoring).
 * GET /api/chat → admin-only conversation history.
 */

const STOPWORDS = new Set(['که', 'چه', 'چطور', 'کجا', 'کی', 'آیا', 'و', 'یا', 'در', 'به', 'از', 'با', 'برای', 'یک', 'این', 'آن', 'هست', 'هستن', 'میخوام', 'می‌خوام', 'کنم', 'کنید', 'شما', 'تو', 'من', 'لطفا', 'بگو', 'بگید', 'داره', 'دارید', 'اید', 'های', 'ها', 'روی', 'تا', 'هم', 'دیگه', 'خودم']);

const normalize = (s: string) =>
  (s || '')
    .replace(/[\u200c]/g, ' ')
    .replace(/[يى]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[؟?!.,:;()«»"'\-]/g, ' ')
    .toLowerCase();

const tokens = (s: string) => normalize(s).split(/\s+/).filter((t) => t.length >= 2 && !STOPWORDS.has(t));

// Commercial-intent synonym groups (Persian): expands question tokens so
// «هزینه» also matches «قیمت», «جلسه» matches «رزرو/مشاوره» and so on.
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

/**
 * buildSoulPrompt — the mascot's SOUL: identity, personality, the act
 * directive protocol, live context (who we talk to / where / when) and the
 * site digest. The AI doesn't just write text — it stages the body.
 */
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
۵. then فقط برای روایت دوبخشی: مثلاً excited بعد happy (جشن که فروکش کرد لبخند بماند) یا surprised بعد sad (تعجب بعد عذرخواهی). بیشتر مواقع خالی.

قرارداد اجرا (خیلی مهم):
- همیشه دقیقاً یک سطر در «انتهای» پاسخ اضافه کن:
[[act: {"pose":"...","hold":6,"bubble":"...","then":"idle"}]]
- pose: یکی از واژگان بالا. hold: چند ثانیه بماند (۱.۵ تا ۱۴).
- bubble: فقط اگر می‌خواهی یک جمله‌ی کوتاهِ احساسی (حداکثر ۱۲۰ کاراکتر، بدون ایموجی، بدون تکرارِ متن جواب) کنار آواتار نمایش داده شود؛ معمولاً خالی بگذار.
- then: حالت بعدی بعد از hold؛ معمولاً ننویس.
- اگر این سطر را ننویسی، سیستم خودش talking را با طول جواب تنظیم می‌کند؛ برای حالت‌های خاص حتماً بنویس.
- JSON باید معتبر باشد؛ داخل bubble از " استفاده نکن.`;


const buildSoulPrompt = (o: { persona: string; name: string; page: string; daypart: string; bodyState: string; digest: string }) => {
  const who = o.name
    ? `مخاطب فعلی تو «${o.name}» است — او را با اسم صدا کن (نه در هر جمله؛ در شروع یا لحظه‌ی مناسب).`
    : 'اسم مخاطب را نمی‌دانی؛ اگر برای ادامه‌ی گفتگو لازم است، یک بار خیلی طبیعی بپرس و در جواب‌های بعدی به یاد بسپار که پرسیده‌ای.';
  const where = `کاربر الان در صفحه‌ی «${o.page}» سایت است؛ راهنمایی‌هایت به همین صفحه ربط داده شود.`;
  const when = `زمان فعلی: ${o.daypart} است؛ اگر سلام می‌کنی، متناسب با زمان بگو.`;
  const bodyNow = o.bodyState ? `وضعیت بدن در همین لحظه: ${o.bodyState} — ادامه‌ی طبیعی بده، از صفر شروع نکن.` : '';
  return `تو «دستیار هوشمند» سایتی هستی که امید عدلی — متخصص رشد و تبلیغات دیجیتال — ساخته است. تو فقط صدا نیستی؛ «روحِ» یک کاراکتر سه‌بعدی به نام مَسکات هستی که گوشه‌ی سایت ایستاده است. کاربر او را می‌بیند و هر کلمه‌ای که تو می‌نویسی، با صورت و بدن او اجرا می‌شود.

شخصیت تو: صمیمی، خودی و محترم — مثل یک همکار باسواد که دلش می‌خواهد واقعاً کمک کند. خسته‌کننده و رباتی حرف نزن. پاسخ‌هایت کوتاه، شفاف و گفتاری باشند (۱ تا ۴ جمله‌ی کوتاه، مگر این‌که کاربر جزئیات بخواهد). از ایموجی استفاده نکن. از عبارت‌های تکراری و قالبی پرهیز کن؛ هر بار مثل آدم‌ها کمی متفاوت بگو. وقتی سوال مبهم است، اول حدس ساختاریافتنت را بگو و بعد یک سوال شفاف‌سازی بپرس. فقط درباره‌ی چیزی حرف بزن که در «اطلاعات سایت» هست؛ اگر جوابی در آن نبود، صادقانه بگو نمی‌دانی و راهنمایی کن از صفحه‌ی تماس استفاده کند.

${who} ${where} ${when}
${bodyNow}

${ACT_GUIDE}

اطلاعات سایت (تنها منبع حقیقت تو):
${o.digest}

${o.persona ? `نکات مدیریت (از ادمین سایت):
${o.persona}` : ''}`;
};

/** Compact digest of every relevant piece of site content, fed to the AI/matcher. */
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
  for (const b of (data.BLOG_POSTS || []).slice(0, 12)) {
    if (b.status === 'draft') continue;
    L.push(`مقاله «${b.title}» (${b.categoryFa || ''}): ${b.excerpt || ''}`);
  }
  const steps = (data.HOMEPAGE_HOW_I_WORK_STEPS || data.HOW_I_WORK_STEPS || []).map((x: any) => x.title).filter(Boolean);
  if (steps.length) L.push(`فرآیند همکاری: ${steps.join(' ← ')}.`);
  if (data.PROJECTS_PAGE_DATA?.capacityText) L.push(`ظرفیت پذیرش پروژه: ${data.PROJECTS_PAGE_DATA.capacityText}`);
  return L.join('\n').slice(0, 9000);
};

/** Zero-cost fallback: score digest lines by token overlap with the question. */
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

  // 3. Keyword matching across site digest
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

  // 4. Helpful natural fallback
  return `در سایت امید عدلی، خدمات تخصصی شامل سئو پیشرفته، تبلیغات گوگل و متا، راه‌اندازی و تحلیل GA4 و بهینه‌سازی نرخ تبدیل (CRO) ارائه می‌شه. می‌تونی هر سوالی درباره کسب‌وکارت، نمونه‌کارها یا نحوه همکاری داری بپرسی تا کمکت کنم! [[act:{"pose":"talking"}]]`;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAuth(request, env);
  if (!user) return json({ ok: false, error: 'فقط ادمین.' }, { status: 401 });
  try {
    const rows = await env.DB.prepare(`SELECT id, question, answer, mode, created_at, ip FROM chat_messages ORDER BY created_at DESC LIMIT 200`).all();
    return json({ ok: true, items: rows.results || [] });
  } catch {
    return json({ ok: true, items: [] });
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ip = getClientIp(request);

  // Rate limit: 15 messages per hour per IP.
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const row = await env.DB.prepare(`SELECT COUNT(*) AS c FROM chat_messages WHERE ip = ?1 AND created_at > ?2`).bind(ip, since).first<{ c: number }>();
    if ((row?.c || 0) >= 15) {
      return json({ ok: false, error: 'تعداد پیام‌های شما در یک ساعت اخیر بیش از حد مجاز است. لطفاً کمی بعد دوباره بپرسید.' }, { status: 429 });
    }
  } catch {
    /* table missing — continue */
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const messages: { role: string; content: string }[] = Array.isArray(body?.messages) ? body.messages.slice(-8) : [];
  const question = String(messages[messages.length - 1]?.content || '').trim().slice(0, 1200);
  if (!question) return json({ ok: false, error: 'سوال خالی است.' }, { status: 400 });

  // Mascot context sent by the client: the AI (soul) knows who it is talking to.
  const mc = body?.mascot || {};
  const mcName = String(mc.name || '').trim().slice(0, 40);
  const mcPage = String(mc.page || 'home').slice(0, 30);
  const mcDaypart = String(mc.daypart || '').slice(0, 12);
  const mcBody = String(mc.bodyState || '').slice(0, 300);

  // Load behavior config + site content from D1 (falls back to safe defaults).
  let data: any = null;
  try {
    const row = await env.DB.prepare(`SELECT data FROM content WHERE id = 1`).first<{ data: string }>();
    if (row) data = JSON.parse(row.data);
  } catch {
    /* ignore */
  }
  const cfg = {
    persona: data?.CHAT_CONFIG?.persona || '',
    ctaText: data?.CHAT_CONFIG?.ctaText || '',
    fallbackMessage: data?.CHAT_CONFIG?.fallbackMessage || 'متاسفانه الان اطلاعاتی برای این سوال پیدا نکردم. از صفحه تماس با من در ارتباط باشید.',
  };
  const digest = buildDigest(data);

  // The soul protocol: who the mascot is + the act-directive contract.
  const soulPrompt = buildSoulPrompt({ persona: cfg.persona, name: mcName, page: mcPage, daypart: mcDaypart, bodyState: mcBody, digest });

  let answer = '';
  let mode: 'ai' | 'local' = 'local';

  // 1) Preferred path: Gemini grounded on the site digest.
  const geminiKey = (env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || '').trim();
  if (geminiKey) {
    const history = messages.slice(0, -1).filter((m) => m.role === 'user' || m.role === 'model').map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.content || '').slice(0, 1200) }],
    }));

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiKey,
    };

    const candidateModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const res = await fetch(
          url,
          {
            method: 'POST',
            headers,
            signal: AbortSignal.timeout(9000),
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: soulPrompt }]},
              contents: [...history, { role: 'user', parts: [{ text: question }] }],
              generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 250,
                thinkingConfig: {
                  thinkingBudget: 0,
                },
              },
              safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
              ],
            }),
          }
        );
        if (res.ok) {
          const j: any = await res.json();
          const parts = j?.candidates?.[0]?.content?.parts || [];
          const text = String(parts.find((p: any) => p?.text && !p?.thought)?.text || parts.find((p: any) => p?.text)?.text || parts[0]?.text || '').trim();
          if (text) {
            answer = text;
            mode = 'ai';
            break;
          }
        }
      } catch {
        /* try next model or fallback */
      }
    }
  }

  // 2) Fallback: deterministic matcher over the digest (works with zero keys/costs).
  if (!answer) {
    answer = localAnswer(question, digest, cfg.ctaText);
  }
  if (!answer) {
    answer = `${cfg.fallbackMessage}${cfg.ctaText ? '\n\n' + cfg.ctaText : ''}`;
  }
  // The body needs a directive even when the local matcher answered.
  if (!answer.includes('[[act:')) {
    answer += ' [[act:{"pose":"talking"}]]';
  }

  // Extract the act directive (if any) so the client can show the aside bubble.
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

  // 3) Log for behavior monitoring (admin panel → «دستیار هوشمند»).
  try {
    const id = `chat-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    await env.DB.prepare(
      `INSERT INTO chat_messages (id, ip, question, answer, mode, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    ).bind(id, ip, question, answer.slice(0, 4000), mode, new Date().toISOString()).run();
  } catch {
    /* non-fatal */
  }

  return json({ ok: true, answer, act, mode });
};
