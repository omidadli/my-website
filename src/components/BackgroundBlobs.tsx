import React, { useEffect, useState } from 'react';
import { Theme } from '../types';

interface BackgroundBlobsProps {
  theme: Theme;
}

export const BackgroundBlobs: React.FC<BackgroundBlobsProps> = () => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized percentage coordinates
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#0a0624]">
      {/* Interactive Spotlight Beam following Mouse */}
      <div
        className="absolute inset-0 transition-opacity duration-700 opacity-70"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}% ${mousePos.y}%, rgba(92, 225, 230, 0.12), rgba(76, 141, 255, 0.06) 40%, transparent 80%)`,
        }}
      />

      {/* Primary Cinematic Radial Orbs */}
      <div 
        className="absolute -top-32 right-[10%] w-[650px] h-[650px] rounded-full blur-[140px] opacity-60 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, rgba(15, 10, 46, 0) 70%)' }}
      />
      
      <div 
        className="absolute top-[30%] -left-32 w-[700px] h-[700px] rounded-full blur-[150px] opacity-50 animate-pulse-glow"
        style={{ 
          background: 'radial-gradient(circle, rgba(76, 141, 255, 0.45) 0%, rgba(15, 10, 46, 0) 70%)',
          animationDelay: '2s' 
        }}
      />

      <div 
        className="absolute top-[65%] -right-20 w-[600px] h-[600px] rounded-full blur-[140px] opacity-55 animate-pulse-glow"
        style={{ 
          background: 'radial-gradient(circle, rgba(92, 225, 230, 0.35) 0%, rgba(15, 10, 46, 0) 70%)',
          animationDelay: '4s'
        }}
      />

      <div 
        className="absolute bottom-[-150px] left-[25%] w-[750px] h-[750px] rounded-full blur-[160px] opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, rgba(15, 10, 46, 0) 70%)' }}
      />
      
      {/* High-Tech Cyber Grid overlay with spotlight mask */}
      <div 
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          maskImage: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, black 20%, transparent 80%)`,
          WebkitMaskImage: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, black 20%, transparent 80%)`,
        }}
      />

      {/* Subtle Horizontal Scanlines / Ambient Gradient Lines */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.015] to-transparent pointer-events-none" />
    </div>
  );
};
