-- Admin-only employee promotion. Apply once to an existing Supabase project.
BEGIN;

CREATE OR REPLACE FUNCTION public.is_erp_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.users AS account
        WHERE lower(account.email) = lower(auth.jwt() ->> 'email')
          AND account.role = 'ADMIN' AND account.status = 'ACTIVE'
    );
$$;
REVOKE ALL ON FUNCTION public.is_erp_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_erp_admin() TO authenticated;

-- Prevent direct role edits, including requests that bypass the application UI.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-write for dev on users" ON public.users;
DROP POLICY IF EXISTS "Read own account or administer users" ON public.users;
CREATE POLICY "Read own account or administer users" ON public.users
    FOR SELECT TO authenticated USING (
        lower(email) = lower(auth.jwt() ->> 'email') OR public.is_erp_admin()
    );
REVOKE ALL ON public.users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.users TO authenticated;

CREATE TABLE IF NOT EXISTS public.user_role_audit (
    audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id text NOT NULL,
    employee_id text NOT NULL,
    changed_by_user_id text NOT NULL,
    changed_by_auth_id uuid NOT NULL,
    old_role text NOT NULL,
    new_role text NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_role_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_role_audit TO authenticated;
DROP POLICY IF EXISTS "Admins read role history" ON public.user_role_audit;
CREATE POLICY "Admins read role history" ON public.user_role_audit
    FOR SELECT TO authenticated USING (public.is_erp_admin());

CREATE OR REPLACE FUNCTION public.promote_employee_to_admin(p_employee_id text)
RETURNS SETOF public.users
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    actor_id text;
    employment_status text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in as an administrator to manage workspace access.' USING ERRCODE = '42501';
    END IF;
    SELECT account.user_id INTO actor_id FROM public.users AS account
    WHERE lower(account.email) = lower(auth.jwt() ->> 'email')
      AND account.role = 'ADMIN' AND account.status = 'ACTIVE'
    FOR SHARE;
    IF actor_id IS NULL THEN
        RAISE EXCEPTION 'Only active administrators can grant admin access.' USING ERRCODE = '42501';
    END IF;
    -- Serialize concurrent promotions of the same employee.
    SELECT employee.status INTO employment_status FROM public.employees AS employee
    WHERE employee.employee_id = p_employee_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employee record not found.' USING ERRCODE = 'P0002';
    END IF;
    IF employment_status = 'TERMINATED' THEN
        RAISE EXCEPTION 'A terminated employee cannot receive admin access.' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.users AS account
        WHERE account.employee_id = p_employee_id AND account.status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'This employee needs an active linked sign-in account before receiving admin access.' USING ERRCODE = '22023';
    END IF;

    RETURN QUERY
    WITH promoted AS (
        UPDATE public.users AS account SET role = 'ADMIN'
        WHERE account.employee_id = p_employee_id AND account.status = 'ACTIVE' AND account.role = 'EMPLOYEE'
        RETURNING account.*
    ), logged AS (
        INSERT INTO public.user_role_audit
            (user_id, employee_id, changed_by_user_id, changed_by_auth_id, old_role, new_role)
        SELECT account.user_id, account.employee_id, actor_id, auth.uid(), 'EMPLOYEE', 'ADMIN'
        FROM promoted AS account
    )
    SELECT account.* FROM promoted AS account;

    IF NOT FOUND THEN
        -- Repeated requests are safe and do not create duplicate audit entries.
        RETURN QUERY SELECT account.* FROM public.users AS account
        WHERE account.employee_id = p_employee_id AND account.status = 'ACTIVE' AND account.role = 'ADMIN';
    END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.promote_employee_to_admin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_employee_to_admin(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
