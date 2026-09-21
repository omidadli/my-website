import React, { useEffect } from 'react';
import { useContent } from '../context/ContentContext';
import { Page } from '../types';

interface SEOHeadProps {
  currentPage: Page;
  /** When a blog post is open, its own SEO overrides the page-level config. */
  blogPostId?: string | null;
}

/** Applies CMS SEO settings (global → page → post) to the document head. */
export const SEOHead: React.FC<SEOHeadProps> = ({ currentPage, blogPostId }) => {
  const { data, isAdmin } = useContent();
  const globalSeo = data.GLOBAL_SEO;
  const pageSeo = data.PAGE_SEO[currentPage] || {};
  const post =
    currentPage === 'blog' && blogPostId
      ? (data.BLOG_POSTS || []).find((p) => p.id === blogPostId || (!!p.slug && p.slug === blogPostId))
      : null;

  useEffect(() => {
    const isPost = !!post;
    const baseTitle = isPost
      ? post!.seo?.title || post!.title
      : pageSeo.title || getPageDefaultTitle(currentPage);
    const finalTitle = globalSeo.titleTemplate
      ? globalSeo.titleTemplate.replace('%s', baseTitle)
      : `${baseTitle} | ${globalSeo.siteTitle}`;
    document.title = finalTitle;

    const metaDesc = isPost
      ? post!.seo?.metaDescription || post!.excerpt
      : pageSeo.metaDescription || globalSeo.defaultMetaDesc;
    setMetaTag('description', metaDesc);

    const keywords = isPost
      ? post!.seo?.keywords || (post!.tags || []).join(', ')
      : pageSeo.keywords || globalSeo.defaultKeywords;
    setMetaTag('keywords', keywords);

    // Open Graph
    setMetaProperty('og:title', isPost ? post!.seo?.ogTitle || finalTitle : pageSeo.ogTitle || finalTitle);
    setMetaProperty('og:description', isPost ? post!.seo?.ogDescription || metaDesc : pageSeo.ogDescription || metaDesc);
    setMetaProperty('og:image', (isPost ? post!.seo?.ogImage || post!.coverImage : pageSeo.ogImage) || globalSeo.ogImage);
    setMetaProperty('og:type', isPost ? 'article' : 'website');
    setMetaProperty('og:locale', 'fa_IR');

    // Canonical
    const base = (globalSeo.canonicalBaseUrl || '').replace(/\/$/, '');
    const canonical = isPost
      ? post!.seo?.canonicalUrl || `${base}/blog/${post!.slug || post!.id}`
      : pageSeo.canonicalUrl || `${base}/${currentPage === 'home' ? '' : currentPage}`;
    setLinkRel('canonical', canonical);

    // Robots / noindex — drafts are always hidden from crawlers (admin still previews them).
    const noIndex = isPost
      ? (!isAdmin && post!.status === 'draft') || post!.seo?.noIndex === true
      : pageSeo.noIndex === true;
    setMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Favicon
    if (globalSeo.faviconUrl) {
      setLinkRel('icon', globalSeo.faviconUrl);
    }
  }, [currentPage, blogPostId, post, pageSeo, globalSeo, isAdmin]);

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
