import { useEffect, useRef } from 'react';
import { mascot } from './mascotBus';
import { Page } from '../../types';

/**
 * useMascotEvents — the mascot's "small talk" brain.
 *
 * Opening line:
 *   first visit  → greets and ASKS THE VISITOR'S NAME (bubble with input)
 *   named visitor→ «سلام سارا، ظهرت بخیر! حالت چطوره؟ امروز چه کمکی از
 *                   دستم برمیاد؟»  (time-of-day aware)
 *   anonymous    → warm generic welcome-back
 *
 * Ambient chatter: every ~30s (while the tab is visible, no chat open, and
 * he's idle) he drops one natural line — tips, guidance, a nudge toward the
 * chat — so visitors learn he SPEAKS and assists. Capped per session.
 *
 * Journey reactions: page landings, copy, contact-form success, booking
 * success, exit intent — each with the most natural scene.
 */

export interface MascotCue {
  scene: string;
  text: string;
  ms?: number;
  askName?: boolean;
}

const SILENCE_KEY = 'nd-mascot-muted';
const NAME_KEY = 'nd-mascot-name';
const SEEN_KEY = 'nd-mascot-seen';
const SKIP_KEY = 'nd-mascot-skip';

const rate = { lastText: null as string | null, lastAt: 0 };

export function mascotCue(scene: string, text: string, ms = 4200, force = false, askName = false) {
  try {
    if (localStorage.getItem(SILENCE_KEY) === '1') return;
  } catch {
    /* private mode */
  }
  if (document.body.classList.contains('chat-open')) return; // chat owns him then
  const now = Date.now();
  if (!force && now - rate.lastAt < 18000) return;
  if (text === rate.lastText) return;
  rate.lastText = text;
  rate.lastAt = now;
  window.dispatchEvent(new CustomEvent<MascotCue>('mascot:cues', { detail: { scene, text, ms, askName } }));
  mascot.scene(scene, ms);
}

/** Force a scene with no bubble (chat wiring etc.). */
export function mascotAct(sc: string, ms?: number) {
  mascot.scene(sc, ms);
}

function getName(): string {
  try {
    return (localStorage.getItem(NAME_KEY) || '').trim();
  } catch {
    return '';
  }
}

function timeGreet(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'صبحت بخیر';
  if (h >= 11 && h < 15) return 'ظهرت بخیر';
  if (h >= 15 && h < 19) return 'عصرت بخیر';
  return 'شبت بخیر';
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

type Ambient = (name: string) => { scene: string; text: string };
const AMBIENT: Ambient[] = [
  () => ({ scene: 'idle', text: 'هر سوالی از خدمات یا قیمت‌ها داری، همین‌جا ازم بپرس.' }),
  () => ({ scene: 'wave', text: 'برای گفتگوی مستقیم، روی خودم کلیک کن؛ در خدمتم.' }),
  () => ({ scene: 'idle', text: 'صفحه‌ی نمونه‌کارها پر از نتیجه‌های واقعیه؛ یه سر بزن.' }),
  (n) => ({ scene: 'idle', text: n ? `${n}، اگه راهنمایی خواستی، من همین دوره‌تم.` : 'اگه گم شدی، منوی بالا راهنماییت می‌کنه.' }),
  () => ({ scene: 'think', text: 'راستی، بخش وبلاگ مقاله‌های کاربردی درباره رشد داره.' }),
  (n) => ({ scene: 'flex', text: `${n ? n + '، ' : ''}پیشنهاد ویژه‌ی من: صفحه‌ی نمونه‌کارها رو از دست نده.` }),
];

export function useMascotEvents(currentPage: Page) {
  const nameRef = useRef(getName());

  useEffect(() => {
    const onName = (e: Event) => {
      nameRef.current = ((e as CustomEvent<string>).detail || '').trim();
    };
    window.addEventListener('nd:mascot-name', onName);

    // ---- opening line ----------------------------------------------------
    let returning = false;
    let alreadyAsked = false;
    try {
      returning = localStorage.getItem(SEEN_KEY) === '1';
      alreadyAsked = localStorage.getItem(SKIP_KEY) === '1' || !!getName();
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode */
    }

    let openT: ReturnType<typeof setTimeout>;
    if (!returning && !alreadyAsked) {
      // first meeting: greet + ask the visitor's name
      openT = setTimeout(() => {
        mascotCue('greet', 'سلام، خیلی خوش اومدی! اسمت چیه؟', 14000, true, true);
      }, 2200);
    } else {
      const n = nameRef.current;
      openT = setTimeout(
        () => {
          if (n) {
            mascotCue('wave', `سلام ${n}، ${timeGreet()}! حالت چطوره؟ امروز چه کمکی از دستم برمیاد؟`, 6200, true);
          } else {
            mascotCue('greet', 'سلام! دوباره خوش اومدی. چه کاری برات انجام بدم؟', 5200, true);
          }
        },
        returning ? 1600 : 1400
      );
    }

    // ---- ambient chatter (proves he talks) --------------------------------
    let ambT: ReturnType<typeof setTimeout> | null = null;
    let ambStep = 0;
    let ambientCount = 0;
    const armAmbient = () => {
      if (ambT) clearTimeout(ambT);
      ambT = setTimeout(() => {
        const visible = document.visibilityState === 'visible';
        const chatOpen = document.body.classList.contains('chat-open');
        const idleish = mascot.currentScene === 'idle';
        if (visible && !chatOpen && idleish && ambientCount < 6) {
          const line = AMBIENT[ambStep % AMBIENT.length](nameRef.current);
          ambStep += 1;
          ambientCount += 1;
          mascotCue(line.scene, line.text, 4800);
        }
        armAmbient();
      }, 30000);
    };
    armAmbient();

    // ---- journey reactions -------------------------------------------------
    const onCopy = () => mascotCue('celebrate', 'کپی شد؛ بردار!', 2400);
    document.addEventListener('copy', onCopy);

    const onFormOk = () => mascotCue('celebrate', 'پیامت رسید! خیلی زود جواب می‌دم.', 5000, true);
    window.addEventListener('nd:form-success', onFormOk);

    const onBooked = () => mascotCue('celebrate', 'جلسه‌ت رزرو شد! می‌بینمت.', 5000, true);
    window.addEventListener('nd:booking-success', onBooked);

    let exitUsed = false;
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget || e.clientY > 12) return;
      if (exitUsed) return;
      exitUsed = true;
      const n = nameRef.current;
      mascotCue('sad', n ? `${n}، قبل از رفتن یه لحظه... سوالی داشتی در خدمتم.` : 'قبل از رفتن یه لحظه... سوالی داشتی در خدمتم.', 4600, true);
    };
    document.addEventListener('mouseout', onOut);

    return () => {
      clearTimeout(openT);
      if (ambT) clearTimeout(ambT);
      window.removeEventListener('nd:mascot-name', onName);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('mouseout', onOut);
      window.removeEventListener('nd:form-success', onFormOk);
      window.removeEventListener('nd:booking-success', onBooked);
    };
  }, []);

  // ---- page-change cue -----------------------------------------------------
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
