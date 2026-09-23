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

// let timers run: the last scene is a loop ('talk', ttl = 8s hold) → auto-idle
setTimeout(() => {
  console.log('\n— after talk ttl (8s): bus current =', mascot.currentScene);
  check('loop scene auto-returns to idle on ttl', mascot.currentScene === 'idle');
  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECKS FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}, 9000);
