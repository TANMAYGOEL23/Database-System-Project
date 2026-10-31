// Dependency-free browser smoke test. Requires Chrome and a running Vite server.
// Uses an isolated, temporary Chrome profile; never accesses personal cookies.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

const origin = process.env.TEST_ORIGIN || 'http://localhost:3000';
const defaultChrome = process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromePath = process.env.CHROME_PATH || defaultChrome;
const profile = mkdtempSync(join(tmpdir(), 'erp-auth-check-'));
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sockets = [];
async function connect(url) {
  const socket = new WebSocket(url);
  sockets.push(socket);
  await once(socket, 'open');
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  socket.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id) {
      const callback = pending.get(msg.id);
      if (!callback) return;
      pending.delete(msg.id);
      msg.error ? callback.reject(new Error(msg.error.message)) : callback.resolve(msg.result);
    } else {
      for (const callback of listeners.get(msg.method) || []) callback(msg.params);
    }
  });
  return {
    send: (method, params = {}) => new Promise((resolve, reject) => {
      const key = ++id;
      pending.set(key, { resolve, reject });
      socket.send(JSON.stringify({ id: key, method, params }));
    }),
    on: (method, callback) => listeners.set(method, [...listeners.get(method) || [], callback]),
  };
}

try {
  const endpoint = await new Promise((resolve, reject) => {
    let stderr = '';
    const timeout = setTimeout(() => reject(new Error('Chrome startup timed out')), 20000);
    chrome.stderr.on('data', (data) => {
      stderr += data;
      const match = stderr.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
    chrome.on('error', reject);
    chrome.on('exit', (code) => reject(new Error(`Chrome exited: ${code}`)));
  });
  const browser = await connect(endpoint);
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const targets = await (await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/list`)).json();
  const page = await connect(targets.find((target) => target.id === targetId).webSocketDebuggerUrl);
  await page.send('Page.enable');
  await page.send('Network.enable');
  await page.send('Runtime.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  const evaluate = async (expression) => {
    const result = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  async function waitFor(expression, label, timeout = 20000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      try { if (await evaluate(expression)) return; } catch { /* page navigation */ }
      await sleep(200);
    }
    const state = await evaluate('({ path: location.pathname, text: document.body?.innerText.slice(0, 1200) })').catch(() => ({}));
    throw new Error(`Timed out: ${label}: ${JSON.stringify(state)}`);
  }
  async function navigate(path) {
    await page.send('Page.navigate', { url: origin + path });
    await waitFor('document.readyState === "complete"', 'page load');
  }

  await navigate('/login');
  await waitFor('!!document.querySelector("#google-signin-button")', 'Google sign-in button');
  assert.equal(await evaluate('document.querySelectorAll("input").length'), 0);
  assert.equal(await evaluate('document.querySelectorAll("button").length'), 1);
  assert.equal(await evaluate('/1-Click|password123|operator credentials/.test(document.body.innerText)'), false);
  mkdirSync('test-results', { recursive: true });
  const screenshot = await page.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('test-results/google-login.png', Buffer.from(screenshot.data, 'base64'));
  console.log('PASS: login renders only Google sign-in. Screenshot: UI/test-results/google-login.png');

  await evaluate(`localStorage.setItem('smart_erp_user', JSON.stringify({ role: 'ADMIN', fullName: 'Fake admin' })); localStorage.setItem('smart_erp_token', 'mock-jwt-token-admin');`);
  await navigate('/dashboard');
  await waitFor('location.pathname === "/login"', 'reject old demo session');
  assert.equal(await evaluate('localStorage.getItem("smart_erp_token")'), null);
  console.log('PASS: old demo credentials cannot open the dashboard.');

  let oauthRequest;
  let googleAuthorization;
  page.on('Network.requestWillBeSent', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname === '/auth/v1/authorize') oauthRequest = url;
    if (url.hostname === 'accounts.google.com' && url.searchParams.has('state')) googleAuthorization = url;
  });
  await evaluate('document.querySelector("#google-signin-button").click()');
  await waitFor('location.hostname === "accounts.google.com"', 'live redirect to Google', 30000);
  await waitFor('document.readyState === "complete" && !!document.body', 'Google account page', 30000);
  assert.equal(oauthRequest?.searchParams.get('provider'), 'google');
  assert.equal(oauthRequest?.searchParams.get('redirect_to'), origin + '/auth/callback');
  assert.ok(oauthRequest?.searchParams.get('code_challenge'));
  if (googleAuthorization) {
    const state = googleAuthorization.searchParams.get('state');
    if (state?.split('.').length === 3) {
      const payload = JSON.parse(Buffer.from(state.split('.')[1], 'base64url').toString());
      if (payload.referrer) assert.equal(payload.referrer, origin + '/auth/callback', 'Supabase must allow the local callback URL');
    }
  }
  const googleState = await evaluate('({ path: location.pathname, text: document.body.innerText.slice(0, 1500) })');
  assert.ok(!/redirect_uri_mismatch|invalid_client|Access blocked|Error 400/i.test(googleState.text), googleState.text);
  assert.ok(!googleState.path.includes('/oauth/error'), 'Google rejected the OAuth configuration');
  console.log('PASS: the real sign-in button reaches Google with a PKCE challenge and the correct callback.');

  // Exercise callback, dashboard routing, reload, and logout with explicit test
  // responses. This verifies the application; it does not claim Google consent.
  await navigate('/login');
  const authStorageKey = await evaluate(`(async () => (await import('/src/services/supabase.ts')).supabase.auth.storageKey)()`);
  assert.ok(authStorageKey, 'Configured Supabase session storage key');
  let fixtureScript;
  async function installFixture(email, role, name, linked = true) {
    if (fixtureScript) await page.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: fixtureScript });
    await evaluate('localStorage.clear(); sessionStorage.clear()');
    const account = { user_id: 'TEST_USER', employee_id: 'TEST_EMPLOYEE', username: name.toLowerCase(), full_name: name, email, role, status: 'ACTIVE' };
    const identity = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email,
      email_confirmed_at: new Date().toISOString(), identities: [{ provider: 'google' }],
      app_metadata: { provider: 'google', providers: ['google'] }, user_metadata: { full_name: name } };
    const token = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(JSON.stringify({ sub: identity.id, aud: 'authenticated', role: 'authenticated', email, exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url'),
      'test-signature',
    ].join('.');
    const session = { access_token: token, refresh_token: 'test-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now()/1000)+3600, user: identity };
    const script = `(() => {
      const session = ${JSON.stringify(session)};
      const account = ${JSON.stringify(account)};
      const employeeAccounts = [account,
        { user_id: 'PROMOTE', employee_id: 'E_PROMOTE', email: 'rohit-test@gmail.com', role: sessionStorage.getItem('test-promoted') ? 'ADMIN' : 'EMPLOYEE', status: 'ACTIVE' },
        { user_id: 'OTHER', employee_id: 'E_OTHER', email: 'ashish-test@gmail.com', role: 'EMPLOYEE', status: 'ACTIVE' },
        { user_id: 'INACTIVE', employee_id: 'E_INACTIVE', email: 'inactive@gmail.com', role: 'EMPLOYEE', status: 'SUSPENDED' },
        { user_id: 'TERMINATED', employee_id: 'E_TERMINATED', email: 'terminated@gmail.com', role: 'EMPLOYEE', status: 'ACTIVE' },
      ];
      const employees = [
        ['TEST_EMPLOYEE', ${JSON.stringify(name)}, 'ACTIVE'], ['E_PROMOTE', 'Rohit Test', 'ACTIVE'],
        ['E_OTHER', 'Ashish Test', 'ACTIVE'], ['E_INACTIVE', 'Inactive Test', 'ACTIVE'],
        ['E_UNLINKED', 'Unlinked Test', 'ACTIVE'], ['E_TERMINATED', 'Terminated Test', 'TERMINATED'],
      ].map(([employee_id, full_name, status]) => ({
        employee_id, full_name, first_name: full_name.split(' ')[0], last_name: full_name.split(' ').slice(1).join(' '),
        status, gender: 'MALE', phone: '9876543210', email: employee_id + '@factory.test',
        salary: 65000, joining_date: '2024-01-01', department_id: 'D_TEST', department_name: 'Operations',
        position: 'Operator', address: 'Factory campus',
      }));
      window.__accessFixture = { requests: 0, failPromotion: false };
      const realFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = new URL(typeof input === 'string' ? input : input.url);
        const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
        if (url.pathname === '/auth/v1/token') return json(session);
        if (url.pathname === '/auth/v1/user') return json(session.user);
        if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
        if (url.pathname === '/rest/v1/users') return json(${linked ? "url.searchParams.get('select') === '*' ? account : employeeAccounts" : 'null'});
        if (url.pathname === '/rest/v1/employees') return json(employees);
        if (url.pathname === '/rest/v1/departments') return json([{ department_id: 'D_TEST', department_name: 'Operations' }]);
        if (url.pathname === '/rest/v1/rpc/promote_employee_to_admin') {
          window.__accessFixture.requests++;
          await new Promise((resolve) => setTimeout(resolve, 200));
          if (account.role !== 'ADMIN' || window.__accessFixture.failPromotion) {
            return json({ code: '42501', message: 'Only active administrators can grant admin access.' }, 403);
          }
          const employeeId = JSON.parse(init.body).p_employee_id;
          const promoted = employeeAccounts.filter((item) => item.employee_id === employeeId && item.status === 'ACTIVE');
          promoted.forEach((item) => { item.role = 'ADMIN'; });
          sessionStorage.setItem('test-promoted', 'true');
          return json(promoted);
        }
        if (url.pathname.startsWith('/rest/v1/')) return json([]);
        return realFetch(input, init);
      };
      if (!sessionStorage.getItem('test-initialized')) {
        localStorage.setItem(${JSON.stringify(authStorageKey + '-code-verifier')}, JSON.stringify('test-verifier'));
        sessionStorage.setItem('test-initialized', 'true');
      }
    })();`;
    fixtureScript = (await page.send('Page.addScriptToEvaluateOnNewDocument', { source: script })).identifier;
  }

  for (const [email, role, name] of [
    ['prishaajit@gmail.com', 'ADMIN', 'Tanmay Goel'],
    ['rohitchaurasiya143265@gmail.com', 'EMPLOYEE', 'Rohit Chaurasiya'],
    ['ashishchoudhary29006@gmail.com', 'EMPLOYEE', 'Ashish'],
  ]) {
    await installFixture(email, role, name);
    await navigate('/auth/callback?code=test-authorization-code');
    await waitFor('location.pathname === "/dashboard"', name + ' callback');
    await waitFor('!!localStorage.getItem("smart_erp_user")', 'saved ERP session');
    assert.equal(await evaluate('JSON.parse(localStorage.getItem("smart_erp_user")).role'), role);
    assert.equal(await evaluate('JSON.parse(localStorage.getItem("smart_erp_user")).email'), email);
    assert.ok(await evaluate(`document.body.innerText.includes(${JSON.stringify(name.split(' ')[0])})`));
    if (role === 'ADMIN') {
      await navigate('/hr/employees');
      await waitFor('!!document.querySelector(\'[aria-label="Make Rohit Test an admin"]\')', 'admin promotion action');
      assert.equal(await evaluate('document.querySelectorAll(\'button[aria-label^="Make "]\').length'), 2);
      await evaluate('document.querySelector(\'[aria-label="Make Rohit Test an admin"]\').click()');
      await waitFor('document.body.innerText.includes("Grant admin access?")', 'promotion confirmation');
      await evaluate('Array.from(document.querySelectorAll("button")).find((button) => button.textContent.trim() === "Cancel").click()');
      assert.equal(await evaluate('window.__accessFixture.requests'), 0);
      await evaluate('document.querySelector(\'[aria-label="Make Rohit Test an admin"]\').click()');
      await evaluate('Array.from(document.querySelectorAll("button")).find((button) => button.textContent.trim() === "Make admin" && !button.hasAttribute("aria-label")).click()');
      assert.ok(await evaluate('Array.from(document.querySelectorAll("button")).find((button) => button.textContent.trim() === "Make admin" && !button.hasAttribute("aria-label")).disabled'));
      await waitFor('!document.querySelector(\'[aria-label="Make Rohit Test an admin"]\') && document.body.innerText.includes("Admin Access Granted")', 'promotion result');
      assert.equal(await evaluate('window.__accessFixture.requests'), 1);
      assert.ok(await evaluate('Array.from(document.querySelectorAll("tr")).find((row) => row.innerText.includes("Rohit Test")).innerText.includes("Admin")'));
      const employeeScreenshot = await page.send('Page.captureScreenshot', { format: 'png' });
      writeFileSync('test-results/employee-admin-access.png', Buffer.from(employeeScreenshot.data, 'base64'));
      await evaluate('window.__accessFixture.failPromotion = true; document.querySelector(\'[aria-label="Make Ashish Test an admin"]\').click()');
      await evaluate('Array.from(document.querySelectorAll("button")).find((button) => button.textContent.trim() === "Make admin" && !button.hasAttribute("aria-label")).click()');
      await waitFor('document.body.innerText.includes("Could Not Grant Admin Access")', 'promotion failure');
      assert.ok(await evaluate('!!document.querySelector(\'[aria-label="Make Ashish Test an admin"]\')'));
      await evaluate('Array.from(document.querySelectorAll("button")).find((button) => button.textContent.trim() === "Cancel").click()');
      await navigate('/hr/employees');
      await waitFor('document.body.innerText.includes("Rohit Test")', 'reload employee list');
      assert.equal(await evaluate('!!document.querySelector(\'[aria-label="Make Rohit Test an admin"]\')'), false);
      console.log('PASS (test responses): employee roles, confirmation/cancel, promotion, error handling, and persistence.');
    } else {
      await navigate('/hr/employees');
      await waitFor('location.pathname === "/unauthorized"', 'employee denied access to role management');
      assert.equal(await evaluate('document.querySelectorAll(\'button[aria-label^="Make "]\').length'), 0);
      console.log('PASS (test responses): employees cannot open the admin employee list.');
    }
    await evaluate(`localStorage.setItem('smart_erp_user', JSON.stringify({ role: 'ADMIN', fullName: 'Tampered' }))`);
    await navigate('/dashboard');
    await waitFor(`JSON.parse(localStorage.getItem('smart_erp_user') || '{}').email === ${JSON.stringify(email)}`, 'reload validation');
    assert.equal(await evaluate('JSON.parse(localStorage.getItem("smart_erp_user")).role'), role);
    console.log(`PASS (test responses): ${name} callback, ${role} dashboard, and session reload.`);
    await evaluate(`(async () => { const { supabase } = await import('/src/services/supabase.ts'); await supabase.auth.signOut(); })()`);
    await waitFor('location.pathname === "/login"', 'logout');
    assert.equal(await evaluate('localStorage.getItem("smart_erp_user")'), null);
  }

  await installFixture('unlinked@gmail.com', 'EMPLOYEE', 'Unlinked', false);
  await navigate('/auth/callback?code=test-authorization-code');
  await waitFor('document.body.innerText.includes("No ERP account")', 'reject unlinked Google email');
  assert.equal(await evaluate('localStorage.getItem("smart_erp_token")'), null);
  console.log('PASS (test responses): an unlinked Google email is denied.');
  console.log('Google account selection and consent still require the account owner.');
} finally {
  for (const socket of sockets) socket.close();
  chrome.kill();
}
