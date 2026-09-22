/**
 * mascotBus — the BODY. It owns the frame clock and nothing else.
 *
 * The soul (controller) decides *what* the character does; this module decides
 * *which frame is on screen right now* and runs the single timer that advances
 * it. Because the clock lives here, the corner avatar and the chat avatar can
 * never drift apart, and unmounting every subscriber stops the timer (no
 * orphaned interval ticking into a dead component).
 *
 *   soul.dispatch() → mascot.scene('typing') → frame clock → <MascotWorkstation/>
 */

import { FRAMES } from './rig';

export type MascotStep = { f: string; ms: number };

export interface MascotSceneDef {
  frames: MascotStep[];
  /** keep cycling until replaced */
  loop?: boolean;
  /**
   * Safety net only. A looping scene is normally replaced by a real lifecycle
   * event; the ttl guarantees it can never loop forever if that event is lost.
   */
  ttl?: number;
}

/** Every frame referenced here must exist in `rig.FRAMES`. */
export const SCENES: Record<string, MascotSceneDef> = {
  idle: { frames: [{ f: 'idle', ms: 1000 }], loop: true },

  // ---------------------------------------------------------------- finite
  wave: { frames: [{ f: 'wave', ms: 2600 }] },
  greet: { frames: [{ f: 'wave', ms: 2400 }] },
  celebrate: { frames: [{ f: 'excited', ms: 1500 }, { f: 'happy', ms: 1400 }] },
  laugh: { frames: [{ f: 'happy', ms: 2400 }] },
  surprised: { frames: [{ f: 'surprised', ms: 2000 }, { f: 'idle', ms: 600 }] },
  sad: { frames: [{ f: 'sad', ms: 3200 }] },
  puzzled: { frames: [{ f: 'confused', ms: 2400 }] },
  flex: { frames: [{ f: 'confident', ms: 2800 }] },
  sleepy: { frames: [{ f: 'sleepy', ms: 3400 }] },
  oops: { frames: [{ f: 'surprised', ms: 1200 }, { f: 'sad', ms: 2200 }] },

  // ---------------------------------------------------------------- looping
  think: { frames: [{ f: 'thinking', ms: 900 }], loop: true, ttl: 20000 },
  typing: {
    frames: [
      { f: 'typing-1', ms: 170 },
      { f: 'typing-2', ms: 150 },
      { f: 'typing-3', ms: 170 },
      { f: 'typing-2', ms: 150 },
    ],
    loop: true,
    ttl: 120_000,
  },
  talk: {
    frames: [{ f: 'talking', ms: 190 }, { f: 'talking-b', ms: 210 }, { f: 'talking-c', ms: 160 }, { f: 'talking-b', ms: 210 }],
    loop: true,
    ttl: 20000,
  },
  listen: { frames: [{ f: 'talking-b', ms: 900 }, { f: 'idle', ms: 900 }], loop: true, ttl: 15000 },
};

export const FALLBACK_SCENE = 'idle';

type Listener = (scene: string, frame: string) => void;

class MascotBus {
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private ttlTimer: ReturnType<typeof setTimeout> | null = null;
  private current = FALLBACK_SCENE;
  private def = SCENES[FALLBACK_SCENE];
  private index = 0;

  get currentScene(): string {
    return this.current;
  }

  get currentFrame(): string {
    return this.def.frames[this.index]?.f ?? 'idle';
  }

  /** Register a renderer. Returns its unsubscribe. */
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.current, this.currentFrame);
    return () => {
      this.listeners.delete(fn);
      if (this.listeners.size === 0) this.stopClock();
    };
  }

  /** Play a scene. Replays are ignored so an event storm cannot restart a loop. */
  scene(name: string) {
    const def = SCENES[name] ?? SCENES[FALLBACK_SCENE];
    const changed = name !== this.current;
    this.current = SCENES[name] ? name : FALLBACK_SCENE;
    if (!changed) return;
    this.def = def;
    this.index = 0;
    this.emit();
    this.startClock();
    this.armTtl();
  }

  private emit() {
    const frame = this.def.frames[this.index]?.f ?? 'idle';
    this.listeners.forEach((fn) => fn(this.current, frame));
  }

  private startClock() {
    this.stopClock();
    if (this.def.frames.length < 2) return; // a still frame needs no timer
    const tick = () => {
      const step = this.def.frames[this.index];
      this.timer = setTimeout(() => {
        const next = this.index + 1;
        if (next < this.def.frames.length) this.index = next;
        else if (this.def.loop) this.index = 0;
        else return; // finite scene: hold the last frame
        this.emit();
        tick();
      }, Math.max(60, step?.ms ?? 120));
    };
    tick();
  }

  private stopClock() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private armTtl() {
    if (this.ttlTimer) clearTimeout(this.ttlTimer);
    this.ttlTimer = null;
    const ttl = this.def.ttl;
    if (!ttl) return;
    this.ttlTimer = setTimeout(() => this.scene(FALLBACK_SCENE), ttl);
  }
}

export const mascot = new MascotBus();

/** Warm the browser cache for every frame so the first loop never stutters. */
export function warmFrames() {
  const run = () => {
    Object.values(FRAMES).forEach((f) => {
      const im = new Image();
      im.src = f.src;
      im.decode?.().catch(() => undefined);
    });
  };
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
  if (ric) ric(run);
  else setTimeout(run, 1200);
}

if (typeof window !== 'undefined') {
  (window as unknown as { __mascot: MascotBus }).__mascot = mascot;
}
