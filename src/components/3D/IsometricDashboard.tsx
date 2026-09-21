import React, { useState } from 'react';
import { Theme } from '../../types';
import { IconBadge3D } from './3DIconBadge';
import { TrendingUp, Users, ArrowUpRight, ShieldCheck, Zap, Activity, CheckCircle2 } from 'lucide-react';

interface IsometricDashboardProps {
  theme: Theme;
}

export const IsometricDashboard: React.FC<IsometricDashboardProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'roas' | 'cro' | 'cac'>('roas');

  return (
    <div className="relative w-full max-w-xl mx-auto py-6">
      {/* Background glowing aura */}
      <div 
        className="absolute inset-0 rounded-full blur-[80px] opacity-70 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(76,141,255,0.4) 0%, rgba(255,79,216,0.3) 50%, transparent 70%)' }}
      />

      {/* Floating 3D Satellite Badges */}
      <div className="absolute -top-6 -right-2 z-20 animate-float">
        <IconBadge3D iconName="rocket" theme={theme} size="lg" glowColor="magenta" />
      </div>

      <div className="absolute top-1/2 -left-6 z-20 animate-float-delayed">
        <IconBadge3D iconName="target" theme={theme} size="md" glowColor="cyan" />
      </div>

      <div className="absolute -bottom-4 right-10 z-20 animate-float">
        <IconBadge3D iconName="chart" theme={theme} size="md" glowColor="blue" />
      </div>

      {/* Main 3D Tilted Isometric Laptop Frame */}
      <div 
        className="relative z-10 transition-transform duration-500 hover:rotate-1"
        style={{
          transform: 'perspective(1000px) rotateX(12deg) rotateY(-10deg) rotateZ(2deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Laptop Lid/Screen Outer Frame */}
        <div className={`p-4 md:p-6 rounded-[28px] border backdrop-blur-2xl transition-all duration-300 ${
          isDark 
            ? 'bg-[#1a1240]/80 border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.6),0_0_40px_rgba(76,141,255,0.25)]' 
            : 'bg-white/85 border-white shadow-[0_25px_60px_rgba(76,141,255,0.2)]'
        }`}>
          {/* Screen Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-400/80 inline-block" />
              <span className="text-xs text-slate-400 font-mono mr-2">OmidAdli_Performance_Engine_v4.2</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>پایدار - Live Tracking</span>
            </div>
          </div>

          {/* Interactive Metric Filter Tabs */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => setActiveTab('roas')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'roas'
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-lg shadow-blue-500/25'
                  : isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700'
              }`}
            >
              ROAS +340%
            </button>

            <button
              onClick={() => setActiveTab('cro')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'cro'
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-lg shadow-blue-500/25'
                  : isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700'
              }`}
            >
              نرخ تبدیل ۴.۸٪
            </button>

            <button
              onClick={() => setActiveTab('cac')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'cac'
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-lg shadow-blue-500/25'
                  : isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700'
              }`}
            >
              کاهش CAC -۵۴٪
            </button>
          </div>

          {/* Metric Dashboard Display Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-400">بازگشت سرمایه (ROAS)</span>
                <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> +۲۴۰٪
                </span>
              </div>
              <div className={`text-xl font-extrabold dir-ltr text-right ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                {activeTab === 'roas' ? '5.4x' : activeTab === 'cro' ? '3.8x' : '4.2x'}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">میانگین سود خالص کمپین</p>
            </div>

            <div className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-400">هزینه جذب (CAC)</span>
                <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                  -۵۴٪
                </span>
              </div>
              <div className="text-xl font-extrabold text-[#5ce1e6] dir-ltr text-right">
                {activeTab === 'cac' ? '$18.50' : '$24.10'}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">صرفه‌جویی در لید سازمانی</p>
            </div>
          </div>

          {/* Simulated Animated Graph Area */}
          <div className={`p-4 rounded-2xl border relative overflow-hidden ${
            isDark ? 'bg-black/30 border-white/10' : 'bg-white border-slate-200 shadow-inner'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#8b5cf6]" />
                <span className="text-xs font-bold">روند فروش آنلاین (۳۰ روز اخیر)</span>
              </div>
              <span className="text-[11px] text-slate-400">$248,500</span>
            </div>

            {/* Glowing SVG Curve */}
            <div className="h-24 w-full relative flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#4c8dff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,80 Q40,65 80,75 T160,35 T240,40 T300,10 L300,100 L0,100 Z"
                  fill="url(#chartGrad)"
                />
                <path
                  d="M0,80 Q40,65 80,75 T160,35 T240,40 T300,10"
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#5ce1e6" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#4c8dff" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Glowing Pulse Node on Peak */}
              <div className="absolute top-2 right-4 w-3.5 h-3.5 rounded-full bg-[#8b5cf6] shadow-[0_0_15px_#8b5cf6] animate-ping" />
              <div className="absolute top-2 right-4 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_#8b5cf6]" />
            </div>

            {/* Bottom Tech Tags */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10 mt-2">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                GA4 Server-Side Active
              </span>
              <span>A/B Test #14 Winner</span>
            </div>
          </div>
        </div>

        {/* Laptop Keyboard Base Shelf */}
        <div className={`h-4 w-[104%] -mr-[2%] rounded-b-2xl border-x border-b backdrop-blur-xl transition-colors ${
          isDark ? 'bg-gradient-to-r from-[#2d1b5e] via-[#1a1240] to-[#2d1b5e] border-white/20' : 'bg-slate-200 border-slate-300'
        }`} />
      </div>
    </div>
  );
};
