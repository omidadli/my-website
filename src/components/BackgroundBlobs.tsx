import React from 'react';

interface BackgroundBlobsProps {
  theme?: 'dark' | 'light';
}

/**
 * Soft pastel atmosphere — calm radial washes instead of neon blobs.
 * Fixed behind all content, never intercepts pointer events.
 */
export const BackgroundBlobs: React.FC<BackgroundBlobsProps> = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Base sky wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #eef0ff 0%, rgba(246,246,244,0) 38%), linear-gradient(0deg, #f2f7f4 0%, rgba(246,246,244,0) 30%), var(--nd-bg)',
        }}
      />
      {/* Lavender — top right */}
      <div className="nd-blob w-[46rem] h-[46rem] -top-56 -right-40 opacity-55" style={{ background: 'radial-gradient(circle at 40% 40%, #ddd6fe 0%, rgba(221,214,254,0) 65%)' }} />
      {/* Sky — top left */}
      <div className="nd-blob w-[40rem] h-[40rem] top-24 -left-52 opacity-50" style={{ background: 'radial-gradient(circle at 55% 45%, #bfdbfe 0%, rgba(191,219,254,0) 65%)', animationDelay: '-8s' }} />
      {/* Mint — bottom */}
      <div className="nd-blob w-[42rem] h-[42rem] -bottom-64 right-1/4 opacity-40" style={{ background: 'radial-gradient(circle at 50% 50%, #bbf7d0 0%, rgba(187,247,208,0) 65%)', animationDelay: '-16s' }} />
      {/* Peach — mid right */}
      <div className="nd-blob w-[30rem] h-[30rem] top-[46%] -right-32 opacity-35" style={{ background: 'radial-gradient(circle at 50% 50%, #fed7aa 0%, rgba(254,215,170,0) 65%)', animationDelay: '-4s' }} />
    </div>
  );
};
