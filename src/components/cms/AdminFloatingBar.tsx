import React, { useRef, useState } from 'react';
import { Save, Download, Upload, RotateCcw, Lock, Edit3, CheckCircle, Sparkles } from 'lucide-react';
import { useContent } from '../../context/ContentContext';

export const AdminFloatingBar: React.FC = () => {
  const {
    isAdmin,
    logoutAdmin,
    resetToDefaults,
    exportJSON,
    importJSON,
    hasUnsavedChanges,
    saveChanges
  } = useContent();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    saveChanges();
    showToast('تمامی تغییرات با موفقیت ذخیره شدند! ✨');
  };

  const handleReset = () => {
    if (confirm('آیا از بازنشانی محتوا به داده‌های اولیه سایت اطمینان دارید؟ تمامی تغییرات دستی شما پاک خواهد شد.')) {
      resetToDefaults();
      showToast('محتوای سایت به حالت اولیه بازنشانی شد.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const success = importJSON(content);
          if (success) {
            showToast('فایل JSON با موفقیت بارگذاری و اعمال شد.');
          } else {
            alert('خطا در خواندن فایل JSON. لطفاً فرمت فایل را بررسی کنید.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] w-[95%] max-w-4xl dir-rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-extrabold px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-xs animate-bounce border border-emerald-300">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-[#0e072b]/95 backdrop-blur-xl border-2 border-[#8b5cf6] text-white rounded-2xl px-4 py-3 shadow-[0_0_50px_rgba(139,92,246,0.35)] flex flex-wrap items-center justify-between gap-3">
        {/* Status Badge */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-amber-400">
            <Edit3 className="w-4 h-4" />
            <span>حالت ویرایش زنده فعال است</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 scale-105 animate-pulse'
                : 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed]'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>ذخیره تغییرات</span>
          </button>

          {/* Export JSON */}
          <button
            type="button"
            onClick={exportJSON}
            title="دانلود نسخه پشتیبان از داده‌های ادیت‌شده"
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#5ce1e6]" />
            <span className="hidden sm:inline">خروجی JSON</span>
          </button>

          {/* Import JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="بارگذاری داده‌ها از فایل JSON"
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#8b5cf6]" />
            <span className="hidden sm:inline">ورود JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Reset button */}
          <button
            type="button"
            onClick={handleReset}
            title="بازنشانی به داده‌های اولیه"
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">بازنشانی</span>
          </button>

          {/* Exit Edit Mode */}
          <button
            type="button"
            onClick={logoutAdmin}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer ml-1"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>خروج از ویرایش</span>
          </button>
        </div>
      </div>
    </div>
  );
};
