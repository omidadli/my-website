import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { mascot, SCENES } from './mascotBus';
import { MascotCue } from './useMascotEvents';
import sprites from './sprites.json';

/**
 * Mascot figure — the living character.
 *
 * Acting = GIF-style frame sequences driven by the scene director
 * (mascotBus). Looping scenes cycle their frames forever until replaced;
 * finite scenes play once and fall back to idle. On single-frame scenes the
 * pupils additionally track the cursor (per-sprite iris coordinates measured
 * with FaceMesh).
 *
 * Used twice — pinned to the bottom edge (`MascotAvatar`) and as the live
 * video bar inside the chat panel — both perfectly in sync via the bus.
 */

type Eye = { cx: number; cy: number; r: number };
type SpriteMeta = { src: string; w: number; h: number; eyes: Eye[] | null };
const META = sprites as unknown as Record<string, SpriteMeta>;

// frames where pupils may track the cursor (single-frame, eyes-open art)
const PUPIL_FRAMES = new Set(['idle', 'wave', 'excited', 'thinking', 'surprised', 'confused']);
// art that already acts with its own eyes (sunglasses / shut eyes / looking down)
const ALL_FRAMES = Array.from(new Set(Object.values(SCENES).flatMap((s) => s.frames.map((f) => f.f))));

const BODY_X = 0.014;
const BODY_Y = 0.008;
const BODY_R = 1.6;
const DEAD_ZONE = 22;
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export function MascotFigure({ corner = false }: { corner?: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const pupilRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [scene, setScene] = useState('idle');
  const [def, setDef] = useState(SCENES.idle);
  const [frameIdx, setFrameIdx] = useState(0);
  const frameIdxRef = useRef(0);
  frameIdxRef.current = frameIdx;
  const defRef = useRef(def);
  defRef.current = def;

  // ------------------------------------------------ frame sequencer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const playAt = (i: number) => {
      const d = defRef.current;
      const step = d.frames[i];
      if (!step) return;
      setFrameIdx(i);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (d.loop) playAt((i + 1) % d.frames.length);
        else if (i + 1 < d.frames.length) playAt(i + 1);
      }, Math.max(60, step.ms));
    };
    const unsub = mascot.subscribe((name) => {
      const d = SCENES[name] ?? SCENES.idle;
      setDef(d);
      defRef.current = d;
      setScene(name);
      playAt(0);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);

  // warm the frame cache so the first loop doesn't stutter
  useEffect(() => {
    const warm = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
    const run = () => {
      ALL_FRAMES.forEach((f) => {
        const im = new Image();
        im.src = META[f].src;
        im.decode?.().catch(() => undefined);
      });
    };
    if (warm) warm(run);
    else setTimeout(run, 1500);
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
      const frame = defRef.current.frames[frameIdxRef.current]?.f ?? 'idle';
      const meta = META[frame];
      const trackable = PUPIL_FRAMES.has(frame) && meta?.eyes;

      if (trackable && mouse) {
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
      if (trackable) {
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
      if (trackable) {
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

  const activeFrame = def.frames[frameIdx]?.f ?? 'idle';
  const isMultiFrame = def.frames.length > 1;

  return (
    <div ref={rootRef} className={`mascot-figure ${corner ? 'mascot-figure--corner' : ''}`} data-scene={scene} data-anim={isMultiFrame ? '1' : '0'}>
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
        {ALL_FRAMES.filter((f) => PUPIL_FRAMES.has(f)).map((p) =>
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

/** Corner widget: clickable mascot flush with the bottom edge + speech bubbles. */
export function MascotAvatar() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const compactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // while the user scrolls: shrink + fade the mascot so it never fights
  // with section readability; restore ~500ms after scrolling stops
  useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const root = rootRef.current;
      if (!root) return;
      const now = Date.now();
      if (now - last > 90) root.classList.add('mascot-compact');
      last = now;
      if (compactTimer.current) clearTimeout(compactTimer.current);
      compactTimer.current = setTimeout(() => root.classList.remove('mascot-compact'), 550);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (compactTimer.current) clearTimeout(compactTimer.current);
    };
  }, []);

  const lastHover = useRef(0);
  const onHover = () => {
    const now = Date.now();
    if (now - lastHover.current < 30000) return;
    lastHover.current = now;
    if (mascot.currentScene === 'idle') mascot.scene('greet');
  };

  return (
    <div ref={rootRef} className="mascot-root fixed bottom-0 right-2 z-[50] sm:right-5">
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
