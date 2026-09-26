import React, { useMemo, useState } from 'react';
import { Theme } from '../types';
import { api } from '../services/api';
import { Calendar as CalendarIcon, CheckCircle2, ArrowUpLeft, Video } from 'lucide-react';
import { inputCls } from './nd/Kit';
import { usePreservedState } from '../utils/statePreserver';
import { useContent } from '../context/ContentContext';
import { whatsappFallbackUrl } from '../utils/leadFallback';

interface BookingCalendarProps {
  theme: Theme;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();
  const personalInfo = data.PERSONAL_INFO;
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedIso, setSelectedIso] = usePreservedState<string>('booking_selected_iso', '');
  const [selectedTime, setSelectedTime] = usePreservedState<string>('booking_selected_time', '۱۴:۰۰ بعدازظهر');
  const [step, setStep] = usePreservedState<1 | 2 | 3>('booking_step', 1);

  const [bookingForm, setBookingForm] = usePreservedState('booking_form_data', {
    name: '',
    email: '',
    website: '',
    goal: 'بررسی کمپین و افزایش ROAS',
  });

  // The next 4 days, generated at render time (Persian calendar via Intl) —
  // never hard-coded, so the calendar can't show past dates.
  const dates = useMemo(() => {
    const fmtWeekday = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' });
    const fmtDayMonth = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' });
    const out: { iso: string; day: string; date: string; full: string }[] = [];
    for (let i = 1; i <= 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const day = fmtWeekday.format(d);
      const dm = fmtDayMonth.format(d);
      out.push({ iso: d.toISOString().slice(0, 10), day, date: dm, full: `${dm} - ${day}` });
    }
    return out;
  }, []);

  const selectedDate = dates.find((d) => d.iso === selectedIso) || dates[0];

  const timeSlots = ['۱۰:۰۰ صبح', '۱۲:۳۰ ظهر', '۱۴:۰۰ بعدازظهر', '۱۶:۳۰ عصر', '۱۹:۰۰ شب'];

  const whatsappFallback = whatsappFallbackUrl(personalInfo, [
    ['درخواست جلسه', `${selectedDate.full} - ساعت ${selectedTime}`],
    ['نام', bookingForm.name],
    ['ایمیل', bookingForm.email],
    ['سایت/تلگرام', bookingForm.website],
    ['هدف', bookingForm.goal],
  ]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    // Persist the booking as a lead (admin sees it in پیشخوان → لیدها) and only
    // confirm once it is stored; otherwise offer WhatsApp so the request is not lost.
    setSending(true);
    setSendError(null);
    const res = await api
      .postLead({
        source: 'booking',
        name: bookingForm.name.trim(),
        email: bookingForm.email.trim(),
        website: bookingForm.website.trim(),
        goal: bookingForm.goal,
        details: `رزرو جلسه مشاوره: ${selectedDate.full} - ساعت ${selectedTime}`,
        bookingDate: selectedDate.iso,
        bookingTime: selectedTime,
      })
      .catch(() => ({ ok: false as const, error: 'اتصال به سرور برقرار نشد.' }));
    setSending(false);
    if (!res.ok) {
      setSendError(res.error || 'ثبت درخواست ناموفق بود.');
      return;
    }
    setStep(3);
    window.dispatchEvent(new CustomEvent('nd:booking-success'));
  };

  return (
    <div className="nd-card p-6 sm:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3.5 rounded-2xl bg-[color:var(--nd-accent)] text-white shadow-md">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <h3 className={`nd-h2 text-xl ${isDark ? 'text-white' : ''}`}>رزرو جلسه‌ی مشاوره‌ی آنلاین</h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'nd-muted'}`}>
            یک زمان مناسب انتخاب کنید؛ لینک جلسه‌ی Google Meet برایتان ایمیل می‌شود.
          </p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-7">
          <div>
            <label className={`block text-xs font-extrabold mb-3 ${isDark ? 'text-slate-300' : 'text-[color:var(--nd-ink-2)]'}`}>۱. انتخاب روز جلسه</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {dates.map((d) => {
                const isActive = selectedDate.iso === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => setSelectedIso(d.iso)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[color:var(--nd-accent)] border-transparent text-white shadow-md'
                        : isDark
                          ? 'bg-white/5 border-white/10 text-slate-300 hover:border-white/25'
                          : 'bg-[color:var(--nd-surface)] border-[color:var(--nd-line)] text-[color:var(--nd-ink-2)] hover:border-[color:var(--nd-accent)]'
                    }`}
                  >
                    <div className="text-[10px] opacity-80 font-bold">{d.day}</div>
                    <div className="text-sm font-extrabold mt-1">{d.date}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={`block text-xs font-extrabold mb-3 ${isDark ? 'text-slate-300' : 'text-[color:var(--nd-ink-2)]'}`}>۲. انتخاب ساعت جلسه</label>
            <div className="flex flex-wrap gap-2">
              {timeSlots.map((slot) => {
                const isActive = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[color:var(--nd-accent)] border-transparent text-white shadow-sm'
                        : isDark
                          ? 'bg-white/5 border-white/10 text-slate-300 hover:border-white/25'
                          : 'bg-[color:var(--nd-surface)] border-[color:var(--nd-line)] text-[color:var(--nd-ink-2)] hover:border-[color:var(--nd-accent)]'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`pt-5 border-t flex justify-end ${isDark ? 'border-white/10' : 'border-[color:var(--nd-line)]'}`}>
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`nd-btn px-8 py-3.5 text-xs ${isDark ? 'bg-white text-[#17171c] hover:bg-slate-200' : 'nd-btn-accent'}`}
            >
              <span>ادامه و تکمیل اطلاعات</span>
              <ArrowUpLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleConfirmBooking} className="space-y-4">
          <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-[color:var(--nd-bg-soft)] border-[color:var(--nd-line)] text-[color:var(--nd-ink-2)]'}`}>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[color:var(--nd-accent)]" />
              <span className="font-extrabold">{selectedDate.full}</span>
              <span>·</span>
              <span className="font-extrabold">{selectedTime}</span>
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-[color:var(--nd-accent)] hover:underline text-[11px] font-bold cursor-pointer">
              ویرایش زمان
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-extrabold mb-1.5 ${isDark ? 'text-slate-300' : 'text-[color:var(--nd-ink-2)]'}`}>نام و نام خانوادگی *</label>
              <input
                type="text"
                required
                placeholder="نام کامل شما"
                value={bookingForm.name}
                onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                className={inputCls(isDark)}
              />
            </div>
            <div>
              <label className={`block text-xs font-extrabold mb-1.5 ${isDark ? 'text-slate-300' : 'text-[color:var(--nd-ink-2)]'}`}>ایمیل دریافت لینک آنلاین *</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={bookingForm.email}
                onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                className={`${inputCls(isDark)} dir-ltr text-right`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-extrabold mb-1.5 ${isDark ? 'text-slate-300' : 'text-[color:var(--nd-ink-2)]'}`}>آدرس وب‌سایت یا آیدی تلگرام</label>
            <input
              type="text"
              placeholder="example.com یا @username"
              value={bookingForm.website}
              onChange={(e) => setBookingForm({ ...bookingForm, website: e.target.value })}
              className={`${inputCls(isDark)} dir-ltr text-right`}
            />
          </div>

          <div className={`pt-5 border-t flex justify-between items-center ${isDark ? 'border-white/10' : 'border-[color:var(--nd-line)]'}`}>
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                isDark ? 'bg-white/10 text-slate-200 border-transparent hover:bg-white/20' : 'bg-[color:var(--nd-bg-soft)] text-[color:var(--nd-ink-2)] border-[color:var(--nd-line)] hover:border-[color:var(--nd-accent)]'
              }`}
            >
              مرحله قبل
            </button>
            <button type="submit" disabled={sending} aria-busy={sending} className={`nd-btn px-8 py-3.5 text-xs disabled:opacity-60 disabled:cursor-wait ${isDark ? 'bg-white text-[#17171c] hover:bg-slate-200' : 'nd-btn-accent'}`}>
              <Video className="w-4 h-4" />
              <span>{sending ? 'در حال ثبت…' : 'تایید نهایی و رزرو جلسه'}</span>
            </button>
          </div>
          {sendError && (
            <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-500 space-y-2">
              <p>{sendError} درخواستت ثبت نشد؛ می‌تونی همین درخواست رو مستقیم در واتساپ بفرستی:</p>
              <a href={whatsappFallback} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 underline underline-offset-2">
                <span>ارسال از طریق واتساپ</span>
                <ArrowUpLeft className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </form>
      )}

      {step === 3 && (
        <div className="text-center space-y-4 py-6">
          <div className="w-16 h-16 rounded-full bg-[color:var(--nd-mint-soft)] text-[color:var(--nd-success)] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className={`nd-h2 text-2xl ${isDark ? 'text-white' : ''}`}>رزرو شما ثبت شد!</h4>
          <p className={`text-xs max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'nd-muted'}`}>
            درخواست جلسه‌ی <strong className="text-[color:var(--nd-accent)]">{selectedDate.full} - ساعت {selectedTime}</strong> ثبت شد؛ لینک Google Meet به ایمیل {bookingForm.email} ارسال می‌شود.
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setBookingForm({ name: '', email: '', website: '', goal: bookingForm.goal });
              }}
              className="nd-btn nd-btn-ghost px-6 py-3 text-xs"
            >
              <span>بازگشت به تقویم</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
