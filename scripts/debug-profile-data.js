// Debug script to check profile data
import { createClient } from '@supabase/supabase-js';

// Setup supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProfileData() {
  try {
    // First check if we can access the table and get column info
    console.log('Checking profiles table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing profiles table:', tableError.message);
      return;
    }
    
    if (!tableData || tableData.length === 0) {
      console.log('No profile records found. Creating test profile...');
      
      // Create a test profile
      const testUser = {
        id: 'test-user-' + Date.now(),
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        height: 180,
        weight: 75,
        birthdate: '1990-01-01',
        gender: 'male',
        fitness_goals: ['Strength', 'Endurance'],
        experience_level: 'intermediate',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([testUser]);
      
      if (insertError) {
        console.error('Failed to create test profile:', insertError.message);
        // Continue to try to analyze the structure
      } else {
        console.log('Test profile created successfully');
      }
    }
    
    // Get all profiles to examine structure
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error fetching profiles:', error.message);
      return;
    }
    
    // Log the structure and debug info
    console.log('Profile data structure:');
    if (profiles && profiles.length > 0) {
      console.log('Sample profile:');
      console.log(JSON.stringify(profiles[0], null, 2));
      
      // Check for specific fields
      const profile = profiles[0];
      console.log('\nField value check:');
      console.log('- first_name:', typeof profile.first_name, profile.first_name);
      console.log('- last_name:', typeof profile.last_name, profile.last_name);
      console.log('- height:', typeof profile.height, profile.height);
      console.log('- weight:', typeof profile.weight, profile.weight);
      console.log('- birthdate:', typeof profile.birthdate, profile.birthdate);
      console.log('- gender:', typeof profile.gender, profile.gender);
      console.log('- fitness_goals:', Array.isArray(profile.fitness_goals), profile.fitness_goals);
      console.log('- experience_level:', typeof profile.experience_level, profile.experience_level);
      
      // Test creating userProfile format from database data
      const testUserProfile = {
        displayName: 
          profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : ((profile.first_name) || ''),
        height: typeof profile.height === 'number' ? profile.height : undefined,
        weight: typeof profile.weight === 'number' ? profile.weight : undefined,
        birthdate: typeof profile.birthdate === 'string' ? profile.birthdate : '',
        gender: profile.gender === 'male' ? 'male' :
                profile.gender === 'female' ? 'female' :
                profile.gender === 'other' ? 'other' : '',
        fitnessGoals: Array.isArray(profile.fitness_goals) ? profile.fitness_goals : [],
        experienceLevel: 
          profile.experience_level === 'beginner' ? 'beginner' :
          profile.experience_level === 'intermediate' ? 'intermediate' :
          profile.experience_level === 'advanced' ? 'advanced' : undefined
      };
      
      console.log('\nTransformed userProfile:');
      console.log(testUserProfile);
    } else {
      console.log('No profiles found in database');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the debug script
debugProfileData();
