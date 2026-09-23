import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import {
  buildDigest,
  buildSoulPrompt,
  buildSourcesBlock,
  localAnswer,
  retrieveSources,
  type SourceHit,
} from './lib/assistant';
import {
  PERSONAL_INFO,
  SERVICES,
  CASE_STUDIES,
  PRODUCTS,
  PROJECTS_PAGE_DATA,
  BLOG_POSTS,
  CHAT_CONFIG,
  HOMEPAGE_HOW_I_WORK_STEPS,
  HOW_I_WORK_STEPS,
} from './src/data/content';

// Dev parity with production: when the CMS has not saved content to
// .dev-content.json yet, the chat brain falls back to the SAME seed content
// the dev site renders from (src/data/content.ts — see ContentContext).
const seedData = {
  PERSONAL_INFO,
  SERVICES,
  CASE_STUDIES,
  PRODUCTS,
  PROJECTS_PAGE_DATA,
  BLOG_POSTS,
  CHAT_CONFIG,
  HOMEPAGE_HOW_I_WORK_STEPS,
  HOW_I_WORK_STEPS,
};

// Local dev persistent storage files
const CONTENT_FILE = path.resolve(process.cwd(), '.dev-content.json');
const COMMENTS_FILE = path.resolve(process.cwd(), '.dev-comments.json');
const MEDIA_FILE = path.resolve(process.cwd(), '.dev-media.json');
const LEADS_FILE = path.resolve(process.cwd(), '.dev-leads.json');

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

/**
 * NOTE: the assistant's brain (digest, article RAG, soul prompt, act protocol,
 * local matcher) lives in ./lib/assistant.ts — shared with functions/api/chat.ts
 * so local dev and production behave identically.
 */

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
        const method = req.method?.toUpperCase() || '';

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
              const data = saved?.data || seedData;
              const cfg = {
                persona: data?.CHAT_CONFIG?.persona || 'شما دستیار هوشمند امید عدلی (متخصص پرفورمنس مارکتینگ و CRO) هستید.',
                ctaText: data?.CHAT_CONFIG?.ctaText || 'برای مشاوره مستقیم یا بررسی پروژه، از منوی بالای سایت با امید عدلی تماس بگیرید.',
                fallbackMessage: data?.CHAT_CONFIG?.fallbackMessage || 'پاسخ دقیقی در محتوای سایت برای این مورد نیافتم؛ لطفاً مستقیماً از بخش تماس پیام دهید.',
              };

              // The AI's ground truth: digest of ALL site content…
              const digest = buildDigest(data);
              // …plus RAG: full text of the articles this question touches.
              const sources: SourceHit[] = retrieveSources(data, question, 3);
              const sourcesBlock = buildSourcesBlock(sources);

              const soulPrompt = buildSoulPrompt({
                persona: cfg.persona,
                name: mcName,
                page: mcPage,
                daypart: mcDaypart,
                bodyState: mcBody,
                digest,
                sources: sourcesBlock || undefined,
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
                      signal: AbortSignal.timeout(20000),
                      body: JSON.stringify({
                        systemInstruction: { parts: [{ text: soulPrompt }] },
                        contents: [...history, { role: 'user', parts: [{ text: question }] }],
                        generationConfig: {
                          temperature: 0.6,
                          maxOutputTokens: 600,
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
                answer = localAnswer(question, digest, cfg.ctaText, sources);
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

              return sendJson({ ok: true, answer, act, mode, sources: sources.map(({ title, url }) => ({ title, url })) });
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

          // --- 5. /api/leads --- (dev mirror of functions/api/leads.ts)
          if (pathname === '/api/leads') {
            const leads = safeReadJson<any[]>(LEADS_FILE, []);
            if (method === 'GET') {
              const auth = req.headers['authorization'] || '';
              if (!auth.startsWith('Bearer ')) {
                return sendJson({ ok: false, error: 'فقط ادمین.' }, 401);
              }
              return sendJson({ ok: true, items: leads });
            }
            if (method === 'POST') {
              const body = await readBody();
              if (body?.homepage) {
                return sendJson({ ok: true, id: 'ignored' }); // honeypot
              }
              const name = String(body?.name || '').trim().slice(0, 80);
              const email = String(body?.email || '').trim().slice(0, 160);
              const contact = String(body?.contact || '').trim().slice(0, 40);
              if (!name || (!email && !contact) || !String(body?.details || '').trim()) {
                return sendJson({ ok: false, error: 'لطفاً نام و حداقل ایمیل یا شماره تماس و توضیحات را تکمیل کنید.' }, 400);
              }
              const lead = {
                id: `lead-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                source: String(body?.source || 'contact').slice(0, 20),
                name,
                email,
                contact,
                website: String(body?.website || '').trim().slice(0, 200),
                goal: String(body?.goal || '').trim().slice(0, 200),
                service: String(body?.service || '').trim().slice(0, 200),
                details: String(body?.details || '').trim().slice(0, 2000),
                booking_date: String(body?.bookingDate || '').trim().slice(0, 40),
                booking_time: String(body?.bookingTime || '').trim().slice(0, 40),
                created_at: new Date().toISOString(),
                ip: 'localhost',
              };
              leads.unshift(lead);
              safeWriteJson(LEADS_FILE, leads.slice(0, 500));
              return sendJson({ ok: true, id: lead.id });
            }
          }

          // --- 6. /api/comments ---
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
                createdAt: new Date().toISOString(),
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
              if (idx >= 0) {
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
