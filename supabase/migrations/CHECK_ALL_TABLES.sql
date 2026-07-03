-- ============================================================================
-- COMPREHENSIVE DATABASE DIAGNOSTIC QUERY
-- Run this in Supabase SQL Editor to see all tables and their structure
-- ============================================================================

-- 1. List ALL tables in the public schema
SELECT 
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

---

-- 2. Show detailed column information for ALL tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

---

-- 3. Check all constraints
SELECT 
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
ORDER BY table_name, constraint_type;

---

-- 4. Show all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

---

-- 5. Check if specific election tables exist
SELECT 
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='elections') as elections_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='election_positions') as positions_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='election_candidates') as candidates_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='election_payments') as payments_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='election_student_voters') as voters_exists,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='election_votes') as votes_exists;

---

-- 6. Show election tables with row counts (if they exist)
SELECT 
  'elections' as table_name,
  (SELECT COUNT(*) FROM elections) as row_count
UNION ALL
SELECT 'election_positions', COUNT(*) FROM election_positions
UNION ALL
SELECT 'election_candidates', COUNT(*) FROM election_candidates
UNION ALL
SELECT 'election_payments', COUNT(*) FROM election_payments
UNION ALL
SELECT 'election_student_voters', COUNT(*) FROM election_student_voters
UNION ALL
SELECT 'election_votes', COUNT(*) FROM election_votes;

---

-- 7. Show the users table structure (for reference)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
