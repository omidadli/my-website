import { useEffect, useRef } from 'react';
import { mascotController, type MascotEventType } from './soul';
import { Page } from '../../types';

/**
 * useMascotEvents — the character's social life. EVERY act has a reason.
 *
 * This module produces *events*, never animations. Each social reflex is
 * dispatched to the single controller with the priority it deserves, so an
 * ambient remark can never interrupt an AI interaction:
 *
 *   entry greeting  → USER_RETURNED   (NORMAL)
 *   page tip        → PAGE_CHANGED    (NORMAL)
 *   copies text     → COPY            (NORMAL)  — you helped them
 *   contact form ok → FORM_SUCCESS    (NORMAL)
 *   booking ok      → BOOKING_SUCCESS (NORMAL)
 *   genuinely leaving → EXIT_INTENT   (NORMAL)
 *   ambient remark  → USER_RETURNED   (NORMAL, ≤4/session)
 *
 * The corner speech bubble is rendered by <MascotAvatar/>; this file only
 * decides *whether* a line is worth saying.
 */

export interface MascotCue {
  text: string;
  ms?: number;
  askName?: boolean;
}

const SILENCE_KEY = 'nd-mascot-muted';
const NAME_KEY = 'nd-mascot-name';
const SKIP_KEY = 'nd-mascot-skip';
const SCHEME_KEY = 'nd-mascot-v7';
const SESSION_ASKED = 'nd-mascot-v7-asked';
const SESSION_EXIT = 'nd-mascot-v7-exit';

const rate = { lastText: null as string | null, lastAt: 0 };

/**
 * Say a line (corner bubble) and let the body react through the controller.
 * `event` is the reason the line exists; `ms` only sizes the bubble.
 */
export function mascotCue(text: string, ms = 4200, askName = false, event: MascotEventType = 'USER_RETURNED', force = false) {
  if (typeof document !== 'undefined' && document.body.classList.contains('chat-open')) return; // chat owns him
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
  window.dispatchEvent(new CustomEvent<MascotCue>('mascot:cues', { detail: { text, ms, askName } }));
  mascotController.dispatch({ type: event, label: 'mascot-cue' });
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
  if (h >= 5 && h < 12) return 'صبحت بخیر';
  if (h >= 12 && h < 15) return 'ظهرت بخیر';
  if (h >= 15 && h < 19) return 'عصرت بخیر';
  return 'شبت بخیر';
}

const PAGE_CUES: Partial<Record<Page, string>> = {
  services: 'هر خدمتی که اینجا می‌بینی، با یه جلسه‌ی رایگان شروع می‌شه؛ سوالی بود بپرس.',
  portfolio: 'این‌جا نتیجه‌های واقعی پروژه‌هاست؛ عدد‌ها خودشون حرف می‌زنن.',
  about: 'این منم! مسیر و تخصص‌هام رو این‌جا نوشتم.',
  blog: 'مقاله‌های تازه درباره رشد و دیتا این‌جاست؛ هر کدوم خواستی بگو خلاصه‌ش بگم.',
  contact: 'فرم همین صفحه رو پر کن؛ خیلی زود جواب می‌گیری.',
  projects: 'پروژه‌های در جریان رو این‌جا می‌بینی؛ شاید یکی‌ش به کارت اومد.',
  products: 'محصولات آماده‌ان؛ سریع‌تر از پروژه‌ی اختصاصی راه می‌افتن.',
};

function ambientLine(page: Page, name: string): string {
  const n = name ? `${name}، ` : '';
  const onPage: Partial<Record<Page, string>> = {
    home: 'اگه دنبال رشد فروشی، بخش خدمات رو یه ببین؛ از اون‌جا همه‌چیز شروع می‌شه.',
    services: 'سوالی درباره‌ی هر کدوم از خدمات داری، همون‌جا ازم بپرس.',
    portfolio: 'دوست داری یه نمونه‌کار مشابه کسب‌وکار خودت رو بهت معرفی کنم؟ از چت بپرس.',
    blog: 'مقاله‌ی خاصی مدنظرته؟ بگو موضوعش رو پیدا کنم.',
    contact: 'نیم‌ساعت مشاوره‌ی اول رایگانه؛ تقویم همین پایینه.',
  };
  return n + (onPage[page] || 'هر جا گم شدی، من همین‌جام؛ بپرس تا راهنماییت کنم.');
}

export function useMascotEvents(currentPage: Page) {
  const nameRef = useRef(getName());
  const pageRef = useRef(currentPage);
  pageRef.current = currentPage;

  useEffect(() => {
    mascotController.setVisitor({ name: nameRef.current, page: currentPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mascotController.setVisitor({ page: currentPage });
  }, [currentPage]);

  useEffect(() => {
    const onName = () => mascotController.setVisitor({ name: getName() });
    window.addEventListener('nd:mascot-name', onName);
    return () => window.removeEventListener('nd:mascot-name', onName);
  }, []);

  useEffect(() => {
    const onName = (e: Event) => {
      nameRef.current = ((e as CustomEvent<string>).detail || '').trim();
    };
    window.addEventListener('nd:mascot-name', onName);

    // ---------- storage state ----------
    let schemeSeen = false;
    let skipped = false;
    try {
      schemeSeen = localStorage.getItem(SCHEME_KEY) === '1';
      skipped = localStorage.getItem(SKIP_KEY) === '1';
      localStorage.setItem(SCHEME_KEY, '1');
    } catch {
      /* private mode */
    }

    const sessionAsked = (() => {
      try {
        if (sessionStorage.getItem(SESSION_ASKED) === '1') return true;
        sessionStorage.setItem(SESSION_ASKED, '1');
      } catch {
        /* private mode */
      }
      return false;
    })();

    // ---------- entry: exactly ONE purposeful act ----------
    let openT: ReturnType<typeof setTimeout>;
    if (!schemeSeen && !skipped) {
      openT = setTimeout(() => {
        mascotCue('سلام، خیلی خوش اومدی! اسمت چیه؟ دوست دارم درست صدامت کنم.', 24000, true, 'USER_RETURNED', true);
      }, 2400);
    } else {
      const n = nameRef.current;
      openT = setTimeout(() => {
        if (n) mascotCue(`سلام ${n}، ${timeGreet()}! حالت چطوره؟ امروز چه کمکی از دستم برمیاد؟`, 6400, false, 'USER_RETURNED', true);
        else mascotCue('سلام! خوش برگشتی. چه کاری برات انجام بدم؟', 5200, false, 'USER_RETURNED', true);
      }, 1600);
    }

    // ---------- ambient: purposeful, page-aware, capped ----------
    let ambT: ReturnType<typeof setTimeout> | null = null;
    let ambCount = 0;
    let lastScroll = 0;
    const onScrollMark = () => {
      lastScroll = Date.now();
    };
    window.addEventListener('scroll', onScrollMark, { passive: true });

    const armAmbient = () => {
      if (ambT) clearTimeout(ambT);
      ambT = setTimeout(() => {
        const conditions =
          document.visibilityState === 'visible' &&
          !document.body.classList.contains('chat-open') &&
          Date.now() - rate.lastAt > 40000 && // nothing on screen lately
          Date.now() - lastScroll > 8000 && // not mid-reading/scrolling
          ambCount < 4;
        if (conditions) {
          if (!nameRef.current && !skipped && !sessionAsked) {
            mascotCue('راستی، اسمت چیه؟ دوست دارم درست صدامت کنم.', 20000, true, 'USER_RETURNED', true);
          } else {
            mascotCue(ambientLine(pageRef.current, nameRef.current), 5200);
          }
          ambCount += 1;
        }
        armAmbient();
      }, 45000);
    };
    armAmbient();

    // ---------- journey reactions ----------
    const onCopy = () => mascotCue('کپی شد؛ بردار!', 2400, false, 'COPY', true);
    document.addEventListener('copy', onCopy);

    const onFormOk = () => mascotCue('پیامت رسید! خیلی زود جواب می‌دم.', 5000, false, 'FORM_SUCCESS', true);
    window.addEventListener('nd:form-success', onFormOk);

    const onBooked = () => mascotCue('جلسه‌ت رزرو شد! می‌بینمت.', 5000, false, 'BOOKING_SUCCESS', true);
    window.addEventListener('nd:booking-success', onBooked);

    // exit intent — ONLY a real exit: the cursor leaves through the top after a
    // real visit (≥30 s dwell), once per session
    let exitUsed = (() => {
      try {
        return sessionStorage.getItem(SESSION_EXIT) === '1';
      } catch {
        return false;
      }
    })();
    const bornAt = Date.now();
    const onDocLeave = (e: MouseEvent) => {
      if (e.clientY > 0 || e.relatedTarget) return; // not leaving upward
      if (exitUsed || Date.now() - bornAt < 30000) return;
      exitUsed = true;
      try {
        sessionStorage.setItem(SESSION_EXIT, '1');
      } catch {
        /* private mode */
      }
      const n = nameRef.current;
      mascotCue(n ? `${n}، قبل از رفتن یه سوال داشتی، همون رو ازم بپرس.` : 'قبل از رفتن، اگه سوالی بود من همین‌جام.', 4600, false, 'EXIT_INTENT', true);
    };
    document.documentElement.addEventListener('mouseleave', onDocLeave);

    return () => {
      clearTimeout(openT);
      if (ambT) clearTimeout(ambT);
      window.removeEventListener('nd:mascot-name', onName);
      window.removeEventListener('scroll', onScrollMark);
      document.removeEventListener('copy', onCopy);
      document.documentElement.removeEventListener('mouseleave', onDocLeave);
      window.removeEventListener('nd:form-success', onFormOk);
      window.removeEventListener('nd:booking-success', onBooked);
    };
  }, []);

  // ---------- navigation: he notices where you went ----------
  useEffect(() => {
    if (currentPage === 'admin') return;
    mascotController.dispatch({ type: 'PAGE_CHANGED', label: currentPage });
  }, [currentPage]);

  // ---------- first landing on a page: one contextual tip ----------
  useEffect(() => {
    if (currentPage === 'admin') return undefined;
    const key = `nd-mascot-pg-${currentPage}`;
    let first = false;
    try {
      first = sessionStorage.getItem(key) !== '1';
      sessionStorage.setItem(key, '1');
    } catch {
      first = true;
    }
    if (!first) return undefined;
    const line = PAGE_CUES[currentPage];
    if (!line) return undefined;
    const t = setTimeout(() => mascotCue(line, 5000, false, 'PAGE_CHANGED'), 2800);
    return () => clearTimeout(t);
  }, [currentPage]);
}
