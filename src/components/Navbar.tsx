import React, { useState, useEffect } from 'react';
import { Page, Theme } from '../types';
import { useContent } from '../context/ContentContext';
import { Menu, X, ArrowUpLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  theme: Theme;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onReplaySplash?: () => void;
  onOpenAdminModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
}) => {
  const { data } = useContent();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const rawNavItems = data.NAVIGATION_MENU || [];
  const navItems = [...rawNavItems].sort((a, b) => a.order - b.order).filter((i) => !i.isHidden);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPage]);

  const go = (pageSlug: string) => {
    onNavigate(pageSlug as Page);
    setMobileOpen(false);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 pt-3 sm:pt-5">
      <div
        className={`max-w-6xl mx-auto nd-glass rounded-full transition-all duration-500 ${
          scrolled ? 'shadow-[var(--nd-shadow-md)]' : ''
        }`}
      >
        <div className="flex items-center gap-2 ps-2 pe-2 sm:ps-3 sm:pe-2.5 py-2">
          {/* Brand */}
          <button onClick={() => go('home')} className="flex items-center gap-2.5 shrink-0 cursor-pointer me-1 sm:me-3">
            <span className="w-9 h-9 rounded-xl grid place-items-center text-white font-black text-sm shadow-sm" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c6cf0)' }}>
              ع
            </span>
            <span className="hidden md:block text-right leading-tight">
              <span className="block text-[13px] font-black text-[color:var(--nd-ink)]">امید عدلی</span>
              <span className="block text-[9.5px] font-bold text-[color:var(--nd-faint)]">Performance Marketing & CRO</span>
            </span>
          </button>

          {/* Desktop links */}
          <nav className="hidden lg:flex items-center gap-0.5 mx-auto">
            {navItems.map((item) => {
              const active = currentPage === item.pageSlug;
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.pageSlug)}
                  className={`px-3.5 xl:px-4 py-2 rounded-full text-[12px] font-extrabold transition-all cursor-pointer ${
                    active
                      ? 'bg-[color:var(--nd-ink)] text-white shadow-sm'
                      : 'text-[color:var(--nd-muted)] hover:text-[color:var(--nd-ink)] hover:bg-black/[0.04]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <span className="flex-1 lg:hidden" />

          {/* CTA */}
          <button
            onClick={() => go('contact')}
            className="nd-btn nd-btn-accent hidden sm:inline-flex px-5 py-2.5 text-[12px] shrink-0"
          >
            <span>گفتگوی رایگان</span>
            <ArrowUpLeft className="w-3.5 h-3.5" />
          </button>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="منو"
            className="lg:hidden nd-btn nd-btn-ghost w-10 h-10 shrink-0"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden max-w-6xl mx-auto mt-2 nd-glass rounded-[28px] p-4 space-y-1"
          >
            {navItems.map((item) => {
              const active = currentPage === item.pageSlug;
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.pageSlug)}
                  className={`w-full text-right px-4 py-3 rounded-2xl text-sm font-extrabold transition-colors cursor-pointer ${
                    active ? 'bg-[color:var(--nd-ink)] text-white' : 'text-[color:var(--nd-ink-2)] hover:bg-black/[0.04]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button onClick={() => go('contact')} className="nd-btn nd-btn-accent w-full py-3.5 text-sm mt-2">
              <span>گفتگوی رایگان</span>
              <ArrowUpLeft className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
