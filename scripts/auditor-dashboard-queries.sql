-- Auditor dashboard SQL queries
-- These queries match the data currently used by src/services/auditor.ts

-- 1) Elections overview for the auditor dashboard
SELECT
  id,
  title,
  status,
  category,
  voting_start,
  voting_end,
  total_voters,
  total_votes_cast,
  updated_at
FROM elections
ORDER BY voting_start DESC;

-- 2) Registered students count
SELECT COUNT(*) AS registered_students
FROM student_records;

-- 3) Candidate review list with election, position, and student/user details
SELECT
  ec.id,
  e.title AS election_title,
  COALESCE(sr.full_name, u.full_name, 'Candidate pending review') AS candidate_name,
  ep.position_name AS position,
  ec.application_status AS status,
  COALESCE(ec.manifesto, 'Manifesto not submitted yet.') AS manifesto_preview,
  ec.submission_date AS submitted_at
FROM election_candidates ec
LEFT JOIN elections e ON e.id = ec.election_id
LEFT JOIN election_positions ep ON ep.id = ec.position_id
LEFT JOIN users u ON u.id = ec.user_id
LEFT JOIN student_records sr ON sr.id = ec.student_record_id
ORDER BY ec.submission_date DESC;

-- 4) Result summaries (winner per election based on approved candidates and vote count)
WITH candidate_vote_totals AS (
  SELECT
    ec.election_id,
    ec.id AS candidate_id,
    ec.application_status,
    COALESCE(COUNT(ev.id), 0) AS vote_count
  FROM election_candidates ec
  LEFT JOIN election_votes ev ON ev.candidate_id = ec.id
  GROUP BY ec.election_id, ec.id, ec.application_status
),
ranked_candidates AS (
  SELECT
    election_id,
    candidate_id,
    vote_count,
    ROW_NUMBER() OVER (
      PARTITION BY election_id
      ORDER BY vote_count DESC, candidate_id
    ) AS rn
  FROM candidate_vote_totals
  WHERE application_status = 'approved'
)
SELECT
  e.id,
  e.title AS election_title,
  COALESCE(sr.full_name, u.full_name, 'Pending review') AS winner,
  rc.vote_count,
  CASE
    WHEN e.status = 'results_published' THEN 'published'
    ELSE 'pending publish'
  END AS status,
  COALESCE(e.voting_end, e.voting_start, NOW()) AS published_at
FROM elections e
LEFT JOIN ranked_candidates rc ON rc.election_id = e.id AND rc.rn = 1
LEFT JOIN election_candidates ec ON ec.id = rc.candidate_id
LEFT JOIN users u ON u.id = ec.user_id
LEFT JOIN student_records sr ON sr.id = ec.student_record_id
WHERE e.status IN ('closed', 'results_published')
ORDER BY e.voting_end DESC;

-- 5) Audit activity feed
SELECT
  id,
  action,
  details,
  created_at,
  actor,
  severity,
  title,
  message
FROM audit_logs
ORDER BY created_at DESC
LIMIT 8;

-- 6) Security alerts feed
SELECT
  id,
  title,
  message,
  created_at,
  severity
FROM security_events
ORDER BY created_at DESC
LIMIT 8;

-- 7) Activity log for the auditor page
SELECT
  e.title AS target,
  'System' AS actor,
  CONCAT('Election status updated to ', e.status) AS action,
  COALESCE(e.voting_end, e.voting_start, NOW()) AS timestamp,
  CASE WHEN e.status = 'active' THEN 'success' ELSE 'info' END AS severity
FROM elections e
ORDER BY COALESCE(e.voting_end, e.voting_start, NOW()) DESC
LIMIT 3;

-- 8) Pending candidate notifications
SELECT
  ec.id,
  'Candidate review pending' AS title,
  CONCAT(COALESCE(sr.full_name, u.full_name, 'Candidate'), ' requires auditor attention.') AS message,
  ec.submission_date AS created_at,
  FALSE AS read_flag
FROM election_candidates ec
LEFT JOIN users u ON u.id = ec.user_id
LEFT JOIN student_records sr ON sr.id = ec.student_record_id
WHERE ec.application_status = 'pending'
ORDER BY ec.submission_date DESC;

-- Optional: if the audit_logs and security_events tables do not exist yet,
-- create them first so the auditor dashboard can use them end-to-end.

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  actor TEXT,
  severity TEXT DEFAULT 'info',
  title TEXT,
  message TEXT
);

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  severity TEXT DEFAULT 'warning'
);
