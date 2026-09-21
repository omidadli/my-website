import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { EditableText } from '../components/cms/EditableText';
import { SectionEditHeader } from '../components/cms/SectionEditHeader';
import { IconBadge3D } from '../components/3D/3DIconBadge';
import { PageHero } from '../components/nd/Kit';
import { Page, Theme } from '../types';

interface ProductsPageProps {
  theme?: Theme;
  onNavigate: (page: Page) => void;
}

const GLOWS = ['magenta', 'blue', 'purple', 'emerald'] as const;

export const ProductsPage: React.FC<ProductsPageProps> = ({ theme = 'dark', onNavigate }) => {
  const isDark = theme === 'dark';
  const { data } = useContent();
  const pageData = data.PRODUCTS_PAGE_DATA;
  const productsList = data.PRODUCTS || [];

  return (
    <div className="space-y-14 py-4">
      <PageHero
        theme={theme}
        page="products"
        title={pageData.headline}
        subtitle={pageData.subheadline}
        badge={pageData.badge}
        onNavigate={onNavigate}
      />

      <section className="space-y-8">
        <SectionEditHeader title="محصولات و ابزارها" arrayPath="PRODUCTS" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productsList.map((prod, idx) => (
            <div key={prod.id || idx} className="nd-card nd-card-hover p-7 sm:p-8 flex flex-col gap-6 h-full">
              <div className="flex items-center justify-between">
                <IconBadge3D iconName={prod.iconName === 'laptop' ? 'laptop' : prod.iconName} theme={theme} size="md" glowColor={GLOWS[idx % GLOWS.length]} floating={false} />
                {prod.badge && (
                  <span className="nd-chip">
                    <EditableText path={`PRODUCTS.${idx}.badge`}>{prod.badge}</EditableText>
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <h3 className={`nd-h2 text-lg sm:text-xl ${isDark ? 'text-white' : ''}`}>
                  <EditableText path={`PRODUCTS.${idx}.title`}>{prod.title}</EditableText>
                </h3>
                <p className={`${isDark ? 'text-slate-400' : 'nd-muted'} text-sm leading-relaxed`}>
                  <EditableText path={`PRODUCTS.${idx}.description`} multiline>{prod.description}</EditableText>
                </p>
              </div>
              <div className={`p-4 rounded-2xl border space-y-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-[color:var(--nd-bg-soft)] border-[color:var(--nd-line)]'}`}>
                <span className="text-xs font-extrabold text-[color:var(--nd-accent)] block">مناسب برای:</span>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-[color:var(--nd-ink-2)]'}`}>
                  <EditableText path={`PRODUCTS.${idx}.targetAudience`}>{prod.targetAudience}</EditableText>
                </p>
              </div>
              <div className={`pt-5 mt-auto border-t space-y-4 ${isDark ? 'border-white/10' : 'border-[color:var(--nd-line)]'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'nd-muted'}`}>تعرفه / قیمت:</span>
                  <span className={`text-base font-black ${isDark ? 'text-amber-300' : 'text-[#b45309]'}`}>
                    <EditableText path={`PRODUCTS.${idx}.price`}>{prod.price || 'تماس / هماهنگی'}</EditableText>
                  </span>
                </div>
                <button onClick={() => onNavigate('contact')} className={`nd-btn w-full py-3.5 text-sm ${isDark ? 'bg-white text-[#17171c] hover:bg-slate-200' : 'nd-btn-accent'}`}>
                  <span>
                    <EditableText path={`PRODUCTS.${idx}.actionText`}>{prod.actionText || 'درخواست / دریافت'}</EditableText>
                  </span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
