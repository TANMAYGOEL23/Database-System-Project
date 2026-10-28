import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

const code = transformSync(readFileSync(new URL('../src/services/employeeAccessService.ts', import.meta.url), 'utf8'), {
  loader: 'ts', format: 'cjs', target: 'es2020',
}).code;
const account = { user_id: 'USR002', employee_id: 'EMP002', email: 'employee@gmail.com', role: 'ADMIN', status: 'ACTIVE' };
function fixture(options = {}) {
  const calls = [];
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: () => ({
      isSupabaseConfigured: () => !options.unconfigured,
      supabase: {
        from: (table) => ({ select: async (columns) => {
          calls.push({ table, columns });
          return { data: options.list || [account], error: options.error };
        } }),
        rpc: async (name, args) => {
          calls.push({ name, args });
          return { data: options.result === undefined ? [account] : options.result, error: options.error };
        },
      },
    }),
  });
  return { service: module.exports.employeeAccessService, calls };
}

test('loads employee access without exposing unused account fields', async () => {
  const { service, calls } = fixture();
  const users = await service.getAccounts();
  assert.equal(users[0].employeeId, 'EMP002');
  assert.equal(calls[0].columns, 'user_id,employee_id,email,role,status');
});

test('promotion calls the protected RPC with only the employee ID', async () => {
  const { service, calls } = fixture();
  const result = await service.makeAdmin('EMP002');
  assert.equal(result[0].role, 'ADMIN');
  assert.equal(calls[0].name, 'promote_employee_to_admin');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].args)), { p_employee_id: 'EMP002' });
});

for (const [name, result] of [
  ['empty response', []], ['null response', null],
  ['wrong employee', [{ ...account, employee_id: 'OTHER' }]],
  ['unchanged role', [{ ...account, role: 'EMPLOYEE' }]],
  ['inactive account', [{ ...account, status: 'INACTIVE' }]],
]) {
  test(`promotion does not report success for ${name}`, async () => {
    await assert.rejects(fixture({ result }).service.makeAdmin('EMP002'), /could not be confirmed/);
  });
}

test('authorization errors stay visible and never fall back to direct updates', async () => {
  const { service, calls } = fixture({ error: { code: '42501', message: 'Only active administrators can grant admin access.' } });
  await assert.rejects(service.makeAdmin('EMP002'), /Only active administrators/);
  assert.equal(calls.length, 1);
});

test('missing migration gives an actionable error', async () => {
  await assert.rejects(fixture({ error: { code: 'PGRST202' } }).service.makeAdmin('EMP002'), /has not been enabled/);
});

test('unconfigured access and missing employee IDs fail without making requests', async () => {
  const { service, calls } = fixture({ unconfigured: true });
  await assert.rejects(service.getAccounts(), /unavailable/);
  await assert.rejects(service.makeAdmin('EMP002'), /unavailable/);
  assert.equal(calls.length, 0);
  await assert.rejects(fixture().service.makeAdmin('  '), /Select an employee/);
});

test('failed role loading is reported', async () => {
  await assert.rejects(fixture({ error: { message: 'offline' } }).service.getAccounts(), /Unable to load/);
});
