const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnumValues() {
  console.log('\n--- Testing current enum values ---');
  
  try {
    // Try to query the profiles table to see current roles
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .limit(5);
    
    if (error) {
      console.error('Error querying profiles:', error);
      return;
    }
    
    console.log('Current roles in profiles table:', data.map(p => p.role));
    
    // Try to test if 'disabled' role is available by creating a test profile
    console.log('\n--- Testing if disabled role is available ---');
    const testResult = await supabase
      .from('profiles')
      .insert({
        email: 'test-disabled@example.com',
        full_name: 'Test Disabled User',
        role: 'disabled'
      })
      .select()
      .single();
    
    if (testResult.error) {
      console.log('Disabled role test result:', testResult.error.message);
      if (testResult.error.message.includes('invalid input value for enum')) {
        console.log('❌ Disabled role is NOT available in the enum');
      }
    } else {
      console.log('✅ Disabled role is available!');
      console.log('Test user created:', testResult.data);
      
      // Clean up test user
      await supabase
        .from('profiles')
        .delete()
        .eq('email', 'test-disabled@example.com');
      console.log('Test user cleaned up');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testEnumValues();
