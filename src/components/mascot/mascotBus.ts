/**
 * mascotBus — a tiny global event bus that lets any part of the app drive
 * the avatar's behavior (the "Mascot State Machine" pattern):
 *
 *   User Action → Product State → mascot.set(pose) → Mascot Reaction
 *
 * Each "pose" maps 1:1 to a sprite (a full-body render of the character with
 * its own facial expression AND body language — see public/mascot/*.webp).
 * `set(pose)` holds the pose for a few seconds, then falls back to idle.
 */

export type MascotPose =
  | 'idle' // arms crossed, warm smile
  | 'wave' // waving hello
  | 'happy' // laughing, eyes squinted
  | 'excited' // fist pump
  | 'thinking' // hand on chin, looking up
  | 'talking' // explaining gesture
  | 'sad' // apologetic, shoulders down
  | 'surprised' // gasp, hands up
  | 'confused' // scratching head
  | 'confident' // sunglasses, arms crossed
  | 'sleepy'; // yawning

export type MascotListener = (pose: MascotPose) => void;

const HOLD_MS: Record<MascotPose, number> = {
  idle: 0,
  wave: 3200,
  happy: 2800,
  excited: 3000,
  thinking: 12000,
  talking: 4200,
  sad: 3600,
  surprised: 2200,
  confused: 3000,
  confident: 3400,
  sleepy: 3600,
};

class MascotBus {
  private listeners = new Set<MascotListener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private current: MascotPose = 'idle';

  get pose(): MascotPose {
    return this.current;
  }

  subscribe(fn: MascotListener): () => void {
    this.listeners.add(fn);
    fn(this.current);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /** Set a pose; auto-reverts to idle after its hold time. */
  set(pose: MascotPose, ttl?: number) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.current = pose;
    this.listeners.forEach((fn) => fn(pose));
    const hold = ttl ?? HOLD_MS[pose];
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
