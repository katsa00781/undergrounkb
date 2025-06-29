const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iipcpjczjjkwwifwzmut.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGNwamN6amprd3dpZnd6bXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDY2MTcsImV4cCI6MjA2NTQyMjYxN30.Q0l_XF8093ulhoasXmHfkVORDZBLpjoIAWC0_snQujY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSoftDelete() {
  console.log('🧪 Testing Soft Delete (Disable User)...\n');
  
  try {
    // 1. Get current active users
    const { data: users, error: getUsersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .neq('role', 'disabled')
      .neq('email', 'katsa007@gmail.com');  // Exclude admin
      
    if (getUsersError) {
      console.error('❌ Error getting users:', getUsersError);
      return;
    }
    
    console.log(`📋 Found ${users.length} active users:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.role})`);
    });
    
    if (users.length === 0) {
      console.log('⚠️ No test users available for soft delete test');
      return;
    }
    
    const testUser = users[0];
    console.log(`\n🎯 Testing soft delete on: ${testUser.email}`);
    
    // 2. Test soft delete (disable user)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'disabled',
        updated_at: new Date().toISOString(),
        full_name: '[DISABLED] ' + (testUser.full_name || testUser.email)
      })
      .eq('id', testUser.id);
      
    if (updateError) {
      console.error('❌ Soft delete failed:', updateError);
      return;
    }
    
    console.log('✅ Soft delete succeeded');
    
    // 3. Verify user is now disabled
    const { data: disabledUser } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', testUser.id)
      .single();
      
    console.log(`✅ User is now: role="${disabledUser.role}", name="${disabledUser.full_name}"`);
    
    // 4. Restore user for safety
    console.log('\n🔄 Restoring user for safety...');
    const { error: restoreError } = await supabase
      .from('profiles')
      .update({
        role: testUser.role,
        full_name: testUser.full_name
      })
      .eq('id', testUser.id);
      
    if (restoreError) {
      console.error('❌ Could not restore user:', restoreError);
    } else {
      console.log('✅ User restored successfully');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSoftDelete();
