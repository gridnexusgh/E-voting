-- Allow anonymous (unauthenticated) users to read faculties and departments
-- This is needed for the registration page

-- Drop existing select policies
DROP POLICY IF EXISTS "faculties_select" ON faculties;
DROP POLICY IF EXISTS "departments_select" ON departments;

-- Create new policies that allow anon access
CREATE POLICY "faculties_select_public" ON faculties FOR SELECT
  USING (true);

CREATE POLICY "departments_select_public" ON departments FOR SELECT
  USING (true);

-- Also enable anon role access on these tables
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Grant select to anon role
GRANT SELECT ON faculties TO anon;
GRANT SELECT ON departments TO anon;