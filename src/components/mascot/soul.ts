/**
 * soul.ts — THE behavior management system. One soul, one body.
 *
 * Everything that moves the mascot goes through here — the AI (chat), the
 * journey reflexes (copy / form / booking / exit), the ambient chatter and
 * the producer (typing / listen while the answer streams). No other module
 * may drive `mascotBus` directly.
 *
 * What the soul owns:
 *   1. THE VOCABULARY — the complete body language catalog (BODY), also
 *      quoted verbatim by the AI system prompt and the AI Studio doc.
 *   2. THE STATE — who we talk to, where they are, what the body is doing,
 *      what it did recently (so the AI never restarts from zero).
 *   3. THE RULES — priorities (AI > journey > ambient), per-pose cooldowns
 *      (no repetitive twitching), system-reserved poses, mood-aware guards.
 *   4. THE PROTOCOL — `[[act:{…}]]` extraction from model answers.
 *
 *   AI (soul)  ──directives──▶  ┌─────────┐
 *   journey    ──reflexes────▶  │  soul   │──validated──▶ mascotBus (body)
 *   ambient    ──chatter─────▶  └─────────┘
 *   producer   ──typing/listen─▶     ▲
 *                                    └── nothing bypasses
 */

import { mascot } from './mascotBus';

// ---------------------------------------------------------------------------
// 1. VOCABULARY — the complete body language
// ---------------------------------------------------------------------------

export const SOUL_POSES = [
  'idle', 'wave', 'happy', 'excited', 'thinking', 'talking',
  'sad', 'surprised', 'confused', 'confident', 'sleepy',
  'typing', 'listen',
] as const;
export type SoulPose = (typeof SOUL_POSES)[number];

export interface BodyPart {
  /** what the body does (fa) */
  body: string;
  /** when the soul should pick it (fa) */
  when: string;
  /** default hold, seconds */
  hold: number;
  /** loops until replaced */
  loop?: boolean;
  /** min ms before this pose may fire again (anti-twitch) */
  cooldown: number;
  /** arousal 1..3 — expressive poses need a reason */
  energy: 1 | 2 | 3;
  /** reserved for the producer — the model may never pick these */
  system?: boolean;
}

export const BODY: Record<SoulPose, BodyPart> = {
  idle:      { body: 'دست‌به‌سینه با لبخند آرام می‌ایستد', when: 'پاسخ‌های خنثی و اطلاعاتی؛ بیشتر وقت‌ها انتخاب درست همین است', hold: 6, cooldown: 0, energy: 1 },
  wave:      { body: 'دستش را بالا می‌برد و سلام می‌کند', when: 'خوش‌آمد، خداحافظی، جواب سلام، شروع تعامل', hold: 2.6, cooldown: 8000, energy: 2 },
  happy:     { body: 'با چشمان بسته از ته دل می‌خندد', when: 'جواب شوخ کاربر، تشکر گرم؛ کم و به‌جا', hold: 2.6, cooldown: 12000, energy: 2 },
  excited:   { body: 'مشتش را بالا می‌برد و جشن می‌گیرد', when: 'خبر خوب کاربر، موفقیت (ارسال فرم، رزرو)، پاسخ داغ', hold: 3.2, cooldown: 15000, energy: 3 },
  thinking:  { body: 'دست زیر چانه، نگاه به بالا', when: 'سوال تحلیلی/محاسباتی؛ لحظه‌ای مکث قبل از جواب قطعی', hold: 5, loop: true, cooldown: 6000, energy: 1 },
  talking:   { body: 'با ژست دست توضیح می‌دهد و دهانش حرکت می‌کند', when: 'پاسخ محتوایی — پیش‌فرض اکثر جواب‌ها', hold: 7, loop: true, cooldown: 0, energy: 1 },
  sad:       { body: 'شانه‌هایش افتاده و متأسف نگاه می‌کند', when: 'خبر بد، ندانستن، عذرخواهی، محدودیت واقعی', hold: 4, cooldown: 10000, energy: 2 },
  surprised: { body: 'چشمان گرد و دهان باز، دست‌ها بالا', when: 'آمار/نتیجه‌ی چشمگیر، خبر غافلگیرکننده از کاربر', hold: 2.2, cooldown: 12000, energy: 3 },
  confused:  { body: 'دست به سرش می‌کشد، اخم دو رو', when: 'سوال مبهم — همراه با سوال شفاف‌سازی، هرگز تنها', hold: 2.6, cooldown: 9000, energy: 2 },
  confident: { body: 'عینک آفتابی می‌زند و مطمئن دست‌به‌سینه می‌ایستد', when: 'با داده و نمونه‌کار مطمئن حرف می‌زند (اعتمادسازی)', hold: 3, cooldown: 20000, energy: 2 },
  sleepy:    { body: 'خمیازه می‌کشد', when: 'فقط شوخی سبک درباره‌ی انتظار یا شب‌بیداری کاربر؛ هرگز جواب جدی', hold: 3.8, cooldown: 30000, energy: 2 },
  typing:    { body: 'پشت لپ‌تاپ تایپ می‌کند', when: 'رزرو شده — سیستم هنگام تولید پاسخ اجرا می‌کند', hold: 20, loop: true, cooldown: 0, energy: 1, system: true },
  listen:    { body: 'سر تکان می‌دهد و با دقت گوش می‌دهد', when: 'رزرو شده — سیستم وقتی کاربر در حال نوشتن است اجرا می‌کند', hold: 5, loop: true, cooldown: 0, energy: 1, system: true },
};

const isPose = (p: unknown): p is SoulPose => SOUL_POSES.includes(p as SoulPose);

// pose → bus scene name
const SCENE_OF: Record<SoulPose, string> = {
  idle: 'idle', wave: 'wave', happy: 'laugh', excited: 'celebrate',
  thinking: 'think', talking: 'talk', sad: 'sad', surprised: 'surprised',
  confused: 'puzzled', confident: 'flex', sleepy: 'sleepy',
  typing: 'typing', listen: 'listen',
};

// ---------------------------------------------------------------------------
// 2. STATE — what the soul knows right now
// ---------------------------------------------------------------------------

export interface SoulContext {
  name: string;
  page: string;
  daypart: string;
  timeGreet: string;
}

const state = {
  visitor: { name: '', page: 'home' },
  chatOpen: false,
  pose: 'idle' as SoulPose,
  poseUntil: 0,
  lastByPose: {} as Partial<Record<SoulPose, number>>,
  lastSource: 'system' as 'ai' | 'journey' | 'ambient' | 'system' | 'none',
  lastAt: 0,
  history: [] as Array<{ pose: SoulPose; at: number; source: string }>,
};

const daypartFa = () => {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? 'صبح' : h >= 12 && h < 15 ? 'ظهر' : h >= 15 && h < 19 ? 'عصر' : 'شب';
};

export function soulSetVisitor(v: { name?: string; page?: string }) {
  if (v.name !== undefined) state.visitor.name = v.name;
  if (v.page !== undefined) state.visitor.page = v.page;
}

export function soulSetChatOpen(open: boolean) {
  state.chatOpen = open;
}

export function soulGetContext(): SoulContext {
  const dp = daypartFa();
  return { name: state.visitor.name, page: state.visitor.page, daypart: dp, timeGreet: `${dp}ت بخیر` };
}

/** Rich one-line state for the AI prompt — behavioral continuity. */
export function soulSnapshotLine(): string {
  const c = soulGetContext();
  const poseMeta = BODY[state.pose];
  const recent = state.history
    .slice(-3)
    .map((h) => h.pose)
    .join('، ');
  return [
    c.name ? `نام مخاطب: «${c.name}» — طبیعی و گاهی صدا‌ش کن` : 'نام مخاطب را نمی‌دانی',
    `صفحه‌ی فعلی: «${c.page}»`,
    `زمان: ${c.daypart}`,
    `بدن الان: ${state.pose} (${poseMeta?.body ?? ''})`,
    recent ? `اکت‌های اخیر: ${recent} — همین‌ها را تکرار نکن` : '',
  ]
    .filter(Boolean)
    .join(' | ');
}

// ---------------------------------------------------------------------------
// 3. RULES — priorities, guards, cooldowns
// ---------------------------------------------------------------------------

export type SoulSource = 'ai' | 'journey' | 'ambient' | 'system';
const PRIORITY: Record<SoulSource, number> = { ai: 3, system: 3, journey: 2, ambient: 1 };
const INTERRUPT_WINDOW = 4000;

export interface SoulActSpec {
  pose: SoulPose;
  /** seconds to hold before returning to idle (clamped 1.5–20) */
  hold?: number;
  /** short spoken aside shown near the avatar */
  bubble?: string;
  /** follow-up pose after hold (choreography) */
  then?: SoulPose;
}

const clampHold = (p: SoulPose, s?: number): number => {
  const v = typeof s === 'number' && isFinite(s) ? s : BODY[p].hold;
  return Math.min(20, Math.max(1.5, v));
};

export interface SoulActResult {
  ok: boolean;
  reason?: string;
}

/** Perform a validated act. Returns {ok:false, reason} when rejected. */
export function soulAct(spec: SoulActSpec, source: SoulSource): SoulActResult {
  if (!spec || !isPose(spec.pose)) return { ok: false, reason: 'unknown pose' };
  const meta = BODY[spec.pose];

  // system-reserved poses
  if (meta.system && source !== 'system') return { ok: false, reason: 'system-reserved' };
  if (!meta.system && source === 'system' && spec.pose !== 'talking' && spec.pose !== 'surprised' && spec.pose !== 'sad' && spec.pose !== 'wave') {
    // producer may only stage talk/surprised/sad/wave fallbacks + reserved ones
    return { ok: false, reason: 'producer scope' };
  }

  const now = Date.now();

  // no priority downgrade within the interrupt window
  const lastPrio = PRIORITY[state.lastSource as SoulSource] ?? 9;
  if (now - state.lastAt < INTERRUPT_WINDOW && PRIORITY[source] < lastPrio) {
    return { ok: false, reason: 'priority guard' };
  }

  // ambient may only speak while the body rests
  if (source === 'ambient' && state.pose !== 'idle') {
    return { ok: false, reason: 'ambient needs rest' };
  }

  // anti-twitch: expressive poses have a cooldown (ai bypasses only for happy/excited? no — same rule; the AI holds are long anyway)
  const last = state.lastByPose[spec.pose] ?? 0;
  if (now - last < meta.cooldown) {
    return { ok: false, reason: `cooldown ${spec.pose}` };
  }

  const hold = clampHold(spec.pose, spec.hold);
  state.lastByPose[spec.pose] = now;
  state.lastSource = source;
  state.lastAt = now;
  state.pose = spec.pose;
  state.poseUntil = now + hold * 1000;
  state.history.push({ pose: spec.pose, at: now, source });
  if (state.history.length > 8) state.history.shift();

  mascot.scene(SCENE_OF[spec.pose], hold * 1000);

  // spoken aside (corner bubble — only meaningful when the chat is closed)
  if (spec.bubble && typeof document !== 'undefined' && !document.body.classList.contains('chat-open')) {
    const text = String(spec.bubble).slice(0, 180);
    window.dispatchEvent(
      new CustomEvent('mascot:cues', { detail: { scene: spec.pose, text, ms: hold * 1000, ai: source === 'ai' } })
    );
  }

  // choreography: follow-up pose
  if (spec.then && isPose(spec.then) && spec.then !== 'idle' && spec.then !== spec.pose) {
    window.setTimeout(() => {
      if (state.lastSource === source && Date.now() >= state.poseUntil - 50) {
        soulAct({ pose: spec.then as SoulPose, hold: 3 }, source);
      }
    }, hold * 1000);
  }

  // auto-settle bookkeeping: when the act ends the bus returns to idle
  window.setTimeout(() => {
    if (state.pose === spec.pose && Date.now() >= state.poseUntil - 50) state.pose = 'idle';
  }, hold * 1000 + 60);

  return { ok: true };
}

// ---------------------------------------------------------------------------
// 4. PROTOCOL — the AI's entry point
// ---------------------------------------------------------------------------

/** rough speech-duration: ~14 chars/second spoken Persian */
export function guessHold(text: string): number {
  return Math.min(12, Math.max(3.5, (String(text || '').length / 14) * 1.15));
}

/**
 * Parse `[[act:{…}]]` out of a raw model answer, perform the acting and
 * return the clean display text. Malformed directives are ignored safely.
 */
export function applyAIRawAnswer(raw: string): { text: string; applied: boolean; spec: SoulActSpec | null } {
  const rawText = String(raw || '');
  const m = rawText.match(/\[\[act:\s*(\{[\s\S]*?\})\s*\]\]/i);
  let text = rawText;
  let applied = false;
  let spec: SoulActSpec | null = null;

  if (m) {
    text = (rawText.slice(0, m.index) + ' ' + rawText.slice(m.index + m[0].length)).replace(/\s{2,}/g, ' ').trim();
    try {
      const parsed = JSON.parse(m[1]) as SoulActSpec;
      spec = parsed;
      applied = soulAct({ pose: parsed.pose, hold: parsed.hold, bubble: parsed.bubble, then: parsed.then }, 'ai').ok;
    } catch {
      applied = false; // malformed JSON → body stays calm
    }
  }

  // the body always matches the conversation — graceful fallback
  if (!applied) {
    soulAct({ pose: 'talking', hold: guessHold(text) }, 'ai');
  }
  return { text, applied, spec };
}

// convenience wrappers -------------------------------------------------------

export const soulAI = (spec: SoulActSpec) => soulAct(spec, 'ai');
export const soulJourney = (spec: SoulActSpec) => soulAct(spec, 'journey');
export const soulAmbient = (spec: SoulActSpec) => soulAct(spec, 'ambient');
export const soulSystem = (spec: SoulActSpec) => soulAct(spec, 'system');

/** Debug/console access: window.__soul.act({pose:'excited'}, 'ai') */
if (typeof window !== 'undefined') {
  (window as unknown as { __soul: unknown }).__soul = {
    act: soulAct,
    ai: soulAI,
    journey: soulJourney,
    ambient: soulAmbient,
    system: soulSystem,
    applyAIRawAnswer,
    BODY,
    SOUL_POSES,
    snapshot: soulSnapshotLine,
    context: soulGetContext,
    setVisitor: soulSetVisitor,
  };
}
