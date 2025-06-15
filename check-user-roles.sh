#!/bin/bash

# Script to check and fix user role issues

echo "======================================="
echo "User Role Checking and Repair Script"
echo "======================================="
echo

# Function to get database connection details
function get_connection_details() {
  echo "Enter your Supabase or PostgreSQL database connection details:"
  read -p "Host (default: localhost): " DB_HOST
  DB_HOST=${DB_HOST:-localhost}
  
  read -p "Port (default: 5432): " DB_PORT
  DB_PORT=${DB_PORT:-5432}
  
  read -p "Database name: " DB_NAME
  
  read -p "Username: " DB_USER
  
  read -s -p "Password: " DB_PASS
  echo
  
  # Build connection string
  CONN_STRING="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"
  
  echo "Testing connection..."
  if ! psql "$CONN_STRING" -c '\q' >/dev/null 2>&1; then
    echo "Error: Could not connect to the database. Please check your credentials."
    exit 1
  fi
  
  echo "Connection successful!"
}

# Function to check roles
function check_roles() {
  echo
  echo "Checking user roles..."
  
  # Check for users with different roles in profiles and users tables
  INCONSISTENT_ROLES=$(psql "$CONN_STRING" -t -c "
    SELECT 
      p.id, 
      p.email, 
      p.role as profile_role, 
      u.role as user_role
    FROM profiles p
    JOIN users u ON p.id = u.id
    WHERE p.role != u.role;
  ")
  
  if [ -n "$INCONSISTENT_ROLES" ]; then
    echo "⚠️  Found inconsistent roles between profiles and users tables:"
    echo "$INCONSISTENT_ROLES"
    echo
    read -p "Would you like to fix these inconsistencies? (y/n): " FIX_ROLES
    if [[ $FIX_ROLES == "y" || $FIX_ROLES == "Y" ]]; then
      echo "How would you like to resolve inconsistencies?"
      echo "1. Use roles from profiles table"
      echo "2. Use roles from users table"
      echo "3. Manually review each case"
      read -p "Enter your choice (1-3): " ROLE_CHOICE
      
      case $ROLE_CHOICE in
        1)
          echo "Updating users table with roles from profiles..."
          psql "$CONN_STRING" -c "
            UPDATE users u
            SET role = p.role
            FROM profiles p
            WHERE p.id = u.id AND p.role != u.role;
          "
          ;;
        2)
          echo "Updating profiles table with roles from users..."
          psql "$CONN_STRING" -c "
            UPDATE profiles p
            SET role = u.role
            FROM users u
            WHERE p.id = u.id AND p.role != u.role;
          "
          ;;
        3)
          echo "Manual review not implemented in this script."
          echo "Please use the SQL queries from the documentation to review and fix manually."
          ;;
        *)
          echo "Invalid choice. No changes made."
          ;;
      esac
    fi
  else
    echo "✅ All roles are consistent between profiles and users tables."
  fi
  
  # Check for missing RPC functions
  echo
  echo "Checking for required RPC functions..."
  
  MISSING_FUNCTIONS=()
  
  for FUNC in "get_user_role" "get_current_user_role" "is_admin" "is_current_user_admin"; do
    if ! psql "$CONN_STRING" -t -c "SELECT 1 FROM pg_proc WHERE proname='$FUNC'" | grep -q 1; then
      MISSING_FUNCTIONS+=("$FUNC")
    fi
  done
  
  if [ ${#MISSING_FUNCTIONS[@]} -gt 0 ]; then
    echo "⚠️  Missing RPC functions: ${MISSING_FUNCTIONS[*]}"
    echo
    read -p "Would you like to create the missing RPC functions? (y/n): " CREATE_FUNCS
    if [[ $CREATE_FUNCS == "y" || $CREATE_FUNCS == "Y" ]]; then
      echo "Creating missing RPC functions..."
      # Use the SQL from fix-role-functions.sh
      psql "$CONN_STRING" -f "fix_role_functions.sql"
      echo "RPC functions created."
    fi
  else
    echo "✅ All required RPC functions exist."
  fi
}

# Main execution
get_connection_details
check_roles

echo
echo "Role check and fix completed!"
