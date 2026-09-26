import type { Env } from './api/_shared';

/**
 * Shared helpers for the crawler endpoints (`/robots.txt`, `/sitemap.xml`).
 *
 * Before these existed, Cloudflare Pages answered both paths with the SPA's
 * index.html (status 200, text/html) — crawlers saw an unparsable robots file
 * and an invalid sitemap. Both files are now generated from the CMS content
 * stored in D1 (GLOBAL_SEO, BLOG_POSTS, CUSTOM_PAGES) with the same rules the
 * admin panel's "ساخت sitemap.xml / robots.txt" buttons use, so what the admin
 * previews is what crawlers get.
 */

export const DEFAULT_SITE_URL = 'https://omidadli01.site';

/** Routes of the built-in pages (the SPA is hash-routed: `/#/services`). */
export const STATIC_ROUTES = ['services', 'portfolio', 'about', 'projects', 'blog', 'products', 'contact'];

export interface PublicSiteContent {
  GLOBAL_SEO?: { canonicalBaseUrl?: string; robotsTxt?: string } | null;
  BLOG_POSTS?: Array<{ id?: string; slug?: string; status?: string; seo?: { noIndex?: boolean } }> | null;
  CUSTOM_PAGES?: Array<{ slug?: string }> | null;
  PAGE_SEO?: Record<string, { noIndex?: boolean } | undefined> | null;
}

/** Loads the published content blob; `null` when nothing was saved yet (site runs on its defaults). */
export const loadPublicContent = async (env: Env): Promise<{ data: PublicSiteContent | null; updatedAt: string | null }> => {
  try {
    const row = await env.DB.prepare(`SELECT data, updated_at FROM content WHERE id = 1`).first<{ data: string; updated_at: string }>();
    if (!row?.data) return { data: null, updatedAt: null };
    const parsed = JSON.parse(row.data);
    return { data: parsed && typeof parsed === 'object' ? (parsed as PublicSiteContent) : null, updatedAt: row.updated_at || null };
  } catch {
    // Missing table / D1 hiccup: fall back to defaults rather than failing the crawler.
    return { data: null, updatedAt: null };
  }
};

/** Canonical origin: CMS setting → request origin (custom domain) → default. */
export const resolveBaseUrl = (request: Request, content: PublicSiteContent | null): string => {
  const fromCms = String(content?.GLOBAL_SEO?.canonicalBaseUrl || '').trim();
  if (/^https?:\/\//i.test(fromCms)) return fromCms.replace(/\/+$/, '');
  try {
    const origin = new URL(request.url).origin;
    if (/^https?:\/\//i.test(origin) && !/localhost|127\.0\.0\.1/.test(origin)) return origin;
  } catch { /* ignore */ }
  return DEFAULT_SITE_URL;
};

export const defaultRobotsTxt = (baseUrl: string): string =>
  ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${baseUrl}/sitemap.xml`, ''].join('\n');

const escapeXml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const isValidSlug = (s: unknown): s is string => typeof s === 'string' && /^[\w\u0600-\u06FF-]{1,120}$/.test(s);

export const buildSitemapXml = (baseUrl: string, content: PublicSiteContent | null, lastmodIso: string | null): string => {
  const url = (hashPath: string) => `${baseUrl}/#/${hashPath}`;
  const pageSeo = content?.PAGE_SEO || {};
  const entries: Array<{ loc: string; priority: string }> = [{ loc: `${baseUrl}/`, priority: '1.0' }];

  for (const route of STATIC_ROUTES) {
    if (pageSeo[route]?.noIndex) continue;
    entries.push({ loc: url(route), priority: '0.8' });
  }
  for (const cp of content?.CUSTOM_PAGES || []) {
    if (isValidSlug(cp?.slug)) entries.push({ loc: url(cp.slug), priority: '0.8' });
  }
  for (const post of content?.BLOG_POSTS || []) {
    if (!post || post.status === 'draft' || post.seo?.noIndex) continue;
    const slug = isValidSlug(post.slug) ? post.slug : isValidSlug(post.id) ? post.id : null;
    if (slug) entries.push({ loc: url(`blog/${slug}`), priority: '0.7' });
  }

  const lastmod = lastmodIso && !Number.isNaN(Date.parse(lastmodIso)) ? `\n    <lastmod>${lastmodIso.slice(0, 10)}</lastmod>` : '';
  const seen = new Set<string>();
  const body = entries
    .filter((e) => (seen.has(e.loc) ? false : (seen.add(e.loc), true)))
    .map((e) => `  <url>\n    <loc>${escapeXml(e.loc)}</loc>${lastmod}\n    <changefreq>weekly</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
};
