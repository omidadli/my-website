import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-10 h-10', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={style}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_14px_rgba(92,225,230,0.45)] transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="oaGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5ce1e6" />
            <stop offset="50%" stopColor="#4c8dff" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {/* Group with uniform gradient styling */}
        <g stroke="url(#oaGradMain)">
          {/* Target Outer Circle */}
          <circle cx="36" cy="64" r="26" strokeWidth="5" fill="none" />
          
          {/* Target Middle Circle */}
          <circle cx="36" cy="64" r="15" strokeWidth="4.5" fill="none" />
          
          {/* Target Center Solid Dot */}
          <circle cx="36" cy="64" r="4.5" fill="url(#oaGradMain)" stroke="none" />

          {/* Arrow Shaft */}
          <line x1="36" y1="64" x2="70" y2="30" strokeWidth="5" strokeLinecap="round" />

          {/* Arrow Head */}
          <polygon points="90,10 66,22 78,34" fill="url(#oaGradMain)" stroke="none" />

          {/* Letter A - Left Leg, Right Leg, Crossbar */}
          <path 
            d="M 74 40 L 58 90 M 74 40 L 90 90 M 63 74 H 85" 
            strokeWidth="5.5" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </g>
      </svg>
    </div>
  );
};
