import assert from 'node:assert/strict';
import { mergeContentDefaults } from '../src/utils/contentDefaults';

const defaults = {
  services: [{ id: 'default', features: ['one'] }],
  blog: { posts: [], search: 'Search' },
  theme: { dark: true, scale: 1 },
  custom: 'safe',
};
const merged = mergeContentDefaults(defaults, {
  services: null,
  blog: { posts: {}, search: 12, customKey: 'preserved' },
  theme: { dark: false, scale: 1.2 },
  custom: 'overridden',
  unknown: 'preserved',
});
assert.deepEqual(merged.services, defaults.services, 'wrong-shaped collection falls back to defaults');
assert.deepEqual(merged.blog.posts, [], 'nested wrong-shaped collection falls back to defaults');
assert.equal(merged.blog.search, 'Search', 'wrong scalar types fall back to defaults');
assert.equal((merged as any).blog.customKey, 'preserved');
assert.equal(merged.theme.dark, false);
assert.equal(merged.theme.scale, 1.2);
assert.equal(merged.custom, 'overridden');
assert.equal((merged as any).unknown, 'preserved');
assert.deepEqual(mergeContentDefaults(defaults, { services: [], blog: { posts: [], search: 'Search' }, theme: { dark: true, scale: 1 }, custom: 'safe' }).services, [], 'intentional empty arrays stay empty');
console.log('✓ CMS/local content snapshots are merged defensively against the default schema');
