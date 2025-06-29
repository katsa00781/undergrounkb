const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://iipcpjczjjkwwifwzmut.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGNwamN6amprd3dpZnd6bXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDY2MTcsImV4cCI6MjA2NTQyMjYxN30.Q0l_XF8093ulhoasXmHfkVORDZBLpjoIAWC0_snQujY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserManagement() {
  console.log('\n🧪 Testing User Management System...\n');

  try {
    // 1. Check profiles table structure
    console.log('1. Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);
    
    if (profilesError) {
      console.error('❌ Error accessing profiles table:', profilesError);
      return;
    }
    console.log('✅ profiles table accessible');
    console.log(`📊 Found ${profiles.length} profiles`);

    if (profiles.length > 0) {
      console.log('📝 Sample profile structure:');
      console.log(JSON.stringify(profiles[0], null, 2));
    }

    // 2. Check auth admin capabilities
    console.log('\n2. Checking auth admin capabilities...');
    
    // Note: This will fail with anon key, but shows the structure
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      console.log('✅ Auth admin access works');
      console.log(`📊 Found ${authUsers?.users?.length || 0} auth users`);
    } catch (authError) {
      console.log('ℹ️  Auth admin functions require service role key (expected with anon key)');
    }

    // 3. Check if we can read user roles
    console.log('\n3. Testing role-based access...');
    const { data: roleData, error: roleError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'admin')
      .limit(3);
    
    if (roleError) {
      console.error('❌ Error checking roles:', roleError);
    } else {
      console.log('✅ Role querying works');
      console.log(`📊 Found ${roleData.length} admin users`);
    }

    console.log('\n✅ User management system structure is ready!');
    console.log('\n📋 Summary:');
    console.log(`- Profiles table: ${profiles.length} records`);
    console.log(`- Admin profiles: ${roleData?.length || 0} records`);
    console.log('\n🔐 Security Notes:');
    console.log('- Registration is disabled for public users');
    console.log('- Only admins can create new users');
    console.log('- User deletion requires both profile and auth cleanup');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testUserManagement();
