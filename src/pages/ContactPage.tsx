import React, { useState } from 'react';
import { Theme, Page } from '../types';
import { useContent } from '../context/ContentContext';
import { EditableText } from '../components/cms/EditableText';
import { BookingCalendar } from '../components/BookingCalendar';
import { PageHeader } from '../components/PageHeader';
import { CinematicSection, CinematicStagger, CinematicItem } from '../components/motion/CinematicSection';
import { Send, Mail, Linkedin, PhoneCall, CheckCircle2, Clock, MapPin, Sparkles, ArrowUpLeft, ShieldCheck, MessageCircle, Instagram, Twitter, Phone } from 'lucide-react';

interface ContactPageProps {
  theme: Theme;
  onNavigate: (page: Page) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ theme, onNavigate }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();
  const personalInfo = data.PERSONAL_INFO;

  const [activeTab, setActiveTab] = useState<'form' | 'calendar'>('form');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneOrTelegram: '',
    budget: '۵۰ تا ۱۰۰ میلیون تومان',
    serviceNeeded: 'مدیریت کمپین و تبلیغات (Paid Ads)',
    details: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-12 py-4">
      {/* Top Page Header & Breadcrumb */}
      <PageHeader
        theme={theme}
        page="contact"
        title="بیاین با هم صحبت کنیم"
        subtitle="چه سوالی داشته باشید، چه آماده‌ی شروع باشید — کافیه پیام بدید تا در کمتر از ۴ ساعت کاری بهتون پاسخ بدم."
        badgeText="ارتباط و شروع همکاری"
        onNavigate={onNavigate}
      />

      <CinematicSection variant="fade-up" delay={0.05} className="text-center">
        {/* Tab Selector Buttons */}
        <div className="inline-flex p-1.5 rounded-full bg-black/20 border border-white/10 gap-2 shadow-lg">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-lg shadow-blue-500/25 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            فرم درخواست مشاوره
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-lg shadow-blue-500/25 scale-105'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            رزرو آنلاین جلسه میت
          </button>
        </div>
      </CinematicSection>

      {activeTab === 'calendar' ? (
        <CinematicSection variant="scale-up" delay={0.1} className="max-w-3xl mx-auto">
          <BookingCalendar theme={theme} />
        </CinematicSection>
      ) : (
        /* Split Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Side: Direct Contact Chips & Availability */}
          <CinematicSection variant="slide-right" delay={0.1} className="lg:col-span-5 space-y-6">
            {/* Availability Glass Badge */}
            <div className={`p-6 rounded-[32px] border shadow-xl ${
              isDark ? 'glass-card-dark' : 'glass-card-light'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                  وضعیت پذیرش پروژه
                </h3>
              </div>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <EditableText path="PERSONAL_INFO.availability" defaultValue={personalInfo.availability} label="وضعیت پذیرش" />
              </p>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#5ce1e6]" />
                <span>میانگین زمان پاسخ‌گویی: کمتر از ۴ ساعت کاری</span>
              </div>
            </div>

            {/* Direct Contact Options */}
            <div className="space-y-3">
              <h3 className={`font-bold text-sm border-r-2 border-[#8b5cf6] pr-2 ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                ارتباط مستقیم و شبکه‌های اجتماعی
              </h3>

              <CinematicStagger staggerDelay={0.06} className="space-y-3">
                {/* WhatsApp & Call */}
                <CinematicItem>
                  <a
                    href={personalInfo.whatsappUrl || `https://wa.me/${personalInfo.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                      isDark ? 'bg-white/5 border-white/10 hover:border-emerald-400/50' : 'bg-white border-slate-200 shadow-sm hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>تماس / واتساپ مستقیم</h4>
                        <p className="text-[11px] text-slate-400 dir-ltr text-right">
                          <EditableText path="PERSONAL_INFO.phoneFormatted" defaultValue={personalInfo.phoneFormatted || personalInfo.phone} label="تلفن" />
                        </p>
                      </div>
                    </div>
                    <ArrowUpLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </CinematicItem>

                {/* Telegram */}
                <CinematicItem>
                  <a
                    href={personalInfo.telegramUrl || `https://t.me/${personalInfo.telegram?.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                      isDark ? 'bg-white/5 border-white/10 hover:border-[#5ce1e6]/50' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#5ce1e6]/20 text-[#5ce1e6]">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>آیدی تلگرام</h4>
                        <p className="text-[11px] text-slate-400 dir-ltr text-right">
                          <EditableText path="PERSONAL_INFO.telegram" defaultValue={personalInfo.telegram} label="تلگرام" />
                        </p>
                      </div>
                    </div>
                    <ArrowUpLeft className="w-4 h-4 text-slate-400 group-hover:text-[#5ce1e6] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </CinematicItem>

                {/* Email */}
                <CinematicItem>
                  <a
                    href={`mailto:${personalInfo.email}`}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                      isDark ? 'bg-white/5 border-white/10 hover:border-[#8b5cf6]/50' : 'bg-white border-slate-200 shadow-sm hover:border-violet-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#8b5cf6]/20 text-[#8b5cf6]">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>ارسال ایمیل مستقیم</h4>
                        <p className="text-[11px] text-slate-400 dir-ltr text-right">
                          <EditableText path="PERSONAL_INFO.email" defaultValue={personalInfo.email} label="ایمیل" />
                        </p>
                      </div>
                    </div>
                    <ArrowUpLeft className="w-4 h-4 text-slate-400 group-hover:text-[#8b5cf6] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </CinematicItem>

                {/* LinkedIn */}
                <CinematicItem>
                  <a
                    href={personalInfo.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                      isDark ? 'bg-white/5 border-white/10 hover:border-[#4c8dff]/50' : 'bg-white border-slate-200 shadow-sm hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#4c8dff]/20 text-[#4c8dff]">
                        <Linkedin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>پروفایل لینکدین</h4>
                        <p className="text-[11px] text-slate-400 dir-ltr text-right">omidadli01</p>
                      </div>
                    </div>
                    <ArrowUpLeft className="w-4 h-4 text-slate-400 group-hover:text-[#4c8dff] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </CinematicItem>

                {/* Instagram & X Twitter Row */}
                <CinematicItem>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <a
                      href={personalInfo.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-2.5 group ${
                        isDark ? 'bg-white/5 border-white/10 hover:border-pink-500/50' : 'bg-white border-slate-200 shadow-sm hover:border-pink-400'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                        <Instagram className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>اینستاگرام</h4>
                        <p className="text-[10px] text-slate-400 dir-ltr text-right">omidadli01</p>
                      </div>
                    </a>

                    <a
                      href={personalInfo.xTwitter}
                      target="_blank"
                      rel="noreferrer"
                      className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-2.5 group ${
                        isDark ? 'bg-white/5 border-white/10 hover:border-sky-400/50' : 'bg-white border-slate-200 shadow-sm hover:border-sky-400'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                        <Twitter className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>توییتر / X</h4>
                        <p className="text-[10px] text-slate-400 dir-ltr text-right">@omidad01</p>
                      </div>
                    </a>
                  </div>
                </CinematicItem>
              </CinematicStagger>
            </div>

            {/* Timezone / Location Info */}
            <div className="p-5 rounded-2xl bg-black/20 border border-white/10 space-y-2 text-xs text-slate-300 shadow-md">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8b5cf6]" />
                <span>موقعیت مکانی: <EditableText path="PERSONAL_INFO.location" defaultValue={personalInfo.location} label="موقعیت" /> (GMT+3:30)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>قرارداد رسمی عدم افشای اطلاعات (NDA) محفوظ است.</span>
              </div>
            </div>
          </CinematicSection>

          {/* Right Side: Contact Form Glass Panel */}
          <CinematicSection variant="slide-left" delay={0.15} className="lg:col-span-7">
            <div className={`p-8 sm:p-10 rounded-[40px] border backdrop-blur-2xl shadow-2xl ${
              isDark ? 'glass-card-dark' : 'glass-card-light'
            }`}>
              <h2 className={`text-2xl font-black mb-6 ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                فرم گفتگوی اولیه و شروع همکاری
              </h2>

              {submitted ? (
                <div className="p-8 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h3 className="text-xl font-bold text-white">پیامتون رسید!</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    ممنون از اعتمادتون. پیامتون رو بررسی می‌کنم و حداکثر تا ۴ ساعت کاری از طریق ایمیل یا تلفن باهاتون تماس می‌گیرم.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-full bg-white/10 text-xs font-bold text-white hover:bg-white/20"
                  >
                    ارسال پیام دیگر
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>نام و نام خانوادگی *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثلاً: علی رضایی"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold border focus:outline-none ${
                          isDark ? 'bg-white/10 border-white/15 text-white placeholder-slate-500 focus:border-[#8b5cf6]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>آدرس ایمیل یا شماره تماس *</label>
                      <input
                        type="text"
                        required
                        placeholder="name@example.com یا ۰۹۱۲۳۴۵۶۷۸۹"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold border focus:outline-none ${
                          isDark ? 'bg-white/10 border-white/15 text-white placeholder-slate-500 focus:border-[#8b5cf6]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>مرحله‌ی کسب‌وکارتون چیه؟</label>
                    <select
                      value={formData.serviceNeeded}
                      onChange={(e) => setFormData({ ...formData, serviceNeeded: e.target.value })}
                      className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold border focus:outline-none ${
                        isDark ? 'bg-[#1a1240] border-white/15 text-white focus:border-[#8b5cf6]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                      }`}
                    >
                      <option value="تازه می‌خوام آنلاین شروع کنم">تازه می‌خوام آنلاین شروع کنم (سایت/پیج ندارم یا اول راهم)</option>
                      <option value="فروش دارم، می‌خوام بهتر و بیشتر بفروشم">فروش دارم، می‌خوام بهتر و بیشتر بفروشم</option>
                      <option value="می‌خوام با تبلیغات و سئو سریع‌تر رشد کنم">می‌خوام با تبلیغات و سئو سریع‌تر رشد کنم</option>
                      <option value="هنوز مطمئن نیستم، نیاز به راهنمایی دارم">هنوز مطمئن نیستم، نیاز به راهنمایی دارم</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>توضیح کوتاه درباره‌ی کسب‌وکارتون یا چالش فعلی</label>
                    <textarea
                      rows={4}
                      placeholder="مثلاً: فروشگاه آنلاین پوشاک دارم و نرخ خرید سایتم کمه..."
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      className={`w-full p-4 rounded-2xl text-xs font-bold border focus:outline-none ${
                        isDark ? 'bg-white/10 border-white/15 text-white placeholder-slate-500 focus:border-[#8b5cf6]' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full glow-btn py-4 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-xl transition-transform hover:scale-[1.01]"
                  >
                    <span>ارسال پیام و شروع گفتگو</span>
                    <ArrowUpLeft className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </CinematicSection>
        </div>
      )}
    </div>
  );
};
