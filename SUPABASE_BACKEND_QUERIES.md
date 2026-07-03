# Supabase Backend Queries

This file contains the full query set needed by the current backend/frontend integration in this project.

## 1) Auth and User Profile

### Sign up

```ts
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/verify-email`,
  },
});
```

### Sign in

```ts
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

### Current session and auth user

```ts
const { data: sessionData } = await supabase.auth.getSession();
const { data: userData } = await supabase.auth.getUser();
```

### Sign out

```ts
const { error } = await supabase.auth.signOut();
```

### Fetch app profile from users table

```ts
const { data, error } = await supabase
  .from("users")
  .select("*")
  .eq("id", authUserId)
  .single();
```

### Update last login

```ts
const { error } = await supabase
  .from("users")
  .update({ last_login: new Date().toISOString() })
  .eq("id", authUserId);
```

## 2) Registration Flow

### Load faculties

```ts
const { data, error } = await supabase
  .from("faculties")
  .select("*")
  .order("name");
```

### Load departments by faculty

```ts
const { data, error } = await supabase
  .from("departments")
  .select("*")
  .eq("faculty_id", facultyId)
  .order("name");
```

### Verify active student record

```ts
const { data, error } = await supabase
  .from("student_records")
  .select("*")
  .eq("student_id", studentId)
  .eq("faculty_id", facultyId)
  .eq("department_id", departmentId)
  .eq("status", "active")
  .single();
```

### Check if student already has a user account

```ts
const { data, error } = await supabase
  .from("users")
  .select("id")
  .eq("student_record_id", studentRecordId)
  .single();
```

### Create user profile after auth signup

```ts
const { error } = await supabase.from("users").insert({
  id: authUserId,
  email,
  password_hash: "",
  role: "student",
  full_name,
  student_record_id: studentRecordId,
  faculty_id: facultyId,
  department_id: departmentId,
  is_email_verified: true,
  is_face_enrolled: false,
});
```

## 3) Admin Management

### Faculties CRUD

```ts
// List
await supabase.from("faculties").select("*").order("name");

// Create
await supabase.from("faculties").insert({ name, code, description });

// Update
await supabase
  .from("faculties")
  .update({ name, code, description })
  .eq("id", facultyId);

// Delete
await supabase.from("faculties").delete().eq("id", facultyId);
```

### Departments CRUD

```ts
// List
await supabase.from("departments").select("*, faculties(name)").order("name");

// Create
await supabase
  .from("departments")
  .insert({ name, code, description, faculty_id });

// Update
await supabase
  .from("departments")
  .update({ name, code, description, faculty_id })
  .eq("id", departmentId);

// Delete
await supabase.from("departments").delete().eq("id", departmentId);
```

### Users (Election Officers and Auditors)

```ts
// List
await supabase
  .from("users")
  .select("*, faculties(name), departments(name)")
  .in("role", ["election_officer", "auditor"])
  .order("created_at", { ascending: false });

// Create auth user first
const { data: signUpData } = await supabase.auth.signUp({ email, password });

// Then create profile
await supabase.from("users").insert({
  id: signUpData.user?.id,
  email,
  password_hash: "",
  role,
  full_name,
  username,
  scope,
  faculty_id,
  department_id,
  is_email_verified: true,
  is_face_enrolled: false,
});

// Update
await supabase.from("users").update(updateData).eq("id", userId);

// Delete
await supabase.from("users").delete().eq("id", userId);
```

### Student import and records

```ts
// Lookups
await supabase.from("faculties").select("id, name, code");
await supabase.from("departments").select("id, name, code, faculty_id");

// Upsert records
await supabase.from("student_records").upsert(
  {
    student_id,
    full_name,
    email,
    faculty_id,
    department_id,
    status,
  },
  { onConflict: "student_id" },
);

// List
await supabase
  .from("student_records")
  .select(
    "id, student_id, full_name, email, faculty_id, department_id, status, faculties(name), departments(name)",
  )
  .order("created_at", { ascending: false });
```

## 4) Election Backend

### Elections

```ts
// List by officer
await supabase
  .from("elections")
  .select("*")
  .eq("officer_id", officerId)
  .order("created_at", { ascending: false });

// Get one
await supabase.from("elections").select("*").eq("id", electionId).single();

// Create
await supabase.from("elections").insert([payload]).select().single();

// Update
await supabase
  .from("elections")
  .update(updates)
  .eq("id", electionId)
  .select()
  .single();

// Student elections
await supabase
  .from("elections")
  .select("*")
  .in("status", ["active", "published"])
  .order("voting_start", { ascending: true });
```

### Election positions

```ts
// List
await supabase
  .from("election_positions")
  .select("*")
  .eq("election_id", electionId)
  .order("display_order", { ascending: true });

// Create
await supabase.from("election_positions").insert([payload]).select().single();

// Update
await supabase
  .from("election_positions")
  .update(updates)
  .eq("id", positionId)
  .select()
  .single();

// Delete
await supabase.from("election_positions").delete().eq("id", positionId);
```

### Candidates

```ts
// List by election
await supabase
  .from("election_candidates")
  .select(
    `
    *,
    user:users(id, full_name, email),
    position:election_positions(id, position_name),
    student:student_records(id, student_id, full_name)
  `,
  )
  .eq("election_id", electionId)
  .order("submission_date", { ascending: false });

// Pending
await supabase
  .from("election_candidates")
  .select(
    `
    *,
    user:users(id, full_name, email),
    position:election_positions(id, position_name),
    student:student_records(id, student_id, full_name)
  `,
  )
  .eq("election_id", electionId)
  .eq("application_status", "pending")
  .order("submission_date", { ascending: true });

// Approve
await supabase
  .from("election_candidates")
  .update({
    application_status: "approved",
    approval_date: new Date().toISOString(),
    approved_by: officerId,
  })
  .eq("id", candidateId)
  .select()
  .single();

// Reject
await supabase
  .from("election_candidates")
  .update({ application_status: "rejected", rejection_reason: reason })
  .eq("id", candidateId)
  .select()
  .single();

// Publish candidates for voting
await supabase
  .from("election_candidates")
  .update({ is_visible_for_voting: true })
  .in("id", candidateIds)
  .select();
```

### Payments

```ts
// List payments for election
await supabase
  .from("election_payments")
  .select(
    `
    *,
    candidate:election_candidates(
      id,
      user:users(full_name, email),
      position:election_positions(position_name)
    )
  `,
  )
  .eq("election_id", electionId)
  .order("created_at", { ascending: false });

// Candidate payment list
await supabase
  .from("election_payments")
  .select("*")
  .eq("candidate_id", candidateId)
  .order("created_at", { ascending: false });

// Create payment
await supabase
  .from("election_payments")
  .insert([paymentPayload])
  .select()
  .single();

// Update payment status
await supabase
  .from("election_payments")
  .update({
    payment_status: status,
    transaction_id: transactionId,
    paid_at: status === "successful" ? new Date().toISOString() : null,
  })
  .eq("id", paymentId)
  .select()
  .single();
```

### Eligible student voters

```ts
// Add voters
await supabase
  .from("election_student_voters")
  .insert(
    studentIds.map((student_record_id) => ({
      election_id: electionId,
      student_record_id,
    })),
  )
  .select();

// List voters
await supabase
  .from("election_student_voters")
  .select(
    `
    *,
    student:student_records(id, student_id, full_name, email)
  `,
  )
  .eq("election_id", electionId)
  .order("created_at", { ascending: false });
```

### Voting and results

```ts
// Cast vote
await supabase
  .from("election_votes")
  .insert([
    {
      election_id: electionId,
      candidate_id: candidateId,
      position_id: positionId,
      voter_id: authUserId,
    },
  ])
  .select()
  .single();

// Mark voter as voted
await supabase
  .from("election_student_voters")
  .update({ has_voted: true, voted_at: new Date().toISOString() })
  .eq("election_id", electionId)
  .eq("user_id", authUserId);

// Raw result rows
await supabase
  .from("election_votes")
  .select(
    `
    *,
    candidate:election_candidates(
      id,
      user:users(full_name),
      position:election_positions(position_name)
    )
  `,
  )
  .eq("election_id", electionId);

// Candidate vote total
await supabase
  .from("election_votes")
  .select("id", { count: "exact", head: true })
  .eq("candidate_id", candidateId)
  .eq("election_id", electionId);
```

### Dashboard election slices

```ts
// Active/published
await supabase
  .from("elections")
  .select("*")
  .eq("officer_id", officerId)
  .in("status", ["active", "published"])
  .order("voting_end", { ascending: true });

// Draft/upcoming
await supabase
  .from("elections")
  .select("*")
  .eq("officer_id", officerId)
  .eq("status", "draft")
  .order("voting_start", { ascending: true });

// Completed
await supabase
  .from("elections")
  .select("*")
  .eq("officer_id", officerId)
  .in("status", ["closed", "results_published"])
  .order("voting_end", { ascending: false });
```

## 5) Face Enrollment (Edge Function + Client)

### Read enrollment status

```ts
await supabase
  .from("users")
  .select("is_face_enrolled")
  .eq("id", authUserId)
  .single();
```

### Invoke edge function

```ts
await supabase.functions.invoke("face-enrollment", {
  body: { userId: authUserId, imageBase64 },
});
```

### Mark enrolled

```ts
await supabase
  .from("users")
  .update({ is_face_enrolled: true })
  .eq("id", authUserId);
```

## 6) SQL Policy Fix (Important)

The existing payment select policy references user_id on election_payments, but the table has no user_id column.
Use this policy replacement:

```sql
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
```

## 7) Notes

- Keep users.id equal to Supabase Auth user id for all accounts.
- Your app currently uses table queries only (no custom RPC calls).
- Slot fields were added to election_positions: application_opening, application_closing, application_fee, max_applicants, is_enabled, status.
