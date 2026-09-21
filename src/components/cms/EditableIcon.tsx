import React, { useState } from 'react';
import {
  Pencil,
  X,
  Check,
  Rocket,
  Target,
  BarChart,
  Laptop,
  Award,
  User,
  Mail,
  Phone,
  Code,
  Sparkles,
  Megaphone,
  TrendingUp,
  Layers,
  Search,
  Star,
  MessageSquare,
  Briefcase,
  DollarSign,
  Globe,
  Shield,
  Activity,
  FileText,
  Zap,
  Cpu,
  Settings,
  Lock,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useContent, getByPath } from '../../context/ContentContext';

const AVAILABLE_ICONS: { [key: string]: React.FC<{ className?: string }> } = {
  rocket: Rocket,
  target: Target,
  chart: BarChart,
  laptop: Laptop,
  award: Award,
  user: User,
  mail: Mail,
  phone: Phone,
  code: Code,
  sparkles: Sparkles,
  megaphone: Megaphone,
  'trending-up': TrendingUp,
  layers: Layers,
  search: Search,
  star: Star,
  message: MessageSquare,
  briefcase: Briefcase,
  dollar: DollarSign,
  globe: Globe,
  shield: Shield,
  activity: Activity,
  file: FileText,
  zap: Zap,
  cpu: Cpu,
  settings: Settings,
  lock: Lock,
  calendar: Calendar
};

interface EditableIconProps {
  path: string;
  className?: string;
  children?: React.ReactNode;
  fallbackIconName?: string;
}

export const EditableIcon: React.FC<EditableIconProps> = ({
  path,
  className = '',
  children,
  fallbackIconName = 'rocket'
}) => {
  const { data, isAdmin, updateField } = useContent();
  const [isOpen, setIsOpen] = useState(false);

  const currentIconName = getByPath(data, path) || fallbackIconName;

  if (!isAdmin) {
    if (children) return <>{children}</>;
    const IconComp = AVAILABLE_ICONS[currentIconName] || Rocket;
    return <IconComp className={className} />;
  }

  const handleSelectIcon = (iconKey: string) => {
    updateField(path, iconKey);
    setIsOpen(false);
  };

  const IconComp = AVAILABLE_ICONS[currentIconName] || Rocket;

  return (
    <div className="relative group/icon inline-flex items-center justify-center">
      {children || <IconComp className={className} />}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(true);
        }}
        title="تغییر آیکون"
        className="absolute -top-2 -right-2 z-40 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg opacity-0 group-hover/icon:opacity-100 hover:scale-110 transition-all cursor-pointer border border-slate-900"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 text-right dir-rtl">
          <div className="bg-[#120a38] border-2 border-[#8b5cf6] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-lg flex items-center gap-2 text-amber-400">
                <Sparkles className="w-5 h-5" />
                <span>انتخاب آیکون</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
              {Object.keys(AVAILABLE_ICONS).map((iconKey) => {
                const ItemIcon = AVAILABLE_ICONS[iconKey];
                const isSelected = iconKey === currentIconName;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => handleSelectIcon(iconKey)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#8b5cf6] border-white text-white shadow-lg scale-105'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    <ItemIcon className="w-6 h-6 mb-1" />
                    <span className="text-[10px] truncate max-w-full">{iconKey}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
