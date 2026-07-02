import fetch from 'node-fetch';

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];
const role = process.argv[4] || 'auditor';
const fullName = process.argv[5] || 'Auditor User';

if (!email || !password) {
  console.error('Usage: node scripts/create-user-via-admin-api.js <email> <password> [role] [fullName]');
  process.exit(1);
}

async function main() {
  const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, full_name: fullName },
    }),
  });

  const authData = await authRes.json();
  if (!authRes.ok) {
    console.error('Auth create failed:', authData);
    process.exit(1);
  }

  const userId = authData.user.id;

  const dbRes = await fetch(`${supabaseUrl}/rest/v1/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      id: userId,
      email,
      password_hash: '',
      role,
      full_name: fullName,
      username: email.split('@')[0],
      is_email_verified: true,
      is_active: true,
      scope: 'university',
    }),
  });

  const dbData = await dbRes.json();
  if (!dbRes.ok) {
    console.error('User profile insert failed:', dbData);
    process.exit(1);
  }

  console.log('Created user:', dbData[0] || dbData);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
