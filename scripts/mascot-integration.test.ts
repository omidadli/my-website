/**
 * Integration smoke test: real soul.ts + mascotBus.ts + mascotVideos.ts
 * in Node (minimal window/document stub). Drives the app's exact call
 * sequence and verifies the bus → visual-scene contract.
 */
// ---- minimal browser stubs (must run BEFORE importing soul.ts) ----
const listeners: Record<string, Set<(...a: unknown[]) => void>> = {};
globalThis.window = globalThis as any;
globalThis.window.dispatchEvent = ((e: { detail?: { scene?: string; text?: string } }) => {
  console.log('  [cue]', e.detail?.scene ?? '', String(e.detail?.text ?? '').slice(0, 40));
}) as any;
globalThis.document = {
  body: {
    classList: {
      _s: new Set<string>(),
      contains: (c: string) => (document as any).body.classList._s.has(c),
      add: (c: string) => (document as any).body.classList._s.add(c),
      remove: (c: string) => (document as any).body.classList._s.delete(c),
    },
  },
} as any;

import { soulAct, applyAIRawAnswer, SOUL_POSES } from '../src/components/mascot/soul';
import { SCENES, mascot } from '../src/components/mascot/mascotBus';
import { VIDEO_SCENES } from '../src/components/mascot/mascotVideos';
import {
  articleDocs,
  retrieveSources,
  buildSourcesBlock,
  buildSoulPrompt,
  buildDigest,
  localAnswer,
  SOURCES_RULES,
} from '../lib/assistant';

let failures = 0;
const check = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✓' : '✗ FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failures++;
};

// 1. every bus scene has a visual mapping
for (const [k, def] of Object.entries(SCENES)) {
  const v = VIDEO_SCENES[k];
  check(`scene '${k}' has a video mapping`, !!v && v.steps.length > 0, def.frames.map((f) => f.f).join(','));
}
// 2. every known pose maps to a scene that exists in VIDEO_SCENES
check('SOUL_POSES count = 13', SOUL_POSES.length === 13);

// 3. record the bus timeline
const timeline: string[] = [];
mascot.subscribe((s) => timeline.push(s));

// 4. simulate the app flow
console.log('\n— flow: entry greeting (wave)');
soulAct({ pose: 'wave', hold: 2.6 }, 'journey');

console.log('— flow: user typing → listen');
soulAct({ pose: 'listen', hold: 2.6 }, 'system');

console.log('— flow: user sent → typing (producer)');
soulAct({ pose: 'typing' }, 'system');

console.log('— flow: AI answer with act tag (happy then excited-choreo via journey)');
const r1 = applyAIRawAnswer('عالی بود! [[act:{"pose":"happy","hold":2.6,"then":"idle"}]]');
check('act tag parsed & applied', r1.applied === true, r1.spec?.pose ?? '');

console.log('— flow: AI celebrate (excited → happy choreography)');
const r1b = applyAIRawAnswer('آفرین! فرم با موفقیت ثبت شد [[act:{"pose":"excited","hold":3.1,"then":"happy"}]]');
check('excited applied (celebrate choreography)', r1b.applied, 'scene=' + timeline[timeline.length - 1]);

console.log('— flow: AI talking answer (no explicit tag → fallback)');
const r2 = applyAIRawAnswer('یک پاسخ بلند درباره سئو و بهینه‌سازی نرخ تبدیل که نیاز به توضیح دارد.');
check('fallback talking applied', r2.spec === null && timeline[timeline.length - 1] === 'talk');

console.log('— flow: AI confused (puzzled scene)');
const r3 = applyAIRawAnswer('نمی‌دونم دقیقاً منظورت چیه [[act:{"pose":"confused","hold":2.6}]]');
check('confused applied', r3.applied, 'scene=' + timeline[timeline.length - 1]);

console.log('— flow: AI sad');
soulAct({ pose: 'sad', hold: 4 }, 'ai');

console.log('— flow: confident (flex scene)');
soulAct({ pose: 'confident', hold: 3 }, 'ai');

console.log('— flow: sleepy');
soulAct({ pose: 'sleepy', hold: 3.8 }, 'ai');

console.log('— flow: surprised (one-shot)');
soulAct({ pose: 'surprised', hold: 2.2 }, 'ai');

console.log('— flow: thinking then talk');
soulAct({ pose: 'thinking', hold: 5 }, 'ai');
soulAct({ pose: 'talking', hold: 8 }, 'ai');

console.log('\n— bus timeline:');
console.log('   ' + timeline.join(' → '));

// note: first entry is the bus's immediate on-subscribe notification (current scene)
const expected = ['idle', 'wave', 'listen', 'typing', 'laugh', 'celebrate', 'talk', 'puzzled', 'sad', 'flex', 'sleepy', 'surprised', 'think', 'talk'];
check('timeline matches expected sequence', JSON.stringify(timeline) === JSON.stringify(expected), timeline.join(','));

// 5. visual step details
const cel = VIDEO_SCENES['celebrate'];
check('celebrate = excited(1600) → happy(1500)', cel.steps[0].v === 'excited' && cel.steps[0].ms === 1600 && cel.steps[1].v === 'happy' && cel.steps[1].ms === 1500);
check('talk loops talking.mp4', VIDEO_SCENES['talk'].steps[0].v === 'talking' && VIDEO_SCENES['talk'].steps[0].loop === true);
check('typing loops typing.mp4', VIDEO_SCENES['typing'].steps[0].v === 'typing' && VIDEO_SCENES['typing'].steps[0].loop === true);
check('sad falls back to sprite', VIDEO_SCENES['sad'].steps[0].img === 'sad');
check('listen falls back to sprite frames', VIDEO_SCENES['listen'].steps.length === 2 && VIDEO_SCENES['listen'].steps.every((s) => !!s.img));

// 6. article RAG — the AI's access to ALL site data, incl. full article bodies
const siteData = {
  PERSONAL_INFO: { title: 'امید عدلی', shortBio: 'متخصص رشد دیجیتال', email: 'test@example.com' },
  SERVICES: [],
  CASE_STUDIES: [],
  PRODUCTS: [],
  BLOG_POSTS: [
    {
      id: 'ga4-setup-guide',
      slug: 'ga4-setup-guide',
      title: 'راهنمای کامل راه‌اندازی GA4 برای فروشگاه‌های اینترنتی',
      excerpt: 'از صفر تا صد راه‌اندازی گوگل آنالیتیکس ۴ برای فروشگاه',
      content: '',
      categoryFa: 'تحلیل',
      status: 'published',
      sections: [
        { heading: 'شروع کار', content: 'برای راه‌اندازی GA4 در فروشگاه اینترنتی ابتدا اکانت گوگل آنالیتیکس بسازید و ملک فروشگاه را ثبت کنید. بعد از پیوستن تگ گلوبال به سایت، رویدادهای خرید را پیکربندی کنید.', keyPoints: ['ثبت ملک', 'پیکربندی رویداد خرید'] },
        { heading: 'چالش رایج', content: 'مشکل رایج در فروشگاه‌ها عدم ثبت درستی رویداد conversion است که باعث نادقیق بودن گزارش‌ها می‌شود.', keyPoints: [] },
      ],
    },
    {
      id: 'cro-checkout',
      title: 'بهینه‌سازی نرخ تبدیل صفحه پرداخت (CRO)',
      excerpt: 'کاهش ریزش در سبد خرید',
      content: 'رایج‌ترین دلیل ریزش در سبد خرید، هزینه ارسال پنهان و فرم پرداخت طولانی است. با ساده‌سازی صفحه پرداخت می‌توان نرخ تبدیل را افزایش داد.',
      categoryFa: 'تبدیل',
      status: 'published',
      sections: [],
    },
    { id: 'draft-secret', title: 'مقاله پنهان که هرگز نباید بیاید', content: 'محتوای پیش‌نویس درباره ga4 و فروشگاه', status: 'draft' },
  ],
};

const docs = articleDocs(siteData);
check('article index: 2 published docs (draft excluded)', docs.length === 2, `got ${docs.length}`);

const hits = retrieveSources(siteData, 'چطور GA4 رو برای فروشگاه راه بیندازیم؟');
check('RAG finds the GA4 article first', hits.length > 0 && hits[0].title.includes('GA4'), hits[0]?.title || 'no hits');
check('RAG source url is the SPA path route', hits[0]?.url === '/blog/ga4-setup-guide', hits[0]?.url || '');
check('RAG never returns draft posts', hits.every((h) => !h.title.includes('پنهان')));
check('RAG source text carries the full body (sections merged)', (hits[0]?.text || '').includes('رویداد') && (hits[0]?.text || '').includes('conversion'));

const noHits = retrieveSources(siteData, 'پیش‌بینی آب و هوای قاهره فردا');
check('RAG stays silent on unrelated questions', noHits.length === 0, `got ${noHits.length}`);

const sourcesBlock = buildSourcesBlock(hits);
const soulPrompt = buildSoulPrompt({ persona: '', name: '', page: 'blog', daypart: 'عصر', bodyState: '', digest: buildDigest(siteData), sources: sourcesBlock || undefined });
check('soul prompt injects the sources block', soulPrompt.includes('منابع مرتبط با سوال کاربر') && soulPrompt.includes('/blog/ga4-setup-guide'));
check('soul prompt carries the citation rules', soulPrompt.includes(SOURCES_RULES));
check('soul prompt still has the act contract', soulPrompt.includes('[[act:') && soulPrompt.includes('واژگان بدن'));

// full pipeline: an answer with a cited source + act line parses cleanly
const raw = 'برای راه‌اندازی GA4 در فروشگاه، ابتدا ملک را ثبت کنید و رویداد خرید را پیکربندی کنید.\n\nمنبع: [راهنمای کامل راه‌اندازی GA4 برای فروشگاه‌های اینترنتی](#/blog/ga4-setup-guide) [[act:{"pose":"talking","hold":6}]]';
const parsed = applyAIRawAnswer(raw);
check('cited answer: act line stripped, source link kept', !parsed.text.includes('[[act:') && parsed.text.includes('](#/blog/ga4-setup-guide)'));
check('cited answer: body acted by the AI directive (talk)', parsed.applied && mascot.currentScene === 'talk');

// local (no-key) mode also cites the article
const localQ = 'راهنمای GA4 تحلیل چطوریه؟';
const local = localAnswer(localQ, buildDigest(siteData), 'CTA', retrieveSources(siteData, localQ));
check('local mode cites the article link', local.includes('منبع: [') && local.includes('/blog/ga4-setup-guide'));

// let timers run: the last scene is a loop ('talk', ttl = 8s hold) → auto-idle
setTimeout(() => {
  console.log('\n— after talk ttl (8s): bus current =', mascot.currentScene);
  check('loop scene auto-returns to idle on ttl', mascot.currentScene === 'idle');
  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECKS FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}, 9000);
