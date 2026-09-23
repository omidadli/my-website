/**
 * mascotVideos.ts — the RENDER vocabulary of the soul's scenes.
 *
 * Division of labor (unchanged from the sprite era):
 *   soul.ts     → DECIDES (pose, hold, bubble, then — AI/journey/ambient/system)
 *   mascotBus   → TIMES it (scene, choreography steps, ttl, auto-return to idle)
 *   this file   → only maps each scene to the VISUAL asset that plays
 *                 (a <video> from /mascot/*.mp4, or the legacy sprite frame
 *                 when a state has no video yet).
 *
 * The video layer mirrors `SCENES` in mascotBus one-to-one, so the timing and
 * choreography the soul/bus decided is preserved — only the pixels change.
 *
 * ── pose → bus scene → asset (documented mapping) ────────────────────────────
 *   idle      → idle       → idle.mp4       (loop; start≈end frame)
 *   wave      → wave       → wave.mp4       (one-shot; arms-crossed → wave → arms-crossed)
 *   (greet)   → greet      → wave.mp4       (alias of wave, same as the sprite era)
 *   happy     → laugh      → happy.mp4      (one-shot; laugh arc)
 *   excited   → celebrate  → excited.mp4 → happy.mp4   (choreography, ms mirror SCENES)
 *   thinking  → think      → thinking.mp4   (one-shot "thinking beat": stand → hand-on-chin;
 *                                            the bus still owns ttl/auto-idle)
 *   talking   → talk       → talking.mp4    (loop with seamless self-crossfade at the cut)
 *   sad       → sad        → sad.webp       (NO VIDEO YET → legacy sprite frame fallback)
 *   surprised → surprised  → surprised.mp4  (one-shot; the bus scene's trailing idle step
 *                                            is honored by the bus auto-return)
 *   confused  → puzzled    → confused.mp4   (one-shot)
 *   confident → flex       → confident.mp4  (one-shot: puts on shades → arms crossed)
 *   sleepy    → sleepy     → sleepy.mp4     (one-shot yawn)
 *   typing    → typing     → typing.mp4     (loop — system-reserved, clean continuous loop)
 *   listen    → listen     → talking-b/idle sprite frames (NO VIDEO YET → legacy frames)
 *   (oops)    → oops       → surprised.mp4 → sad.webp (mirrors the sprite choreography)
 *
 * Looping policy (decided by WATCHING each clip, first vs last frame + motion):
 *   idle.mp4, typing.mp4  — true loops (start ≈ end) → cyclic self-crossfade.
 *   talking.mp4           — gesture arc that doesn't close → still a loop scene,
 *                           the cut is masked by the same self-crossfade.
 *   wave/happy/excited/thinking/surprised/confused/confident/sleepy
 *                         — one-shot arcs (start ≠ end) → play ONCE, hold the last
 *                           frame, and the bus's own hold/ttl/then drives the next state.
 *                         (per spec: one-shot finishes before yielding to idle)
 */

export interface MascotVisualStep {
  /** video asset name → /mascot/<v>.mp4 */
  v?: string;
  /** legacy sprite frame name (sprites.json) — fallback when no video exists */
  img?: string;
  /** legacy frame used as the <video poster> while the first frame loads */
  poster?: string;
  /** forced duration in ms for THIS step (choreography only — mirrors SCENES) */
  ms?: number;
  /** loop this step seamlessly (self-crossfade at the end instead of native loop) */
  loop?: boolean;
}

export interface MascotVisualScene {
  steps: MascotVisualStep[];
  /** the scene cycles through its steps forever until replaced (bus loop scenes) */
  loop: boolean;
}

const V = (v: string, extra: Partial<MascotVisualStep> = {}): MascotVisualStep => ({
  v,
  poster: v === 'typing' ? 'typing-1' : v,
  ...extra,
});
const I = (img: string, extra: Partial<MascotVisualStep> = {}): MascotVisualStep => ({ img, ...extra });

/** One visual asset per bus scene name (SCENES keys in mascotBus.ts). */
export const VIDEO_SCENES: Record<string, MascotVisualScene> = {
  // looping / system scenes
  idle: { loop: true, steps: [V('idle', { loop: true })] },
  typing: { loop: true, steps: [V('typing', { loop: true })] },
  talk: { loop: true, steps: [V('talking', { loop: true })] },
  listen: {
    loop: true,
    steps: [I('talking-b', { ms: 900 }), I('idle', { ms: 900 })], // no listen video yet
  },

  // finite one-shots (the bus auto-returns to idle on its own timers)
  wave: { loop: false, steps: [V('wave')] },
  greet: { loop: false, steps: [V('wave')] },
  laugh: { loop: false, steps: [V('happy')] },
  surprised: { loop: false, steps: [V('surprised')] },
  puzzled: { loop: false, steps: [V('confused')] },
  flex: { loop: false, steps: [V('confident')] },
  sleepy: { loop: false, steps: [V('sleepy')] },
  think: { loop: false, steps: [V('thinking')] },
  sad: { loop: false, steps: [I('sad')] }, // no sad video yet

  // choreographies — the per-step ms mirror SCENES in mascotBus.ts
  celebrate: {
    loop: false,
    steps: [V('excited', { ms: 1600 }), V('happy', { ms: 1500 })],
  },
  oops: {
    loop: false,
    steps: [V('surprised', { ms: 1300 }), I('sad', { ms: 2600 })],
  },
};

export const videoSrc = (step: MascotVisualStep): string | null =>
  step.v ? `/mascot/${step.v}.mp4` : null;
