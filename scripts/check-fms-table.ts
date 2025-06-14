// Run this file to check if fms_assessments table exists in your database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFmsTable() {
  console.log('Checking fms_assessments table...');
  
  try {
    // Try to query the fms_assessments table
    const { data, error } = await supabase
      .from('fms_assessments')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing fms_assessments table:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('\nThe fms_assessments table does not exist. Please run the migration:');
        console.log('1. Navigate to your project root');
        console.log('2. Run: supabase migration up');
      }
      return;
    }
    
    console.log('✅ fms_assessments table exists and is accessible');
    console.log(`Found ${data.length} records`);
  } catch (e) {
    console.error('❌ Exception while checking fms_assessments table:', e);
  }
}

checkFmsTable()
  .catch(console.error)
  .finally(() => {
    console.log('Check completed.');
    process.exit(0);
  });
