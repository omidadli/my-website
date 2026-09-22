import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { mascot, MascotPose } from './mascotBus';
import { MascotCue, mascotSay, CLICK_LINES, HOVER_LINES, pick } from './useMascotEvents';
import sprites from './sprites.json';

/**
 * MascotAvatar — a full-body 3D character (Pixar-style render of the site
 * owner) living in the bottom-right corner as the site's intelligent
 * assistant.
 *
 * Every mood is a real sprite with its own facial expression AND body
 * language (wave, fist-pump, hand-on-chin, sunglasses power pose, yawning…).
 * Sprites crossfade on pose change; pupils track the cursor using per-sprite
 * iris coordinates measured with MediaPipe FaceMesh; the whole character gets
 * a subtle parallax + per-pose body animation. Clicking it opens the chat.
 */

const POSES: MascotPose[] = [
  'idle', 'wave', 'happy', 'excited', 'thinking', 'talking',
  'sad', 'surprised', 'confused', 'confident', 'sleepy',
];

type Eye = { cx: number; cy: number; r: number };
type SpriteMeta = { src: string; w: number; h: number; eyes: Eye[] | null };
const META = sprites as unknown as Record<string, SpriteMeta>;

// poses whose artwork already closes/hides the eyes → don't draw pupils there
const NO_PUPILS: Set<MascotPose> = new Set(['confident', 'happy']);

// pupil travel relative to the sprite's own iris radius
const GAZE = 1.3;
// body parallax (fraction of widget width) & tilt
const BODY_X = 0.014;
const BODY_Y = 0.008;
const BODY_R = 1.6;
const DEAD_ZONE = 22; // px — pupils rest when the cursor is basically on the face

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export function MascotAvatar() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const pupilRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [pose, setPose] = useState<MascotPose>('idle');
  const poseRef = useRef<MascotPose>('idle');
  poseRef.current = pose;

  const [bubble, setBubble] = useState<{ id: number; text: string; shown: string } | null>(null);
  const bubbleId = useRef(0);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeInt = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------------------- poses
  useEffect(() => mascot.subscribe(setPose), []);

  // ------------------------------------------------------------- bubbles
  const showBubble = useCallback((text: string, ms: number) => {
    bubbleId.current += 1;
    setBubble({ id: bubbleId.current, text, shown: '' });
    let i = 0;
    if (typeInt.current) clearInterval(typeInt.current);
    typeInt.current = setInterval(() => {
      i += 1;
      setBubble((b) => (b ? { ...b, shown: text.slice(0, i) } : b));
      if (i >= text.length && typeInt.current) {
        clearInterval(typeInt.current);
        typeInt.current = null;
      }
    }, 20);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), ms);
  }, []);

  useEffect(() => {
    const onCue = (e: Event) => {
      const d = (e as CustomEvent<MascotCue>).detail;
      if (!d?.text) return;
      showBubble(d.text, d.ms ?? 4200);
    };
    window.addEventListener('mascot:cues', onCue);
    return () => {
      window.removeEventListener('mascot:cues', onCue);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      if (typeInt.current) clearInterval(typeInt.current);
    };
  }, [showBubble]);

  // -------------------------------------------------- eye/body animation
  useEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const cur = { x: 0, y: 0 };
    const tgt = { x: 0, y: 0 };
    const fast = { x: 0, y: 0 };
    let mouse: { x: number; y: number } | null = null;
    let saccade = { x: 0, y: 0, until: 0, next: 2400 };

    const tick = (now: number) => {
      const p = poseRef.current;
      const meta = META[p];

      // ---- gaze target ----
      if (p === 'thinking' || p === 'confused') {
        // artwork already looks away; add a soft roaming drift
        const t = now / 1000;
        tgt.x = 0.12 * Math.sin(t * 0.8);
        tgt.y = -0.08;
      } else if (p === 'sleepy' || p === 'sad' || NO_PUPILS.has(p) || !meta?.eyes) {
        tgt.x = 0;
        tgt.y = 0;
      } else if (mouse) {
        const rect = root.getBoundingClientRect();
        const fx = rect.left + rect.width / 2;
        const fy = rect.top + rect.height * (meta.eyes[0]?.cy ?? 0.35);
        const dx = mouse.x - fx;
        const dy = mouse.y - fy;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < DEAD_ZONE) {
          tgt.x = 0;
          tgt.y = 0;
        } else {
          const norm = Math.min(1, dist / (window.innerWidth * 0.4));
          tgt.x = clamp((dx / dist) * norm, -1, 1);
          tgt.y = clamp((dy / dist) * norm, -1, 1);
        }
      } else {
        tgt.x = 0;
        tgt.y = 0;
      }

      // ---- micro-saccades ----
      let sx = 0;
      let sy = 0;
      if (!NO_PUPILS.has(p) && p !== 'sleepy' && p !== 'sad') {
        if (now > saccade.next && now > saccade.until) {
          saccade = {
            x: (Math.random() - 0.5) * 0.22,
            y: (Math.random() - 0.5) * 0.14,
            until: now + 90 + Math.random() * 80,
            next: now + 2300 + Math.random() * 3200,
          };
        }
        if (now < saccade.until) {
          sx = saccade.x;
          sy = saccade.y;
        }
      }

      // ---- two-speed easing ----
      fast.x += (tgt.x - fast.x) * 0.2;
      fast.y += (tgt.y - fast.y) * 0.2;
      cur.x += (tgt.x - cur.x) * 0.05;
      cur.y += (tgt.y - cur.y) * 0.05;
      const gx = cur.x * 0.72 + fast.x * 0.28 + sx;
      const gy = cur.y * 0.72 + fast.y * 0.28 + sy;

      const w = root.getBoundingClientRect().width;

      // pupils — per-sprite iris geometry, all pupil nodes move together
      if (meta?.eyes && !NO_PUPILS.has(p)) {
        const rr = (meta.eyes[0]?.r ?? 0.016) * w;
        const ex = gx * GAZE * rr;
        const ey = gy * GAZE * rr * 0.85;
        for (const el of pupilRefs.current) {
          if (el) el.style.transform = `translate(-50%, -50%) translate3d(${ex.toFixed(2)}px, ${ey.toFixed(2)}px, 0)`;
        }
      }

      // body parallax follows gaze
      const hx = gx * BODY_X * w;
      const hy = gy * BODY_Y * w;
      const hr = gx * BODY_R;
      body.style.transform = `translate3d(${hx.toFixed(2)}px, ${hy.toFixed(2)}px, 0) rotate(${hr.toFixed(2)}deg)`;

      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouse = null;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  // ------------------------------------------------ interactions
  const clickStep = useRef(0);
  const lastHover = useRef(0);

  const onClick = () => {
    const line = CLICK_LINES[clickStep.current % CLICK_LINES.length];
    clickStep.current += 1;
    mascot.set(line.pose);
    showBubble(line.text, 2400);
    window.dispatchEvent(new CustomEvent('nd:open-chat'));
  };

  const onHover = () => {
    const now = Date.now();
    if (now - lastHover.current < 30000) return;
    lastHover.current = now;
    if (Math.random() < 0.5) showBubble(pick(HOVER_LINES, null), 2400);
    mascot.set('happy');
  };

  return (
    <div ref={rootRef} className="mascot-root fixed bottom-4 right-4 z-[50] sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {bubble && (
          <motion.div
            key={bubble.id}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="mascot-bubble"
          >
            {bubble.shown}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`mascot-stage mascot--${pose}`}
        onClick={onClick}
        onMouseEnter={onHover}
        role="button"
        tabIndex={0}
        aria-label="دستیار هوشمند"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="mascot-sway">
          <div ref={bodyRef} className="mascot-body">
            {/* all sprites mounted, crossfaded via .is-active */}
            {POSES.map((p) => (
              <img
                key={p}
                src={META[p].src}
                alt=""
                width={META[p].w}
                height={META[p].h}
                draggable={false}
                decoding="async"
                className={`mascot-img ${p === pose ? 'is-active' : ''}`}
              />
            ))}
            {/* one pupil pair per sprite pose (per-sprite iris geometry) */}
            {POSES.map((p) =>
              (META[p].eyes ?? []).map((eye, i) => (
                <span
                  key={`${p}-${i}`}
                  ref={(el) => {
                    pupilRefs.current[POSES.indexOf(p) * 2 + i] = el;
                  }}
                  className={`mascot-pupil ${p === pose ? 'is-active' : ''}`}
                  style={{
                    left: `${(eye.cx * 100).toFixed(3)}%`,
                    top: `${(eye.cy * 100).toFixed(3)}%`,
                    width: `${(eye.r * 1.65 * 100).toFixed(3)}%`,
                  }}
                />
              ))
            )}
          </div>
          <div className="mascot-shadow" />
        </div>
      </div>
    </div>
  );
}
