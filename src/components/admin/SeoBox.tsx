import React, { useState } from 'react';
import { api } from '../../services/api';
import { slugify } from '../../utils/slug';
import { AInput, ASelect, ATextarea, ALabel, ACollapse, AToggle } from './ui';
import { MediaField } from './MediaField';
import { CANONICAL_SITE_URL } from '../../../lib/seoDefaults';
import { Wand2, Globe, EyeOff } from 'lucide-react';

export interface SeoValues {
  status?: 'published' | 'draft';
  slug?: string;
  title?: string;
  metaDescription?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export type SeoKey = keyof SeoValues;

interface SeoBoxProps {
  values: SeoValues;
  onChange: (key: SeoKey, value: any) => void;
  /** Title used for automatic English slug generation. */
  titleForSlug?: string;
  /** URL prefix shown in the permalink preview, e.g. 'blog'. */
  urlPrefix?: string;
  showStatus?: boolean;
  showSlug?: boolean;
  defaultOpen?: boolean;
}

const count = (s?: string) => (s || '').length;

/** WordPress-style publish + SEO panel for any content item or page. */
export const SeoBox: React.FC<SeoBoxProps> = ({ values, onChange, titleForSlug, urlPrefix, showStatus = true, showSlug = true, defaultOpen = false }) => {
  const [slugBusy, setSlugBusy] = useState(false);

  const generateSlug = async () => {
    const base = titleForSlug || values.title || '';
    if (!base.trim()) return;
    setSlugBusy(true);
    const cloud = await api.makeSlug(base);
    onChange('slug', cloud || slugify(base));
    setSlugBusy(false);
  };

  const siteUrl = new URL(CANONICAL_SITE_URL).host;
  const permalink = `${siteUrl}/${urlPrefix ? urlPrefix + '/' : ''}${values.slug || '…'}`;

  return (
    <ACollapse
      defaultOpen={defaultOpen}
      tone="border-[color:var(--nd-line-strong)] bg-[color:var(--nd-surface)]"
      title={
        <span className="inline-flex items-center gap-2">
          <Globe className="w-4 h-4 text-[color:var(--nd-accent)]" />
          <span>انتشار و سئو</span>
          {values.status === 'draft' && <span className="nd-chip bg-[color:var(--nd-peach-soft)] text-[#d97706] border-transparent text-[9px]">پیش‌نویس</span>}
        </span>
      }
    >
      <div className="space-y-4 pt-1">
        {showStatus && (
          <div>
            <ALabel>وضعیت انتشار</ALabel>
            <ASelect value={values.status || 'published'} onChange={(e) => onChange('status', e.target.value)}>
              <option value="published">منتشرشده — در سایت نمایش داده می‌شود</option>
              <option value="draft">پیش‌نویس — فقط خودم می‌بینم</option>
            </ASelect>
          </div>
        )}

        {showSlug && (
          <div>
            <ALabel hint="آدرس انگلیسی صفحه (مثل وردپرس)">پیوند یکتا (URL Slug)</ALabel>
            <div className="flex gap-2">
              <AInput dir="ltr" className="text-left font-mono" placeholder="english-url-slug" value={values.slug || ''} onChange={(e) => onChange('slug', e.target.value)} onBlur={(e) => onChange('slug', slugify(e.target.value))} />
              <button type="button" onClick={generateSlug} disabled={slugBusy} className="nd-btn nd-btn-ghost px-4 py-2 text-[11px] shrink-0 cursor-pointer disabled:opacity-50" title="ترجمه عنوان به انگلیسی و ساخت آدرس">
                <Wand2 className={`w-3.5 h-3.5 ${slugBusy ? 'animate-spin' : ''}`} />
                <span>{slugBusy ? '…' : 'ساخت خودکار'}</span>
              </button>
            </div>
            <p className="text-[10px] nd-muted mt-1.5 dir-ltr text-left font-mono">{permalink}</p>
          </div>
        )}

        <div>
          <ALabel hint={`${count(values.title)}/60 کاراکتر — ایده‌آل ۵۰ تا ۶۰`}>عنوان سئو (Meta Title)</ALabel>
          <AInput value={values.title || ''} onChange={(e) => onChange('title', e.target.value)} placeholder="اگر خالی بماند، عنوان اصلی استفاده می‌شود" />
        </div>

        <div>
          <ALabel hint={`${count(values.metaDescription)}/155 کاراکتر — ایده‌آل ۱۲۰ تا ۱۵۵`}>توضیحات متا (Meta Description)</ALabel>
          <ATextarea rows={3} value={values.metaDescription || ''} onChange={(e) => onChange('metaDescription', e.target.value)} placeholder="خلاصه‌ای که در نتایج گوگل زیر عنوان نمایش داده می‌شود…" />
        </div>

        <div>
          <ALabel hint="با کاما جدا کنید">کلمه کلیدی کانونی (Focus Keywords)</ALabel>
          <AInput value={values.keywords || ''} onChange={(e) => onChange('keywords', e.target.value)} placeholder="پرفورمنس مارکتینگ, افزایش نرخ تبدیل" />
        </div>

        <MediaField label="تصویر اشتراک‌گذاری (OG Image)" value={values.ogImage} onChange={(v) => onChange('ogImage', v)} />

        <div>
          <ALabel hint="آدرس کامل صفحه — معمولاً خالی بگذارید">لینک Canonical</ALabel>
          <AInput dir="ltr" className="text-left font-mono" value={values.canonicalUrl || ''} onChange={(e) => onChange('canonicalUrl', e.target.value)} placeholder={`${CANONICAL_SITE_URL}/…`} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[color:var(--nd-line)] bg-[color:var(--nd-bg-soft)] p-3.5">
          <span className="flex items-center gap-2 text-xs font-extrabold text-[color:var(--nd-ink-2)]">
            <EyeOff className="w-4 h-4 text-[color:var(--nd-faint)]" />
            <span>از نتایج گوگل حذف شود (noindex)</span>
          </span>
          <AToggle checked={!!values.noIndex} onChange={(v) => onChange('noIndex', v)} />
        </div>
      </div>
    </ACollapse>
  );
};
