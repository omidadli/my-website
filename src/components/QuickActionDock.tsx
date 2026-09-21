import React from 'react';
import { Page, Theme } from '../types';
import { Home, Briefcase, Package, GraduationCap, Phone } from 'lucide-react';

interface QuickActionDockProps {
  theme: Theme;
  currentPage?: Page;
  onNavigate: (page: Page) => void;
}

const ITEMS: { page: Page; label: string; icon: React.FC<{ className?: string }> }[] = [
  { page: 'home', label: 'خانه', icon: Home },
  { page: 'services', label: 'خدمات تخصصی', icon: Briefcase },
  { page: 'products', label: 'محصولات', icon: Package },
  { page: 'blog', label: 'آموزش', icon: GraduationCap },
  { page: 'contact', label: 'تماس', icon: Phone },
];

/**
 * Bottom navigation dock — the beloved raised-active-item bar,
 * rebuilt on the ND glass system so it belongs to both themes.
 */
export const QuickActionDock: React.FC<QuickActionDockProps> = ({ currentPage = 'home', onNavigate }) => {
  return (
    <nav
      aria-label="ناوبری پایین"
      className="fixed bottom-4 sm:bottom-6 inset-x-0 z-40 flex justify-center px-3 pointer-events-none"
    >
      <div className="nd-glass pointer-events-auto rounded-[26px] px-2.5 py-2 flex items-end gap-0.5 sm:gap-1 shadow-[var(--nd-shadow-md)]">
        {ITEMS.map((item) => {
          const active = currentPage === item.page;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              aria-current={active ? 'page' : undefined}
              className="relative flex flex-col items-center gap-1 w-14 sm:w-16 pt-1.5 pb-1 rounded-2xl cursor-pointer group"
            >
              <span
                className={`grid place-items-center rounded-full transition-all duration-300 ease-out ${
                  active
                    ? 'w-11 h-11 -mt-6 text-white shadow-[0_10px_26px_-6px_rgba(99,102,241,0.65)] ring-4 ring-[color:var(--nd-bg)]'
                    : 'w-9 h-9 text-[color:var(--nd-muted)] group-hover:text-[color:var(--nd-ink)] group-hover:-translate-y-0.5'
                }`}
                style={active ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : undefined}
              >
                <item.icon className="w-5 h-5" />
              </span>
              <span
                className={`text-[9.5px] font-extrabold transition-colors ${
                  active ? 'text-[color:var(--nd-accent)]' : 'text-[color:var(--nd-faint)] group-hover:text-[color:var(--nd-ink-2)]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
