create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_verification_codes_email_code_unique unique (email, code)
);

create index if not exists email_verification_codes_email_idx on public.email_verification_codes (email);
create index if not exists email_verification_codes_expires_at_idx on public.email_verification_codes (expires_at);
