-- Follow-up to enable_rls_all_missing_tables.sql: remove overly permissive policies
-- identified by automated review (cubic). Service-role server actions bypass RLS;
-- anon should not be able to UPDATE arbitrary users or INSERT/UPDATE cursor_credits.

-- public.users: keep broad read/insert if needed for signup flows; restrict UPDATE to own row
DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update_own_row"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- public.cursor_credits: read-only for anon; admin writes use service role
DROP POLICY IF EXISTS "cursor_credits_insert" ON public.cursor_credits;
DROP POLICY IF EXISTS "cursor_credits_update" ON public.cursor_credits;
