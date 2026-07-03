-- ============================================================================
-- ELECTION OFFICER MODULE - DATABASE SETUP
-- ============================================================================
-- This migration creates all tables needed for the Election Officer module
-- Copy and paste this entire content into Supabase SQL Editor and click "Run"
-- ============================================================================

-- Elections table
CREATE TABLE elections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  officer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  academic_year TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('university', 'faculty', 'department')),
  scope_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'paused', 'closed', 'results_published')),
  nomination_start TIMESTAMPTZ,
  nomination_end TIMESTAMPTZ,
  voting_start TIMESTAMPTZ NOT NULL,
  voting_end TIMESTAMPTZ NOT NULL,
  slot_application_fee DECIMAL(10, 2) DEFAULT 0,
  enable_payment BOOLEAN DEFAULT FALSE,
  total_voters INTEGER DEFAULT 0,
  total_votes_cast INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Election positions
CREATE TABLE election_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  position_name TEXT NOT NULL,
  description TEXT,
  number_of_winners INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(election_id, position_name)
);

-- Election candidates
CREATE TABLE election_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES election_positions(id) ON DELETE CASCADE,
  student_record_id UUID REFERENCES student_records(id),
  application_status TEXT NOT NULL DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  manifesto TEXT,
  profile_image_url TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'exempted')),
  is_visible_for_voting BOOLEAN DEFAULT FALSE,
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  approval_date TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(election_id, position_id, user_id)
);

-- Election payments
CREATE TABLE election_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES election_candidates(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'successful', 'failed')),
  payment_method TEXT,
  transaction_id TEXT UNIQUE,
  reference_number TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Election student voters
CREATE TABLE election_student_voters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  student_record_id UUID NOT NULL REFERENCES student_records(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  has_voted BOOLEAN DEFAULT FALSE,
  voted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(election_id, student_record_id)
);

-- Election votes
CREATE TABLE election_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  candidate_id UUID NOT NULL REFERENCES election_candidates(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES election_positions(id) ON DELETE CASCADE,
  vote_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_student_voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE election_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Elections RLS Policies
-- ============================================================================
CREATE POLICY "elections_select_officer" ON elections FOR SELECT TO authenticated USING (
  officer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'auditor'))
);

CREATE POLICY "elections_insert_officer" ON elections FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'election_officer')
);

CREATE POLICY "elections_update_officer" ON elections FOR UPDATE TO authenticated USING (
  officer_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- ============================================================================
-- Election Positions RLS Policies
-- ============================================================================
CREATE POLICY "positions_select" ON election_positions FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM elections WHERE elections.id = election_positions.election_id AND (
      elections.officer_id = auth.uid() OR
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'auditor'))
    )
  )
);

CREATE POLICY "positions_insert_officer" ON election_positions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM elections WHERE elections.id = election_positions.election_id AND
    elections.officer_id = auth.uid()
  )
);

CREATE POLICY "positions_update_officer" ON election_positions FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM elections WHERE elections.id = election_positions.election_id AND
    elections.officer_id = auth.uid()
  )
);

CREATE POLICY "positions_delete_officer" ON election_positions FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM elections WHERE elections.id = election_positions.election_id AND
    elections.officer_id = auth.uid()
  )
);

-- ============================================================================
-- Election Candidates RLS Policies
-- ============================================================================
CREATE POLICY "candidates_select_public_approved" ON election_candidates FOR SELECT TO authenticated USING (
  application_status = 'approved' AND is_visible_for_voting = TRUE
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM elections WHERE elections.id = election_candidates.election_id AND
    elections.officer_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'auditor'))
);

CREATE POLICY "candidates_insert_student" ON election_candidates FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'student')
);

CREATE POLICY "candidates_update_officer" ON election_candidates FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM elections WHERE elections.id = election_candidates.election_id AND
    elections.officer_id = auth.uid()
  )
);

-- ============================================================================
-- Payment RLS Policies
-- ============================================================================
CREATE POLICY "payments_select_officer" ON election_payments FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM elections WHERE elections.id = election_payments.election_id AND
    elections.officer_id = auth.uid()
  )
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'auditor'))
);

CREATE POLICY "payments_insert" ON election_payments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "payments_update" ON election_payments FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM elections WHERE elections.id = election_payments.election_id AND
    elections.officer_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- ============================================================================
-- Voter RLS Policies
-- ============================================================================
CREATE POLICY "voters_select_officer" ON election_student_voters FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM elections WHERE elections.id = election_student_voters.election_id AND
    elections.officer_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'auditor'))
);

CREATE POLICY "voters_insert_officer" ON election_student_voters FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM elections WHERE elections.id = election_student_voters.election_id AND
    elections.officer_id = auth.uid()
  )
);

-- ============================================================================
-- Votes RLS Policies
-- ============================================================================
CREATE POLICY "votes_insert_student" ON election_votes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'student'
  )
  AND EXISTS (
    SELECT 1 FROM election_student_voters WHERE
    election_student_voters.election_id = election_votes.election_id AND
    election_student_voters.user_id = auth.uid()
  )
);

CREATE POLICY "votes_select_officer" ON election_votes FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM elections WHERE elections.id = election_votes.election_id AND (
      elections.officer_id = auth.uid() OR
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'auditor'))
    )
  )
);

-- ============================================================================
-- Performance Indexes
-- ============================================================================
CREATE INDEX idx_elections_officer ON elections(officer_id);
CREATE INDEX idx_elections_status ON elections(status);
CREATE INDEX idx_positions_election ON election_positions(election_id);
CREATE INDEX idx_candidates_election ON election_candidates(election_id);
CREATE INDEX idx_candidates_user ON election_candidates(user_id);
CREATE INDEX idx_candidates_status ON election_candidates(application_status);
CREATE INDEX idx_payments_election ON election_payments(election_id);
CREATE INDEX idx_payments_status ON election_payments(payment_status);
CREATE INDEX idx_voters_election ON election_student_voters(election_id);
CREATE INDEX idx_votes_election ON election_votes(election_id);
CREATE INDEX idx_votes_candidate ON election_votes(candidate_id);

-- ============================================================================
-- Auto-update Triggers (if function exists)
-- ============================================================================
-- Only create if update_updated_at_column() function exists from migrations
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'update_updated_at_column'
  ) THEN
    CREATE TRIGGER update_elections_updated_at BEFORE UPDATE ON elections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON election_positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON election_candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON election_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- DONE! Election Officer Module is now integrated.
-- ============================================================================
