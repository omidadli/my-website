/**
 * soul.ts — the ONE mascot controller.
 *
 *   USER / UI / AI EVENTS
 *        ↓
 *   mascot.dispatch()          ← the only door in
 *        ↓
 *   priority gate  →  state machine  →  plan queue  →  single scheduler
 *        ↓
 *   { state, gaze, expression, laptop, scene } → mascotBus (the body)
 *
 * Nothing else may drive the body. The chat, the journey reflexes, the page
 * router, the buttons and the AI all call `mascot.dispatch(...)`; this module
 * decides what the character does about it.
 *
 * Design rules enforced here:
 *  · ONE scheduler. A single timer + a generation token: any callback that
 *    belongs to a superseded beat is dropped, so two timers can never fight
 *    over the same body.
 *  · REAL lifecycle only. WORKING is entered when the AI request starts and
 *    left when it completes or fails. There is no fixed "pretend to think for
 *    3s" timeline anywhere.
 *  · Streaming is throttled and changes no state — it only refreshes the
 *    laptop's activity, so a token storm cannot thrash the animation.
 *  · The AI may only pick from a closed vocabulary. Anything else falls back.
 *  · A watchdog returns the character to IDLE if an event stream ever dies
 *    mid-flight, so he can never get stuck.
 */

import { mascot, SCENES } from './mascotBus';

// ---------------------------------------------------------------------------
// 1. VOCABULARY — closed sets, everything else is rejected
// ---------------------------------------------------------------------------

export const MASCOT_STATES = [
  'IDLE',
  'NOTICE_USER',
  'LOOK_AT_USER',
  'LOOK_AT_LAPTOP',
  'WORKING',
  'TYPING',
  'THINKING',
  'READING',
  'REACTING',
  'WAITING',
  'ERROR',
  'RETURN_TO_IDLE',
] as const;
export type MascotState = (typeof MASCOT_STATES)[number];

export const MASCOT_GAZES = ['USER', 'LAPTOP_SCREEN', 'KEYBOARD', 'CHAT', 'ENVIRONMENT'] as const;
export type MascotGaze = (typeof MASCOT_GAZES)[number];

export const MASCOT_EXPRESSIONS = ['NEUTRAL', 'FOCUSED', 'PLEASED', 'CONCERNED', 'CURIOUS', 'PROUD', 'TIRED'] as const;
export type MascotExpression = (typeof MASCOT_EXPRESSIONS)[number];

export const MASCOT_LAPTOP_STATES = ['IDLE', 'PROCESSING', 'WORKING', 'READING', 'READY', 'ERROR'] as const;
export type MascotLaptopState = (typeof MASCOT_LAPTOP_STATES)[number];

export const MASCOT_PRIORITIES = ['IDLE', 'LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as const;
export type MascotPriority = (typeof MASCOT_PRIORITIES)[number];

const PRIO_RANK: Record<MascotPriority, number> = { IDLE: 0, LOW: 1, NORMAL: 2, HIGH: 3, CRITICAL: 4 };

/** The ONLY actions the AI is allowed to request. */
export const MASCOT_ACTIONS = [
  'IDLE',
  'LOOK_AT_USER',
  'LOOK_AT_LAPTOP',
  'WORKING',
  'TYPING',
  'THINKING',
  'READING',
  'REACTING',
  'WAITING',
  'RETURN_TO_IDLE',
] as const;
export type MascotAction = (typeof MASCOT_ACTIONS)[number];

export type MascotEventType =
  | 'CHAT_OPENED'
  | 'CHAT_CLOSED'
  | 'CHAT_MESSAGE_SENT'
  | 'USER_TYPING'
  | 'AI_REQUEST_STARTED'
  | 'AI_REQUEST_STREAMING'
  | 'AI_REQUEST_COMPLETED'
  | 'AI_REQUEST_FAILED'
  | 'AI_REQUEST_CANCELLED'
  | 'PAGE_CHANGED'
  | 'USER_IDLE'
  | 'USER_RETURNED'
  | 'BUTTON_CLICKED'
  | 'FORM_SUCCESS'
  | 'BOOKING_SUCCESS'
  | 'COPY'
  | 'EXIT_INTENT';

export interface MascotEvent {
  type: MascotEventType;
  priority?: MascotPriority;
  /** latest AI text (streamed or final) — only used by the laptop screen */
  text?: string;
  /** free-form label, useful for the admin behaviour log */
  label?: string;
}

const EVENT_PRIORITY: Record<MascotEventType, MascotPriority> = {
  AI_REQUEST_FAILED: 'CRITICAL',
  AI_REQUEST_COMPLETED: 'HIGH',
  AI_REQUEST_STARTED: 'HIGH',
  AI_REQUEST_STREAMING: 'HIGH',
  AI_REQUEST_CANCELLED: 'HIGH',
  CHAT_MESSAGE_SENT: 'HIGH',
  CHAT_OPENED: 'NORMAL',
  CHAT_CLOSED: 'NORMAL',
  PAGE_CHANGED: 'NORMAL',
  USER_RETURNED: 'NORMAL',
  FORM_SUCCESS: 'NORMAL',
  BOOKING_SUCCESS: 'NORMAL',
  COPY: 'NORMAL',
  EXIT_INTENT: 'NORMAL',
  BUTTON_CLICKED: 'LOW',
  USER_TYPING: 'LOW',
  USER_IDLE: 'IDLE',
};

/** Priority a live state defends itself with. */
const STATE_PRIORITY: Record<MascotState, MascotPriority> = {
  IDLE: 'IDLE',
  RETURN_TO_IDLE: 'IDLE',
  NOTICE_USER: 'NORMAL',
  LOOK_AT_USER: 'NORMAL',
  LOOK_AT_LAPTOP: 'NORMAL',
  WAITING: 'NORMAL',
  WORKING: 'HIGH',
  TYPING: 'HIGH',
  THINKING: 'HIGH',
  READING: 'HIGH',
  REACTING: 'HIGH',
  ERROR: 'CRITICAL',
};

/** A state never gets replaced before this — kills animation thrash without
 *  forcing the character to hold a pose the application has already left. */
const MIN_STATE_HOLD = 150;
/** Fastest the machine can complete its reaction to a finished request. */
const MIN_WORKING_HOLD = 260;
/** How long "he already noticed you" stays true, so a message burst cannot
 *  restart the notice choreography over and over. */
const NOTICE_MEMORY = 1500;
/** Safety net: nothing stays off-IDLE forever if an event stream dies. */
const MAX_STATE_LIFETIME = 90_000;
/** Streaming refresh rate — tokens must never drive the animation. */
const STREAM_THROTTLE = 700;

// ---------------------------------------------------------------------------
// 2. WHAT THE BODY PLAYS
// ---------------------------------------------------------------------------

interface StateLook {
  scene: string;
  gaze: MascotGaze;
  expression: MascotExpression;
  /** ms this state holds before the plan queue advances; 0 = until an event */
  hold: number;
}

const LOOK: Record<MascotState, StateLook> = {
  IDLE: { scene: 'idle', gaze: 'ENVIRONMENT', expression: 'NEUTRAL', hold: 0 },
  NOTICE_USER: { scene: 'idle', gaze: 'USER', expression: 'CURIOUS', hold: 520 },
  LOOK_AT_USER: { scene: 'idle', gaze: 'USER', expression: 'NEUTRAL', hold: 900 },
  LOOK_AT_LAPTOP: { scene: 'idle', gaze: 'LAPTOP_SCREEN', expression: 'FOCUSED', hold: 460 },
  WORKING: { scene: 'typing', gaze: 'LAPTOP_SCREEN', expression: 'FOCUSED', hold: 0 },
  TYPING: { scene: 'typing', gaze: 'KEYBOARD', expression: 'FOCUSED', hold: 0 },
  THINKING: { scene: 'think', gaze: 'LAPTOP_SCREEN', expression: 'FOCUSED', hold: 0 },
  READING: { scene: 'idle', gaze: 'LAPTOP_SCREEN', expression: 'FOCUSED', hold: 900 },
  REACTING: { scene: 'talk', gaze: 'USER', expression: 'NEUTRAL', hold: 1200 },
  WAITING: { scene: 'listen', gaze: 'USER', expression: 'NEUTRAL', hold: 1500 },
  ERROR: { scene: 'oops', gaze: 'LAPTOP_SCREEN', expression: 'CONCERNED', hold: 2600 },
  RETURN_TO_IDLE: { scene: 'idle', gaze: 'ENVIRONMENT', expression: 'NEUTRAL', hold: 420 },
};

/** Scene played while REACTING, chosen by the expression the AI asked for. */
const REACTION_SCENE: Record<MascotExpression, string> = {
  NEUTRAL: 'talk',
  FOCUSED: 'talk',
  PLEASED: 'laugh',
  CONCERNED: 'sad',
  CURIOUS: 'surprised',
  PROUD: 'flex',
  TIRED: 'sleepy',
};

/** Legacy `pose` vocabulary → the new closed action set. */
const POSE_TO_ACTION: Record<string, MascotAction> = {
  idle: 'RETURN_TO_IDLE',
  wave: 'LOOK_AT_USER',
  happy: 'REACTING',
  excited: 'REACTING',
  thinking: 'THINKING',
  talking: 'REACTING',
  sad: 'REACTING',
  surprised: 'REACTING',
  confused: 'THINKING',
  confident: 'REACTING',
  sleepy: 'WAITING',
  typing: 'TYPING',
  listen: 'WAITING',
};

const POSE_TO_EXPRESSION: Record<string, MascotExpression> = {
  idle: 'NEUTRAL',
  wave: 'NEUTRAL',
  happy: 'PLEASED',
  excited: 'PLEASED',
  thinking: 'FOCUSED',
  talking: 'NEUTRAL',
  sad: 'CONCERNED',
  surprised: 'CURIOUS',
  confused: 'CONCERNED',
  confident: 'PROUD',
  sleepy: 'TIRED',
  typing: 'FOCUSED',
  listen: 'NEUTRAL',
};

// ---------------------------------------------------------------------------
// 3. SNAPSHOT — the only thing the renderer sees
// ---------------------------------------------------------------------------

export interface MascotSnapshot {
  state: MascotState;
  gaze: MascotGaze;
  expression: MascotExpression;
  laptop: MascotLaptopState;
  /** frame sequence currently playing on the body */
  scene: string;
  /** true while an AI request is genuinely in flight */
  requestActive: boolean;
  /** short text the laptop screen may show (real AI output, never invented) */
  screenText: string;
  /** monotonically increases on every committed change — cheap memo key */
  revision: number;
}

export interface MascotContext {
  name: string;
  page: string;
  daypart: string;
}

const daypartFa = (): string => {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? 'صبح' : h >= 12 && h < 15 ? 'ظهر' : h >= 15 && h < 19 ? 'عصر' : 'شب';
};

// ---------------------------------------------------------------------------
// 4. THE CONTROLLER
// ---------------------------------------------------------------------------

type Listener = (s: MascotSnapshot) => void;

/** A beat in a multi-step behaviour, e.g. notice → look → work. */
interface PlanStep {
  state: MascotState;
  hold: number;
  expression?: MascotExpression;
  gaze?: MascotGaze;
}

class MascotController {
  private listeners = new Set<Listener>();

  // --- single owner of every timer in the system -------------------------
  private timer: ReturnType<typeof setTimeout> | null = null;
  private timerAt = 0;
  private generation = 0;
  private watchdog: ReturnType<typeof setTimeout> | null = null;

  // --- single owner of the long-request micro-behaviour -------------------
  private microTimer: ReturnType<typeof setTimeout> | null = null;
  private microPhase = 0;

  private plan: PlanStep[] = [];
  /**
   * An event that had the right priority but arrived inside the current
   * beat's minimum hold. It is re-offered once the hold expires instead of
   * being dropped — dropping it is exactly how a completion used to get lost
   * and leave the character working forever.
   */
  private pending: MascotEvent | null = null;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;
  private state: MascotState = 'IDLE';
  private expression: MascotExpression | null = null;
  private gazeOverride: MascotGaze | null = null;
  private enteredAt = 0;
  private sceneOverride: string | null = null;

  private requestActive = false;
  /** last time the character already noticed the visitor — see CHAT_MESSAGE_SENT */
  private noticedAt = 0;
  private screenText = '';
  private lastStreamPublish = 0;
  private revision = 0;

  private visitor: { name: string; page: string } = { name: '', page: 'home' };
  private chatOpen = false;
  private history: Array<{ state: MascotState; at: number }> = [];

  private snapshot: MascotSnapshot = {
    state: 'IDLE',
    gaze: 'ENVIRONMENT',
    expression: 'NEUTRAL',
    laptop: 'IDLE',
    scene: 'idle',
    requestActive: false,
    screenText: '',
    revision: 0,
  };

  // --- subscription ------------------------------------------------------
  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    fn(this.snapshot);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = (): MascotSnapshot => this.snapshot;

  // --- context ------------------------------------------------------------
  setVisitor(v: { name?: string; page?: string }) {
    if (v.name !== undefined) this.visitor.name = v.name;
    if (v.page !== undefined) this.visitor.page = v.page;
  }

  setChatOpen(open: boolean) {
    this.chatOpen = open;
  }

  getContext(): MascotContext {
    return { name: this.visitor.name, page: this.visitor.page, daypart: daypartFa() };
  }

  /** One-line state handed to the AI so it continues the scene, not restarts it. */
  snapshotLine(): string {
    const c = this.getContext();
    const recent = this.history
      .slice(-3)
      .map((h) => h.state)
      .join('، ');
    return [
      c.name ? `نام مخاطب: «${c.name}» — طبیعی و گاهی صداش کن` : 'نام مخاطب را نمی‌دانی',
      `صفحه‌ی فعلی: «${c.page}»`,
      `زمان: ${c.daypart}`,
      this.chatOpen ? 'پنل گفتگو باز است' : 'پنل گفتگو بسته است',
      `بدن الان: ${this.state} (نگاه: ${this.snapshot.gaze})`,
      recent ? `اکت‌های اخیر: ${recent} — همین‌ها را تکرار نکن` : '',
    ]
      .filter(Boolean)
      .join(' | ');
  }

  // --- the only door in ---------------------------------------------------
  dispatch(event: MascotEvent) {
    const priority = event.priority ?? EVENT_PRIORITY[event.type] ?? 'NORMAL';

    // a newer event always supersedes a deferred one
    this.clearPending();

    if (event.type === 'AI_REQUEST_STREAMING') this.noteStream(event);
    if (event.type === 'AI_REQUEST_STARTED') {
      this.requestActive = true;
      this.screenText = '';
    }

    // priority gate: a beat may not be interrupted by something less important
    const gate = this.mayInterrupt(priority);
    if (gate === 'blocked') return false;
    if (gate === 'hold') {
      this.defer(event, this.remainingHold(priority));
      return false;
    }

    switch (event.type) {
      case 'CHAT_MESSAGE_SENT':
        // notice → look at the machine → work (the request start merges here).
        // A burst of messages must not restart the choreography every time —
        // once he has noticed you he just keeps working.
        if (this.isAtWork()) {
          this.enter('WORKING', 0);
        } else if (Date.now() - this.noticedAt < NOTICE_MEMORY) {
          this.enter('WORKING', 0);
        } else {
          this.noticedAt = Date.now();
          this.run([
            { state: 'NOTICE_USER', hold: LOOK.NOTICE_USER.hold },
            { state: 'LOOK_AT_LAPTOP', hold: LOOK.LOOK_AT_LAPTOP.hold },
            { state: 'WORKING', hold: 0 },
          ]);
        }
        break;

      case 'AI_REQUEST_STARTED':
        if (this.isAtWork() || Date.now() - this.noticedAt < NOTICE_MEMORY) {
          if (!this.isAtWork()) this.enter('WORKING', 0);
        } else {
          // a request fired without a message (quick chip, retry…): still show it
          this.noticedAt = Date.now();
          this.run([
            { state: 'LOOK_AT_LAPTOP', hold: 300 },
            { state: 'WORKING', hold: 0 },
          ]);
        }
        break;

      case 'AI_REQUEST_STREAMING':
        // deliberately a no-op: streaming keeps WORKING alive, nothing more
        return true;

      case 'AI_REQUEST_COMPLETED':
        this.requestActive = false;
        if (event.text) this.screenText = event.text;
        this.run([
          { state: 'READING', hold: scaledHold(event.text, LOOK.READING.hold) },
          { state: 'REACTING', hold: scaledHold(event.text, LOOK.REACTING.hold) },
          { state: 'RETURN_TO_IDLE', hold: LOOK.RETURN_TO_IDLE.hold },
        ]);
        break;

      case 'AI_REQUEST_FAILED':
        this.requestActive = false;
        this.run([
          { state: 'ERROR', hold: LOOK.ERROR.hold, expression: 'CONCERNED' },
          { state: 'RETURN_TO_IDLE', hold: LOOK.RETURN_TO_IDLE.hold },
        ]);
        break;

      case 'AI_REQUEST_CANCELLED': {
        // A cancel only means anything if a request was really in flight.
        // Unmounting the panel must never produce a sad face.
        const wasActive = this.requestActive;
        this.requestActive = false;
        this.run(
          wasActive
            ? [
                { state: 'ERROR', hold: LOOK.ERROR.hold, expression: 'CONCERNED' },
                { state: 'RETURN_TO_IDLE', hold: LOOK.RETURN_TO_IDLE.hold },
              ]
            : [{ state: 'RETURN_TO_IDLE', hold: LOOK.RETURN_TO_IDLE.hold }]
        );
        break;
      }

      case 'CHAT_OPENED':
        this.run([
          { state: 'NOTICE_USER', hold: LOOK.NOTICE_USER.hold },
          { state: 'LOOK_AT_USER', hold: LOOK.LOOK_AT_USER.hold },
          { state: 'RETURN_TO_IDLE', hold: LOOK.RETURN_TO_IDLE.hold },
        ]);
        break;

      case 'CHAT_CLOSED':
        this.run([{ state: 'RETURN_TO_IDLE', hold: LOOK.RETURN_TO_IDLE.hold }]);
        break;

      case 'FORM_SUCCESS':
      case 'BOOKING_SUCCESS':
      case 'COPY':
        this.run([
          { state: 'REACTING', hold: 1600, expression: 'PLEASED' },
          { state: 'RETURN_TO_IDLE', hold: LOOK.RETURN_TO_IDLE.hold },
        ]);
        break;

      case 'EXIT_INTENT':
        this.run([
          { state: 'LOOK_AT_USER', hold: 1200, expression: 'CONCERNED' },
          { state: 'RETURN_TO_IDLE', hold: LOOK.RETURN_TO_IDLE.hold },
        ]);
        break;

      case 'USER_RETURNED':
        this.run([
          { state: 'NOTICE_USER', hold: LOOK.NOTICE_USER.hold },
          { state: 'RETURN_TO_IDLE', hold: LOOK.RETURN_TO_IDLE.hold },
        ]);
        break;

      case 'PAGE_CHANGED':
        this.run([
          { state: 'NOTICE_USER', hold: 420 },
          { state: 'RETURN_TO_IDLE', hold: LOOK.RETURN_TO_IDLE.hold },
        ]);
        break;

      case 'BUTTON_CLICKED':
      case 'USER_TYPING':
        this.run([
          { state: 'WAITING', hold: LOOK.WAITING.hold },
          { state: 'RETURN_TO_IDLE', hold: LOOK.RETURN_TO_IDLE.hold },
        ]);
        break;

      case 'USER_IDLE':
        this.run([{ state: 'RETURN_TO_IDLE', hold: LOOK.RETURN_TO_IDLE.hold }]);
        break;

      default:
        return false;
    }
    return true;
  }

  /** The AI's validated intent: it may only ask for actions from the closed set. */
  applyIntent(intent: MascotIntent | null) {
    if (!intent) {
      // invalid / missing directive → he is simply still talking
      this.expression = 'NEUTRAL';
      this.gazeOverride = 'USER';
      this.publish();
      return false;
    }
    const action = intent.action;
    if (action === 'REACTING' || action === 'THINKING' || action === 'READING' || action === 'WAITING' || action === 'LOOK_AT_USER') {
      this.expression = intent.expression ?? this.expression ?? 'NEUTRAL';
      this.gazeOverride = intent.gaze ?? null;
      this.publish();
      return true;
    }
    return false;
  }

  /** Hard reset used when the chat is torn down mid-flight (unmount, nav…). */
  reset() {
    this.clearPending();
    this.requestActive = false;
    this.screenText = '';
    this.plan = [];
    this.enter('RETURN_TO_IDLE', LOOK.RETURN_TO_IDLE.hold);
  }

  dispose() {
    this.clearPending();
    this.clearTimer();
    this.clearMicro();
    this.clearWatchdog();
    this.listeners.clear();
  }

  // --- internals ----------------------------------------------------------
  /**
   * A streaming response must not drive the animation. Tokens land here, are
   * throttled hard, and only refresh the laptop's activity — the state stays
   * exactly where the request lifecycle put it.
   */
  private noteStream(event: MascotEvent) {
    const now = Date.now();
    if (event.text) this.screenText = event.text;
    if (now - this.lastStreamPublish < STREAM_THROTTLE) return;
    this.lastStreamPublish = now;
    this.publish();
  }

  private isAtWork(): boolean {
    return this.state === 'WORKING' || this.state === 'TYPING' || this.state === 'THINKING';
  }

  /**
   * 'ok'      → take over now
   * 'hold'    → right priority, but the current beat has not had its minimum
   *             time yet: defer and retry (never drop a completion)
   * 'blocked' → not important enough: drop
   */
  private mayInterrupt(priority: MascotPriority): 'ok' | 'hold' | 'blocked' {
    if (this.state === 'IDLE' || this.state === 'RETURN_TO_IDLE') return 'ok';
    const current = STATE_PRIORITY[this.state];
    if (PRIO_RANK[priority] > PRIO_RANK[current]) return 'ok';
    if (PRIO_RANK[priority] < PRIO_RANK[current]) return 'blocked';
    const elapsed = Date.now() - this.enteredAt;
    const minHold = this.isAtWork() ? MIN_WORKING_HOLD : MIN_STATE_HOLD;
    return elapsed >= minHold ? 'ok' : 'hold';
  }

  private remainingHold(priority: MascotPriority): number {
    const minHold = this.isAtWork() ? MIN_WORKING_HOLD : MIN_STATE_HOLD;
    return Math.max(30, minHold - (Date.now() - this.enteredAt));
  }

  private defer(event: MascotEvent, wait: number) {
    this.pending = event;
    this.pendingTimer = setTimeout(() => {
      this.pendingTimer = null;
      const next = this.pending;
      this.pending = null;
      if (next) this.dispatch(next);
    }, wait);
  }

  private clearPending() {
    if (this.pendingTimer) clearTimeout(this.pendingTimer);
    this.pendingTimer = null;
    this.pending = null;
  }

  /** Replace the plan with a new sequence and start it. */
  private run(steps: PlanStep[]) {
    this.plan = steps;
    this.advance();
  }

  private advance() {
    const step = this.plan.shift();
    if (!step) {
      // plan finished: rest, unless a request is somehow still open
      if (this.requestActive) {
        this.enter('WORKING', 0);
        return;
      }
      this.enter('IDLE', 0);
      return;
    }
    this.enter(step.state, step.hold, step.expression, step.gaze);
  }

  private enter(state: MascotState, hold: number, expression?: MascotExpression, gaze?: MascotGaze) {
    this.generation += 1;
    const gen = this.generation;
    this.state = state;
    this.enteredAt = Date.now();
    this.sceneOverride = null;
    this.expression = expression ?? (state === 'ERROR' ? 'CONCERNED' : state === 'IDLE' ? 'NEUTRAL' : this.expression);
    // a reaction keeps the gaze the AI asked for until the beat ends
    const keepsGaze = state === 'REACTING' || state === 'READING' || state === 'ERROR';
    this.gazeOverride = gaze ?? (keepsGaze ? this.gazeOverride : null);

    if (state === 'IDLE' || state === 'RETURN_TO_IDLE') {
      this.expression = state === 'RETURN_TO_IDLE' ? this.expression : 'NEUTRAL';
    }

    this.history.push({ state, at: this.enteredAt });
    if (this.history.length > 8) this.history.shift();

    this.clearMicro();
    if (state === 'WORKING') this.startMicro(gen);

    this.publish();
    this.armWatchdog(gen);

    if (hold > 0) {
      this.setTimer(hold, gen, () => this.advance());
    } else {
      this.clearTimer();
    }
  }

  /**
   * Long-request micro-behaviour: type → pause → check screen → think → type…
   * It only varies the *sub-action* (scene + gaze). The state stays WORKING
   * until the real request completes or fails, so a 500 ms answer is short and
   * a 25 s answer stays alive the whole time.
   */
  private startMicro(gen: number) {
    const phases: Array<{ scene: string; gaze: MascotGaze; min: number; max: number }> = [
      { scene: 'typing', gaze: 'KEYBOARD', min: 1100, max: 2100 },
      { scene: 'idle', gaze: 'LAPTOP_SCREEN', min: 500, max: 900 },
      { scene: 'think', gaze: 'LAPTOP_SCREEN', min: 900, max: 1600 },
      { scene: 'typing', gaze: 'KEYBOARD', min: 800, max: 1500 },
      { scene: 'idle', gaze: 'LAPTOP_SCREEN', min: 400, max: 800 },
    ];
    const step = () => {
      if (gen !== this.generation) return; // superseded
      const p = phases[this.microPhase % phases.length];
      this.microPhase += 1;
      this.sceneOverride = p.scene;
      this.gazeOverride = p.gaze;
      this.publish();
      const wait = p.min + Math.random() * (p.max - p.min);
      this.microTimer = setTimeout(step, wait);
    };
    this.microTimer = setTimeout(step, 260);
  }

  private clearMicro() {
    if (this.microTimer) clearTimeout(this.microTimer);
    this.microTimer = null;
  }

  private setTimer(ms: number, gen: number, fn: () => void) {
    this.clearTimer();
    this.timerAt = Date.now() + ms;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (gen !== this.generation) return; // a newer beat owns the body now
      fn();
    }, ms);
  }

  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private armWatchdog(gen: number) {
    this.clearWatchdog();
    this.watchdog = setTimeout(() => {
      this.watchdog = null;
      if (gen !== this.generation) return;
      if (this.state === 'IDLE' || this.state === 'RETURN_TO_IDLE') return;
      if (this.requestActive) {
        this.armWatchdog(gen); // a genuinely slow request: keep watching
        return;
      }
      // something died mid-flight — never leave the character frozen
      this.requestActive = false;
      this.plan = [];
      this.enter('RETURN_TO_IDLE', LOOK.RETURN_TO_IDLE.hold);
    }, MAX_STATE_LIFETIME);
  }

  private clearWatchdog() {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = null;
  }

  private resolveScene(): string {
    if (this.sceneOverride) return this.sceneOverride;
    if (this.state === 'REACTING') return REACTION_SCENE[this.expression ?? 'NEUTRAL'] ?? 'talk';
    return LOOK[this.state].scene;
  }

  private resolveGaze(): MascotGaze {
    return this.gazeOverride ?? LOOK[this.state].gaze;
  }

  private resolveLaptop(): MascotLaptopState {
    if (this.state === 'ERROR') return 'ERROR';
    if (this.requestActive) return this.resolveScene() === 'typing' ? 'WORKING' : 'PROCESSING';
    if (this.state === 'READING') return 'READING';
    if (this.state === 'REACTING' || this.state === 'RETURN_TO_IDLE') return 'READY';
    return 'IDLE';
  }

  private publish() {
    const scene = SCENES[this.resolveScene()] ? this.resolveScene() : 'idle';
    const next: MascotSnapshot = {
      state: this.state,
      gaze: this.resolveGaze(),
      expression: this.expression ?? 'NEUTRAL',
      laptop: this.resolveLaptop(),
      scene,
      requestActive: this.requestActive,
      screenText: this.screenText,
      revision: this.revision + 1,
    };
    const prev = this.snapshot;
    if (
      prev.state === next.state &&
      prev.gaze === next.gaze &&
      prev.expression === next.expression &&
      prev.laptop === next.laptop &&
      prev.scene === next.scene &&
      prev.requestActive === next.requestActive &&
      prev.screenText === next.screenText
    ) {
      return;
    }
    this.revision = next.revision;
    this.snapshot = next;
    mascot.scene(next.scene);
    this.listeners.forEach((fn) => fn(next));
  }
}

/** Longer answers earn a slightly longer read/react beat — bounded, never fake. */
function scaledHold(text: string | undefined, base: number): number {
  const len = (text || '').length;
  return Math.round(Math.min(base * 2.2, base + len * 3.2));
}

export const mascotController = new MascotController();

// ---------------------------------------------------------------------------
// 5. AI PROTOCOL — strict validation, safe fallback
// ---------------------------------------------------------------------------

export interface MascotIntent {
  action: MascotAction;
  gaze?: MascotGaze;
  expression?: MascotExpression;
}

const isAction = (v: unknown): v is MascotAction => MASCOT_ACTIONS.includes(v as MascotAction);
const isGaze = (v: unknown): v is MascotGaze => MASCOT_GAZES.includes(v as MascotGaze);
const isExpression = (v: unknown): v is MascotExpression => MASCOT_EXPRESSIONS.includes(v as MascotExpression);

/**
 * Validate whatever the model sent. Anything unrecognised, any wrong type and
 * any string outside the closed vocabulary returns null — the caller then
 * falls back to THINKING/IDLE and the application keeps working.
 */
export function parseMascotIntent(raw: unknown): MascotIntent | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  let action: MascotAction | null = null;

  if (isAction(o.action)) action = o.action;
  else if (typeof o.action === 'string') {
    // tolerate lower-case / spaced variants before giving up
    const norm = o.action.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (isAction(norm)) action = norm;
  }
  // legacy `pose` vocabulary (still emitted by the local fallback matcher)
  if (!action && typeof o.pose === 'string' && POSE_TO_ACTION[o.pose]) action = POSE_TO_ACTION[o.pose];
  if (!action) return null;

  const intent: MascotIntent = { action };
  if (isGaze(o.gaze)) intent.gaze = o.gaze;
  if (isExpression(o.expression)) intent.expression = o.expression;

  // legacy poses carried their mood in `pose`
  if (!intent.expression && typeof o.pose === 'string' && POSE_TO_EXPRESSION[o.pose]) {
    intent.expression = POSE_TO_EXPRESSION[o.pose];
  }
  return intent;
}

/**
 * Pull `[[act:{…}]]` out of a raw model answer, hand the directive to the
 * controller and return the clean text. Malformed directives are dropped
 * silently — the body simply stays calm.
 */
export interface AppliedAnswer {
  text: string;
  applied: boolean;
  intent: MascotIntent;
  /** optional short spoken aside requested by the model */
  bubble: string | null;
}

export function applyAIRawAnswer(raw: string): AppliedAnswer {
  const rawText = String(raw || '');
  const m = rawText.match(/\[\[act:\s*(\{[\s\S]*?\})\s*\]\]/i);
  let text = rawText;
  let intent: MascotIntent | null = null;
  let applied = false;
  let bubble: string | null = null;

  if (m) {
    text = (rawText.slice(0, m.index) + ' ' + rawText.slice(m.index + m[0].length)).replace(/\s{2,}/g, ' ').trim();
    try {
      const parsed = JSON.parse(m[1]) as Record<string, unknown>;
      intent = parseMascotIntent(parsed);
      const b = parsed?.bubble;
      if (typeof b === 'string' && b.trim()) bubble = b.trim().slice(0, 120);
    } catch {
      intent = null;
    }
  }
  if (!intent) {
    // graceful fallback described in the spec: never idle, never invent
    intent = { action: 'REACTING', gaze: 'USER', expression: 'NEUTRAL' };
  } else {
    applied = true;
  }
  mascotController.applyIntent(intent);
  return { text, applied, intent, bubble };
}

/** Apply a directive that arrived out-of-band (the `act` field of the API). */
export function applyAIAct(raw: unknown): AppliedAnswer | null {
  const intent = parseMascotIntent(raw);
  if (!intent) return null;
  mascotController.applyIntent(intent);
  const b = (raw as Record<string, unknown> | null)?.bubble;
  return { text: '', applied: true, intent, bubble: typeof b === 'string' ? b.slice(0, 120) : null };
}

/** Thin named aliases — every caller in the app goes through `dispatch()`. */
export const soulSetVisitor = (v: { name?: string; page?: string }) => mascotController.setVisitor(v);
export const soulSetChatOpen = (open: boolean) => mascotController.setChatOpen(open);
export const soulGetContext = (): MascotContext => mascotController.getContext();
export const soulSnapshotLine = (): string => mascotController.snapshotLine();

/** Debug handle: `window.__soul.state`, `window.__soul.send('AI_REQUEST_STARTED')`. */
if (typeof window !== 'undefined') {
  (window as unknown as { __soul: unknown }).__soul = {
    controller: mascotController,
    dispatch: (type: MascotEventType, extra?: Partial<MascotEvent>) => mascotController.dispatch({ type, ...extra }),
    states: MASCOT_STATES,
    actions: MASCOT_ACTIONS,
    parse: parseMascotIntent,
    snapshot: () => mascotController.getSnapshot(),
    reset: () => mascotController.reset(),
  };
}
