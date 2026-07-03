-- Supabase setup script for the auditor dashboard
-- Run this in the SQL editor in Supabase

-- Enable UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Audit log table for dashboard activity
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  actor TEXT,
  severity TEXT DEFAULT 'info',
  title TEXT,
  message TEXT
);

-- Security event table for alerts and compliance monitoring
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  severity TEXT DEFAULT 'warning'
);

-- Optional seed data for local testing
INSERT INTO audit_logs (action, details, actor, severity, title, message)
VALUES
  ('Election opened', 'Voting period started and ballot generation confirmed.', 'System', 'success', 'Election opened', 'Voting period started and ballot generation confirmed.'),
  ('Turnout spike detected', 'A sudden increase in ballot submissions was recorded.', 'Audit Service', 'warning', 'Turnout spike detected', 'A sudden increase in ballot submissions was recorded.'),
  ('Results published', 'Results for a faculty election were released.', 'Election Officer', 'info', 'Results published', 'Results for a faculty election were released.')
ON CONFLICT DO NOTHING;

INSERT INTO security_events (title, message, severity)
VALUES
  ('Multiple authentication attempts', 'Several failed login attempts were blocked from a single IP range.', 'warning'),
  ('Unusual ballot timing pattern', 'A small cluster of ballots was submitted near the closing window.', 'critical')
ON CONFLICT DO NOTHING;

-- Optional: enable RLS if you want to restrict access
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Optional policies for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'audit_logs_select_authenticated'
  ) THEN
    CREATE POLICY audit_logs_select_authenticated ON audit_logs
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'security_events' AND policyname = 'security_events_select_authenticated'
  ) THEN
    CREATE POLICY security_events_select_authenticated ON security_events
      FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
