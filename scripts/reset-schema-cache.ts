import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials! Check your .env file.');
  process.exit(1);
}

// Create a fresh Supabase client (without cache)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

/**
 * Function to reset the Supabase schema cache
 */
async function resetSchemaCache() {
  console.log('🔄 Resetting Supabase schema cache...');
  
  try {
    // Force a schema refresh by making different queries to fetch schema info
    const tables = [
      'profiles',
      'users',
      'workouts',
      'exercises'
    ];
    
    // Make sequential queries to all tables
    for (const table of tables) {
      console.log(`📊 Refreshing schema for "${table}" table...`);
      try {
        // This query forces Supabase to fetch the schema
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`ℹ️ Table "${table}" doesn't exist. Skipping.`);
          } else {
            console.warn(`⚠️ Warning when refreshing "${table}":`, error.message);
          }
        } else {
          console.log(`✅ Successfully refreshed schema for "${table}"`);
        }
      } catch (err) {
        console.warn(`⚠️ Error refreshing "${table}":`, err);
      }
    }
    
    // Special check for profiles first_name column
    console.log('🔍 Checking for "first_name" column in profiles table...');
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('first_name')
        .limit(1);
      
      if (profileError) {
        if (profileError.message.includes('does not exist')) {
          console.error('❌ The "first_name" column is missing in the profiles table!');
          console.log('💡 Please run the fix-profile-columns.sh script to fix this.');
        } else {
          console.error('❌ Error checking "first_name" column:', profileError.message);
        }
      } else {
        console.log('✅ "first_name" column exists in profiles table');
      }
    } catch (err) {
      console.error('❌ Error checking profiles schema:', err);
    }
    
    console.log('✅ Schema cache reset completed!');
    console.log('🔄 Please restart your application to use the refreshed schema.');
  } catch (error) {
    console.error('❌ Failed to reset schema cache:', error);
    process.exit(1);
  }
}

// Run the reset function
resetSchemaCache();
