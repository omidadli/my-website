import React from 'react';
import { CustomPage, CustomBlock, Theme, Page } from '../types';
import { useContent } from '../context/ContentContext';
import { EditableText } from '../components/cms/EditableText';
import { EditableImage } from '../components/cms/EditableImage';
import { PageHero } from '../components/nd/Kit';
import { Plus, Trash2, ArrowUpLeft, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';

interface CustomPageViewProps {
  customPage: CustomPage;
  theme?: Theme;
  onNavigate: (page: Page) => void;
}

export const CustomPageView: React.FC<CustomPageViewProps> = ({ customPage, theme = 'dark', onNavigate }) => {
  const isDark = theme === 'dark';
  const { data, isAdmin, updateField } = useContent();

  const customPages = data.CUSTOM_PAGES || [];
  const pageIndex = customPages.findIndex((p) => p.id === customPage.id);

  if (pageIndex === -1) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className={`nd-h2 text-xl ${isDark ? 'text-white' : ''}`}>برگه مورد نظر یافت نشد.</h2>
        <button onClick={() => onNavigate('home')} className="nd-btn nd-btn-ghost px-6 py-3 text-xs cursor-pointer">
          <span>بازگشت به صفحه اصلی</span>
        </button>
      </div>
    );
  }

  const currentPageData = customPages[pageIndex];
  const blocksPath = `CUSTOM_PAGES.${pageIndex}.blocks`;

  const handleAddBlock = (type: CustomBlock['type']) => {
    const newBlock: CustomBlock = {
      id: 'b-' + Date.now(),
      type,
      title:
        type === 'text' ? 'عنوان بلوک متنی جدید'
        : type === 'image' ? 'عنوان تصویر'
        : type === 'cta' ? 'دعوت به اقدام'
        : type === 'features' ? 'ویژگی‌های کلیدی'
        : 'سوالات متداول',
      content: 'توضیحات و محتوای این بخش را در اینجا وارد نمایید.',
      imageUrl: type === 'image' ? 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80' : undefined,
      buttonText: type === 'cta' ? 'درخواست مشاوره رایگان' : undefined,
      buttonLink: type === 'cta' ? 'contact' : undefined,
      items:
        type === 'features'
          ? [
              { title: 'ویژگی اول', desc: 'توضیحات مربوط به ویژگی اول' },
              { title: 'ویژگی دوم', desc: 'توضیحات مربوط به ویژگی دوم' },
            ]
          : type === 'faq'
            ? [{ title: 'سوال متداول اول؟', desc: 'پاسخ کامل به سوال متداول اول' }]
            : undefined,
    };
    updateField(blocksPath, [...(currentPageData.blocks || []), newBlock]);
  };

  const blockTypes: { type: CustomBlock['type']; label: string }[] = [
    { type: 'text', label: 'متن' },
    { type: 'image', label: 'تصویر' },
    { type: 'cta', label: 'دکمه اقدام (CTA)' },
    { type: 'features', label: 'لیست ویژگی‌ها' },
    { type: 'faq', label: 'سوالات متداول' },
  ];

  return (
    <div className="space-y-10 py-4">
      <PageHero
        theme={theme}
        page={currentPageData.slug as any}
        title={currentPageData.title}
        subtitle={currentPageData.description || 'برگه اختصاصی ایجادشده در مدیریت سایت'}
        badge={`برگه اختصاصی / ${currentPageData.slug}`}
        onNavigate={onNavigate}
      />

      {/* Admin: add-block toolbar */}
      {isAdmin && (
        <div className="nd-card p-4 flex items-center justify-between flex-wrap gap-3 border-dashed">
          <span className="text-xs font-extrabold text-[color:var(--nd-accent)]">➕ افزودن بلوک جدید به این برگه</span>
          <span className="flex items-center gap-2 flex-wrap">
            {blockTypes.map((b) => (
              <button key={b.type} onClick={() => handleAddBlock(b.type)} className="nd-chip cursor-pointer hover:text-[color:var(--nd-accent)] transition-colors">
                <Plus className="w-3 h-3" />
                <span>{b.label}</span>
              </button>
            ))}
          </span>
        </div>
      )}

      {/* Blocks */}
      <div className="space-y-8">
        {(currentPageData.blocks || []).map((block, idx) => {
          const blockPath = `${blocksPath}.${idx}`;
          return (
            <div key={block.id || idx} className="nd-card p-7 sm:p-10 relative group">
              {isAdmin && (
                <button
                  onClick={() => updateField(blocksPath, (currentPageData.blocks || []).filter((_: any, i: number) => i !== idx))}
                  className="absolute top-4 left-4 z-20 p-2 rounded-xl bg-[#dc2626] text-white shadow-md opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                  title="حذف این بلوک"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {block.type === 'text' && (
                <div className="space-y-4">
                  <h3 className={`nd-h2 text-xl sm:text-2xl ${isDark ? 'text-white' : ''}`}>
                    <EditableText path={`${blockPath}.title`} defaultValue={block.title || ''} label="عنوان بلوک" />
                  </h3>
                  <div className={`text-sm leading-loose ${isDark ? 'text-slate-300' : 'nd-muted'}`}>
                    <EditableText path={`${blockPath}.content`} defaultValue={block.content || ''} label="متن بلوک" multiline />
                  </div>
                </div>
              )}

              {block.type === 'image' && (
                <div className="space-y-4">
                  {block.title && (
                    <h3 className={`nd-h2 text-lg ${isDark ? 'text-white' : ''}`}>
                      <EditableText path={`${blockPath}.title`} defaultValue={block.title} label="عنوان تصویر" />
                    </h3>
                  )}
                  <div className={`rounded-[24px] overflow-hidden border ${isDark ? 'border-white/12' : 'border-white/70'} shadow-sm`}>
                    <EditableImage
                      path={`${blockPath}.imageUrl`}
                      defaultSrc={block.imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'}
                      alt={block.title || 'تصویر برگه'}
                      className="w-full aspect-[16/9] object-cover"
                    />
                  </div>
                </div>
              )}

              {block.type === 'cta' && (
                <div className="text-center space-y-5 py-4 max-w-2xl mx-auto">
                  <span className={isDark ? 'nd-glass-dark inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-extrabold text-indigo-200' : 'nd-eyebrow inline-flex'}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>اقدام ویژه</span>
                  </span>
                  <h3 className={`nd-h2 text-2xl sm:text-3xl ${isDark ? 'text-white' : ''}`}>
                    <EditableText path={`${blockPath}.title`} defaultValue={block.title || 'آماده همکاری هستید؟'} label="عنوان CTA" />
                  </h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'nd-muted'}`}>
                    <EditableText path={`${blockPath}.content`} defaultValue={block.content || 'همین حالا برای جلسه مشاوره تخصصی پیام دهید.'} label="متن CTA" multiline />
                  </p>
                  <button
                    onClick={() => onNavigate(((block.buttonLink as any) || 'contact') as Page)}
                    className={`nd-btn px-8 py-3.5 text-xs ${isDark ? 'bg-white text-[#17171c] hover:bg-slate-200' : 'nd-btn-accent'}`}
                  >
                    <span>
                      <EditableText path={`${blockPath}.buttonText`} defaultValue={block.buttonText || 'ارتباط با من'} label="متن دکمه" />
                    </span>
                    <ArrowUpLeft className="w-4 h-4" />
                  </button>
                </div>
              )}

              {block.type === 'features' && (
                <div className="space-y-6">
                  <h3 className={`nd-h2 text-xl sm:text-2xl ${isDark ? 'text-white' : ''}`}>
                    <EditableText path={`${blockPath}.title`} defaultValue={block.title || 'ویژگی‌های کلیدی'} label="عنوان لیست" />
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(block.items || []).map((item, itemIdx) => (
                      <div key={itemIdx} className="rounded-2xl border border-[color:var(--nd-line)] bg-[color:var(--nd-bg-soft)] p-4 space-y-2">
                        <span className="flex items-center gap-2 text-[color:var(--nd-success)] font-extrabold text-sm">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <EditableText path={`${blockPath}.items.${itemIdx}.title`} defaultValue={item.title} label="عنوان ویژگی" />
                        </span>
                        <p className={`text-xs leading-relaxed pr-6 ${isDark ? 'text-slate-400' : 'nd-muted'}`}>
                          <EditableText path={`${blockPath}.items.${itemIdx}.desc`} defaultValue={item.desc} label="توضیح ویژگی" multiline />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {block.type === 'faq' && (
                <div className="space-y-6">
                  <h3 className={`nd-h2 text-xl sm:text-2xl flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
                    <HelpCircle className="w-5 h-5 text-[color:var(--nd-accent)]" />
                    <EditableText path={`${blockPath}.title`} defaultValue={block.title || 'سوالات متداول'} label="عنوان FAQ" />
                  </h3>
                  <div className="space-y-3">
                    {(block.items || []).map((item, itemIdx) => (
                      <div key={itemIdx} className="rounded-2xl border border-[color:var(--nd-line)] bg-[color:var(--nd-bg-soft)] p-5 space-y-2">
                        <h4 className={`font-extrabold text-sm ${isDark ? 'text-white' : ''}`}>
                          <EditableText path={`${blockPath}.items.${itemIdx}.title`} defaultValue={item.title} label="سوال" />
                        </h4>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'nd-muted'}`}>
                          <EditableText path={`${blockPath}.items.${itemIdx}.desc`} defaultValue={item.desc} label="پاسخ" multiline />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {(currentPageData.blocks || []).length === 0 && (
          <div className="nd-card p-12 text-center">
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'nd-muted'}`}>
              {isAdmin ? 'این برگه هنوز بلوکی ندارد — از نوار بالا بلوک اضافه کنید.' : 'این صفحه در حال ساخت است.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
