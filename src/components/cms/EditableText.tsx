import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useContent, getByPath } from '../../context/ContentContext';

interface EditableTextProps {
  path: string;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'div';
  multiline?: boolean;
  children?: React.ReactNode;
  fallbackText?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({
  path,
  className = '',
  as: Component = 'span',
  multiline = false,
  children,
  fallbackText = ''
}) => {
  const { data, isAdmin, updateField } = useContent();
  const [isEditing, setIsEditing] = useState(false);

  const currentValue = getByPath(data, path) ?? fallbackText ?? (typeof children === 'string' ? children : '');
  const [tempValue, setTempValue] = useState<string>(String(currentValue));

  if (!isAdmin) {
    return <Component className={className}>{children || currentValue}</Component>;
  }

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateField(path, tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(String(currentValue));
    setIsEditing(false);
  };

  return (
    <span className="relative group/edit inline-block max-w-full">
      {isEditing ? (
        <span className="inline-flex flex-col gap-2 p-2 bg-[#120a38] border-2 border-[#8b5cf6] rounded-xl z-50 relative my-1 shadow-2xl text-white w-full min-w-[280px]">
          {multiline ? (
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full bg-[#0a0520] border border-white/20 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#5ce1e6] min-h-[100px] dir-rtl font-sans"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="w-full bg-[#0a0520] border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#5ce1e6] dir-rtl font-sans"
              autoFocus
            />
          )}

          <span className="flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={handleCancel}
              className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>انصراف</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold flex items-center gap-1 shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              <span>ثبت</span>
            </button>
          </span>
        </span>
      ) : (
        <span className="relative inline-block group/text hover:outline hover:outline-2 hover:outline-amber-400/80 hover:bg-amber-400/10 rounded px-1 transition-all">
          <Component className={className}>{children || currentValue}</Component>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setTempValue(String(currentValue));
              setIsEditing(true);
            }}
            title="ویرایش این متن"
            className="absolute -top-3 -right-3 z-40 bg-amber-400 text-slate-950 p-1 rounded-full shadow-lg opacity-0 group-hover/text:opacity-100 hover:scale-125 transition-all cursor-pointer flex items-center justify-center border border-slate-900"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </span>
      )}
    </span>
  );
};
