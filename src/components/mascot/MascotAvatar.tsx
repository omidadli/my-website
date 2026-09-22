import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { mascot, SCENES } from './mascotBus';
import { MascotCue } from './useMascotEvents';
import sprites from './sprites.json';

/**
 * Mascot figure — the living character.
 *
 * Head tracking: instead of moving pupil overlays (which read as fake), the
 * WHOLE figure turns toward the cursor in fake-3D — perspective rotateY /
 * rotateX around the neck pivot (transform-origin 50% 88%), plus a subtle
 * counter-translate. With no mouse for a few seconds he slowly glances
 * around on his own, like someone thinking.
 *
 * Acting = GIF-style frame loops driven by mascotBus (typing, talk, listen,
 * greet, celebrate, oops…). Used twice: corner widget + chat video bar,
 * always in sync via the bus.
 */

type SpriteMeta = { src: string; w: number; h: number; eyes: Eye[] | null };
type Eye = { cx: number; cy: number; r: number };
const META = sprites as unknown as Record<string, SpriteMeta>;

const ALL_FRAMES = Array.from(new Set(Object.values(SCENES).flatMap((s) => s.frames.map((f) => f.f))));

const TURN_Y = 9; // max head-turn, degrees
const TURN_X = 5.5; // max head tilt, degrees
const DRIFT_X = 0.012; // body counter-translate (× width)
const DRIFT_Y = 0.008;
const GLANCE_AFTER = 4200; // ms without mouse → he starts glancing around
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

export function MascotFigure({ corner = false }: { corner?: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const [scene, setScene] = useState('idle');
  const [def, setDef] = useState(SCENES.idle);
  const [frameIdx, setFrameIdx] = useState(0);
  const frameIdxRef = useRef(0);
  frameIdxRef.current = frameIdx;
  const defRef = useRef(def);
  defRef.current = def;

  // ------------------------------------------------ frame sequencer (GIF loops)
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

  // warm the frame cache so the first loop never stutters
  useEffect(() => {
    const run = () => {
      ALL_FRAMES.forEach((f) => {
        const im = new Image();
        im.src = META[f].src;
        im.decode?.().catch(() => undefined);
      });
    };
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
    if (ric) ric(run);
    else setTimeout(run, 1500);
  }, []);

  // ------------------------------------------------ head tracking
  useEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const cur = { x: 0, y: 0 };
    const tgt = { x: 0, y: 0 };
    let mouse: { x: number; y: number } | null = null;
    let lastMove = 0;

    const tick = (now: number) => {
      if (mouse && now - lastMove < GLANCE_AFTER) {
        // follow the cursor — stronger when he's centered on screen
        const rect = root.getBoundingClientRect();
        const fx = rect.left + rect.width / 2;
        const fy = rect.top + rect.height * 0.35; // ≈ head height
        const dx = mouse.x - fx;
        const dy = mouse.y - fy;
        const dist = Math.hypot(dx, dy) || 1;
        const norm = Math.min(1, dist / (window.innerWidth * 0.42));
        tgt.x = clamp((dx / dist) * norm, -1, 1);
        tgt.y = clamp((dy / dist) * norm, -1, 1);
      } else {
        // no cursor around → slow curious glances left/right
        const t = now / 1000;
        tgt.x = 0.3 * Math.sin(t * 0.5);
        tgt.y = 0.12 * Math.sin(t * 0.33 + 1.1);
      }

      cur.x += (tgt.x - cur.x) * 0.07;
      cur.y += (tgt.y - cur.y) * 0.07;

      const w = root.getBoundingClientRect().width;
      body.style.transform =
        `perspective(720px) rotateY(${(cur.x * TURN_Y).toFixed(2)}deg) rotateX(${(-cur.y * TURN_X).toFixed(2)}deg) ` +
        `translate3d(${(cur.x * DRIFT_X * w).toFixed(2)}px, ${(cur.y * DRIFT_Y * w).toFixed(2)}px, 0)`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      mouse = { x: e.clientX, y: e.clientY };
      lastMove = performance.now();
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
      </div>
      {corner && <div className="mascot-shadow" />}
    </div>
  );
}

/** Corner widget: clickable mascot flush with the bottom edge + speech bubbles. */
export function MascotAvatar() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const compactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [bubble, setBubble] = useState<{ id: number; text: string; shown: string; askName?: boolean } | null>(null);
  const bubbleId = useRef(0);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeInt = useRef<ReturnType<typeof setInterval> | null>(null);
  const [nameInput, setNameInput] = useState('');

  const showBubble = useCallback((text: string, ms: number, askName = false) => {
    bubbleId.current += 1;
    setBubble({ id: bubbleId.current, text, shown: '', askName });
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
      showBubble(d.text, d.ms ?? 4200, d.askName);
    };
    window.addEventListener('mascot:cues', onCue);
    return () => {
      window.removeEventListener('mascot:cues', onCue);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      if (typeInt.current) clearInterval(typeInt.current);
    };
  }, [showBubble]);

  // while scrolling: compact + dim so sections stay readable
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

  // ---- name capture ------------------------------------------------------
  const submitName = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nameInput.trim().slice(0, 24);
    if (!n) return;
    try {
      localStorage.setItem('nd-mascot-name', n);
    } catch {
      /* private mode */
    }
    window.dispatchEvent(new CustomEvent('nd:mascot-name', { detail: n }));
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    mascot.scene('celebrate');
    showBubble(`خوشحالم شناختم، ${n}! هر سوالی بود در خدمتم.`, 4600);
  };

  const skipName = () => {
    try {
      localStorage.setItem('nd-mascot-skip', '1');
    } catch {
      /* private mode */
    }
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    setBubble(null);
    mascot.scene('wave');
  };

  const askVisible = !!bubble?.askName && bubble.shown === bubble.text;

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
            onMouseEnter={() => {
              if (bubbleTimer.current && bubble?.askName) clearTimeout(bubbleTimer.current);
            }}
          >
            {bubble.shown}
            {askVisible && (
              <form onSubmit={submitName} className="mascot-ask-row">
                <input
                  autoFocus
                  maxLength={24}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="اسمت چیه؟"
                  className="mascot-ask-input"
                  aria-label="اسم شما"
                />
                <button type="submit" className="mascot-ask-btn mascot-ask-btn--ok">
                  ثبت
                </button>
                <button type="button" onClick={skipName} className="mascot-ask-btn">
                  بعداً
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="mascot-stage"
        onClick={() => window.dispatchEvent(new CustomEvent('nd:open-chat'))}
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
