import React, { useState, useRef } from 'react';
import { Theme, Page, CaseStudy } from '../types';
import { useContent } from '../context/ContentContext';
import { EditableText } from '../components/cms/EditableText';
import { RepeaterControls } from '../components/cms/RepeaterControls';
import { SectionEditHeader } from '../components/cms/SectionEditHeader';
import { SectionWrapper } from '../components/cms/SectionWrapper';
import { IsometricDashboard } from '../components/3D/IsometricDashboard';
import { IconBadge3D } from '../components/3D/3DIconBadge';
import { TiltCard } from '../components/3D/TiltCard';
import { 
  ChevronLeft, 
  ArrowUpLeft, 
  Sparkles, 
  Target, 
  Rocket, 
  TrendingUp, 
  Layers,
  MessageCircle,
  ClipboardCheck,
  LineChart,
  Briefcase,
  CheckCircle2,
  Quote,
  ArrowRight,
  Code,
  Megaphone,
  Laptop
} from 'lucide-react';
import { CinematicSection, CinematicStagger, CinematicItem } from '../components/motion/CinematicSection';
import { motion } from 'motion/react';

interface HomePageProps {
  theme: Theme;
  onNavigate: (page: Page) => void;
  onSelectCaseStudy: (caseStudy: CaseStudy) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ theme, onNavigate, onSelectCaseStudy }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();

  // Active tab in Services section ('start' | 'sell' | 'grow')
  const [activeServiceTab, setActiveServiceTab] = useState<'start' | 'sell' | 'grow'>('start');
  const servicesSectionRef = useRef<HTMLDivElement>(null);

  const stats = data.STATS || [];
  const services = data.SERVICES || [];
  const caseStudies = data.CASE_STUDIES || [];
  const testimonials = data.TESTIMONIALS || [];
  const howIWork = data.HOMEPAGE_HOW_I_WORK_STEPS || data.HOW_I_WORK_STEPS || [];
  const timeline = data.TIMELINE || [];
  const otherCollaborations = data.OTHER_COLLABORATIONS || [];
  const homeSections = data.PAGE_SECTIONS['home'] || [];

  // Function to handle clicking on the 3-path navigation cards
  const handlePathNavClick = (tab: 'start' | 'sell' | 'grow') => {
    setActiveServiceTab(tab);
    if (servicesSectionRef.current) {
      servicesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 3-Path Navigation cards data
  const pathCards = [
    {
      id: 'start' as const,
      tag: 'مسیر ۱',
      title: 'تازه می‌خوام شروع کنم',
      desc: 'هنوز سایت یا پیج فعالی ندارم، یا تازه راه افتادم و نمی‌دونم از کجا شروع کنم.',
      cta: 'ببین از کجا شروع کنیم',
      iconName: 'sparkles',
      glow: 'rgba(139, 92, 246, 0.25)',
      accentBg: 'from-violet-500/20 to-purple-500/10',
      accentBorder: 'border-violet-500/30',
      accentText: 'text-violet-400'
    },
    {
      id: 'sell' as const,
      tag: 'مسیر ۲',
      title: 'فروش دارم ولی می‌خوام بیشتر بفروشم',
      desc: 'سایت یا پیج دارم، بازدید هم میاد، ولی فروش اونی نیست که باید باشه.',
      cta: 'ببین مشکل کجاست',
      iconName: 'target',
      glow: 'rgba(59, 130, 246, 0.3)',
      accentBg: 'from-blue-500/20 to-cyan-500/10',
      accentBorder: 'border-blue-500/40',
      accentText: 'text-blue-400',
      isFeatured: true
    },
    {
      id: 'grow' as const,
      tag: 'مسیر ۳',
      title: 'فروش دارم و می‌خوام رشدش بدم',
      desc: 'همه‌چیز کار می‌کنه، ولی می‌خوام سیستم رشدم رو قوی‌تر و مقیاس‌پذیرتر کنم.',
      cta: 'ببین چطور رشد کنیم',
      iconName: 'rocket',
      glow: 'rgba(16, 185, 129, 0.25)',
      accentBg: 'from-emerald-500/20 to-teal-500/10',
      accentBorder: 'border-emerald-500/30',
      accentText: 'text-emerald-400'
    }
  ];

  // Service Tabs Configuration (mapped by id)
  const tabConfig = {
    start: {
      label: 'شروع کنیم',
      tagline: 'هنوز آنلاین شروع نکرده‌اید؟ از صفر کنارتان هستم.',
      serviceIds: ['web-app-design', 'ui-ux-design', 'social-media-strategy'],
      ctaText: 'ببینیم دقیقاً چی نیاز داری',
      icon: Sparkles
    },
    sell: {
      label: 'بهتر بفروشیم',
      tagline: 'آنلاین هستید، اما فروش آن چیزی نیست که باید باشد؟ با هم پیدا می‌کنیم مشکل کجاست.',
      serviceIds: ['performance-marketing', 'cro-optimization', 'tracking-analytics'],
      ctaText: 'ببینیم دقیقاً چی نیاز داری',
      icon: Target
    },
    grow: {
      label: 'رشد کنیم',
      tagline: 'فروش دارید؟ حالا بیایید سیستم رشدتان را بهتر کنیم.',
      serviceIds: ['seo-growth', 'growth-strategy', 'marketing-automation', 'retention-strategy'],
      ctaText: 'ببینیم دقیقاً چی نیاز داری',
      icon: Rocket
    }
  };

  // 4 Featured Case Studies strictly for Homepage
  const targetCaseStudyIds = ['eads-campaigns', 'eqamat24-cro', 'golchin-home', 'dayan-performance'];
  const homepageCaseStudies = targetCaseStudyIds
    .map(id => caseStudies.find(c => c.id === id))
    .filter(Boolean) as CaseStudy[];

  // If some couldn't be matched by id, fallback to first 4
  const finalHomepageCaseStudies = homepageCaseStudies.length === 4 
    ? homepageCaseStudies 
    : caseStudies.slice(0, 4);

  // Why Omid 3 key points
  const whyOmidPoints = [
    {
      title: 'همه‌ی مسیر رو با هم می‌بینم',
      desc: 'به‌جای اینکه هر بخش کسب‌وکارتون (سایت، محتوا، تبلیغات، تحلیل) جدا جدا پیش بره، کمک می‌کنم همه در یک مسیر مشخص برای فروش و رشد کار کنن.',
      icon: 'layers'
    },
    {
      title: 'تصمیم‌هام رو با داده می‌گیرم، نه حدس',
      desc: 'هر پیشنهادی که می‌دم، بر اساس تحلیل واقعی رفتار مشتری‌های شماست، نه یه فرمول یکسان برای همه.',
      icon: 'chart'
    },
    {
      title: 'نتیجه رو با عدد نشونتون می‌دم',
      desc: 'همون‌طور که تا اینجا دیدید، ادعا نمی‌کنم — نتیجه رو با عدد ثابت می‌کنم.',
      icon: 'target'
    }
  ];

  // 3 Featured Experience Milestones for Homepage (Dayan, Eads, Ahan Online)
  const homepageTimeline = timeline.filter(t => 
    t.company.includes('دایان') || t.company.includes('ای ادز') || t.company.includes('آهن آنلاین')
  );
  const finalHomepageTimeline = homepageTimeline.length >= 3 ? homepageTimeline.slice(0, 3) : timeline.slice(0, 3);

  // Helper to render icon for How I Work
  const getHowIWorkIcon = (stepNum: string) => {
    switch (stepNum) {
      case '۱':
      case '01':
      case '۰۱':
        return <MessageCircle className="w-5 h-5 text-violet-400" />;
      case '۲':
      case '02':
      case '۰۲':
        return <ClipboardCheck className="w-5 h-5 text-blue-400" />;
      case '۳':
      case '03':
      case '۰۳':
        return <Rocket className="w-5 h-5 text-emerald-400" />;
      default:
        return <TrendingUp className="w-5 h-5 text-[#5ce1e6]" />;
    }
  };

  const renderSectionByName = (secName: string) => {
    switch (secName) {
      // 1. HERO (Static - As requested in homepage-content-final.md)
      case 'HERO':
        return (
          <CinematicSection variant="fade-up" showGlowBeam glowColor="purple" className="relative pt-6 pb-12" id="hero-section">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Text & CTAs */}
              <motion.div 
                initial={{ opacity: 0, x: 30, filter: 'blur(8px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="lg:col-span-7 text-right space-y-6"
              >
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-xs font-black text-[#a78bfa] shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>برای فروشگاه‌ها و کسب‌وکارهای فروش‌محور</span>
                </div>

                {/* Headline (H1) */}
                <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.25] tracking-tight ${
                  isDark ? 'text-white' : 'text-[#1a1240]'
                }`}>
                  فروشگاهتان را آنلاین شروع کنید،{' '}
                  <span className="gradient-text">بهتر بفروشید و رشد کنید.</span>
                </h1>

                {/* Subheadline */}
                <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  فرقی نمی‌کنه تازه می‌خواید وارد دنیای آنلاین بشید یا همین حالا فروشگاه و سایت دارید؛ از طراحی سایت و راه‌اندازی پیج و محتوا تا تبلیغات، تحلیل و افزایش فروش، کمکتون می‌کنم مسیر درست رشدتون رو پیدا کنید و اجراش کنید.
                </p>

                {/* Intro statement */}
                <div className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                  isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <span className="font-bold text-[#5ce1e6] ml-1">من امید عدلی هستم؛</span>
                  متخصص رشد دیجیتال برای فروشگاه‌ها. کمک می‌کنم بفهمید مشتری‌ها کجا شما را پیدا می‌کنند، چرا بعضی‌ها خرید می‌کنند و بعضی‌ها نه، و برای بهتر شدن فروش باید دقیقاً روی چه چیزی کار کنید.
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => onNavigate('contact')}
                    className="glow-btn px-7 py-4 rounded-2xl text-sm font-black text-white inline-flex items-center gap-2.5 shadow-xl cursor-pointer hover:scale-105 transition-transform"
                  >
                    <span>ببینیم کسب‌وکارتان به چی نیاز دارد</span>
                    <ArrowUpLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onNavigate('portfolio')}
                    className={`px-6 py-4 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                      isDark ? 'bg-white/5 hover:bg-white/15 border-white/15 text-white' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                    }`}
                  >
                    <span>پروژه‌هایی که انجام دادم</span>
                  </button>
                </div>

                {/* Proof micro-list */}
                <div className="pt-2 text-xs font-bold text-slate-400 flex flex-wrap items-center gap-2">
                  <span>طراحی سایت</span>
                  <span className="text-slate-500">·</span>
                  <span>محتوا و شبکه‌های اجتماعی</span>
                  <span className="text-slate-500">·</span>
                  <span>تبلیغات</span>
                  <span className="text-slate-500">·</span>
                  <span>تحلیل و بهینه‌سازی فروش</span>
                </div>
              </motion.div>

              {/* 3D Visual Asset */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.92, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-5"
              >
                <IsometricDashboard theme={theme} />
              </motion.div>
            </div>
          </CinematicSection>
        );

      // 2. الان کسب‌وکارت کجای این مسیره؟ (مسیریابی سه‌گانه)
      case 'PATH_NAV':
        return (
          <CinematicSection variant="fade-up" showGlowBeam glowColor="blue" className="space-y-8" id="path-navigation">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/25 text-xs font-bold text-[#60a5fa]">
                <Layers className="w-3.5 h-3.5" />
                <span>مسیریابی سه‌گانه</span>
              </div>
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                الان کسب‌وکارت کجای این مسیره؟
              </h2>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                روی همونی که به شرایط الانت نزدیک‌تره بزن، تا دقیقاً همون چیزی رو ببینی که بهش نیاز داری.
              </p>
            </div>

            <CinematicStagger className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.12}>
              {pathCards.map((p) => (
                <CinematicItem key={p.id} className="h-full">
                  <TiltCard maxTilt={6} glowColor={p.glow}>
                    <div
                      onClick={() => handlePathNavClick(p.id)}
                      className={`p-7 rounded-[28px] flex flex-col justify-between cursor-pointer transition-all duration-300 h-full relative group ${
                        p.isFeatured
                          ? isDark 
                            ? 'glass-card-dark border-2 border-blue-500/50 shadow-[0_10px_35px_rgba(59,130,246,0.2)] hover:border-blue-400' 
                            : 'glass-card-light border-2 border-blue-500/50 shadow-[0_10px_35px_rgba(59,130,246,0.15)] hover:border-blue-600'
                          : isDark 
                            ? 'glass-card-dark glass-card-dark-hover border-white/10' 
                            : 'glass-card-light glass-card-light-hover border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${
                            isDark ? 'bg-white/10 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            {p.tag}
                          </span>
                          <IconBadge3D iconName={p.iconName} theme={theme} size="sm" glowColor="blue" floating={false} />
                        </div>

                        <h3 className={`text-lg sm:text-xl font-black mb-3 group-hover:text-[#5ce1e6] transition-colors leading-snug ${
                          isDark ? 'text-white' : 'text-[#1a1240]'
                        }`}>
                          {p.title}
                        </h3>

                        <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {p.desc}
                        </p>
                      </div>

                      <div className={`flex items-center justify-between pt-4 border-t ${
                        isDark ? 'border-white/10' : 'border-slate-200'
                      } text-xs font-bold text-[#60a5fa] group-hover:text-[#5ce1e6] transition-colors`}>
                        <span>{p.cta}</span>
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </TiltCard>
                </CinematicItem>
              ))}
            </CinematicStagger>
          </CinematicSection>
        );

      // 3. STATS / PROOF
      case 'STATS':
        return (
          <CinematicSection variant="fade-up" showGlowBeam glowColor="cyan" className="space-y-8" id="stats-section">
            <SectionEditHeader title="آمار و شاخص‌های کلیدی" arrayPath="STATS" />
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>نتایج واقعی</span>
              </div>
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                نتیجه‌هایی که تا الان گرفتم
              </h2>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                این‌ها فقط عدد نیستن؛ نتیجه‌ی کار روی کسب‌وکارهای واقعیه.
              </p>
            </div>

            <CinematicStagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" staggerDelay={0.1}>
              {stats.map((stat, idx) => (
                <CinematicItem key={idx} className="h-full">
                  <TiltCard maxTilt={6} glowColor="rgba(92, 225, 230, 0.2)">
                    <div
                      className={`p-6 sm:p-7 rounded-[26px] transition-all duration-300 relative overflow-hidden group h-full ${
                        isDark ? 'glass-card-dark glass-card-dark-hover' : 'glass-card-light glass-card-light-hover'
                      }`}
                    >
                      <RepeaterControls arrayPath="STATS" index={idx} totalCount={stats.length} className="absolute top-2 left-2" />

                      <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#5ce1e6] mb-2 dir-ltr text-right">
                        <EditableText path={`STATS.${idx}.value`}>{stat.value}</EditableText>
                      </div>

                      <div className={`font-bold text-xs sm:text-sm mb-1 ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                        <EditableText path={`STATS.${idx}.label`}>{stat.label}</EditableText>
                      </div>

                      <div className="text-[11px] text-slate-400 font-medium">
                        <EditableText path={`STATS.${idx}.subtext`}>{stat.subtext}</EditableText>
                      </div>
                    </div>
                  </TiltCard>
                </CinematicItem>
              ))}
            </CinematicStagger>
          </CinematicSection>
        );

      // 4. SERVICES (سه‌تب: شروع کنیم / بهتر بفروشیم / رشد کنیم)
      case 'SERVICES_TABS':
      case 'SERVICES':
        const currentTab = tabConfig[activeServiceTab];
        const currentServices = services.filter(s => currentTab.serviceIds.includes(s.id));

        return (
          <CinematicSection variant="fade-up" showGlowBeam glowColor="purple" className="space-y-8" id="services-tabs">
            <div ref={servicesSectionRef} className="space-y-8">
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-xs font-black text-[#a78bfa]">
                  <Layers className="w-3.5 h-3.5" />
                  <span>خدمات تخصصی</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                  خدماتی که در هر مرحله از مسیر بهت کمک می‌کنن
                </h2>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  از شروع آنلاین تا رشد فروش، هر بخش رو می‌تونی جدا یا در کنار هم داشته باشی.
                </p>
              </div>

              {/* Tabs Control */}
              <div className="flex justify-center">
                <div className={`inline-flex p-1.5 rounded-2xl border ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
                }`}>
                  {(['start', 'sell', 'grow'] as const).map((tabKey) => {
                    const cfg = tabConfig[tabKey];
                    const Icon = cfg.icon;
                    const isActive = activeServiceTab === tabKey;
                    return (
                      <button
                        key={tabKey}
                        onClick={() => setActiveServiceTab(tabKey)}
                        className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                            : isDark 
                              ? 'text-slate-400 hover:text-white' 
                              : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Tagline Message */}
              <motion.div 
                key={activeServiceTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`p-4 rounded-2xl border text-center text-xs sm:text-sm font-bold max-w-xl mx-auto ${
                  isDark ? 'bg-white/5 border-white/10 text-slate-200' : 'bg-blue-50/60 border-blue-100 text-blue-900'
                }`}
              >
                {currentTab.tagline}
              </motion.div>

              {/* Services Grid (NO Prices on Homepage as strictly requested) */}
              <CinematicStagger key={`services-${activeServiceTab}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
                {currentServices.map((srv, idx) => (
                  <CinematicItem key={srv.id || idx} className="h-full">
                    <div
                      className={`p-6 rounded-[26px] flex flex-col justify-between transition-all duration-300 relative group h-full ${
                        isDark ? 'glass-card-dark glass-card-dark-hover' : 'glass-card-light glass-card-light-hover'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <IconBadge3D iconName={srv.iconName} theme={theme} size="sm" glowColor="blue" floating={false} />
                          <span className="text-[11px] font-bold text-slate-400 font-mono">۰{idx + 1}</span>
                        </div>

                        <h3 className={`text-base sm:text-lg font-black mb-2.5 ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                          {srv.title}
                        </h3>

                        <p className={`text-xs leading-relaxed mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {srv.shortDesc}
                        </p>
                      </div>

                      <button
                        onClick={() => onNavigate('services')}
                        className="w-full py-3 rounded-xl border border-white/10 text-xs font-bold text-[#60a5fa] hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                      >
                        <span>مشاهده جزئیات کامل</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </CinematicItem>
                ))}
              </CinematicStagger>

              {/* Tab Bottom CTA */}
              <div className="text-center pt-2">
                <button
                  onClick={() => onNavigate('contact')}
                  className="px-7 py-3.5 rounded-2xl bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 border border-[#3b82f6]/40 text-[#60a5fa] hover:text-white text-xs font-black transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105"
                >
                  <span>{currentTab.ctaText}</span>
                  <ArrowUpLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CinematicSection>
        );

      // 5. CASE STUDIES (4 Featured Projects)
      case 'CASE_STUDIES':
      case 'PORTFOLIO':
        return (
          <CinematicSection variant="fade-up" showGlowBeam glowColor="cyan" className="space-y-8" id="case-studies">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5ce1e6]/10 border border-[#5ce1e6]/30 text-xs font-bold text-[#5ce1e6] mb-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>پروژه‌های واقعی</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                  چند نمونه از پروژه‌هایی که روشون کار کردم
                </h2>
                <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  از فروشگاه‌های کوچیک تا برندهای بزرگ‌تر — هرکدوم یه چالش متفاوت داشتن.
                </p>
              </div>

              <button
                onClick={() => onNavigate('portfolio')}
                className={`px-5 py-3 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer shrink-0 hover:scale-105 ${
                  isDark ? 'bg-white/5 border-white/15 text-white hover:bg-white/15' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>همه‌ی نمونه‌کارها</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <CinematicStagger className="grid grid-cols-1 md:grid-cols-2 gap-6" staggerDelay={0.12}>
              {finalHomepageCaseStudies.map((study, idx) => (
                <CinematicItem key={study.id || idx} className="h-full">
                  <div
                    onClick={() => onSelectCaseStudy(study)}
                    className={`p-7 rounded-[28px] cursor-pointer transition-all duration-300 flex flex-col justify-between group relative h-full ${
                      isDark ? 'glass-card-dark glass-card-dark-hover' : 'glass-card-light glass-card-light-hover'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#8b5cf6]">
                          {study.industryFa}
                        </span>
                        <IconBadge3D iconName={study.thumbnailIcon} theme={theme} size="sm" glowColor="blue" floating={false} />
                      </div>

                      <h3 className={`text-base sm:text-lg font-black mb-2.5 group-hover:text-[#5ce1e6] transition-colors leading-snug ${
                        isDark ? 'text-white' : 'text-[#1a1240]'
                      }`}>
                        {study.title}
                      </h3>

                      <p className={`text-xs leading-relaxed mb-6 line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {study.summary}
                      </p>

                      {/* Metrics row */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-black/20 border border-white/10 mb-6">
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block">ROAS</span>
                          <span className="text-xs font-black text-emerald-400 dir-ltr">{study.metrics.roas}</span>
                        </div>
                        <div className="text-center border-x border-white/10">
                          <span className="text-[10px] text-slate-400 block">نرخ تبدیل</span>
                          <span className="text-xs font-black text-[#5ce1e6] dir-ltr">{study.metrics.conversionRate}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 block">کاهش CAC</span>
                          <span className="text-xs font-black text-[#8b5cf6] dir-ltr">{study.metrics.cacReduction}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs font-bold text-[#5ce1e6] group-hover:text-white transition-colors">
                      <span>دیدن کامل این پروژه</span>
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </CinematicItem>
              ))}
            </CinematicStagger>
          </CinematicSection>
        );

      // 6. HOW I WORK (۴ مرحله با آیکون‌های اختصاصی)
      case 'HOW_I_WORK':
        return (
          <CinematicSection variant="fade-up" showGlowBeam glowColor="purple" className="space-y-8" id="how-i-work">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-black text-violet-400">
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>فرآیند شفاف</span>
              </div>
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                همکاری با من چطور پیش می‌ره؟
              </h2>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                یه فرآیند ساده و شفاف، از اولین گفتگو تا نتیجه‌ی قابل‌اندازه‌گیری.
              </p>
            </div>

            <CinematicStagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
              {howIWork.map((stepItem, idx) => (
                <CinematicItem key={idx} className="h-full">
                  <div
                    className={`p-6 rounded-[26px] relative flex flex-col justify-between transition-all duration-300 h-full ${
                      isDark ? 'glass-card-dark' : 'glass-card-light'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-sm font-black text-[#5ce1e6] font-mono">
                          ۰{idx + 1}
                        </span>
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                          {getHowIWorkIcon(stepItem.step)}
                        </div>
                      </div>

                      <h3 className={`text-base font-black mb-2.5 ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                        {stepItem.title}
                      </h3>

                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {stepItem.desc}
                      </p>
                    </div>
                  </div>
                </CinematicItem>
              ))}
            </CinematicStagger>

            <div className="text-center pt-2">
              <button
                onClick={() => onNavigate('contact')}
                className="glow-btn px-8 py-4 rounded-2xl text-xs sm:text-sm font-black text-white inline-flex items-center gap-2 cursor-pointer shadow-xl hover:scale-105 transition-transform"
              >
                <span>بیایید گفتگوی اولیه رو شروع کنیم</span>
                <ArrowUpLeft className="w-4 h-4" />
              </button>
            </div>
          </CinematicSection>
        );

      // 7. WHY OMID (چرا با من کار کنید؟)
      case 'WHY_OMID':
        return (
          <CinematicSection variant="fade-up" showGlowBeam glowColor="cyan" className="space-y-8" id="why-omid">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-black text-[#5ce1e6]">
                <Target className="w-3.5 h-3.5" />
                <span>تمایز و رویکرد</span>
              </div>
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                چرا با من کار کنید؟
              </h2>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                چون به‌جای اجرای پراکنده، به کسب‌وکارتون به چشم یه سیستم کامل نگاه می‌کنم.
              </p>
            </div>

            <CinematicStagger className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.12}>
              {whyOmidPoints.map((item, idx) => (
                <CinematicItem key={idx} className="h-full">
                  <div
                    className={`p-7 rounded-[28px] transition-all duration-300 flex flex-col justify-between h-full ${
                      isDark ? 'glass-card-dark glass-card-dark-hover' : 'glass-card-light glass-card-light-hover'
                    }`}
                  >
                    <div>
                      <div className="mb-5">
                        <IconBadge3D iconName={item.icon} theme={theme} size="sm" glowColor="cyan" floating={false} />
                      </div>

                      <h3 className={`text-lg font-black mb-3 ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                        {item.title}
                      </h3>

                      <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </CinematicItem>
              ))}
            </CinematicStagger>
          </CinematicSection>
        );

      // 8. EXPERIENCE (مسیری که تا اینجا طی کردم)
      case 'EXPERIENCE':
        return (
          <CinematicSection variant="fade-up" showGlowBeam glowColor="blue" className="space-y-8" id="experience">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-black text-blue-400">
                <Briefcase className="w-3.5 h-3.5" />
                <span>سوابق کاری</span>
              </div>
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                مسیری که تا اینجا طی کردم
              </h2>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                هر پروژه یه چالش واقعی داشت؛ این‌ها نتیجه‌شونه.
              </p>
            </div>

            {/* 3 Key Timeline items */}
            <CinematicStagger className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.1}>
              {finalHomepageTimeline.map((item, idx) => (
                <CinematicItem key={idx} className="h-full">
                  <div
                    className={`p-6 rounded-[26px] flex flex-col justify-between h-full ${
                      isDark ? 'glass-card-dark' : 'glass-card-light'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-[#5ce1e6] font-mono">{item.year}</span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/10 text-slate-300">
                          {item.company}
                        </span>
                      </div>

                      <h3 className={`text-base font-black mb-2 ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                        {item.title}
                      </h3>

                      <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 text-[11px] font-bold text-emerald-400">
                      {item.achievement}
                    </div>
                  </div>
                </CinematicItem>
              ))}
            </CinematicStagger>

            {/* Other Collaborations simple row */}
            {otherCollaborations.length > 0 && (
              <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-bold ${
                isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="text-slate-400 font-medium">سایر همکاری‌ها:</span>
                {otherCollaborations.map((collab, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-white font-black">{collab.company}</span>
                    <span className="text-slate-400 text-[11px]">({collab.role})</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA to About */}
            <div className="text-center pt-2">
              <button
                onClick={() => onNavigate('about')}
                className={`px-6 py-3 rounded-2xl text-xs font-bold border transition-all inline-flex items-center gap-2 cursor-pointer hover:scale-105 ${
                  isDark ? 'bg-white/5 hover:bg-white/15 border-white/15 text-white' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                <span>مسیر کامل حرفه‌ای من</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </CinematicSection>
        );

      // 9. FINAL CTA
      case 'FINAL_CTA':
      case 'CTA':
        return (
          <CinematicSection variant="scale-up" showGlowBeam glowColor="purple" className="relative z-10" id="final-cta">
            <div className="p-8 sm:p-14 rounded-[36px] bg-gradient-to-r from-[#1a1240] via-[#2d1b5e] to-[#0f0a2e] border border-white/20 text-center space-y-6 shadow-[0_25px_70px_rgba(139,92,246,0.25)] relative overflow-hidden">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#8b5cf6]/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#4c8dff]/30 rounded-full blur-3xl pointer-events-none" />

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight max-w-2xl mx-auto">
                آماده‌ای مسیر رشد کسب‌وکارتو پیدا کنی؟
              </h2>

              <p className="text-slate-300 text-xs sm:text-base max-w-xl mx-auto">
                یه گفتگوی کوتاه کافیه تا دقیقاً بفهمیم از کجا باید شروع کنیم.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('contact')}
                  className="glow-btn px-8 py-4 rounded-2xl text-xs sm:text-sm font-black text-white inline-flex items-center gap-2.5 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
                >
                  <span>ببینیم کسب‌وکارتان به چی نیاز دارد</span>
                  <ArrowUpLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('portfolio')}
                  className="px-6 py-4 rounded-2xl text-xs sm:text-sm font-bold border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                >
                  <span>پروژه‌هایی که انجام دادم</span>
                </button>
              </div>
            </div>
          </CinematicSection>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-20 md:space-y-28 py-6">
      {homeSections.map((sec) => (
        <SectionWrapper key={sec.id} pageKey="home" sectionName={sec.name}>
          {renderSectionByName(sec.name)}
        </SectionWrapper>
      ))}
    </div>
  );
};
