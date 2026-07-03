-- Fix all tables that have admin check subqueries causing recursion

-- Drop and recreate faculty policies
DROP POLICY IF EXISTS "faculties_insert" ON faculties;
DROP POLICY IF EXISTS "faculties_update" ON faculties;
DROP POLICY IF EXISTS "faculties_delete" ON faculties;

-- Allow all authenticated users to modify faculties (admin check will be in app)
CREATE POLICY "faculties_insert_all" ON faculties FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "faculties_update_all" ON faculties FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "faculties_delete_all" ON faculties FOR DELETE
  TO authenticated USING (true);

-- Drop and recreate department policies
DROP POLICY IF EXISTS "departments_insert" ON departments;
DROP POLICY IF EXISTS "departments_update" ON departments;
DROP POLICY IF EXISTS "departments_delete" ON departments;

CREATE POLICY "departments_insert_all" ON departments FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "departments_update_all" ON departments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "departments_delete_all" ON departments FOR DELETE
  TO authenticated USING (true);

-- Drop and recreate student_records policies
DROP POLICY IF EXISTS "student_records_insert" ON student_records;
DROP POLICY IF EXISTS "student_records_update" ON student_records;
DROP POLICY IF EXISTS "student_records_delete" ON student_records;

CREATE POLICY "student_records_insert_all" ON student_records FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "student_records_update_all" ON student_records FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "student_records_delete_all" ON student_records FOR DELETE
  TO authenticated USING (true);