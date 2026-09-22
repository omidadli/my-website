import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { mascot } from './mascotBus';
import { MascotCue } from './useMascotEvents';
import sprites from './sprites.json';

/**
 * Mascot figure — shared visual engine.
 *
 * Reactions play as GIF-like animations built from frame sequences (2–3 WebP
 * frames per glyph):
 *   typing  → 3 frames behind a laptop (fast loop while the AI "writes")
 *   talking → 3 frames of mouth/hand motion (loop while the answer lands)
 *   greet   → wave frame, then excited frame …
 *
 * `MascotFigure` renders the character (frame sequencer + cursor-tracking
 * pupils + body parallax). It's used twice: pinned in the bottom-right corner
 * (`MascotAvatar`) and as the live "video bar" inside the chat panel — both
 * stay in sync through the global mascot bus.
 */

type Eye = { cx: number; cy: number; r: number };
type SpriteMeta = { src: string; w: number; h: number; eyes: Eye[] | null };
const META = sprites as unknown as Record<string, SpriteMeta>;

/** scene name → glyph frame sequence (loop:true on a step = hold/loop there) */
const GLYPHS: Record<string, Array<{ f: string; ms: number; loop?: boolean }>> = {
  'pose:idle': [{ f: 'idle', ms: 0, loop: true }],
  'pose:wave': [{ f: 'wave', ms: 0, loop: true }],
  'pose:happy': [{ f: 'happy', ms: 0, loop: true }],
  'pose:excited': [{ f: 'excited', ms: 0, loop: true }],
  'pose:thinking': [{ f: 'thinking', ms: 0, loop: true }],
  'pose:sad': [{ f: 'sad', ms: 0, loop: true }],
  'pose:surprised': [{ f: 'surprised', ms: 0, loop: true }],
  'pose:confused': [{ f: 'confused', ms: 0, loop: true }],
  'pose:confident': [{ f: 'confident', ms: 0, loop: true }],
  'pose:sleepy': [{ f: 'sleepy', ms: 0, loop: true }],
  'pose:typing': [
    { f: 'typing-1', ms: 160 },
    { f: 'typing-2', ms: 150 },
    { f: 'typing-3', ms: 160 },
    { f: 'typing-2', ms: 150, loop: true },
  ],
  'pose:talking': [
    { f: 'talking', ms: 150 },
    { f: 'talking-b', ms: 170 },
    { f: 'talking-c', ms: 130 },
    { f: 'talking-b', ms: 170, loop: true },
  ],

  greet: [
    { f: 'wave', ms: 1500 },
    { f: 'excited', ms: 1400 },
    { f: 'idle', ms: 0, loop: true },
  ],
  celebrate: [
    { f: 'excited', ms: 1600 },
    { f: 'happy', ms: 1400 },
    { f: 'idle', ms: 0, loop: true },
  ],
  laugh: [
    { f: 'happy', ms: 2400 },
    { f: 'idle', ms: 0, loop: true },
  ],
  oops: [
    { f: 'surprised', ms: 1400 },
    { f: 'sad', ms: 2600 },
    { f: 'idle', ms: 0, loop: true },
  ],
  puzzled: [
    { f: 'confused', ms: 2800 },
    { f: 'idle', ms: 0, loop: true },
  ],
  flex: [
    { f: 'confident', ms: 3000 },
    { f: 'idle', ms: 0, loop: true },
  ],
  sleepy: [
    { f: 'sleepy', ms: 4200 },
    { f: 'idle', ms: 0, loop: true },
  ],
  think: [{ f: 'thinking', ms: 0, loop: true }],
  typing: [
    { f: 'typing-1', ms: 160 },
    { f: 'typing-2', ms: 150 },
    { f: 'typing-3', ms: 160 },
    { f: 'typing-2', ms: 150, loop: true },
  ],
  talk: [
    { f: 'talking', ms: 150 },
    { f: 'talking-b', ms: 170 },
    { f: 'talking-c', ms: 130 },
    { f: 'talking-b', ms: 170, loop: true },
  ],
  sad: [
    { f: 'sad', ms: 4200 },
    { f: 'idle', ms: 0, loop: true },
  ],
  surprised: [
    { f: 'surprised', ms: 2200 },
    { f: 'idle', ms: 0, loop: true },
  ],
};

// single-frame glyphs → cursor-tracking pupils allowed
const STATIC_FRAMES = new Set(['idle', 'wave', 'excited', 'thinking', 'sad', 'surprised', 'confused']);
// artwork already handles the acting (sunglasses / shut eyes / looking at the screen)
const NO_PUPILS = new Set(['confident', 'happy', 'sleepy', 'typing-1', 'typing-2', 'typing-3', 'talking', 'talking-b', 'talking-c']);

const ALL_FRAMES = Array.from(new Set(Object.values(GLYPHS).flat().map((g) => g.f)));

const BODY_X = 0.014;
const BODY_Y = 0.008;
const BODY_R = 1.6;
const DEAD_ZONE = 22;
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** The living character. Used in the corner widget AND inside the chat panel. */
export function MascotFigure({ corner = false }: { corner?: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const pupilRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [frameIdx, setFrameIdx] = useState(ALL_FRAMES.indexOf('idle'));
  const frameIdxRef = useRef(frameIdx);
  frameIdxRef.current = frameIdx;
  const frameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef<{ seq: Array<{ f: string; ms: number; loop?: boolean }>; i: number }>({
    seq: GLYPHS['pose:idle'],
    i: 0,
  });

  // ------------------------------------------------ frame sequencer
  useEffect(() => {
    const play = (i: number) => {
      const { seq } = seqRef.current;
      seqRef.current.i = i;
      const step = seq[i];
      setFrameIdx(ALL_FRAMES.indexOf(step.f));
      if (frameTimer.current) clearTimeout(frameTimer.current);
      frameTimer.current = setTimeout(() => {
        const s = seqRef.current;
        if (s.i + 1 < s.seq.length) play(s.i + 1);
      }, step.ms || 60);
    };

    const unsub = mascot.subscribe((name) => {
      const seq = GLYPHS[name] ?? GLYPHS['pose:idle'];
      seqRef.current = { seq, i: 0 };
      play(0);
    });
    return () => {
      unsub();
      if (frameTimer.current) clearTimeout(frameTimer.current);
    };
  }, []);

  // ------------------------------------------------ eye/body animation
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
      const frame = ALL_FRAMES[frameIdxRef.current];
      const meta = META[frame];

      if (!NO_PUPILS.has(frame) && meta?.eyes && mouse) {
        const rect = root.getBoundingClientRect();
        const fx = rect.left + rect.width / 2;
        const fy = rect.top + rect.height * (meta.eyes[0]?.cy ?? 0.3);
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

      let sx = 0;
      let sy = 0;
      if (!NO_PUPILS.has(frame)) {
        if (now > saccade.next && now > saccade.until) {
          saccade = {
            x: (Math.random() - 0.5) * 0.2,
            y: (Math.random() - 0.5) * 0.12,
            until: now + 90 + Math.random() * 80,
            next: now + 2400 + Math.random() * 3200,
          };
        }
        if (now < saccade.until) {
          sx = saccade.x;
          sy = saccade.y;
        }
      }

      fast.x += (tgt.x - fast.x) * 0.2;
      fast.y += (tgt.y - fast.y) * 0.2;
      cur.x += (tgt.x - cur.x) * 0.05;
      cur.y += (tgt.y - cur.y) * 0.05;
      const gx = cur.x * 0.72 + fast.x * 0.28 + sx;
      const gy = cur.y * 0.72 + fast.y * 0.28 + sy;

      const w = root.getBoundingClientRect().width;
      if (!NO_PUPILS.has(frame) && meta?.eyes) {
        const rr = (meta.eyes[0]?.r ?? 0.016) * w;
        const ex = gx * 1.3 * rr;
        const ey = gy * 1.3 * rr * 0.85;
        for (const el of pupilRefs.current) {
          if (el) el.style.transform = `translate(-50%, -50%) translate3d(${ex.toFixed(2)}px, ${ey.toFixed(2)}px, 0)`;
        }
      }

      const hx = gx * BODY_X * w;
      const hy = gy * BODY_Y * w;
      const hr = gx * BODY_R;
      body.style.transform = `translate3d(${hx.toFixed(2)}px, ${hy.toFixed(2)}px, 0) rotate(${hr.toFixed(2)}deg)`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouse = null;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  const activeFrame = ALL_FRAMES[frameIdx];

  return (
    <div ref={rootRef} className={`mascot-figure ${corner ? 'mascot-figure--corner' : ''}`}>
      <div className="mascot-body" ref={bodyRef}>
        {ALL_FRAMES.map((f) => (
          <img
            key={f}
            src={META[f].src}
            alt=""
            width={META[f].w}
            height={META[f].h}
            draggable={false}
            decoding="async"
            className={`mascot-img ${f === activeFrame ? 'is-active' : ''}`}
          />
        ))}
        {ALL_FRAMES.filter((f) => STATIC_FRAMES.has(f)).map((p) =>
          ((META[p].eyes ?? []) as Eye[]).map((eye, i) => (
            <span
              key={`${p}-${i}`}
              ref={(el) => {
                pupilRefs.current[ALL_FRAMES.indexOf(p) * 2 + i] = el;
              }}
              className={`mascot-pupil ${activeFrame === p ? 'is-active' : ''}`}
              style={{
                left: `${(eye.cx * 100).toFixed(3)}%`,
                top: `${(eye.cy * 100).toFixed(3)}%`,
                width: `${(eye.r * 1.65 * 100).toFixed(3)}%`,
              }}
            />
          ))
        )}
      </div>
      {corner && <div className="mascot-shadow" />}
    </div>
  );
}

/** Corner widget: the clickable mascot + speech bubbles. */
export function MascotAvatar() {
  const [bubble, setBubble] = useState<{ id: number; text: string; shown: string } | null>(null);
  const bubbleId = useRef(0);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeInt = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const lastHover = useRef(0);
  const onHover = () => {
    const now = Date.now();
    if (now - lastHover.current < 30000) return;
    lastHover.current = now;
    if (mascot.currentScene === 'idle' || mascot.currentScene.startsWith('pose:')) {
      mascot.scene('greet', 2800);
    }
  };

  return (
    <div className="mascot-root fixed bottom-4 right-4 z-[50] sm:bottom-7 sm:right-7">
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
        className="mascot-stage"
        onClick={() => window.dispatchEvent(new CustomEvent('nd:open-chat'))}
        onMouseEnter={onHover}
        role="button"
        tabIndex={0}
        aria-label="دستیار هوشمند — باز کردن گفتگو"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('nd:open-chat'));
          }
        }}
      >
        <div className="mascot-sway">
          <MascotFigure corner />
        </div>
      </div>
    </div>
  );
}
