/**
 * WordPress-style slug generation — Persian friendly.
 * Keeps Persian/Arabic letters and Latin letters/numbers, converts ZWNJ and
 * whitespace/punctuation to dashes. Result is URL-safe (percent-encoded when Persian).
 */
export const slugify = (input: string): string =>
  (input || '')
    .trim()
    .toLowerCase()
    .replace(/\u200c/g, '-') // ZWNJ → dash
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/** Ensures `base` is unique against `existing` slugs by appending -2, -3, … */
export const uniqueSlug = (base: string, existing: string[]): string => {
  const slug = slugify(base) || 'item';
  if (!existing.includes(slug)) return slug;
  let i = 2;
  while (existing.includes(`${slug}-${i}`)) i += 1;
  return `${slug}-${i}`;
};
