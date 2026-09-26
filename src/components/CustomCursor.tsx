import React, { useEffect, useRef, useState } from 'react';

/**
 * Whisper-quiet cursor: an ink dot with a soft trailing ring.
 * Uses mix-blend-multiply so it stays elegant on the light canvas.
 */
export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    setEnabled(true);
    document.body.classList.add('custom-cursor-enabled');

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      setIsVisible(true);
      const t = e.target as HTMLElement | null;
      const isInput = Boolean(t?.closest('input, textarea'));
      if (isInput) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
        setIsHovered(Boolean(t?.closest('a, button, select, [role="button"], [data-hover]')));
      }
      if (!raf) raf = requestAnimationFrame(render);
    };
    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);

    const render = () => {
      ringPos.current.x += (targetPos.current.x - ringPos.current.x) * 0.16;
      ringPos.current.y += (targetPos.current.y - ringPos.current.y) * 0.16;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetPos.current.x}px, ${targetPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      const distance = Math.abs(targetPos.current.x - ringPos.current.x) + Math.abs(targetPos.current.y - ringPos.current.y);
      raf = distance > 0.2 ? requestAnimationFrame(render) : 0;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(raf);
      document.body.classList.remove('custom-cursor-enabled');
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none" aria-hidden>
      <div
        ref={dotRef}
        className="nd-cursor-dot absolute top-0 left-0 rounded-full transition-[width,height,opacity] duration-200"
        style={{
          width: isHovered ? 10 : 7,
          height: isHovered ? 10 : 7,
          background: '#38bdf8',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.8)',
          opacity: isVisible ? 1 : 0,
        }}
      />
      <div
        ref={ringRef}
        className={`nd-cursor-ring absolute top-0 left-0 rounded-full border transition-[width,height,border-color,opacity] duration-300 ${isHovered ? 'nd-cursor-ring-hover' : ''}`}
        style={{
          width: isHovered ? 46 : 30,
          height: isHovered ? 46 : 30,
          borderColor: isHovered ? 'rgba(56, 189, 248, 0.9)' : 'rgba(129, 140, 248, 0.65)',
          borderWidth: 1.5,
          opacity: isVisible ? 1 : 0,
        }}
      />
    </div>
  );
};
