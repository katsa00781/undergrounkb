const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugWorkoutsSchema() {
  console.log('🔍 Debugging Workouts Schema and Data...\n');

  try {
    // 1. Check current workouts
    console.log('1. Checking existing workouts...');
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('id, title, date, user_id, sections, created_at')
      .limit(5);

    if (workoutsError) {
      console.error('❌ Error fetching workouts:', workoutsError);
      return;
    }

    console.log(`📊 Found ${workouts.length} workouts`);
    workouts.forEach(workout => {
      console.log(`  - ${workout.title} (${workout.date}) by user: ${workout.user_id}`);
    });

    // 2. Check user profiles to see who is admin
    console.log('\n2. Checking user profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(10);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`📊 Found ${profiles.length} profiles`);
    profiles.forEach(profile => {
      console.log(`  - ${profile.full_name} (${profile.role}) - ID: ${profile.id}`);
    });

    // 3. Check appointment bookings
    console.log('\n3. Checking appointment bookings...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('appointment_bookings')
      .select('appointment_id, user_id, created_at')
      .limit(5);

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError);
      return;
    }

    console.log(`📊 Found ${bookings.length} bookings`);
    bookings.forEach(booking => {
      console.log(`  - User ${booking.user_id} booked appointment ${booking.appointment_id}`);
    });

    // 4. Check appointments with dates
    console.log('\n4. Checking appointments...');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, title, start_time, created_by')
      .limit(5);

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
      return;
    }

    console.log(`📊 Found ${appointments.length} appointments`);
    appointments.forEach(appointment => {
      const date = appointment.start_time.split('T')[0];
      console.log(`  - ${appointment.title} (${date}) by admin: ${appointment.created_by}`);
    });

    // 5. Cross-check: Do we have admin workouts for appointment dates?
    console.log('\n5. Cross-checking admin workouts for appointment dates...');
    for (const appointment of appointments) {
      const appointmentDate = appointment.start_time.split('T')[0];
      const adminId = appointment.created_by;
      
      const { data: adminWorkouts, error: adminWorkoutError } = await supabase
        .from('workouts')
        .select('id, title, date')
        .eq('user_id', adminId)
        .eq('date', appointmentDate);

      if (adminWorkoutError) {
        console.error(`❌ Error checking admin workouts for ${appointmentDate}:`, adminWorkoutError);
        continue;
      }

      console.log(`  📅 ${appointmentDate}: ${adminWorkouts.length} admin workouts found`);
      adminWorkouts.forEach(workout => {
        console.log(`    - "${workout.title}"`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugWorkoutsSchema().then(() => {
  console.log('\n🎉 Debug completed!');
  process.exit(0);
});
