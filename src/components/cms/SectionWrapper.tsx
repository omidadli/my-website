import React from 'react';
import { Eye, EyeOff, ChevronUp, ChevronDown, Layers, Trash2 } from 'lucide-react';
import { useContent } from '../../context/ContentContext';

interface SectionWrapperProps {
  pageKey: string;
  sectionName: string;
  children: React.ReactNode;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  pageKey,
  sectionName,
  children
}) => {
  const { data, isAdmin, toggleSectionVisibility, reorderPageSection, removePageSection } = useContent();

  const sectionsList = data.PAGE_SECTIONS[pageKey] || [];
  const sectionIndex = sectionsList.findIndex((s) => s.name === sectionName);
  const sectionItem = sectionsList[sectionIndex];

  // If section is not configured or is hidden for non-admin, hide it
  if (sectionItem && sectionItem.isHidden && !isAdmin) {
    return null;
  }

  if (!isAdmin || !sectionItem) {
    return <>{children}</>;
  }

  const isFirst = sectionIndex === 0;
  const isLast = sectionIndex === sectionsList.length - 1;

  return (
    <div
      className={`relative rounded-3xl transition-all duration-300 ${
        sectionItem.isHidden ? 'opacity-60 border-2 border-dashed border-rose-500/50 p-2 my-4 bg-rose-950/20' : ''
      }`}
    >
      {/* Admin Control Bar for Section */}
      <div className="z-30 mb-2 flex flex-wrap items-center justify-between gap-2 bg-[#120a38]/90 border border-[#8b5cf6]/40 rounded-2xl px-4 py-2 text-xs text-white shadow-xl backdrop-blur-md dir-rtl font-sans">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-amber-300">سکشن: {sectionItem.label || sectionName}</span>
          {sectionItem.isHidden ? (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 font-extrabold text-[10px] border border-rose-500/40">
              مخفی در دید کاربران
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/40">
              نمایان
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => reorderPageSection(pageKey, sectionIndex, sectionIndex - 1)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="انتقال به بالا"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={isLast}
            onClick={() => reorderPageSection(pageKey, sectionIndex, sectionIndex + 1)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="انتقال به پایین"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => toggleSectionVisibility(pageKey, sectionItem.id)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
              sectionItem.isHidden
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/40'
            }`}
          >
            {sectionItem.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{sectionItem.isHidden ? 'نمایش سکشن' : 'مخفی کردن'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm(`آیا از حذف سکشن "${sectionItem.label}" مطمئن هستید؟`)) {
                removePageSection(pageKey, sectionItem.id);
              }
            }}
            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-all cursor-pointer"
            title="حذف سکشن"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {children}
    </div>
  );
};
