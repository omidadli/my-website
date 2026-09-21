import React from 'react';
import { motion } from 'motion/react';
import { Theme, Page } from '../types';
import { Home, Briefcase, GraduationCap, Package, PhoneCall } from 'lucide-react';

interface QuickActionDockProps {
  theme: Theme;
  currentPage?: Page;
  onNavigate: (page: Page) => void;
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'services',
    label: 'خدمات تخصصی',
    icon: Briefcase,
    gradient: 'from-[#06b6d4] via-[#3b82f6] to-[#6366f1]',
    glowColor: 'rgba(59, 130, 246, 0.6)',
  },
  {
    id: 'products',
    label: 'محصولات',
    icon: Package,
    gradient: 'from-[#10b981] via-[#059669] to-[#047857]',
    glowColor: 'rgba(16, 185, 129, 0.6)',
  },
  {
    id: 'home',
    label: 'خانه',
    icon: Home,
    gradient: 'from-[#6366f1] via-[#8b5cf6] to-[#a855f7]',
    glowColor: 'rgba(139, 92, 246, 0.6)',
  },
  {
    id: 'blog',
    label: 'آموزش',
    icon: GraduationCap,
    gradient: 'from-[#f59e0b] via-[#f97316] to-[#ef4444]',
    glowColor: 'rgba(249, 115, 22, 0.6)',
  },
  {
    id: 'contact',
    label: 'تماس',
    icon: PhoneCall,
    gradient: 'from-[#ec4899] via-[#d946ef] to-[#8b5cf6]',
    glowColor: 'rgba(217, 70, 239, 0.6)',
  },
];

export const QuickActionDock: React.FC<QuickActionDockProps> = ({ theme, currentPage = 'home', onNavigate }) => {
  const isDark = theme === 'dark';

  // Normalize current page to one of the 5 main navigation tabs if possible
  const activeTabId: Page = (() => {
    if (currentPage === 'blog') return 'blog';
    if (currentPage === 'services' || currentPage === 'portfolio') return 'services';
    if (currentPage === 'products' || currentPage === 'projects') return 'products';
    if (currentPage === 'contact') return 'contact';
    return 'home';
  })();

  return (
    <div 
      id="meniscus-bottom-nav" 
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[96%] sm:w-auto pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div 
        className={`relative px-3 sm:px-5 pt-2.5 pb-2.5 sm:pb-3 rounded-t-2xl sm:rounded-t-3xl border-t border-x border-b-0 backdrop-blur-2xl transition-all duration-300 flex items-center justify-between gap-1.5 sm:gap-4 select-none ${
          isDark 
            ? 'glass-card-dark bg-white/[0.07] border-white/20 shadow-[0_-12px_40px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.2)]' 
            : 'glass-card-light bg-white/70 border-white/80 shadow-[0_-10px_30px_rgba(76,141,255,0.15),inset_0_1px_2px_rgba(255,255,255,0.8)]'
        }`}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTabId === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex flex-col items-center justify-center pt-1.5 pb-1 px-2.5 sm:px-4 rounded-xl transition-all duration-200 group cursor-pointer focus:outline-none"
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={item.label}
            >
              {/* Active Sliding Floating Bead (The Meniscus Bubble) */}
              {isActive && (
                <motion.div
                  layoutId="meniscus-active-bead"
                  className={`absolute -top-4 sm:-top-5 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr ${item.gradient} flex items-center justify-center border-2 border-white/60 shadow-2xl`}
                  style={{
                    boxShadow: `0 8px 26px ${item.glowColor}, inset 0 2px 6px rgba(255,255,255,0.6)`,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 480,
                    damping: 28,
                  }}
                >
                  {/* Glowing pulse ring */}
                  <div 
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ backgroundColor: item.glowColor }}
                  />
                  <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white stroke-[2.5] drop-shadow-md" />
                </motion.div>
              )}

              {/* Inactive Icon Placeholder space / Icon */}
              <div className="h-6 flex items-center justify-center">
                {!isActive ? (
                  <Icon className={`w-5 h-5 transition-all duration-200 group-hover:scale-115 ${
                    isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-black'
                  }`} />
                ) : (
                  // Invisible spacer maintaining button height when bead is elevated
                  <div className="w-5 h-5 opacity-0" />
                )}
              </div>

              {/* Label with high legibility */}
              <span
                className={`text-[11px] sm:text-xs font-bold mt-1.5 tracking-normal transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? isDark 
                      ? 'text-white font-extrabold scale-105 drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]' 
                      : 'text-slate-950 font-extrabold scale-105'
                    : isDark 
                      ? 'text-slate-300 group-hover:text-white font-semibold' 
                      : 'text-slate-700 group-hover:text-slate-950 font-semibold'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

