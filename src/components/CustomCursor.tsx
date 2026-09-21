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
      setIsHovered(Boolean(t?.closest('a, button, input, textarea, select, [role="button"], [data-hover]')));
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
      raf = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    raf = requestAnimationFrame(render);

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
    <div className="fixed inset-0 z-[90] pointer-events-none mix-blend-multiply" aria-hidden>
      <div
        ref={dotRef}
        className="absolute top-0 left-0 rounded-full transition-[width,height,opacity] duration-200"
        style={{
          width: isHovered ? 10 : 7,
          height: isHovered ? 10 : 7,
          background: '#17171c',
          opacity: isVisible ? 1 : 0,
        }}
      />
      <div
        ref={ringRef}
        className="absolute top-0 left-0 rounded-full border transition-[width,height,border-color,opacity] duration-300"
        style={{
          width: isHovered ? 46 : 30,
          height: isHovered ? 46 : 30,
          borderColor: isHovered ? 'rgba(79,70,229,0.55)' : 'rgba(23,23,28,0.22)',
          borderWidth: 1.5,
          opacity: isVisible ? 1 : 0,
        }}
      />
    </div>
  );
};
