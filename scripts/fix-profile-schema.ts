import { supabase } from '../src/config/supabase';

/**
 * Script to manually apply the profile fields migration if it wasn't
 * properly applied through the normal migration process.
 * 
 * This script will:
 * 1. Check if the first_name column exists
 * 2. If not, add it and other missing columns
 * 3. Clear the cache for the client
 */
async function fixProfileSchema() {
  console.log('Starting profile schema fix...');
  
  try {
    // First, check if the column exists to avoid duplicate attempts
    console.log('Checking if first_name column already exists...');
    
    const { data: checkData, error: checkError } = await supabase
      .from('profiles')
      .select('first_name')
      .limit(1)
      .maybeSingle();
    
    if (!checkError) {
      console.log('✓ first_name column already exists in the profiles table.');
      return;
    }

    // The column doesn't exist, so let's add it
    if (checkError.message.includes('does not exist')) {
      console.log('ℹ first_name column does not exist. Adding missing profile columns...');
      
      // Execute raw SQL to add the missing columns - using the same SQL as in the migration
      const { error } = await supabase.rpc('execute_sql', {
        sql_string: `
          -- Add basic name fields if they don't exist
          ALTER TABLE IF EXISTS public.profiles
          ADD COLUMN IF NOT EXISTS first_name text,
          ADD COLUMN IF NOT EXISTS last_name text;
          
          -- Add other fields needed for profile form if they don't exist
          ALTER TABLE IF EXISTS public.profiles
          ADD COLUMN IF NOT EXISTS height numeric,
          ADD COLUMN IF NOT EXISTS weight numeric,
          ADD COLUMN IF NOT EXISTS birthdate date,
          ADD COLUMN IF NOT EXISTS gender text,
          ADD COLUMN IF NOT EXISTS fitness_goals text[],
          ADD COLUMN IF NOT EXISTS experience_level text;
        `
      });
      
      if (error) {
        if (error.message.includes('function "execute_sql" does not exist')) {
          console.log('ℹ execute_sql function not found. Creating it first...');
          
          // Create the execute_sql function
          const { error: createFunctionError } = await supabase.rpc('create_execute_sql_function', {});
          
          if (createFunctionError) {
            console.error('❌ Failed to create execute_sql function:', createFunctionError);
            
            // Fallback: Try direct connection to database if available
            console.log('ℹ Attempting direct SQL modification...');
            console.log('❌ Direct modification not available in this environment.');
            console.log('\nPlease manually run the SQL migration or contact your database administrator.');
          }
        } else {
          console.error('❌ Error adding columns:', error);
        }
      } else {
        console.log('✓ Successfully added missing profile columns');
        
        // Verify that the columns were added
        const { error: verifyError } = await supabase
          .from('profiles')
          .select('first_name')
          .limit(1);
        
        if (verifyError) {
          console.error('❌ Verification failed, columns may not have been added properly:', verifyError);
        } else {
          console.log('✓ Verification successful, first_name column exists now');
        }
      }
    } else {
      console.error('❌ Unexpected error when checking for first_name column:', checkError);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error during schema fix:', err);
  } finally {
    console.log('\nSchema fix script completed.');
  }
}

// Function to create the execute_sql utility function in the database
async function createExecuteSqlFunction() {
  const { error } = await supabase.rpc('create_execute_sql_function', {});
  return !error;
}

// Run the fix
fixProfileSchema().catch(console.error);
