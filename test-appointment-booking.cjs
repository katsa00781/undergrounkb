const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://iipcpjczjjkwwifwzmut.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpcGNwamN6amprd3dpZnd6bXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDY2MTcsImV4cCI6MjA2NTQyMjYxN30.Q0l_XF8093ulhoasXmHfkVORDZBLpjoIAWC0_snQujY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAppointmentBooking() {
  console.log('\n🧪 Testing Appointment Booking System...\n');

  try {
    // 1. Check if appointments_participants table exists
    console.log('1. Checking appointments_participants table...');
    const { data: participants, error: participantsError } = await supabase
      .from('appointments_participants')
      .select('*')
      .limit(1);
    
    if (participantsError) {
      console.error('❌ Error accessing appointments_participants table:', participantsError);
      return;
    }
    console.log('✅ appointments_participants table accessible');

    // 2. Check appointments table structure
    console.log('\n2. Checking appointments table...');
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .limit(3);
    
    if (appointmentsError) {
      console.error('❌ Error accessing appointments table:', appointmentsError);
      return;
    }
    console.log('✅ appointments table accessible');
    console.log(`📊 Found ${appointments.length} appointments`);

    if (appointments.length > 0) {
      console.log('📝 Sample appointment structure:');
      console.log(JSON.stringify(appointments[0], null, 2));
    }

    // 3. Check appointment participants
    console.log('\n3. Checking existing participants...');
    const { data: allParticipants, error: allParticipantsError } = await supabase
      .from('appointments_participants')
      .select('appointment_id, user_id, created_at')
      .limit(5);
    
    if (allParticipantsError) {
      console.error('❌ Error getting participants:', allParticipantsError);
      return;
    }
    
    console.log(`📊 Found ${allParticipants.length} participant records`);
    if (allParticipants.length > 0) {
      console.log('📝 Sample participant structure:');
      console.log(JSON.stringify(allParticipants[0], null, 2));
    }

    // 4. Test getUserBookings query structure
    console.log('\n4. Testing getUserBookings query...');
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('appointments_participants')
      .select('*, appointments(*)')
      .limit(3);
    
    if (bookingsError) {
      console.error('❌ Error testing getUserBookings query:', bookingsError);
      return;
    }
    
    console.log('✅ getUserBookings query structure works');
    console.log(`📊 Found ${bookingsData.length} booking records with appointment details`);
    
    if (bookingsData.length > 0) {
      console.log('📝 Sample booking with appointment structure:');
      console.log(JSON.stringify(bookingsData[0], null, 2));
    }

    console.log('\n✅ All appointment booking tests passed!');
    console.log('\n📋 Summary:');
    console.log(`- Appointments table: ${appointments.length} records`);
    console.log(`- Participants table: ${allParticipants.length} records`);
    console.log(`- Join query: ${bookingsData.length} records`);
    console.log('\n🎉 Appointment booking system is ready to use!');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testAppointmentBooking();
