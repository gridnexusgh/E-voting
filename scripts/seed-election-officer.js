/**
 * Script to seed an election officer user in Supabase
 * Usage: SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/seed-election-officer.js
 */

const SUPABASE_URL = 'https://mlmqdhpovpaioueokpac.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('\n   Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/seed-election-officer.js');
  process.exit(1);
}

async function seedElectionOfficer() {
  try {
    console.log('🌱 Seeding election officer user...\n');

    // Step 1: Create auth user via Supabase Admin API
    console.log('📝 Creating auth user...');
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        email: 'bamenorhu8@gmail',
        password: 'password@1',
        email_confirm: true,
        user_metadata: {
          role: 'election_officer',
          full_name: 'Election Officer',
        },
      }),
    });

    if (!authResponse.ok) {
      const error = await authResponse.json();
      console.error('❌ Failed to create auth user:', error.message || error);
      process.exit(1);
    }

    const authData = await authResponse.json();
    const userId = authData.user.id;
    console.log('✅ Auth user created:', userId);

    // Step 2: Create database user record
    console.log('📝 Creating database user record...');
    const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        id: userId,
        email: 'bamenorhu8@gmail',
        password_hash: '', // Will be managed by auth
        role: 'election_officer',
        full_name: 'Election Officer',
        username: 'election_officer',
        is_email_verified: true,
        is_active: true,
        scope: 'university',
      }),
    });

    if (!dbResponse.ok) {
      const error = await dbResponse.json();
      console.error('❌ Failed to create database user:', error.message || error);
      process.exit(1);
    }

    const dbData = await dbResponse.json();
    console.log('✅ Database user created:', dbData[0]?.id);

    console.log('\n✨ Election officer user seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    bamenorhu8@gmail');
    console.log('🔐 Password: password@1');
    console.log('📋 Role:     election_officer');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🚀 You can now login to the application!');
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

seedElectionOfficer();
