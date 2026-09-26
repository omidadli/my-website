import assert from 'node:assert/strict';
import { normalizeCaseStudies, safeExternalUrl } from '../src/utils/caseStudies';

const [caseStudy] = normalizeCaseStudies([{
  id: 'legacy',
  title: 'نمونهٔ قدیمی',
  metrics: null,
  metricsComparison: null,
  challenge: null,
  solution: 7,
  tags: null,
}]);
assert.equal(caseStudy.id, 'legacy');
assert.equal(caseStudy.metrics.roas, '—');
assert.deepEqual(caseStudy.metricsComparison, []);
assert.equal(caseStudy.challenge, 'اطلاعات این بخش هنوز ثبت نشده است.');
assert.equal(caseStudy.solution, 'اطلاعات این بخش هنوز ثبت نشده است.');
assert.deepEqual(caseStudy.tags, []);
assert.deepEqual(normalizeCaseStudies(null), []);
assert.equal(safeExternalUrl('javascript:alert(1)'), null);
assert.equal(safeExternalUrl('/relative/path'), null);
assert.equal(safeExternalUrl('https://example.com/path'), 'https://example.com/path');
console.log('✓ malformed/legacy case studies and preview URLs are handled safely');
