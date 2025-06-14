// Test script to debug fitness goals array issues
import { supabase } from '../src/config/supabase';

// Function to get a test user profile
async function getTestProfile() {
  
  console.log('Fetching a test profile...');
  
  // Get the first profile we can find
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return null;
  }
  
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found');
    return null;
  }
  
  const profile = profiles[0];
  return profile;
}

// Function to test updating fitness goals
async function testUpdateFitnessGoals() {
  const profile = await getTestProfile();
  
  if (!profile) return;
  
  console.log('Original profile:');
  console.log('- ID:', profile.id);
  console.log('- fitness_goals:', profile.fitness_goals);
  console.log('- Type:', Array.isArray(profile.fitness_goals) ? 'Array' : typeof profile.fitness_goals);
  
  // Test updating with array
  const testGoals = ['Strength', 'Flexibility', 'TestValue'];
  
  console.log('\nUpdating fitness_goals to:', testGoals);
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      fitness_goals: testGoals,
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating profile:', error);
    return;
  }
  
  console.log('\nUpdated profile:');
  console.log('- fitness_goals:', data.fitness_goals);
  console.log('- Type:', Array.isArray(data.fitness_goals) ? 'Array' : typeof data.fitness_goals);
  
  // Now verify we can retrieve it correctly
  const { data: verifyData, error: verifyError } = await supabase
    .from('profiles')
    .select('fitness_goals')
    .eq('id', profile.id)
    .single();
  
  if (verifyError) {
    console.error('Error verifying update:', verifyError);
    return;
  }
  
  console.log('\nVerified after fetching:');
  console.log('- fitness_goals:', verifyData.fitness_goals);
  console.log('- Type:', Array.isArray(verifyData.fitness_goals) ? 'Array' : typeof verifyData.fitness_goals);
}

// Run the test
testUpdateFitnessGoals().catch(err => console.error('Unhandled error:', err));
