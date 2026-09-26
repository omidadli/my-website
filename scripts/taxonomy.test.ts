/**
 * Blog taxonomy (src/data/blogTaxonomy.ts).
 *
 * Guarantees the CMS dropdown and the blog filter chips stay consistent:
 * every value/label is unique, and every category already used by a published
 * post exists in the taxonomy — otherwise that post's filter chip would be an
 * orphan with no cluster behind it.
 *
 * Run: npx tsx scripts/taxonomy.test.ts
 */
import assert from 'node:assert/strict';
import { BLOG_CATEGORIES, BLOG_CATEGORY_GROUPS, categoryOrder, findCategory, findCategoryByFa, normalizeCategory } from '../src/data/blogTaxonomy';
import { BLOG_POSTS } from '../src/data/content';

// ---- shape ----
assert.ok(BLOG_CATEGORIES.length > 20, 'taxonomy covers the content plan clusters');
for (const c of BLOG_CATEGORIES) {
  assert.ok(c.value && /^[a-z0-9-]+$/.test(c.value), `value is a slug: ${c.value}`);
  assert.ok(c.fa.trim().length > 0, `persian label for ${c.value}`);
  assert.ok(BLOG_CATEGORY_GROUPS.includes(c.group), `group "${c.group}" of ${c.value} is listed`);
}

// ---- uniqueness (a duplicate value would silently merge two clusters) ----
const values = BLOG_CATEGORIES.map((c) => c.value);
const labels = BLOG_CATEGORIES.map((c) => c.fa);
assert.equal(values.length, new Set(values).size, 'category values are unique');
assert.equal(labels.length, new Set(labels).size, 'persian labels are unique');

// ---- lookups ----
assert.equal(findCategory('ai-agents')?.fa, 'ایجنت‌های هوش مصنوعی');
assert.equal(findCategory('nope'), undefined);
assert.equal(findCategoryByFa('بهینه‌سازی نرخ تبدیل')?.value, 'cro');
assert.equal(findCategoryByFa('ناشناس'), undefined);

// ---- every published post maps onto the taxonomy ----
for (const post of BLOG_POSTS as any[]) {
  const byValue = findCategory(post.category);
  const byFa = findCategoryByFa(post.categoryFa);
  assert.ok(
    byValue || byFa,
    `post "${post.title}" (category=${post.category} / categoryFa=${post.categoryFa}) exists in the taxonomy`,
  );
  const normalized = normalizeCategory(post);
  assert.equal(normalized.categoryFa, (byValue || byFa)!.fa, `normalizeCategory keeps the label of "${post.title}"`);
}

// ---- legacy / unknown values are preserved, never invented ----
assert.deepEqual(
  normalizeCategory({ category: 'Legacy Thing', categoryFa: 'چیز قدیمی' }),
  { category: 'Legacy Thing', categoryFa: 'چیز قدیمی' },
  'unknown pairs pass through untouched',
);
assert.deepEqual(
  normalizeCategory({ category: 'cro', categoryFa: '' }),
  { category: 'cro', categoryFa: 'بهینه‌سازی نرخ تبدیل' },
  'an English-only post gets its persian label from the taxonomy',
);

// ---- ordering: known categories before unknown ones ----
assert.ok(categoryOrder('هوش مصنوعی در مارکتینگ') < categoryOrder('طراحی و راه‌اندازی'));
assert.equal(categoryOrder('دسته‌ای که وجود ندارد'), BLOG_CATEGORIES.length);

console.log('✓ taxonomy.test.ts — all assertions passed');
