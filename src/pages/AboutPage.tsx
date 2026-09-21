import React from 'react';
import { Theme, Page } from '../types';
import { useContent } from '../context/ContentContext';
import { EditableText } from '../components/cms/EditableText';
import { EditableImage } from '../components/cms/EditableImage';
import { SectionEditHeader } from '../components/cms/SectionEditHeader';
import { IconBadge3D } from '../components/3D/3DIconBadge';
import { PageHeader } from '../components/PageHeader';
import { CinematicSection, CinematicStagger, CinematicItem } from '../components/motion/CinematicSection';
import { 
  ArrowUpLeft, 
  Sparkles, 
  Target, 
  HeartHandshake, 
  GraduationCap, 
  Award, 
  Building2, 
  Briefcase 
} from 'lucide-react';

interface AboutPageProps {
  theme: Theme;
  onNavigate: (page: Page) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ theme, onNavigate }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();
  const personal = data.PERSONAL_INFO || {};
  const timeline = data.TIMELINE || [];
  const selectProjects = data.SELECT_PROJECTS || [];
  const otherCollaborations = data.OTHER_COLLABORATIONS || [];
  const educationAndCourses = data.EDUCATION_AND_COURSES || { education: [], courses: [] };

  return (
    <div className="space-y-20 py-4">
      {/* 1. Page Header */}
      <PageHeader
        theme={theme}
        page="about"
        title="امید عدلی هستم"
        subtitle="کسی که کمک می‌کنه فروشگاه‌ها آنلاین شروع کنن، بهتر بفروشن و رشد کنن."
        badgeText="درباره من"
        onNavigate={onNavigate}
      />

      {/* 2. Split Hero Section (Simplified Personal Introduction) */}
      <CinematicSection variant="scale" showGlowBeam glowColor="purple" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Profile Card / 3D Avatar Frame */}
        <div className="lg:col-span-5 relative">
          <div className={`p-8 rounded-[40px] border backdrop-blur-2xl relative z-10 transition-transform duration-500 hover:rotate-1 ${
            isDark ? 'bg-gradient-to-br from-[#1a1240]/90 to-[#2d1b5e]/90 border-white/20 shadow-2xl' : 'bg-white/90 border-slate-200 shadow-xl'
          }`}>
            <div className="relative mb-6">
              <EditableImage
                path="PERSONAL_INFO.avatar"
                src={personal.avatar || "/profile-photo-web.jpg"}
                alt={personal.name || "امید عدلی"}
                className="w-full h-80 object-cover object-top rounded-[28px] border-2 border-[#8b5cf6] shadow-lg"
              />
              <div className="absolute -bottom-4 -right-4">
                <IconBadge3D iconName="award" theme={theme} size="lg" glowColor="magenta" />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                <EditableText path="PERSONAL_INFO.name">{personal.name}</EditableText>
              </h2>
              <p className={`text-xs font-bold ${isDark ? 'text-[#5ce1e6]' : 'text-[#2563eb]'}`}>
                <EditableText path="PERSONAL_INFO.title">{personal.title}</EditableText>
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[11px] font-mono border ${
                  isDark ? 'bg-white/10 text-slate-300 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <EditableText path="PERSONAL_INFO.location">{personal.location}</EditableText>
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#4c8dff]/30 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Story & Focus */}
        <div className="lg:col-span-7 space-y-6 text-right">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#4c8dff]/20 to-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-xs font-black text-[#8b5cf6]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>معرفی من</span>
          </div>

          <h2 className={`text-3xl sm:text-5xl font-black leading-tight ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
            کمک می‌کنم مسیر رشد کسب‌وکارتون رو پیدا کنید
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <EditableText path="PERSONAL_INFO.shortBio" multiline>
              {personal.shortBio || "بیش از ۵ ساله که کنار فروشگاه‌ها و کسب‌وکارهای آنلاین هستم؛ از طراحی سایت و راه‌اندازی پیج گرفته تا تبلیغات، تحلیل رفتار مشتری و افزایش فروش. کاری که می‌کنم اینه که دقیق می‌بینم مشکل کجاست، و به‌جای حدس، با داده‌ی واقعی تصمیم می‌گیرم."}
            </EditableText>
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <span className="text-3xl font-black gradient-text dir-ltr block">
                <EditableText path="PERSONAL_INFO.experienceYears">{personal.experienceYears}</EditableText>
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>سال تجربه کاری</span>
            </div>
            <div>
              <span className="text-3xl font-black gradient-text dir-ltr block">
                <EditableText path="PERSONAL_INFO.campaignsCount">{personal.campaignsCount}</EditableText>
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>پروژه و کمپین اجراشده</span>
            </div>
          </div>
        </div>
      </CinematicSection>

      {/* 3, 4, 5. Three Narrative Philosophy Cards: What I Believe, How I Work, What I Care About */}
      <CinematicSection variant="fade-up" showGlowBeam glowColor="cyan" className="space-y-6">
        <CinematicStagger className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.12}>
          {/* Card 1: What I Believe (باور من) */}
          <CinematicItem className="h-full">
            <div className={`p-8 rounded-[36px] border space-y-4 flex flex-col justify-between h-full ${
              isDark ? 'glass-card-dark' : 'glass-card-light'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[#5ce1e6] uppercase tracking-wider px-3 py-1 rounded-full bg-[#5ce1e6]/10 border border-[#5ce1e6]/20">
                    باور من
                  </span>
                  <IconBadge3D iconName="target" theme={theme} size="sm" glowColor="cyan" floating={false} />
                </div>
                <h3 className={`text-lg sm:text-xl font-black leading-snug ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                  مارکتینگ فقط اجرای کمپین نیست؛ ساختن یه سیستم رشده
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  خیلی از کسب‌وکارها یه‌بار تبلیغ می‌کنن، یه‌بار محتوا می‌سازن، یه‌بار سایتشون رو عوض می‌کنن — ولی این کارها جدا از هم اثر زیادی ندارن. من باور دارم رشد واقعی وقتی اتفاق می‌افته که همه‌ی این تکه‌ها (سایت، محتوا، تبلیغات، تحلیل داده) با هم و در یه مسیر مشخص کار کنن.
                </p>
              </div>
            </div>
          </CinematicItem>

          {/* Card 2: How I Work (روش کار من) */}
          <CinematicItem className="h-full">
            <div className={`p-8 rounded-[36px] border space-y-4 flex flex-col justify-between h-full ${
              isDark ? 'glass-card-dark' : 'glass-card-light'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[#8b5cf6] uppercase tracking-wider px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
                    روش کار من
                  </span>
                  <IconBadge3D iconName="rocket" theme={theme} size="sm" glowColor="magenta" floating={false} />
                </div>
                <h3 className={`text-lg sm:text-xl font-black leading-snug ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                  همیشه اول می‌پرسم «مشکل واقعی کجاست؟»
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  قبل از اینکه پیشنهاد بدم چیکار کنیم، وقت می‌ذارم بفهمم دقیقاً کجای کسب‌وکارتون مشتری یا بودجه از دست می‌ره. تصمیم‌هام رو با داده‌ی واقعی می‌گیرم، نه با یه فرمول یکسان که برای همه استفاده می‌کنم. و همیشه نتیجه رو با عدد نشونتون می‌دم — نه فقط با حرف.
                </p>
              </div>
            </div>
          </CinematicItem>

          {/* Card 3: What I Care About (دغدغه من) */}
          <CinematicItem className="h-full">
            <div className={`p-8 rounded-[36px] border space-y-4 flex flex-col justify-between h-full ${
              isDark ? 'glass-card-dark' : 'glass-card-light'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
                    دغدغه من
                  </span>
                  <IconBadge3D iconName="award" theme={theme} size="sm" glowColor="gold" floating={false} />
                </div>
                <h3 className={`text-lg sm:text-xl font-black leading-snug ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
                  چیزی که برام مهمه
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  خیلی از صاحبان کسب‌وکار کوچیک، وقت و بودجه‌ی کافی برای فهمیدن دنیای پیچیده‌ی مارکتینگ دیجیتال ندارن. دغدغه‌ی من اینه که این دنیا رو براشون ساده کنم — بدون اصطلاح‌های پیچیده، بدون ادعای اضافه — و کمکشون کنم تصمیم‌های درست‌تری برای رشد کسب‌وکارشون بگیرن.
                </p>
              </div>
            </div>
          </CinematicItem>
        </CinematicStagger>
      </CinematicSection>

      {/* 6. Professional Career Timeline (Complete 7 items) */}
      <CinematicSection variant="fade-up" showGlowBeam glowColor="purple" className="space-y-12">
        <SectionEditHeader title="مسیر حرفه‌ای و تجربیات کاری" arrayPath="TIMELINE" />
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="text-xs font-extrabold text-[#8b5cf6] uppercase tracking-wider">مسیر حرفه‌ای</span>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
            پروژه‌هایی که تا اینجا روشون کار کردم
          </h2>
        </div>

        <CinematicStagger className="space-y-6 max-w-4xl mx-auto" staggerDelay={0.08}>
          {timeline.map((item, idx) => (
            <CinematicItem key={idx}>
              <div
                className={`p-8 rounded-[32px] transition-all duration-300 flex flex-col md:flex-row gap-6 relative ${
                  isDark ? 'glass-card-dark glass-card-dark-hover' : 'glass-card-light glass-card-light-hover'
                }`}
              >
                <div className="md:w-1/3 shrink-0">
                  <span className="px-4 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-[#8b5cf6] to-[#4c8dff] text-white inline-block">
                    {item.year}
                  </span>
                  <p className="text-xs font-bold text-[#5ce1e6] mt-2">{item.company}</p>
                </div>

                <div className="md:w-2/3 space-y-2">
                  <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>{item.title}</h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {item.description}
                  </p>
                  {item.achievement && (
                    <div className="pt-2 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {item.achievement}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CinematicItem>
          ))}
        </CinematicStagger>
      </CinematicSection>

      {/* 7. Select Projects & Other Collaborations (Secondary & Compact) */}
      <CinematicSection variant="fade-up" showGlowBeam glowColor="cyan" className="space-y-8">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="text-xs font-extrabold text-[#5ce1e6] uppercase tracking-wider">همکاری‌های دیگر</span>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
            چند پروژه و همکاری دیگه
          </h2>
        </div>

        <CinematicStagger className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto" staggerDelay={0.06}>
          {selectProjects.map((proj, idx) => (
            <CinematicItem key={idx}>
              <div
                className={`p-5 rounded-2xl border ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-black text-sm ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>{proj.title}</h3>
                  <span className="text-xs text-[#8b5cf6] font-mono">{proj.date}</span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{proj.desc}</p>
              </div>
            </CinematicItem>
          ))}
        </CinematicStagger>

        <div className="pt-4 text-center max-w-3xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2.5">
            {otherCollaborations.map((c, i) => (
              <span key={i} className={`px-4 py-2 rounded-2xl border text-xs font-bold ${
                isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>{c.company}</strong> ({c.role})
              </span>
            ))}
          </div>
        </div>
      </CinematicSection>

      {/* 8. Education & Courses */}
      <CinematicSection variant="fade-up" showGlowBeam glowColor="blue" className="space-y-8">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">تحصیلات و دوره‌ها</span>
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
            پیشینه‌ی تحصیلی و آموزشی
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Education */}
          <div className={`p-7 rounded-3xl border space-y-4 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
            <div className="flex items-center gap-3 text-[#5ce1e6]">
              <GraduationCap className="w-5 h-5" />
              <h3 className="font-black text-base">تحصیلات</h3>
            </div>
            {educationAndCourses.education.map((edu, idx) => (
              <div key={idx} className="space-y-1 border-t border-white/10 pt-4">
                <div className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{edu.title}</div>
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{edu.institute} · {edu.year}</p>
                <p className="text-xs font-bold text-emerald-400">{edu.grade}</p>
              </div>
            ))}
          </div>

          {/* Courses */}
          <div className={`p-7 rounded-3xl border space-y-4 ${isDark ? 'glass-card-dark' : 'glass-card-light'}`}>
            <div className="flex items-center gap-3 text-[#8b5cf6]">
              <Award className="w-5 h-5" />
              <h3 className="font-black text-base">دوره‌های تخصصی</h3>
            </div>
            <div className="space-y-3 border-t border-white/10 pt-4">
              {educationAndCourses.courses.map((crs, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                  <div>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>{crs.title}</span>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{crs.provider}</span>
                  </div>
                  <span className="text-[#5ce1e6] font-mono">{crs.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CinematicSection>

      {/* 9. Bottom Unified CTA Section */}
      <CinematicSection variant="scale" showGlowBeam glowColor="purple" className="text-center pt-6 space-y-4">
        <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-[#1a1240]'}`}>
          آماده‌ای با هم شروع کنیم؟
        </h3>
        <div>
          <button
            onClick={() => onNavigate('contact')}
            className="glow-btn px-10 py-5 rounded-full text-xs sm:text-sm font-black text-white inline-flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform"
          >
            <span>ببینیم کسب‌وکارتان به چی نیاز دارد</span>
            <ArrowUpLeft className="w-5 h-5" />
          </button>
        </div>
      </CinematicSection>
    </div>
  );
};
