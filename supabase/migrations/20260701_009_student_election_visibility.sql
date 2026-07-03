-- Add student visibility policies for elections and positions

-- Allow authenticated student users to select elections they are eligible for.
-- University-wide elections are visible to all students.
-- Faculty elections are visible to students in the same faculty.
-- Department elections are visible to students in the same department.
CREATE POLICY "elections_select_student" ON elections FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role = 'student'
      AND (
        elections.category = 'university'
        OR (elections.category = 'faculty' AND elections.scope_id = users.faculty_id)
        OR (elections.category = 'department' AND elections.scope_id = users.department_id)
      )
  )
);

-- Allow authenticated students to select election positions when the parent election is visible.
CREATE POLICY "positions_select_student" ON election_positions FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM elections
    JOIN users ON users.id = auth.uid()
    WHERE elections.id = election_positions.election_id
      AND users.role = 'student'
      AND (
        elections.category = 'university'
        OR (elections.category = 'faculty' AND elections.scope_id = users.faculty_id)
        OR (elections.category = 'department' AND elections.scope_id = users.department_id)
      )
  )
);
