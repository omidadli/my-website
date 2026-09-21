import React from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import { useContent } from '../../context/ContentContext';

interface RepeaterControlsProps {
  arrayPath: string;
  index: number;
  totalCount: number;
  className?: string;
  templateItem?: any;
}

export const RepeaterControls: React.FC<RepeaterControlsProps> = ({
  arrayPath,
  index,
  totalCount,
  className = '',
  templateItem
}) => {
  const { isAdmin, addItem, removeItem, moveItem } = useContent();

  if (!isAdmin) return null;

  return (
    <div
      className={`z-40 flex items-center gap-1 bg-[#120a38] border border-amber-400/80 text-white rounded-full p-1 shadow-xl opacity-90 hover:opacity-100 transition-all ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Move Up */}
      {index > 0 && (
        <button
          type="button"
          onClick={() => moveItem(arrayPath, index, index - 1)}
          title="انتقال به بالا"
          className="p-1 rounded-full hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Move Down */}
      {index < totalCount - 1 && (
        <button
          type="button"
          onClick={() => moveItem(arrayPath, index, index + 1)}
          title="انتقال به پایین"
          className="p-1 rounded-full hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Add Item */}
      <button
        type="button"
        onClick={() => addItem(arrayPath, templateItem)}
        title="افزودن آیتم جدید"
        className="p-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Delete Item */}
      {totalCount > 1 && (
        <button
          type="button"
          onClick={() => {
            if (confirm('آیا از حذف این آیتم اطمینان دارید؟')) {
              removeItem(arrayPath, index);
            }
          }}
          title="حذف این آیتم"
          className="p-1 rounded-full bg-rose-500 hover:bg-rose-400 text-white transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
