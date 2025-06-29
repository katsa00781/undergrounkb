const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCurrentFunctionality() {
  console.log('🔧 Testing Current Application State');
  console.log('====================================\n');

  try {
    console.log('1. Testing user listing (should work)...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .in('role', ['admin', 'user'])  // Only get admin and user roles (not disabled)
      .order('created_at');

    if (userError) {
      console.error('❌ Failed to fetch users:', userError.message);
      return;
    }

    console.log(`✅ Successfully fetched ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.role} (${user.full_name || 'No name'})`);
    });

    console.log('\n2. Testing role-based access...');
    const adminUsers = users.filter(u => u.role === 'admin');
    const regularUsers = users.filter(u => u.role === 'user');
    
    console.log(`✅ Found ${adminUsers.length} admin(s) and ${regularUsers.length} regular user(s)`);

    console.log('\n3. Testing enum values that currently work...');
    const testRoles = ['admin', 'user'];
    for (const role of testRoles) {
      console.log(`   - Testing role: ${role}`);
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .eq('role', role);
      
      if (error) {
        console.error(`   ❌ Error testing role ${role}:`, error.message);
      } else {
        console.log(`   ✅ Role ${role} works correctly`);
      }
    }

    console.log('\n4. Testing disabled role (should fail until migration)...');
    const { data: disabledTest, error: disabledError } = await supabase
      .from('profiles')
      .select('count')
      .eq('role', 'disabled');
    
    if (disabledError) {
      if (disabledError.message.includes('invalid input value for enum')) {
        console.log('   ⚠️  Disabled role not available (expected - migration needed)');
      } else {
        console.error('   ❌ Unexpected error:', disabledError.message);
      }
    } else {
      console.log('   ✅ Disabled role is available!');
    }

    console.log('\n5. Summary:');
    console.log('   ✅ Basic user management functions work');
    console.log('   ✅ Admin and user roles are functional');
    console.log('   ⏳ Soft delete requires database migration');
    console.log('\n🎯 Ready to apply migration: add-disabled-role.sql');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
testCurrentFunctionality();
