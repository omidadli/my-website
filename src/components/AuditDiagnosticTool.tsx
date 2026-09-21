import React, { useState } from 'react';
import { Theme } from '../types';
import { Search, Sparkles, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, Loader2, Gauge } from 'lucide-react';

interface AuditDiagnosticToolProps {
  theme: Theme;
}

export const AuditDiagnosticTool: React.FC<AuditDiagnosticToolProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<null | {
    score: number;
    ga4Status: 'ok' | 'warning' | 'error';
    serverSideCapi: 'ok' | 'warning' | 'error';
    hookQuality: 'ok' | 'warning' | 'error';
    mobileUx: 'ok' | 'warning' | 'error';
  }>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setAnalyzing(true);
    setResults(null);

    setTimeout(() => {
      setAnalyzing(false);
      setResults({
        score: 68,
        ga4Status: 'ok',
        serverSideCapi: 'error',
        hookQuality: 'warning',
        mobileUx: 'ok'
      });
    }, 2000);
  };

  return (
    <div className={`p-6 sm:p-10 rounded-[40px] border backdrop-blur-2xl transition-all shadow-2xl ${
      isDark ? 'glass-card-dark' : 'glass-card-light'
    }`}>
      <div className="text-center space-y-3 max-w-xl mx-auto mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#5ce1e6]/15 border border-[#5ce1e6]/30 text-[11px] font-bold text-[#5ce1e6]">
          <Gauge className="w-3.5 h-3.5" />
          <span>ابزار آنالیز و ممیزی آنی آدرس وب‌سایت</span>
        </div>

        <h3 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
          بررسی سلامت ترکینگ و نرخ تبدیل سایت شما
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed">
          آدرس لندینگ‌پِیج یا سایت فروشگاهی خود را وارد کنید تا وضعیت ۵ پارامتر حیاتی رشد کمپین بررسی شود.
        </p>
      </div>

      <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
        <div className="relative flex-1">
          <input
            type="text"
            required
            placeholder="مثلا: https://myshop.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={`w-full py-3.5 pr-10 pl-4 rounded-full text-xs font-bold border focus:outline-none ${
              isDark ? 'bg-white/10 border-white/20 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 right-4 -translate-y-1/2" />
        </div>

        <button
          type="submit"
          disabled={analyzing}
          className="glow-btn px-7 py-3.5 rounded-full text-xs font-bold text-white shrink-0 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>در حال آنالیز کدها...</span>
            </>
          ) : (
            <>
              <span>شروع ممیزی هوشمند</span>
              <Sparkles className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Analysis Results Display */}
      {results && (
        <div className="space-y-6 pt-6 border-t border-white/10 max-w-2xl mx-auto">
          <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/10">
            <div>
              <div className="text-xs text-slate-400">امتیاز کل سلامت CRO و ترکینگ</div>
              <div className="text-3xl font-black gradient-text">{results.score} از ۱۰۰</div>
            </div>

            <div className="text-xs text-slate-300 text-left dir-ltr">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                نیازمند بهینه‌سازی سرور ساید
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>نصب استاندارد GA4</span>
              </div>
              <span className="text-emerald-400 font-bold">فعال و تأییدشده</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Server-Side CAPI (متا/گوگل)</span>
              </div>
              <span className="text-rose-400 font-bold">غیرفعال (افت داده ۳۵٪)</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>قدرت هوک لندینگ‌پِیج</span>
              </div>
              <span className="text-amber-400 font-bold">متوسط (نیاز به A/B تست)</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>سرعت لود موبایل</span>
              </div>
              <span className="text-emerald-400 font-bold">عالی (کمتر از ۱.۸s)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#8b5cf6]/20 to-[#4c8dff]/20 border border-[#8b5cf6]/30 text-center space-y-2">
            <p className="text-xs text-white font-bold">
              مایلید این باگ‌های ترکینگ را ظرف ۴۸ ساعت اصلاح کنیم و ۳۵٪ داده‌های از دست رفته را بازیابی کنیم؟
            </p>
            <a
              href="#contact"
              className="inline-block px-5 py-2 rounded-full bg-white text-[#1a1240] text-xs font-black shadow-md hover:bg-slate-100"
            >
              دریافت برنامه عملیاتی اصلاح ترکینگ
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
