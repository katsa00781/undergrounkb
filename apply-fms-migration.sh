#!/bin/bash

# Script to apply the FMS assessments table migration to Supabase

echo "Applying FMS assessments table migration..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null
then
    echo "❌ Error: Supabase CLI is not installed or not in PATH"
    echo "Please install it first: npm install -g supabase"
    exit 1
fi

# Change to project root directory (assuming this script is in scripts/)
cd "$(dirname "$0")/.." || exit 1

# Apply migration
echo "Running migration up command..."
supabase migration up

# Check result
if [ $? -eq 0 ]; then
    echo "✅ Migration successfully applied"
    echo "You can now use the FMS assessment feature!"
else
    echo "❌ Error applying migration"
    echo "Please check the error messages above for more details."
    exit 1
fi

exit 0
