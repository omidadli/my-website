import React, { useState } from 'react';
import { Theme } from '../types';
import { Sparkles, ArrowLeft, ArrowRight, Eye, MousePointer, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ABTestComparisonProps {
  theme: Theme;
}

export const ABTestComparison: React.FC<ABTestComparisonProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('B');

  return (
    <div className={`p-6 sm:p-8 rounded-[36px] border transition-all ${
      isDark ? 'glass-card-dark' : 'glass-card-light'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5ce1e6]/15 border border-[#5ce1e6]/30 text-[11px] font-bold text-[#5ce1e6] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مقایسه تصویری A/B تست تعاملی</span>
          </div>
          <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
            نمونه بازطراحی لندینگ‌پِیج و افزایش نرخ تبدیل
          </h3>
        </div>

        {/* Toggle Pills */}
        <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-full border border-white/10">
          <button
            onClick={() => setActiveVariant('A')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeVariant === 'A'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ورژن اولیه (کنترل) - CR: 1.2%
          </button>
          <button
            onClick={() => setActiveVariant('B')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeVariant === 'B'
                ? 'bg-gradient-to-r from-[#8b5cf6] to-[#4c8dff] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ورژن بهینه‌شده CRO - CR: 4.8% (+۳۰۰٪)
          </button>
        </div>
      </div>

      {/* Visual Preview Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-[#0f0a2e] p-6 text-right">
        {activeVariant === 'A' ? (
          <div className="space-y-6 opacity-75 grayscale-[30%]">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs">
              <span className="font-bold text-rose-400">مشکلات نسخه اولیه:</span> تیتر گنگ بدون هوک ارزش پیشنهاد، عدم وجود تایمر تخفیف، دکمه CTA محو در انتهای صفحه، عدم وجود تأییدیه‌های مشتریان.
            </div>

            <div className="space-y-3 max-w-md mx-auto text-center py-6">
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded">نسخه قدیمی</span>
              <h4 className="text-xl font-bold text-slate-200">بهترین خدمات دیجیتال مارکتینگ را از ما بخواهید</h4>
              <p className="text-xs text-slate-400">ما با ارائه راهکارهای خلاقانه به رشد کسب‌وکار شما کمک می‌کنیم.</p>
              <button className="px-6 py-2.5 rounded bg-slate-600 text-slate-300 text-xs font-bold">
                ارسال پیام
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-[10px] text-slate-500 pt-4 border-t border-slate-800">
              <div>نرخ کلیک (CTR): 2.1%</div>
              <div>نرخ خروج (Bounce): 78%</div>
              <div>نرخ تبدیل (CR): 1.2%</div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>
                <strong>اصلاحات پیاده‌شده CRO:</strong> افزودن تیتر با ساختار پیشنهادی ارزش (Value Proposition)، تایمر تخفیف پویا، دکمه CTA درخشان با میکرواسکریپت اطمینان‌بخش و Social Proof واقعی.
              </span>
            </div>

            <div className="space-y-4 max-w-lg mx-auto text-center py-4 bg-gradient-to-b from-white/5 to-transparent p-6 rounded-3xl border border-white/10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#8b5cf6] text-[10px] font-bold">
                🔥 تضمین بازگشت وجه تا ۱۴ روز • همراه با ممیزی رایگان
              </div>

              <h4 className="text-2xl font-black text-white leading-tight">
                فروش فروشگاه اینترنتی خود را ظرف ۳۰ روز <span className="gradient-text">حداقل ۲ برابر</span> کنید
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                فرمول پیاده‌سازی سرور ساید ترکینگ و کمپین‌های هوشمند گوگل‌ادز ویژه فروشگاه‌های اینترنتی (E-commerce).
              </p>

              <div className="pt-2">
                <button className="glow-btn px-8 py-3.5 rounded-full text-xs font-bold text-white shadow-xl flex items-center justify-center gap-2 mx-auto">
                  <MousePointer className="w-4 h-4 animate-bounce" />
                  <span>دریافت ممیزی رایگان لندینگ‌پِیج</span>
                </button>
                <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>بدون نیاز به کارت اعتباری • لغو در هر زمان</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs font-bold pt-4 border-t border-white/10 text-white">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 mb-1">نرخ کلیک (CTR)</div>
                <div className="text-[#5ce1e6] font-black">6.8% (+۲۲۳٪)</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 mb-1">نرخ خروج (Bounce)</div>
                <div className="text-emerald-400 font-black">32% (-۵۸٪)</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 mb-1">نرخ تبدیل نهایی (CR)</div>
                <div className="text-[#8b5cf6] font-black">4.8% (+۳۰۰٪)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
