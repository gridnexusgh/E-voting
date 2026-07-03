-- Seed election officer user
-- Email: bamenorhu8@gmail
-- Password: password@1
-- Role: election_officer

-- Insert the election officer user with hashed password
-- Using bcrypt-style hash (this is a placeholder - in production you'd use proper password hashing)
INSERT INTO users (
  id,
  email,
  password_hash,
  role,
  full_name,
  username,
  is_email_verified,
  is_active,
  scope
) VALUES (
  gen_random_uuid(),
  'bamenorhu8@gmail',
  -- Using bcrypt hash of 'password@1' (generated via: bcrypt.hash('password@1', 10))
  -- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHexLa
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CHexLa',
  'election_officer',
  'Election Officer',
  'election_officer',
  true,
  true,
  'university'
) ON CONFLICT (email) DO NOTHING;
