const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingUsers() {
  console.log('🔍 Checking Existing Users');
  console.log('==========================\n');

  try {
    // 1. Get current users from profiles table
    console.log('1. Fetching all users from profiles table...');
    const { data: allUsers, error: allError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at');

    if (allError) {
      console.error('❌ Failed to fetch users:', allError.message);
      return;
    }

    console.log(`✅ Found ${allUsers.length} users in profiles table:`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.role} (${user.full_name || 'No name'})`);
    });

    // 2. Test getUsers function (active users only)
    console.log('\n2. Testing active users filter...');
    const { data: activeUsers, error: activeError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .neq('role', 'disabled')
      .order('created_at');

    if (activeError) {
      console.error('❌ Failed to fetch active users:', activeError.message);
      return;
    }

    console.log(`✅ Found ${activeUsers.length} active users (excluding disabled):`);
    activeUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.role} (${user.full_name || 'No name'})`);
    });

    // 3. Check if any users are disabled
    const disabledCount = allUsers.length - activeUsers.length;
    if (disabledCount > 0) {
      console.log(`\n📊 ${disabledCount} disabled users found`);
    } else {
      console.log('\n📊 No disabled users found');
    }

    // 4. Test updating one existing user to disabled (if we have any)
    if (allUsers.length > 1) {
      const testUser = allUsers.find(u => u.role === 'user');
      if (testUser) {
        console.log(`\n3. Testing soft delete on existing user: ${testUser.email}`);
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'disabled' })
          .eq('id', testUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Failed to soft delete existing user:', updateError.message);
          if (updateError.message.includes('invalid input value for enum')) {
            console.log('⚠️  The "disabled" role is not available in the user_role enum.');
            console.log('   You need to apply the add-disabled-role.sql migration first.');
          }
        } else {
          console.log('✅ Successfully soft deleted existing user');
          console.log('Updated user:', updateData);

          // Restore the user
          console.log('\n4. Restoring the user...');
          const { data: restoreData, error: restoreError } = await supabase
            .from('profiles')
            .update({ role: 'user' })
            .eq('id', testUser.id)
            .select()
            .single();

          if (restoreError) {
            console.error('❌ Failed to restore user:', restoreError.message);
          } else {
            console.log('✅ Successfully restored user');
            console.log('Restored user:', restoreData);
          }
        }
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the check
checkExistingUsers();
