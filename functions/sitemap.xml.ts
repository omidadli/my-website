import type { Env } from './api/_shared';
import { buildSitemapXml, loadPublicContent, resolveBaseUrl } from './_seo';

/** GET /sitemap.xml — home, built-in pages, custom pages and published posts. */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const { data, updatedAt } = await loadPublicContent(env);
  const baseUrl = resolveBaseUrl(request, data);
  return new Response(buildSitemapXml(baseUrl, data, updatedAt), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
