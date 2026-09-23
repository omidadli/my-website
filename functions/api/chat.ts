import { Env, requireAuth, json, getClientIp } from './_shared';
import {
  buildDigest,
  buildSoulPrompt,
  buildSourcesBlock,
  localAnswer,
  retrieveSources,
  type SourceHit,
} from '../../lib/assistant';

/**
 * AI consultant for the site.
 *
 * POST /api/chat { messages: [{ role, content }], mascot?: { name, page, daypart, bodyState } }
 *   → { ok, answer, act, mode: 'ai' | 'local', sources: [{ title, url }] }
 *
 * The brain lives in lib/assistant.ts (shared with vite-dev-api.ts so dev and
 * production never drift):
 *   - With GEMINI_API_KEY: answers via Gemini grounded in a digest of ALL site
 *     content + full-text retrieval (RAG) over every published blog post.
 *     When the question is answered from an article, the AI cites the
 *     article link as the source.
 *   - Without a key: a deterministic Persian keyword matcher answers from the
 *     same digest and cites the best-matching article (zero cost).
 *   - The AI stages the mascot's body via the `[[act:{...}]]` contract — the
 *     frontend (soul.ts) turns it into video scenes.
 *   - Rate limited: 15 messages/hour/IP. Every exchange is logged to D1.
 * GET /api/chat → admin-only conversation history.
 */

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

  // 1) The AI's ground truth: digest of ALL site content…
  const digest = buildDigest(data);
  // 2) …plus RAG: the full text of the articles this question actually touches,
  //    each with its URL so the AI can cite it as the source.
  const sources: SourceHit[] = retrieveSources(data, question, 3);
  const sourcesBlock = buildSourcesBlock(sources);

  // The soul protocol: who the mascot is + the act-directive contract.
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

  // 1) Preferred path: Gemini grounded on the site digest + article sources.
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
    answer = localAnswer(question, digest, cfg.ctaText, sources);
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

  return json({ ok: true, answer, act, mode, sources: sources.map(({ title, url }) => ({ title, url })) });
};
