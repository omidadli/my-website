import React, { useEffect, useRef } from 'react';

/**
 * EyeTrackingAvatar — the site owner's cutout portrait pinned to the
 * bottom-right corner. The pupils follow the visitor's cursor and the whole
 * portrait gets a soft parallax "head" drift + idle sway so it feels alive.
 *
 * - Image is a transparent PNG (public/avatar-float.png) with the bottom
 *   alpha-faded so the bust "floats" on the page.
 * - Pupil coordinates below were measured from the photo with MediaPipe
 *   FaceMesh (refined iris landmarks, 478 pts) and are normalized
 *   (cx/cy relative to image width/height, r = iris radius / image width).
 */

const IMG_W = 460;
const IMG_H = 324;

// viewer-left eye (his right) + viewer-right eye (his left)
const EYES = [
  { cx: 0.4340245488663794, cy: 0.39569749278289257, r: 0.0113228115129613 },
  { cx: 0.5670823110661037, cy: 0.39065146864942624, r: 0.011671161591282144 },
];

// Motion budget (fractions of the rendered widget size)
const PUPIL_RANGE_X = 0.016; // max horizontal pupil travel  (× widget width)
const PUPIL_RANGE_Y = 0.011; // max vertical pupil travel    (× widget width)
const HEAD_RANGE_X = 0.022; // head parallax, px             (× widget width)
const HEAD_RANGE_Y = 0.014; // head parallax, px             (× widget width)
const HEAD_RANGE_R = 2.6; // head tilt, degrees
const GLOW_RANGE = 0.05; // glow drift                       (× widget width)
const DEAD_ZONE = 0.05; // ignore micro-jitter around center
const EASE = 0.11; // lerp factor per frame (0..1) — higher = snappier

export function EyeTrackingAvatar() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const pupilRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const head = headRef.current;
    const glow = glowRef.current;
    const pupils = pupilRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (!root || !head || !glow || pupils.length !== EYES.length) return;

    // Respect users who opt out of motion: keep the portrait fully static.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cur = { x: 0, y: 0 }; // eased gaze, -1..1
    const tgt = { x: 0, y: 0 };
    let raf = 0;
    let running = false;

    const clamp = (v: number, lo: number, hi: number) =>
      v < lo ? lo : v > hi ? hi : v;

    const onPointerMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      if (rect.width === 0) return;
      // pivot around the face (upper third of the widget)
      const px = rect.left + rect.width / 2;
      const py = rect.top + rect.height * 0.3;
      let nx = (e.clientX - px) / (window.innerWidth * 0.5);
      let ny = (e.clientY - py) / (window.innerHeight * 0.55);
      nx = clamp(nx, -1, 1);
      ny = clamp(ny, -1, 1);
      // dead-zone, then rescale so motion ramps in smoothly
      const mag = Math.hypot(nx, ny);
      if (mag < DEAD_ZONE) {
        tgt.x = 0;
        tgt.y = 0;
      } else {
        const s = (mag - DEAD_ZONE) / (1 - DEAD_ZONE) / mag;
        tgt.x = nx * s;
        tgt.y = ny * s;
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const reset = () => {
      tgt.x = 0;
      tgt.y = 0;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const tick = () => {
      cur.x += (tgt.x - cur.x) * EASE;
      cur.y += (tgt.y - cur.y) * EASE;

      const w = root.getBoundingClientRect().width;

      // pupils
      const ex = cur.x * PUPIL_RANGE_X * w;
      const ey = cur.y * PUPIL_RANGE_Y * w;
      for (const p of pupils) {
        p.style.setProperty('--ex', `${ex.toFixed(2)}px`);
        p.style.setProperty('--ey', `${ey.toFixed(2)}px`);
      }

      // head parallax + tilt
      const hx = cur.x * HEAD_RANGE_X * w;
      const hy = cur.y * HEAD_RANGE_Y * w;
      const hr = cur.x * HEAD_RANGE_R;
      head.style.transform = `translate3d(${hx.toFixed(2)}px, ${hy.toFixed(2)}px, 0) rotate(${hr.toFixed(2)}deg)`;

      // glow drifts a touch more for depth
      const gx = cur.x * GLOW_RANGE * w;
      const gy = cur.y * GLOW_RANGE * w;
      glow.style.transform = `translate3d(${gx.toFixed(2)}px, ${gy.toFixed(2)}px, 0)`;

      const settled =
        Math.abs(tgt.x - cur.x) < 0.001 && Math.abs(tgt.y - cur.y) < 0.001;
      if (settled) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', reset);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="eta-root pointer-events-none fixed bottom-3 right-3 z-[45] select-none sm:bottom-6 sm:right-6"
    >
      <div className="eta-sway">
        <div ref={glowRef} className="eta-glow" />
        <div ref={headRef} className="eta-head">
          <img
            src="/avatar-float.png"
            alt=""
            width={IMG_W}
            height={IMG_H}
            draggable={false}
            decoding="async"
            className="eta-img"
          />
          {EYES.map((eye, i) => (
            <span
              key={i}
              ref={(el) => {
                pupilRefs.current[i] = el;
              }}
              className="eta-pupil"
              style={
                {
                  '--px': `${(eye.cx * 100).toFixed(3)}%`,
                  '--py': `${(eye.cy * 100).toFixed(3)}%`,
                  '--pd': `${(eye.r * 200).toFixed(3)}%`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
