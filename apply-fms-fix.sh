#!/bin/bash

# Script to apply the FMS table structure fix
# This script will apply the fix-fms-table-simple.sql which matches the current code structure

echo "Applying FMS table structure fix to Supabase..."
echo "This will recreate the fms_assessments table to match the current code structure."
echo ""

# Display the SQL that will be applied
echo "The following SQL will be applied:"
echo "================================="
cat fix-fms-table-simple.sql
echo "================================="
echo ""

echo "Please copy and paste the above SQL into your Supabase SQL Editor."
echo "This will:"
echo "- Drop and recreate the fms_assessments table"
echo "- Use simplified structure that matches the current code"
echo "- Set up proper RLS policies"
echo "- Add necessary triggers and permissions"
echo ""

read -p "Press Enter after applying the SQL fix in Supabase: " dummy

echo "FMS table structure should now be fixed!"
echo "The table will now have the correct column names that match the code:"
echo "- active_straight_leg_raise (instead of active_straight_leg_left/right)"
echo "- hurdle_step (instead of hurdle_step_left/right)"
echo "- inline_lunge (instead of inline_lunge_left/right)"
echo "- shoulder_mobility (instead of shoulder_mobility_left/right)"
echo "- rotary_stability (instead of rotary_stability_left/right)"
echo ""
echo "You can now test the FMS Assessment functionality!"
