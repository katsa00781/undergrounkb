const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count(*)')
      .single();
    
    if (error) {
      console.error('Database connection error:', error);
      return;
    }
    
    console.log('✓ Database connection successful');
    console.log('Profiles table exists:', data);
    
    // Test schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.error('Schema check error:', schemaError);
    } else {
      console.log('✓ Profiles table schema check passed');
    }
    
    // Test user roles enum
    const { data: roleData, error: roleError } = await supabase
      .rpc('get_enum_values', { enum_name: 'user_role' });
    
    if (roleError) {
      console.error('Role enum check error:', roleError);
    } else {
      console.log('✓ User roles enum exists:', roleData);
    }
    
  } catch (err) {
    console.error('Connection test failed:', err);
  }
}

async function testAuth() {
  console.log('Testing auth system...');
  
  try {
    const { data: session } = await supabase.auth.getSession();
    console.log('Current session:', session);
    
    // Test signup with a dummy user
    const testEmail = `test-${Date.now()}@test.com`;
    const testPassword = 'test123456';
    const testName = 'Test User';
    
    console.log(`Attempting to register user: ${testEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName,
        },
      },
    });
    
    if (signUpError) {
      console.error('Sign up error:', signUpError);
      return;
    }
    
    console.log('✓ User registration successful:', signUpData);
    
    // Check if profile was created
    if (signUpData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();
      
      if (profileError) {
        console.error('Profile check error:', profileError);
      } else {
        console.log('✓ Profile created successfully:', profileData);
      }
    }
    
  } catch (err) {
    console.error('Auth test failed:', err);
  }
}

async function runTests() {
  await testDatabaseConnection();
  console.log('\n---\n');
  await testAuth();
}

runTests();
