const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iipcpjczjjkwwifwzmut.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGNwamN6amprd3dpZnd6bXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDY2MTcsImV4cCI6MjA2NTQyMjYxN30.Q0l_XF8093ulhoasXmHfkVORDZBLpjoIAWC0_snQujY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserDeletion() {
  console.log('🧪 Testing User Deletion System...\n');

  try {
    // 1. List current profiles
    console.log('1. Fetching current profiles...');
    const { data: profiles, error: selectError } = await supabase
      .from('profiles')
      .select('id, email, role, created_at')
      .order('created_at');
      
    if (selectError) {
      console.error('❌ Could not fetch profiles:', selectError);
      return;
    }
    
    console.log(`📋 Found ${profiles.length} profiles:`);
    profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.email} (${profile.role}) - ID: ${profile.id}`);
    });

    // 2. Find a non-admin test profile
    const testProfile = profiles.find(p => p.email !== 'katsa007@gmail.com' && p.role !== 'admin');
    
    if (!testProfile) {
      console.log('\n⚠️ No test profile found for deletion testing.');
      console.log('All profiles are either admin or the main account.');
      return;
    }

    console.log(`\n🎯 Test target: ${testProfile.email} (ID: ${testProfile.id})`);

    // 3. Test deletion from profiles table
    console.log('\n2. Testing profiles table deletion...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', testProfile.id);
      
    if (deleteError) {
      console.error('❌ Profiles deletion failed:', deleteError);
      console.error('Full error details:', JSON.stringify(deleteError, null, 2));
    } else {
      console.log('✅ Profiles deletion succeeded');
      
      // 4. Restore the profile for safety
      console.log('\n3. Restoring profile for safety...');
      const { error: restoreError } = await supabase
        .from('profiles')
        .insert({
          id: testProfile.id,
          email: testProfile.email,
          role: testProfile.role,
          full_name: testProfile.full_name
        });
        
      if (restoreError) {
        console.error('⚠️ Could not restore profile:', restoreError);
      } else {
        console.log('✅ Profile restored successfully');
      }
    }

    // 5. Test auth user deletion (if we can)
    console.log('\n4. Testing auth user deletion capabilities...');
    try {
      // This will likely fail due to permissions, but let's see the error
      const { error: authError } = await supabase.auth.admin.deleteUser(testProfile.id);
      
      if (authError) {
        console.log('ℹ️ Auth deletion error (expected):', authError.message);
      } else {
        console.log('✅ Auth deletion would work');
      }
    } catch (authErr) {
      console.log('ℹ️ Auth deletion error (expected):', authErr.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testUserDeletion();
