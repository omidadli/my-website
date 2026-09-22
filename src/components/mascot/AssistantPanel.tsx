import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, RefreshCw, AlertTriangle } from 'lucide-react';
import { Theme } from '../../types';
import { useContent } from '../../context/ContentContext';
import { api } from '../../services/api';
import { mascotController, applyAIAct, applyAIRawAnswer, soulGetContext } from './soul';
import { MascotWorkstation } from './MascotWorkstation';

interface AssistantPanelProps {
  theme: Theme;
  open: boolean;
  onClose: () => void;
}

interface ChatMsg {
  role: 'user' | 'model';
  content: string;
}

const HISTORY_KEY = 'nd-chat-history';
const MAX_HISTORY = 30;

function loadHistory(): ChatMsg[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m): m is ChatMsg => !!m && typeof m === 'object' && (m as ChatMsg).role !== undefined)
      .slice(-MAX_HISTORY);
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMsg[]) {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
  } catch {
    /* private mode */
  }
}

/**
 * AssistantPanel — the chat half of one experience.
 *
 * It owns NO animation logic. Every step of the AI request lifecycle is
 * reported to the single controller, which is the only thing that moves the
 * character:
 *
 *   send        → CHAT_MESSAGE_SENT + AI_REQUEST_STARTED
 *   token       → AI_REQUEST_STREAMING   (throttled — never per token)
 *   resolved    → AI_REQUEST_COMPLETED
 *   rejected    → AI_REQUEST_FAILED
 *   unmount/nav → AI_REQUEST_CANCELLED
 *
 * If the AI dies, the chat keeps working; the mascot is an enhancement, never
 * a dependency.
 */
export const AssistantPanel: React.FC<AssistantPanelProps> = ({ theme, open, onClose }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();
  const cfg = data.CHAT_CONFIG;

  const [available, setAvailable] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [streamText, setStreamText] = useState('');
  const [said, setSaid] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const saidTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStreamPing = useRef(0);
  /** true only while a request is genuinely open — guards the cancel event */
  const requestingRef = useRef(false);
  /** guards every setState after an await — no updates into a dead component */
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      // leaving mid-flight: cancel the request and tell the character
      abortRef.current?.abort();
      abortRef.current = null;
      if (saidTimer.current) clearTimeout(saidTimer.current);
      if (requestingRef.current) mascotController.dispatch({ type: 'AI_REQUEST_CANCELLED', label: 'panel-unmount' });
    };
  }, []);

  useEffect(() => {
    api.probe().then((v) => {
      if (aliveRef.current) setAvailable(v);
    });
  }, []);

  // keep the newest message in view without fighting the user's own scrolling
  useEffect(() => {
    const el = listRef.current;
    if (!el || !open) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, streamText, busy, open]);

  useEffect(() => {
    if (!open) return undefined;
    const restored = loadHistory();
    setMessages((prev) => (prev.length ? prev : restored.length ? restored : cfg?.greeting ? [{ role: 'model', content: cfg.greeting }] : []));
    const t = setTimeout(() => inputRef.current?.focus(), 380);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const flashSaid = useCallback((text: string) => {
    setSaid(text.slice(0, 90));
    if (saidTimer.current) clearTimeout(saidTimer.current);
    saidTimer.current = setTimeout(() => aliveRef.current && setSaid(null), 3600);
  }, []);

  const send = async (raw: string) => {
    const q = raw.trim();
    if (!q || busy) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    requestingRef.current = true;

    setError('');
    setStreamText('');
    const next: ChatMsg[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    saveHistory(next);
    setInput('');
    setBusy(true);

    // ---- lifecycle: the request is genuinely starting now
    mascotController.dispatch({ type: 'CHAT_MESSAGE_SENT' });
    mascotController.dispatch({ type: 'AI_REQUEST_STARTED' });
    lastStreamPing.current = 0;

    const ctx = soulGetContext();
    const res = await api.sendChat(
      next.map((m) => ({ role: m.role, content: m.content })),
      { name: ctx.name, page: ctx.page, daypart: ctx.daypart, bodyState: mascotController.snapshotLine() },
      {
        signal: ac.signal,
        onDelta: (partial) => {
          if (!aliveRef.current) return;
          setStreamText(partial);
          // throttled: tokens refresh the laptop, they never drive the body
          const now = Date.now();
          if (now - lastStreamPing.current > 700) {
            lastStreamPing.current = now;
            mascotController.dispatch({ type: 'AI_REQUEST_STREAMING', text: partial });
          }
        },
      }
    );

    requestingRef.current = false;
    if (!aliveRef.current) return;
    setBusy(false);
    setStreamText('');

    if (res.ok && res.answer) {
      const { text, bubble } = applyAIRawAnswer(res.answer);
      const finalText = (text || '').trim() || res.answer.trim();
      const after = [...next, { role: 'model' as const, content: finalText }];
      setMessages(after);
      saveHistory(after);
      // ---- lifecycle: the request really finished
      mascotController.dispatch({ type: 'AI_REQUEST_COMPLETED', text: finalText });
      const outOfBand = res.act ? applyAIAct(res.act) : null;
      const aside = outOfBand?.bubble ?? bubble;
      if (aside) flashSaid(aside);
    } else {
      setError(res.error || 'پاسخ دریافت نشد؛ دوباره تلاش کنید.');
      // ---- lifecycle: the request really failed
      mascotController.dispatch({ type: 'AI_REQUEST_FAILED', text: res.error });
    }
  };

  const retry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    setMessages((prev) => prev.slice(0, prev.length - (prev[prev.length - 1]?.role === 'model' ? 1 : 0)));
    void send(lastUser.content);
  };

  const quickQuestions = (cfg?.quickQuestions || []).slice(0, 3);
  const canSend = !!input.trim() && !busy;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          role="dialog"
          aria-modal="false"
          aria-label="دستیار هوشمند"
          className={`mascot-chat fixed bottom-24 right-2 z-[70] flex min-h-0 flex-col overflow-hidden rounded-[26px] shadow-2xl sm:bottom-28 sm:right-5 ${
            isDark ? 'border border-b-0 border-white/12 bg-[#12121d]' : 'border border-b-0 border-[color:var(--nd-line)] bg-[color:var(--nd-surface)]'
          }`}
        >
          {/* ---- the character at his machine ---- */}
          <div className="mascot-chat-stage">
            <AnimatePresence>
              {said && (
                <motion.div
                  key={said}
                  initial={{ opacity: 0, y: 6, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 24 }}
                  className="mascot-chat-said"
                >
                  {said}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mascot-chat-avatar">
              <MascotWorkstation />
            </div>

            <span
              className={`mascot-chat-status absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                isDark ? 'bg-black/35 text-emerald-300' : 'bg-white/75 text-emerald-600'
              }`}
              role="status"
              aria-live="polite"
            >
              <span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${busy ? 'animate-pulse' : ''}`} />
              {busy ? 'دارم جواب رو می‌نویسم...' : 'آنلاین'}
            </span>

            <button
              type="button"
              onClick={onClose}
              aria-label="بستن گفتگو"
              className={`mascot-chat-close absolute left-2.5 top-2.5 cursor-pointer rounded-full p-1.5 transition-colors ${
                isDark ? 'text-slate-300 hover:bg-white/10' : 'text-[color:var(--nd-ink-2)] hover:bg-black/5'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ---- messages ---- */}
          <div
            ref={listRef}
            className={`mascot-chat-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 ${isDark ? 'bg-[#0e0e18]' : 'bg-[color:var(--nd-bg-soft)]'}`}
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`mascot-chat-msg max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    m.role === 'user'
                      ? isDark
                        ? 'rounded-bl-sm bg-white/10 text-slate-100'
                        : 'rounded-bl-sm bg-white text-[color:var(--nd-ink)] shadow-sm'
                      : isDark
                        ? 'rounded-br-sm bg-indigo-500/90 text-white'
                        : 'rounded-br-sm bg-[color:var(--nd-accent)] text-white shadow-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* live streamed answer — one bubble, never one per token */}
            {busy && streamText && (
              <div className="flex justify-end">
                <div
                  className={`mascot-chat-msg max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm px-4 py-2.5 text-xs leading-relaxed ${
                    isDark ? 'bg-indigo-500/70 text-white' : 'bg-[color:var(--nd-accent)]/85 text-white shadow-sm'
                  }`}
                >
                  {streamText}
                </div>
              </div>
            )}

            {busy && !streamText && (
              <div className="flex justify-end">
                <div className={`flex items-center gap-1.5 rounded-2xl rounded-br-sm px-4 py-3 ${isDark ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--nd-accent)]" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--nd-accent)]" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--nd-accent)]" style={{ animationDelay: '300ms' }} />
                  <span className="sr-only">در حال دریافت پاسخ</span>
                </div>
              </div>
            )}

            {!available && (
              <p className={`flex items-center justify-center gap-1.5 text-center text-[10px] font-bold ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                <AlertTriangle className="h-3.5 w-3.5" />
                دستیار موقتاً در دسترس نیست
              </p>
            )}

            {error && (
              <div className="flex flex-col items-center gap-2 rounded-xl px-2 py-1">
                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-extrabold text-red-500">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {error}
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className="cursor-pointer rounded-full border border-red-400/50 px-3 py-1 text-[10.5px] font-extrabold text-red-500 transition-colors hover:bg-red-500/10"
                >
                  تلاش دوباره
                </button>
              </div>
            )}
          </div>

          {/* ---- quick questions ---- */}
          {quickQuestions.length > 0 && messages.length <= 1 && (
            <div className={`flex shrink-0 flex-wrap gap-1.5 border-t px-3.5 py-2.5 ${isDark ? 'border-white/10' : 'border-[color:var(--nd-line)]'}`}>
              {quickQuestions.map((q: string) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  disabled={busy}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-[10.5px] font-extrabold transition-all disabled:opacity-50 ${
                    isDark ? 'bg-white/8 text-slate-200 hover:bg-indigo-500/25' : 'bg-[color:var(--nd-accent-soft)] text-[color:var(--nd-accent)] hover:brightness-95'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ---- input ---- */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSend) void send(input);
            }}
            className={`flex shrink-0 items-center gap-2 border-t px-3.5 py-3 ${isDark ? 'border-white/10' : 'border-[color:var(--nd-line)]'}`}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // the character notices that the visitor is writing (LOW priority:
                // it can never interrupt an AI interaction)
                mascotController.dispatch({ type: 'USER_TYPING' });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) void send(input);
                }
              }}
              placeholder="سوالت رو بنویس..."
              aria-label="متن پیام"
              enterKeyHint="send"
              className={`h-10 min-w-0 flex-1 rounded-xl px-3.5 text-xs font-bold outline-none transition-colors ${
                isDark ? 'bg-white/8 text-slate-100 placeholder:text-slate-500 focus:bg-white/12' : 'bg-[color:var(--nd-bg)] text-[color:var(--nd-ink)] placeholder:text-[color:var(--nd-faint)] focus:bg-white'
              }`}
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label={busy ? 'در حال دریافت پاسخ' : 'ارسال پیام'}
              className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 -scale-x-100" />}
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
