import React, { useState, useRef } from 'react';
import { Theme, Page, CaseStudy } from '../types';
import { useContent } from '../context/ContentContext';
import { EditableText } from '../components/cms/EditableText';
import { RepeaterControls } from '../components/cms/RepeaterControls';
import { SectionEditHeader } from '../components/cms/SectionEditHeader';
import { SectionWrapper } from '../components/cms/SectionWrapper';
import { IsometricDashboard } from '../components/3D/IsometricDashboard';
import { TiltCard } from '../components/3D/TiltCard';
import {
  ChevronLeft,
  ChevronRight,
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
  Award,
  Code,
  Megaphone,
  Laptop,
  Star,
  Send,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HomePageProps {
  theme: Theme;
  onNavigate: (page: Page) => void;
  onSelectCaseStudy: (caseStudy: CaseStudy) => void;
}

/* ------------------------------------------------------------------ */
/*  Icon helpers                                                       */
/* ------------------------------------------------------------------ */
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  code: Code,
  sparkles: Sparkles,
  megaphone: Megaphone,
  rocket: Rocket,
  target: Target,
  chart: LineChart,
  laptop: Laptop,
  'trending-up': TrendingUp,
  award: Award,
  layers: Layers,
  'message-circle': MessageCircle,
  'clipboard-check': ClipboardCheck,
  briefcase: Briefcase,
};

const iconFor = (name: string) => ICON_MAP[name] || Sparkles;

/* Soft pastel tints cycled across cards — calm, professional palette */
const TINTS = [
  { bg: 'var(--nd-accent-soft)', fg: '#4f46e5' },
  { bg: 'var(--nd-sky-soft)', fg: '#1d6fd8' },
  { bg: 'var(--nd-mint-soft)', fg: '#0f9d6e' },
  { bg: 'var(--nd-peach-soft)', fg: '#d97706' },
];

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */
const SectionHead: React.FC<{
  eyebrow: string;
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  align?: 'center' | 'start';
}> = ({ eyebrow, icon, title, desc, align = 'center' }) => (
  <div className={`${align === 'center' ? 'text-center mx-auto' : 'text-right'} max-w-2xl space-y-4`}>
    <span className="nd-eyebrow">
      {icon}
      <span>{eyebrow}</span>
    </span>
    <h2 className="nd-h2 text-2xl sm:text-3xl lg:text-[2.6rem]">{title}</h2>
    {desc && <p className="nd-muted text-sm sm:text-base leading-relaxed">{desc}</p>}
  </div>
);

const IconTile: React.FC<{ name: string; tint: { bg: string; fg: string }; size?: 'sm' | 'md' }> = ({
  name,
  tint,
  size = 'md',
}) => {
  const Icon = iconFor(name);
  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl ${size === 'md' ? 'w-12 h-12' : 'w-10 h-10'}`}
      style={{ background: tint.bg, color: tint.fg }}
    >
      <Icon className={size === 'md' ? 'w-6 h-6' : 'w-5 h-5'} />
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  HomePage                                                           */
/* ------------------------------------------------------------------ */
export const HomePage: React.FC<HomePageProps> = ({ theme, onNavigate, onSelectCaseStudy }) => {
  const { data } = useContent();

  const [activeServiceTab, setActiveServiceTab] = useState<'start' | 'sell' | 'grow'>('sell');
  const [promptValue, setPromptValue] = useState('');
  const servicesSectionRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const personal = data.PERSONAL_INFO;
  const stats = data.STATS || [];
  const services = data.SERVICES || [];
  const caseStudies = data.CASE_STUDIES || [];
  const testimonials = data.TESTIMONIALS || [];
  const howIWork = data.HOMEPAGE_HOW_I_WORK_STEPS || data.HOW_I_WORK_STEPS || [];
  const timeline = data.TIMELINE || [];
  const otherCollaborations = data.OTHER_COLLABORATIONS || [];
  const whyOmidPoints = data.WHY_OMID_POINTS || [];
  const skills = data.SKILLS_TOOLS || [];
  const homeSections = data.PAGE_SECTIONS['home'] || [];

  const featuredStudies = (caseStudies.filter((c) => c.featured).length ? caseStudies.filter((c) => c.featured) : caseStudies).slice(0, 6);
  const homepageStudies = featuredStudies.slice(0, 4);
  const homepageTimeline = timeline.slice(0, 4);

  const handlePathNavClick = (tab: 'start' | 'sell' | 'grow') => {
    setActiveServiceTab(tab);
    servicesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollCarousel = (dir: 1 | -1) => {
    const el = carouselRef.current;
    if (!el) return;
    // RTL: next items live to the left → negative scrollLeft
    el.scrollBy({ left: dir * -1 * (el.clientWidth * 0.75), behavior: 'smooth' });
  };

  const handlePromptSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onNavigate('contact');
  };

  /* 3-path navigation cards (copy preserved) */
  const pathCards = [
    {
      id: 'start' as const,
      tag: 'مسیر ۱',
      title: 'تازه می‌خوام شروع کنم',
      desc: 'هنوز سایت یا پیج فعالی ندارم، یا تازه راه افتادم و نمی‌دونم از کجا شروع کنم.',
      cta: 'ببین از کجا شروع کنیم',
      iconName: 'sparkles',
    },
    {
      id: 'sell' as const,
      tag: 'مسیر ۲',
      title: 'فروش دارم ولی می‌خوام بیشتر بفروشم',
      desc: 'سایت یا پیج دارم، بازدید هم میاد، ولی فروش اونی نیست که باید باشه.',
      cta: 'ببین مشکل کجاست',
      iconName: 'target',
      isFeatured: true,
    },
    {
      id: 'grow' as const,
      tag: 'مسیر ۳',
      title: 'فروش دارم و می‌خوام رشدش بدم',
      desc: 'همه‌چیز کار می‌کنه، ولی می‌خوام سیستم رشدم رو قوی‌تر و مقیاس‌پذیرتر کنم.',
      cta: 'ببین چطور رشد کنیم',
      iconName: 'rocket',
    },
  ];

  const tabConfig = {
    start: {
      label: 'شروع کنیم',
      tagline: 'هنوز آنلاین شروع نکرده‌اید؟ از صفر کنارتان هستم.',
      serviceIds: ['web-app-design', 'ui-ux-design', 'social-media-strategy'],
      ctaText: 'ببینیم دقیقاً چی نیاز داری',
      icon: Sparkles,
    },
    sell: {
      label: 'بهتر بفروشیم',
      tagline: 'آنلاین هستید، اما فروش آن چیزی نیست که باید باشد؟ با هم پیدا می‌کنیم مشکل کجاست.',
      serviceIds: ['performance-marketing', 'cro-optimization', 'tracking-analytics'],
      ctaText: 'ببینیم دقیقاً چی نیاز داری',
      icon: Target,
    },
    grow: {
      label: 'رشد کنیم',
      tagline: 'فروش دارید؟ حالا وقت مقیاس‌پذیر کردن و رشد پایدار است.',
      serviceIds: ['seo-growth', 'growth-strategy', 'marketing-automation', 'retention-strategy'],
      ctaText: 'ببینیم دقیقاً چی نیاز داری',
      icon: Rocket,
    },
  } as const;

  const promptSuggestions = [
    'نرخ تبدیل سایتم رو بیشتر کن',
    'بودجه تبلیغاتم هدر می‌ره',
    'می‌خوام رتبه ۱ گوگل بشم',
    'سایت ندارم؛ از صفر شروع کنم',
  ];

  /* ---------------------------------------------------------------- */
  const renderSectionByName = (secName: string) => {
    switch (secName) {
      /* ============ 1. HERO ============ */
      case 'HERO':
        return (
          <section id="hero-section" className="relative pt-2 sm:pt-6 pb-8">
            <div className="text-center max-w-4xl mx-auto space-y-7">
              {/* Trust pill */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="nd-glass inline-flex items-center gap-3 rounded-full ps-2 pe-4 py-1.5"
              >
                <span className="flex">
                  <img
                    src={personal.avatar}
                    alt={personal.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-white"
                  />
                  <span className="-ms-2 w-7 h-7 rounded-full ring-2 ring-white grid place-items-center text-[10px] font-black text-white" style={{ background: 'var(--nd-accent)' }}>
                    ۵+
                  </span>
                </span>
                <span className="text-xs font-extrabold text-[color:var(--nd-ink-2)]">
                  مورد اعتماد برندها و تیم‌های رشد · {personal.experienceYears} تجربه
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[color:var(--nd-success)]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {personal.availability}
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="nd-h1 text-[2.1rem] leading-[1.25] sm:text-5xl sm:leading-[1.2] lg:text-[3.6rem] lg:leading-[1.16]"
              >
                فروشگاهتان را آنلاین شروع کنید،{' '}
                <span className="relative inline-block text-[color:var(--nd-accent)]">
                  بهتر بفروشید
                  <svg viewBox="0 0 200 12" className="absolute -bottom-1 right-0 w-full h-2.5 text-[color:var(--nd-accent)] opacity-30" preserveAspectRatio="none" aria-hidden>
                    <path d="M2 9 C 60 2, 140 2, 198 8" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                </span>{' '}
                و رشد کنید.
              </motion.h1>

              {/* Sub headline */}
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="nd-muted text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto"
              >
                فرقی نمی‌کنه تازه می‌خواید وارد دنیای آنلاین بشید یا همین حالا فروشگاه و سایت دارید؛ از طراحی سایت و راه‌اندازی پیج و محتوا تا تبلیغات، تحلیل و افزایش فروش، کمکتون می‌کنم مسیر درست رشدتون رو پیدا کنید و اجراش کنید.
              </motion.p>

              {/* Prompt box — Webild-style interactive entry point */}
              <motion.form
                onSubmit={handlePromptSubmit}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="nd-glass rounded-[26px] p-3 sm:p-4 max-w-2xl mx-auto text-right"
              >
                <div className="flex items-center gap-3 px-2 sm:px-3 pt-2 pb-3">
                  <Search className="w-5 h-5 shrink-0 text-[color:var(--nd-faint)]" />
                  <input
                    value={promptValue}
                    onChange={(e) => setPromptValue(e.target.value)}
                    placeholder="نیازت رو بنویس؛ مثلاً: بازدید میاد ولی فروش نه…"
                    className="w-full bg-transparent text-sm sm:text-base font-medium text-[color:var(--nd-ink)] placeholder:text-[color:var(--nd-faint)] focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--nd-line)] pt-3 px-1">
                  {promptSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPromptValue(s)}
                      className="nd-chip hover:border-[rgba(79,70,229,0.35)] hover:text-[color:var(--nd-accent)] transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                  <button type="submit" className="nd-btn nd-btn-accent ms-auto px-5 py-2.5 text-xs sm:text-sm">
                    <span>تحلیل رایگان نیازت</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.form>

              {/* Secondary CTAs + proof micro-list */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.32 }}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button onClick={() => onNavigate('portfolio')} className="nd-btn nd-btn-ghost px-6 py-3 text-xs sm:text-sm">
                    <span>پروژه‌هایی که انجام دادم</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => onNavigate('services')} className="nd-btn nd-btn-ghost px-6 py-3 text-xs sm:text-sm">
                    <span>خدمات و پکیج‌ها</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-xs font-bold text-[color:var(--nd-faint)]">
                  <span>طراحی سایت</span>
                  <span>·</span>
                  <span>محتوا و شبکه‌های اجتماعی</span>
                  <span>·</span>
                  <span>تبلیغات</span>
                  <span>·</span>
                  <span>تحلیل و بهینه‌سازی فروش</span>
                </div>
              </motion.div>
            </div>

            {/* Product showcase — framed dashboard with floating proof chips */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-5xl mx-auto mt-14 sm:mt-20"
            >
              <div className="nd-card overflow-hidden rounded-[28px] sm:rounded-[36px] p-3 sm:p-5">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-3 pb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  <span className="ms-3 flex-1 h-7 rounded-full bg-[color:var(--nd-bg)] border border-[color:var(--nd-line)] grid place-items-center text-[10px] font-bold text-[color:var(--nd-faint)] dir-ltr">
                    {personal.website}
                  </span>
                </div>
                <div className="rounded-[20px] sm:rounded-[26px] bg-gradient-to-b from-[#f4f3ff] to-[#eef4ff] border border-[color:var(--nd-line)] overflow-hidden">
                  <IsometricDashboard theme="light" />
                </div>
              </div>

              {/* Floating metric chips */}
              {stats.slice(0, 3).map((s, i) => (
                <div
                  key={i}
                  className={`nd-glass absolute hidden lg:flex items-center gap-2.5 rounded-2xl px-4 py-3 ${i === 0 ? '-right-8 top-10 nd-float' : i === 1 ? '-left-10 top-1/3 nd-float-slow' : '-right-4 bottom-12 nd-float-slow'}`}
                  style={{ animationDelay: `${i * 1.3}s` }}
                >
                  <IconTile name={s.icon} tint={TINTS[i % TINTS.length]} size="sm" />
                  <span>
                    <span className="block text-sm font-black text-[color:var(--nd-ink)] dir-ltr text-right">{s.value}</span>
                    <span className="block text-[10px] font-bold text-[color:var(--nd-muted)]">{s.label}</span>
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Intro statement */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="nd-card max-w-3xl mx-auto mt-12 sm:mt-16 p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5"
            >
              <img src={personal.avatar} alt={personal.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm shrink-0" />
              <p className="text-sm sm:text-base leading-relaxed text-[color:var(--nd-ink-2)]">
                <span className="font-black text-[color:var(--nd-accent)] ml-1">من امید عدلی هستم؛</span>
                متخصص رشد دیجیتال برای فروشگاه‌ها. کمک می‌کنم بفهمید مشتری‌ها کجا شما را پیدا می‌کنند، چرا بعضی‌ها خرید می‌کنند و بعضی‌ها نه، و برای بهتر شدن فروش باید دقیقاً روی چه چیزی کار کنید.
              </p>
            </motion.div>
          </section>
        );

      /* ============ 2. PATH NAV ============ */
      case 'PATH_NAV':
        return (
          <section id="path-navigation" className="py-14 sm:py-20 space-y-10">
            <SectionHead
              eyebrow="مسیریابی سه‌گانه"
              icon={<Layers className="w-3.5 h-3.5" />}
              title="الان کسب‌وکارت کجای این مسیره؟"
              desc="روی همونی که به شرایط الانت نزدیک‌تره بزن، تا دقیقاً همون چیزی رو ببینی که بهش نیاز داری."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {pathCards.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full"
                >
                  <TiltCard maxTilt={4} glowColor="rgba(79, 70, 229, 0.12)">
                    <button
                      onClick={() => handlePathNavClick(p.id)}
                      className={`nd-card nd-card-hover w-full h-full p-7 text-right flex flex-col justify-between gap-6 cursor-pointer relative overflow-hidden ${
                        p.isFeatured ? 'ring-2 ring-[rgba(79,70,229,0.35)]' : ''
                      }`}
                    >
                      {p.isFeatured && (
                        <span className="absolute top-5 left-5 nd-eyebrow bg-[color:var(--nd-mint-soft)] text-[color:var(--nd-success)] border-transparent">
                          پرترین انتخاب
                        </span>
                      )}
                      <span className="flex items-start justify-between gap-4">
                        <IconTile name={p.iconName} tint={TINTS[i % TINTS.length]} />
                        <span className="nd-chip">{p.tag}</span>
                      </span>
                      <span className="block">
                        <span className="block nd-h2 text-lg sm:text-xl mb-2.5">{p.title}</span>
                        <span className="block nd-muted text-xs sm:text-sm leading-relaxed">{p.desc}</span>
                      </span>
                      <span className="flex items-center justify-between pt-4 border-t border-[color:var(--nd-line)] text-xs font-extrabold text-[color:var(--nd-accent)]">
                        <span>{p.cta}</span>
                        <ChevronLeft className="w-4 h-4" />
                      </span>
                    </button>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </section>
        );

      /* ============ 3. STATS ============ */
      case 'STATS':
        return (
          <section id="stats-section" className="py-14 sm:py-20 space-y-10">
            <SectionEditHeader title="آمار و شاخص‌های کلیدی" arrayPath="STATS" />
            <SectionHead
              eyebrow="نتایج واقعی"
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              title="نتیجه‌هایی که تا الان گرفتم"
              desc="این‌ها فقط عدد نیستن؛ نتیجه‌ی کار روی کسب‌وکارهای واقعیه."
            />
            <div className="nd-card rounded-[28px] sm:rounded-[32px] p-6 sm:p-10 grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="relative text-center lg:text-right space-y-1.5">
                  <RepeaterControls arrayPath="STATS" index={idx} totalCount={stats.length} className="absolute top-0 left-0" />
                  <div className="text-3xl sm:text-4xl font-black text-[color:var(--nd-accent)] dir-ltr text-center lg:text-right">
                    <EditableText path={`STATS.${idx}.value`}>{stat.value}</EditableText>
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm text-[color:var(--nd-ink)]">
                    <EditableText path={`STATS.${idx}.label`}>{stat.label}</EditableText>
                  </div>
                  <div className="text-[11px] font-medium text-[color:var(--nd-faint)]">
                    <EditableText path={`STATS.${idx}.subtext`}>{stat.subtext}</EditableText>
                  </div>
                </div>
              ))}
            </div>

            {/* Tools marquee */}
            {skills.length > 0 && (
              <div className="nd-marquee overflow-hidden py-2 [mask-image:linear-gradient(to_left,transparent,black_12%,black_88%,transparent)]">
                <div className="nd-marquee-track gap-3">
                  {[...skills, ...skills].map((t, i) => (
                    <span key={i} className="nd-chip py-2 px-4 text-[11px] whitespace-nowrap dir-ltr">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        );

      /* ============ 4. SERVICES TABS ============ */
      case 'SERVICES_TABS':
      case 'SERVICES': {
        const currentTab = tabConfig[activeServiceTab];
        const currentServices = services.filter((s) => (currentTab.serviceIds as readonly string[]).includes(s.id));
        const TabIcon = currentTab.icon;
        return (
          <section id="services-tabs" className="py-14 sm:py-20 space-y-10">
            <div ref={servicesSectionRef} className="space-y-10 scroll-mt-28">
              <SectionHead
                eyebrow="خدمات تخصصی"
                icon={<Layers className="w-3.5 h-3.5" />}
                title="خدماتی که در هر مرحله از مسیر بهت کمک می‌کنن"
                desc="از شروع آنلاین تا رشد فروش، هر بخش رو می‌تونی جدا یا در کنار هم داشته باشی."
              />

              {/* Segmented tabs */}
              <div className="flex justify-center">
                <div className="nd-glass inline-flex p-1.5 rounded-full gap-1">
                  {(['start', 'sell', 'grow'] as const).map((tabKey) => {
                    const cfg = tabConfig[tabKey];
                    const Icon = cfg.icon;
                    const isActive = activeServiceTab === tabKey;
                    return (
                      <button
                        key={tabKey}
                        onClick={() => setActiveServiceTab(tabKey)}
                        className={`px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                          isActive ? 'bg-[color:var(--nd-ink)] text-white shadow-sm' : 'text-[color:var(--nd-muted)] hover:text-[color:var(--nd-ink)]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeServiceTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-8"
                >
                  <p className="text-center text-xs sm:text-sm font-bold text-[color:var(--nd-ink-2)] bg-[color:var(--nd-accent-soft)] border border-[rgba(79,70,229,0.12)] rounded-full px-5 py-3 max-w-xl mx-auto flex items-center gap-2 justify-center">
                    <TabIcon className="w-4 h-4 text-[color:var(--nd-accent)]" />
                    {currentTab.tagline}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {currentServices.map((srv, idx) => (
                      <motion.div
                        key={srv.id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full"
                      >
                        <div className="nd-card nd-card-hover p-7 h-full flex flex-col justify-between gap-6 group">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <IconTile name={srv.iconName} tint={TINTS[idx % TINTS.length]} />
                              <span className="text-[11px] font-black text-[color:var(--nd-faint)] dir-ltr">0{idx + 1}</span>
                            </div>
                            <h3 className="nd-h2 text-base sm:text-lg">{srv.title}</h3>
                            <p className="nd-muted text-xs sm:text-sm leading-relaxed">{srv.shortDesc}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(srv.tags || []).slice(0, 3).map((t) => (
                                <span key={t} className="nd-chip dir-ltr">{t}</span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => onNavigate('services')}
                            className="w-full py-3 rounded-full border border-[color:var(--nd-line-strong)] text-xs font-extrabold text-[color:var(--nd-ink-2)] hover:bg-[color:var(--nd-ink)] hover:text-white hover:border-[color:var(--nd-ink)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>مشاهده جزئیات کامل</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="text-center">
                <button onClick={() => onNavigate('contact')} className="nd-btn nd-btn-accent px-8 py-4 text-xs sm:text-sm">
                  <span>{currentTab.ctaText}</span>
                  <ArrowUpLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        );
      }

      /* ============ 5. CASE STUDIES ============ */
      case 'CASE_STUDIES':
      case 'PORTFOLIO':
        return (
          <section id="case-studies" className="py-14 sm:py-20 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="space-y-4 max-w-xl">
                <span className="nd-eyebrow">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>پروژه‌های واقعی</span>
                </span>
                <h2 className="nd-h2 text-2xl sm:text-3xl lg:text-[2.6rem]">چند نمونه از پروژه‌هایی که روشون کار کردم</h2>
                <p className="nd-muted text-sm sm:text-base leading-relaxed">از فروشگاه‌های کوچیک تا برندهای بزرگ‌تر — هرکدوم یه چالش متفاوت داشتن.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex gap-2">
                  <button onClick={() => scrollCarousel(-1)} aria-label="قبلی" className="nd-btn nd-btn-ghost w-11 h-11">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button onClick={() => scrollCarousel(1)} aria-label="بعدی" className="nd-btn nd-btn-ghost w-11 h-11">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                <button onClick={() => onNavigate('portfolio')} className="nd-btn nd-btn-ghost px-5 py-3 text-xs font-extrabold">
                  <span>همه‌ی نمونه‌کارها</span>
                </button>
              </div>
            </div>

            <div ref={carouselRef} className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {homepageStudies.map((study, idx) => (
                <motion.button
                  key={study.id || idx}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => onSelectCaseStudy(study)}
                  className="nd-card nd-card-hover snap-start shrink-0 w-[86vw] sm:w-[420px] text-right overflow-hidden group cursor-pointer flex flex-col"
                >
                  {/* Cover */}
                  <div
                    className="relative h-40 sm:h-44 flex items-center justify-center overflow-hidden"
                    style={{ background: `linear-gradient(140deg, ${study.heroColor}18, ${study.heroColor}30)` }}
                  >
                    <span className="w-16 h-16 rounded-3xl grid place-items-center shadow-sm" style={{ background: `${study.heroColor}22`, color: study.heroColor }}>
                      {React.createElement(iconFor(study.thumbnailIcon), { className: 'w-7 h-7' })}
                    </span>
                    <span className="absolute top-4 right-4 nd-chip bg-white/80 backdrop-blur">{study.industryFa}</span>
                    <span className="absolute bottom-4 left-4 text-[10px] font-bold text-[color:var(--nd-muted)]">{study.client}</span>
                  </div>
                  {/* Body */}
                  <div className="p-6 sm:p-7 flex flex-col gap-4 grow">
                    <h3 className="nd-h2 text-base sm:text-lg leading-snug">{study.title}</h3>
                    <p className="nd-muted text-xs leading-relaxed line-clamp-2">{study.summary}</p>
                    <div className="mt-auto grid grid-cols-3 gap-2">
                      {(study.metricsComparison || []).slice(0, 3).map((m, mi) => (
                        <div key={mi} className="rounded-2xl bg-[color:var(--nd-bg)] border border-[color:var(--nd-line)] px-2 py-2.5 text-center">
                          <span className="block text-sm font-black text-[color:var(--nd-accent)] dir-ltr">{m.growth}</span>
                          <span className="block text-[9px] font-bold text-[color:var(--nd-faint)] leading-tight mt-1 line-clamp-1">{m.label}</span>
                        </div>
                      ))}
                    </div>
                    <span className="flex items-center justify-between pt-3 border-t border-[color:var(--nd-line)] text-xs font-extrabold text-[color:var(--nd-accent)]">
                      <span>دیدن کامل این پروژه</span>
                      <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        );

      /* ============ 6. HOW I WORK ============ */
      case 'HOW_I_WORK':
        return (
          <section id="how-i-work" className="py-14 sm:py-20 space-y-12">
            <SectionHead
              eyebrow="فرآیند شفاف"
              icon={<ClipboardCheck className="w-3.5 h-3.5" />}
              title="همکاری با من چطور پیش می‌ره؟"
              desc="یه فرآیند ساده و شفاف، از اولین گفتگو تا نتیجه‌ی قابل‌اندازه‌گیری."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
              {howIWork.map((stepItem, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.55, delay: idx * 0.09, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <div className="nd-card p-7 h-full flex flex-col gap-5 nd-card-hover">
                    <div className="flex items-center justify-between">
                      <span className="w-11 h-11 rounded-full grid place-items-center text-sm font-black text-white" style={{ background: 'var(--nd-ink)' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <IconTile name={stepItem.icon} tint={TINTS[idx % TINTS.length]} size="sm" />
                    </div>
                    <div className="space-y-2.5">
                      <h3 className="nd-h2 text-base">{stepItem.title}</h3>
                      <p className="nd-muted text-xs leading-relaxed">{stepItem.desc}</p>
                    </div>
                  </div>
                  {idx < howIWork.length - 1 && (
                    <span className="hidden lg:block absolute top-1/2 -left-5 w-5 border-t-2 border-dashed border-[color:var(--nd-line-strong)]" aria-hidden />
                  )}
                </motion.div>
              ))}
            </div>
            <div className="text-center">
              <button onClick={() => onNavigate('contact')} className="nd-btn px-8 py-4 text-xs sm:text-sm">
                <span>بیایید گفتگوی اولیه رو شروع کنیم</span>
                <ArrowUpLeft className="w-4 h-4" />
              </button>
            </div>
          </section>
        );

      /* ============ 7. WHY OMID ============ */
      case 'WHY_OMID':
        return (
          <section id="why-omid" className="py-14 sm:py-20">
            <div className="nd-panel rounded-[32px] sm:rounded-[40px] p-7 sm:p-14 space-y-10">
              <SectionHead
                eyebrow="تمایز و رویکرد"
                icon={<Target className="w-3.5 h-3.5" />}
                title="چرا با من کار کنید؟"
                desc="چون به‌جای اجرای پراکنده، به کسب‌وکارتون به چشم یه سیستم کامل نگاه می‌کنم."
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {whyOmidPoints.map((item: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.55, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="bg-white/70 backdrop-blur rounded-[24px] border border-white/80 p-7 space-y-4 h-full"
                  >
                    <IconTile name={item.icon} tint={TINTS[idx % TINTS.length]} />
                    <h3 className="nd-h2 text-base sm:text-lg">{item.title}</h3>
                    <p className="nd-muted text-xs sm:text-sm leading-relaxed">{item.description || item.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* Testimonial */}
              {testimonials[0] && (
                <div className="bg-white rounded-[28px] border border-[color:var(--nd-line)] shadow-sm p-7 sm:p-9 flex flex-col sm:flex-row gap-6 items-start max-w-4xl mx-auto">
                  <Quote className="w-8 h-8 text-[color:var(--nd-accent)] opacity-40 shrink-0 rotate-180" />
                  <div className="space-y-4">
                    <p className="text-sm sm:text-base leading-relaxed font-medium text-[color:var(--nd-ink-2)]">{testimonials[0].quote}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <img src={testimonials[0].avatarUrl} alt={testimonials[0].clientName} className="w-10 h-10 rounded-full object-cover" />
                      <span>
                        <span className="block text-xs font-black text-[color:var(--nd-ink)]">{testimonials[0].clientName} — {testimonials[0].company}</span>
                        <span className="block text-[11px] font-bold text-[color:var(--nd-faint)]">{testimonials[0].clientRole}</span>
                      </span>
                      <span className="ms-auto flex items-center gap-1 text-[color:#f59e0b]">
                        {Array.from({ length: testimonials[0].rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        );

      /* ============ 8. EXPERIENCE ============ */
      case 'EXPERIENCE':
        return (
          <section id="experience" className="py-14 sm:py-20 space-y-10">
            <SectionHead
              eyebrow="سوابق کاری"
              icon={<Briefcase className="w-3.5 h-3.5" />}
              title="مسیری که تا اینجا طی کردم"
              desc="هر پروژه یه چالش واقعی داشت؛ این‌ها نتیجه‌شونه."
            />
            <div className="max-w-3xl mx-auto relative">
              <span className="absolute top-2 bottom-2 right-[19px] w-px bg-[color:var(--nd-line-strong)]" aria-hidden />
              <div className="space-y-6">
                {homepageTimeline.map((item: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.55, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="relative pr-14"
                  >
                    <span className="absolute right-2.5 top-7 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-[color:var(--nd-accent)]" aria-hidden />
                    <div className="nd-card p-6 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="nd-chip bg-[color:var(--nd-accent-soft)] text-[color:var(--nd-accent)] border-transparent">{item.year}</span>
                        <span className="nd-chip">{item.company}</span>
                      </div>
                      <h3 className="nd-h2 text-base">{item.title}</h3>
                      <p className="nd-muted text-xs leading-relaxed">{item.description}</p>
                      <p className="text-[11px] font-extrabold text-[color:var(--nd-success)] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.achievement}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {otherCollaborations.length > 0 && (
              <div className="nd-card rounded-full px-6 py-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-xs font-bold max-w-3xl mx-auto">
                <span className="text-[color:var(--nd-faint)] font-medium">سایر همکاری‌ها:</span>
                {otherCollaborations.map((collab: any, idx: number) => (
                  <span key={idx} className="flex items-center gap-1.5">
                    <span className="font-black text-[color:var(--nd-ink)]">{collab.company}</span>
                    <span className="text-[color:var(--nd-faint)] text-[11px]">({collab.role})</span>
                  </span>
                ))}
              </div>
            )}

            <div className="text-center">
              <button onClick={() => onNavigate('about')} className="nd-btn nd-btn-ghost px-6 py-3 text-xs font-extrabold">
                <span>مسیر کامل حرفه‌ای من</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </section>
        );

      /* ============ 9. FINAL CTA ============ */
      case 'FINAL_CTA':
      case 'CTA':
        return (
          <section id="final-cta" className="py-14 sm:py-20">
            <div className="nd-panel relative overflow-hidden rounded-[32px] sm:rounded-[44px] p-9 sm:p-16 text-center space-y-6">
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/50 blur-3xl pointer-events-none" aria-hidden />
              <div className="absolute -bottom-28 -right-20 w-72 h-72 rounded-full bg-white/40 blur-3xl pointer-events-none" aria-hidden />
              <h2 className="nd-h1 relative text-2xl sm:text-4xl lg:text-[3rem] max-w-2xl mx-auto">آماده‌ای مسیر رشد کسب‌وکارتو پیدا کنی؟</h2>
              <p className="relative nd-muted text-sm sm:text-base max-w-xl mx-auto">یه گفتگوی کوتاه کافیه تا دقیقاً بفهمیم از کجا باید شروع کنیم.</p>
              <div className="relative flex flex-wrap items-center justify-center gap-3 pt-2">
                <button onClick={() => onNavigate('contact')} className="nd-btn nd-btn-accent px-8 py-4 text-xs sm:text-sm">
                  <span>ببینیم کسب‌وکارتان به چی نیاز دارد</span>
                  <ArrowUpLeft className="w-4 h-4" />
                </button>
                <a href={personal.whatsappUrl} target="_blank" rel="noreferrer" className="nd-btn nd-btn-ghost px-6 py-4 text-xs sm:text-sm">
                  <MessageCircle className="w-4 h-4 text-[color:var(--nd-success)]" />
                  <span>گفتگو در واتساپ</span>
                </a>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 md:space-y-10 py-4">
      {homeSections.map((sec) => (
        <SectionWrapper key={sec.id} pageKey="home" sectionName={sec.name}>
          {renderSectionByName(sec.name)}
        </SectionWrapper>
      ))}
    </div>
  );
};
