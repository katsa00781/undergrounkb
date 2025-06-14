#!/bin/zsh
# filepath: /Users/kacsorzsolt/Downloads/ugkettlebellpro/install-fms-table.sh

# Script to help install the FMS assessments table
# This script guides you through the installation process

echo "==============================================="
echo "    FMS Assessments Table Installation Guide"
echo "==============================================="
echo

# Check if we have the SQL file
if [ ! -f "./create-fms-table.sql" ]; then
  echo "⚠️  Warning: Could not find the create-fms-table.sql file in the current directory."
  echo "Please make sure you're in the root directory of the project."
  exit 1
fi

echo "✅ Found create-fms-table.sql"
echo 
echo "To install the FMS assessments table, you need to:"
echo
echo "1. Log in to your Supabase dashboard"
echo "2. Navigate to the SQL Editor"
echo "3. Create a new query"
echo "4. Copy and paste the contents of create-fms-table.sql"
echo "5. Run the query"
echo

# Ask if they want to open the SQL file
echo -n "Would you like to open the create-fms-table.sql file now? (y/n): "
read open_sql_file
if [[ $open_sql_file =~ ^[Yy]$ ]]; then
  echo "Opening create-fms-table.sql..."
  if command -v code &> /dev/null; then
    code ./create-fms-table.sql
  elif command -v open &> /dev/null; then
    open ./create-fms-table.sql
  else
    echo "Could not find command to open file. Please open it manually."
  fi
fi

# Show the contents of the file
echo
echo "Here's the content of create-fms-table.sql that you need to paste into Supabase SQL Editor:"
echo "----------------------------------------"
echo "File is too long to display. Please open it to view the content."
echo "----------------------------------------"
echo

# Ask if they want to open the Supabase dashboard
echo -n "Would you like to open the Supabase dashboard? (y/n): "
read open_dashboard
if [[ $open_dashboard =~ ^[Yy]$ ]]; then
  # Try to extract the Supabase URL from the environment file
  supabase_url=""
  if [ -f ".env" ]; then
    supabase_url=$(grep 'VITE_SUPABASE_URL' .env | cut -d '=' -f2)
  elif [ -f ".env.local" ]; then
    supabase_url=$(grep 'VITE_SUPABASE_URL' .env.local | cut -d '=' -f2)
  fi
  
  if [ -n "$supabase_url" ]; then
    # Extract the project ID from the URL
    project_id=$(echo "$supabase_url" | cut -d '/' -f3 | cut -d '.' -f1)
    dashboard_url="https://app.supabase.com/project/$project_id/sql"
    
    echo "Opening Supabase SQL Editor at $dashboard_url"
    if command -v open &> /dev/null; then
      open "$dashboard_url"
    else
      echo "Could not automatically open the browser."
      echo "Please visit: $dashboard_url"
    fi
  else
    echo "Could not find Supabase URL in environment files."
    echo "Please open your Supabase dashboard manually."
  fi
fi

echo
echo "After running the SQL query in Supabase, verify the installation by:"
echo "1. Going to the Table Editor"
echo "2. Finding the fms_assessments table"
echo "3. Checking that it has the correct columns"
echo

echo "==============================================="
echo "    Installation Guide Complete"
echo "==============================================="
echo "For more information, see: ./docs/fms_installation_guide_hu.md"
echo

# Make the script executable
chmod +x ./install-fms-table.sh

exit 0
