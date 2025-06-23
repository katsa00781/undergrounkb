// Simple script to check if the profiles table exists and what records it contains
// This file is intentionally saved as .js to avoid TypeScript compilation issues
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Initialize dotenv
dotenv.config();

// Get Supabase URL and key from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesTable() {
  console.log('Checking profiles table...');
  
  try {
    // Try to query the profiles table
    console.log('Attempting to query profiles table...');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
      
    if (error) {
      console.error('❌ Error accessing profiles table:', error);
      return false;
    }
    
    console.log('✅ Profiles table exists and is accessible');
    
    // Check if we have any records
    if (data && data.length > 0) {
      console.log(`Found ${data.length} profiles:`);
      
      // Print some basic info about the profiles
      data.forEach((profile, index) => {
        console.log(`${index + 1}. ID: ${profile.id}`);
        console.log(`   Email: ${profile.email || 'No email'}`);
        console.log(`   First name: ${profile.first_name || 'None'}`);
        console.log(`   Last name: ${profile.last_name || 'None'}`);
        console.log(`   Role: ${profile.role || 'No role'}`);
        console.log('---');
      });
      
      return true;
    } else {
      console.log('⚠️ No profiles found in the table');
      return false;
    }
  } catch (e) {
    console.error('❌ Exception while checking profiles table:', e);
    return false;
  }
}

async function checkUsersTable() {
  console.log('\nChecking if "users" table exists (for comparison)...');
  
  try {
    // Note: The application now uses 'profiles' table instead of 'users'
    console.log('Checking if users table exists (for compatibility check)...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (error) {
      // Check if the error indicates the table doesn't exist
      if (error.message && error.message.includes('relation "users" does not exist')) {
        console.log('ℹ️ The "users" table does not exist in the database (this is expected, we use profiles now)');
        console.log('   This is expected if your app uses "profiles" for user data');
        return false;
      } else {
        console.error('❌ Error accessing users table:', error);
        return false;
      }
    }
    
    console.log('✅ Users table exists and is accessible');
    console.log(`Found ${data?.length || 0} records`);
    return true;
  } catch (e) {
    console.error('❌ Exception while checking users table:', e);
    return false;
  }
}

// Run both checks
async function runChecks() {
  const profilesExist = await checkProfilesTable();
  const usersExist = await checkUsersTable();
  
  console.log('\nSummary:');
  console.log(`- Profiles table: ${profilesExist ? 'EXISTS' : 'MISSING OR EMPTY'}`);
  console.log(`- Users table: ${usersExist ? 'EXISTS' : 'DOES NOT EXIST'}`);
  
  console.log('\nRecommendations:');
  if (!profilesExist) {
    console.log('1. Ensure you have created and migrated the profiles table');
    console.log('2. Add at least one user to the profiles table');
  } else {
    console.log('✅ Your profiles table appears to be set up correctly');
  }
}

runChecks()
  .catch(console.error)
  .finally(() => {
    console.log('\nCheck completed.');
    process.exit(0);
  });
