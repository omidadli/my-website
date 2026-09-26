/**
 * SEO defaults + title/description resolution shared by the browser (SEOHead,
 * ContentContext) and the edge (functions/_middleware.ts, sitemap), so the
 * <title>/<meta> a crawler or a WhatsApp/Telegram link preview receives from the
 * server is exactly what the SPA renders after hydration.
 */

export interface SeoGlobalLike {
  siteTitle?: string;
  titleTemplate?: string;
  defaultMetaDesc?: string;
  defaultKeywords?: string;
  faviconUrl?: string;
  ogImage?: string;
  canonicalBaseUrl?: string;
  robotsTxt?: string;
}

export interface SeoPageLike {
  title?: string;
  metaDescription?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface SeoPostLike {
  id: string;
  title: string;
  excerpt?: string;
  slug?: string;
  status?: string;
  coverImage?: string;
  tags?: string[];
  seo?: SeoPageLike;
}

export const defaultGlobalSeo = {
  siteTitle: 'امید عدلی | مشاور و مجری پرفورمنس مارکتینگ و CRO',
  titleTemplate: '%s | امید عدلی',
  defaultMetaDesc: 'خدمات تخصصی پرفورمنس مارکتینگ، بهینه‌سازی نرخ تبدیل (CRO)، کمپین‌های گوگل ادز و آنالیز پیشرفته رفتار کاربر.',
  defaultKeywords: 'پرفورمنس مارکتینگ, CRO, دیجیتال مارکتینگ, گوگل ادز, امید عدلی, بهینه‌سازی نرخ تبدیل',
  // Only files that really exist in /public — /favicon.ico never shipped, so browsers got the SPA's HTML.
  faviconUrl: '/logo.svg',
  // Own photo instead of a stock portrait of a stranger in link previews (WhatsApp/Telegram/LinkedIn).
  ogImage: 'https://omidadli01.site/profile-photo-web.jpg',
  canonicalBaseUrl: 'https://omidadli01.site',
  robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://omidadli01.site/sitemap.xml',
};

export const PAGE_DEFAULT_TITLES: Record<string, string> = {
  home: 'صفحه اصلی',
  services: 'خدمات تخصصی و مشاوره',
  portfolio: 'نمونه‌کارها و کیس‌استادی‌ها',
  about: 'درباره من',
  projects: 'پروژه‌ها و وضعیت پذیرش',
  blog: 'مقالات و آموزش‌ها',
  products: 'محصولات و دوره‌های آموزشی',
  contact: 'تماس و رزرو جلسه مشاوره',
  admin: 'پیشخوان مدیریت CMS',
};

export const pageDefaultTitle = (page: string): string => PAGE_DEFAULT_TITLES[page] || page;

/** Title used by the SPA and the edge for URLs that match no route. */
export const NOT_FOUND_TITLE = 'صفحه پیدا نشد';

/** Apply the CMS title template ("%s | برند"); the home page uses the site title itself. */
export const buildDocumentTitle = (baseTitle: string, globalSeo: SeoGlobalLike, opts: { isHome?: boolean; explicit?: boolean } = {}): string => {
  const siteTitle = globalSeo.siteTitle || defaultGlobalSeo.siteTitle;
  if (opts.isHome && !opts.explicit) return siteTitle;
  const template = globalSeo.titleTemplate ?? defaultGlobalSeo.titleTemplate;
  return template ? template.replace('%s', baseTitle) : `${baseTitle} | ${siteTitle}`;
};

export interface ResolvedSeo {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: 'website' | 'article';
  noIndex: boolean;
}

/**
 * Resolve the effective SEO fields for a page or a post (global → page → post),
 * mirroring the precedence the admin panel documents.
 */
export const resolveSeo = (args: {
  page: string;
  post?: SeoPostLike | null;
  globalSeo?: SeoGlobalLike | null;
  pageSeo?: SeoPageLike | null;
  /** admins preview drafts; crawlers never index them */
  isAdmin?: boolean;
}): ResolvedSeo => {
  const globalSeo: SeoGlobalLike = { ...defaultGlobalSeo, ...(args.globalSeo || {}) };
  const pageSeo: SeoPageLike = args.pageSeo || {};
  const post = args.post || null;

  if (post) {
    const baseTitle = post.seo?.title || post.title;
    const title = buildDocumentTitle(baseTitle, globalSeo);
    const description = post.seo?.metaDescription || post.excerpt || globalSeo.defaultMetaDesc || '';
    return {
      title,
      description,
      keywords: post.seo?.keywords || (post.tags || []).join(', ') || globalSeo.defaultKeywords || '',
      ogTitle: post.seo?.ogTitle || title,
      ogDescription: post.seo?.ogDescription || description,
      ogImage: post.seo?.ogImage || post.coverImage || globalSeo.ogImage || '',
      ogType: 'article',
      noIndex: (!args.isAdmin && post.status === 'draft') || post.seo?.noIndex === true,
    };
  }

  const isHome = args.page === 'home';
  const baseTitle = pageSeo.title || pageDefaultTitle(args.page);
  const title = buildDocumentTitle(baseTitle, globalSeo, { isHome, explicit: !!pageSeo.title });
  const description = pageSeo.metaDescription || globalSeo.defaultMetaDesc || '';
  return {
    title,
    description,
    keywords: pageSeo.keywords || globalSeo.defaultKeywords || '',
    ogTitle: pageSeo.ogTitle || title,
    ogDescription: pageSeo.ogDescription || description,
    ogImage: pageSeo.ogImage || globalSeo.ogImage || '',
    ogType: 'website',
    noIndex: pageSeo.noIndex === true || args.page === 'admin',
  };
};
