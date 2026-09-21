import React, { useEffect, useState } from 'react';
import { Page, Theme } from '../types';
import { useContent } from '../context/ContentContext';
import { MessageCircle, Send, Phone, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickActionDockProps {
  theme: Theme;
  currentPage?: Page;
  onNavigate: (page: Page) => void;
}

/**
 * Floating glass dock — the four fastest ways to reach Omid, plus back-to-top.
 * Appears after the visitor scrolls past the hero.
 */
export const QuickActionDock: React.FC<QuickActionDockProps> = () => {
  const { data } = useContent();
  const personal = data.PERSONAL_INFO;
  const [visible, setVisible] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 320);
      setShowTop(window.scrollY > 900);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const actions = [
    { id: 'whatsapp', label: 'واتساپ', href: personal.whatsappUrl, icon: MessageCircle, color: '#0f9d6e' },
    { id: 'telegram', label: 'تلگرام', href: personal.telegramUrl, icon: Send, color: '#1d6fd8' },
    { id: 'phone', label: 'تماس تلفنی', href: `tel:${personal.phone}`, icon: Phone, color: '#4f46e5' },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40"
        >
          <div className="nd-glass rounded-full flex items-center gap-1 px-2 py-2 shadow-[var(--nd-shadow-md)]">
            {actions.map((a) => (
              <a
                key={a.id}
                href={a.href}
                target={a.id === 'phone' ? undefined : '_blank'}
                rel="noreferrer"
                title={a.label}
                aria-label={a.label}
                className="group relative w-11 h-11 rounded-full grid place-items-center transition-colors hover:bg-black/[0.05]"
              >
                <a.icon className="w-5 h-5" style={{ color: a.color }} />
                <span className="absolute -top-9 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity nd-chip bg-[color:var(--nd-ink)] text-white border-transparent whitespace-nowrap pointer-events-none">
                  {a.label}
                </span>
              </a>
            ))}
            <AnimatePresence>
              {showTop && (
                <motion.button
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 44 }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  title="بازگشت به بالا"
                  aria-label="بازگشت به بالا"
                  className="h-11 rounded-full grid place-items-center overflow-hidden hover:bg-black/[0.05] cursor-pointer"
                >
                  <ArrowUp className="w-5 h-5 text-[color:var(--nd-ink-2)]" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
