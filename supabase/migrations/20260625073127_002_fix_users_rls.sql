-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_delete" ON users;

-- Create safe policies using auth.uid() directly without subquery
-- For SELECT: user can only read their own record
CREATE POLICY "users_select_self" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- For admin operations, we need a different approach
-- Create a function to check admin role safely (with security definer to bypass RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Admin can read all users
CREATE POLICY "users_select_admin" ON users FOR SELECT
  TO authenticated USING (is_admin());

-- Update: user can update own record, admin can update any
CREATE POLICY "users_update_self" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id OR is_admin());

-- Delete: only admin can delete
CREATE POLICY "users_delete_admin" ON users FOR DELETE
  TO authenticated USING (is_admin());