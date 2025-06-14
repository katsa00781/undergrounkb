// Simple script to check profiles table directly from the database
// This is a CommonJS script to avoid ES module issues
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ANSI color codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// Helper function to load env variables from .env file
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value;
        }
      });
    }
  } catch (error) {
    console.error(`${RED}Error loading .env file:${RESET}`, error);
  }
}

// Load env variables
loadEnv();

// Get Supabase URL and key
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(`${RED}Error: Supabase URL or key not found${RESET}`);
  console.log('Please make sure your .env file has the following variables:');
  console.log('VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesTable() {
  try {
    console.log('Checking profiles table...');
    
    // Try to query the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
      
    if (error) {
      console.error(`${RED}Error accessing profiles table:${RESET}`, error.message);
      return false;
    }
    
    console.log(`${GREEN}✓ Profiles table exists and is accessible${RESET}`);
    
    // Check if we have records
    if (data && data.length > 0) {
      console.log(`Found ${data.length} profiles:`);
      data.forEach((profile, index) => {
        console.log(`${index + 1}. ID: ${profile.id}`);
        console.log(`   Email: ${profile.email || 'No email'}`);
        console.log(`   Name: ${profile.first_name || ''} ${profile.last_name || ''}`);
      });
    } else {
      console.log(`${YELLOW}⚠ No profiles found in the table${RESET}`);
      console.log('You need to add users to the system.');
    }
    
    return true;
  } catch (err) {
    console.error(`${RED}Exception in checkProfilesTable:${RESET}`, err);
    return false;
  }
}

async function checkUsersTable() {
  try {
    console.log('\nAttempting to check if users table exists...');
    
    // Check if users table exists
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`${YELLOW}Note: 'users' table does not exist in the public schema${RESET}`);
        console.log('This is expected if your application uses "profiles" table for user data');
      } else {
        console.error(`${RED}Error checking users table:${RESET}`, error.message);
      }
      return false;
    }
    
    console.log(`${GREEN}✓ Users table exists with ${data.length} records${RESET}`);
    return true;
  } catch (err) {
    console.error(`${RED}Exception in checkUsersTable:${RESET}`, err);
    return false;
  }
}

// Run tests
checkProfilesTable()
  .then(() => checkUsersTable())
  .catch(err => console.error(`${RED}Error:${RESET}`, err))
  .finally(() => {
    console.log('\nCheck completed.');
    process.exit(0);
  });
