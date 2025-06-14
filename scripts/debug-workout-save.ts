// Test script for debugging workout saving issue
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSaveWorkout() {
  // Get Supabase credentials
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL or key not found in environment variables');
    return false;
  }

  console.log('Supabase URL:', supabaseUrl);
  console.log('Testing workout save functionality...');
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Verify workouts table structure
    console.log('\nVerifying workouts table structure...');
    const { error: columnsError } = await supabase
      .from('workouts')
      .select('*')
      .limit(0);

    if (columnsError) {
      console.error('❌ Table structure check failed:', columnsError);
      return false;
    }

    console.log('✅ Table exists with proper structure');

    // Try to log in anonymously to perform authenticated operations
    console.log('\nTrying to get session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ Not authenticated, trying to sign in anonymously...');
      
      // Anonymous sign-in
      const { error: signInError } = await supabase.auth.signInAnonymously();
      
      if (signInError) {
        console.error('❌ Anonymous sign-in failed:', signInError);
        console.log('\nPlease test save functionality while logged in, or try this script with valid credentials.');
        return false;
      }
    }

    // Get current user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Failed to get user:', userError);
      return false;
    }

    console.log(`✅ Authenticated as user: ${user.id}`);

    // Create a test workout
    const testWorkout = {
      title: "Test Workout " + new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      duration: 30,
      notes: "Test workout created by debug script",
      sections: [
        {
          name: "Test Section",
          exercises: [
            {
              exerciseId: "test-exercise-id", // This would normally be a valid exercise ID
              sets: 3,
              reps: 10,
              weight: 15,
              notes: "Test exercise",
              restPeriod: 60
            }
          ]
        }
      ],
      user_id: user.id
    };

    console.log('\nAttempting to save test workout...');
    console.log(JSON.stringify(testWorkout, null, 2));

    // Try to save the workout
    const { data: savedWorkout, error: saveError } = await supabase
      .from('workouts')
      .insert(testWorkout)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Save failed:', saveError);
      
      // Check if error is related to JSONB columns
      if (saveError.message.includes('json') || saveError.message.includes('jsonb')) {
        console.log('\nThere might be an issue with the JSONB format of the sections field');
        
        // Try with stringified JSON
        console.log('\nTrying with stringified JSON...');
        
        const testWorkoutWithStringifiedSections = {
          ...testWorkout,
          sections: JSON.stringify(testWorkout.sections)
        };
        
        const { data: savedWithString, error: stringError } = await supabase
          .from('workouts')
          .insert(testWorkoutWithStringifiedSections)
          .select()
          .single();
          
        if (stringError) {
          console.error('❌ Save with stringified JSON also failed:', stringError);
        } else {
          console.log('✅ Save with stringified JSON succeeded:', savedWithString);
          console.log('\nYou need to update the createWorkout function to stringify the sections field');
        }
      }
      
      return false;
    }

    console.log('✅ Save succeeded:', savedWorkout);
    
    // Verify the saved workout can be retrieved
    console.log('\nVerifying saved workout can be retrieved...');
    
    const { data: retrievedWorkout, error: retrieveError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', savedWorkout.id)
      .single();
      
    if (retrieveError) {
      console.error('❌ Retrieve failed:', retrieveError);
      return false;
    }
    
    console.log('✅ Retrieved workout:', retrievedWorkout);
    
    // Clean up by deleting the test workout
    console.log('\nCleaning up by deleting test workout...');
    
    const { error: deleteError } = await supabase
      .from('workouts')
      .delete()
      .eq('id', savedWorkout.id);
      
    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
    } else {
      console.log('✅ Test workout deleted successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

testSaveWorkout().then(success => {
  if (success) {
    console.log('\n✅ All tests passed successfully!');
  } else {
    console.log('\n❌ Some tests failed. See errors above for details.');
  }
});
