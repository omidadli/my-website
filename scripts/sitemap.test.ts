/**
 * sitemap.xml generation (functions/_seo.ts → buildSitemapXml).
 *
 * Regression cover for a real production bug: with an empty D1 content row the
 * sitemap listed only the 8 static pages while every /blog/<id> URL was live
 * (the middleware falls back to the bundled posts, the sitemap did not).
 *
 * Run: npx tsx scripts/sitemap.test.ts
 */
import assert from 'node:assert/strict';
import { buildSitemapXml } from '../functions/_seo';
import { BLOG_POSTS } from '../src/data/content';

const base = 'https://omidadli01.site';
const locs = (xml: string): string[] => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

// ---- static pages are always there ----
const empty = buildSitemapXml(base, null, null);
assert.ok(locs(empty).includes(`${base}/`), 'home is listed');
for (const p of ['services', 'portfolio', 'about', 'projects', 'blog', 'products', 'contact']) {
  assert.ok(locs(empty).includes(`${base}/${p}`), `static page /${p} is listed`);
}

// ---- the bug: no content in D1 → the built-in posts must still be listed ----
const bundledIds = BLOG_POSTS.map((p: any) => p.slug || p.id).filter(Boolean);
assert.ok(bundledIds.length > 0, 'there are bundled posts to fall back to');
for (const id of bundledIds) {
  assert.ok(locs(empty).includes(`${base}/blog/${id}`), `fallback lists /blog/${id}`);
}

// ---- empty (but present) array behaves like "no content" ----
assert.deepEqual(
  locs(buildSitemapXml(base, { BLOG_POSTS: [] }, null)).sort(),
  locs(empty).sort(),
  'an empty BLOG_POSTS array falls back to the bundled posts too',
);

// ---- real CMS content wins over the defaults ----
const fromCms = buildSitemapXml(
  base,
  {
    BLOG_POSTS: [
      { id: 'ai-marketing', title: 'AI Marketing', slug: 'ai-marketing' },
      { id: 'draft-post', title: 'پیش‌نویس', slug: 'draft-post', status: 'draft' },
      { id: 'hidden-post', title: 'مخفی', slug: 'hidden-post', seo: { noIndex: true } },
    ] as any,
  },
  null,
);
const cmsLocs = locs(fromCms);
assert.ok(cmsLocs.includes(`${base}/blog/ai-marketing`), 'published CMS post is listed');
assert.ok(!cmsLocs.includes(`${base}/blog/draft-post`), 'draft is excluded');
assert.ok(!cmsLocs.includes(`${base}/blog/hidden-post`), 'noIndex post is excluded');
assert.ok(!cmsLocs.includes(`${base}/blog/${bundledIds[0]}`), 'defaults are not mixed in when CMS has posts');

// ---- slugs are validated, ids are used as a fallback, junk is dropped ----
const mixed = buildSitemapXml(
  base,
  {
    BLOG_POSTS: [
      { id: 'post-without-slug', title: 'بدون slug' },
      { id: 42, title: 'bad id', slug: 'bad slug with spaces' },
    ] as any,
  },
  null,
);
const mixedLocs = locs(mixed);
assert.ok(mixedLocs.includes(`${base}/blog/post-without-slug`), 'id is used when there is no slug');
assert.ok(
  !mixedLocs.some((l) => l.includes('bad slug')),
  'an invalid slug is never emitted',
);

// ---- custom pages + lastmod ----
const withCustom = buildSitemapXml(base, { CUSTOM_PAGES: [{ slug: 'ai-readiness-audit' }] as any }, '2026-09-26T10:00:00Z');
assert.ok(locs(withCustom).includes(`${base}/ai-readiness-audit`), 'custom page is listed');
assert.ok(withCustom.includes('<lastmod>2026-09-26</lastmod>'), 'lastmod is emitted');

// ---- no duplicate URLs ----
const all = locs(buildSitemapXml(base, { BLOG_POSTS: BLOG_POSTS as any }, null));
assert.equal(all.length, new Set(all).size, 'no duplicate <loc> entries');

console.log('✓ sitemap.test.ts — all assertions passed');
