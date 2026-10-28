-- Existing installations: preserve current roles and employee links.
-- Tanmay's Gmail was confirmed by the project owner. Reuse any existing alias.
BEGIN;
DO $$
DECLARE
    mapping RECORD;
    source_user public.users%ROWTYPE;
BEGIN
    FOR mapping IN SELECT * FROM (VALUES
        ('tanmay', 'prishaajit@gmail.com', 'ADMIN'),
        ('rohit', 'rohitchaurasiya143265@gmail.com', 'EMPLOYEE'),
        ('ashish', 'ashishchoudhary29006@gmail.com', 'EMPLOYEE')
    ) AS assignments(username, email, role)
    LOOP
        SELECT * INTO STRICT source_user FROM public.users WHERE username = mapping.username;
        IF source_user.role <> mapping.role OR source_user.status <> 'ACTIVE' THEN
            RAISE EXCEPTION 'Review current role/status for %', mapping.username;
        END IF;
        IF EXISTS (SELECT 1 FROM public.users WHERE lower(email) = mapping.email) THEN
            UPDATE public.users SET employee_id = source_user.employee_id,
                role = source_user.role, status = source_user.status,
                full_name = source_user.full_name, department_name = source_user.department_name,
                position = source_user.position, email = mapping.email
            WHERE lower(email) = mapping.email;
        ELSE
            UPDATE public.users SET email = mapping.email WHERE user_id = source_user.user_id;
        END IF;
    END LOOP;
END $$;
COMMIT;
