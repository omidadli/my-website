import { useEffect, useRef, useState, RefObject } from 'react';

export interface MascotLookAtOptions {
  /** Disable tracking (e.g. during specific animations) */
  disabled?: boolean;
  /** Maximum Y-axis rotation (horizontal head turn) in degrees. Default: 17 */
  turnY?: number;
  /** Maximum X-axis rotation (vertical head tilt) in degrees. Default: 10 */
  turnX?: number;
  /** Factor for horizontal body drift/follow translation. Default: 0.045 */
  driftX?: number;
  /** Factor for vertical body drift/follow translation. Default: 0.026 */
  driftY?: number;
  /**
   * Micro-parallax offset for eyes / face screen layer in pixels.
   * Gives an authentic 2.5D depth separation between head turn and gaze focus.
   * Default: 3.5
   */
  eyesParallax?: number;
  /** Head smoothing factor (lerp factor between 0 and 1). Default: 0.075 */
  damping?: number;
  /** Eyes gaze smoothing factor (lower value creates a soft, delayed focus trailing the head). Default: 0.052 */
  eyesDamping?: number;
  /** Inactivity threshold in ms before the mascot starts autonomous glances. Default: 4200 */
  glanceDelay?: number;
  /** Perspective depth in pixels. Default: 520 */
  perspective?: number;
}

export interface MascotGazeCoords {
  /** Normalized horizontal look direction (-1 to 1) */
  x: number;
  /** Normalized vertical look direction (-1 to 1) */
  y: number;
  /** Whether the mascot is actively tracking a live cursor */
  isTracking: boolean;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * useMascotLookAt — calculates cursor coordinates relative to the mascot's position
 * and translates/rotates the mascot's head and eyes in real time.
 *
 * Runs via requestAnimationFrame with damped interpolation (lerp) for 60/120fps
 * smoothness without triggering React re-renders on every mouse move.
 */
export function useMascotLookAt(
  rootRef: RefObject<HTMLElement | null>,
  bodyRef: RefObject<HTMLElement | null>,
  screenRef?: RefObject<HTMLElement | null>,
  options: MascotLookAtOptions = {}
): MascotGazeCoords {
  const {
    disabled = false,
    turnY = 17,
    turnX = 10,
    driftX = 0.045,
    driftY = 0.026,
    eyesParallax = 3.5,
    damping = 0.075,
    eyesDamping = 0.048,
    glanceDelay = 4200,
    perspective = 520,
  } = options;

  const [coords, setCoords] = useState<MascotGazeCoords>({ x: 0, y: 0, isTracking: false });

  // Store options in refs to keep rAF loop clean without re-binding listeners
  const optsRef = useRef({ turnY, turnX, driftX, driftY, eyesParallax, damping, eyesDamping, glanceDelay, perspective, disabled });
  optsRef.current = { turnY, turnX, driftX, driftY, eyesParallax, damping, eyesDamping, glanceDelay, perspective, disabled };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (optsRef.current.disabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Pointer tracking continuously animates at display refresh rate; touch users
    // cannot benefit from cursor-follow, so skip the loop and save mobile CPU.
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let rafId = 0;
    // Head / body orientation
    const curHead = { x: 0, y: 0 };
    // Eyes gaze orientation (lerped with gentle lag / delay trailing cursor)
    const curEyes = { x: 0, y: 0 };
    const tgt = { x: 0, y: 0 };
    let mouse: { x: number; y: number } | null = null;
    let lastMove = 0;
    let isTrackingState = false;
    let lastStateDispatch = 0;

    const tick = (now: number) => {
      const root = rootRef.current;
      const body = bodyRef.current;
      const screen = screenRef?.current;
      const {
        turnY: maxTurnY,
        turnX: maxTurnX,
        driftX: factorDriftX,
        driftY: factorDriftY,
        eyesParallax: maxEyesPx,
        damping: headLerp,
        eyesDamping: eyesLerp,
        glanceDelay: maxGlanceDelay,
        perspective: pDepth,
      } = optsRef.current;

      if (!root || !body) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const isLiveMouse = mouse !== null && now - lastMove < maxGlanceDelay;

      if (isLiveMouse && mouse) {
        const rect = root.getBoundingClientRect();
        // Head anchor position: center of mascot, ~35% down from top where eyes sit
        const headX = rect.left + rect.width * 0.5;
        const headY = rect.top + rect.height * 0.35;

        const dx = mouse.x - headX;
        const dy = mouse.y - headY;
        const dist = Math.hypot(dx, dy) || 1;

        // Influence distance: normalized over viewport width
        const reach = Math.max(window.innerWidth * 0.45, 300);
        const norm = Math.min(1, dist / reach);

        tgt.x = clamp((dx / dist) * norm, -1, 1);
        tgt.y = clamp((dy / dist) * norm, -1, 1);
      } else {
        // Ambient natural wandering when user is idle (curious thinking glances)
        const t = now * 0.001;
        tgt.x = 0.28 * Math.sin(t * 0.52);
        tgt.y = 0.12 * Math.sin(t * 0.34 + 1.1);
      }

      // Smooth damped interpolation for head/body
      curHead.x += (tgt.x - curHead.x) * headLerp;
      curHead.y += (tgt.y - curHead.y) * headLerp;

      // Smooth transition (lerp) for the gaze movement:
      // Eyes follow with a soft, natural delay / trail after the cursor
      curEyes.x += (tgt.x - curEyes.x) * eyesLerp;
      curEyes.y += (tgt.y - curEyes.y) * eyesLerp;

      const w = root.getBoundingClientRect().width || 100;
      const degY = (curHead.x * maxTurnY).toFixed(2);
      const degX = (-curHead.y * maxTurnX).toFixed(2);
      const tx = (curHead.x * factorDriftX * w).toFixed(2);
      const ty = (curHead.y * factorDriftY * w).toFixed(2);

      // 1. Transform whole body/head with 3D perspective rotation & slight drift
      body.style.transform = `perspective(${pDepth}px) rotateY(${degY}deg) rotateX(${degX}deg) translate3d(${tx}px, ${ty}px, 0)`;

      // 2. Multi-plane parallax: smoothly shift the eye/screen layer toward cursor with delayed lerp
      if (screen && maxEyesPx > 0) {
        const eyeTx = (curEyes.x * maxEyesPx).toFixed(2);
        const eyeTy = (curEyes.y * maxEyesPx).toFixed(2);
        screen.style.transform = `translate3d(${eyeTx}px, ${eyeTy}px, 0)`;
      }

      // 3. Expose normalized look coordinates as CSS variables for any child effects
      root.style.setProperty('--mascot-look-x', curHead.x.toFixed(3));
      root.style.setProperty('--mascot-look-y', curHead.y.toFixed(3));
      root.style.setProperty('--mascot-gaze-x', curEyes.x.toFixed(3));
      root.style.setProperty('--mascot-gaze-y', curEyes.y.toFixed(3));

      // Throttled state update for consumers requiring React state (e.g. debug/tooltips)
      if (now - lastStateDispatch > 300 || isTrackingState !== isLiveMouse) {
        isTrackingState = isLiveMouse;
        lastStateDispatch = now;
        setCoords({
          x: Math.round(curEyes.x * 100) / 100,
          y: Math.round(curEyes.y * 100) / 100,
          isTracking: isLiveMouse,
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const onPointerMove = (e: PointerEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
      lastMove = performance.now();
    };

    const onPointerLeave = () => {
      mouse = null;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      cancelAnimationFrame(rafId);
    };
  }, [rootRef, bodyRef, screenRef]);

  return coords;
}
