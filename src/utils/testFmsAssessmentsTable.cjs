const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFmsAssessmentsTable() {
  console.log('Checking if FMS assessments table exists...');
  
  try {
    // Attempt to query the fms_assessments table
    const { data, error } = await supabase
      .from('fms_assessments')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') { // Relation does not exist
        console.error('❌ FMS assessments table does not exist:', error.message);
        return false;
      } else {
        console.error('Error checking FMS assessments table:', error);
        return false;
      }
    }
    
    console.log('✅ FMS assessments table exists and is accessible');
    return true;
  } catch (error) {
    console.error('Exception checking FMS assessments table:', error);
    return false;
  }
}

async function getTableSchemaInfo() {
  console.log('Retrieving schema information for FMS assessments table...');
  
  try {
    // This query gets column information from PostgreSQL's information_schema
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'fms_assessments' });
    
    if (error) {
      console.error('Error retrieving schema information:', error);
      return;
    }
    
    console.log('FMS assessments table columns:');
    console.table(data);
  } catch (error) {
    console.error('Exception retrieving schema information:', error);
  }
}

async function main() {
  const tableExists = await checkFmsAssessmentsTable();
  
  if (tableExists) {
    await getTableSchemaInfo();
  } else {
    console.log(`
To create the FMS assessments table, please run the migration:
1. Make sure your local migrations match the remote ones
2. Apply the new migration using Supabase CLI:
   $ supabase migration up
    `);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
