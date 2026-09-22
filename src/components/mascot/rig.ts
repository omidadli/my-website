/**
 * rig.ts — the physical rig that keeps ONE character in ONE place.
 *
 * WHY THIS EXISTS
 * ---------------
 * The sprite sheets under /public/mascot were exported at a fixed 640×698
 * canvas, but every pose was rendered with a different camera: the figure
 * moves horizontally (head centre ranges from 0.375 → 0.625 of the canvas),
 * starts at a different height (skull top from 0.014 → 0.199) and is
 * rendered at a different zoom (face width 0.186 → 0.314).
 *
 * Swapping those frames raw is what made the old mascot look like it was
 * teleporting and resizing between unrelated GIFs. `rig.ts` normalises every
 * frame onto a single anchor — the head — before it is drawn, so the body
 * stays put and only the pose changes.
 *
 * HOW THE NUMBERS WERE DERIVED
 * ----------------------------
 * Every value below was measured off the shipped assets, not guessed:
 *   headCx   horizontal centre of the widest opaque run through the skull
 *            (taken through the face centroid so a raised arm can never win)
 *   headTop  first opaque scanline = top of the hair
 *   faceW    width of the largest connected skin-tone blob in the upper 45%
 *            of the figure. The face is the most rigid thing in the frame, so
 *            it is the least pose-dependent scale reference available
 *            (hair volume and head turn distort the raw silhouette width).
 *
 * Transform:  p' = S · p + t      (canvas fractions, stage shares the canvas
 *                                  aspect so no axis correction is needed)
 *   S  = TARGET_FACE_W / faceW        (clamped — see CLAMP_SCALE)
 *   tx = headAnchorX − S · headCx
 *   ty = headAnchorY − S · headTop
 */

export const CANVAS = { w: 640, h: 698 } as const;
export const CANVAS_ASPECT = CANVAS.w / CANVAS.h;

/**
 * Stage layout, in fractions of the stage box (0 = top/left, 1 = bottom/right).
 * The stage uses the canvas aspect ratio, so with S = 1 one canvas pixel is
 * one stage pixel and the numbers below are directly comparable to the
 * measurements above.
 */
export const STAGE = {
  /** where every frame's head centre is pinned */
  headAnchorX: 0.48,
  /** where every frame's hairline is pinned */
  headAnchorY: 0.035,
  /** top edge of the laptop lid — the body below this line is behind the machine */
  laptopTop: 0.62,
  /** hinge line: screen above, keyboard deck below */
  laptopHinge: 0.8,
  /** keyboard deck front edge */
  laptopBottom: 0.995,
} as const;

/**
 * The hands are a cut-out layer, so they get their own anchor: the content
 * box of the cut-out is placed on a fixed target box over the keyboard.
 * Doing it this way (instead of offsetting the body rig) makes the placement
 * independent of the frame's zoom — the hands always land on the keys.
 */
const HANDS = {
  /** centre + top of the cut-out content, in canvas fractions */
  srcCx: 0.405,
  srcTop: 0.798,
  /** where that point lands on the stage, in stage fractions */
  targetCx: 0.5,
  targetTop: 0.775,
} as const;

/** Clip window for the hands layer, in canvas fractions. */
export const HANDS_CLIP = { top: 0.775, right: 0.2, bottom: 0.014, left: 0.02 } as const;

/** Reference face width (fraction of canvas) every frame is scaled to. */
const TARGET_FACE_W = 0.265;
/** Keeps a bad measurement from producing an absurd zoom. */
const CLAMP_SCALE = { min: 0.85, max: 1.4 } as const;

export interface FrameRig {
  /** public path of the sprite frame */
  src: string;
  /** head centre, canvas fractions */
  headCx: number;
  /** hairline, canvas fractions */
  headTop: number;
  /** face width used as the scale reference, canvas fractions */
  faceW: number;
  /**
   * True when the pose keeps both arms down at the machine, so the separate
   * hands layer (drawn over the keyboard) must stay visible. Poses that lift
   * a hand — talking, thinking, waving, celebrating — hide it, otherwise the
   * character would grow a second pair of hands.
   */
  deskHands: boolean;
}

const frame = (src: string, headCx: number, headTop: number, faceW: number, deskHands = false): FrameRig => ({
  src,
  headCx,
  headTop,
  faceW,
  deskHands,
});

export const FRAMES: Record<string, FrameRig> = {
  idle: frame('/mascot/idle.webp', 0.551, 0.014, 0.298, true),
  talking: frame('/mascot/talking.webp', 0.531, 0.017, 0.264),
  'talking-b': frame('/mascot/talking-b.webp', 0.53, 0.017, 0.266),
  'talking-c': frame('/mascot/talking-c.webp', 0.531, 0.016, 0.266),
  'typing-1': frame('/mascot/typing-1.webp', 0.376, 0.016, 0.314, true),
  'typing-2': frame('/mascot/typing-2.webp', 0.376, 0.016, 0.311, true),
  'typing-3': frame('/mascot/typing-3.webp', 0.375, 0.016, 0.311, true),
  thinking: frame('/mascot/thinking.webp', 0.466, 0.199, 0.245),
  happy: frame('/mascot/happy.webp', 0.547, 0.196, 0.291),
  excited: frame('/mascot/excited.webp', 0.523, 0.146, 0.241),
  wave: frame('/mascot/wave.webp', 0.625, 0.179, 0.239),
  sad: frame('/mascot/sad.webp', 0.484, 0.179, 0.186),
  surprised: frame('/mascot/surprised.webp', 0.514, 0.199, 0.278),
  confused: frame('/mascot/confused.webp', 0.523, 0.193, 0.244),
  confident: frame('/mascot/confident.webp', 0.516, 0.18, 0.191),
  sleepy: frame('/mascot/sleepy.webp', 0.534, 0.199, 0.295),
};

/** Cut-out of the hands + wrists, lifted out of each typing frame. */
export const HAND_FRAMES: Record<string, string> = {
  'typing-1': '/mascot/hands-1.webp',
  'typing-2': '/mascot/hands-2.webp',
  'typing-3': '/mascot/hands-3.webp',
};

export interface RigTransform {
  scale: number;
  /** translate in canvas fractions */
  tx: number;
  ty: number;
}

const IDENTITY: RigTransform = { scale: 1, tx: 0, ty: 0 };

export function rigOf(name: string): RigTransform {
  const f = FRAMES[name];
  if (!f) return IDENTITY;
  const raw = TARGET_FACE_W / f.faceW;
  const scale = Math.min(CLAMP_SCALE.max, Math.max(CLAMP_SCALE.min, raw));
  return {
    scale,
    tx: STAGE.headAnchorX - scale * f.headCx,
    ty: STAGE.headAnchorY - scale * f.headTop,
  };
}

/** `transform` value that pins a frame onto the shared head anchor. */
export function rigCss(t: RigTransform): string {
  return `translate(${(t.tx * 100).toFixed(3)}%, ${(t.ty * 100).toFixed(3)}%) scale(${t.scale.toFixed(4)})`;
}

/**
 * Transform for the hands cut-out: same zoom as the frame it was lifted from,
 * placed on the keyboard target. Scale-invariant by construction.
 */
export function handsRig(frameName: string): RigTransform {
  const name = HAND_FRAMES[frameName] ? frameName : 'typing-2';
  const { scale } = rigOf(name);
  return {
    scale,
    tx: HANDS.targetCx - scale * HANDS.srcCx,
    ty: HANDS.targetTop - scale * HANDS.srcTop,
  };
}

/** `clip-path` value that keeps only the hands + wrists of a frame. */
export const HANDS_CLIP_CSS = `inset(${(HANDS_CLIP.top * 100).toFixed(2)}% ${(HANDS_CLIP.right * 100).toFixed(2)}% ${(
  HANDS_CLIP.bottom * 100
).toFixed(2)}% ${(HANDS_CLIP.left * 100).toFixed(2)}%)`;

/** Fallback frame used whenever a frame or its asset is missing. */
export const FALLBACK_FRAME = 'idle';
