-- Add slot-specific fields to election positions

ALTER TABLE election_positions
  ADD COLUMN application_opening TIMESTAMPTZ,
  ADD COLUMN application_closing TIMESTAMPTZ,
  ADD COLUMN application_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN max_applicants INTEGER,
  ADD COLUMN is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed'));
