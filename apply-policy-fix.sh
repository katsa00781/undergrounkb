#!/bin/bash

# Simple test script to apply the policy fix
# This reads the fix-policies-only.sql and applies it using the connection string

echo "Applying policy fixes to Supabase..."

# Read the SQL content
SQL_CONTENT=$(cat fix-policies-only.sql)

# Use curl to send it to Supabase via API (if we have the service key)
# Or we can show instructions for manual application

echo "Please copy and paste the following SQL into your Supabase SQL Editor:"
echo "================================="
cat fix-policies-only.sql
echo "================================="
echo ""
echo "After applying the SQL, press Enter to continue testing..."
read -p "Press Enter after applying the fix: " dummy

# Test the connection again
echo "Testing connection after fix..."
node test-auth-db.cjs
