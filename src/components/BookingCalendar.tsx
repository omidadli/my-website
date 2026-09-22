import React, { useState } from 'react';
import { Theme } from '../types';
import { Calendar as CalendarIcon, CheckCircle2, ArrowUpLeft, Video } from 'lucide-react';
import { inputCls } from './nd/Kit';

interface BookingCalendarProps {
  theme: Theme;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [selectedDate, setSelectedDate] = useState('۱۴۰۴/۰۵/۲۵ - شنبه');
  const [selectedTime, setSelectedTime] = useState('۱۴:۰۰ بعدازظهر');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    website: '',
    goal: 'بررسی کمپین و افزایش ROAS',
  });

  const dates = [
    { day: 'شنبه', date: '۲۵ مرداد', full: '۱۴۰۴/۰۵/۲۵ - شنبه' },
    { day: 'یکشنبه', date: '۲۶ مرداد', full: '۱۴۰۴/۰۵/۲۶ - یکشنبه' },
    { day: 'دوشنبه', date: '۲۷ مرداد', full: '۱۴۰۴/۰۵/۲۷ - دوشنبه' },
    { day: 'سه‌شنبه', date: '۲۸ مرداد', full: '۱۴۰۴/۰۵/۲۸ - سه‌شنبه' },
  ];

  const timeSlots = ['۱۰:۰۰ صبح', '۱۲:۳۰ ظهر', '۱۴:۰۰ بعدازظهر', '۱۶:۳۰ عصر', '۱۹:۰۰ شب'];

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
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
                const isActive = selectedDate === d.full;
                return (
                  <button
                    key={d.full}
                    type="button"
                    onClick={() => setSelectedDate(d.full)}
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
              <span className="font-extrabold">{selectedDate}</span>
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
            <button type="submit" className={`nd-btn px-8 py-3.5 text-xs ${isDark ? 'bg-white text-[#17171c] hover:bg-slate-200' : 'nd-btn-accent'}`}>
              <Video className="w-4 h-4" />
              <span>تایید نهایی و رزرو جلسه</span>
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="text-center space-y-4 py-6">
          <div className="w-16 h-16 rounded-full bg-[color:var(--nd-mint-soft)] text-[color:var(--nd-success)] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className={`nd-h2 text-2xl ${isDark ? 'text-white' : ''}`}>جلسه شما با موفقیت رزرو شد!</h4>
          <p className={`text-xs max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'nd-muted'}`}>
            لینک دعوت Google Meet برای تاریخ <strong className="text-[color:var(--nd-accent)]">{selectedDate} - ساعت {selectedTime}</strong> به ایمیل {bookingForm.email} ارسال شد.
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
