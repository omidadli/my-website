import assert from 'node:assert/strict';
import { localDateKey } from '../src/utils/date';

const date = new Date(2025, 0, 2, 0, 5, 0);
assert.equal(localDateKey(date), '2025-01-02');
console.log('✓ booking dates preserve the selected local calendar day');
