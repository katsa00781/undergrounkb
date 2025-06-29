const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSoftDeleteFunctionality() {
  console.log('🧪 Testing Soft Delete Functionality');
  console.log('=====================================\n');

  // Test user data
  const testUser = {
    email: 'test-soft-delete@example.com',
    full_name: 'Test Soft Delete User',
    role: 'user'
  };

  let testUserId = null;

  try {
    // 1. Create a test user
    console.log('1. Creating test user...');
    const { data: createData, error: createError } = await supabase
      .from('profiles')
      .insert(testUser)
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create test user:', createError.message);
      return;
    }

    testUserId = createData.id;
    console.log('✅ Test user created:', createData.email);

    // 2. Verify user is in active users list
    console.log('\n2. Checking user appears in active users...');
    const { data: activeUsers, error: activeError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .neq('role', 'disabled')
      .eq('email', testUser.email);

    if (activeError) {
      console.error('❌ Failed to fetch active users:', activeError.message);
      return;
    }

    if (activeUsers.length === 1) {
      console.log('✅ User appears in active users list');
    } else {
      console.log('❌ User not found in active users list');
    }

    // 3. Soft delete the user (set role to 'disabled')
    console.log('\n3. Performing soft delete (set role to disabled)...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('profiles')
      .update({ role: 'disabled' })
      .eq('id', testUserId)
      .select()
      .single();

    if (deleteError) {
      console.error('❌ Failed to soft delete user:', deleteError.message);
      // Check if it's because 'disabled' is not in enum
      if (deleteError.message.includes('invalid input value for enum')) {
        console.log('⚠️  The "disabled" role is not available in the user_role enum.');
        console.log('   You need to apply the add-disabled-role.sql migration first.');
        console.log('   Run: ./apply-disabled-role-migration.sh');
      }
      return;
    }

    console.log('✅ User soft deleted successfully:', deleteData.role);

    // 4. Verify user is NOT in active users list
    console.log('\n4. Checking user is excluded from active users...');
    const { data: activeUsersAfter, error: activeAfterError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .neq('role', 'disabled')
      .eq('email', testUser.email);

    if (activeAfterError) {
      console.error('❌ Failed to fetch active users after delete:', activeAfterError.message);
      return;
    }

    if (activeUsersAfter.length === 0) {
      console.log('✅ User correctly excluded from active users list');
    } else {
      console.log('❌ User still appears in active users list');
    }

    // 5. Verify user IS in all users list (including disabled)
    console.log('\n5. Checking user appears in all users list...');
    const { data: allUsers, error: allError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('email', testUser.email);

    if (allError) {
      console.error('❌ Failed to fetch all users:', allError.message);
      return;
    }

    if (allUsers.length === 1 && allUsers[0].role === 'disabled') {
      console.log('✅ User appears in all users list with disabled role');
    } else {
      console.log('❌ User not found in all users list or role incorrect');
    }

    // 6. Test restore functionality
    console.log('\n6. Testing restore functionality...');
    const { data: restoreData, error: restoreError } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', testUserId)
      .eq('role', 'disabled')  // Only restore if currently disabled
      .select()
      .single();

    if (restoreError) {
      console.error('❌ Failed to restore user:', restoreError.message);
      return;
    }

    console.log('✅ User restored successfully:', restoreData.role);

    // 7. Verify user is back in active users list
    console.log('\n7. Checking user is back in active users...');
    const { data: activeUsersRestored, error: activeRestoredError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .neq('role', 'disabled')
      .eq('email', testUser.email);

    if (activeRestoredError) {
      console.error('❌ Failed to fetch active users after restore:', activeRestoredError.message);
      return;
    }

    if (activeUsersRestored.length === 1) {
      console.log('✅ User correctly appears in active users list after restore');
    } else {
      console.log('❌ User not found in active users list after restore');
    }

    console.log('\n🎉 All soft delete tests passed!');

  } catch (error) {
    console.error('💥 Unexpected error during testing:', error);
  } finally {
    // Cleanup: Remove test user
    if (testUserId) {
      console.log('\n🧹 Cleaning up test user...');
      const { error: cleanupError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', testUserId);

      if (cleanupError) {
        console.error('⚠️  Failed to cleanup test user:', cleanupError.message);
        console.log('Please manually delete user with email:', testUser.email);
      } else {
        console.log('✅ Test user cleaned up successfully');
      }
    }
  }
}

// Run the test
testSoftDeleteFunctionality();
