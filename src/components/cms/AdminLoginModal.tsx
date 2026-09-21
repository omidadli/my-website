import React, { useState } from 'react';
import { Lock, Key, X, Check, ShieldAlert } from 'lucide-react';
import { useContent } from '../../context/ContentContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { loginAdmin } = useContent();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(pin);
    if (success) {
      setError(false);
      setPin('');
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-right dir-rtl">
      <div className="bg-[#0e072b] border-2 border-[#8b5cf6] rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[0_0_60px_rgba(139,92,246,0.4)] text-white space-y-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#8b5cf6]/30 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8b5cf6] to-[#5ce1e6] text-slate-950">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">ورود به حالت ویرایش</h3>
              <p className="text-xs text-slate-400">سیستم مدیریت محتوای زنده (CMS)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              رمز عبور / پین کد ادمین را وارد کنید:
            </label>
            <div className="relative">
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="رمز عبور پیش‌فرض: 1234"
                className="w-full bg-[#050214] border-2 border-white/20 focus:border-[#5ce1e6] rounded-2xl px-4 py-3 text-center tracking-widest text-lg text-white focus:outline-none transition-colors"
                autoFocus
              />
              <Key className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
            {error && (
              <p className="text-xs text-rose-400 font-bold mt-2 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
                <span>رمز عبور اشتباه است (پین کد پیش‌فرض: 1234)</span>
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#4c8dff] hover:opacity-90 text-xs font-black text-white shadow-xl flex items-center justify-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>ورود ادمین</span>
            </button>
          </div>
        </form>

        <p className="text-[11px] text-center text-slate-400 border-t border-white/10 pt-3">
          💡 رمز عبور پیش‌فرض ادمین: <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300 font-mono">1234</code>
        </p>
      </div>
    </div>
  );
};
