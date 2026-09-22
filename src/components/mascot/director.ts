/**
 * director.ts — the mascot's nervous system + the AI's body-control API.
 *
 * Architecture (soul ↔ body):
 *
 *   AI (soul)      --directives [[act:{…}]]-->  DIRECTOR (this file)
 *   journey events --reflexes---------------->  priority + guards
 *                                              + validation
 *                                                 |
 *                                                 v
 *                                            mascotBus -> figures
 *
 * The DIRECTOR is the ONLY way anyone may move the mascot:
 *   - it validates every act against a strict whitelist (a hallucinated
 *     directive can never break the body),
 *   - it enforces priorities: an AI act interrupts everything; journey
 *     reflexes never interrupt the AI; ambient chatter interrupts nothing,
 *   - it computes sensible hold-times and auto-returns to idle,
 *   - it owns the shared context (user name, page, time-of-day) that is
 *     sent to the AI with every chat request, closing the loop:
 *     context -> AI -> directive -> body -> user sees a living creature.
 */

import { mascot } from './mascotBus';

// ---------------------------------------------------------------------------
// vocabulary — the complete body language the soul may use
// ---------------------------------------------------------------------------

export const ACT_POSES = [
  'idle',
  'wave',
  'happy',
  'excited',
  'thinking',
  'talking',
  'sad',
  'surprised',
  'confused',
  'confident',
  'sleepy',
  'typing',
  'listen',
] as const;
export type ActPose = (typeof ACT_POSES)[number];

export interface ActSpec {
  pose: ActPose;
  /** seconds to hold before returning to idle (clamped 1.5–14) */
  hold?: number;
  /** optional short SPOKEN line for the corner bubble (chat shows the answer) */
  bubble?: string;
  /** optional follow-up pose after `hold` (default idle) */
  then?: ActPose;
}

// ---------------------------------------------------------------------------
// context — what the soul knows about the moment
// ---------------------------------------------------------------------------

const state = { name: '', page: 'home' };

export function directorSetContext(ctx: { name?: string; page?: string }) {
  if (ctx.name !== undefined) state.name = ctx.name;
  if (ctx.page !== undefined) state.page = ctx.page;
}

export function directorGetContext() {
  const h = new Date().getHours();
  const daypart = h >= 5 && h < 12 ? 'صبح' : h >= 12 && h < 15 ? 'ظهر' : h >= 15 && h < 19 ? 'عصر' : 'شب';
  return { name: state.name, page: state.page, daypart, timeGreet: `${daypart}ت بخیر` };
}

// ---------------------------------------------------------------------------
// priority + guard bookkeeping
// ---------------------------------------------------------------------------

export type ActSource = 'ai' | 'journey' | 'ambient';

const PRIORITY: Record<ActSource, number> = { ai: 3, journey: 2, ambient: 1 };
let LAST_ACT = { source: 'system' as string, at: 0 };

const clampHold = (s?: number): number => {
  const v = typeof s === 'number' && isFinite(s) ? s : 5;
  return Math.min(14, Math.max(1.5, v));
};

const isPose = (p: unknown): p is ActPose => ACT_POSES.includes(p as ActPose);

// ---------------------------------------------------------------------------
// public API
// ---------------------------------------------------------------------------

/**
 * Perform a validated act. Returns false when rejected (unknown pose, or a
 * lower-priority source tried to interrupt).
 */
export function performAct(spec: ActSpec, source: ActSource): boolean {
  if (!spec || !isPose(spec.pose)) return false;

  const now = Date.now();
  const lastPriority = PRIORITY[LAST_ACT.source as ActSource] ?? 9;
  // a newer act must be at least as important as the one on stage…
  if (now - LAST_ACT.at < 4000 && PRIORITY[source] < lastPriority) return false;
  // …and ambient may only speak when the body is resting
  if (source === 'ambient' && mascot.currentScene !== 'idle' && !mascot.currentScene.startsWith('pose:')) {
    return false;
  }

  const hold = clampHold(spec.hold);
  LAST_ACT = { source, at: now };

  // corner bubble (spoken line) — only meaningful when the chat is closed
  if (spec.bubble && typeof document !== 'undefined' && !document.body.classList.contains('chat-open')) {
    const text = String(spec.bubble).slice(0, 180);
    window.dispatchEvent(
      new CustomEvent('mascot:cues', { detail: { scene: spec.pose, text, ms: hold * 1000 } })
    );
  }

  mascot.scene(spec.pose, hold * 1000);
  if (spec.then && isPose(spec.then) && spec.then !== 'idle') {
    window.setTimeout(() => {
      if (LAST_ACT.source === source) mascot.scene(spec.then as ActPose, 3000);
    }, hold * 1000);
  }
  return true;
}

/** rough speech-duration estimate: ~14 chars/second spoken Persian */
export function guessHold(text: string): number {
  return Math.min(12, Math.max(3.5, (String(text || '').length / 14) * 1.15));
}

/**
 * The AI's entry point: parse `[[act:{…}]]` out of a raw model answer,
 * strip it from the display text, and perform the requested acting.
 * Returns the clean human-readable answer.
 */
export function applyAIRawAnswer(raw: string): { text: string; applied: boolean } {
  const rawText = String(raw || '');
  const m = rawText.match(/\[\[act:\s*(\{[\s\S]*?\})\s*\]\]/i);
  let text = rawText;
  let applied = false;

  if (m) {
    text = (rawText.slice(0, m.index) + ' ' + rawText.slice(m.index + m[0].length)).replace(/\s{2,}/g, ' ').trim();
    try {
      const spec = JSON.parse(m[1]) as ActSpec;
      applied = performAct({ pose: spec.pose, hold: spec.hold, bubble: spec.bubble, then: spec.then }, 'ai');
    } catch {
      applied = false; // malformed JSON → ignore, body stays calm
    }
  }

  // fallback acting so the body always matches the conversation
  if (!applied) {
    performAct({ pose: 'talking', hold: guessHold(text) }, 'ai');
  }
  return { text, applied };
}

/** Journey reflexes (copy, form success, …) — never interrupt the AI. */
export function journeyAct(spec: ActSpec) {
  performAct(spec, 'journey');
}

/** Debug/console access (window.__mascotDirector.performAct({...}, 'ai')). */
if (typeof window !== 'undefined') {
  (window as unknown as { __mascotDirector: unknown }).__mascotDirector = {
    performAct,
    applyAIRawAnswer,
    journeyAct,
    guessHold,
    directorGetContext,
    directorSetContext,
    ACT_POSES,
  };
}
