import React from 'react';

interface BackgroundBlobsProps {
  theme?: 'dark' | 'light';
}

/**
 * Ambient atmosphere washes — pastel for the gallery (light) theme,
 * deep nebula glows for the midnight (dark) theme.
 */
export const BackgroundBlobs: React.FC<BackgroundBlobsProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Base wash */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={
          isDark
            ? { background: 'linear-gradient(180deg, #10101c 0%, rgba(11,11,18,0) 40%), linear-gradient(0deg, #0e1416 0%, rgba(11,11,18,0) 32%), var(--nd-bg)' }
            : { background: 'linear-gradient(180deg, #eef0ff 0%, rgba(246,246,244,0) 38%), linear-gradient(0deg, #f2f7f4 0%, rgba(246,246,244,0) 30%), var(--nd-bg)' }
        }
      />
      {isDark ? (
        <>
          <div className="nd-blob w-[46rem] h-[46rem] -top-56 -right-40 opacity-30" style={{ background: 'radial-gradient(circle at 40% 40%, rgba(99,91,255,0.5) 0%, transparent 65%)' }} />
          <div className="nd-blob w-[40rem] h-[40rem] top-24 -left-52 opacity-25" style={{ background: 'radial-gradient(circle at 55% 45%, rgba(56,189,248,0.4) 0%, transparent 65%)', animationDelay: '-8s' }} />
          <div className="nd-blob w-[42rem] h-[42rem] -bottom-64 right-1/4 opacity-20" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.35) 0%, transparent 65%)', animationDelay: '-16s' }} />
        </>
      ) : (
        <>
          <div className="nd-blob w-[46rem] h-[46rem] -top-56 -right-40 opacity-55" style={{ background: 'radial-gradient(circle at 40% 40%, #ddd6fe 0%, rgba(221,214,254,0) 65%)' }} />
          <div className="nd-blob w-[40rem] h-[40rem] top-24 -left-52 opacity-50" style={{ background: 'radial-gradient(circle at 55% 45%, #bfdbfe 0%, rgba(191,219,254,0) 65%)', animationDelay: '-8s' }} />
          <div className="nd-blob w-[42rem] h-[42rem] -bottom-64 right-1/4 opacity-40" style={{ background: 'radial-gradient(circle at 50% 50%, #bbf7d0 0%, rgba(187,247,208,0) 65%)', animationDelay: '-16s' }} />
          <div className="nd-blob w-[30rem] h-[30rem] top-[46%] -right-32 opacity-35" style={{ background: 'radial-gradient(circle at 50% 50%, #fed7aa 0%, rgba(254,215,170,0) 65%)', animationDelay: '-4s' }} />
        </>
      )}
    </div>
  );
};
