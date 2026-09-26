/**
 * Admin-login diagnostics: functions/api/auth.ts + functions/api/health.ts.
 *   npx tsx scripts/auth-flow.test.mjs
 *
 * Why this exists: "نام کاربری یا رمز عبور اشتباه است" used to be shown for three unrelated
 * failures (secrets not bound to the deployment, IP lockout, wrong credentials). These tests
 * pin the status codes, the health payload and the guarantee that no secret value leaks.
 *
 * The Pages Functions are plain request handlers, so they run on a stub D1 here — no wrangler,
 * no network. Run with tsx (not node) because it imports the TypeScript function modules.
 */
import assert from 'node:assert/strict';

const { onRequestPost: login } = await import('../functions/api/auth.ts');
const { onRequestGet: health } = await import('../functions/api/health.ts');

let n = 0;
const test = async (name, fn) => { await fn(); n++; console.log('✓', name); };

const CREDS = { ADMIN_USERNAME: 'omid', ADMIN_PASSWORD: 'S3cret!pass', AUTH_SECRET: 'unit-test-secret' };

/** Minimal D1Database stub: counts rows for the rate-limit query, records writes. */
const makeDb = (failureRows = []) => {
  const written = [];
  const db = {
    prepare(sql) {
      return {
        bind: (...values) => ({
          first: async () => ({ c: failureRows.length }),
          all: async () => ({ results: failureRows }),
          run: async () => { written.push({ sql: sql.trim().slice(0, 30), values }); },
        }),
      };
    },
    batch: async () => [],
  };
  return { db, written };
};

const makeRequest = (method, body, ip = '203.0.113.7') =>
  new Request('https://omidadli01.site/api/auth', {
    method,
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

/** Call a Pages Function handler with only the context fields these two functions touch. */
const call = (handler, { request, env }) =>
  handler({ request, env, next: async () => new Response(), params: {}, waitUntil: () => {}, data: {} });

const postLogin = (env, username, password, ip) =>
  call(login, { request: makeRequest('POST', { username, password }, ip), env });
const getHealth = (env, ip) => call(health, { request: makeRequest('GET', undefined, ip), env });

const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000).toISOString();

// --- 1. Secrets not bound to the deployment -----------------------------------------------
await test('login answers 503 + the missing variable NAMES (never values) when secrets are absent', async () => {
  const { db } = makeDb();
  const r = await postLogin({ DB: db }, 'omid', 'S3cret!pass');
  const j = await r.json();
  assert.equal(r.status, 503, 'must not look like a wrong-password (401) problem');
  assert.equal(j.ok, false);
  assert.deepEqual(j.missing, ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'AUTH_SECRET']);
  assert.match(j.error, /دیپلوی/, 'explains that this is a deployment/secrets problem, in Persian');
  assert.equal(j.hint, '/api/health');
});

await test('health reports the same problem with fix instructions', async () => {
  const { db } = makeDb();
  const r = await getHealth({ DB: db });
  const j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.ok, true);
  assert.equal(j.ready, false);
  assert.deepEqual(j.auth, { configured: false, missing: ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'AUTH_SECRET'] });
  assert.equal(j.bindings.d1, true);
  assert.equal(j.login.locked, false);
  assert.ok(j.hints.length >= 3, 'hints cover dashboard, redeploy and wrangler.toml pitfalls');
  assert.ok(j.hints.some((h) => /دیپلوی/.test(h)), 'mentions that Pages binds secrets at deploy time');
  assert.ok(j.hints.some((h) => /GitHub|گیت‌هاب/.test(h)), 'mentions that GitHub Actions secrets are not the login source');
  assert.equal(r.headers.get('cache-control'), 'no-store', 'diagnostics must never be cached');
});

// --- 2. Healthy configuration --------------------------------------------------------------
await test('correct credentials → 200 + a signed token; wrong ones → 401 with no detail leak', async () => {
  const { db, written } = makeDb();
  const env = { DB: db, ...CREDS };

  const ok = await postLogin(env, 'omid', 'S3cret!pass');
  const okBody = await ok.json();
  assert.equal(ok.status, 200);
  assert.equal(okBody.ok, true);
  assert.equal(String(okBody.token).split('.').length, 2, 'payload.signature HMAC token');
  assert.ok(okBody.expiresAt > Date.now());

  const bad = await postLogin(env, 'omid', 'wrong-password');
  const badBody = await bad.json();
  assert.equal(bad.status, 401);
  assert.equal(badBody.error, 'نام کاربری یا رمز عبور اشتباه است.');
  assert.equal(badBody.missing, undefined);

  const attempts = written.filter((w) => w.sql.startsWith('INSERT INTO login_attempts'));
  assert.equal(attempts.length, 2, 'both attempts are recorded for the rate limiter');
  assert.equal(attempts[0].values[2], 1, 'success flag = 1');
  assert.equal(attempts[1].values[2], 0, 'failure flag = 0');
});

await test('comparison is exact: username case and a trailing space in the password are rejected', async () => {
  const { db } = makeDb();
  const env = { DB: db, ...CREDS };
  assert.equal((await postLogin(env, 'Omid', 'S3cret!pass')).status, 401, 'username is case-sensitive');
  assert.equal((await postLogin(env, 'omid', 'S3cret!pass ')).status, 401, 'password is never trimmed');
  assert.equal((await postLogin(env, ' omid ', 'S3cret!pass')).status, 200, 'username IS trimmed (form + server)');
});

await test('health stays green and never echoes a secret value', async () => {
  const { db } = makeDb();
  const r = await getHealth({ DB: db, ...CREDS });
  const j = await r.json();
  const raw = JSON.stringify(j);
  assert.equal(j.ready, true);
  assert.equal(j.auth.configured, true);
  assert.deepEqual(j.auth.missing, []);
  assert.equal(j.login.locked, false);
  assert.ok(!raw.includes('S3cret!pass') && !raw.includes('unit-test-secret') && !raw.includes('"omid"'));
  assert.ok(j.hints.some((h) => /فاصله|حساس/.test(h)), 'still hints at whitespace/case when everything looks fine');
});

// --- 3. Rate-limit lockout ------------------------------------------------------------------
await test('after 8 failed attempts the IP is locked (429) and health says when it lifts', async () => {
  // 8 failures, newest 2 minutes ago → the oldest of the last 8 expires in ~5 minutes.
  const rows = Array.from({ length: 8 }, (_, i) => ({ attempted_at: minutesAgo(10 - i), success: 0 }));
  const { db } = makeDb(rows);
  const env = { DB: db, ...CREDS };

  const r = await postLogin(env, 'omid', 'S3cret!pass');
  const j = await r.json();
  assert.equal(r.status, 429, 'even correct credentials are refused while locked');
  assert.match(j.error, /تلاش‌های ناموفق زیاد/);

  const h = await getHealth(env);
  const hj = await h.json();
  assert.equal(hj.ready, false);
  assert.equal(hj.login.locked, true);
  assert.equal(hj.login.failedAttempts, 8);
  assert.equal(hj.login.maxFailures, 8);
  assert.equal(hj.login.windowMinutes, 15);
  assert.ok(hj.login.retryAfterMinutes >= 1 && hj.login.retryAfterMinutes <= 15, `retry in ${hj.login.retryAfterMinutes} min`);
  assert.match(hj.message, /قفل/);
});

await test('7 failures stay under the limit — login still works', async () => {
  const rows = Array.from({ length: 7 }, (_, i) => ({ attempted_at: minutesAgo(i + 1), success: 0 }));
  const { db } = makeDb(rows);
  const env = { DB: db, ...CREDS };
  assert.equal((await postLogin(env, 'omid', 'S3cret!pass')).status, 200);
  const hj = await (await getHealth(env)).json();
  assert.equal(hj.ready, true);
  assert.equal(hj.login.locked, false);
});

// --- 4. Missing bindings / malformed input ---------------------------------------------------
await test('missing D1 binding is reported by health instead of failing silently', async () => {
  const r = await getHealth({ ...CREDS });
  const j = await r.json();
  assert.equal(j.bindings.d1, false);
  assert.equal(j.ready, false);
  assert.equal(j.database.reachable, null, 'not probed without a binding');
  assert.ok(j.hints.some((h) => /D1|بایندینگ/.test(h)));
});

await test('malformed JSON body → 400, and a non-object body never crashes the handler', async () => {
  const { db } = makeDb();
  const env = { DB: db, ...CREDS };
  const bad = await call(login, {
    request: new Request('https://omidadli01.site/api/auth', { method: 'POST', body: 'not-json' }),
    env,
  });
  assert.equal(bad.status, 400);
  const empty = await postLogin(env, undefined, undefined);
  assert.equal(empty.status, 401, 'missing fields are treated as wrong credentials, not a 500');
});

console.log(`\nauth-flow: ${n} checks passed`);
