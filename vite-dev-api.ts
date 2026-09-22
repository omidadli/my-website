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
  for (const b of (data.BLOG_POSTS || []).slice(0, 12)) {
    if (b.status === 'draft') continue;
    L.push(`مقاله «${b.title}» (${b.categoryFa || ''}): ${b.excerpt || ''}`);
  }
  return L.join('\n').slice(0, 9000);
};

const localAnswer = (question: string, digest: string, cta: string): string => {
  const q = tokens(question);
  if (!q.length || !digest) return '';
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
      return { line, score: score / Math.max(1, Math.min(q.length, 6)) };
    })
    .filter((x) => x.score >= 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (!scored.length) return '';
  return scored.map((x) => `• ${x.line.trim()}`).join('\n') + (cta ? `\n\n${cta}` : '');
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

              const saved = safeReadJson<{ data: any } | null>(CONTENT_FILE, null);
              const data = saved?.data || {};
              const cfg = {
                persona: data?.CHAT_CONFIG?.persona || 'شما دستیار هوشمند امید عدلی (متخصص پرفورمنس مارکتینگ و CRO) هستید.',
                ctaText: data?.CHAT_CONFIG?.ctaText || 'برای مشاوره مستقیم یا بررسی پروژه، از منوی بالای سایت با امید عدلی تماس بگیرید.',
                fallbackMessage: data?.CHAT_CONFIG?.fallbackMessage || 'پاسخ دقیقی در محتوای سایت برای این مورد نیافتم؛ لطفاً مستقیماً از بخش تماس پیام دهید.',
              };
              const digest = buildDigest(data);

              let answer = '';
              let mode: 'ai' | 'local' = 'local';

              const geminiKey = process.env.GEMINI_API_KEY || '';
              if (geminiKey) {
                try {
                  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
                  const gRes = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(15000),
                    body: JSON.stringify({
                      systemInstruction: { parts: [{ text: `${cfg.persona}\n\nاطلاعات سایت:\n${digest}` }] },
                      contents: [{ role: 'user', parts: [{ text: question }] }],
                      generationConfig: {
                        temperature: 0.5,
                        maxOutputTokens: 800,
                      },
                    }),
                  });
                  if (gRes.ok) {
                    const gj: any = await gRes.json();
                    const parts = gj?.candidates?.[0]?.content?.parts || [];
                    const text = parts[0]?.text;
                    if (text) {
                      answer = text.trim();
                      mode = 'ai';
                    }
                  }
                } catch {
                  /* fallback to local matcher */
                }
              }

              if (!answer) {
                answer = localAnswer(question, digest, cfg.ctaText);
              }
              if (!answer) {
                answer = `${cfg.fallbackMessage}\n\n${cfg.ctaText}`;
              }

              return sendJson({ ok: true, answer, mode });
            }
          }

          // --- 4. /api/slug ---
          if (pathname === '/api/slug' && method === 'POST') {
            const body = await readBody();
            const title = String(body.title || '').trim();
            if (!title) return sendJson({ ok: false, error: 'عنوان خالی است.' }, 400);

            const geminiKey = process.env.GEMINI_API_KEY || '';
            if (geminiKey) {
              try {
                const gRes = await fetch(
                  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: AbortSignal.timeout(15000),
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
                        maxOutputTokens: 60,
                      },
                    }),
                  }
                );
                if (gRes.ok) {
                  const gj: any = await gRes.json();
                  const parts = gj?.candidates?.[0]?.content?.parts || [];
                  const slugCandidate = parts[0]?.text?.trim();
                  const cleaned = cleanSlug(slugCandidate || '');
                  if (cleaned) {
                    return sendJson({ ok: true, slug: cleaned, source: 'gemini' });
                  }
                }
              } catch {
                /* fallback to transliteration */
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
