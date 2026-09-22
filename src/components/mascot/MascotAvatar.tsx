import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { mascot, MascotMood } from './mascotBus';
import { MascotCue } from './useMascotEvents';

/**
 * MascotAvatar — the site owner's cutout portrait living in the bottom-right
 * corner as the site's intelligent assistant.
 *
 * Eyes: pupil positions were measured from the photo with MediaPipe FaceMesh
 * (refined iris landmarks). Pupils track the cursor with relative-vector
 * math, a dead-zone and two-speed easing (fast catch-up → slow settle), plus
 * random micro-saccades so the gaze feels organic.
 *
 * Eyelids: skin-colored overlays sampled from the photo blink on a natural
 * schedule (2–6s, occasional double-blinks) and react to mood.
 *
 * Moods (driven by mascotBus from real site events — see useMascotEvents):
 * idle · happy · excited · thinking · talking · sad · surprised
 */

const IMG_W = 520;
const IMG_H = 415;

// viewer-left eye, viewer-right eye (normalized to the image)
const EYES = [
  { cx: 0.409918134029095, cy: 0.4768268792026014, r: 0.01545999264269716 },
  { cx: 0.5915931554941031, cy: 0.4707462747412992, r: 0.015935624480404465 },
];

// pupil travel as a fraction of eye radius
const GAZE = 2.1;
// head parallax (fraction of widget width) & tilt (deg)
const HEAD_X = 0.016;
const HEAD_Y = 0.01;
const HEAD_R = 2.2;

const CLICK_LINES: Array<[MascotMood, string]> = [
  ['happy', 'بله؟ 🙌'],
  ['excited', 'سرباز! 🫡'],
  ['surprised', 'وای، غافلگیرم کردی!'],
];
const HOVER_LINES = ['آفرین که این‌جایی 😊', 'یه چیز بگم؟ 💬', 'سلام رفیق!'];

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export function MascotAvatar() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const pupilRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lidRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [mood, setMood] = useState<MascotMood>('idle');
  const moodRef = useRef<MascotMood>('idle');
  moodRef.current = mood;
  const bubbleId = useRef(0);
  const [bubble, setBubble] = useState<{ id: number; text: string; shown: string } | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------- moods
  useEffect(() => mascot.subscribe(setMood), []);

  // ------------------------------------------------------------- bubbles
  const showBubble = useCallback((text: string, ms: number) => {
    bubbleId.current += 1;
    const id = bubbleId.current;
    setBubble({ id, text, shown: '' });
    let i = 0;
    if (typeTimer.current) clearInterval(typeTimer.current);
    typeTimer.current = setInterval(() => {
      i += 1;
      setBubble((b) => (b ? { ...b, shown: text.slice(0, i) } : b));
      if (i >= text.length && typeTimer.current) {
        clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
    }, 22);
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
      if (typeTimer.current) clearInterval(typeTimer.current);
    };
  }, [showBubble]);

  // ------------------------------------------------ animation brain
  useEffect(() => {
    const root = rootRef.current;
    const head = headRef.current;
    const glow = glowRef.current;
    const pupils = pupilRefs.current.filter(Boolean) as HTMLSpanElement[];
    const lids = lidRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (!root || !head || !glow || pupils.length !== 2 || lids.length !== 2) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // fully static; bubbles still work

    let raf = 0;
    let running = false;
    // gaze: -1..1 eased target
    const cur = { x: 0, y: 0 };
    const tgt = { x: 0, y: 0 };
    const fast = { x: 0, y: 0 }; // quick component
    let saccade = { x: 0, y: 0, until: 0, next: performance.now() + 2600 };
    // blink
    let blink = 0; // 0 open .. 1 closed
    let blinkPhase: 'none' | 'closing' | 'opening' = 'none';
    let nextBlink = performance.now() + 1800 + Math.random() * 2600;
    let mouse: { x: number; y: number } | null = null;
    const bornAt = performance.now();

    const eyePx = () => {
      const w = root.getBoundingClientRect().width;
      return EYES.map((e) => ({ ...e, px: e.cx * w, py: e.cy * (w * (IMG_H / IMG_W)), r: e.r * w }));
    };

    const tick = (now: number) => {
      const m = moodRef.current;

      // ---- gaze target per mood ----
      if (m === 'thinking') {
        const t = (now - bornAt) / 1000;
        tgt.x = -0.5 + 0.22 * Math.sin(t * 0.9);
        tgt.y = -0.72 + 0.1 * Math.sin(t * 1.6 + 1);
      } else if (m === 'sad') {
        tgt.x = 0;
        tgt.y = 0.78;
      } else if (mouse) {
        const eyes = eyePx();
        const cx = (eyes[0].px + eyes[1].px) / 2;
        const cy = (eyes[0].py + eyes[1].py) / 2;
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const norm = Math.min(1, Math.max(dist, 60) / (window.innerWidth * 0.42));
        const dead = dist < 26 ? 0 : (dist - 26) / dist;
        tgt.x = clamp((dx / dist) * norm * dead, -1, 1);
        tgt.y = clamp((dy / dist) * norm * dead, -1, 1);
      } else {
        tgt.x = 0;
        tgt.y = 0;
      }

      // ---- micro-saccades ----
      let sx = 0;
      let sy = 0;
      if (m !== 'thinking' && m !== 'sad') {
        if (now > saccade.next && now > saccade.until) {
          saccade = {
            x: (Math.random() - 0.5) * 0.24,
            y: (Math.random() - 0.5) * 0.16,
            until: now + 90 + Math.random() * 90,
            next: now + 2200 + Math.random() * 3400,
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
      cur.x += (tgt.x - cur.x) * 0.045;
      cur.y += (tgt.y - cur.y) * 0.045;
      const gx = cur.x * 0.72 + fast.x * 0.28 + sx;
      const gy = cur.y * 0.72 + fast.y * 0.28 + sy;

      const w = root.getBoundingClientRect().width;
      const ex = gx * GAZE * EYES[0].r * w;
      const ey = gy * GAZE * EYES[0].r * w;
      pupils.forEach((p) =>
        p.style.setProperty(
          'transform',
          `translate(-50%, -50%) translate3d(${ex.toFixed(2)}px, ${(ey * 0.82).toFixed(2)}px, 0)`
        )
      );

      // ---- head follows gaze (not cursor) ----
      const hx = gx * HEAD_X * w;
      const hy = gy * HEAD_Y * w;
      const hr = gx * HEAD_R;
      head.style.transform = `translate3d(${hx.toFixed(2)}px, ${hy.toFixed(2)}px, 0) rotate(${hr.toFixed(2)}deg)`;
      glow.style.transform = `translate(-50%, -50%) translate3d(${(gx * 0.03 * w).toFixed(2)}px, ${(gy * 0.02 * w).toFixed(2)}px, 0)`;

      // ---- eyelids: mood base + blink ----
      const base =
        m === 'sad' ? 0.5 : m === 'thinking' ? 0.34 : m === 'surprised' ? 0 : 0.06;
      if (blinkPhase === 'none' && now > nextBlink) blinkPhase = 'closing';
      if (blinkPhase === 'closing') {
        blink = Math.min(1, blink + 0.22);
        if (blink >= 1) {
          blinkPhase = 'opening';
          // 18% chance of a quick double-blink
          nextBlink =
            Math.random() < 0.18
              ? now + 130
              : now + 2100 + Math.random() * 3900;
        }
      } else if (blinkPhase === 'opening') {
        blink = Math.max(0, blink - 0.16);
        if (blink <= 0) blinkPhase = 'none';
      }
      const amount = Math.min(1, base + blink);
      lids.forEach((l) => {
        l.style.opacity = amount > 0.03 ? '1' : '0';
        l.style.transform = `translate(-50%, ${(-118 + amount * 106).toFixed(1)}%)`;
      });

      raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      kick();
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
  const clickCount = useRef(0);
  const lastHover = useRef(0);

  const onClick = () => {
    const [m, line] = CLICK_LINES[clickCount.current % CLICK_LINES.length];
    clickCount.current += 1;
    mascot.set(m);
    showBubble(line, 2600);
    window.dispatchEvent(new CustomEvent('nd:open-chat'));
  };

  const onHover = () => {
    const now = Date.now();
    if (now - lastHover.current < 30000) return;
    lastHover.current = now;
    if (Math.random() < 0.5) {
      const line = HOVER_LINES[Math.floor(Math.random() * HOVER_LINES.length)];
      showBubble(line, 2400);
    }
    mascot.set('happy');
  };

  return (
    <div
      ref={rootRef}
      className="mascot-root fixed bottom-4 right-4 z-[50] sm:bottom-7 sm:right-7"
    >
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
        className={`mascot-stage mascot--${mood}`}
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
          <div ref={glowRef} className="mascot-glow" />
          <div ref={headRef} className="mascot-head">
            <img
              src="/avatar-assistant.png"
              alt="امید عدلی — دستیار هوشمند"
              width={IMG_W}
              height={IMG_H}
              draggable={false}
              decoding="async"
              className="mascot-img"
            />
            {EYES.map((eye, i) => (
              <React.Fragment key={i}>
                <span
                  ref={(el) => {
                    pupilRefs.current[i] = el;
                  }}
                  className="mascot-pupil"
                  style={{
                    left: `${(eye.cx * 100).toFixed(3)}%`,
                    top: `${(eye.cy * 100).toFixed(3)}%`,
                    width: `${(eye.r * 2.9 * 100).toFixed(3)}%`,
                  }}
                />
                <span
                  ref={(el) => {
                    lidRefs.current[i] = el;
                  }}
                  className="mascot-lid"
                  data-eye={i}
                  style={{
                    left: `${(eye.cx * 100).toFixed(3)}%`,
                    top: `${(eye.cy * 100).toFixed(3)}%`,
                    width: `${(eye.r * 3.4 * 100).toFixed(3)}%`,
                    height: `${(eye.r * 3.4 * (IMG_W / IMG_H) * 100).toFixed(3)}%`,
                  }}
                />
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
