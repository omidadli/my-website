import assert from 'node:assert/strict';
import { publicContentView } from '../lib/contentVisibility';

const source = {
  BLOG_POSTS: [{ id: 'pub', status: 'published' }, { id: 'draft', status: 'draft' }],
  SERVICES: [{ id: 'live' }, { id: 'hidden', status: 'draft' }],
  PRODUCTS: [{ id: 'draft-product', status: 'draft' }],
  CASE_STUDIES: [{ id: 'draft-case', status: 'draft' }],
  BLOG_COMMENTS: [
    { id: 'approved', isApproved: true, authorEmail: 'private@example.com' },
    { id: 'pending', isApproved: false, authorEmail: 'pending@example.com' },
  ],
  VERSION_HISTORY: [{ data: { secret: true } }],
  AUDIT_LOGS: [{ details: 'private' }],
};
const visible = publicContentView(source);
assert.deepEqual(visible.BLOG_POSTS, [{ id: 'pub', status: 'published' }]);
assert.deepEqual(visible.SERVICES, [{ id: 'live' }]);
assert.deepEqual(visible.PRODUCTS, []);
assert.deepEqual(visible.CASE_STUDIES, []);
assert.deepEqual(visible.BLOG_COMMENTS, [{ id: 'approved', isApproved: true, authorEmail: '' }]);
assert.deepEqual(visible.VERSION_HISTORY, []);
assert.deepEqual(visible.AUDIT_LOGS, []);
assert.equal(source.BLOG_COMMENTS[0].authorEmail, 'private@example.com', 'sanitizing never mutates stored data');
console.log('✓ public CMS responses redact drafts, private comments, history, and admin audit data');
