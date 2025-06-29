const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iipcpjczjjkwwifwzmut.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGNwamN6amprd3dpZnd6bXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDY2MTcsImV4cCI6MjA2NTQyMjYxN30.Q0l_XF8093ulhoasXmHfkVORDZBLpjoIAWC0_snQujY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickDeleteTest() {
  console.log('Quick delete test...');
  
  // Try to delete a non-existent ID to see the error
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', '00000000-0000-0000-0000-000000000000');
    
  if (error) {
    console.log('Delete error:', error.code, error.message);
  } else {
    console.log('Delete worked (no rows affected)');
  }
}

quickDeleteTest();
