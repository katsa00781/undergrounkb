// Simple database fix check
import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iipcpjczjjkwwifwzmut.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Simple database query to check if we can access profiles table
async function checkProfilesTable() {
  console.log('Testing database connection...');
  
  try {
    const { data: columnInfo, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = 'profiles' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (error) {
      console.error('Error querying database:', error.message);
      return;
    }
    
    console.log('Profile table columns:');
    console.log(columnInfo);
    
    console.log('Database test successful!');
  } catch (err) {
    console.error('Database test failed:', err);
  }
}

// Run the check
checkProfilesTable();
