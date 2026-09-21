import React from 'react';
import { motion } from 'motion/react';
import { Package, Target, BarChart, Monitor, Rocket, ArrowLeft } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { EditableText } from '../components/cms/EditableText';
import { SectionEditHeader } from '../components/cms/SectionEditHeader';
import { CinematicSection, CinematicStagger, CinematicItem } from '../components/motion/CinematicSection';
import { Page, Theme } from '../types';

interface ProductsPageProps {
  theme?: Theme;
  onNavigate: (page: Page) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ theme = 'dark', onNavigate }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();
  const pageData = data.PRODUCTS_PAGE_DATA || {
    badge: 'ابزارها و محصولات کاربردی',
    headline: 'راه‌حل‌های آماده، برای شروع سریع‌تر',
    subheadline: 'چند ابزار، قالب و جلسه‌ی تخصصی برای کسانی که می‌خوان سریع‌تر دست به کار بشن.'
  };
  const productsList = data.PRODUCTS || [];

  const getIcon = (name: string) => {
    switch (name) {
      case 'target': return <Target className="w-6 h-6 text-cyan-400" />;
      case 'chart': return <BarChart className="w-6 h-6 text-blue-400" />;
      case 'laptop': return <Monitor className="w-6 h-6 text-purple-400" />;
      default: return <Rocket className="w-6 h-6 text-emerald-400" />;
    }
  };

  return (
    <div className="py-12 px-4 max-w-6xl mx-auto space-y-16">
      {/* 1. Hero Section */}
      <CinematicSection 
        variant="fade-up"
        showGlowBeam
        glowColor="purple"
        className="text-center space-y-6 max-w-3xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20 shadow-sm">
          <Package className="w-3.5 h-3.5" />
          <span>
            <EditableText path="PRODUCTS_PAGE_DATA.badge" defaultValue={pageData.badge} label="نشان هدر" />
          </span>
        </div>
        <h1 className={`text-3xl md:text-5xl font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-[#1a1240]'}`}>
          <EditableText path="PRODUCTS_PAGE_DATA.headline" defaultValue={pageData.headline} label="تیتر اصلی" />
        </h1>
        <p className={`text-base md:text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <EditableText path="PRODUCTS_PAGE_DATA.subheadline" defaultValue={pageData.subheadline} label="زیرتیتر توضیحی" multiline />
        </p>
      </CinematicSection>

      {/* 2. Products Grid */}
      <CinematicSection variant="fade-up" delay={0.1} className="space-y-6">
        <SectionEditHeader title="محصولات و ابزارها" arrayPath="PRODUCTS" />
        <CinematicStagger staggerDelay={0.12} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {productsList.map((prod, idx) => (
            <CinematicItem key={prod.id || idx}>
              <div
                className={`h-full p-8 rounded-3xl border flex flex-col justify-between hover:border-purple-500/40 transition-all duration-300 group shadow-lg ${
                  isDark ? 'glass-card-dark' : 'glass-card-light'
                }`}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition-transform ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
                    }`}>
                      {getIcon(prod.iconName)}
                    </div>
                    {prod.badge && (
                      <span className="px-3.5 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs font-bold border border-purple-500/20">
                        <EditableText path={`PRODUCTS.${idx}.badge`} defaultValue={prod.badge} label="نشان" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-[#1a1240]'}`}>
                      <EditableText path={`PRODUCTS.${idx}.title`} defaultValue={prod.title} label="عنوان محصول" />
                    </h3>
                    <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <EditableText path={`PRODUCTS.${idx}.description`} defaultValue={prod.description} label="توضیح" multiline />
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border space-y-1 ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="text-xs text-[#8b5cf6] font-bold block">مناسب برای:</span>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <EditableText path={`PRODUCTS.${idx}.targetAudience`} defaultValue={prod.targetAudience} label="مخاطبان هدف" />
                    </p>
                  </div>
                </div>

                {/* Price & CTA Row */}
                <div className={`pt-6 mt-6 border-t space-y-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                  {/* Price Display */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">تعرفه / قیمت:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-black text-amber-400">
                        <EditableText path={`PRODUCTS.${idx}.price`} defaultValue={prod.price || 'تماس / هماهنگی'} label="قیمت" />
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('contact')}
                    className="glow-btn w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.02]"
                  >
                    <span>
                      <EditableText path={`PRODUCTS.${idx}.actionText`} defaultValue={prod.actionText || 'درخواست / دریافت'} label="متن دکمه" />
                    </span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CinematicItem>
          ))}
        </CinematicStagger>
      </CinematicSection>
    </div>
  );
};

