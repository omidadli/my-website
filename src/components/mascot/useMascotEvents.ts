import { useEffect, useRef } from 'react';
import { mascot, MascotPose } from './mascotBus';
import { Page } from '../../types';

/**
 * useMascotEvents — wires the avatar to REAL site events so it behaves like a
 * living assistant, not a looping GIF. Reactions are expressed through the
 * character's face & body poses (sprite swaps) plus short speech-bubble
 * lines — no emoji.
 *
 *  - first visit  → waves hello
 *  - returning    → excited welcome back
 *  - page change  → short contextual line with a matching pose
 *  - copy action  → excited fist-pump
 *  - idle 40s     → escalating nudges: wave → sleepy → confident tip
 *  - exit intent  → sad goodbye attempt (once per session)
 *
 * Bubbles are rate-limited (≥18s apart, no immediate repeats) so it never
 * feels spammy.
 */

export interface MascotCue {
  pose: MascotPose;
  text: string;
  ms?: number;
}

const PAGE_LINES: Partial<Record<Page, { pose: MascotPose; text: string }>> = {
  services: { pose: 'talking', text: 'اینجا خدمات رو کامل توضیح دادیم؛ سوالی بود بپرس.' },
  portfolio: { pose: 'confident', text: 'نتیجه‌ها خودشون حرف می‌زنن؛ یک نگاه بنداز.' },
  about: { pose: 'happy', text: 'این منم! یه سر به مسیر و تخصص‌هام بزن.' },
  blog: { pose: 'thinking', text: 'مقاله‌های تازه درباره رشد و دیتا منتشر شده.' },
  contact: { pose: 'wave', text: 'برای شروع همکاری، همین‌جا پیام بذار.' },
  projects: { pose: 'talking', text: 'پروژه‌های جاری رو ببین؛ شاید جذاب بود.' },
  products: { pose: 'excited', text: 'محصولات آماده؛ سریع‌تر از پروژه اختصاصی!' },
};

const GREETING = 'سلام! من دستیار هوشمند امیدم؛ هر سوالی داری بپرس.';
const WELCOME_BACK = 'دوباره خوش اومدی! از کجا ادامه بدیم؟';

const IDLE_ARC: Array<{ pose: MascotPose; text: string }> = [
  { pose: 'wave', text: 'سوالی داری؟ ازم بپرس.' },
  { pose: 'sleepy', text: 'انقدر که منتظر موندم خمیازه کشیدم... یه کاری کنیم!' },
  { pose: 'confident', text: 'یه پیشنهاد مطمئن: صفحه نمونه‌کارها رو ببین.' },
  { pose: 'thinking', text: 'اگه گم شدی، منوی بالا راهنماییت می‌کنه.' },
];

const COPY_LINE = { pose: 'excited' as MascotPose, text: 'کپی شد؛ بردار!' };
const EXIT_LINE = { pose: 'sad' as MascotPose, text: 'قبل از رفتن، یه لحظه... سوالی داشتی در خدمتم.' };

const CLICK_LINES: Array<{ pose: MascotPose; text: string }> = [
  { pose: 'wave', text: 'بله؟' },
  { pose: 'excited', text: 'آماده‌ام!' },
  { pose: 'confident', text: 'کار خاصی هست؟' },
];

const HOVER_LINES = ['خوش اومدی؛ من همین‌جام.', 'یه چیز بگم؟', 'هر سوالی بود، بپرس.'];

// singleton rate-limit state (this hook is mounted exactly once)
const rate = { lastText: null as string | null, lastAt: 0 };
const SILENCE_KEY = 'nd-mascot-muted';

function say(pose: MascotPose, text: string, ms = 4200, force = false) {
  try {
    if (localStorage.getItem(SILENCE_KEY) === '1') return;
  } catch {
    /* private mode */
  }
  const now = Date.now();
  if (!force && now - rate.lastAt < 18000) return;
  if (text === rate.lastText) return;
  rate.lastText = text;
  rate.lastAt = now;
  window.dispatchEvent(new CustomEvent<MascotCue>('mascot:cues', { detail: { pose, text, ms } }));
  mascot.set(pose);
}

function pick<T>(pool: T[], last: T | null): T {
  const fresh = pool.filter((t) => t !== last);
  return fresh[Math.floor(Math.random() * fresh.length)] ?? pool[0];
}

export { say as mascotSay, CLICK_LINES, HOVER_LINES, pick };

export function useMascotEvents(currentPage: Page) {
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let idleStep = 0;
    let exitIntentUsed = false;

    // ---- idle escalation --------------------------------------------------
    const armIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        const cue = IDLE_ARC[Math.min(idleStep, IDLE_ARC.length - 1)];
        idleStep += 1;
        say(cue.pose, cue.text, 4600);
        armIdle();
      }, 40000);
    };
    armIdle();

    const onActivity = () => {
      idleStep = 0;
      if (idleTimer) clearTimeout(idleTimer);
      armIdle();
    };
    const activityEvents = ['pointermove', 'pointerdown', 'keydown', 'scroll'];
    activityEvents.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    // ---- first visit vs returning visitor ---------------------------------
    const seenKey = 'nd-mascot-seen';
    let returning = false;
    try {
      returning = localStorage.getItem(seenKey) === '1';
      localStorage.setItem(seenKey, '1');
    } catch {
      /* private mode */
    }
    const wake = setTimeout(
      () => {
        if (returning) say('excited', WELCOME_BACK, 4600, true);
        else say('wave', GREETING, 5200, true);
      },
      returning ? 1600 : 1100
    );

    // ---- react to copy ----------------------------------------------------
    const onCopy = () => say(COPY_LINE.pose, COPY_LINE.text, 2400);
    document.addEventListener('copy', onCopy);

    // ---- exit intent (desktop, once per session) --------------------------
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget || e.clientY > 12) return;
      if (exitIntentUsed) return;
      exitIntentUsed = true;
      say(EXIT_LINE.pose, EXIT_LINE.text, 4600, true);
    };
    document.addEventListener('mouseout', onOut);

    return () => {
      clearTimeout(wake);
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((ev) => window.removeEventListener(ev, onActivity));
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  // greet on page change
  useEffect(() => {
    if (currentPage === 'admin') return;
    const key = `nd-mascot-pg-${currentPage}`;
    let first = false;
    try {
      first = sessionStorage.getItem(key) !== '1';
      sessionStorage.setItem(key, '1');
    } catch {
      first = true;
    }
    if (!first) return;
    const cue = PAGE_LINES[currentPage];
    if (!cue) return;
    const t = setTimeout(() => say(cue.pose, cue.text, 4200), 2600);
    return () => clearTimeout(t);
  }, [currentPage]);
}
