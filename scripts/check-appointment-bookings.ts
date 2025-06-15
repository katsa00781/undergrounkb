// Script to check the appointment_bookings table structure
import { supabase } from '../src/config/supabase';

async function checkAppointmentBookingsTable() {
  console.log('Checking appointment_bookings table...');
  
  try {
    // Test if the table exists by querying it
    const { error } = await supabase
      .from('appointment_bookings')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.error('Error: Table appointment_bookings does not exist!');
        console.log('You need to run the fix-appointments-tables.sh script.');
        return false;
      } else {
        console.error('Error accessing table appointment_bookings:', error.message);
        return false;
      }
    }
    
    // Check table columns
    const { data: columns, error: columnsError } = await supabase
      .rpc('_check_table_columns', { 
        p_table_name: 'appointment_bookings',
        p_column_names: ['id', 'appointment_id', 'user_id', 'status', 'created_at', 'updated_at']
      });
    
    if (columnsError) {
      console.error('Error checking table columns:', columnsError.message);
      console.log('Note: The _check_table_columns RPC function might not exist. This is not critical.');
    } else if (columns && !columns.all_columns_exist) {
      console.error('Error: appointment_bookings table is missing some expected columns!');
      console.log('Expected columns: id, appointment_id, user_id, status, created_at, updated_at');
      console.log('You need to run the fix-appointments-tables.sh script.');
      return false;
    }
    
    // Test relationship with appointments table
    const { error: joinError } = await supabase
      .from('appointment_bookings')
      .select('*, appointments(*)')
      .limit(1);
    
    if (joinError) {
      console.error('Error testing relationship with appointments table:', joinError.message);
      return false;
    }
    
    console.log('✅ appointment_bookings table is correctly set up!');
    return true;
  } catch (error) {
    console.error('Unexpected error checking appointment_bookings table:', error);
    return false;
  }
}

// Run the check
checkAppointmentBookingsTable()
  .then(success => {
    if (!success) {
      console.log('\nFix recommendations:');
      console.log('1. Run the fix-appointments-tables.sh script');
      console.log('2. Restart your application');
      process.exit(1);
    }
  });
