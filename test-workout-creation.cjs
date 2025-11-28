const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testWorkoutCreation() {
  console.log('🧪 Testing workout creation...\n');
  
  try {
    // Get admin user
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'admin')
      .single();
      
    if (adminError || !adminProfile) {
      console.log('❌ No admin user found:', adminError);
      return;
    }
    
    console.log('✅ Admin user found:', adminProfile.full_name, adminProfile.id);
    
    // Try to create a test workout
    const testWorkout = {
      title: 'Test Admin Workout',
      date: '2025-09-05',
      duration: 60,
      notes: 'Test workout for debugging',
      sections: [
        {
          name: 'Test Section',
          exercises: [
            {
              exerciseId: 'test-exercise-id',
              sets: 3,
              reps: 10,
              weight: 16
            }
          ]
        }
      ],
      user_id: adminProfile.id
    };
    
    console.log('\n📝 Attempting to create workout...');
    const { data, error } = await supabase
      .from('workouts')
      .insert(testWorkout)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error creating workout:', error);
    } else {
      console.log('✅ Workout created successfully!');
      console.log('   ID:', data.id);
      console.log('   Title:', data.title);
      
      // Now test the copyWorkoutToUser function
      console.log('\n🔄 Testing copyWorkoutToUser...');
      
      // Get a regular user
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .neq('role', 'admin')
        .single();
        
      if (userProfile) {
        console.log('✅ Test user found:', userProfile.full_name, userProfile.id);
        
        // Import copyWorkoutToUser
        const { copyWorkoutToUser } = require('./src/lib/workouts.ts');
        
        const copiedWorkout = await copyWorkoutToUser('2025-09-05', adminProfile.id, userProfile.id);
        
        if (copiedWorkout) {
          console.log('✅ Workout copied successfully to user!');
          console.log('   Copied ID:', copiedWorkout.id);
          console.log('   Title:', copiedWorkout.title);
          
          // Clean up copied workout
          await supabase.from('workouts').delete().eq('id', copiedWorkout.id);
          console.log('✅ Copied workout cleaned up');
        } else {
          console.log('❌ Failed to copy workout to user');
        }
      } else {
        console.log('❌ No regular user found for testing');
      }
      
      // Clean up - delete the test workout
      await supabase.from('workouts').delete().eq('id', data.id);
      console.log('✅ Test workout cleaned up');
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testWorkoutCreation()
  .then(() => console.log('\n🎉 Test completed!'))
  .catch(console.error);
