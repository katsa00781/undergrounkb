const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableSchema() {
  console.log('Checking profiles table schema...');
  
  try {
    // Get schema information from information_schema
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' });
    
    if (error) {
      console.error('Error checking schema:', error);
      
      // Fallback: try to get a sample record to see the columns
      const { data: sampleData, error: sampleError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Sample data error:', sampleError);
      } else {
        console.log('Sample profile data (to see columns):');
        if (sampleData && sampleData.length > 0) {
          console.log('Columns:', Object.keys(sampleData[0]));
          console.log('Sample data:', sampleData[0]);
        } else {
          console.log('No data in profiles table');
        }
      }
    } else {
      console.log('Schema information:', data);
    }
    
  } catch (err) {
    console.error('Schema check failed:', err);
  }
}

checkTableSchema();
