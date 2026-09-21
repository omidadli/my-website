import React, { useState } from 'react';
import { Theme, Page, ServiceItem } from '../types';
import { useContent } from '../context/ContentContext';
import { SectionEditHeader } from '../components/cms/SectionEditHeader';
import { IconBadge3D } from '../components/3D/3DIconBadge';
import { PageHeader } from '../components/PageHeader';
import { FAQSection } from '../components/FAQSection';
import { CinematicSection, CinematicStagger, CinematicItem } from '../components/motion/CinematicSection';
import { CheckCircle2, ArrowUpLeft, Sparkles, Target, Rocket, MessageCircle, HelpCircle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ServicesPageProps {
  theme: Theme;
  onNavigate: (page: Page) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ theme, onNavigate }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();
  const servicesList: ServiceItem[] = data.SERVICES || [];
  const howIWorkSteps = data.HOW_I_WORK_STEPS || [];

  const [activeTab, setActiveTab] = useState<'start' | 'sell' | 'grow'>('start');

  const tabs = [
    {
      id: 'start' as const,
      label: 'شروع کنیم',
      sublabel: 'طراحی سایت، تجربه کاربری و شبکه‌های اجتماعی',
      icon: Sparkles,
      color: '#8b5cf6'
    },
    {
      id: 'sell' as const,
      label: 'بهتر بفروشیم',
      sublabel: 'تبلیغات، افزایش نرخ تبدیل و رصد مشتری',
      icon: Target,
      color: '#5ce1e6'
    },
    {
      id: 'grow' as const,
      label: 'رشد کنیم',
      sublabel: 'سئو، استراتژی رشد و اتوماسیون',
      icon: Rocket,
      color: '#3b82f6'
    }
  ];

  const START_IDS = ['web-app-design', 'ui-ux-design', 'social-media-strategy'];
  const SELL_IDS = ['performance-marketing', 'cro-optimization', 'tracking-analytics'];
  const GROW_IDS = ['seo-growth', 'growth-strategy', 'marketing-automation', 'retention-strategy'];

  const filteredServices = servicesList.filter(s => {
    if (activeTab === 'start') return START_IDS.includes(s.id);
    if (activeTab === 'sell') return SELL_IDS.includes(s.id);
    if (activeTab === 'grow') return GROW_IDS.includes(s.id);
    return true;
  });

  return (
    <div className="space-y-16 py-4">
      {/* 1. Page Header */}
      <PageHeader
        theme={theme}
        page="services"
        title="خدماتی که در هر مرحله از مسیر بهت کمک می‌کنن"
        subtitle="از طراحی سایت و راه‌اندازی پیج تا تبلیغات، تحلیل و رشد فروش — هرکدوم رو می‌تونی جدا یا در کنار هم داشته باشی."
        badgeText="خدمات — از شروع تا رشد"
        onNavigate={onNavigate}
      />

      {/* 2. Services Section with 3 Horizontal Tabs */}
      <CinematicSection variant="fade-up" showGlowBeam glowColor="purple" className="space-y-8" id="services-tabs-section">
        <SectionEditHeader title="خدمات و سرویس‌های تخصصی" arrayPath="SERVICES" />

        {/* 3-Tab Navigation Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                  isActive
                    ? isDark
                      ? 'bg-gradient-to-r from-violet-600/30 to-blue-600/30 border-violet-400/60 shadow-lg text-white'
                      : 'bg-white border-violet-400 shadow-md text-slate-900'
                    : isDark
                      ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-violet-500 text-white shadow-sm'
                      : isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black">{tab.label}</div>
                  <div className="text-[11px] truncate opacity-80 mt-0.5">{tab.sublabel}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Tab Service Cards */}
        <AnimatePresence mode="wait">
          <CinematicStagger
            key={activeTab}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4"
            staggerDelay={0.1}
          >
            {filteredServices.map((service, idx) => (
              <CinematicItem key={service.id} className="h-full">
                <div
                  className={`p-8 sm:p-10 rounded-[36px] flex flex-col justify-between transition-all duration-300 relative group h-full ${
                    isDark ? 'glass-card-dark glass-card-dark-hover' : 'glass-card-light glass-card-light-hover'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <IconBadge3D
                        iconName={service.iconName}
                        theme={theme}
                        size="xl"
                        glowColor={idx % 2 === 0 ? 'magenta' : 'cyan'}
                      />
                      <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-white/10 text-[#5ce1e6] border border-white/15">
                        {service.titleEn}
                      </span>
                    </div>

                    <h2 className={`text-xl sm:text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                      {service.title}
                    </h2>

                    <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {service.fullDesc}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {service.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-3 py-1 rounded-xl text-[11px] font-bold bg-[#4c8dff]/15 border border-[#4c8dff]/30 text-[#4c8dff]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Feature Checklist */}
                    <div className="space-y-2 mb-6 pt-4 border-t border-white/10">
                      <span className="text-xs font-bold text-slate-400 block mb-2">دستاوردهای کلیدی این سرویس:</span>
                      {service.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2.5 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pricing Packages */}
                    {service.packages && service.packages.length > 0 && (
                      <div className="space-y-3 mb-8 pt-4 border-t border-white/10">
                        <span className="text-xs font-bold text-amber-400 block mb-2">تعرفه و پکیج‌های قیمت‌گذاری:</span>
                        <div className="grid grid-cols-1 gap-2.5">
                          {service.packages.map((pkg, pIdx) => (
                            <div
                              key={pIdx}
                              className={`p-3.5 rounded-2xl border transition-all ${
                                pkg.isPopular
                                  ? 'bg-gradient-to-r from-[#8b5cf6]/20 to-[#4c8dff]/20 border-[#8b5cf6]/50 shadow-md'
                                  : isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {pkg.title}
                                  </span>
                                  {pkg.badge && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#5ce1e6]/20 text-[#5ce1e6] border border-[#5ce1e6]/30">
                                      {pkg.badge}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-black text-amber-300 font-mono">
                                  {pkg.price}
                                </span>
                              </div>
                              {pkg.description && (
                                <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                                  {pkg.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onNavigate('contact')}
                    className="w-full glow-btn py-4 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-4 hover:scale-[1.02] transition-transform"
                  >
                    <span>سفارش این خدمت و مشاوره</span>
                    <ArrowUpLeft className="w-4 h-4" />
                  </button>
                </div>
              </CinematicItem>
            ))}
          </CinematicStagger>
        </AnimatePresence>
      </CinematicSection>

      {/* 3. Mid CTA Card (Replaces the ROAS Calculator) */}
      <CinematicSection variant="scale-up" showGlowBeam glowColor="purple" className="my-12">
        <div
          className={`p-8 sm:p-12 rounded-[36px] border text-center space-y-6 max-w-4xl mx-auto transition-all ${
            isDark
              ? 'bg-gradient-to-br from-violet-950/40 via-[#1a1240]/80 to-blue-950/40 border-violet-500/30 shadow-2xl'
              : 'bg-gradient-to-br from-violet-50 via-white to-blue-50 border-violet-200 shadow-xl'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-xs font-bold text-[#a78bfa]">
            <MessageCircle className="w-4 h-4" />
            <span>مشاوره‌ی اولیه و رایگان</span>
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
              نمی‌دونی دقیقاً به کدوم خدمت نیاز داری؟
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              چند دقیقه با هم صحبت می‌کنیم و می‌گم از کجا شروع کنیم.
            </p>
          </div>

          <div>
            <button
              onClick={() => onNavigate('contact')}
              className="glow-btn px-8 py-4 rounded-full text-xs sm:text-sm font-black text-white inline-flex items-center gap-2.5 shadow-xl cursor-pointer hover:scale-105 transition-transform"
            >
              <span>ببینیم کسب‌وکارتان به چی نیاز دارد</span>
              <ArrowUpLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CinematicSection>

      {/* 4. How I Work Process Section (Specialized 4-Step Process for Services) */}
      <CinematicSection variant="fade-up" showGlowBeam glowColor="cyan" className="space-y-12">
        <SectionEditHeader title="مراحل فرایند کاری" arrayPath="HOW_I_WORK_STEPS" />
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold text-[#5ce1e6] uppercase tracking-wider">فرآیند کاری شفاف</span>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-black whitespace-nowrap ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
            مسیر ۴ مرحله‌ای همکاری
          </h2>
        </div>

        <CinematicStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
          {howIWorkSteps.map((step, idx) => (
            <CinematicItem key={idx} className="h-full">
              <div
                className={`p-7 rounded-[32px] relative flex flex-col justify-between transition-all duration-300 h-full ${
                  isDark ? 'glass-card-dark glass-card-dark-hover' : 'glass-card-light glass-card-light-hover'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-black gradient-text font-mono">{step.step}</span>
                    <IconBadge3D iconName={step.icon} theme={theme} size="sm" glowColor="magenta" floating={false} />
                  </div>

                  <h3 className={`text-lg font-black mb-2 ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                    {step.title}
                  </h3>

                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {step.desc}
                  </p>
                </div>

                {idx < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -left-3 translate-y-[-50%] text-slate-500 text-xl font-bold">
                    ←
                  </div>
                )}
              </div>
            </CinematicItem>
          ))}
        </CinematicStagger>
      </CinematicSection>

      {/* 5. FAQ Section */}
      <CinematicSection variant="fade-up" showGlowBeam glowColor="blue">
        <FAQSection theme={theme} />
      </CinematicSection>

      {/* 6. Final CTA Section */}
      <CinematicSection variant="scale-up" showGlowBeam glowColor="purple" className="text-center pt-8 pb-4">
        <div
          className={`p-10 sm:p-14 rounded-[40px] border text-center space-y-6 max-w-3xl mx-auto ${
            isDark
              ? 'glass-card-dark border-white/10'
              : 'glass-card-light border-slate-200 shadow-xl'
          }`}
        >
          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className={`text-2xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
              آماده‌ای ببینیم کسب‌وکارت به چی نیاز داره؟
            </h2>
            <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              یه گفتگوی کوتاه و رایگان، اولین قدمه.
            </p>
          </div>

          <div>
            <button
              onClick={() => onNavigate('contact')}
              className="glow-btn px-10 py-5 rounded-full text-sm font-black text-white inline-flex items-center gap-3 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
            >
              <span>ببینیم کسب‌وکارتان به چی نیاز دارد</span>
              <ArrowUpLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </CinematicSection>
    </div>
  );
};

