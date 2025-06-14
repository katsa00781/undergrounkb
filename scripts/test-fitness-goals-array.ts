// Test script for fitness goals array
import { supabase } from '../src/config/supabase';

/**
 * Ez a script ellenőrzi a fitness_goals tömbmező mentését és visszaolvasását
 */
async function testFitnessGoalsArray() {
  console.log('Testing fitness_goals array handling...');
  
  try {
    // 1. Keressünk egy tesztfelhasználót
    console.log('Looking for a test profile...');
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('No profiles found. Please create a profile first.');
      return;
    }
    
    const testProfile = profiles[0];
    console.log(`Found test profile with ID: ${testProfile.id}`);
    
    // 2. Mentsünk egy tesztértéket fitness_goals mezőbe
    const testGoals = ['Strength', 'Flexibility', 'Test Goal ' + Date.now()];
    console.log(`Setting fitness_goals to: ${JSON.stringify(testGoals)}`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        fitness_goals: testGoals,
        updated_at: new Date().toISOString()
      })
      .eq('id', testProfile.id)
      .select();
    
    if (updateError) {
      console.error('Error updating fitness_goals:', updateError);
      return;
    }
    
    console.log('Update successful');
    
    // 3. Olvassuk vissza az értéket ellenőrzéshez
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('fitness_goals')
      .eq('id', testProfile.id)
      .single();
    
    if (verifyError) {
      console.error('Error verifying data:', verifyError);
      return;
    }
    
    console.log('Retrieved fitness_goals:', verifyData.fitness_goals);
    console.log('Type of fitness_goals:', Array.isArray(verifyData.fitness_goals) ? 'Array' : typeof verifyData.fitness_goals);
    
    if (Array.isArray(verifyData.fitness_goals)) {
      console.log('Values match:', JSON.stringify(verifyData.fitness_goals) === JSON.stringify(testGoals));
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testFitnessGoalsArray();
