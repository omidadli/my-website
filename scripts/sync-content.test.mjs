#!/usr/bin/env node
/**
 * Unit tests for the Git ⇄ live-site content merge (scripts/sync-content.mjs).
 *   node scripts/sync-content.test.mjs
 */
import assert from 'node:assert/strict';
import { mergeContent } from './sync-content.mjs';

const base = { A: 1, B: { x: 1 }, C: [1] };
let n = 0;
const test = (name, fn) => { fn(); n++; console.log('✓', name); };

test('live-only sections are preserved; without a base Git wins', () => {
  const r = mergeContent({ git: { A: 2 }, live: { A: 1, THEME_CONFIG: 'dark' }, base: null });
  assert.deepEqual(r.merged, { A: 2, THEME_CONFIG: 'dark' });
  assert.deepEqual(r.taken, ['A']);
});

test('3-way: live-only change is kept, Git-only change is taken', () => {
  const r = mergeContent({ git: { A: 2, B: { x: 1 }, C: [1] }, live: { A: 1, B: { x: 9 }, C: [1], T: 't' }, base });
  assert.deepEqual(r.merged, { A: 2, B: { x: 9 }, C: [1], T: 't' });
  assert.deepEqual(r.kept, ['B']);
  assert.deepEqual(r.taken, ['A']);
  assert.deepEqual(r.conflicts, []);
});

test('3-way: both sides changed the same section → conflict reported (Git value staged)', () => {
  const r = mergeContent({ git: { A: 1, B: { x: 1 }, C: [2] }, live: { A: 1, B: { x: 1 }, C: [3] }, base });
  assert.deepEqual(r.conflicts, ['C']);
  assert.deepEqual(r.merged.C, [2]);
});

test('identical content → nothing to write', () => {
  const r = mergeContent({ git: { A: 1 }, live: { A: 1, Z: 0 }, base });
  assert.deepEqual(r.taken, []);
  assert.deepEqual(r.merged, { A: 1, Z: 0 });
});

test('object key order does not count as a change', () => {
  const r = mergeContent({ git: { B: { x: 1, y: 2 } }, live: { B: { y: 2, x: 1 } }, base: null });
  assert.deepEqual(r.taken, []);
});

test('empty live site is seeded from Git', () => {
  const r = mergeContent({ git: { NEW: 1 }, live: null, base: null });
  assert.deepEqual(r.merged, { NEW: 1 });
  assert.deepEqual(r.taken, ['NEW']);
});

test('section added in Git (absent from base and live) is taken', () => {
  const r = mergeContent({ git: { A: 1, B: { x: 1 }, C: [1], NEW: 'n' }, live: { A: 1, B: { x: 1 }, C: [1] }, base });
  assert.deepEqual(r.taken, ['NEW']);
  assert.equal(r.merged.NEW, 'n');
});

console.log(`\nsync-content merge: ${n} tests passed`);
