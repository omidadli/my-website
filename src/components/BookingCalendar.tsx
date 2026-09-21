import React, { useState } from 'react';
import { Theme } from '../types';
import { Calendar as CalendarIcon, Clock, Video, CheckCircle2, User, Mail, Globe, ArrowUpLeft } from 'lucide-react';

interface BookingCalendarProps {
  theme: Theme;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [selectedDate, setSelectedDate] = useState('۱۴۰۴/۰۵/۲۵ - شنبه');
  const [selectedTime, setSelectedTime] = useState('۱۴:۰۰');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    website: '',
    goal: 'بررسی کمپین و افزایش ROAS'
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
  };

  return (
    <div className={`p-6 sm:p-10 rounded-[40px] border backdrop-blur-2xl transition-all shadow-2xl ${
      isDark ? 'glass-card-dark' : 'glass-card-light'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#1d4ed8] to-[#3b82f6] text-white shadow-lg">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
            رزرو آنلاین جلسه استراتژی ۳۰ دقیقه‌ای (گوگل میت)
          </h3>
          <p className="text-xs text-slate-400">
            انتخاب زمان متناسب با تقویم کاری شما جهت بررسی آنلاین کمپین‌ها
          </p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          {/* Date Picker Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-3">۱. انتخاب روز جلسه</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {dates.map((d) => (
                <button
                  key={d.full}
                  onClick={() => setSelectedDate(d.full)}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    selectedDate === d.full
                      ? 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white border-transparent shadow-lg'
                      : isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-[10px] opacity-80">{d.day}</div>
                  <div className="text-sm font-black mt-1">{d.date}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Picker Slots */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-3">۲. انتخاب ساعت جلسه</label>
            <div className="flex flex-wrap gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all ${
                    selectedTime === time
                      ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-md font-black'
                      : isDark ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="glow-btn px-8 py-3.5 rounded-full text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
            >
              <span>ادامه و ورود اطلاعات</span>
              <ArrowUpLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleConfirmBooking} className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#8b5cf6]" />
              <span>زمان انتخابی: {selectedDate} - ساعت {selectedTime}</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[#5ce1e6] hover:underline text-[11px]"
            >
              تغییر زمان
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-300">نام و نام خانوادگی *</label>
              <input
                type="text"
                required
                placeholder="مثلا: رضا محمدی"
                value={bookingForm.name}
                onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold border focus:outline-none ${
                  isDark ? 'bg-white/10 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-300">ایمیل دریافت لینک آنلاین *</label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={bookingForm.email}
                onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold border focus:outline-none ${
                  isDark ? 'bg-white/10 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-300">آدرس وب‌سایت یا آیدی تلگرام</label>
            <input
              type="text"
              placeholder="https://myshop.com یا @mytelegram"
              value={bookingForm.website}
              onChange={(e) => setBookingForm({ ...bookingForm, website: e.target.value })}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold border focus:outline-none ${
                isDark ? 'bg-white/10 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-white/10 text-white hover:bg-white/20"
            >
              بازگشت
            </button>
            <button
              type="submit"
              className="glow-btn px-8 py-3.5 rounded-full text-xs font-bold text-white shadow-xl"
            >
              تایید نهایی و ثبت در تقویم
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="text-center space-y-4 py-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h4 className="text-2xl font-black text-white">جلسه شما با موفقیت رزرو شد!</h4>

          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            لینک دعوت Google Meet برای تاریخ <strong className="text-[#5ce1e6]">{selectedDate} - ساعت {selectedTime}</strong> به ایمیل {bookingForm.email} ارسال شد.
          </p>

          <div className="pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              رزرو جلسه جدید
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
