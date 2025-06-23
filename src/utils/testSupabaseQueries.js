// Register ts-node to allow importing TypeScript files without compilation step
try {
  require('ts-node').register({ transpileOnly: true });
} catch (err) {
  console.warn('ts-node not available. Make sure TypeScript files are compiled.');
}

const { supabase } = require('../config/supabase');

/**
 * Tests the Supabase connection and runs basic queries.
 * @returns {Promise<boolean>} Test result true/false.
 */
async function testSupabaseQueries() {
  try {
    // Simple query on 'profiles' table
    const { error: profilesError } = await supabase.from('profiles').select('*').limit(1);
    if (profilesError) {
      console.error('Error in profiles query:', profilesError);
      return false;
    }

    // Note: The application no longer uses the 'users' table, all user data is in the 'profiles' table
    // No need to check users table in this test, as we already checked profiles above

    // Simple query on 'exercises' table
    const { error: exercisesError } = await supabase.from('exercises').select('*').limit(1);
    if (exercisesError) {
      console.error('Error in exercises query:', exercisesError);
      return false;
    }

    console.log('Supabase queries ran successfully.');
    return true;
  } catch (error) {
    console.error('Error testing Supabase queries:', error);
    return false;
  }
}

// If run directly, execute the test
if (require.main === module) {
  testSupabaseQueries().then(success => {
    console.log(success ? 'Supabase connection and queries are OK.' : 'Supabase connection or query error.');
    // Exit with appropriate code for CI environments
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testSupabaseQueries };
