import { useEffect, useRef } from 'react';
import { mascot } from './mascotBus';
import { Page } from '../../types';

/**
 * useMascotEvents — the mascot's scenario matrix: every user journey event is
 * mapped to the most natural reaction (a scene + a short line).
 *
 *  journey                        → scene
 *  ---------------------------------------
 *  first visit                    → wave + excited (greet)
 *  returning visit                → excited
 *  land on a page (first time)    → a pose that matches the page's intent
 *  hovers the avatar              → happy + hello
 *  clicks the avatar              → opens the chat panel (scene: wave)
 *  copies a code/text             → excited (nice, take it!)
 *  submits the contact form       → celebrate (fist pump)
 *  books a meeting                → celebrate
 *  starts typing in the chat      → talks (he's listening)
 *  chat: assistant is "typing"    → typing on his laptop (loop)
 *  chat: answer arrives           → talking (loop, he reads it out)
 *  chat: API error                → oops (surprised → apologetic)
 *  idle 40s / 80s / 120s          → wave → sleepy → confident tip
 *  about to leave the page        → sad (stay!)
 */

export interface MascotCue {
  scene: string;
  text: string;
  ms?: number;
}

const PAGE_CUES: Partial<Record<Page, { scene: string; text: string }>> = {
  services: { scene: 'talk', text: 'اینجا خدمات رو کامل توضیح دادیم؛ سوالی بود بپرس.' },
  portfolio: { scene: 'flex', text: 'نتیجه‌ها خودشون حرف می‌زنن؛ یک نگاه بنداز.' },
  about: { scene: 'laugh', text: 'این منم! یه سر به مسیر و تخصص‌هام بزن.' },
  blog: { scene: 'think', text: 'مقاله‌های تازه درباره رشد و دیتا منتشر شده.' },
  contact: { scene: 'wave', text: 'برای شروع همکاری، همین‌جا پیام بذار.' },
  projects: { scene: 'talk', text: 'پروژه‌های جاری رو ببین؛ شاید جذاب بود.' },
  products: { scene: 'celebrate', text: 'محصولات آماده؛ سریع‌تر از پروژه اختصاصی!' },
};

const GREETING = 'سلام! من دستیار هوشمند امیدم؛ هر سوالی داری بپرس.';
const WELCOME_BACK = 'دوباره خوش اومدی! از کجا ادامه بدیم؟';

const IDLE_ARC: Array<{ scene: string; text: string }> = [
  { scene: 'greet', text: 'سوالی داری؟ ازم بپرس.' },
  { scene: 'sleepy', text: 'انقدر که منتظر موندم خمیازه کشیدم... یه کاری کنیم!' },
  { scene: 'flex', text: 'یه پیشنهاد مطمئن: صفحه نمونه‌کارها رو ببین.' },
  { scene: 'think', text: 'اگه گم شدی، منوی بالا راهنماییت می‌کنه.' },
];

const rate = { lastText: null as string | null, lastAt: 0 };
const SILENCE_KEY = 'nd-mascot-muted';

export function mascotCue(scene: string, text: string, ms = 4200, force = false) {
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
  window.dispatchEvent(new CustomEvent<MascotCue>('mascot:cues', { detail: { scene, text, ms } }));
  mascot.scene(scene, ms);
}

/** Force a scene with no bubble and no rate-limit (chat wiring etc.). */
export function mascotAct(sc: string, ms?: number) {
  mascot.scene(sc, ms);
}

export { GREETING, WELCOME_BACK, IDLE_ARC, PAGE_CUES };

export function useMascotEvents(currentPage: Page) {
  const armedRef = useRef(false);

  // ---- journey events (mount once) --------------------------------------
  useEffect(() => {
    if (armedRef.current) return;
    armedRef.current = true;

    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let idleStep = 0;
    let exitIntentUsed = false;

    const armIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        const cue = IDLE_ARC[Math.min(idleStep, IDLE_ARC.length - 1)];
        idleStep += 1;
        mascotCue(cue.scene, cue.text, 4600);
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
        if (returning) mascotCue('celebrate', WELCOME_BACK, 4600, true);
        else mascotCue('greet', GREETING, 5200, true);
      },
      returning ? 1600 : 1100
    );

    const onCopy = () => mascotCue('celebrate', 'کپی شد؛ بردار!', 2400);
    document.addEventListener('copy', onCopy);

    // contact form success → celebrate
    const onFormOk = () => mascotCue('celebrate', 'پیامت رسید! خیلی زود جواب می‌دم.', 5000, true);
    window.addEventListener('nd:form-success', onFormOk);

    // booking success → celebrate
    const onBooked = () => mascotCue('celebrate', 'جلسه‌ت رزرو شد! می‌بینمت.', 5000, true);
    window.addEventListener('nd:booking-success', onBooked);

    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget || e.clientY > 12) return;
      if (exitIntentUsed) return;
      exitIntentUsed = true;
      mascotCue('sad', 'قبل از رفتن، یه لحظه... سوالی داشتی در خدمتم.', 4600, true);
    };
    document.addEventListener('mouseout', onOut);

    return () => {
      clearTimeout(wake);
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((ev) => window.removeEventListener(ev, onActivity));
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('mouseout', onOut);
      window.removeEventListener('nd:form-success', onFormOk);
      window.removeEventListener('nd:booking-success', onBooked);
    };
  }, []);

  // ---- page-change cue ---------------------------------------------------
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
    const cue = PAGE_CUES[currentPage];
    if (!cue) return;
    const t = setTimeout(() => mascotCue(cue.scene, cue.text, 4200), 2600);
    return () => clearTimeout(t);
  }, [currentPage]);
}
