#!/bin/bash

# Script to create the appointment_bookings table

echo "=================================="
echo "Creating appointment_bookings table"
echo "=================================="

# Run the Node.js script
node scripts/create_appointment_bookings_table.js

# Check if the script was successful
if [ $? -eq 0 ]; then
    echo "Table creation script completed successfully."
    
    # Reset Supabase schema cache to ensure the new table is visible
    if [ -f "./reset-schema-cache.sh" ]; then
        echo "Resetting Supabase schema cache..."
        ./reset-schema-cache.sh
    else
        echo "Warning: Could not find reset-schema-cache.sh script."
        echo "If you encounter schema cache issues, manually reset the cache."
    fi
    
    echo "✅ Setup complete! The appointment booking system should now work."
    echo "Please refresh your application to apply changes."
else
    echo "❌ Table creation script failed."
    echo "Please check the error messages above and try again."
fi
