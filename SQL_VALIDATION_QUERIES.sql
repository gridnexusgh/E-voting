-- UEVS Database Validation Queries
-- Run these in Supabase SQL Editor to verify all tables and policies are set up

-- 1. Check all election-related tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'election%'
ORDER BY tablename;

-- Expected output:
-- election_candidates
-- election_payments
-- election_positions
-- election_student_voters
-- election_votes
-- elections

---

-- 2. Verify elections table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'elections'
ORDER BY ordinal_position;

---

-- 3. Check election officer RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE tablename IN ('elections', 'election_positions', 'election_candidates')
ORDER BY tablename, policyname;

---

-- 4. Verify seeded election officer user
SELECT id, email, role, full_name, is_email_verified 
FROM users 
WHERE role = 'election_officer'
LIMIT 1;

-- Expected: One row with email 'election_officer@example.com'

---

-- 5. Check if any elections exist
SELECT id, title, officer_id, status, created_at
FROM elections
ORDER BY created_at DESC
LIMIT 5;

---

-- 6. Verify faculties are seeded
SELECT COUNT(*) as faculty_count
FROM faculties;

-- Expected: > 0 rows

---

-- 7. Verify departments are seeded
SELECT COUNT(*) as department_count
FROM departments;

-- Expected: > 0 rows

---

-- 8. Check student records
SELECT COUNT(*) as student_count
FROM student_records;

-- Expected: > 0 rows

---

-- 9. List all users and their roles
SELECT id, email, role, full_name
FROM users
ORDER BY created_at DESC;

---

-- 10. Verify RLS is enabled on key tables
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('elections', 'election_positions', 'election_candidates', 'election_votes', 'election_student_voters')
  AND rowsecurity = true;

-- Expected: All 5 tables should have rowsecurity = true

---

-- 11. Test INSERT permission for election_officer user
-- Run this as the election_officer user (need to authenticate first)
INSERT INTO elections (
  officer_id,
  title,
  academic_year,
  category,
  voting_start,
  voting_end,
  status
) VALUES (
  auth.uid(),
  'Test Election',
  '2025/2026',
  'university',
  NOW(),
  NOW() + INTERVAL '7 days',
  'draft'
)
RETURNING id, title;

---

-- 12. Check verification_codes table (for email verification)
SELECT COUNT(*) as code_count
FROM verification_codes;

---

-- 13. List all indexes on elections tables (for performance)
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename LIKE 'election%' OR tablename = 'users')
ORDER BY tablename, indexname;

---

-- 14. Check triggers for updated_at columns
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table LIKE 'election%'
ORDER BY event_object_table;

---

-- 15. Verify auth schema has confirmation email template
-- This needs to be checked in Supabase UI, not via SQL
-- Go to: Authentication > Email Templates > Confirm signup
