import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { mascot, warmFrames } from './mascotBus';
import { mascotController, type MascotGaze } from './soul';
import { LaptopDeck, LaptopLid } from './Laptop';
import { CANVAS_ASPECT, FALLBACK_FRAME, FRAMES, HAND_FRAMES, HANDS_CLIP_CSS, handsRig, rigCss, rigOf } from './rig';

/**
 * MascotWorkstation — the whole scene, one camera, one character.
 *
 *   ┌──────────────────────────────┐
 *   │            head              │  every frame is pinned to the same
 *   │            neck              │  head anchor (rig.ts) so the body can
 *   │          shoulders           │  never teleport between poses
 *   │ ╔══════════════════════════╗ │
 *   │ ║        screen            ║ │  lid — occludes chest AND wrists
 *   │ ╚══════════════════════════╝ │
 *   │   ░░░░ keyboard ░░░  ✋ ✋    │  deck — occludes the cropped torso
 *   └──────────────────────────────┘
 *
 * Layer order (bottom → top): ambient, desk, body, deck, hands, lid.
 * The deck is what hides the fact that the sprites are busts cropped at the
 * waist; the lid is what hides the wrists, so the hands read as attached to
 * arms that go behind the machine.
 */

// ---------------------------------------------------------------------------
// Gaze driver — ONE rAF loop for every instance on the page
// ---------------------------------------------------------------------------

interface GazeEntry {
  target: MascotGaze;
  cur: { x: number; y: number };
}

const gazeEntries = new Map<HTMLElement, GazeEntry>();
let gazeRaf = 0;
let pointer: { x: number; y: number } | null = null;
let pointerAt = 0;
let pointerBound = false;

const REDUCED = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function bindPointer() {
  if (pointerBound || typeof window === 'undefined') return;
  pointerBound = true;
  const onMove = (e: PointerEvent) => {
    pointer = { x: e.clientX, y: e.clientY };
    pointerAt = performance.now();
  };
  const onLeave = () => {
    pointer = null;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
}

const TURN_Y = 9; // max head turn (deg)
const TURN_X = 7; // max head tilt (deg)
const LEAN_X = 1.4; // % of stage width
const LEAN_Y = 1.1; // % of stage height
const GLANCE_AFTER = 4500;

function gazeVector(target: MascotGaze, now: number): { x: number; y: number } {
  switch (target) {
    case 'USER': {
      // looking at the visitor: follow them gently, drift when they're away
      if (pointer && now - pointerAt < GLANCE_AFTER) return { x: 0.15, y: 0 };
      const t = now / 1000;
      return { x: 0.35 * Math.sin(t * 0.37), y: 0.05 * Math.sin(t * 0.23 + 1.7) };
    }
    case 'LAPTOP_SCREEN':
      return { x: 0, y: 1 };
    case 'KEYBOARD':
      return { x: 0, y: 1.45 };
    case 'CHAT':
      return { x: -0.45, y: 1.15 };
    case 'ENVIRONMENT':
    default: {
      // long, calm glances with real stillness between them
      const t = now / 1000;
      const slow = Math.sin(t * 0.19);
      const gate = Math.max(0, Math.abs(slow) - 0.45) / 0.55; // dead zone = stillness
      return { x: Math.sign(slow) * gate * 0.85, y: 0.1 * Math.sin(t * 0.11 + 2.2) };
    }
  }
}

function gazeLoop(now: number) {
  const reduced = REDUCED();
  gazeEntries.forEach((entry, el) => {
    const want = gazeVector(entry.target, now);
    if (reduced) {
      entry.cur.x = want.x;
      entry.cur.y = want.y;
    } else {
      // critically damped follow-through — no snapping, no jitter
      entry.cur.x += (want.x - entry.cur.x) * 0.075;
      entry.cur.y += (want.y - entry.cur.y) * 0.075;
    }
    el.style.setProperty('--gaze-x', entry.cur.x.toFixed(4));
    el.style.setProperty('--gaze-y', entry.cur.y.toFixed(4));
  });
  gazeRaf = requestAnimationFrame(gazeLoop);
}

function attachGaze(el: HTMLElement, target: MascotGaze): () => void {
  bindPointer();
  gazeEntries.set(el, { target, cur: { x: 0, y: 0 } });
  if (!gazeRaf) gazeRaf = requestAnimationFrame(gazeLoop);
  return () => {
    gazeEntries.delete(el);
    if (gazeEntries.size === 0 && gazeRaf) {
      cancelAnimationFrame(gazeRaf);
      gazeRaf = 0;
    }
  };
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

export interface MascotWorkstationProps {
  className?: string;
}

export const MascotWorkstation: React.FC<MascotWorkstationProps> = ({ className = '' }) => {
  const snapshot = useSyncExternalStore(mascotController.subscribe, mascotController.getSnapshot, mascotController.getSnapshot);
  const [frame, setFrame] = useState(FALLBACK_FRAME);
  const [broken, setBroken] = useState<Record<string, true>>({});
  const figureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    warmFrames();
  }, []);

  // one subscription: the body clock drives the frame, nothing else does
  useEffect(() => mascot.subscribe((_scene, f) => setFrame(f)), []);

  // gaze follows the controller's attention target, smoothly
  useEffect(() => {
    const el = figureRef.current;
    if (!el) return undefined;
    return attachGaze(el, snapshot.gaze);
  }, [snapshot.gaze]);

  const activeFrame = broken[frame] || !FRAMES[frame] ? FALLBACK_FRAME : frame;

  const bodyRig = useMemo(() => rigOf(activeFrame), [activeFrame]);
  const handRig = useMemo(() => {
    const handFrame = HAND_FRAMES[activeFrame] ? activeFrame : 'typing-2';
    return { rig: handsRig(handFrame), src: HAND_FRAMES[handFrame] };
  }, [activeFrame]);

  const handsVisible = !!HAND_FRAMES[activeFrame] || !!FRAMES[activeFrame]?.deskHands;

  const onImgError = (name: string) => () => setBroken((b) => (b[name] ? b : { ...b, [name]: true }));

  return (
    <div
      className={`mws ${className}`}
      style={{ aspectRatio: `${CANVAS_ASPECT}` }}
      aria-hidden="true"
      data-state={snapshot.state}
      data-gaze={snapshot.gaze}
      data-laptop={snapshot.laptop}
    >
      <div className="mws-ambient" />

      {/* desk plane — gives the machine and the character somewhere to be */}
      <div className="mws-desk" />

      {/* the character */}
      <div className="mws-figure" ref={figureRef}>
        <div className="mws-body" style={{ transform: rigCss(bodyRig) }}>
          <div className="mws-breath">
            <img
              key={activeFrame}
              src={FRAMES[activeFrame].src}
              alt=""
              width={640}
              height={698}
              draggable={false}
              decoding="async"
              className="mws-img"
              onError={onImgError(activeFrame)}
            />
          </div>
        </div>
      </div>

      {/* the machine — deck first so it covers the cropped torso… */}
      <LaptopDeck state={snapshot.laptop} />

      {/* …then the hands, resting on the keys… */}
      {handsVisible && (
        <div className="mws-hands" style={{ transform: rigCss(handRig.rig) }}>
          <div className="mws-breath mws-breath--hands">
            <img
              src={handRig.src}
              alt=""
              width={640}
              height={698}
              draggable={false}
              decoding="async"
              className="mws-img mws-img--hands"
              style={{ clipPath: HANDS_CLIP_CSS }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* …and the lid last, so the wrists vanish behind the screen. */}
      <LaptopLid state={snapshot.laptop} screenText={snapshot.screenText} />
    </div>
  );
};

export default MascotWorkstation;
