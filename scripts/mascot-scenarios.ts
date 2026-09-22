/**
 * mascot-scenarios — behavioural regression check for the mascot controller.
 *
 *   npm run test:mascot
 *
 * Drives the single controller through the scenarios in the brief (§28) using
 * the real event API and real timers. It asserts the things that used to
 * break: stuck states, animation thrash from streaming, idle chatter
 * interrupting a live request, and invalid AI directives.
 */

import assert from 'node:assert/strict';
import { mascotController, parseMascotIntent, type MascotSnapshot } from '../src/components/mascot/soul';
import { mascot } from '../src/components/mascot/mascotBus';
import { FRAMES, rigOf, handsRig } from '../src/components/mascot/rig';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const snap = (): MascotSnapshot => mascotController.getSnapshot();

let failures = 0;
async function check(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures += 1;
    console.error(`  ✗ ${name}\n      ${(err as Error).message}`);
  }
}

/** Wait until the controller settles back to IDLE (or bail out). */
async function settle(timeout = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (snap().state === 'IDLE') return Date.now() - started;
    await sleep(50);
  }
  throw new Error(`never returned to IDLE (stuck in ${snap().state})`);
}

async function main() {
  console.log('\nmascot controller scenarios\n');

  // ---------------------------------------------------------------- 1 & 20
  await check('open / close chat repeatedly never sticks', async () => {
    for (let i = 0; i < 4; i += 1) {
      mascotController.dispatch({ type: 'CHAT_OPENED' });
      mascotController.dispatch({ type: 'CHAT_CLOSED' });
    }
    await settle();
  });

  // ---------------------------------------------------------------------- 2
  await check('normal question: notice → work → read → react → idle', async () => {
    const seen = new Set<string>();
    const off = mascotController.subscribe((s) => seen.add(s.state));
    mascotController.dispatch({ type: 'CHAT_MESSAGE_SENT' });
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    await sleep(500);
    assert.equal(snap().state, 'WORKING', 'must be working while the request is open');
    assert.ok(['PROCESSING', 'WORKING'].includes(snap().laptop), `laptop should be busy, got ${snap().laptop}`);
    mascotController.dispatch({ type: 'AI_REQUEST_COMPLETED', text: 'جواب معمولی درباره خدمات سایت.' });
    await sleep(400);
    assert.ok(['READING', 'REACTING'].includes(snap().state), `expected read/react, got ${snap().state}`);
    await settle();
    off();
    assert.ok(seen.has('WORKING') && seen.has('READING'), 'lifecycle states must be visited');
  });

  // ---------------------------------------------------------------------- 3
  await check('short question settles quickly (no forced timeline)', async () => {
    mascotController.dispatch({ type: 'CHAT_MESSAGE_SENT' });
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    await sleep(400);
    const t0 = Date.now();
    mascotController.dispatch({ type: 'AI_REQUEST_COMPLETED', text: 'بله.' });
    const dt = await settle();
    assert.ok(dt < 4000, `short answer must not linger (took ${dt}ms)`);
    assert.ok(Date.now() - t0 < 5000);
  });

  // ---------------------------------------------------------------------- 4
  await check('very long answer: reads longer but still settles', async () => {
    mascotController.dispatch({ type: 'CHAT_MESSAGE_SENT' });
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    await sleep(400);
    mascotController.dispatch({ type: 'AI_REQUEST_COMPLETED', text: 'الف '.repeat(1400) });
    const dt = await settle();
    assert.ok(dt > 500, 'a long answer should get a proportionally longer read');
    assert.ok(dt < 12000, `must not exceed the bounded read (took ${dt}ms)`);
  });

  // ---------------------------------------------------------------------- 5
  await check('very fast AI response is not padded', async () => {
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    await sleep(300); // minimum working hold
    mascotController.dispatch({ type: 'AI_REQUEST_COMPLETED', text: 'ok' });
    const dt = await settle(8000);
    assert.ok(dt < 5000, `fast response settled in ${dt}ms`);
  });

  // ---------------------------------------------------------------------- 6
  await check('slow AI response stays WORKING the whole time', async () => {
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    const scenes = new Set<string>();
    const off = mascotController.subscribe((s) => scenes.add(s.scene));
    for (let i = 0; i < 10; i += 1) {
      await sleep(300);
      assert.equal(snap().state, 'WORKING', 'must remain working while the request is open');
    }
    off();
    assert.ok(scenes.size > 1, 'a long wait should vary the sub-action (type/pause/check)');
    mascotController.dispatch({ type: 'AI_REQUEST_COMPLETED', text: 'done' });
    await settle();
  });

  // ---------------------------------------------------------------------- 7
  await check('streaming never thrashes the state', async () => {
    mascotController.dispatch({ type: 'CHAT_MESSAGE_SENT' });
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    await sleep(400);
    let changes = 0;
    let last = snap().state;
    const off = mascotController.subscribe((s) => {
      if (s.state !== last) {
        changes += 1;
        last = s.state;
      }
    });
    for (let i = 0; i < 200; i += 1) {
      mascotController.dispatch({ type: 'AI_REQUEST_STREAMING', text: 'token '.repeat(i) });
      await sleep(2);
    }
    assert.equal(changes, 0, '200 streaming deltas must not produce a single state change');
    assert.equal(snap().state, 'WORKING');
    off();
    mascotController.dispatch({ type: 'AI_REQUEST_COMPLETED', text: 'final' });
    await settle();
  });

  // ---------------------------------------------------------------------- 8
  await check('AI error → concerned, laptop ERROR, then settles', async () => {
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    await sleep(300);
    mascotController.dispatch({ type: 'AI_REQUEST_FAILED', text: 'boom' });
    await sleep(120);
    assert.equal(snap().state, 'ERROR');
    assert.equal(snap().laptop, 'ERROR');
    assert.equal(snap().expression, 'CONCERNED');
    await settle();
    assert.equal(snap().laptop, 'IDLE', 'laptop must not stay in the error state');
  });

  // ---------------------------------------------------------------------- 9
  await check('network failure recovers and chat keeps working', async () => {
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    await sleep(300);
    mascotController.dispatch({ type: 'AI_REQUEST_FAILED', text: 'network' });
    await settle();
    // the very next request still works
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    await sleep(300);
    assert.equal(snap().state, 'WORKING');
    mascotController.dispatch({ type: 'AI_REQUEST_COMPLETED', text: 'fine' });
    await settle();
  });

  // --------------------------------------------------------------------- 10
  await check('multiple messages quickly: no thrash, latest wins', async () => {
    let changes = 0;
    let last = snap().state;
    const off = mascotController.subscribe((s) => {
      if (s.state !== last) {
        changes += 1;
        last = s.state;
      }
    });
    for (let i = 0; i < 5; i += 1) {
      mascotController.dispatch({ type: 'CHAT_MESSAGE_SENT' });
      mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
      await sleep(40);
    }
    off();
    assert.ok(changes <= 4, `a burst of 5 messages caused ${changes} state changes`);
    assert.ok(['NOTICE_USER', 'LOOK_AT_LAPTOP', 'WORKING'].includes(snap().state), `expected to be at work, got ${snap().state}`);
    mascotController.dispatch({ type: 'AI_REQUEST_COMPLETED', text: 'last one' });
    await settle();
  });

  // --------------------------------------------------------------------- 11
  await check('navigating away mid-request cancels cleanly', async () => {
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    await sleep(300);
    mascotController.dispatch({ type: 'AI_REQUEST_CANCELLED' });
    await settle();
    assert.equal(snap().requestActive, false);
  });

  // --------------------------------------------------------------------- 12
  await check('idle chatter can never interrupt a live request', async () => {
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    await sleep(400);
    for (let i = 0; i < 5; i += 1) {
      mascotController.dispatch({ type: 'USER_IDLE' });
      mascotController.dispatch({ type: 'BUTTON_CLICKED' });
      mascotController.dispatch({ type: 'PAGE_CHANGED', label: 'about' });
      mascotController.dispatch({ type: 'USER_RETURNED' });
    }
    assert.equal(snap().state, 'WORKING', 'a live request must not be interrupted');
    mascotController.dispatch({ type: 'AI_REQUEST_COMPLETED', text: 'still here' });
    await settle();
  });

  // --------------------------------------------------------------------- 18
  await check('user return is noticed when idle', async () => {
    mascotController.dispatch({ type: 'USER_RETURNED' });
    await sleep(150);
    assert.equal(snap().gaze, 'USER');
    await settle();
  });

  // --------------------------------------------------------------------- 19
  await check('hard reset from any point', async () => {
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    await sleep(200);
    mascotController.reset();
    await settle();
    assert.equal(snap().requestActive, false);
  });

  // ----------------------------------------------------------------- intent
  await check('AI intent validation', () => {
    assert.deepEqual(parseMascotIntent({ action: 'WORKING', gaze: 'LAPTOP_SCREEN', expression: 'FOCUSED' }), {
      action: 'WORKING',
      gaze: 'LAPTOP_SCREEN',
      expression: 'FOCUSED',
    });
    assert.equal(parseMascotIntent({ action: 'DAB_ON_THEM' }), null, 'unknown action must be rejected');
    assert.equal(parseMascotIntent({ action: 'working' })?.action, 'WORKING', 'case is normalised, not rejected');
    assert.equal(parseMascotIntent({ action: 'dance' }), null, 'invented actions are rejected');
    assert.equal(parseMascotIntent({ action: 'WORKING', gaze: 'MOON' })?.gaze, undefined, 'bad gaze dropped');
    assert.equal(parseMascotIntent(null), null);
    assert.equal(parseMascotIntent('nope'), null);
    // legacy pose vocabulary still accepted (server fallback matcher)
    assert.equal(parseMascotIntent({ pose: 'confident' })?.action, 'REACTING');
    assert.equal(parseMascotIntent({ pose: 'thinking' })?.action, 'THINKING');
  });

  // ------------------------------------------------------------------- rig
  await check('rig: every scene frame exists and is anchored', () => {
    const names = Object.keys(FRAMES);
    assert.ok(names.length > 10);
    for (const n of names) {
      const t = rigOf(n);
      assert.ok(t.scale > 0.5 && t.scale < 2, `${n} scale out of range: ${t.scale}`);
      // the head anchor must land exactly on the configured anchor
      const f = FRAMES[n];
      assert.ok(Math.abs(t.scale * f.headCx + t.tx - 0.48) < 1e-6, `${n} head x not anchored`);
      assert.ok(Math.abs(t.scale * f.headTop + t.ty - 0.035) < 1e-6, `${n} head y not anchored`);
    }
    // hands land on the keyboard regardless of the frame they came from
    for (const n of ['typing-1', 'typing-2', 'typing-3']) {
      const t = handsRig(n);
      assert.ok(Math.abs(t.scale * 0.798 + t.ty - 0.775) < 1e-6, `${n}: hands not on the keys`);
    }
  });

  await check('unknown scene names fall back to idle', () => {
    mascot.scene('does-not-exist');
    assert.equal(mascot.currentScene, 'idle');
    assert.equal(mascot.currentFrame, 'idle');
  });

  console.log(`\n${failures === 0 ? 'PASS' : `FAIL (${failures})`}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
