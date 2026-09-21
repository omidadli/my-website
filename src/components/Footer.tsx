import React from 'react';
import { Theme, Page } from '../types';
import { useContent } from '../context/ContentContext';
import { EditableText } from './cms/EditableText';
import { ArrowUp, Send, Mail, Linkedin, PhoneCall, Sparkles, CheckCircle2, MessageCircle, Instagram, Twitter, Phone } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  theme: Theme;
  onNavigate: (page: Page) => void;
  onOpenAdminModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ theme, onNavigate }) => {
  const { data } = useContent();
  const personal = data.PERSONAL_INFO;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full px-4 sm:px-8 pt-16 pb-28 sm:pb-32 mt-20 relative z-10">
      <div className="max-w-7xl mx-auto rounded-[36px] bg-[#0f0a2e]/90 backdrop-blur-2xl border border-white/15 p-8 md:p-12 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        {/* Top Row: Logo, Bio & Socials */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-white/10">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-2xl bg-white/5 border border-white/10 shadow-lg shadow-cyan-500/10 flex items-center justify-center">
                <Logo className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-black text-xl text-white">امید عدلی</h3>
                <p className="text-xs text-[#5ce1e6] font-medium">Performance Marketing & CRO Expert</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              <EditableText path="PERSONAL_INFO.bio" multiline>{personal.bio}</EditableText>
            </p>

            {/* Live Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span><EditableText path="PERSONAL_INFO.availability">{personal.availability}</EditableText></span>
            </div>
          </div>

          {/* Nav Links Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-bold text-sm text-white border-r-2 border-[#8b5cf6] pr-2">دسترسی سریع</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#5ce1e6] transition-colors">
                  صفحه اصلی
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-[#5ce1e6] transition-colors">
                  خدمات تخصصی
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('portfolio')} className="hover:text-[#5ce1e6] transition-colors">
                  نمونه‌کارها
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-[#5ce1e6] transition-colors">
                  درباره من
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('projects')} className="hover:text-[#5ce1e6] transition-colors">
                  پروژه‌ها
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="hover:text-[#5ce1e6] transition-colors">
                  آموزش
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="hover:text-[#5ce1e6] transition-colors">
                  محصولات
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-[#5ce1e6] transition-colors">
                  تماس
                </button>
              </li>
            </ul>
          </div>

          {/* Socials & Contact Chips */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-bold text-sm text-white border-r-2 border-[#4c8dff] pr-2">شبکه‌های اجتماعی و ارتباط مستقیم</h4>
            <div className="flex flex-wrap gap-2">
              <a
                href={personal.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-[#5ce1e6]/20 border border-white/10 hover:border-[#5ce1e6]/50 text-xs text-slate-200 transition-all flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-[#5ce1e6]" />
                <span>واتساپ</span>
              </a>

              <a
                href={personal.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-[#4c8dff]/20 border border-white/10 hover:border-[#4c8dff]/50 text-xs text-slate-200 transition-all flex items-center gap-1.5"
              >
                <Send className="w-4 h-4 text-[#5ce1e6]" />
                <span>تلگرام</span>
              </a>

              <a
                href={personal.linkedin}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-[#4c8dff]/20 border border-white/10 hover:border-[#4c8dff]/50 text-xs text-slate-200 transition-all flex items-center gap-1.5"
              >
                <Linkedin className="w-4 h-4 text-[#4c8dff]" />
                <span>لینکدین</span>
              </a>

              <a
                href={personal.instagram}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/50 text-xs text-slate-200 transition-all flex items-center gap-1.5"
              >
                <Instagram className="w-4 h-4 text-pink-400" />
                <span>اینستاگرام</span>
              </a>

              <a
                href={personal.xTwitter}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/50 text-xs text-slate-200 transition-all flex items-center gap-1.5"
              >
                <Twitter className="w-4 h-4 text-sky-400" />
                <span>توییتر / X</span>
              </a>

              <a
                href={`mailto:${personal.email}`}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-[#8b5cf6]/20 border border-white/10 hover:border-[#8b5cf6]/50 text-xs text-slate-200 transition-all flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4 text-[#8b5cf6]" />
                <span>ایمیل مستقیم</span>
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>ایمیل کاری:</span>
                <span className="font-mono text-xs text-white select-all">{personal.email}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>تماس / واتساپ:</span>
                <span className="font-mono text-xs text-emerald-400 select-all">{personal.phoneFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright + Scroll to top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} Omid Adli. تمامی حقوق محفوظ است.</span>
          </div>

          <button
            onClick={scrollToTop}
            className="p-3 rounded-2xl bg-white/10 hover:bg-gradient-to-r hover:from-[#1d4ed8] hover:to-[#3b82f6] text-white transition-all duration-300 shadow-lg flex items-center gap-2 group cursor-pointer"
          >
            <span>بازگشت به بالا</span>
            <ArrowUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
};
