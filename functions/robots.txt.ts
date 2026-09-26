import type { Env } from './api/_shared';
import { defaultRobotsTxt, loadPublicContent, resolveBaseUrl } from './_seo';

/** GET /robots.txt — CMS text (GLOBAL_SEO.robotsTxt) or a sane default. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const { data } = await loadPublicContent(env);
  const baseUrl = resolveBaseUrl(request, data);
  const custom = String(data?.GLOBAL_SEO?.robotsTxt || '').trim();
  let body = custom ? `${custom}\n` : defaultRobotsTxt(baseUrl);
  // Always advertise the (now real) sitemap so crawlers discover posts and pages.
  if (!/^\s*sitemap\s*:/im.test(body)) body += `\nSitemap: ${baseUrl}/sitemap.xml\n`;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
