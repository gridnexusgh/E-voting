# UEVS Setup Guide: Election Officer & Email Configuration

## Part 1: Run Missing Database Migrations

### Step 1: Access Your Supabase Project
1. Go to https://supabase.com/dashboard
2. Open your voting_system project
3. Navigate to **SQL Editor**

### Step 2: Execute All Migration Files in Order

Copy and paste each migration file's contents into the SQL Editor and execute them in this order:

#### Migration 1: Initial Schema (if not already run)
- File: `supabase/migrations/20260623211837_001_initial_schema.sql`
- Contains: Users, faculties, departments, student_records tables

#### Migration 2-6: RLS Fixes and Public Access
- Run: `20260625073127_002_fix_users_rls.sql` → `20260626072852_006_allow_public_student_records.sql`
- These fix Row Level Security policies

#### **Migration 7: ELECTION MANAGEMENT (CRITICAL)**
File: `supabase/migrations/20260627_007_election_management.sql`

This creates the core election tables:
- `elections` - Main election records
- `election_positions` - Voting positions/slots
- `election_candidates` - Candidate applications
- `election_payments` - Payment tracking
- `election_student_voters` - Eligible voters
- `election_votes` - Vote records

```sql
-- Execute this file in SQL Editor
-- Copy entire contents from: supabase/migrations/20260627_007_election_management.sql
```

#### Migration 8: Seed Election Officer
File: `supabase/migrations/20260627_008_seed_election_officer.sql`

Creates default election officer user:
- **Email**: election_officer@example.com
- **Password**: Password123!
- **Role**: election_officer

#### Migrations 9-12: Additional Features
- Run remaining migrations in order:
  - `20260628_009_add_slot_fields.sql`
  - `20260629_verification_codes.sql`
  - `20260701_009_student_election_visibility.sql`
  - `20260701_011_add_auditor_audit_tables.sql`
  - `20260701_012_seed_admin_user.sql`
  - `20260702_seed_faculties_departments.sql`

---

## Part 2: Configure Supabase Email Settings

### Step 1: Access Auth Settings
1. In Supabase Dashboard, go to **Authentication** → **Providers** → **Email**
2. Look for **SMTP Configuration** section

### Step 2: Choose Your Email Provider

#### **Option A: Resend (Recommended for Development)**
1. Go to https://resend.com
2. Sign up and create an API key
3. In Supabase Email settings:
   - Select **SMTP Provider**: Resend
   - **SMTP Host**: `smtp.resend.co`
   - **SMTP Port**: `465` (SSL)
   - **SMTP User**: `resend` or your API key
   - **SMTP Password**: Your Resend API key
   - **From Email**: `onboarding@resend.dev` (for testing)

#### **Option B: SendGrid**
1. Go to https://sendgrid.com
2. Create account and get API key
3. In Supabase Email settings:
   - Select **SMTP Provider**: SendGrid
   - **SMTP Host**: `smtp.sendgrid.net`
   - **SMTP Port**: `465` or `587`
   - **SMTP User**: `apikey`
   - **SMTP Password**: Your SendGrid API key
   - **From Email**: Your verified domain email

#### **Option C: Mailgun**
1. Go to https://mailgun.com
2. Create account and get SMTP credentials
3. In Supabase Email settings:
   - Select **SMTP Provider**: Mailgun
   - **SMTP Host**: `smtp.mailgun.org`
   - **SMTP Port**: `465` or `587`
   - **SMTP User**: `postmaster@yourdomain.mailgun.org`
   - **SMTP Password**: Your Mailgun password
   - **From Email**: Your verified domain email

#### **Option D: Gmail (for testing only)**
⚠️ **Warning**: Not recommended for production

1. Enable 2FA on your Gmail account
2. Create an App Password: https://myaccount.google.com/apppasswords
3. In Supabase Email settings:
   - **SMTP Host**: `smtp.gmail.com`
   - **SMTP Port**: `465`
   - **SMTP User**: your_email@gmail.com
   - **SMTP Password**: Your App Password (not your regular password)
   - **From Email**: your_email@gmail.com

### Step 3: Test Email Configuration

In Supabase Dashboard:
1. Go to **Authentication** → **Email**
2. Scroll to **Email Settings**
3. Click **Test Email** button
4. Check the email address you provided

### Step 4: Configure Email Templates (Optional)

In Supabase, customize the confirmation email template:
1. Go to **Authentication** → **Email Templates**
2. Edit **Confirm signup** template
3. Add your branding and instructions

---

## Part 3: Test the Registration Flow

### Step 1: Run the Dev Server
```bash
cd c:\Users\noraa\voting_system
pnpm dev
```

### Step 2: Open Registration Page
Navigate to: `http://localhost:5173/register`

### Step 3: Register with Test Student
1. **Student ID**: Use one from your seeded student records (e.g., `032001`)
2. **Faculty**: Select a faculty
3. **Department**: Select a department
4. **Email**: Use a real email address you have access to
5. **Password**: Create a strong password (8+ chars, uppercase, lowercase, number, special char)

### Step 4: Check Email
- Look for confirmation email from your configured provider
- Click the confirmation link
- Return to app and click "I have confirmed"
- Should redirect to face enrollment page

---

## Part 4: Election Officer Dashboard

### Login to Election Officer Dashboard

After migrations are run:
1. Go to `http://localhost:5173/login`
2. Use seeded credentials:
   - **Email**: election_officer@example.com
   - **Password**: Password123!
3. You'll be redirected to `/election-officer/dashboard`

### Election Officer Features Available

1. **Dashboard** - View election summary
2. **Create Elections** - Create new elections (university/faculty/department level)
3. **Create Slots** - Add voting positions
4. **Pending Approvals** - Review candidate applications
5. **Approved Candidates** - View approved candidates
6. **Election Monitoring** - Track voting progress
7. **Results** - View election results
8. **Reports** - Generate reports
9. **Payments** - Track candidate payments

### Troubleshooting Election Creation Error

If you get "Failed to create the election":

**Check 1: User Role Verification**
```sql
-- Run in Supabase SQL Editor
SELECT id, email, role FROM users 
WHERE role = 'election_officer';
```

**Check 2: RLS Policy Check**
```sql
-- Verify election_officer can insert elections
SELECT 
  schemaname, 
  tablename, 
  policyname 
FROM pg_policies 
WHERE tablename = 'elections' AND policyname LIKE '%insert%';
```

**Check 3: Test Insert Directly**
```sql
-- In Supabase as authenticated election_officer user
INSERT INTO elections (
  officer_id,
  title,
  academic_year,
  category,
  voting_start,
  voting_end,
  status
) VALUES (
  'YOUR_OFFICER_USER_ID',
  'Test Election',
  '2025/2026',
  'university',
  NOW(),
  NOW() + INTERVAL '7 days',
  'draft'
);
```

---

## Part 5: Environment Variables

Ensure your `.env` has:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

And for Supabase Functions (if using edge functions):
```
RESEND_API_KEY=your_resend_key  # or your chosen provider
SENDGRID_API_KEY=your_sendgrid_key
```

---

## Summary Checklist

- [ ] All 14 migrations executed in order in Supabase
- [ ] SMTP email provider configured (Resend/SendGrid/Mailgun/Gmail)
- [ ] Email test successful in Supabase dashboard
- [ ] Dev server running: `pnpm dev`
- [ ] Registration page tested with real email
- [ ] Confirmation email received
- [ ] Election officer login works
- [ ] Election creation page loads without errors

---

## Next Steps

1. **Configure Supabase SMTP** - Follow Part 2 above
2. **Run all migrations** - Follow Part 1 above  
3. **Test registration flow** - Follow Part 3 above
4. **Access election officer dashboard** - Follow Part 4 above

If issues persist, check the browser console and Supabase logs for detailed error messages.
