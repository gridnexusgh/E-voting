-- ============================================================================
-- SUPABASE BACKEND OPERATIONS (SQL EDITOR VERSION)
-- Project: voting_system
-- ============================================================================
-- Usage:
-- 1) Replace placeholder values before running.
-- 2) Run section-by-section in Supabase SQL Editor.
-- 3) Auth operations (sign up/sign in) are done via Supabase Auth API, not SQL.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) QUICK PARAMS (edit values once, then reuse)
-- ----------------------------------------------------------------------------
-- You can copy these values into each query where needed.
-- Example placeholders used below:
--   :user_id, :officer_id, :election_id, :position_id, :candidate_id, :faculty_id


-- ----------------------------------------------------------------------------
-- 1) PROFILE AND USERS
-- ----------------------------------------------------------------------------

-- Fetch current app profile by auth user id
select *
from users
where id = '00000000-0000-0000-0000-000000000000';

-- Update last login
update users
set last_login = now()
where id = '00000000-0000-0000-0000-000000000000';

-- Create user profile row (after auth user is created)
insert into users (
  id,
  email,
  password_hash,
  role,
  full_name,
  username,
  student_record_id,
  faculty_id,
  department_id,
  scope,
  is_email_verified,
  is_face_enrolled,
  is_active
) values (
  '00000000-0000-0000-0000-000000000000',
  'student@example.com',
  '',
  'student',
  'Student Name',
  null,
  null,
  null,
  null,
  null,
  true,
  false,
  true
);

-- Update user profile
update users
set
  full_name = 'Updated Name',
  username = 'updated_username',
  scope = 'university',
  faculty_id = null,
  department_id = null,
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000';

-- Delete user
delete from users
where id = '00000000-0000-0000-0000-000000000000';


-- ----------------------------------------------------------------------------
-- 2) FACULTIES AND DEPARTMENTS
-- ----------------------------------------------------------------------------

-- List faculties
select *
from faculties
order by name;

-- Create faculty
insert into faculties (name, code, description)
values ('Faculty of Applied Sciences', 'FAS', 'Faculty description');

-- Update faculty
update faculties
set
  name = 'Faculty of Applied Sciences and Tech',
  code = 'FAST',
  description = 'Updated description',
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000';

-- Delete faculty
delete from faculties
where id = '00000000-0000-0000-0000-000000000000';

-- List departments
select d.*, f.name as faculty_name
from departments d
left join faculties f on f.id = d.faculty_id
order by d.name;

-- List departments by faculty
select *
from departments
where faculty_id = '00000000-0000-0000-0000-000000000000'
order by name;

-- Create department
insert into departments (faculty_id, name, code, description)
values (
  '00000000-0000-0000-0000-000000000000',
  'Computer Science',
  'CS',
  'Department description'
);

-- Update department
update departments
set
  faculty_id = '00000000-0000-0000-0000-000000000000',
  name = 'Computer Science and Engineering',
  code = 'CSE',
  description = 'Updated department',
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000';

-- Delete department
delete from departments
where id = '00000000-0000-0000-0000-000000000000';


-- ----------------------------------------------------------------------------
-- 3) STUDENT RECORDS
-- ----------------------------------------------------------------------------

-- Verify active student by id/faculty/department
select *
from student_records
where student_id = '03212345'
  and faculty_id = '00000000-0000-0000-0000-000000000000'
  and department_id = '00000000-0000-0000-0000-000000000000'
  and status = 'active'
limit 1;

-- Check if student already has an account
select id
from users
where student_record_id = '00000000-0000-0000-0000-000000000000'
limit 1;

-- Upsert student record by student_id
insert into student_records (
  student_id,
  full_name,
  email,
  faculty_id,
  department_id,
  status
) values (
  '03212345',
  'Student Name',
  '03212345@htu.edu.gh',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'active'
)
on conflict (student_id)
do update set
  full_name = excluded.full_name,
  email = excluded.email,
  faculty_id = excluded.faculty_id,
  department_id = excluded.department_id,
  status = excluded.status,
  updated_at = now();

-- List student records
select
  sr.*, f.name as faculty_name, d.name as department_name
from student_records sr
left join faculties f on f.id = sr.faculty_id
left join departments d on d.id = sr.department_id
order by sr.created_at desc;


-- ----------------------------------------------------------------------------
-- 4) ELECTIONS
-- ----------------------------------------------------------------------------

-- Create election
insert into elections (
  officer_id,
  title,
  description,
  academic_year,
  category,
  scope_id,
  status,
  nomination_start,
  nomination_end,
  voting_start,
  voting_end,
  slot_application_fee,
  enable_payment
) values (
  '00000000-0000-0000-0000-000000000000',
  'SRC General Elections 2026',
  'Main student elections',
  '2026/2027',
  'university',
  null,
  'draft',
  now(),
  now() + interval '7 days',
  now() + interval '14 days',
  now() + interval '15 days',
  0,
  false
)
returning *;

-- List elections by officer
select *
from elections
where officer_id = '00000000-0000-0000-0000-000000000000'
order by created_at desc;

-- Get election by id
select *
from elections
where id = '00000000-0000-0000-0000-000000000000';

-- Update election
update elections
set
  title = 'Updated Election Title',
  description = 'Updated description',
  status = 'published',
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000'
returning *;

-- Active/published student elections
select *
from elections
where status in ('active', 'published')
order by voting_start asc;

-- Dashboard slices
-- Active or published
select *
from elections
where officer_id = '00000000-0000-0000-0000-000000000000'
  and status in ('active', 'published')
order by voting_end asc;

-- Draft
select *
from elections
where officer_id = '00000000-0000-0000-0000-000000000000'
  and status = 'draft'
order by voting_start asc;

-- Completed
select *
from elections
where officer_id = '00000000-0000-0000-0000-000000000000'
  and status in ('closed', 'results_published')
order by voting_end desc;


-- ----------------------------------------------------------------------------
-- 5) ELECTION POSITIONS
-- ----------------------------------------------------------------------------

-- Create position
insert into election_positions (
  election_id,
  position_name,
  description,
  number_of_winners,
  display_order,
  application_opening,
  application_closing,
  application_fee,
  max_applicants,
  is_enabled,
  status
) values (
  '00000000-0000-0000-0000-000000000000',
  'President',
  'Main executive position',
  1,
  1,
  now(),
  now() + interval '7 days',
  0,
  null,
  true,
  'published'
)
returning *;

-- List positions by election
select *
from election_positions
where election_id = '00000000-0000-0000-0000-000000000000'
order by display_order asc;

-- Update position
update election_positions
set
  position_name = 'Vice President',
  description = 'Updated description',
  number_of_winners = 1,
  display_order = 2,
  is_enabled = true,
  status = 'published',
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000'
returning *;

-- Delete position
delete from election_positions
where id = '00000000-0000-0000-0000-000000000000';


-- ----------------------------------------------------------------------------
-- 6) ELECTION CANDIDATES
-- ----------------------------------------------------------------------------

-- Candidate applies for a position
insert into election_candidates (
  election_id,
  user_id,
  position_id,
  student_record_id,
  application_status,
  manifesto,
  profile_image_url,
  payment_status,
  is_visible_for_voting
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'pending',
  'My manifesto',
  null,
  'pending',
  false
)
returning *;

-- List candidates for election
select
  c.*,
  u.full_name as user_full_name,
  u.email as user_email,
  p.position_name,
  sr.student_id,
  sr.full_name as student_full_name
from election_candidates c
left join users u on u.id = c.user_id
left join election_positions p on p.id = c.position_id
left join student_records sr on sr.id = c.student_record_id
where c.election_id = '00000000-0000-0000-0000-000000000000'
order by c.submission_date desc;

-- List pending candidates
select
  c.*,
  u.full_name as user_full_name,
  u.email as user_email,
  p.position_name,
  sr.student_id,
  sr.full_name as student_full_name
from election_candidates c
left join users u on u.id = c.user_id
left join election_positions p on p.id = c.position_id
left join student_records sr on sr.id = c.student_record_id
where c.election_id = '00000000-0000-0000-0000-000000000000'
  and c.application_status = 'pending'
order by c.submission_date asc;

-- Approve candidate
update election_candidates
set
  application_status = 'approved',
  approval_date = now(),
  approved_by = '00000000-0000-0000-0000-000000000000',
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000'
returning *;

-- Reject candidate
update election_candidates
set
  application_status = 'rejected',
  rejection_reason = 'Insufficient requirements',
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000'
returning *;

-- Publish approved candidates for voting
update election_candidates
set
  is_visible_for_voting = true,
  updated_at = now()
where id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
)
returning *;


-- ----------------------------------------------------------------------------
-- 7) PAYMENTS
-- ----------------------------------------------------------------------------

-- Create payment
insert into election_payments (
  election_id,
  candidate_id,
  amount,
  payment_status,
  payment_method,
  transaction_id,
  reference_number
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  50.00,
  'pending',
  'mobile_money',
  null,
  'REF-0001'
)
returning *;

-- List payments by election
select
  ep.*,
  ec.id as candidate_ref,
  u.full_name as candidate_name,
  u.email as candidate_email,
  p.position_name
from election_payments ep
left join election_candidates ec on ec.id = ep.candidate_id
left join users u on u.id = ec.user_id
left join election_positions p on p.id = ec.position_id
where ep.election_id = '00000000-0000-0000-0000-000000000000'
order by ep.created_at desc;

-- List payments by candidate
select *
from election_payments
where candidate_id = '00000000-0000-0000-0000-000000000000'
order by created_at desc;

-- Update payment status
update election_payments
set
  payment_status = 'successful',
  transaction_id = 'TXN-12345',
  paid_at = now(),
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000'
returning *;


-- ----------------------------------------------------------------------------
-- 8) ELIGIBLE VOTERS
-- ----------------------------------------------------------------------------

-- Add eligible student voters (bulk)
insert into election_student_voters (election_id, student_record_id)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003')
returning *;

-- List eligible voters
select
  ev.*,
  sr.student_id,
  sr.full_name,
  sr.email
from election_student_voters ev
left join student_records sr on sr.id = ev.student_record_id
where ev.election_id = '00000000-0000-0000-0000-000000000000'
order by ev.created_at desc;

-- Mark a voter as voted
update election_student_voters
set
  has_voted = true,
  voted_at = now()
where election_id = '00000000-0000-0000-0000-000000000000'
  and user_id = '00000000-0000-0000-0000-000000000000';


-- ----------------------------------------------------------------------------
-- 9) VOTING AND RESULTS
-- ----------------------------------------------------------------------------

-- Cast vote
insert into election_votes (
  election_id,
  voter_id,
  candidate_id,
  position_id
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000'
)
returning *;

-- Raw election result rows
select
  ev.*,
  ec.id as candidate_ref,
  u.full_name as candidate_name,
  p.position_name
from election_votes ev
left join election_candidates ec on ec.id = ev.candidate_id
left join users u on u.id = ec.user_id
left join election_positions p on p.id = ec.position_id
where ev.election_id = '00000000-0000-0000-0000-000000000000';

-- Vote totals by candidate per election
select
  candidate_id,
  count(*) as vote_count
from election_votes
where election_id = '00000000-0000-0000-0000-000000000000'
group by candidate_id
order by vote_count desc;

-- Vote totals by position and candidate
select
  position_id,
  candidate_id,
  count(*) as vote_count
from election_votes
where election_id = '00000000-0000-0000-0000-000000000000'
group by position_id, candidate_id
order by position_id, vote_count desc;

-- Publish results (status update)
update elections
set
  status = 'results_published',
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000'
returning *;


-- ----------------------------------------------------------------------------
-- 10) STATS QUERIES
-- ----------------------------------------------------------------------------

-- Total eligible voters
select count(*) as total_voters
from election_student_voters
where election_id = '00000000-0000-0000-0000-000000000000';

-- Total votes cast
select count(*) as total_votes_cast
from election_votes
where election_id = '00000000-0000-0000-0000-000000000000';

-- Candidate status counts
select application_status, count(*) as total
from election_candidates
where election_id = '00000000-0000-0000-0000-000000000000'
group by application_status;

-- Payment status counts
select payment_status, count(*) as total
from election_payments
where election_id = '00000000-0000-0000-0000-000000000000'
group by payment_status;


-- ----------------------------------------------------------------------------
-- 11) FACE ENROLLMENT DB ACTIONS
-- ----------------------------------------------------------------------------

-- Read status
select id, is_face_enrolled
from users
where id = '00000000-0000-0000-0000-000000000000';

-- Mark enrolled
update users
set
  is_face_enrolled = true,
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000';

-- Optional: update stored embedding (bytea)
-- update users
-- set face_embedding = decode('A1B2C3', 'hex')
-- where id = '00000000-0000-0000-0000-000000000000';


-- ----------------------------------------------------------------------------
-- 12) IMPORTANT POLICY FIX (PAYMENTS SELECT)
-- ----------------------------------------------------------------------------
-- Existing policy references election_payments.user_id (column does not exist).
-- Replace with candidate ownership check.

drop policy if exists "payments_select_officer" on election_payments;

create policy "payments_select_fixed"
on election_payments
for select
to authenticated
using (
  exists (
    select 1
    from elections
    where elections.id = election_payments.election_id
      and elections.officer_id = auth.uid()
  )
  or exists (
    select 1
    from election_candidates ec
    where ec.id = election_payments.candidate_id
      and ec.user_id = auth.uid()
  )
  or exists (
    select 1
    from users
    where users.id = auth.uid()
      and users.role in ('admin', 'auditor')
  )
);

-- ============================================================================
-- END
-- ============================================================================
