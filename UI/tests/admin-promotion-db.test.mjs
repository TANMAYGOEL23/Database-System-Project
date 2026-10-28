import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Execute the production migration in PostgreSQL with Supabase's auth helpers
// represented by JWT settings. SET ROLE exercises actual grants and RLS.
const db = new PGlite();
const migration = readFileSync(new URL('../../database/migrations/20261028_employee_admin_promotion.sql', import.meta.url), 'utf8');
const actorAuthId = '00000000-0000-4000-8000-000000000001';

before(async () => {
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
      SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
    $$;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT (auth.jwt() ->> 'sub')::uuid;
    $$;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated;
    CREATE TABLE public.users (
      user_id text PRIMARY KEY, employee_id text, username text UNIQUE,
      email text UNIQUE NOT NULL, role text NOT NULL, status text NOT NULL,
      full_name text, department_name text, position text
    );
    CREATE TABLE public.employees (employee_id text PRIMARY KEY, status text NOT NULL);
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow public read-write for dev on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
    GRANT ALL ON public.users TO anon, authenticated;
  `);
  await db.exec(migration);
});

beforeEach(async () => {
  await db.exec(`
    RESET ROLE;
    SELECT set_config('request.jwt.claims', '{}', false);
    TRUNCATE public.users, public.employees, public.user_role_audit RESTART IDENTITY;
    INSERT INTO public.employees VALUES ('E_ADMIN','ACTIVE'), ('E_EMP','ACTIVE'),
      ('E_TERMINATED','TERMINATED'), ('E_UNLINKED','ACTIVE'), ('E_LEAVE','ON_LEAVE'), ('E_INACTIVE','ACTIVE');
    INSERT INTO public.users (user_id, employee_id, username, email, role, status) VALUES
      ('ADMIN','E_ADMIN','admin','admin@gmail.com','ADMIN','ACTIVE'),
      ('EMP','E_EMP','employee','employee@gmail.com','EMPLOYEE','ACTIVE'),
      ('ALIAS','E_EMP','alias','alias@gmail.com','EMPLOYEE','ACTIVE'),
      ('SUSPENDED_ALIAS','E_EMP','suspended_alias','suspended-alias@gmail.com','EMPLOYEE','SUSPENDED'),
      ('TERMINATED','E_TERMINATED','terminated','terminated@gmail.com','EMPLOYEE','ACTIVE'),
      ('LEAVE','E_LEAVE','leave','leave@gmail.com','EMPLOYEE','ACTIVE'),
      ('INACTIVE','E_INACTIVE','inactive','inactive@gmail.com','EMPLOYEE','INACTIVE'),
      ('INACTIVE_ADMIN','E_ADMIN','inactive_admin','inactive-admin@gmail.com','ADMIN','INACTIVE');
  `);
});
after(async () => { await db.close(); });

async function asRole(role, email, query, params = [], extraClaims = {}) {
  await db.exec(`SET ROLE ${role}`);
  await db.query("SELECT set_config('request.jwt.claims', $1, false)", [JSON.stringify({
    ...(email ? { sub: actorAuthId, email } : {}), ...extraClaims,
  })]);
  try { return await db.query(query, params); }
  finally { await db.exec('RESET ROLE'); }
}
const promote = (email, employee = 'E_EMP') => asRole('authenticated', email,
  'SELECT * FROM public.promote_employee_to_admin($1)', [employee]);

test('database: active admin promotes linked active accounts and records the actor', async () => {
  const { rows } = await promote('admin@gmail.com');
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => row.role === 'ADMIN' && row.employee_id === 'E_EMP'));
  const audit = (await db.query('SELECT * FROM public.user_role_audit ORDER BY user_id')).rows;
  assert.equal(audit.length, 2);
  assert.ok(audit.every((row) => row.changed_by_user_id === 'ADMIN' && row.changed_by_auth_id === actorAuthId));
  assert.equal((await db.query("SELECT role FROM public.users WHERE user_id='SUSPENDED_ALIAS'")).rows[0].role, 'EMPLOYEE');
  assert.equal((await db.query("SELECT role FROM public.users WHERE user_id='LEAVE'")).rows[0].role, 'EMPLOYEE');
});

test('database: employee cannot promote themselves or anyone else', async () => {
  await assert.rejects(promote('employee@gmail.com'), { code: '42501' });
  await assert.rejects(promote('employee@gmail.com', 'E_LEAVE'), { code: '42501' });
  assert.equal((await db.query('SELECT count(*)::int AS total FROM public.user_role_audit')).rows[0].total, 0);
});

test('database: browser metadata claiming ADMIN does not grant permission', async () => {
  await assert.rejects(asRole('authenticated', 'employee@gmail.com',
    "SELECT * FROM public.promote_employee_to_admin('E_EMP')", [],
    { user_metadata: { role: 'ADMIN' }, app_metadata: { role: 'ADMIN' } }), { code: '42501' });
});

test('database: anonymous and unauthenticated requests are denied', async () => {
  await assert.rejects(asRole('anon', null, "SELECT * FROM public.promote_employee_to_admin('E_EMP')"), { code: '42501' });
  await assert.rejects(promote(null), { code: '42501' });
});

test('database: inactive admins and unlinked identities are denied', async () => {
  await assert.rejects(promote('inactive-admin@gmail.com'), { code: '42501' });
  await assert.rejects(promote('unknown@gmail.com'), { code: '42501' });
});

test('database: direct role updates are denied even to admins', async () => {
  for (const email of ['employee@gmail.com', 'admin@gmail.com']) {
    await assert.rejects(asRole('authenticated', email,
      "UPDATE public.users SET role='ADMIN' WHERE user_id='EMP'"), { code: '42501' });
    await assert.rejects(asRole('authenticated', email,
      "INSERT INTO public.users (user_id,email,role,status) VALUES ('FAKE','fake@gmail.com','ADMIN','ACTIVE')"), { code: '42501' });
  }
});

test('database: users can read only their own account, admins can read all', async () => {
  const own = await asRole('authenticated', 'employee@gmail.com', 'SELECT user_id FROM public.users');
  assert.deepEqual(own.rows.map((row) => row.user_id), ['EMP']);
  const all = await asRole('authenticated', 'admin@gmail.com', 'SELECT user_id FROM public.users');
  assert.equal(all.rows.length, 8);
  await assert.rejects(asRole('anon', null, 'SELECT * FROM public.users'), { code: '42501' });
});

test('database: terminated, missing, unlinked, and inactive targets are rejected', async () => {
  await assert.rejects(promote('admin@gmail.com', 'E_TERMINATED'), /terminated employee/);
  await assert.rejects(promote('admin@gmail.com', 'MISSING'), /not found/);
  await assert.rejects(promote('admin@gmail.com', 'E_UNLINKED'), /active linked sign-in account/);
  await assert.rejects(promote('admin@gmail.com', 'E_INACTIVE'), /active linked sign-in account/);
});

test('database: an employee on leave can be promoted if their account is active', async () => {
  assert.equal((await promote('admin@gmail.com', 'E_LEAVE')).rows[0].role, 'ADMIN');
});

test('database: duplicate requests do not create duplicate audit entries', async () => {
  await promote('admin@gmail.com');
  assert.equal((await promote('admin@gmail.com')).rows.length, 2);
  assert.equal((await db.query('SELECT count(*)::int AS total FROM public.user_role_audit')).rows[0].total, 2);
});

test('database: only admins can read history and clients cannot forge it', async () => {
  await promote('admin@gmail.com');
  assert.equal((await asRole('authenticated', 'employee@gmail.com', 'SELECT * FROM public.user_role_audit')).rows.length, 2);
  // This identity was just promoted and may now read history. An employee who
  // was not promoted still cannot read it or insert history directly.
  assert.equal((await asRole('authenticated', 'leave@gmail.com', 'SELECT * FROM public.user_role_audit')).rows.length, 0);
  await assert.rejects(asRole('authenticated', 'leave@gmail.com',
    "INSERT INTO public.user_role_audit (user_id,employee_id,changed_by_user_id,changed_by_auth_id,old_role,new_role) VALUES ('LEAVE','E_LEAVE','ADMIN','00000000-0000-4000-8000-000000000001','EMPLOYEE','ADMIN')"), { code: '42501' });
});

test('database: migration is safe to apply again', async () => {
  await db.exec(migration);
  await assert.rejects(promote('employee@gmail.com'), { code: '42501' });
  assert.equal((await promote('admin@gmail.com')).rows.length, 2);
});
