-- ============================================================================
-- SUPABASE SQL: ELECTION OFFICER PAGE ONLY
-- ============================================================================
-- Scope: queries/operations used by Election Officer pages and services.
-- Tables: elections, election_positions, election_candidates,
--         election_payments, election_student_voters, election_votes,
--         plus faculties/departments lookups.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) LOOKUPS (used when creating scoped elections)
-- ----------------------------------------------------------------------------

-- Faculties
select *
from faculties
order by name;

-- Departments by faculty
select *
from departments
where faculty_id = '00000000-0000-0000-0000-000000000000'
order by name;


-- ----------------------------------------------------------------------------
-- 1) ELECTIONS
-- ----------------------------------------------------------------------------

-- Officer elections list
select *
from elections
where officer_id = '00000000-0000-0000-0000-000000000000'
order by created_at desc;

-- Get election by id
select *
from elections
where id = '00000000-0000-0000-0000-000000000000';

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
  'Election description',
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

-- Update election details
update elections
set
  title = 'Updated Election Title',
  description = 'Updated election description',
  academic_year = '2026/2027',
  category = 'university',
  scope_id = null,
  nomination_start = now(),
  nomination_end = now() + interval '7 days',
  voting_start = now() + interval '14 days',
  voting_end = now() + interval '15 days',
  slot_application_fee = 0,
  enable_payment = false,
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000'
returning *;

-- Status transitions
-- publish
update elections set status = 'published', updated_at = now() where id = '00000000-0000-0000-0000-000000000000' returning *;
-- activate
update elections set status = 'active', updated_at = now() where id = '00000000-0000-0000-0000-000000000000' returning *;
-- pause
update elections set status = 'paused', updated_at = now() where id = '00000000-0000-0000-0000-000000000000' returning *;
-- resume
update elections set status = 'active', updated_at = now() where id = '00000000-0000-0000-0000-000000000000' returning *;
-- close
update elections set status = 'closed', updated_at = now() where id = '00000000-0000-0000-0000-000000000000' returning *;
-- publish results
update elections set status = 'results_published', updated_at = now() where id = '00000000-0000-0000-0000-000000000000' returning *;

-- Dashboard groupings
-- Active/published
select *
from elections
where officer_id = '00000000-0000-0000-0000-000000000000'
  and status in ('active', 'published')
order by voting_end asc;

-- Draft/upcoming
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
-- 2) ELECTION POSITIONS / SLOT MANAGEMENT
-- ----------------------------------------------------------------------------

-- List positions for election
select *
from election_positions
where election_id = '00000000-0000-0000-0000-000000000000'
order by display_order asc;

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
  'Main executive role',
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

-- Update position
update election_positions
set
  position_name = 'Vice President',
  description = 'Updated role description',
  number_of_winners = 1,
  display_order = 2,
  application_opening = now(),
  application_closing = now() + interval '7 days',
  application_fee = 0,
  max_applicants = null,
  is_enabled = true,
  status = 'published',
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000'
returning *;

-- Delete position
delete from election_positions
where id = '00000000-0000-0000-0000-000000000000';

-- Position candidate stats (payment status spread)
select position_id, payment_status
from election_candidates
where position_id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);


-- ----------------------------------------------------------------------------
-- 3) CANDIDATE APPROVAL FLOW
-- ----------------------------------------------------------------------------

-- All candidates for election
select
  c.*,
  u.id as user_id_ref,
  u.full_name as user_full_name,
  u.email as user_email,
  p.id as position_id_ref,
  p.position_name,
  sr.id as student_record_id_ref,
  sr.student_id,
  sr.full_name as student_full_name
from election_candidates c
left join users u on u.id = c.user_id
left join election_positions p on p.id = c.position_id
left join student_records sr on sr.id = c.student_record_id
where c.election_id = '00000000-0000-0000-0000-000000000000'
order by c.submission_date desc;

-- Pending candidates
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

-- Approved-only list
select
  c.*,
  u.full_name as user_full_name,
  u.email as user_email,
  p.position_name
from election_candidates c
left join users u on u.id = c.user_id
left join election_positions p on p.id = c.position_id
where c.election_id = '00000000-0000-0000-0000-000000000000'
  and c.application_status = 'approved'
order by c.submission_date desc;

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
  rejection_reason = 'Reason here',
  updated_at = now()
where id = '00000000-0000-0000-0000-000000000000'
returning *;

-- Publish selected candidates for voting
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
-- 4) PAYMENTS (OFFICER VIEW)
-- ----------------------------------------------------------------------------

-- Payments list by election
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

-- Payments by candidate
select *
from election_payments
where candidate_id = '00000000-0000-0000-0000-000000000000'
order by created_at desc;

-- Create payment record
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
-- 5) VOTER LIST MANAGEMENT
-- ----------------------------------------------------------------------------

-- Add eligible student voters (bulk)
insert into election_student_voters (election_id, student_record_id)
values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003')
returning *;

-- List election voters with student details
select
  ev.*,
  sr.student_id,
  sr.full_name,
  sr.email
from election_student_voters ev
left join student_records sr on sr.id = ev.student_record_id
where ev.election_id = '00000000-0000-0000-0000-000000000000'
order by ev.created_at desc;


-- ----------------------------------------------------------------------------
-- 6) ELECTION MONITORING, RESULTS, AND REPORTS
-- ----------------------------------------------------------------------------

-- Raw votes with candidate + position names
select
  v.*,
  ec.id as candidate_ref,
  u.full_name as candidate_name,
  p.position_name
from election_votes v
left join election_candidates ec on ec.id = v.candidate_id
left join users u on u.id = ec.user_id
left join election_positions p on p.id = ec.position_id
where v.election_id = '00000000-0000-0000-0000-000000000000';

-- Candidate vote totals for election
select
  c.id as candidate_id,
  u.full_name as candidate_name,
  p.position_name,
  count(v.id) as vote_count
from election_candidates c
left join users u on u.id = c.user_id
left join election_positions p on p.id = c.position_id
left join election_votes v
  on v.candidate_id = c.id
 and v.election_id = c.election_id
where c.election_id = '00000000-0000-0000-0000-000000000000'
  and c.application_status = 'approved'
group by c.id, u.full_name, p.position_name
order by p.position_name, vote_count desc;

-- Position-wise tally
select
  v.position_id,
  p.position_name,
  v.candidate_id,
  u.full_name as candidate_name,
  count(*) as votes
from election_votes v
join election_candidates c on c.id = v.candidate_id
join users u on u.id = c.user_id
join election_positions p on p.id = v.position_id
where v.election_id = '00000000-0000-0000-0000-000000000000'
group by v.position_id, p.position_name, v.candidate_id, u.full_name
order by p.position_name, votes desc;

-- High-level stats
-- total voters
select count(*) as total_voters
from election_student_voters
where election_id = '00000000-0000-0000-0000-000000000000';

-- total votes cast
select count(*) as total_votes_cast
from election_votes
where election_id = '00000000-0000-0000-0000-000000000000';

-- candidates by status
select application_status, count(*) as total
from election_candidates
where election_id = '00000000-0000-0000-0000-000000000000'
group by application_status;

-- payments by status
select payment_status, count(*) as total
from election_payments
where election_id = '00000000-0000-0000-0000-000000000000'
group by payment_status;


-- ----------------------------------------------------------------------------
-- 7) POLICY FIX REQUIRED FOR OFFICER PAYMENT VIEW
-- ----------------------------------------------------------------------------
-- Existing policy in migrations references election_payments.user_id,
-- but election_payments has no user_id column.

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
