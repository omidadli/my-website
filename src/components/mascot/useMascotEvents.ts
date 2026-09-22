import { useEffect, useRef } from 'react';
import { mascot } from './mascotBus';
import { journeyAct, directorSetContext, directorGetContext } from './director';
import { Page } from '../../types';

/**
 * useMascotEvents — the mascot's social brain. EVERY act has a reason.
 *
 * entry
 *   first v6 visit      → ONE wave + asks the visitor's name (input bubble)
 *   named visitor       → «سلام {name}، {وقت بخیر}! حالت چطوره؟ امروز چه
 *                          کمکی از دستم برمیاد؟»
 *   anonymous return    → warm one-act welcome
 *   returning, no name  → soft name-ask (once per session)
 * journey
 *   first land on page  → one contextual tip for THAT page
 *   copies text         → celebrate (helped you)
 *   contact form ok     → celebrate
 *   booking ok          → celebrate
 *   genuinely leaving   → sad goodbye (dwell ≥30s, cursor really exits the
 *                         top of the window, once per session)
 * ambient (purposeful, ≤4/session)
 *   every 45s, ONLY if the tab is visible, chat closed, he's idle, nothing
 *   is on screen and the user isn't scrolling — and the line is tied to the
 *   page the visitor is actually on.
 */

export interface MascotCue {
  scene: string;
  text: string;
  ms?: number;
  askName?: boolean;
}

const SILENCE_KEY = 'nd-mascot-muted';
const NAME_KEY = 'nd-mascot-name';
const SKIP_KEY = 'nd-mascot-skip';
// fresh scheme key → everyone (incl. previous visitors) gets asked once
const SCHEME_KEY = 'nd-mascot-v6';
const SESSION_ASKED = 'nd-mascot-v6-asked';
const SESSION_EXIT = 'nd-mascot-v6-exit';

const rate = { lastText: null as string | null, lastAt: 0 };

export function mascotCue(scene: string, text: string, ms = 4200, force = false, askName = false) {
  try {
    if (localStorage.getItem(SILENCE_KEY) === '1') return;
  } catch {
    /* private mode */
  }
  if (document.body.classList.contains('chat-open')) return; // chat owns him
  const now = Date.now();
  if (!force && now - rate.lastAt < 18000) return;
  if (text === rate.lastText) return;
  rate.lastText = text;
  rate.lastAt = now;
  window.dispatchEvent(new CustomEvent<MascotCue>('mascot:cues', { detail: { scene, text, ms, askName } }));
  journeyAct({ pose: scene as never, hold: ms / 1000 });
}

/** Force a scene, no bubble (chat wiring). */
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

// ambient lines keyed by context (page-aware, purposeful)
function ambientLine(page: Page, name: string): { scene: string; text: string } | null {
  const n = name ? `${name}، ` : '';
  const onPage: Partial<Record<Page, string>> = {
    home: 'اگه دنبال رشد فروشی، بخش خدمات رو یه ببین؛ از اون‌جا همه‌چیز شروع می‌شه.',
    services: 'سوالی درباره‌ی هر کدوم از خدمات داری، همون‌جا ازم بپرس.',
    portfolio: 'دوست داری یه نمونه‌کار مشابه کسب‌وکار خودت رو بهت معرفی کنم؟ از چت بپرس.',
    blog: 'مقاله‌ی خاصی مدنظرته؟ بگو موضوعش رو پیدا کنم.',
    contact: 'نیم‌ساعت مشاوره‌ی اول رایگانه؛ تقویم همین پایینه.',
  };
  if (onPage[page]) return { scene: 'idle', text: n + onPage[page]! };
  return { scene: 'idle', text: `${n}هر جا گم شدی، من همین‌جام؛ بپرس تا راهنماییت کنم.` };
}

export function useMascotEvents(currentPage: Page) {
  const nameRef = useRef(getName());
  const pageRef = useRef(currentPage);
  pageRef.current = currentPage;
  directorSetContext({ name: nameRef.current, page: currentPage });
  useEffect(() => {
    directorSetContext({ page: currentPage });
  }, [currentPage]);
  useEffect(() => {
    const onName = () => directorSetContext({ name: getName() });
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
      // first meeting: greet once, then ask the name
      openT = setTimeout(() => {
        mascotCue('wave', 'سلام، خیلی خوش اومدی! اسمت چیه؟ دوست دارم درست صدامت کنم.', 24000, true, true);
      }, 2400);
    } else {
      const n = nameRef.current;
      openT = setTimeout(
        () => {
          if (n) {
            mascotCue('wave', `سلام ${n}، ${timeGreet()}! حالت چطوره؟ امروز چه کمکی از دستم برمیاد؟`, 6400, true);
          } else {
            mascotCue('wave', 'سلام! خوش برگشتی. چه کاری برات انجام بدم؟', 5200, true);
          }
        },
        1600
      );
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
          mascot.currentScene === 'idle' &&
          Date.now() - rate.lastAt > 40000 && // nothing on screen lately
          Date.now() - lastScroll > 8000 && // not mid-reading/scrolling
          ambCount < 4;
        if (conditions) {
          // soft name-ask has priority exactly once per session
          if (!nameRef.current && !skipped && !sessionAsked) {
            mascotCue('wave', 'راستی، اسمت چیه؟ دوست دارم درست صدامت کنم.', 20000, true, true);
          } else {
            const line = ambientLine(pageRef.current, nameRef.current);
            if (line) mascotCue(line.scene, line.text, 5200);
          }
          ambCount += 1;
        }
        armAmbient();
      }, 45000);
    };
    armAmbient();

    // ---------- journey reactions ----------
    const onCopy = () => mascotCue('celebrate', 'کپی شد؛ بردار!', 2400);
    document.addEventListener('copy', onCopy);

    const onFormOk = () => mascotCue('celebrate', 'پیامت رسید! خیلی زود جواب می‌دم.', 5000, true);
    window.addEventListener('nd:form-success', onFormOk);

    const onBooked = () => mascotCue('celebrate', 'جلسه‌ت رزرو شد! می‌بینمت.', 5000, true);
    window.addEventListener('nd:booking-success', onBooked);

    // exit intent — ONLY a real exit: cursor leaves through the top after a
    // real visit (≥30s dwell), once per session
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
      mascotCue(
        'sad',
        n ? `${n}، قبل از رفتن یه سوال داشتی، همون رو ازم بپرس.` : 'قبل از رفتن، اگه سوالی بود من همین‌جام.',
        4600,
        true
      );
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

  // ---------- first landing on a page: one contextual tip ----------
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
    const line = PAGE_CUES[currentPage];
    if (!line) return;
    const t = setTimeout(() => mascotCue('idle', line, 5000), 2800);
    return () => clearTimeout(t);
  }, [currentPage]);
}
