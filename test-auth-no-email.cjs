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

async function testAuthWithoutEmail() {
  console.log('Testing auth system (without sending emails)...');
  
  try {
    const { data: session } = await supabase.auth.getSession();
    console.log('Current session:', session);
    
    console.log('Note: Skipping actual signup test to avoid email bounce issues');
    console.log('The auth system should work when using valid email addresses');
    
  } catch (err) {
    console.error('Auth test failed:', err);
  }
}

async function runTests() {
  await testDatabaseConnection();
  console.log('\n---\n');
  await testAuthWithoutEmail();
}

runTests();
