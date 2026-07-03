-- Allow anonymous (unauthenticated) users to read student_records
-- This is needed for the registration page to verify students

DROP POLICY IF EXISTS "student_records_select" ON student_records;

-- Create new policy that allows public read access
CREATE POLICY "student_records_select_public" ON student_records FOR SELECT
  USING (true);

-- Enable RLS and grant select to anon role
ALTER TABLE student_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON student_records TO anon;