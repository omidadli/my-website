import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { mascotController } from './soul';
import { MascotWorkstation } from './MascotWorkstation';
import { MascotCue } from './useMascotEvents';

/**
 * MascotAvatar — the corner resident.
 *
 * The character lives at his workstation; clicking him opens the chat (he then
 * "walks into" the panel's video bar, see `body.chat-open`). Speech bubbles are
 * the only thing this component owns — every body movement goes through
 * `mascotController.dispatch()`, never through a scene call.
 */

export function MascotAvatar() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const compactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [bubble, setBubble] = useState<{ id: number; text: string; shown: string; askName?: boolean } | null>(null);
  const bubbleId = useRef(0);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeInt = useRef<ReturnType<typeof setInterval> | null>(null);
  const [nameInput, setNameInput] = useState('');

  const clearBubbleTimers = useCallback(() => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = null;
    if (typeInt.current) clearInterval(typeInt.current);
    typeInt.current = null;
  }, []);

  const showBubble = useCallback(
    (text: string, ms: number, askName = false) => {
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
    },
    []
  );

  useEffect(() => {
    const onCue = (e: Event) => {
      const d = (e as CustomEvent<MascotCue>).detail;
      if (!d?.text) return;
      showBubble(d.text, d.ms ?? 4200, d.askName);
    };
    window.addEventListener('mascot:cues', onCue);
    return () => {
      window.removeEventListener('mascot:cues', onCue);
      clearBubbleTimers();
    };
  }, [showBubble, clearBubbleTimers]);

  // while scrolling: dim so sections stay readable (never covers content)
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
    clearBubbleTimers();
    mascotController.dispatch({ type: 'FORM_SUCCESS', label: 'name-captured' });
    showBubble(`خوشحالم شناختم، ${n}! هر سوالی بود در خدمتم.`, 4600);
  };

  const skipName = () => {
    try {
      localStorage.setItem('nd-mascot-skip', '1');
    } catch {
      /* private mode */
    }
    clearBubbleTimers();
    setBubble(null);
    mascotController.dispatch({ type: 'USER_RETURNED', label: 'name-skipped' });
  };

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
        <MascotWorkstation />
      </div>
    </div>
  );
}
