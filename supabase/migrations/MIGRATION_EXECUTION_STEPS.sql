-- ============================================================================
-- SUPABASE MIGRATION EXECUTION GUIDE
-- ============================================================================
-- The error "relation election_payments does not exist" means the migration
-- file hasn't been executed in your Supabase database yet.
-- 
-- Follow these steps to run all migrations:
-- ============================================================================

-- STEP 1: Open your Supabase project dashboard
-- Go to: https://app.supabase.com → Select your project → SQL Editor

-- STEP 2: Run the migrations in ORDER (as listed below)
-- Copy each migration file content and paste into the SQL Editor, then click "RUN"

-- Migration files to run IN THIS ORDER:
-- 1. supabase/migrations/20260623211837_001_initial_schema.sql
-- 2. supabase/migrations/20260625073127_002_fix_users_rls.sql
-- 3. supabase/migrations/20260625073138_003_fix_users_rls_v2.sql
-- 4. supabase/migrations/20260625073151_004_fix_admin_rls.sql
-- 5. supabase/migrations/20260625101054_005_allow_public_faculties.sql
-- 6. supabase/migrations/20260626072852_006_allow_public_student_records.sql
-- 7. supabase/migrations/20260627_007_election_management.sql  ← THIS IS MISSING!
-- 8. supabase/migrations/20260627_008_seed_election_officer.sql
-- 9. supabase/migrations/20260628_009_add_slot_fields.sql
-- 10. supabase/migrations/20260629_verification_codes.sql
-- 11. supabase/migrations/20260701_009_student_election_visibility.sql
-- 12. supabase/migrations/20260701_011_add_auditor_audit_tables.sql
-- 13. supabase/migrations/20260701_012_seed_admin_user.sql
-- ... and any others

-- STEP 3: First, run the diagnostic query
-- Open CHECK_ALL_TABLES.sql and run it to see what tables currently exist

-- STEP 4: Then run 20260627_007_election_management.sql
-- This creates all the election tables (elections, election_positions, 
-- election_candidates, election_payments, election_student_voters, election_votes)

-- STEP 5: Run the RLS policy fix
-- After migration 007, run SUPABASE_ELECTION_OFFICER_PAGE.sql section 7 
-- to fix the election_payments RLS policy

-- ============================================================================
-- QUICK CHECK: Does election_payments exist?
-- ============================================================================

SELECT EXISTS(
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema='public' AND table_name='election_payments'
) as table_exists;

-- If this returns "false", the migration hasn't been run yet.
-- If this returns "true", the migration is in place but may need the policy fix.
