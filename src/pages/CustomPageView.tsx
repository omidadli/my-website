import React from 'react';
import { CustomPage, CustomBlock, Theme, Page } from '../types';
import { useContent } from '../context/ContentContext';
import { PageHeader } from '../components/PageHeader';
import { EditableText } from '../components/cms/EditableText';
import { EditableImage } from '../components/cms/EditableImage';
import { SectionEditHeader } from '../components/cms/SectionEditHeader';
import { Plus, Trash2, ArrowUpLeft, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';

interface CustomPageViewProps {
  customPage: CustomPage;
  theme?: Theme;
  onNavigate: (page: Page) => void;
}

export const CustomPageView: React.FC<CustomPageViewProps> = ({
  customPage,
  theme = 'dark',
  onNavigate
}) => {
  const isDark = theme === 'dark';
  const { data, isAdmin, updateField, addItem, removeItem } = useContent();

  // Find index of this custom page in state
  const customPages = data.CUSTOM_PAGES || [];
  const pageIndex = customPages.findIndex(p => p.id === customPage.id);

  if (pageIndex === -1) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">برگه مورد نظر یافت نشد.</h2>
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-2.5 rounded-2xl bg-[#8b5cf6] text-white font-bold"
        >
          بازگشت به صفحه اصلی
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
      title: type === 'text' ? 'عنوان بلوک متنی جدید' : type === 'image' ? 'عنوان تصویر' : type === 'cta' ? 'دعوت به اقدام' : type === 'features' ? 'ویژگی‌های کلیدی' : 'سوالات متداول',
      content: 'توضیحات و محتوای این بخش را در اینجا وارد نمایید.',
      imageUrl: type === 'image' ? 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80' : undefined,
      buttonText: type === 'cta' ? 'درخواست مشاوره رایگان' : undefined,
      buttonLink: type === 'cta' ? 'contact' : undefined,
      items: type === 'features' ? [
        { title: 'ویژگی اول', desc: 'توضیحات مربوط به ویژگی اول' },
        { title: 'ویژگی دوم', desc: 'توضیحات مربوط به ویژگی دوم' }
      ] : type === 'faq' ? [
        { title: 'سوال متداول اول؟', desc: 'پاسخ کامل به سوال متداول اول' }
      ] : undefined
    };

    updateField(blocksPath, [...(currentPageData.blocks || []), newBlock]);
  };

  const handleRemoveBlock = (blockIdx: number) => {
    const updated = (currentPageData.blocks || []).filter((_, i) => i !== blockIdx);
    updateField(blocksPath, updated);
  };

  return (
    <div className="space-y-12 py-4">
      {/* Top Header */}
      <PageHeader
        theme={theme}
        page={currentPageData.slug as any}
        title={currentPageData.title}
        subtitle={currentPageData.description || 'برگه اختصاصی ایجادشده در مدیریت سایت'}
        badgeText={`برگه اختصاصی / ${currentPageData.slug}`}
        onNavigate={onNavigate}
      />

      {/* Admin Add Block Controls */}
      {isAdmin && (
        <div className="p-4 rounded-3xl bg-[#1a1240] border-2 border-amber-400/50 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs font-bold text-amber-300">
            ➕ افزونه ویرایشگر برگه: افزودن بلوک جدید به این برگه
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleAddBlock('text')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>متن</span>
            </button>

            <button
              onClick={() => handleAddBlock('image')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>تصویر</span>
            </button>

            <button
              onClick={() => handleAddBlock('cta')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>دکمه اقدام (CTA)</span>
            </button>

            <button
              onClick={() => handleAddBlock('features')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>لیست ویژگی‌ها</span>
            </button>

            <button
              onClick={() => handleAddBlock('faq')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>سوالات متداول</span>
            </button>
          </div>
        </div>
      )}

      {/* Render Page Blocks */}
      <div className="space-y-10">
        {(currentPageData.blocks || []).map((block, idx) => {
          const blockPath = `${blocksPath}.${idx}`;

          return (
            <div
              key={block.id || idx}
              className={`p-8 sm:p-10 rounded-[36px] relative group transition-all duration-300 ${
                isDark ? 'glass-card-dark' : 'glass-card-light'
              }`}
            >
              {isAdmin && (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  <button
                    onClick={() => handleRemoveBlock(idx)}
                    className="p-2 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white text-xs flex items-center gap-1 shadow-lg transition-all"
                    title="حذف این بلوک"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Block Type: TEXT */}
              {block.type === 'text' && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-white">
                    <EditableText
                      path={`${blockPath}.title`}
                      defaultValue={block.title || ''}
                      label="عنوان بلوک"
                    />
                  </h3>
                  <div className="text-sm leading-relaxed text-slate-300">
                    <EditableText
                      path={`${blockPath}.content`}
                      defaultValue={block.content || ''}
                      label="متن بلوک"
                      multiline
                    />
                  </div>
                </div>
              )}

              {/* Block Type: IMAGE */}
              {block.type === 'image' && (
                <div className="space-y-4">
                  {block.title && (
                    <h3 className="text-xl font-bold text-white mb-2">
                      <EditableText
                        path={`${blockPath}.title`}
                        defaultValue={block.title}
                        label="عنوان تصویر"
                      />
                    </h3>
                  )}
                  <div className="rounded-2xl overflow-hidden border border-white/10">
                    <EditableImage
                      path={`${blockPath}.imageUrl`}
                      defaultSrc={block.imageUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'}
                      alt={block.title || 'Custom image'}
                      aspectRatio="16/9"
                    />
                  </div>
                </div>
              )}

              {/* Block Type: CTA */}
              {block.type === 'cta' && (
                <div className="text-center space-y-6 py-6 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-xs font-bold text-[#8b5cf6]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>اقدام ویژه</span>
                  </div>
                  <h3 className="text-3xl font-black text-white">
                    <EditableText
                      path={`${blockPath}.title`}
                      defaultValue={block.title || 'آماده همکاری هستید؟'}
                      label="عنوان CTA"
                    />
                  </h3>
                  <p className="text-sm text-slate-300">
                    <EditableText
                      path={`${blockPath}.content`}
                      defaultValue={block.content || 'همین حالا برای جلسه مشاوره تخصصی پیام دهید.'}
                      label="متن CTA"
                      multiline
                    />
                  </p>
                  <button
                    onClick={() => onNavigate((block.buttonLink as any) || 'contact')}
                    className="glow-btn px-8 py-3.5 rounded-2xl text-sm font-black text-white inline-flex items-center gap-2 cursor-pointer shadow-xl"
                  >
                    <span>
                      <EditableText
                        path={`${blockPath}.buttonText`}
                        defaultValue={block.buttonText || 'ارتباط با من'}
                        label="متن دکمه"
                      />
                    </span>
                    <ArrowUpLeft className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Block Type: FEATURES */}
              {block.type === 'features' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-white">
                    <EditableText
                      path={`${blockPath}.title`}
                      defaultValue={block.title || 'ویژگی‌های کلیدی'}
                      label="عنوان لیست"
                    />
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(block.items || []).map((item, itemIdx) => (
                      <div key={itemIdx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <EditableText
                            path={`${blockPath}.items.${itemIdx}.title`}
                            defaultValue={item.title}
                            label="عنوان ویژگی"
                          />
                        </div>
                        <p className="text-xs text-slate-300 pr-6">
                          <EditableText
                            path={`${blockPath}.items.${itemIdx}.desc`}
                            defaultValue={item.desc}
                            label="توضیح ویژگی"
                            multiline
                          />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Block Type: FAQ */}
              {block.type === 'faq' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-amber-400" />
                    <EditableText
                      path={`${blockPath}.title`}
                      defaultValue={block.title || 'سوالات متداول'}
                      label="عنوان FAQ"
                    />
                  </h3>
                  <div className="space-y-3">
                    {(block.items || []).map((item, itemIdx) => (
                      <div key={itemIdx} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <h4 className="font-bold text-sm text-white">
                          <EditableText
                            path={`${blockPath}.items.${itemIdx}.title`}
                            defaultValue={item.title}
                            label="سوال"
                          />
                        </h4>
                        <p className="text-xs leading-relaxed text-slate-300">
                          <EditableText
                            path={`${blockPath}.items.${itemIdx}.desc`}
                            defaultValue={item.desc}
                            label="پاسخ"
                            multiline
                          />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
