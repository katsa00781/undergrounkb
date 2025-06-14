// Script to add a test user to the profiles table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestUser() {
  console.log('Adding a test user to the profiles table...');
  
  try {
    // First check if we already have the test user
    const { data: existingUsers, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'test@example.com');
      
    if (searchError) {
      console.error('Error checking for existing test user:', searchError);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Test user already exists with ID:', existingUsers[0].id);
      return existingUsers[0].id;
    }
    
    // Create a test user
    const testUserId = crypto.randomUUID();
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
      
    if (error) {
      console.error('❌ Error creating test user:', error);
      return null;
    }
    
    console.log('✅ Test user created successfully with ID:', testUserId);
    return testUserId;
  } catch (e) {
    console.error('❌ Exception while creating test user:', e);
    return null;
  }
}

addTestUser()
  .then(userId => {
    if (userId) {
      console.log('You can now select this test user in the FMS assessment page:');
      console.log('User ID:', userId);
      console.log('Email: test@example.com');
      console.log('Name: Test User');
    } else {
      console.log('Failed to create or find test user');
    }
  })
  .catch(console.error)
  .finally(() => {
    process.exit(0);
  });
