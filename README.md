# HTU ELECTION / E-VOTING SYSTEM

A React + TypeScript + Vite frontend for a university election platform with Supabase authentication, biometric face enrollment and verification, role-based dashboards, election management, slot applications, and results publication.

## What this project contains

- `src/` — React application and pages
  - `App.tsx` — route definitions and protection logic
  - `contexts/AuthContext.tsx` — Supabase auth session handling, login, user profile loading
  - `pages/` — public landing pages, login/register, face enrollment, student/admin/officer dashboards
  - `services/supabase.ts` — Supabase client and edge function invocation helper
  - `services/election.ts` — election-related helper functions
  - `types/index.ts` — shared app type definitions
- `supabase/migrations/` — database schema and Row Level Security migrations
- `supabase/functions/` — Supabase edge functions for face enrollment and face verification
- `scripts/` — support scripts for seeding and user creation workflows

## Key application behavior

- Role-based routes for `student`, `election_officer`, `admin`, and `auditor`
- Student login requires email verification and face enrollment before voting
- Student dashboard includes:
  - vote entry with biometric verification gate
  - open slot listing for eligible election positions
  - election result views for university/faculty/department scope
- Election officer dashboard includes:
  - election creation and monitoring
  - slot management and candidate approval workflows
  - results and reports views
- Admin dashboard includes management for:
  - faculties, departments, student records, and user accounts

## Required environment variables

Create a `.env` file at the project root with:

```env
VITE_SUPABASE_URL=https://nlypntrvvvlcarcprkij.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5seXBudHJ2dnZsY2FyY3Bya2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTA0NDEsImV4cCI6MjA5ODQ4NjQ0MX0.tzVNPuLDTdRsEuotOCHvdaHMnZTku16lukuYUO6kvgY

SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5seXBudHJ2dnZsY2FyY3Bya2lqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjkxMDQ0MSwiZXhwIjoyMDk4NDg2NDQxfQ.j3JmvKtvNO1VDmtwxnixr-JxiUNIZb0RRbxggNXC9sg

```

If you deploy edge functions or use external email/SMS services, also configure those in your Supabase project environment.

## Local setup

1. Install dependencies:

```powershell
cd c:\Users\noraa\voting_system
pnpm install
```

2. Start the app locally:

```powershell
pnpm dev
```

3. Open the app in your browser:

- `http://localhost:5173`

## Supabase backend setup

### 1. Run database migrations

Use the Supabase dashboard SQL editor or Supabase CLI to execute the migrations in order. At minimum, ensure the following migration files are applied:

- `supabase/migrations/20260623211837_001_initial_schema.sql`
- `supabase/migrations/20260625073127_002_fix_users_rls.sql`
- `supabase/migrations/20260625073138_003_fix_users_rls_v2.sql`
- `supabase/migrations/20260625073151_004_fix_admin_rls.sql`
- `supabase/migrations/20260625101054_005_allow_public_faculties.sql`
- `supabase/migrations/20260626072852_006_allow_public_student_records.sql`
- `supabase/migrations/20260627_007_election_management.sql`
- `supabase/migrations/20260627_008_seed_election_officer.sql`
- `supabase/migrations/20260628_009_add_slot_fields.sql`
- `supabase/migrations/20260629_verification_codes.sql`
- `supabase/migrations/20260701_009_student_election_visibility.sql`
- `supabase/migrations/20260701_011_add_auditor_audit_tables.sql`
- `supabase/migrations/20260701_012_seed_admin_user.sql`
- `supabase/migrations/20260702_seed_faculties_departments.sql`

### 2. Deploy edge functions

The app depends on these functions:

- `supabase/functions/face-enrollment/index.ts`
- `supabase/functions/face-verify/index.ts`
- `supabase/functions/create-admin-user/index.ts`

There are two common deployment methods:

#### Option A: Deploy with the Supabase CLI

1. Install the Supabase CLI (if not installed):

```powershell
npm install -g supabase
```

2. Authenticate and link to your project:

```powershell
supabase login
supabase link --project-ref <your-project-ref>
```

3. Deploy the functions from the repository root:

```powershell
cd c:\Users\noraa\voting_system
supabase functions deploy face-enrollment
supabase functions deploy face-verify
supabase functions deploy create-admin-user
```

4. If your functions depend on environment variables, set them in the Supabase Dashboard under **Functions > Settings** or with the CLI:

```powershell
supabase functions env set SUPABASE_URL <your-supabase-url>
supabase functions env set SUPABASE_SERVICE_ROLE_KEY <your-service-role-key>
supabase functions env set FACE_MATCH_THRESHOLD 0.35
```

> Note: `face-enrollment` and `face-verify` require `SUPABASE_SERVICE_ROLE_KEY` because they read and update protected user data.

#### Option B: Deploy from the Supabase Dashboard

1. Open your Supabase project dashboard.
2. Go to **Functions**.
3. Create a new function for each file name above.
4. Paste the corresponding `index.ts` contents.
5. Set the runtime to Deno and configure the same environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FACE_MATCH_THRESHOLD` (optional)
   - `HF_API_KEY` (optional for Hugging Face embedding)
6. Deploy the function and verify its published endpoint.

#### Confirm deployment

After deployment, test that each function is reachable from the browser or a simple `curl` request:

```powershell
curl -X POST https://<your-project>.supabase.co/functions/v1/face-enrollment -H "Content-Type: application/json" -d "{\"userId\":\"test\",\"imageBase64\":\"abc\"}"
```

If the request returns a JSON response, the function is deployed correctly.

### 3. Configure email for auth

Enable SMTP in Supabase Auth settings and verify email delivery. The login flow blocks users until `is_email_verified` is true.

## Reproduce the current behavior

1. Start the frontend: `pnpm dev`
2. Open `http://localhost:5173`
3. Register a student account via `/register`
   - verify a student record from `student_records`
   - use a valid faculty and department
   - complete account creation
4. Confirm the email link sent by Supabase
5. Complete face enrollment at `/face-enrollment`
6. Log in as the student and open `/student/dashboard`
7. Use the sidebar to access:
   - `Vote` (biometric verification gate)
   - `Slots` (active, eligible election positions)
   - `Results` (category-based election tallies)
8. Log in as an election officer and verify officer dashboard at `/election-officer/dashboard`
9. Log in as admin and verify admin metrics at `/admin`

## Notes on student slot visibility

Student slot cards are only shown when all of these are true:

- `election_positions.is_enabled` is `true`
- parent election status is `published` or `active`
- election category is `university`, or
- election category is `faculty` and `scope_id === user.faculty_id`, or
- election category is `department` and `scope_id === user.department_id`

## Reproducible checks

- `LoginPage` redirects student accounts without face enrollment to `/face-enrollment`
- `AuthContext.login()` returns `requiresFaceEnrollment` for unenrolled students
- `StudentSlotsPage` filters slots by election status and user faculty/department
- `FaceVerificationGate` requires webcam capture before `VotingBallotPage` loads
- `supabase/functions/face-verify` uses cosine similarity to decide biometric match

## Helpful file references

- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `src/services/supabase.ts`
- `src/pages/LoginPage.tsx`
- `src/pages/RegisterPage.tsx`
- `src/pages/FaceEnrollmentPage.tsx`
- `src/pages/student/StudentDashboard.tsx`
- `src/pages/student/StudentSlotsPage.tsx`
- `supabase/migrations/20260627_007_election_management.sql`
- `supabase/functions/face-enrollment/index.ts`
- `supabase/functions/face-verify/index.ts`

## Author note

This repository is configured for a live Supabase-backed HTU election system using role-based dashboards and biometric voting gates. Follow the steps above to reproduce the full local development and deployment flow.
