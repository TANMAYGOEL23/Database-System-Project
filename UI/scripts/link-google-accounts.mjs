// Run from UI: node scripts/link-google-accounts.mjs [--apply]
// The secret key is read only by this administrative Node script, never Vite.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const localEnv = Object.fromEntries(
  readFileSync(fileURLToPath(new URL('../.env', import.meta.url)), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, '$2')];
    })
);
const env = { ...localEnv, ...process.env };
const base = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const secret = env.SUPABASE_SECRET_KEY;
if (!base || !secret) throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in UI/.env.');

async function request(path, options = {}) {
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: secret, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Database request failed (${response.status}). No credentials logged.`);
  return response.json();
}

const assignments = [
  { username: 'tanmay', email: 'prishaajit@gmail.com', role: 'ADMIN' },
  { username: 'rohit', email: 'rohitchaurasiya143265@gmail.com', role: 'EMPLOYEE' },
  { username: 'ashish', email: 'ashishchoudhary29006@gmail.com', role: 'EMPLOYEE' },
];
const columns = 'user_id,employee_id,email,role,status,username,full_name,department_name,position';
const users = await request(`users?select=${columns}`);
// Validate all mappings before making changes. Existing email aliases are reused.
const changes = assignments.map((assignment) => {
  const source = users.find((user) => user.username === assignment.username);
  if (!source || source.role !== assignment.role || source.status !== 'ACTIVE') {
    throw new Error(`Review the current role/status for ${assignment.username} before applying.`);
  }
  const target = users.find((user) => user.email.toLowerCase() === assignment.email) || source;
  const patch = Object.fromEntries(
    ['employee_id', 'role', 'status', 'full_name', 'department_name', 'position'].map((key) => [key, source[key]])
  );
  return { target, patch: { ...patch, email: assignment.email } };
});

for (const { target, patch } of changes) {
  if (process.argv.includes('--apply')) {
    const updated = await request(`users?user_id=eq.${encodeURIComponent(target.user_id)}`, {
      method: 'PATCH', body: JSON.stringify(patch),
    });
    if (updated.length !== 1) throw new Error('Expected exactly one updated account.');
  }
  console.log(`${process.argv.includes('--apply') ? 'Linked' : 'Would link'} ${patch.full_name}: ${patch.email} -> ${patch.role} (${patch.employee_id})`);
}

if (process.argv.includes('--apply')) {
  const updated = await request(`users?select=${columns}`);
  for (const assignment of assignments) {
    const matches = updated.filter((user) => user.email === assignment.email);
    if (matches.length !== 1 || matches[0].role !== assignment.role || matches[0].status !== 'ACTIVE') {
      throw new Error(`Verification failed for ${assignment.username}.`);
    }
  }
  console.log('Verified all three email mappings in the live database.');
}
