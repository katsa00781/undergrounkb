const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load env variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserWorkouts() {
  console.log('\n🔍 Debugging User Workouts...\n');

  try {
    // 1. Check all workouts
    console.log('1. Checking all workouts in database...');
    const { data: allWorkouts, error: allError } = await supabase
      .from('workouts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.error('❌ Error fetching all workouts:', allError);
      return;
    }

    console.log(`📊 Found ${allWorkouts.length} total workouts`);
    allWorkouts.forEach((workout, index) => {
      console.log(`  ${index + 1}. ${workout.title} (User: ${workout.user_id}) - Date: ${workout.date}`);
      if (workout.title.includes('Assigned')) {
        console.log('    ✨ This is an assigned workout from admin!');
      }
    });

    // 2. Check for specific user workouts
    console.log('\n2. Checking workouts for specific users...');
    
    // Get all profiles to find users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .order('role', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`📊 Found ${profiles.length} profiles`);
    
    for (const profile of profiles) {
      const { data: userWorkouts, error: userError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: false });

      if (!userError && userWorkouts.length > 0) {
        console.log(`\n👤 ${profile.first_name} ${profile.last_name} (${profile.role}):`);
        userWorkouts.forEach(workout => {
          const isAssigned = workout.title.includes('Assigned');
          console.log(`  📅 ${workout.date}: ${workout.title} ${isAssigned ? '(ASSIGNED)' : '(CREATED)'}`);
        });
      }
    }

    // 3. Check appointment bookings
    console.log('\n3. Checking recent appointment bookings...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('appointments_participants')
      .select(`
        appointment_id,
        user_id,
        created_at,
        appointments!inner(
          start_time,
          created_by,
          title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!bookingsError && bookings.length > 0) {
      console.log(`📊 Found ${bookings.length} recent bookings`);
      bookings.forEach(booking => {
        const appointmentDate = booking.appointments.start_time.split('T')[0];
        console.log(`  📅 ${appointmentDate}: User ${booking.user_id} booked with admin ${booking.appointments.created_by}`);
        
        // Check if workout was created for this user on this date
        const userWorkout = allWorkouts.find(w => 
          w.user_id === booking.user_id && 
          w.date === appointmentDate && 
          w.title.includes('Assigned')
        );
        
        if (userWorkout) {
          console.log(`    ✅ Workout found: ${userWorkout.title}`);
        } else {
          console.log(`    ❌ No assigned workout found for this booking!`);
        }
      });
    } else {
      console.log('📊 No recent bookings found');
    }

    console.log('\n🎉 Debug completed!');

  } catch (error) {
    console.error('❌ Unexpected error during debugging:', error);
  }
}

// Run the debug
debugUserWorkouts()
  .catch(console.error)
  .finally(() => {
    console.log('Debug script execution completed.');
    process.exit(0);
  });
