/**
 * mascotBus — the mascot's "brain": a global scene director that any part of
 * the app can drive.
 *
 * A SCENE = a short choreography (sprite/glyph frames + optional speech line
 * + duration). Scenes can be simple (a single pose) or sequenced ("wave" for
 * 2.6s, then back to idle). Any component can request one:
 *
 *   mascot.scene('greet')
 *   mascot.speak('excited', 'خیالت راحت!', 3200)
 *
 * The avatar component subscribes and renders whatever scene is active.
 */

export type MascotPose =
  | 'idle'
  | 'wave'
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'talking'
  | 'sad'
  | 'surprised'
  | 'confused'
  | 'confident'
  | 'sleepy'
  | 'typing';

export interface MascotScene {
  /** steps: each step holds a pose for `ms` milliseconds */
  steps: Array<{ pose: MascotPose; ms: number }>;
  /** loop the last step until the scene is replaced (used for typing/talking) */
  loopLast?: boolean;
}

const SCENES: Record<string, MascotScene> = {
  idle: { steps: [{ pose: 'idle', ms: 60000 }] },
  greet: {
    steps: [
      { pose: 'wave', ms: 1500 },
      { pose: 'excited', ms: 1400 },
      { pose: 'idle', ms: Infinity },
    ],
  },
  celebrate: {
    steps: [
      { pose: 'excited', ms: 1600 },
      { pose: 'happy', ms: 1400 },
      { pose: 'idle', ms: Infinity },
    ],
  },
  laugh: {
    steps: [
      { pose: 'happy', ms: 2400 },
      { pose: 'idle', ms: Infinity },
    ],
  },
  think: { steps: [{ pose: 'thinking', ms: 14000 }], loopLast: true },
  typing: { steps: [{ pose: 'typing', ms: 14000 }], loopLast: true },
  talk: { steps: [{ pose: 'talking', ms: 14000 }], loopLast: true },
  oops: {
    steps: [
      { pose: 'surprised', ms: 1400 },
      { pose: 'sad', ms: 2600 },
      { pose: 'idle', ms: Infinity },
    ],
  },
  sad: { steps: [{ pose: 'sad', ms: 4200 }] },
  puzzled: {
    steps: [
      { pose: 'confused', ms: 2800 },
      { pose: 'idle', ms: Infinity },
    ],
  },
  flex: {
    steps: [
      { pose: 'confident', ms: 3000 },
      { pose: 'idle', ms: Infinity },
    ],
  },
  sleepy: {
    steps: [
      { pose: 'sleepy', ms: 4200 },
      { pose: 'idle', ms: Infinity },
    ],
  },
  surprised: {
    steps: [
      { pose: 'surprised', ms: 2200 },
      { pose: 'idle', ms: Infinity },
    ],
  },
};

type Listener = (scene: string) => void;

class MascotBus {
  private listeners = new Set<Listener>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private current = 'idle';

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

  /** Play a named scene. If `minMs` is given, keep it at least that long. */
  scene(name: string, minMs?: number) {
    const sc = SCENES[name] ?? SCENES.idle;
    this.current = name;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.listeners.forEach((fn) => fn(name));

    let t = 0;
    sc.steps.forEach((step) => {
      if (step.ms !== Infinity) {
        this.timers.push(setTimeout(() => undefined, 0));
        t += step.ms;
      }
    });

    // schedule end-of-scene → idle (unless the last step is a hold/loop)
    const lastHold = sc.steps[sc.steps.length - 1].ms === Infinity;
    const total = lastHold ? (minMs ?? 0) : Math.max(t, minMs ?? 0);
    if (total > 0 && total < 60000) {
      this.timers.push(setTimeout(() => this.scene('idle'), total));
    }
  }

  /** Convenience: hold a single pose glyph for a given duration. */
  pose(p: MascotPose, ms: number) {
    this.scene(`pose:${p}`, ms);
  }
}

export const mascot = new MascotBus();

if (typeof window !== 'undefined') {
  (window as unknown as { __mascot: MascotBus }).__mascot = mascot;
}
