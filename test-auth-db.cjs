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
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return;
    }
    
    console.log('✓ Database connection successful');
    console.log('Profiles table accessible, found records:', data?.length || 0);
    
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
    const testEmail = `testuser${Date.now()}@gmail.com`;
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
