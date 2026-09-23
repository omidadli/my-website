import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { mascot } from './mascotBus';
import { soulJourney } from './soul';
import { MascotCue } from './useMascotEvents';
import { VIDEO_SCENES, MascotVisualStep, videoSrc } from './mascotVideos';
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
 * Acting: the bus scene is rendered as VIDEO layers — a looping/one-shot
 * <video> per state (see mascotVideos.ts) inside a rounded "avatar screen".
 * Transitions are a 320ms crossfade: the incoming layer mounts at opacity 0
 * under/over the outgoing one, starts at frame 0, and only fades in once its
 * first frame is decodable — the outgoing video keeps playing underneath, so
 * a slow first fetch never flashes blank. After the fade the old element is
 * unmounted (key hand-over) to release its decoder.
 *
 * Looping videos do NOT use the native `loop` attribute: on `ended` a fresh
 * copy of the same video crossfades in (self-crossfade), so the loop cut is
 * masked even when the clip's last frame ≠ first frame. One-shot videos play
 * once, hold their last frame, and yield to the bus's next state (idle or the
 * hold/then choreography soul.ts already scheduled).
 *
 * Used twice: corner widget + chat video bar, always in sync via the bus.
 */

type SpriteMeta = { src: string; w: number; h: number; eyes: { cx: number; cy: number; r: number }[] | null };
const META = sprites as unknown as Record<string, SpriteMeta>;

const FADE_MS = 320; // crossfade budget (250–400ms per spec)
const TURN_Y = 17; // max head-turn, degrees — clearly visible
const TURN_X = 10; // max head tilt, degrees
const DRIFT_X = 0.045; // body follow-translate (× width) — sells the 3D turn
const DRIFT_Y = 0.026;
const GLANCE_AFTER = 4200; // ms without mouse → he starts glancing around
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

interface Layer {
  key: number;
  step: MascotVisualStep;
}

const posterOf = (step: MascotVisualStep): string | undefined =>
  step.poster && META[step.poster] ? META[step.poster].src : undefined;

function LayerView({
  layer,
  visible,
  onReady,
  onEnded,
  onVideoEl,
}: {
  layer: Layer;
  visible: boolean;
  onReady: () => void;
  onEnded: () => void;
  onVideoEl: (el: HTMLVideoElement | null) => void;
}) {
  const style: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transition: `opacity ${FADE_MS}ms ease`,
  };
  if (layer.step.img) {
    return (
      <img
        src={META[layer.step.img].src}
        alt=""
        draggable={false}
        decoding="async"
        onLoad={onReady}
        className="mascot-layer mascot-layer--img"
        style={style}
      />
    );
  }
  return (
    <video
      ref={onVideoEl}
      src={videoSrc(layer.step) ?? undefined}
      poster={posterOf(layer.step)}
      autoPlay
      muted
      playsInline
      preload="auto"
      onCanPlay={onReady}
      onEnded={onEnded}
      className="mascot-layer mascot-layer--video"
      style={style}
    />
  );
}

export function MascotFigure({ corner = false }: { corner?: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const [scene, setScene] = useState('idle');
  const [front, setFront] = useState<Layer>({ key: 0, step: { v: 'idle', loop: true } });
  const [back, setBack] = useState<Layer | null>(null);
  const [backIn, setBackIn] = useState(false);

  const frontRef = useRef(front);
  frontRef.current = front;
  const backRef = useRef(back);
  backRef.current = back;
  const keyRef = useRef(0);
  const sceneRef = useRef('idle');
  const pendingRef = useRef<string | null>(null); // deferred switch (one-shot still playing)
  const stepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyKeys = useRef(new Set<number>());
  const videoEls = useRef(new Map<number, HTMLVideoElement>());

  const attachVideo = useCallback(
    (key: number) => (el: HTMLVideoElement | null) => {
      if (el) {
        videoEls.current.set(key, el);
        // corner figure is hidden while the chat panel is open → keep it quiet
        if (corner && document.body.classList.contains('chat-open')) el.pause();
      } else {
        videoEls.current.delete(key);
      }
    },
    [corner]
  );

  // ------------------------------------------------ scene → visual layers
  const startScene = useCallback((name: string) => {
    const visual = VIDEO_SCENES[name] ?? VIDEO_SCENES.idle;
    sceneRef.current = name;
    if (stepTimer.current) clearTimeout(stepTimer.current);

    // first step in
    const first = visual.steps[0];
    keyRef.current += 1;
    const layer: Layer = { key: keyRef.current, step: first };
    setBack(layer);
    setBackIn(false);
    pendingRef.current = null;

    // choreography: advance through timed steps (celebrate / oops / listen…)
    const advance = (idx: number) => {
      const step = visual.steps[idx];
      if (!step?.ms) return;
      const next = visual.loop ? (idx + 1) % visual.steps.length : idx + 1;
      if (next >= visual.steps.length) return;
      stepTimer.current = setTimeout(() => {
        if (sceneRef.current !== name) return; // a newer scene took over
        keyRef.current += 1;
        setBack({ key: keyRef.current, step: visual.steps[next] });
        setBackIn(false);
        advance(next);
      }, step.ms);
    };
    advance(0);
  }, []);

  useEffect(() => {
    const onScene = (name: string) => {
      setScene(name);
      // one-shot courtesy: while a one-shot VIDEO is still playing (wave… or
      // the tail of a choreography), a plain return to idle waits for its
      // natural end (onEnded) instead of cutting the gesture; any other scene
      // interrupts immediately.
      const busyOneShot = [frontRef.current, backRef.current].some(
        (l) => l && l.step.v && !l.step.loop
      );
      if (name === 'idle' && sceneRef.current !== 'idle' && busyOneShot) {
        pendingRef.current = 'idle';
        return;
      }
      startScene(name);
    };
    const unsub = mascot.subscribe(onScene);
    return () => {
      unsub();
      if (stepTimer.current) clearTimeout(stepTimer.current);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [startScene]);

  // when the incoming layer's first frame is decodable → start it at 0 and fade in
  const handleReady = useCallback((key: number) => {
    if (readyKeys.current.has(key)) return;
    readyKeys.current.add(key);
    const el = videoEls.current.get(key);
    if (el) {
      try {
        if (el.currentTime > 0.05) el.currentTime = 0; // never resume mid-clip
      } catch {
        /* not seekable yet */
      }
      el.play().catch(() => undefined); // iOS Safari: muted+playsInline autoplay
    }
    setBackIn(true);
    // hand the DOM node over: back becomes front (same key → no remount,
    // no restart), the old front unmounts and releases its decoder.
    // Guard: if a newer layer superseded this one mid-fade, leave it alone.
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => {
      const b = backRef.current;
      if (!b || b.key !== key) return;
      const oldKey = frontRef.current.key;
      setFront(b);
      setBack(null);
      setBackIn(false);
      if (oldKey !== key) readyKeys.current.delete(oldKey);
    }, FADE_MS + 60);
  }, []);

  // looping step finished → seamless self-crossfade; one-shot → hold last frame
  const handleEnded = useCallback(
    (key: number) => {
      if (key !== frontRef.current.key) return;
      const step = frontRef.current.step;
      if (step.loop) {
        keyRef.current += 1;
        setBack({ key: keyRef.current, step });
        setBackIn(false);
      }
      if (pendingRef.current) {
        const p = pendingRef.current;
        pendingRef.current = null;
        startScene(p);
      }
    },
    [startScene]
  );

  // tab hidden → resume the front video when the user comes back
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      const f = frontRef.current;
      const el = videoEls.current.get(f.key);
      if (el && !el.ended && el.paused) el.play().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // corner figure: the chat panel "owns" the mascot while open → pause corner video
  useEffect(() => {
    if (!corner) return;
    const apply = () => {
      const hidden = document.body.classList.contains('chat-open');
      videoEls.current.forEach((el) => {
        if (hidden) {
          el.pause();
        } else if (!el.ended && el.paused && el.currentTime < Math.max(0, (el.duration || 1) - 0.3)) {
          el.play().catch(() => undefined);
        }
      });
    };
    const mo = new MutationObserver(apply);
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    apply();
    return () => mo.disconnect();
  }, [corner]);

  // ------------------------------------------------ head tracking (unchanged)
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

      cur.x += (tgt.x - cur.x) * 0.09;
      cur.y += (tgt.y - cur.y) * 0.09;

      const w = root.getBoundingClientRect().width;
      body.style.transform =
        `perspective(520px) rotateY(${(cur.x * TURN_Y).toFixed(2)}deg) rotateX(${(-cur.y * TURN_X).toFixed(2)}deg) ` +
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

  return (
    <div
      ref={rootRef}
      className={`mascot-figure ${corner ? 'mascot-figure--corner' : ''}`}
      data-scene={scene}
      data-anim="1"
    >
      <div className="mascot-body" ref={bodyRef}>
        <div className="mascot-screen">
          {/* keys are stable across the front↔back hand-over: React moves the
              same <video> DOM node (keeps playing) instead of remounting it */}
          <LayerView
            key={front.key}
            layer={front}
            visible
            onReady={() => undefined}
            onEnded={() => handleEnded(front.key)}
            onVideoEl={attachVideo(front.key)}
          />
          {back && (
            <LayerView
              key={back.key}
              layer={back}
              visible={backIn}
              onReady={() => handleReady(back.key)}
              onEnded={() => handleEnded(back.key)}
              onVideoEl={attachVideo(back.key)}
            />
          )}
        </div>
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
    soulJourney({ pose: 'excited', hold: 2.4, then: 'happy' });
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
    soulJourney({ pose: 'wave', hold: 2.6 });
  };

  // the input row appears right away so the visitor can start typing
  const askVisible = !!bubble?.askName;

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
                  onFocus={() => {
                    // user is answering — stop the bubble from dismissing
                    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
                  }}
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
