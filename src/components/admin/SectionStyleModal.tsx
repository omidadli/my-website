import React, { useState } from 'react';
import { Palette, X, Check, LayoutGrid, AlignLeft, ShieldAlert } from 'lucide-react';
import { useContent } from '../../context/ContentContext';

interface SectionStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageKey: string;
  sectionId: string;
  sectionLabel: string;
  initialStyle?: Record<string, any>;
}

export const SectionStyleModal: React.FC<SectionStyleModalProps> = ({
  isOpen,
  onClose,
  pageKey,
  sectionId,
  sectionLabel,
  initialStyle = {}
}) => {
  const { updateSectionStyle } = useContent();
  const styleObj: any = initialStyle || {};
  const [bgColor, setBgColor] = useState(styleObj.bgColor || '#120a38');
  const [bgGradient, setBgGradient] = useState(styleObj.bgGradient || '');
  const [padding, setPadding] = useState<'tight' | 'normal' | 'spacious'>(styleObj.padding || 'normal');
  const [columns, setColumns] = useState<number>(styleObj.columns || 3);
  const [direction, setDirection] = useState<'rtl' | 'ltr'>(styleObj.direction || 'rtl');

  if (!isOpen) return null;

  const handleSave = () => {
    updateSectionStyle(pageKey, sectionId, {
      bgColor,
      bgGradient,
      padding,
      columns,
      direction
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 dir-rtl text-right font-sans">
      <div className="bg-[#120a38] border-2 border-[#8b5cf6] rounded-3xl p-6 max-w-xl w-full shadow-[0_0_60px_rgba(139,92,246,0.3)] text-white space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#8b5cf6] text-white font-black shadow-lg">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">تنظیمات استایل و چیدمان سکشن (Elementor Style)</h3>
              <p className="text-xs text-amber-300 font-bold">سکشن: {sectionLabel}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Style Controls */}
        <div className="space-y-4 text-xs">
          {/* Background Color */}
          <div>
            <label className="text-slate-300 font-bold block mb-1">رنگ پس‌زمینه (Background Color):</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={bgColor.startsWith('#') ? bgColor : '#120a38'}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                placeholder="#120a38"
                className="flex-1 bg-[#0a0520] border border-white/20 rounded-xl p-2.5 font-mono text-white dir-ltr"
              />
            </div>
          </div>

          {/* Background Gradient */}
          <div>
            <label className="text-slate-300 font-bold block mb-1">گرادیان پس‌زمینه (CSS Gradient):</label>
            <input
              type="text"
              value={bgGradient}
              onChange={(e) => setBgGradient(e.target.value)}
              placeholder="linear-gradient(135deg, #120a38 0%, #0a0520 100%)"
              className="w-full bg-[#0a0520] border border-white/20 rounded-xl p-2.5 font-mono text-white text-xs dir-ltr"
            />
          </div>

          {/* Padding */}
          <div>
            <label className="text-slate-300 font-bold block mb-1">فاصله‌گذاری درونی (Padding):</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'tight', label: 'فشرده (Tight)' },
                { id: 'normal', label: 'استاندارد (Normal)' },
                { id: 'spacious', label: 'عریض (Spacious)' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPadding(p.id as any)}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    padding === p.id
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Columns */}
          <div>
            <label className="text-slate-300 font-bold block mb-1">تعداد ستون در شبکه گرید (Grid Columns):</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setColumns(col)}
                  className={`flex-1 py-2 rounded-xl font-bold border transition-all flex items-center justify-center gap-1 ${
                    columns === col
                      ? 'bg-[#8b5cf6] text-white border-[#8b5cf6] font-black shadow-lg'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{col} ستون</span>
                </button>
              ))}
            </div>
          </div>

          {/* Layout Direction */}
          <div>
            <label className="text-slate-300 font-bold block mb-1">جهت چیدمان (Direction):</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'rtl', label: 'راست به چپ (RTL - فارسی)' },
                { id: 'ltr', label: 'چپ به راست (LTR - انگلیسی)' }
              ].map((dir) => (
                <button
                  key={dir.id}
                  type="button"
                  onClick={() => setDirection(dir.id as any)}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    direction === dir.id
                      ? 'bg-[#5ce1e6] text-slate-950 border-[#5ce1e6] font-black'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {dir.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>ذخیره استایل سکشن</span>
          </button>
        </div>
      </div>
    </div>
  );
};
