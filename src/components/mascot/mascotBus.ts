/**
 * mascotBus — single source of truth for the mascot's acting.
 *
 * A SCENE = a frame sequence (sprite glyphs) + timing. Finite scenes
 * auto-return to `idle` when the sequence ends; looping scenes keep cycling
 * until replaced (with a safety ttl), so the AI-chat layer fully controls
 * long-running acts like `typing` and `talk`.
 *
 *   mascot.scene('greet')            → wave → excited → happy → idle
 *   mascot.scene('typing')           → loops until you play something else
 *   mascot.scene('talk', 6000)       → mouth/hand loop for ~6s → idle
 */

export type MascotStep = { f: string; ms: number };
export interface MascotSceneDef {
  frames: MascotStep[];
  /** keep cycling through frames until replaced */
  loop?: boolean;
  /** safety: a looping scene auto-returns to idle after this long */
  ttl?: number;
}

export const SCENES: Record<string, MascotSceneDef> = {
  idle: { frames: [{ f: 'idle', ms: 1000 }], loop: true },

  // finite one-shot scenes (auto → idle)
  wave: { frames: [{ f: 'wave', ms: 2600 }] },
  greet: { frames: [{ f: 'wave', ms: 2600 }] },
  celebrate: {
    frames: [
      { f: 'excited', ms: 1600 },
      { f: 'happy', ms: 1500 },
    ],
  },
  laugh: { frames: [{ f: 'happy', ms: 2600 }] },
  surprised: {
    frames: [
      { f: 'surprised', ms: 2200 },
      { f: 'idle', ms: 0 },
    ],
  },
  sad: { frames: [{ f: 'sad', ms: 4000 }] },
  puzzled: { frames: [{ f: 'confused', ms: 2600 }] },
  flex: { frames: [{ f: 'confident', ms: 3000 }] },
  sleepy: { frames: [{ f: 'sleepy', ms: 3800 }] },
  oops: {
    frames: [
      { f: 'surprised', ms: 1300 },
      { f: 'sad', ms: 2600 },
    ],
  },

  // looping scenes (driven by the chat layer / cues, with safety ttls)
  think: { frames: [{ f: 'thinking', ms: 900 }], loop: true, ttl: 20000 },
  typing: {
    frames: [
      { f: 'typing-1', ms: 150 },
      { f: 'typing-2', ms: 140 },
      { f: 'typing-3', ms: 150 },
      { f: 'typing-2', ms: 140 },
    ],
    loop: true,
    ttl: 60000,
  },
  talk: {
    frames: [
      { f: 'talking', ms: 150 },
      { f: 'talking-b', ms: 170 },
      { f: 'talking-c', ms: 130 },
      { f: 'talking-b', ms: 170 },
    ],
    loop: true,
    ttl: 20000,
  },
  listen: {
    frames: [
      { f: 'talking-b', ms: 900 },
      { f: 'idle', ms: 900 },
    ],
    loop: true,
    ttl: 15000,
  },
};

type Listener = (scene: string) => void;

class MascotBus {
  private listeners = new Set<Listener>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private current: string = 'idle';

  get currentScene(): string {
    return this.current;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.current);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** Play a scene. `ttl` overrides a looping scene's safety timer. */
  scene(name: string, ttl?: number) {
    const def = SCENES[name] ?? SCENES.idle;
    this.current = name;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.listeners.forEach((fn) => fn(name));

    const total = def.frames.reduce((a, s) => a + s.ms, 0);
    if (!def.loop && total > 0) {
      this.timers.push(setTimeout(() => this.scene('idle'), total));
    } else if (def.loop) {
      const guard = ttl ?? def.ttl;
      if (guard) this.timers.push(setTimeout(() => this.scene('idle'), guard));
    }
  }
}

export const mascot = new MascotBus();

if (typeof window !== 'undefined') {
  (window as unknown as { __mascot: MascotBus }).__mascot = mascot;
}
