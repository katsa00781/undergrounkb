import { supabase } from '../src/config/supabase';

/**
 * This script checks if the required profile columns exist in the database.
 * Run this script when you're experiencing schema-related errors.
 */
async function checkDatabaseSchema() {
  console.log('Checking database schema for profiles table...');
  
  try {
    // Check if profiles table exists by trying to select from it
    console.log('Checking if profiles table exists...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profileError) {
      console.error('Error accessing profiles table:', profileError);
      console.log('The profiles table might not exist. Check your migrations.');
      return;
    }
    
    console.log('✓ Profiles table exists');

    // Get information about columns in the profiles table
    console.log('Checking columns in profiles table...');
    const { data, error } = await supabase
      .rpc('check_column_exists', {
        p_table_name: 'profiles',
        p_column_name: 'first_name'
      });

    if (error) {
      console.error('Error checking column:', error);
      console.log('The check_column_exists function might not exist. Run the migration to create it.');
      
      // Try an alternative approach
      console.log('Trying alternative approach to check columns...');
      const { data: altData, error: altError } = await supabase
        .from('profiles')
        .select('first_name')
        .limit(1);
      
      if (altError) {
        if (altError.message.includes('does not exist')) {
          console.log('❌ The first_name column does not exist in the profiles table.');
          console.log('Consider running your migrations again or manually adding the column.');
        } else {
          console.error('Error checking first_name column:', altError);
        }
      } else {
        console.log('✓ The first_name column exists in the profiles table.');
      }
      
      return;
    }

    if (data) {
      console.log('✓ The first_name column exists in the profiles table.');
    } else {
      console.log('❌ The first_name column does not exist in the profiles table.');
      console.log('Consider running your migrations again or manually adding the column.');
    }
    
    // Try to directly get schema information from Postgres
    console.log('\nFetching table information from information_schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');
    
    if (schemaError) {
      console.error('Error accessing information_schema:', schemaError);
    } else if (schemaData) {
      console.log('Columns in profiles table:');
      schemaData.forEach((col: any) => {
        console.log(`- ${col.column_name}`);
      });
    }
    
  } catch (err) {
    console.error('Unexpected error during schema check:', err);
  } finally {
    console.log('\nSchema check completed.');
  }
}

// Run the check
checkDatabaseSchema().catch(console.error);
