# ERP setup handoff: Google sign-in and employee admin promotion

Please finish the Google sign-in and employee admin-promotion setup for our ERP. You can complete these steps without sharing your passwords or secret keys.

The code is pushed to `main`, commit [8362ad3](https://github.com/TANMAYGOEL23/Database-System-Project/commit/8362ad3). The production build, 43 tests, and browser checks pass. The main remaining step is applying the database migration, then completing a real Google login.

Browser callback and role-management tests used explicit test responses. The real sign-in button reached Google, but a complete live login still requires the account owner to select their account and complete consent.

## 1. Open the correct Supabase project

Project reference: `khypyudvethxwhshrwjl`

[Open the Supabase project](https://supabase.com/dashboard/project/khypyudvethxwhshrwjl)

You need access to its SQL Editor and Authentication settings. Google OAuth configuration also requires access to the Google Cloud project that owns the OAuth client.

## 2. Apply the admin-promotion migration

In **Supabase → SQL Editor**, open a new query, paste the complete contents of [the admin-promotion migration](https://github.com/TANMAYGOEL23/Database-System-Project/blob/8362ad3/database/migrations/20261028_employee_admin_promotion.sql), and run it.

Repository path:

```text
database/migrations/20261028_employee_admin_promotion.sql
```

Use this migration for the existing database. There is no need to recreate the database or rerun the complete schema.

The migration:

- Creates the protected `promote_employee_to_admin` function.
- Requires the caller to be a signed-in, active administrator.
- Blocks direct browser edits to user roles.
- Allows employees to read their own user account and admins to read all user accounts.
- Records promotions in `user_role_audit`.

Confirm installation with:

```sql
SELECT
  to_regprocedure('public.promote_employee_to_admin(text)') AS promotion_function,
  to_regclass('public.user_role_audit') AS audit_table;
```

Both results should contain an object name rather than `NULL`.

Test the promotion through the signed-in application. An ordinary SQL Editor session does not have the application's signed-in user context, so calling the promotion function there can correctly return a sign-in/permission error.

## 3. Verify the three account mappings

These were already updated in the live database. Please confirm:

| Person | Google account | Role | Employee ID |
|---|---|---|---|
| Tanmay | prishaajit@gmail.com | ADMIN | EMP001 |
| Rohit | rohitchaurasiya143265@gmail.com | EMPLOYEE | EMP002 |
| Ashish | ashishchoudhary29006@gmail.com | EMPLOYEE | EMP003 |

Run:

```sql
SELECT full_name, email, employee_id, role, status
FROM public.users
WHERE lower(email) IN (
  'prishaajit@gmail.com',
  'rohitchaurasiya143265@gmail.com',
  'ashishchoudhary29006@gmail.com'
)
ORDER BY email;
```

Expect three rows, all `ACTIVE`, matching the table above.

If the links are incorrect, review and apply [the account-linking migration](https://github.com/TANMAYGOEL23/Database-System-Project/blob/8362ad3/database/migrations/20261028_google_accounts.sql). It preserves the named users' current roles and employee links and reuses existing email aliases. It stops if the expected source role or status does not match, so review any such discrepancy before proceeding.

Repository path:

```text
database/migrations/20261028_google_accounts.sql
```

## 4. Check Google OAuth settings

Google is already enabled in Supabase, and the real sign-in button successfully reached Google during testing.

In **Google Cloud → Google Auth Platform → Clients**, check the existing **Web application** OAuth client.

Its authorized redirect URI must include exactly:

```text
https://khypyudvethxwhshrwjl.supabase.co/auth/v1/callback
```

For local development, authorized JavaScript origins should include:

```text
http://localhost:3000
http://127.0.0.1:3000
```

Add the deployed application's origin to the appropriate OAuth client when deploying.

Check that the client's ID and secret are configured in **Supabase → Authentication → Providers → Google**. The secret belongs in Supabase, not the frontend.

Reference: [Supabase's Google configuration instructions](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

Because these are personal Gmail accounts, the OAuth audience must support external users. If the app's testing configuration requires a test-user list, include all three Gmail addresses above.

Reference: [Google audience settings](https://support.google.com/cloud/answer/15549945?hl=en).

## 5. Check Supabase redirect URLs

Under **Authentication → URL Configuration**, allow:

```text
http://localhost:3000/auth/callback
http://127.0.0.1:3000/auth/callback
```

If deploying, also add the real deployed address:

```text
https://YOUR_APP_DOMAIN/auth/callback
```

Replace `YOUR_APP_DOMAIN` with the actual domain.

Set **Site URL** to the deployed application's base URL, or `http://localhost:3000` while testing locally.

These are the application's callback URLs. The Google Cloud authorized redirect URI in step 4 is the separate Supabase callback URL.

Reference: [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).

## 6. Run or deploy the latest frontend

From the repository:

```bash
git pull origin main
cd UI
npm ci
npm test
npm run dev
```

Open:

```text
http://localhost:3000/login
```

The frontend needs these variables in `UI/.env.local`, or in the hosting platform's build environment:

```dotenv
VITE_SUPABASE_URL=https://khypyudvethxwhshrwjl.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Replace `YOUR_SUPABASE_PUBLISHABLE_KEY` with the project's publishable key. Despite its variable name, `VITE_SUPABASE_ANON_KEY` accepts the Supabase publishable key.

Never put a secret/service-role key in a `VITE_` variable. Google OAuth client secrets also do not belong in frontend environment variables. No secret key is needed in the browser to use the promotion feature.

Reference: [Supabase API-key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

Restart the development server after changing local environment variables. Rebuild/redeploy after changing hosting build variables.

For deployment:

- Use `UI` as the application root.
- Install dependencies using `npm ci`.
- Build using `npm run build`.
- Publish `dist` relative to `UI`, equivalent to `UI/dist` from the repository root.
- Configure the host's SPA fallback so `/auth/callback` and other application routes serve `index.html`.

## 7. Complete the live acceptance checks

- [ ] Tanmay signs in using `prishaajit@gmail.com` and receives the admin dashboard.
- [ ] Rohit signs in using `rohitchaurasiya143265@gmail.com` and receives the employee dashboard.
- [ ] Ashish signs in using `ashishchoudhary29006@gmail.com` and receives the employee dashboard.
- [ ] Reloading preserves the correct identity and role.
- [ ] Signing out returns to login and prevents opening the dashboard without signing in again.
- [ ] An unlinked Google account is denied ERP access.
- [ ] An admin opens **HR → Employees** and sees workspace roles and eligible **Make admin** buttons.
- [ ] An employee cannot open the admin employee-list page at `/hr/employees`.
- [ ] Cancelling the promotion confirmation leaves the role unchanged.
- [ ] Using a designated test employee with an active linked sign-in account, confirming promotion updates the displayed role to Admin.
- [ ] Reloading or signing in as the promoted test employee opens the admin dashboard.
- [ ] A promotion record appears in `user_role_audit`.

Use a designated test account for the promotion test so Rohit and Ashish retain their intended employee roles. The current interface promotes employees; it does not include a demotion action.

Check the promotion history with:

```sql
SELECT user_id, employee_id, changed_by_user_id,
       old_role, new_role, changed_at
FROM public.user_role_audit
ORDER BY changed_at DESC
LIMIT 10;
```

The promotion action requires an existing employee record and at least one active linked `users` account. It promotes the employee's active linked accounts. Terminated employees and employees without an active linked sign-in account cannot be promoted.

## 8. Send back the completion details

Please send:

- Confirmation that the admin-promotion migration ran successfully.
- The application URL, or confirmation that testing is local only.
- Confirmation that the Google OAuth and Supabase redirect settings are correct.
- Results of the live sign-in and promotion checks above.
- If anything fails, the exact error message with keys and tokens removed.

There is no need to send passwords, Google OAuth client secrets, Supabase secret/service-role keys, or access tokens.
