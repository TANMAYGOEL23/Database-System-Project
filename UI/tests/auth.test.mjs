import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

const code = transformSync(readFileSync(new URL('../src/services/authService.ts', import.meta.url), 'utf8'), {
  loader: 'ts', format: 'cjs', target: 'es2020',
}).code;

function fixture(options = {}) {
  const calls = [];
  const storage = new Map([['smart_erp_token', 'old-demo-token'], ['smart_erp_user', '{}']]);
  const account = {
    user_id: 'USR001', employee_id: 'EMP001', username: 'tanmay', full_name: 'Tanmay Goel',
    email: 'prishaajit@gmail.com', role: 'ADMIN', status: 'ACTIVE', ...options.account,
  };
  const googleUser = {
    email: '  PrishaAjit@gmail.com  ', email_confirmed_at: '2026-10-28T00:00:00Z',
    identities: [{ provider: 'google' }],
    user_metadata: { picture: 'google-avatar', role: 'ADMIN' }, ...options.identity,
  };
  const supabase = {
    auth: {
      signInWithOAuth: async (args) => { calls.push(['oauth', args]); return { error: options.oauthError }; },
      getSession: async () => ({
        data: { session: options.noSession ? null : { access_token: 'real-google-jwt', expires_in: 3600 } },
        error: options.sessionError,
      }),
      getUser: async () => { calls.push(['verified-user']); return { data: { user: googleUser }, error: options.identityError }; },
      signOut: async () => { calls.push(['signout']); return { error: null }; },
    },
    from: (table) => {
      calls.push(['table', table]);
      return { select: () => ({ eq: (column, value) => {
        calls.push(['eq', column, value]);
        return { maybeSingle: async () => ({ data: options.missing ? null : account, error: options.dbError }) };
      } }) };
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: (name) => {
      assert.equal(name, './supabase');
      return { supabase, isSupabaseConfigured: () => !options.unconfigured };
    },
    window: { location: { origin: 'http://localhost:3000' } },
    localStorage: { removeItem: (key) => storage.delete(key) },
  });
  return { service: module.exports.authService, calls, storage };
}

test('Google sign-in uses PKCE callback and account selection', async () => {
  const { service, calls } = fixture();
  await service.signInWithGoogle();
  assert.equal(calls[0][1].provider, 'google');
  assert.equal(calls[0][1].options.redirectTo, 'http://localhost:3000/auth/callback');
  assert.equal(calls[0][1].options.queryParams.prompt, 'select_account');
  assert.equal(service.login, undefined, 'password/demo login is removed');
});

for (const [name, account] of [
  ['Tanmay', { username: 'tanmay', email: 'prishaajit@gmail.com', role: 'ADMIN', employee_id: 'EMP001' }],
  ['Rohit', { username: 'rohit', email: 'rohitchaurasiya143265@gmail.com', role: 'EMPLOYEE', employee_id: 'EMP002' }],
  ['Ashish', { username: 'ashish', email: 'ashishchoudhary29006@gmail.com', role: 'EMPLOYEE', employee_id: 'EMP003' }],
]) {
  test(`${name} receives the database role and employee profile`, async () => {
    const { service, calls } = fixture({ account, identity: { email: `  ${account.email.toUpperCase()}  ` } });
    const response = await service.completeOAuthLogin();
    assert.equal(response.user.role, account.role);
    assert.equal(response.user.employeeId, account.employee_id);
    assert.equal(response.user.email, account.email);
    assert.equal(response.token, 'real-google-jwt');
    assert.equal(response.user.avatarUrl, 'google-avatar');
    assert.equal(calls.find(([method]) => method === 'eq')[2], account.email);
    assert.equal(calls[0][0], 'verified-user');
  });
}

for (const [name, options, message] of [
  ['unconfigured OAuth', { unconfigured: true }, /unavailable/],
  ['missing session', { noSession: true }, /valid session/],
  ['expired session', { sessionError: new Error('expired') }, /expired/],
  ['invalid identity', { identityError: new Error('invalid JWT') }, /invalid JWT/],
  ['non-Google identity', { identity: { identities: [{ provider: 'email' }] } }, /verified Google/],
  ['unverified email', { identity: { email_confirmed_at: null } }, /verified Google/],
  ['missing email', { identity: { email: null } }, /verified Google/],
  ['unlinked Gmail', { missing: true }, /No ERP account/],
  ['inactive account', { account: { status: 'INACTIVE' } }, /active workspace/],
  ['suspended account', { account: { status: 'SUSPENDED' } }, /active workspace/],
  ['missing status', { account: { status: null } }, /active workspace/],
  ['unknown role', { account: { role: 'OWNER' } }, /active workspace/],
  ['database unavailable', { dbError: new Error('offline') }, /Unable to load/],
]) {
  test(`rejects ${name}`, async () => {
    await assert.rejects(fixture(options).service.completeOAuthLogin(), message);
  });
}

test('denied access signs out and clears the old demo cache', async () => {
  const { service, calls, storage } = fixture({ missing: true });
  await assert.rejects(service.completeOAuthLogin());
  assert.ok(calls.some(([method]) => method === 'signout'));
  assert.equal(storage.size, 0);
});

test('Google provider errors are shown instead of falling back to demo access', async () => {
  await assert.rejects(fixture({ oauthError: new Error('provider unavailable') }).service.signInWithGoogle(), /provider unavailable/);
  await assert.rejects(fixture({ unconfigured: true }).service.signInWithGoogle(), /unavailable/);
});

test('logout clears app credentials and Supabase session', async () => {
  const { service, calls, storage } = fixture();
  await service.logout();
  assert.equal(storage.size, 0);
  assert.ok(calls.some(([method]) => method === 'signout'));
});
