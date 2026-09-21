import React from 'react';
import { motion } from 'motion/react';
import { Layers, ArrowRight } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { EditableText } from '../components/cms/EditableText';
import { SectionEditHeader } from '../components/cms/SectionEditHeader';
import { CinematicSection, CinematicStagger, CinematicItem } from '../components/motion/CinematicSection';
import { Page, Theme } from '../types';

interface ProjectsPageProps {
  theme?: Theme;
  onNavigate: (page: Page) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ theme = 'dark', onNavigate }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();
  const projectsData = data.PROJECTS_PAGE_DATA || {
    badge: 'وضعیت همکاری',
    headline: 'شفافیت درباره‌ی وضعیت همکاری‌ها و پروژه‌ها',
    subheadline: 'این صفحه نشون می‌ده الان چه پروژه‌هایی در جریانه و آیا ظرفیت برای پذیرش پروژه‌ی جدید هست یا نه.',
    capacityStatus: 'active',
    capacityText: 'در حال حاضر ظرفیت پذیرش پروژه‌ی جدید فعاله.',
    sectionTitle: 'وضعیت پروژه‌های جاری و سابق',
    portfolioHeadline: 'برای دیدن نمونه‌کارهای قبلی و نتایج واقعی',
    portfolioBody: 'پروژه‌های تکمیل‌شده‌ همراه با چالش، راهکار و نتیجه‌ی عددیشون توی بخش نمونه‌کارها موجوده.',
    portfolioCta: 'مشاهده کامل نمونه‌کارها'
  };
  const projectsList = data.ONGOING_PROJECTS || [];

  return (
    <div className="py-12 px-4 max-w-5xl mx-auto space-y-16">
      {/* 1. Hero / بنر وضعیت ظرفیت */}
      <CinematicSection 
        variant="fade-up"
        showGlowBeam
        glowColor="emerald"
        className="text-center space-y-6 max-w-3xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
          <Layers className="w-3.5 h-3.5" />
          <EditableText 
            path="PROJECTS_PAGE_DATA.badge" 
            defaultValue={projectsData.badge} 
            label="نشان بالای تیتر" 
          />
        </div>

        <h1 className={`text-3xl md:text-5xl font-bold tracking-tight leading-tight ${isDark ? 'text-slate-100' : 'text-[#1a1240]'}`}>
          <EditableText 
            path="PROJECTS_PAGE_DATA.headline" 
            defaultValue={projectsData.headline} 
            label="تیتر اصلی صفحه" 
          />
        </h1>

        <p className={`text-base md:text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <EditableText 
            path="PROJECTS_PAGE_DATA.subheadline" 
            defaultValue={projectsData.subheadline} 
            label="زیرتیتر توضیحی" 
            multiline 
          />
        </p>

        {/* Capacity Banner - کاملاً پویا و قابل ویرایش در CMS */}
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium text-sm shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <EditableText 
            path="PROJECTS_PAGE_DATA.capacityText" 
            defaultValue={projectsData.capacityText} 
            label="متن وضعیت ظرفیت پذیرش پروژه" 
          />
        </div>
      </CinematicSection>

      {/* 2. لیست پروژه‌های جاری و سابق */}
      <CinematicSection variant="fade-up" delay={0.1} className="space-y-8">
        <SectionEditHeader title="پروژه‌ها و وضعیت‌های جاری و سابق" arrayPath="ONGOING_PROJECTS" />
        <h2 className={`text-xl md:text-2xl font-bold border-r-4 border-cyan-500 pr-3 ${isDark ? 'text-slate-100' : 'text-[#1a1240]'}`}>
          <EditableText 
            path="PROJECTS_PAGE_DATA.sectionTitle" 
            defaultValue={projectsData.sectionTitle} 
            label="عنوان بخش پروژه‌ها" 
          />
        </h2>

        <CinematicStagger staggerDelay={0.12} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projectsList.map((proj, idx) => {
            const isOngoing = proj.status === 'در حال اجرا';
            return (
              <CinematicItem key={proj.id || idx}>
                <div
                  className={`h-full p-6 rounded-2xl border space-y-4 transition-all hover:border-cyan-500/40 shadow-lg ${
                    isDark ? 'glass-card-dark' : 'glass-card-light'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`font-bold text-base md:text-lg ${isDark ? 'text-slate-200' : 'text-[#1a1240]'}`}>
                      <EditableText path={`ONGOING_PROJECTS.${idx}.title`} defaultValue={proj.title} label="عنوان پروژه" />
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                      isOngoing 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      <EditableText path={`ONGOING_PROJECTS.${idx}.status`} defaultValue={proj.status} label="وضعیت" />
                    </span>
                  </div>

                  <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <EditableText path={`ONGOING_PROJECTS.${idx}.description`} defaultValue={proj.description} label="توضیحات پروژه" multiline />
                  </p>
                </div>
              </CinematicItem>
            );
          })}
        </CinematicStagger>
      </CinematicSection>

      {/* 3. لینک به Portfolio */}
      <CinematicSection
        variant="scale-up"
        delay={0.15}
        showGlowBeam
        glowColor="cyan"
        className={`p-8 md:p-10 rounded-3xl border text-center space-y-5 shadow-2xl ${
          isDark ? 'glass-card-dark' : 'glass-card-light'
        }`}
      >
        <h3 className={`text-lg md:text-xl font-bold ${isDark ? 'text-slate-100' : 'text-[#1a1240]'}`}>
          <EditableText 
            path="PROJECTS_PAGE_DATA.portfolioHeadline" 
            defaultValue={projectsData.portfolioHeadline} 
            label="تیتر بخش نمونه‌کارها" 
          />
        </h3>
        <p className={`text-sm md:text-base max-w-2xl mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <EditableText 
            path="PROJECTS_PAGE_DATA.portfolioBody" 
            defaultValue={projectsData.portfolioBody} 
            label="متن توضیحی بخش نمونه‌کارها" 
            multiline 
          />
        </p>
        <div className="pt-2">
          <button
            onClick={() => onNavigate('portfolio')}
            className="glow-btn px-7 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white inline-flex items-center gap-2 cursor-pointer shadow-xl transition-transform hover:scale-[1.03]"
          >
            <span>
              <EditableText 
                path="PROJECTS_PAGE_DATA.portfolioCta" 
                defaultValue={projectsData.portfolioCta} 
                label="متن دکمه نمونه‌کارها" 
              />
            </span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </CinematicSection>
    </div>
  );
};
