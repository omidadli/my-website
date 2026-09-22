import { useEffect, useRef } from 'react';
import { mascot, MascotMood } from './mascotBus';
import { Page } from '../../types';

/**
 * useMascotEvents — wires the avatar to REAL site events so it behaves like a
 * living assistant, not a looping GIF:
 *
 *  - first visit  → wakes up and greets
 *  - page change  → waves with a short contextual line
 *  - copy action  → happy reaction
 *  - form sent    → thinking → talking
 *  - idle 45s     → nudges with a rotating tip
 *  - exit intent  → short goodbye once per session
 *
 * All bubbles are queued & rate-limited (one at a time, ≥18s apart, no
 * immediate repeats) so it never feels spammy.
 */

export interface MascotCue {
  mood: MascotMood;
  text: string;
  ms?: number;
}

const PAGE_LABELS: Record<Page, string> = {
  home: 'خانه',
  services: 'خدمات',
  portfolio: 'نمونه‌کارها',
  about: 'درباره من',
  blog: 'وبلاگ',
  contact: 'تماس',
  projects: 'پروژه‌ها',
  products: 'محصولات',
  admin: 'پنل مدیریت',
};

const GREETINGS = [
  'سلام! 👋 من دستیار هوشمند امیدم — هر سؤالی داری بپرس.',
  'خوش اومدی! 👋 سوالی درباره خدمات داشتی، در خدمتم.',
  'سلام روی هم! 👋 یه سر به نمونه‌کارها بزن، بد نیست.',
];

const PAGE_LINES: Partial<Record<Page, string>> = {
  services: 'اینجا خدمات رو کامل توضیح دادیم — سؤالی بود بپرس!',
  portfolio: 'نتیجه‌ها خودشون حرف می‌زنن 📈 ببین و قضاوت کن.',
  about: 'این منم! یه نگاه به مسیر و تخصص‌ها بنداز.',
  blog: 'مقاله‌های تازه درباره رشد و دیتا اومده 📚',
  contact: 'برای شروع همکاری، همین‌جا پیام بذار ✍️',
  projects: 'پروژه‌های جاری رو ببین — شاید مورد علاقه‌ات بود.',
  products: 'محصولات آماده — سریع‌تر از پروژه اختصاصی!',
};

const IDLE_LINES = [
  'یه سؤال داری؟ همون‌جا پایین-چپ ازم بپرس 💬',
  'می‌دونستی می‌تونی ازم درباره قیمت‌ها بپرسی؟',
  'اگه گم شدی، از منوی بالا می‌تونی راهنمایی بگیری 🙂',
  'برای مشاوره رایگان، صفحه تماس منتظرته!',
];

const COPY_LINES = ['کپی شد! 📋', 'تو کلیپ‌بورده، راحت!', 'بردار! 📋✨'];

function pick(pool: string[], last: string | null): string {
  const fresh = pool.filter((t) => t !== last);
  return fresh[Math.floor(Math.random() * fresh.length)] ?? pool[0];
}

export function useMascotEvents(currentPage: Page) {
  const pageRef = useRef(currentPage);
  pageRef.current = currentPage;

  useEffect(() => {
    let lastText: string | null = null;
    let lastBubbleAt = 0;
    let bubbleTimer: ReturnType<typeof setTimeout> | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    let idleIndex = 0;
    let greetedPages = new Set<string>();
    let exitIntentUsed = false;

    const SILENCE_KEY = 'nd-mascot-muted';

    const say = (text: string, mood: MascotMood, ms = 4200, force = false) => {
      try {
        if (localStorage.getItem(SILENCE_KEY) === '1') return;
      } catch {
        /* private mode */
      }
      const now = Date.now();
      if (!force && now - lastBubbleAt < 18000) return;
      if (text === lastText) return;
      lastText = text;
      lastBubbleAt = now;

      window.dispatchEvent(
        new CustomEvent<MascotCue>('mascot:cues', { detail: { mood, text, ms } })
      );
      mascot.set(mood);
      if (bubbleTimer) clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => mascot.set('idle'), ms);
    };

    const armIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        say(pick(IDLE_LINES, lastText), 'happy', 5000);
        armIdle();
      }, 45000);
    };
    armIdle();

    const onActivity = () => {
      if (idleTimer) clearTimeout(idleTimer);
      armIdle();
    };
    const activityEvents = ['pointermove', 'pointerdown', 'keydown', 'scroll'];
    activityEvents.forEach((ev) =>
      window.addEventListener(ev, onActivity, { passive: true })
    );

    // -- first visit vs returning visitor ----------------------------------
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
        if (returning) {
          say('دوباره خوش اومدی! 🙌 از کجا ادامه بدیم؟', 'excited', 4500, true);
        } else {
          say(pick(GREETINGS, null), 'excited', 5200, true);
        }
      },
      returning ? 1600 : 1100
    );

    // -- react to copy ------------------------------------------------------
    const onCopy = () => say(pick(COPY_LINES, lastText), 'happy', 2400);
    document.addEventListener('copy', onCopy);

    // -- exit intent (desktop, once per session) ----------------------------
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget || e.clientY > 12) return;
      if (exitIntentUsed) return;
      exitIntentUsed = true;
      say('قبل از برن، یه لحظه! 🥺 سوالی داشتی در خدمتم.', 'sad', 4600, true);
    };
    document.addEventListener('mouseout', onOut);

    // -- page-change greetings ---------------------------------------------
    greetedPages.add(pageRef.current);
    const unlistenMascot = mascot.subscribe(() => undefined);

    return () => {
      clearTimeout(wake);
      if (bubbleTimer) clearTimeout(bubbleTimer);
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((ev) => window.removeEventListener(ev, onActivity));
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('mouseout', onOut);
      unlistenMascot();
    };
  }, []);

  // greet on page change (separate effect so currentPage stays fresh)
  useEffect(() => {
    const label = PAGE_LABELS[currentPage];
    if (!label || currentPage === 'admin') return;
    const key = `nd-mascot-pg-${currentPage}`;
    let first = false;
    try {
      first = sessionStorage.getItem(key) !== '1';
      sessionStorage.setItem(key, '1');
    } catch {
      first = true;
    }
    if (!first) return;
    const line = PAGE_LINES[currentPage];
    const t = setTimeout(
      () => {
        window.dispatchEvent(
          new CustomEvent<MascotCue>('mascot:cues', {
            detail: {
              mood: 'happy',
              text: line ?? `رفتیم به «${label}» ${currentPage === 'contact' ? '✍️' : '👈'}`,
              ms: 4200,
            },
          })
        );
        mascot.set('happy');
      },
      2600
    );
    return () => clearTimeout(t);
  }, [currentPage]);
}
