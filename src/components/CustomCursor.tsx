import React, { useEffect, useState, useRef } from 'react';

export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trail1Ref = useRef<HTMLDivElement>(null);
  const trail2Ref = useRef<HTMLDivElement>(null);

  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const trail1Pos = useRef({ x: -100, y: -100 });
  const trail2Pos = useRef({ x: -100, y: -100 });
  const isInitialized = useRef(false);

  const [isHovered, setIsHovered] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if device is touch or coarse pointer
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };

      if (!isInitialized.current) {
        currentPos.current = { x: e.clientX, y: e.clientY };
        trail1Pos.current = { x: e.clientX, y: e.clientY };
        trail2Pos.current = { x: e.clientX, y: e.clientY };
        isInitialized.current = true;
      }

      setIsVisible(true);

      // Check if hovering over clickable or interactive elements
      const target = e.target as HTMLElement;
      if (target) {
        const isClickable = Boolean(
          target.closest('a, button, input, textarea, select, [role="button"], .interactive-hover, [data-hover]')
        );
        setIsHovered(isClickable);
      }
    };

    const onMouseDown = () => setIsMouseDown(true);
    const onMouseUp = () => setIsMouseDown(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    // Ultra-smooth 60/120fps direct DOM animation loop without React state overhead
    const render = () => {
      const ease = 0.22; // Responsive lerp
      const trailEase1 = 0.14;
      const trailEase2 = 0.08;

      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * ease;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * ease;

      trail1Pos.current.x += (targetPos.current.x - trail1Pos.current.x) * trailEase1;
      trail1Pos.current.y += (targetPos.current.y - trail1Pos.current.y) * trailEase1;

      trail2Pos.current.x += (targetPos.current.x - trail2Pos.current.x) * trailEase2;
      trail2Pos.current.y += (targetPos.current.y - trail2Pos.current.y) * trailEase2;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetPos.current.x}px, ${targetPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      if (trail1Ref.current) {
        trail1Ref.current.style.transform = `translate3d(${trail1Pos.current.x}px, ${trail1Pos.current.y}px, 0) translate(-50%, -50%)`;
      }

      if (trail2Ref.current) {
        trail2Ref.current.style.transform = `translate3d(${trail2Pos.current.x}px, ${trail2Pos.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (isTouchDevice) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[99999] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Trailing Liquid Glass Droplet 2 (Smallest soft trail) */}
      {!isHovered && (
        <div
          ref={trail2Ref}
          className="fixed top-0 left-0 w-2.5 h-2.5 rounded-full pointer-events-none bg-cyan-400/20 backdrop-blur-[2px] border border-cyan-300/30 shadow-[0_0_8px_rgba(92,225,230,0.3)] transition-opacity duration-200"
          style={{ willChange: 'transform' }}
        />
      )}

      {/* Trailing Liquid Glass Droplet 1 (Medium droplet with glass specular highlight) */}
      {!isHovered && (
        <div
          ref={trail1Ref}
          className="fixed top-0 left-0 w-4 h-4 rounded-full pointer-events-none bg-white/[0.08] backdrop-blur-sm border border-white/25 shadow-[0_0_12px_rgba(92,225,230,0.35),inset_0_1px_2px_rgba(255,255,255,0.6)] transition-opacity duration-200"
          style={{ willChange: 'transform' }}
        />
      )}

      {/* Main Glass Droplet Ring with Rotating Dashed Border */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full pointer-events-none transition-all duration-200 ease-out flex items-center justify-center ${
          isHovered
            ? 'w-7 h-7 bg-[#2563eb]/20 backdrop-blur-md border border-[#5ce1e6] shadow-[0_0_14px_rgba(92,225,230,0.6),inset_0_1px_2px_rgba(255,255,255,0.6)] scale-100'
            : isMouseDown
            ? 'w-6 h-6 bg-white/[0.12] backdrop-blur-md border border-cyan-400/60 shadow-[0_0_10px_rgba(92,225,230,0.4)] scale-90'
            : 'w-8 h-8 bg-white/[0.06] backdrop-blur-[4px] shadow-[0_0_15px_rgba(92,225,230,0.25),inset_0_1px_2px_rgba(255,255,255,0.4)] scale-100'
        }`}
        style={{
          willChange: 'transform',
        }}
      >
        {/* Spinning Dashed Ring (Only active when NOT hovered) */}
        {!isHovered && (
          <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/70 animate-spin" style={{ animationDuration: '6s' }} />
        )}
      </div>

      {/* Center Precision Dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 rounded-full pointer-events-none transition-all duration-150 ${
          isHovered
            ? 'w-1.5 h-1.5 bg-white shadow-[0_0_8px_#5ce1e6]'
            : 'w-1.5 h-1.5 bg-gradient-to-tr from-[#5ce1e6] to-[#4c8dff] shadow-[0_0_6px_#5ce1e6]'
        }`}
        style={{
          willChange: 'transform',
        }}
      />
    </div>
  );
};

