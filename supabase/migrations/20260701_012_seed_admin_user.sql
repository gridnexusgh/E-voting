-- Seed admin user
-- Email: admin@htu.edu.gh
-- Password: Admin123!
-- Role: admin

-- Ensure pgcrypto is enabled so we can hash the password server-side
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- NOTE: This inserts a profile row into the `users` table and stores a bcrypt hash using pgcrypto.
-- You still must create the corresponding auth user in Supabase Auth (see notes below).

INSERT INTO users (
  id,
  email,
  password_hash,
  role,
  full_name,
  username,
  is_email_verified,
  is_active,
  scope,
  created_at
) VALUES (
  gen_random_uuid(),
  'admin@htu.edu.gh',
  crypt('Admin123!', gen_salt('bf', 12)),
  'admin',
  'UEVS Administrator',
  'admin',
  true,
  true,
  'university',
  now()
)
ON CONFLICT (email) DO UPDATE
  SET role = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      is_email_verified = true,
      is_active = true,
      updated_at = now();

-- Helpful note for deployers:
-- 1) Create the actual auth user in Supabase (Auth > Users > Invite / Create user) with the same email and password.
--    Alternatively, use the Supabase Admin REST API to create a user programmatically.
-- 2) After creating the auth user, verify the user (if needed) and ensure the `users` table has the same auth UID
--    in `users.id` if your system links by auth id. If linking by email, the steps above are sufficient for local testing.
-- 3) For production, rotate the seeded password and remove plaintext references from repo.
