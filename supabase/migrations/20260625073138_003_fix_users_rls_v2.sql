-- Drop the problematic function and all dependent policies
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Simple approach: users can read/update their own record
CREATE POLICY "users_select_own" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- Allow insert during registration
CREATE POLICY "users_insert_own" ON users FOR INSERT
  TO authenticated WITH CHECK (true);

-- Users can update own record
CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- For admin, we rely on raw_user_meta_data or service role in edge functions