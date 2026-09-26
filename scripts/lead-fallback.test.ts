/**
 * Unit tests for the WhatsApp lead fallback (used when /api/leads fails).
 * Run: npx tsx scripts/lead-fallback.test.ts
 */
import assert from 'node:assert/strict';
import { toIntlIranPhone, whatsappFallbackUrl } from '../src/utils/leadFallback';

assert.equal(toIntlIranPhone('09933773515'), '989933773515');
assert.equal(toIntlIranPhone('۰۹۹۳۳۷۷۳۵۱۵'), '989933773515', 'Persian digits are normalised');
assert.equal(toIntlIranPhone('+98 993 377 3515'), '989933773515');
assert.equal(toIntlIranPhone('0098 993 377 3515'), '989933773515');

const url = whatsappFallbackUrl({ whatsappUrl: 'https://wa.me/989933773515' }, [
  ['نام', 'علی'],
  ['تماس', ''],
  ['توضیح', ' سلام '],
]);
assert.equal(url, `https://wa.me/989933773515?text=${encodeURIComponent('نام: علی\nتوضیح: سلام')}`, 'empty values are skipped, others trimmed');

assert.equal(
  whatsappFallbackUrl({ phone: '۰۹۹۳۳۷۷۳۵۱۵' }, [['نام', 'x']]),
  `https://wa.me/989933773515?text=${encodeURIComponent('نام: x')}`,
  'falls back to the phone number when whatsappUrl is empty',
);
assert.equal(whatsappFallbackUrl({ whatsappUrl: 'https://wa.me/1?a=b' }, [['k', 'v']]), 'https://wa.me/1?a=b&text=k%3A%20v', 'keeps existing query');
assert.equal(whatsappFallbackUrl(null, []), 'https://wa.me/', 'no data → bare link');

console.log('✓ lead fallback: all assertions passed');
