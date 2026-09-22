import { Env, requireAuth, json, unauthorized } from './_shared';

/* Fallback: Persian → Finglish transliteration (no external API needed). */
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
 * POST /api/slug { title } → { ok, slug, source: 'gemini' | 'translit' }
 * Uses Gemini (GEMINI_API_KEY secret) to translate the Persian title into an
 * English URL slug; falls back to transliteration when no key/error.
 * Admin-only (kept private so nobody can burn your Gemini quota).
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireAuth(request, env);
  if (!user) return unauthorized();

  let title = '';
  try {
    title = String(((await request.json()) as { title?: string })?.title || '').trim();
  } catch {
    /* ignore */
  }
  if (!title) return json({ ok: false, error: 'عنوان خالی است.' }, { status: 400 });

  const geminiKey = (env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || '').trim();
  if (geminiKey) {
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
            signal: AbortSignal.timeout(8000),
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text:
                        `Convert this Persian page/post title into a short, SEO-friendly English URL slug.\n` +
                        `Rules: lowercase English words only, joined by single dashes, max 6 words, no dates, no stop words at the start, translate the meaning (do not transliterate).\n` +
                        `Respond with ONLY the slug, nothing else.\n\nTitle: ${title}`,
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
          }
        );
        if (res.ok) {
          const data: any = await res.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          const textPart = parts.find((p: any) => p.text && !p.thought) || parts[0];
          const text = textPart?.text || '';
          const slug = cleanSlug(text);
          if (slug) return json({ ok: true, slug, source: 'gemini' });
        }
      } catch {
        /* try next model */
      }
    }
  }

  return json({ ok: true, slug: cleanSlug(transliterate(title)) || 'page', source: 'translit' });
};
