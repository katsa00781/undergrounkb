// Check if the profiles table exists and has records
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables or use default values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);



async function checkProfilesTable() {
  console.log('Checking profiles table...');
  
  try {
    // Try to query the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('❌ Error accessing profiles table:', error.message);
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
        console.log(`   Name: ${profile.first_name || ''} ${profile.last_name || ''}`);
        console.log(`   Role: ${profile.role || 'No role'}`);
        console.log('---');
      });
      
      return true;
    } else {
      console.log('⚠️ No profiles found in the table');
      console.log('You need to add users to the system before using the FMS assessment feature.');
      return false;
    }
  } catch (e) {
    console.error('❌ Exception while checking profiles table:', e);
    return false;
  }
}

checkProfilesTable()
  .catch(console.error)
  .finally(() => {
    console.log('Check completed.');
    process.exit(0);
  });
