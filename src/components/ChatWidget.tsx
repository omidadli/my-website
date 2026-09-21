import React, { useEffect, useRef, useState } from 'react';
import { Theme } from '../types';
import { useContent } from '../context/ContentContext';
import { api } from '../services/api';
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react';

interface ChatWidgetProps {
  theme: Theme;
}

interface ChatMsg {
  role: 'user' | 'model';
  content: string;
}

/**
 * AI consultant widget — answers visitor questions grounded in the site's own
 * content (services, prices, case studies, blog, contact info).
 * Behavior (persona, greeting, quick questions, CTA) is fully managed from
 * the admin panel → «دستیار هوشمند».
 */
export const ChatWidget: React.FC<ChatWidgetProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();
  const cfg = data.CHAT_CONFIG;

  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unread, setUnread] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  // Only show when the Cloudflare API is live and the assistant is enabled.
  useEffect(() => {
    api.probe().then(setAvailable);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, open]);

  useEffect(() => {
    if (open) setUnread(false);
  }, [open]);

  if (!available || !cfg?.enabled) return null;

  const greet = () => {
    if (messages.length === 0) {
      setMessages([{ role: 'model', content: cfg.greeting }]);
    }
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setError('');
    const next: ChatMsg[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    const res = await api.sendChat(next.map((m) => ({ role: m.role, content: m.content })));
    setBusy(false);
    if (res.ok && res.answer) {
      setMessages((prev) => [...prev, { role: 'model', content: res.answer! }]);
    } else {
      setError(res.error || 'پاسخ دریافت نشد؛ دوباره تلاش کنید.');
    }
  };

  return (
    <>
      {/* Launcher — bottom-left, clear of the nav dock */}
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open) greet(); }}
        aria-label={open ? 'بستن دستیار هوشمند' : 'باز کردن دستیار هوشمند'}
        className={`fixed bottom-24 sm:bottom-7 left-3 sm:left-5 z-[60] rounded-full grid place-items-center shadow-xl transition-all duration-300 cursor-pointer ${
          open ? 'scale-90 rotate-90' : 'hover:scale-105'
        }`}
        style={{
          width: 52,
          height: 52,
          background: isDark ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--nd-accent)',
          color: '#fff',
        }}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {!open && unread && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#22c55e] border-2 border-[color:var(--nd-bg)] animate-pulse" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className={`fixed bottom-40 sm:bottom-24 left-3 sm:left-5 z-[60] w-[min(92vw,380px)] h-[min(68vh,540px)] rounded-[28px] overflow-hidden shadow-2xl flex flex-col border ${
            isDark ? 'bg-[#12121d] border-white/12' : 'bg-[color:var(--nd-surface)] border-[color:var(--nd-line)]'
          }`}
          role="dialog"
          aria-label="دستیار هوشمند"
        >
          {/* Header */}
          <div className={`flex items-center gap-3 px-4 py-3.5 border-b shrink-0 ${isDark ? 'border-white/10 bg-white/5' : 'border-[color:var(--nd-line)] bg-[color:var(--nd-bg-soft)]'}`}>
            <span className="w-9 h-9 rounded-xl grid place-items-center text-white text-sm font-black shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Bot className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className={`block text-xs font-extrabold truncate ${isDark ? 'text-white' : ''}`}>{cfg.title}</span>
              <span className="block text-[10px] font-bold text-[color:var(--nd-success)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--nd-success)] animate-pulse" />
                آنلاین — پاسخ از داده‌های سایت
              </span>
            </span>
            <button type="button" onClick={() => setOpen(false)} className={`p-1.5 rounded-lg cursor-pointer ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-[color:var(--nd-line)] nd-muted'}`} aria-label="بستن">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? isDark ? 'bg-white/10 text-slate-100 rounded-bl-sm' : 'bg-[color:var(--nd-bg-soft)] text-[color:var(--nd-ink)] rounded-bl-sm'
                      : 'bg-[color:var(--nd-accent)] text-white rounded-br-sm shadow-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-end">
                <div className={`rounded-2xl rounded-br-sm px-4 py-3 flex items-center gap-1.5 ${isDark ? 'bg-white/10' : 'bg-[color:var(--nd-bg-soft)]'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--nd-accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--nd-accent)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--nd-accent)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            {error && (
              <p className="text-[10px] font-extrabold text-[#dc2626] text-center">{error}</p>
            )}
          </div>

          {/* Quick questions */}
          {(cfg.quickQuestions || []).length > 0 && messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {cfg.quickQuestions.map((q: string) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={busy}
                  className={`nd-chip text-[10px] cursor-pointer transition-colors hover:text-[color:var(--nd-accent)] disabled:opacity-50 ${isDark ? 'nd-glass-dark border-white/15!' : ''}`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className={`flex items-center gap-2 p-3 border-t shrink-0 ${isDark ? 'border-white/10' : 'border-[color:var(--nd-line)]'}`}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="سوال‌تون رو بنویسید…"
              maxLength={1000}
              className={`flex-1 rounded-full px-4 py-2.5 text-xs font-bold focus:outline-none transition-colors ${
                isDark
                  ? 'bg-white/8 text-white placeholder:text-slate-500 focus:bg-white/12'
                  : 'bg-[color:var(--nd-bg-soft)] text-[color:var(--nd-ink)] placeholder:text-[color:var(--nd-faint)] focus:border-[color:var(--nd-accent)] border border-[color:var(--nd-line)]'
              }`}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="ارسال"
              className="w-10 h-10 rounded-full grid place-items-center text-white shrink-0 transition-all cursor-pointer disabled:opacity-40 hover:scale-105"
              style={{ background: 'var(--nd-accent)' }}
            >
              <Send className="w-4 h-4 -scale-x-100" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
