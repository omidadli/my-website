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
  TOOLS,
  getTool,
  buildToolSystemPrompt,
  resolveBehavior,
  callAiProvider,
  localToolAnswer,
  normalizePhone,
  isValidIranMobile,
  genCode,
  signAccessToken,
  verifyAccessToken,
  scopeCovers,
  type AiSettings,
} from './lib/tools';
import { getPlan, resolveFreeTrial } from './lib/toolPlans';
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
const TOOL_ACCESS_FILE = path.resolve(process.cwd(), '.dev-tool-access.json');
const TOOL_MSGS_FILE = path.resolve(process.cwd(), '.dev-tool-msgs.json');
const TOOL_SETTINGS_FILE = path.resolve(process.cwd(), '.dev-tool-settings.json');
const TOOL_TRIALS_FILE = path.resolve(process.cwd(), '.dev-tool-trials.json');
// Dev-only signing secret for AI-tool access tokens (prod uses env.AUTH_SECRET).
const DEV_TOOL_SECRET = process.env.AUTH_SECRET || 'dev-tool-secret-v1';

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
                persona: data?.CHAT_CONFIG?.persona || 'شما مسکات هوشمند و منتور ارشد پرفورمنس مارکتینگ و CRO امید عدلی هستید؛ با لحن بسیار حرفه‌ای، خوش‌برخورد، داده‌محور و راهگشا پاسخ دهید.',
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

                const candidateModels = [
                  'gemini-2.5-flash',
                  'gemini-flash-latest',
                  'gemini-3.5-flash',
                  'gemini-3.1-flash-lite',
                ];

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

          // --- 3b. /api/tools --- (dev mirror of functions/api/tools.ts)
          if (pathname === '/api/tools') {
            const isAdmin = String(req.headers['authorization'] || '').startsWith('Bearer ');
            type DevGrant = { id: string; phone: string; productId: string; code: string; status: string; maxDevices: number; messageQuota?: number; devices: string[]; note: string; createdAt: string; expiresAt: string };
            const grants = safeReadJson<DevGrant[]>(TOOL_ACCESS_FILE, []);
            type DevTrial = { deviceId: string; productId: string; count: number };
            const usageSinceDev = (phone: string, productId: string, sinceIso: string) => {
              const since = new Date(sinceIso).getTime();
              return safeReadJson<any[]>(TOOL_MSGS_FILE, []).filter((m) => m.phone === phone && m.productId === productId && new Date(m.createdAt).getTime() >= since).length;
            };
            type DevSettings = { productId: string; provider: string; baseUrl: string; model: string; apiKey: string };
            const readSettings = () => safeReadJson<DevSettings[]>(TOOL_SETTINGS_FILE, []);
            const maskKey = (k: string) => { const s = (k || '').trim(); return !s ? '' : s.length <= 8 ? '••••' : `${s.slice(0, 4)}••••${s.slice(-4)}`; };
            const contentData = () => (safeReadJson<{ data: any } | null>(CONTENT_FILE, null)?.data || seedData);
            const publicTool = (id: string) => {
              const t = getTool(id);
              if (!t) return null;
              const b = resolveBehavior(t, contentData());
              return { id: t.id, name: t.name, welcome: b.welcome, suggestions: b.suggestions, placeholder: b.placeholder };
            };
            const resolveSettings = (productId: string): AiSettings => {
              const row = readSettings().find((s) => s.productId === productId);
              const envKey = (process.env.GEMINI_API_KEY || '').trim();
              if (row && (row.apiKey || '').trim()) return { provider: (row.provider as any) || 'gemini', baseUrl: row.baseUrl || '', model: row.model || '', apiKey: row.apiKey };
              return { provider: 'gemini', baseUrl: '', model: row?.model || '', apiKey: envKey };
            };

            if (method === 'GET') {
              if (!isAdmin) return sendJson({ ok: false, error: 'فقط ادمین.' }, 401);
              const view = url.searchParams.get('view');
              if (view === 'messages') {
                const msgs = safeReadJson<any[]>(TOOL_MSGS_FILE, []);
                return sendJson({ ok: true, items: msgs.slice(0, 200).map((m) => ({ id: m.id, phone: m.phone, product_id: m.productId, question: m.question, answer: m.answer, created_at: m.createdAt })) });
              }
              if (view === 'settings') {
                const rows = readSettings();
                const envKey = (process.env.GEMINI_API_KEY || '').trim();
                const items = TOOLS.map((t) => {
                  const row = rows.find((x) => x.productId === t.id);
                  return { productId: t.id, name: t.name, provider: row?.provider || 'gemini', baseUrl: row?.baseUrl || '', model: row?.model || '', hasKey: !!(row?.apiKey || '').trim(), keyMask: maskKey(row?.apiKey || ''), usingEnvFallback: !(row?.apiKey || '').trim() && !!envKey };
                });
                return sendJson({ ok: true, items, envKeyPresent: !!envKey });
              }
              return sendJson({ ok: true, items: grants.map((g) => ({ ...g, devicesUsed: g.devices.length })) });
            }

            if (method === 'POST') {
              const body = await readBody();
              const action = String(body?.action || '');

              // ---- ADMIN ----
              if (action === 'grant' || action === 'revoke' || action === 'resetDevices' || action === 'setKey' || action === 'clearKey') {
                if (!isAdmin) return sendJson({ ok: false, error: 'فقط ادمین.' }, 401);
                if (action === 'setKey') {
                  const productId = String(body.productId || '');
                  if (!getTool(productId)) return sendJson({ ok: false, error: 'محصول نامعتبر است.' }, 400);
                  const rows = readSettings();
                  const provider = body.provider === 'openai' ? 'openai' : 'gemini';
                  const baseUrl = String(body.baseUrl || '').trim().slice(0, 200);
                  const model = String(body.model || '').trim().slice(0, 80);
                  const newKey = String(body.apiKey || '').trim();
                  const existing = rows.find((s) => s.productId === productId);
                  const apiKey = newKey || existing?.apiKey || '';
                  const next: DevSettings = { productId, provider, baseUrl, model, apiKey };
                  const idx = rows.findIndex((s) => s.productId === productId);
                  if (idx >= 0) rows[idx] = next; else rows.push(next);
                  safeWriteJson(TOOL_SETTINGS_FILE, rows);
                  return sendJson({ ok: true, hasKey: !!apiKey, keyMask: maskKey(apiKey) });
                }
                if (action === 'clearKey') {
                  const productId = String(body.productId || '');
                  safeWriteJson(TOOL_SETTINGS_FILE, readSettings().filter((s) => s.productId !== productId));
                  return sendJson({ ok: true });
                }
                if (action === 'grant') {
                  const phone = normalizePhone(String(body.phone || ''));
                  if (!isValidIranMobile(phone)) return sendJson({ ok: false, error: 'شماره موبایل معتبر نیست (مثال: 09xxxxxxxxx).' }, 400);
                  const productId = String(body.productId || 'all');
                  if (productId !== 'all' && !getTool(productId)) return sendJson({ ok: false, error: 'محصول نامعتبر است.' }, 400);
                  const plan = productId !== 'all' ? getPlan(productId, String(body.planId || '')) : undefined;
                  const days = Math.max(1, Math.min(3650, parseInt(String(body.days ?? plan?.durationDays ?? 30), 10) || 30));
                  const maxDevices = Math.max(1, Math.min(20, parseInt(String(body.maxDevices ?? plan?.maxDevices ?? 1), 10) || 1));
                  const messageQuota = Math.max(0, parseInt(String(body.messageQuota ?? plan?.messageQuota ?? 0), 10) || 0);
                  const note = String(body.note || '').slice(0, 200);
                  const expiresAt = new Date(Date.now() + days * 86400_000).toISOString();
                  const existing = grants.find((g) => g.phone === phone && g.productId === productId);
                  const code = existing && !body.newCode ? existing.code : genCode();
                  if (existing) {
                    existing.code = code; existing.status = 'active'; existing.maxDevices = maxDevices; existing.messageQuota = messageQuota; existing.note = note; existing.expiresAt = expiresAt; existing.createdAt = new Date().toISOString();
                    if (body.newCode) existing.devices = [];
                    safeWriteJson(TOOL_ACCESS_FILE, grants);
                    return sendJson({ ok: true, id: existing.id, phone, productId, code, maxDevices, messageQuota, expiresAt, refreshed: true });
                  }
                  const id = `ta-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
                  grants.unshift({ id, phone, productId, code, status: 'active', maxDevices, messageQuota, devices: [], note, createdAt: new Date().toISOString(), expiresAt });
                  safeWriteJson(TOOL_ACCESS_FILE, grants);
                  return sendJson({ ok: true, id, phone, productId, code, maxDevices, messageQuota, expiresAt });
                }
                if (action === 'revoke') {
                  const g = grants.find((x) => x.id === String(body.id || '')); if (g) g.status = 'revoked';
                  safeWriteJson(TOOL_ACCESS_FILE, grants); return sendJson({ ok: true });
                }
                if (action === 'resetDevices') {
                  const g = grants.find((x) => x.id === String(body.id || '')); if (g) g.devices = [];
                  safeWriteJson(TOOL_ACCESS_FILE, grants); return sendJson({ ok: true });
                }
              }

              // ---- unlock ----
              if (action === 'unlock') {
                const phone = normalizePhone(String(body.phone || ''));
                const code = String(body.code || '').trim().toUpperCase();
                const productId = String(body.productId || '');
                const deviceId = String(body.deviceId || '').slice(0, 80);
                if (!isValidIranMobile(phone)) return sendJson({ ok: false, error: 'شماره موبایل معتبر نیست.' }, 400);
                if (!code) return sendJson({ ok: false, error: 'کد دسترسی را وارد کنید.' }, 400);
                if (!deviceId) return sendJson({ ok: false, error: 'شناسه دستگاه نامعتبر است.' }, 400);
                if (!getTool(productId)) return sendJson({ ok: false, error: 'محصول نامعتبر است.' }, 400);
                const grant = grants.find((g) => g.phone === phone && g.code === code && g.status === 'active' && scopeCovers(g.productId, productId));
                if (!grant) return sendJson({ ok: false, error: 'شماره یا کد دسترسی درست نیست. اگر خرید کرده‌ای، از پشتیبانی کمک بگیر.' }, 403);
                if (grant.expiresAt && new Date(grant.expiresAt).getTime() < Date.now()) return sendJson({ ok: false, error: 'دسترسی شما منقضی شده است. برای تمدید پیام بده.' }, 403);
                if (!grant.devices.includes(deviceId)) {
                  if (grant.devices.length >= grant.maxDevices) return sendJson({ ok: false, error: `این دسترسی روی حداکثر تعداد مجازِ دستگاه (${grant.maxDevices}) فعال شده است. برای دستگاه جدید با پشتیبانی هماهنگ کن.` }, 403);
                  grant.devices.push(deviceId); safeWriteJson(TOOL_ACCESS_FILE, grants);
                }
                const exp = grant.expiresAt ? Math.min(new Date(grant.expiresAt).getTime(), Date.now() + 30 * 86400_000) : Date.now() + 30 * 86400_000;
                const token = await signAccessToken({ phone, scope: grant.productId, did: deviceId, gid: grant.id, exp }, DEV_TOOL_SECRET);
                return sendJson({ ok: true, token, expiresAt: new Date(exp).toISOString(), tool: publicTool(productId) });
              }

              // ---- session ----
              if (action === 'session') {
                const productId = String(body.productId || '');
                const deviceId = String(body.deviceId || '');
                const payload = await verifyAccessToken(String(body.token || ''), DEV_TOOL_SECRET);
                if (!payload || !scopeCovers(payload.scope, productId) || (deviceId && payload.did !== deviceId)) return sendJson({ ok: false, error: 'نشست نامعتبر است.' }, 401);
                const grant = grants.find((g) => g.id === payload.gid);
                if (!grant || grant.status !== 'active' || !grant.devices.includes(payload.did)) return sendJson({ ok: false, error: 'دسترسی لغو شده است.' }, 403);
                return sendJson({ ok: true, tool: publicTool(productId) });
              }

              // ---- chat (paid via token, or free-trial via device) ----
              if (action === 'chat') {
                const productId = String(body.productId || '');
                const deviceId = String(body.deviceId || '').slice(0, 80);
                const tool = getTool(productId);
                if (!tool) return sendJson({ ok: false, error: 'محصول نامعتبر است.' }, 400);

                const messages: { role: string; content: string }[] = Array.isArray(body?.messages) ? body.messages.slice(-12) : [];
                const question = String(messages[messages.length - 1]?.content || '').trim().slice(0, 2000);
                if (!question) return sendJson({ ok: false, error: 'پیام خالی است.' }, 400);

                const saved = safeReadJson<{ data: any } | null>(CONTENT_FILE, null);
                const data = saved?.data || seedData;

                const payload = await verifyAccessToken(String(body.token || ''), DEV_TOOL_SECRET);
                const paid = !!(payload && scopeCovers(payload.scope, productId) && (!deviceId || payload.did === deviceId));

                let trialInfo: { used: number; remaining: number; limit: number } | undefined;
                let grant: DevGrant | undefined;
                if (!paid) {
                  const limit = resolveFreeTrial(data);
                  if (limit <= 0 || !deviceId) return sendJson({ ok: false, error: 'برای استفاده از این ابزار، یکی از پلن‌ها را فعال کن.', code: 'locked' }, 401);
                  const trials = safeReadJson<DevTrial[]>(TOOL_TRIALS_FILE, []);
                  const t = trials.find((x) => x.deviceId === deviceId && x.productId === productId);
                  const used = t?.count || 0;
                  if (used >= limit) return sendJson({ ok: false, error: 'پیام‌های رایگان تمام شد. برای ادامه یکی از پلن‌ها را فعال کن.', code: 'trial_ended', trial: { used, remaining: 0, limit } }, 402);
                  trialInfo = { used: used + 1, remaining: Math.max(0, limit - (used + 1)), limit };
                } else {
                  grant = grants.find((g) => g.id === payload!.gid);
                  if (!grant || grant.status !== 'active' || !grant.devices.includes(payload!.did)) return sendJson({ ok: false, error: 'دسترسی شما فعال نیست. با پشتیبانی هماهنگ کن.', code: 'locked' }, 403);
                  if (grant.expiresAt && new Date(grant.expiresAt).getTime() < Date.now()) return sendJson({ ok: false, error: 'دسترسی شما منقضی شده است.', code: 'expired' }, 403);
                  if (grant.messageQuota && grant.messageQuota > 0) {
                    const used = usageSinceDev(payload!.phone, productId, grant.createdAt);
                    if (used >= grant.messageQuota) return sendJson({ ok: false, error: 'سهمیه‌ی پیام این پلن تمام شد. برای ادامه، پلن را ارتقا بده یا تمدید کن.', code: 'quota', quota: { limit: grant.messageQuota, used, remaining: 0 } }, 402);
                  }
                }

                const behavior = resolveBehavior(tool, data);
                const systemPrompt = buildToolSystemPrompt(tool, data);
                const settings = resolveSettings(productId);
                const history = messages.slice(0, -1)
                  .filter((m) => m.role === 'user' || m.role === 'model')
                  .map((m) => ({ role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model', content: String(m.content || '') }));
                let answer = '';
                let mode: 'ai' | 'local' = 'local';
                const aiText = await callAiProvider({ systemPrompt, history, question, temperature: behavior.temperature, settings, preferredModel: behavior.model });
                if (aiText) { answer = aiText; mode = 'ai'; }
                if (!answer) answer = localToolAnswer(tool, question);

                if (!paid && deviceId) {
                  const trials = safeReadJson<DevTrial[]>(TOOL_TRIALS_FILE, []);
                  const idx = trials.findIndex((x) => x.deviceId === deviceId && x.productId === productId);
                  if (idx >= 0) trials[idx].count += 1; else trials.push({ deviceId, productId, count: 1 });
                  safeWriteJson(TOOL_TRIALS_FILE, trials);
                }
                const msgs = safeReadJson<any[]>(TOOL_MSGS_FILE, []);
                msgs.unshift({ id: `tm-${Date.now()}`, phone: paid ? payload!.phone : `trial:${deviceId}`.slice(0, 60), productId, question, answer, createdAt: new Date().toISOString() });
                safeWriteJson(TOOL_MSGS_FILE, msgs.slice(0, 500));

                let quotaInfo: { limit: number; used: number; remaining: number } | undefined;
                if (paid && grant && grant.messageQuota && grant.messageQuota > 0) {
                  const used = usageSinceDev(payload!.phone, productId, grant.createdAt);
                  quotaInfo = { limit: grant.messageQuota, used, remaining: Math.max(0, grant.messageQuota - used) };
                }
                return sendJson({ ok: true, answer, mode, trial: trialInfo, quota: quotaInfo });
              }

              return sendJson({ ok: false, error: 'اکشن نامعتبر است.' }, 400);
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
