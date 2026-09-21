import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { PERSONAL_INFO } from '../data/content';

interface SplashScreenProps {
  onComplete?: () => void;
  autoDismissTime?: number; // ms, default 1800ms
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  autoDismissTime = 1800,
}) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('در حال مقداردهی اولیه سیستم...');
  const [isDismissing, setIsDismissing] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handleSkip = () => {
    setIsDismissing(true);
    setTimeout(() => {
      if (onCompleteRef.current) onCompleteRef.current();
    }, 300);
  };

  // Counter & status messages simulation
  useEffect(() => {
    const startTime = Date.now();
    const duration = Math.max(800, autoDismissTime - 300);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(currentProgress);

      if (currentProgress < 25) {
        setStatusText('در حال لود هسته معماری و الگوریتم‌ها...');
      } else if (currentProgress < 55) {
        setStatusText('بارگذاری مدل‌های ترکینگ و سناریوهای رشد...');
      } else if (currentProgress < 85) {
        setStatusText('همگام‌سازی جلوه‌های دیداری و داشبوردها...');
      } else if (currentProgress < 100) {
        setStatusText('تکمیل سیستم و آماده‌سازی نهایی...');
      } else {
        setStatusText('خوش آمدید!');
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsDismissing(true);
          setTimeout(() => {
            if (onCompleteRef.current) onCompleteRef.current();
          }, 400);
        }, 150);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [autoDismissTime]);

  return (
    <AnimatePresence>
      {!isDismissing && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleSkip}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#07041a] text-white overflow-hidden select-none cursor-pointer"
        >
          {/* Cyber Scanning Laser Line */}
          <motion.div
            initial={{ top: '-10%' }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#5ce1e6] to-transparent opacity-40 shadow-[0_0_15px_#5ce1e6]"
          />

          {/* Deep Ambient Cosmic Glow Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#2563eb]/30 via-[#8b5cf6]/20 to-[#5ce1e6]/30 blur-[130px] animate-pulse" />
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
                backgroundSize: '32px 32px'
              }}
            />
          </div>

          {/* MAIN MOTION GRAPHIC LOGO CONTAINER */}
          <div className="relative z-10 flex flex-col items-center justify-center max-w-sm w-full px-6">
            
            {/* Outer Energy Aura & Wavefront */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-8">
              {/* Expanding Wavefront Ring 1 */}
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.5, 1.4], opacity: [0.8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                className="absolute inset-0 rounded-full border border-[#5ce1e6]/40 pointer-events-none"
              />

              {/* Expanding Wavefront Ring 2 */}
              <motion.div
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.5, 1.8], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 1 }}
                className="absolute inset-0 rounded-full border border-[#4c8dff]/30 pointer-events-none"
              />

              {/* Central Glowing Backplate */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-2 rounded-3xl bg-gradient-to-tr from-[#1a103c] to-[#0d0726] border border-cyan-500/30 shadow-[0_0_40px_rgba(92,225,230,0.3)] flex items-center justify-center"
              />

              {/* Animated SVG Motion Graphic Logo */}
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_0_18px_rgba(92,225,230,0.7)]"
              >
                <defs>
                  <linearGradient id="splashLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5ce1e6" />
                    <stop offset="50%" stopColor="#4c8dff" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>

                <g stroke="url(#splashLogoGrad)">
                  {/* Step 1: Center Target Dot (Pulse In) */}
                  <motion.circle
                    cx="36"
                    cy="64"
                    r="4.5"
                    fill="url(#splashLogoGrad)"
                    stroke="none"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.5, 1], opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />

                  {/* Step 2: Inner Target Circle (Stroke Draw) */}
                  <motion.circle
                    cx="36"
                    cy="64"
                    r="15"
                    strokeWidth="4.5"
                    fill="none"
                    initial={{ pathLength: 0, rotate: -90, opacity: 0 }}
                    animate={{ pathLength: 1, rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                  />

                  {/* Step 3: Outer Target Circle (Stroke Draw) */}
                  <motion.circle
                    cx="36"
                    cy="64"
                    r="26"
                    strokeWidth="5"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.7, ease: 'easeInOut' }}
                  />

                  {/* Step 4: Growth Arrow Shaft (Shoot out) */}
                  <motion.line
                    x1="36"
                    y1="64"
                    x2="70"
                    y2="30"
                    strokeWidth="5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.2, ease: 'easeOut' }}
                  />

                  {/* Step 5: Arrow Head (Snap In) */}
                  <motion.polygon
                    points="90,10 66,22 78,34"
                    fill="url(#splashLogoGrad)"
                    stroke="none"
                    initial={{ scale: 0, opacity: 0, y: 10, x: -10 }}
                    animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.6, type: 'spring', stiffness: 200 }}
                  />

                  {/* Step 6: Letter 'A' (Path Draw) */}
                  <motion.path
                    d="M 74 40 L 58 90 M 74 40 L 90 90 M 63 74 H 85"
                    strokeWidth="5.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 1.8, ease: 'easeInOut' }}
                  />
                </g>
              </svg>
            </div>

            {/* BRAND NAME WITH TYPOGRAPHIC MOTION */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-center space-y-2 mb-8"
            >
              <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-[#5ce1e6] to-[#4c8dff]">
                {PERSONAL_INFO.name}
              </h1>
              <div className="flex items-center justify-center gap-2 text-xs text-cyan-300/80 font-medium tracking-widest dir-rtl">
                <Sparkles className="w-3.5 h-3.5 text-[#5ce1e6] animate-spin" style={{ animationDuration: '4s' }} />
                <span>تحلیلگر داده & بهینه‌ساز کسب‌وکار</span>
              </div>
            </motion.div>

            {/* HIGH-TECH PROGRESS BAR & COUNTER */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-sans text-[11px] truncate max-w-[220px]">
                  {statusText}
                </span>
                <span className="text-[#5ce1e6] font-bold dir-ltr">
                  {progress}%
                </span>
              </div>

              {/* Outer Progress Track */}
              <div className="relative w-full h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden shadow-inner">
                {/* Animated Gradient Bar */}
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#2563eb] via-[#4c8dff] to-[#5ce1e6] shadow-[0_0_12px_#5ce1e6]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
