import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transformSync } from 'esbuild';

const code = transformSync(readFileSync(new URL('../src/services/userService.ts', import.meta.url), 'utf8'), {
  loader: 'ts', format: 'cjs', target: 'es2020',
}).code;

function fixture(options = {}) {
  const users = [
    {
      userId: 'USR001',
      employeeId: 'EMP001',
      username: 'admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      fullName: 'Alexander Vance',
      email: 'alexander.vance@megafactory.internal',
      departmentName: 'Executive Operations',
      position: 'Chief Plant Operating Officer',
    },
    {
      userId: 'USR002',
      employeeId: 'EMP004',
      username: 'operator',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      fullName: 'Marcus Brody',
      email: 'marcus.brody@megafactory.internal',
      departmentName: 'Machining & Assembly',
      position: 'Lead CNC Mill Machinist',
    },
  ];

  const storage = { users: [...users] };
  const calls = [];
  const module = { exports: {} };

  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => {
      if (name === './supabase') {
        return {
          isSupabaseConfigured: () => !options.unconfigured,
          supabase: {
            from: (table) => ({
              select: () => ({
                order: () => Promise.resolve({ data: options.list || null, error: options.error }),
                eq: (col, val) => ({
                  maybeSingle: () => Promise.resolve({ data: options.single || null, error: options.error }),
                }),
                ilike: (col, val) => ({
                  maybeSingle: () => Promise.resolve({ data: options.single || null, error: options.error }),
                }),
              }),
              insert: (payload) => ({
                select: () => ({
                  single: () => Promise.resolve({
                    data: { ...payload, user_id: payload.user_id || 'USR_NEW' },
                    error: options.insertError || null,
                  }),
                }),
              }),
              update: (payload) => ({
                eq: (col, val) => ({
                  select: () => ({
                    single: () => Promise.resolve({
                      data: { ...options.existing, ...payload, user_id: val },
                      error: options.updateError || null,
                    }),
                  }),
                }),
              }),
              delete: () => ({
                eq: () => Promise.resolve({ error: options.deleteError || null }),
              }),
            }),
          },
        };
      }
      if (name === './mockStorage') {
        return {
          mockStorage: storage,
        };
      }
      return {};
    },
    console: {
      warn: () => {},
      error: () => {},
      log: () => {},
    },
  });

  return { service: module.exports.userService, storage, calls };
}

test('userService: retrieves all users with fallback', async () => {
  const { service, storage } = fixture({ unconfigured: true });
  const list = await service.getAll();
  assert.equal(list.length, 2);
  assert.equal(list[0].username, 'admin');
  assert.equal(list[1].role, 'EMPLOYEE');
});

test('userService: gets user by email case-insensitively', async () => {
  const { service } = fixture({ unconfigured: true });
  const user = await service.getByEmail('MARCUS.BRODY@megafactory.internal');
  assert.ok(user);
  assert.equal(user.userId, 'USR002');
  assert.equal(user.username, 'operator');
});

test('userService: creates a new authorized Google user account', async () => {
  const { service, storage } = fixture({ unconfigured: true });
  const created = await service.create({
    email: 'newuser@gmail.com',
    fullName: 'Jane Doe',
    username: 'jdoe',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    departmentName: 'Warehouse & Logistics',
    position: 'Forklift Operator',
    employeeId: 'EMP003',
  });

  assert.equal(created.email, 'newuser@gmail.com');
  assert.equal(created.username, 'jdoe');
  assert.equal(created.role, 'EMPLOYEE');
  assert.equal(created.employeeId, 'EMP003');
  assert.ok(created.userId);
  assert.equal(storage.users.length, 3);
});

test('userService: 1-click role switcher toggles EMPLOYEE to ADMIN', async () => {
  const { service, storage } = fixture({ unconfigured: true });
  const updated = await service.update('USR002', { role: 'ADMIN' });
  assert.equal(updated.role, 'ADMIN');
  const inMemory = storage.users.find((u) => u.userId === 'USR002');
  assert.equal(inMemory.role, 'ADMIN');
});

test('userService: 1-click role switcher toggles ADMIN to EMPLOYEE', async () => {
  const { service, storage } = fixture({ unconfigured: true });
  const updated = await service.update('USR001', { role: 'EMPLOYEE' });
  assert.equal(updated.role, 'EMPLOYEE');
  const inMemory = storage.users.find((u) => u.userId === 'USR001');
  assert.equal(inMemory.role, 'EMPLOYEE');
});

test('userService: deletes a user account', async () => {
  const { service, storage } = fixture({ unconfigured: true });
  const ok = await service.delete('USR002');
  assert.equal(ok, true);
  assert.equal(storage.users.length, 1);
  assert.equal(storage.users[0].userId, 'USR001');
});
