/**
 * mascotBus — a tiny global event bus that lets any part of the app drive
 * the avatar's behavior (the "Mascot State Machine" pattern):
 *
 *   User Action → Product State → mascot.set(mood) → Mascot Reaction
 *
 * Moods: idle | happy | excited | thinking | talking | sad | surprised
 * `set(mood, ttl)` holds a mood for `ttl` ms, then falls back to idle.
 */

export type MascotMood =
  | 'idle'
  | 'happy'
  | 'excited'
  | 'thinking'
  | 'talking'
  | 'sad'
  | 'surprised';

export type MascotListener = (mood: MascotMood) => void;

const HOLD_MS: Record<MascotMood, number> = {
  idle: 0,
  happy: 2600,
  excited: 3200,
  thinking: 12000,
  talking: 4200,
  sad: 3800,
  surprised: 2200,
};

class MascotBus {
  private listeners = new Set<MascotListener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private current: MascotMood = 'idle';

  get mood(): MascotMood {
    return this.current;
  }

  subscribe(fn: MascotListener): () => void {
    this.listeners.add(fn);
    fn(this.current);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** Set a mood; auto-reverts to idle after its hold time. */
  set(mood: MascotMood, ttl?: number) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.current = mood;
    this.listeners.forEach((fn) => fn(mood));
    const hold = ttl ?? HOLD_MS[mood];
    if (hold > 0) {
      this.timer = setTimeout(() => {
        this.current = 'idle';
        this.listeners.forEach((fn) => fn('idle'));
      }, hold);
    }
  }
}

export const mascot = new MascotBus();

/** Convenience for non-React code (CMS editors, handlers, etc.). */
if (typeof window !== 'undefined') {
  (window as unknown as { __mascot: MascotBus }).__mascot = mascot;
}
