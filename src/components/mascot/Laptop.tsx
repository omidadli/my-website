import React, { useMemo } from 'react';
import type { MascotLaptopState } from './soul';

/**
 * Laptop — the interaction surface. It is a real object in the scene (it
 * occludes the character's lower body, which is what makes him sit *behind* a
 * machine instead of floating in front of one) and its screen reflects actual
 * application state: nothing on it moves unless the app is doing something.
 *
 *   IDLE        → dark, asleep. No fake activity.
 *   PROCESSING  → an AI request is genuinely in flight.
 *   WORKING     → the character is typing into it.
 *   READING     → a response arrived; the screen shows its real shape.
 *   READY       → interaction finished.
 *   ERROR       → request or network failure.
 *
 * The two halves are separate components on purpose: the deck must paint
 * *over* the body while the lid must paint *over* the hands, so the wrists
 * disappear behind the screen exactly like they do in real life.
 */

export interface LaptopProps {
  state: MascotLaptopState;
  /** the real AI text (only used to shape the READING screen) */
  screenText?: string;
}

const KEY_ROWS = [14, 14, 13, 12];
const KEY_TOP = 20;
const KEY_STEP = 19;

/** Perspective key rows: each row is slightly wider than the one behind it. */
function buildRows() {
  // rows widen towards the front edge — that is the perspective cue that makes
  // the deck read as a flat surface instead of a rectangle
  return KEY_ROWS.map((count, i) => {
    const width = 320 + i * 32;
    const x = 320 - width / 2;
    const y = KEY_TOP + i * KEY_STEP;
    const gap = 3.2;
    const kw = (width - gap * (count - 1)) / count;
    return { y, h: i === 3 ? 14 : 12, keys: Array.from({ length: count }, (_, k) => x + k * (kw + gap)), kw };
  });
}

const ROWS = buildRows();

export const LaptopDeck: React.FC<LaptopProps> = ({ state }) => (
  <div className="mws-deck" aria-hidden="true">
    <svg viewBox="0 0 640 136" className="mws-svg" role="presentation" focusable="false">
      <defs>
        <linearGradient id="mws-deck-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c3040" />
          <stop offset="55%" stopColor="#22252f" />
          <stop offset="100%" stopColor="#16181f" />
        </linearGradient>
        <linearGradient id="mws-deck-lip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3f52" />
          <stop offset="100%" stopColor="#1b1d25" />
        </linearGradient>
      </defs>

      {/* cast shadow on the desk */}
      <ellipse cx="320" cy="132" rx="320" ry="10" fill="rgba(0,0,0,0.45)" />

      {/* deck: narrow at the hinge, wide at the front edge (perspective).
          The front edge is deliberately wider than the character's torso so
          the cropped bottom of the sprite is always hidden behind it. */}
      <path
        d="M 30 0 L 610 0 L 740 136 L -100 136 Z"
        fill="url(#mws-deck-face)"
      />
      {/* hinge shadow — grounds the screen into the deck */}
      <path d="M 30 0 L 610 0 L 618 9 L 22 9 Z" fill="rgba(0,0,0,0.5)" />
      {/* front lip */}
      <path d="M -100 122 L 740 122 L 740 136 L -100 136 Z" fill="url(#mws-deck-lip)" />

      {/* keyboard well */}
      <path d="M 120 24 L 520 24 L 552 98 L 88 98 Z" fill="rgba(0,0,0,0.38)" />
      {ROWS.map((row, ri) => (
        <g key={ri}>
          {row.keys.map((kx, ki) => (
            <rect
              key={ki}
              x={kx}
              y={row.y + 8}
              width={row.kw}
              height={row.h}
              rx={2.4}
              fill={ri === 3 && ki >= 4 && ki <= 8 ? '#3b4154' : '#313648'}
            />
          ))}
        </g>
      ))}

      {/* trackpad */}
      <path d="M 262 104 L 378 104 L 386 124 L 254 124 Z" fill="#262a36" />
      <path d="M 262 104 L 378 104 L 379 107 L 261 107 Z" fill="rgba(255,255,255,0.06)" />

      {/* a single status LED, driven by real state */}
      <circle cx="606" cy="128" r="2.4" className={`mws-led mws-led--${state.toLowerCase()}`} />
    </svg>
  </div>
);

export const LaptopLid: React.FC<LaptopProps> = ({ state, screenText = '' }) => {
  const lines = useMemo(() => readingLines(screenText), [screenText]);
  return (
    <div className="mws-lid" aria-hidden="true">
      <svg viewBox="0 0 640 126" className="mws-svg" role="presentation" focusable="false">
        <defs>
          <linearGradient id="mws-lid-shell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a4055" />
            <stop offset="100%" stopColor="#20232d" />
          </linearGradient>
          <linearGradient id="mws-screen-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#171a26" />
            <stop offset="48%" stopColor="#101320" />
            <stop offset="100%" stopColor="#0b0d16" />
          </linearGradient>
          <linearGradient id="mws-glare" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="42%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <clipPath id="mws-screen-clip">
            <rect x="54" y="9" width="532" height="98" rx="5" />
          </clipPath>
        </defs>

        {/* lid shell */}
        <rect x="40" y="0" width="560" height="120" rx="13" fill="url(#mws-lid-shell)" />
        <rect x="40" y="0" width="560" height="120" rx="13" fill="none" stroke="rgba(255,255,255,0.07)" />
        <circle cx="320" cy="5" r="1.8" fill="rgba(255,255,255,0.22)" />

        {/* screen */}
        <rect x="54" y="9" width="532" height="98" rx="5" fill="url(#mws-screen-glass)" />

        <g clipPath="url(#mws-screen-clip)">
          <ScreenContent state={state} lines={lines} />
          <rect x="54" y="9" width="532" height="98" fill="url(#mws-glare)" />
        </g>

        {/* hinge + bottom bezel */}
        <path d="M 40 112 L 600 112 L 600 120 C 600 122 598 124 595 124 L 45 124 C 42 124 40 122 40 120 Z" fill="#1c1f28" />
      </svg>
    </div>
  );
};

const ScreenContent: React.FC<{ state: MascotLaptopState; lines: number[] }> = ({ state, lines }) => {
  switch (state) {
    case 'PROCESSING':
      return (
        <g className="mws-screen mws-screen--processing">
          <rect x="96" y="26" width="200" height="7" rx="3.5" fill="rgba(129,140,248,0.35)" />
          <rect x="96" y="42" width="360" height="7" rx="3.5" fill="rgba(160,170,255,0.18)" />
          <rect x="96" y="58" width="270" height="7" rx="3.5" fill="rgba(160,170,255,0.14)" />
          {/* indeterminate progress — only ever shown while a request is live */}
          <rect x="96" y="80" width="440" height="6" rx="3" fill="rgba(255,255,255,0.08)" />
          <rect x="96" y="80" width="146" height="6" rx="3" className="mws-progress" fill="#818cf8" />
        </g>
      );
    case 'WORKING':
      return (
        <g className="mws-screen mws-screen--working">
          <rect x="96" y="30" width="440" height="6" rx="3" fill="rgba(255,255,255,0.10)" />
          <rect x="96" y="46" width="330" height="6" rx="3" fill="rgba(255,255,255,0.08)" />
          <rect x="96" y="62" width="396" height="6" rx="3" fill="rgba(255,255,255,0.07)" />
          <rect x="96" y="78" width="166" height="6" rx="3" fill="rgba(255,255,255,0.07)" />
          <rect x="288" y="76" width="9" height="10" className="mws-caret" fill="#a5b4fc" />
        </g>
      );
    case 'READING':
      return (
        <g className="mws-screen mws-screen--reading">
          {lines.map((w, i) => (
            <rect key={i} x="96" y={24 + i * 12} width={w} height="6" rx="3" fill="rgba(199,210,254,0.30)" />
          ))}
        </g>
      );
    case 'READY':
      return (
        <g className="mws-screen mws-screen--ready">
          <rect x="96" y="34" width="440" height="6" rx="3" fill="rgba(255,255,255,0.10)" />
          <rect x="96" y="50" width="366" height="6" rx="3" fill="rgba(255,255,255,0.08)" />
          <path d="M 142 78 l 16 16 l 30 -32" fill="none" stroke="rgba(110,231,183,0.85)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case 'ERROR':
      return (
        <g className="mws-screen mws-screen--error">
          <path d="M 320 34 l 34 60 l -68 0 Z" fill="none" stroke="rgba(251,191,36,0.9)" strokeWidth="6" strokeLinejoin="round" />
          <rect x="316" y="52" width="8" height="18" rx="4" fill="rgba(251,191,36,0.95)" />
          <circle cx="320" cy="76" r="4" fill="rgba(251,191,36,0.95)" />
        </g>
      );
    case 'IDLE':
    default:
      return (
        <g className="mws-screen mws-screen--idle">
          {/* asleep: a dim standby bar and nothing else */}
          <rect x="284" y="56" width="76" height="6" rx="3" fill="rgba(255,255,255,0.07)" />
        </g>
      );
  }
};

/**
 * Shape of the real answer: line count from its length, line widths from its
 * words. The screen therefore shows the response that actually arrived.
 */
function readingLines(text: string, max = 6): number[] {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [340, 280, 310];
  const words = clean.split(' ');
  const perLine = Math.max(4, Math.ceil(words.length / Math.min(max, Math.ceil(words.length / 7) || 1)));
  const out: number[] = [];
  for (let i = 0; i < words.length && out.length < max; i += perLine) {
    const chunk = words.slice(i, i + perLine).join(' ');
    out.push(Math.max(74, Math.min(440, chunk.length * 11)));
  }
  return out.length ? out : [340];
}
