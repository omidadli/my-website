import React, { useEffect } from 'react';
import { useContent } from '../context/ContentContext';
import { Page } from '../types';

interface SEOHeadProps {
  currentPage: Page;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ currentPage }) => {
  const { data } = useContent();
  const globalSeo = data.GLOBAL_SEO;
  const pageSeo = data.PAGE_SEO[currentPage] || {};

  useEffect(() => {
    // 1. Title
    const baseTitle = pageSeo.title || getPageDefaultTitle(currentPage);
    const finalTitle = globalSeo.titleTemplate
      ? globalSeo.titleTemplate.replace('%s', baseTitle)
      : `${baseTitle} | ${globalSeo.siteTitle}`;
    document.title = finalTitle;

    // 2. Meta Description
    const metaDesc = pageSeo.metaDescription || globalSeo.defaultMetaDesc;
    setMetaTag('description', metaDesc);

    // 3. Meta Keywords
    const keywords = pageSeo.keywords || globalSeo.defaultKeywords;
    setMetaTag('keywords', keywords);

    // 4. Open Graph
    setMetaProperty('og:title', pageSeo.ogTitle || finalTitle);
    setMetaProperty('og:description', pageSeo.ogDescription || metaDesc);
    setMetaProperty('og:image', pageSeo.ogImage || globalSeo.ogImage);

    // 5. Canonical
    const canonical = pageSeo.canonicalUrl || `${globalSeo.canonicalBaseUrl}/${currentPage === 'home' ? '' : currentPage}`;
    setLinkRel('canonical', canonical);

    // 6. Favicon
    if (globalSeo.faviconUrl) {
      setLinkRel('icon', globalSeo.faviconUrl);
    }
  }, [currentPage, pageSeo, globalSeo]);

  return null;
};

function getPageDefaultTitle(page: string): string {
  switch (page) {
    case 'home':
      return 'صفحه اصلی';
    case 'services':
      return 'خدمات تخصصی و مشاوره';
    case 'portfolio':
      return 'نمونه‌کارها و کیس‌استادی‌ها';
    case 'about':
      return 'درباره من - امید عدلی';
    case 'projects':
      return 'پروژه‌ها و وضعیت پذیرش';
    case 'blog':
      return 'مقالات و آموزش‌ها';
    case 'products':
      return 'محصولات و دوره‌های آموزشی';
    case 'contact':
      return 'تماس و رزرو جلسه مشاوره';
    case 'admin':
      return 'پیشخوان مدیریت CMS';
    default:
      return page;
  }
}

function setMetaTag(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setMetaProperty(property: string, content: string) {
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setLinkRel(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}
