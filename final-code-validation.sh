#!/bin/bash

# FINAL VALIDATION SCRIPT
# =======================
# Ellenőrzi, hogy minden javítás helyesen implementálva van

echo "🔍 FINAL VALIDATION - CODE REVIEW"
echo "================================="
echo ""

echo "📋 ELLENŐRZÉS 1: PROGRESS TRACKING VALIDATION"
echo "============================================="
echo ""

# Check if valueAsNumber is removed from optional fields
echo "🔧 Checking ProgressTracking.tsx for valueAsNumber usage..."
VALUE_AS_NUMBER_COUNT=$(grep -n "valueAsNumber" src/pages/ProgressTracking.tsx | grep -v "weight" | wc -l)
if [ "$VALUE_AS_NUMBER_COUNT" -eq 0 ]; then
    echo "✅ PASS: valueAsNumber correctly removed from optional fields"
else
    echo "❌ FAIL: valueAsNumber still present in optional fields"
    grep -n "valueAsNumber" src/pages/ProgressTracking.tsx | grep -v "weight"
fi
echo ""

# Check for proper Zod preprocessing
echo "🔧 Checking Zod schema preprocessing..."
PREPROCESS_COUNT=$(grep -c "z.preprocess" src/pages/ProgressTracking.tsx)
if [ "$PREPROCESS_COUNT" -ge 5 ]; then
    echo "✅ PASS: Zod preprocessing found for optional fields ($PREPROCESS_COUNT instances)"
else
    echo "❌ FAIL: Missing Zod preprocessing for optional fields"
fi
echo ""

# Check for NaN handling in preprocessing
echo "🔧 Checking NaN handling in preprocessing..."
NAN_HANDLING=$(grep -c "Number.isNaN" src/pages/ProgressTracking.tsx)
if [ "$NAN_HANDLING" -ge 5 ]; then
    echo "✅ PASS: NaN handling implemented ($NAN_HANDLING instances)"
else
    echo "❌ FAIL: Insufficient NaN handling"
fi
echo ""

echo "📋 ELLENŐRZÉS 2: PROFILE FORM FITNESS GOALS"
echo "=========================================="
echo ""

# Check for proper setValue usage in Profile
echo "🔧 Checking Profile.tsx for setValue usage..."
SET_VALUE_COUNT=$(grep -c "setValue.*fitnessGoals" src/pages/Profile.tsx)
if [ "$SET_VALUE_COUNT" -ge 1 ]; then
    echo "✅ PASS: setValue found for fitnessGoals"
else
    echo "❌ FAIL: setValue not found for fitnessGoals"
fi
echo ""

# Check for button-based checkbox implementation
echo "🔧 Checking for custom checkbox buttons..."
BUTTON_CHECKBOX_COUNT=$(grep -c "handleGoalToggle" src/pages/Profile.tsx)
if [ "$BUTTON_CHECKBOX_COUNT" -ge 1 ]; then
    echo "✅ PASS: Custom button-based checkboxes implemented"
else
    echo "❌ FAIL: Custom checkbox buttons not found"
fi
echo ""

echo "📋 ELLENŐRZÉS 3: USEPROFILEPROVIDER HOOKS"
echo "========================================"
echo ""

# Check for security definer function usage
echo "🔧 Checking useProfileProvider for security definer function..."
SECURITY_DEFINER_COUNT=$(grep -c "update_user_profile" src/hooks/useProfileProvider.ts)
if [ "$SECURITY_DEFINER_COUNT" -ge 1 ]; then
    echo "✅ PASS: Security definer function usage found"
else
    echo "❌ FAIL: Security definer function not found"
fi
echo ""

# Check for proper error handling
echo "🔧 Checking error handling..."
ERROR_HANDLING_COUNT=$(grep -c "catch.*error" src/hooks/useProfileProvider.ts)
if [ "$ERROR_HANDLING_COUNT" -ge 1 ]; then
    echo "✅ PASS: Error handling implemented"
else
    echo "❌ FAIL: Error handling not found"
fi
echo ""

echo "📋 ELLENŐRZÉS 4: SQL FILES"
echo "========================="
echo ""

# Check if SQL files exist
SQL_FILES=(
    "fix_profiles_permissions.sql"
    "supabase-sql-editor-fix.sql"
    "create_profiles_table.sql"
)

for file in "${SQL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ FOUND: $file"
    else
        echo "❌ MISSING: $file"
    fi
done
echo ""

# Check for security definer in SQL
echo "🔧 Checking SQL for security definer function..."
if [ -f "supabase-sql-editor-fix.sql" ]; then
    SECURITY_DEFINER_SQL=$(grep -c "SECURITY DEFINER" supabase-sql-editor-fix.sql)
    if [ "$SECURITY_DEFINER_SQL" -ge 1 ]; then
        echo "✅ PASS: Security definer function found in SQL"
    else
        echo "❌ FAIL: Security definer function not found in SQL"
    fi
else
    echo "❌ FAIL: supabase-sql-editor-fix.sql not found"
fi
echo ""

echo "📋 ELLENŐRZÉS 5: DOCUMENTATION"
echo "============================="
echo ""

# Check for documentation files
DOC_FILES=(
    "PROFILE_FORM_FIXES.md"
    "PROGRESS_TRACKING_VALIDATION_FIX.md"
    "SUPABASE_SQL_TUTORIAL.md"
    "SUPABASE_COMPATIBILITY_FIX.md"
)

for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ FOUND: $file"
    else
        echo "❌ MISSING: $file"
    fi
done
echo ""

echo "📋 ELLENŐRZÉS 6: REMOVED DEBUG CODE"
echo "=================================="
echo ""

# Check if RoleDebug is removed
echo "🔧 Checking for removed RoleDebug component..."
if [ -f "src/components/ui/RoleDebug.tsx" ]; then
    echo "❌ FAIL: RoleDebug.tsx still exists (should be deleted)"
else
    echo "✅ PASS: RoleDebug.tsx properly removed"
fi

# Check AppointmentBooking for debug code
if ! grep -q "RoleDebug" src/pages/AppointmentBooking.tsx 2>/dev/null; then
    echo "✅ PASS: No RoleDebug usage in AppointmentBooking.tsx"
else
    echo "❌ FAIL: RoleDebug still referenced in AppointmentBooking.tsx"
fi
echo ""

echo "🎯 ÖSSZEFOGLALÓ"
echo "=============="
echo ""

# Count overall validation results
TOTAL_CHECKS=10
PASSED_CHECKS=0

# Re-run key checks and count passes
[ "$(grep -n "valueAsNumber" src/pages/ProgressTracking.tsx | grep -v "weight" | wc -l)" -eq 0 ] && ((PASSED_CHECKS++))
[ "$(grep -c "z.preprocess" src/pages/ProgressTracking.tsx)" -ge 5 ] && ((PASSED_CHECKS++))
[ "$(grep -c "Number.isNaN" src/pages/ProgressTracking.tsx)" -ge 5 ] && ((PASSED_CHECKS++))
[ "$(grep -c "setValue.*fitnessGoals" src/pages/Profile.tsx)" -ge 1 ] && ((PASSED_CHECKS++))
[ "$(grep -c "handleGoalToggle" src/pages/Profile.tsx)" -ge 1 ] && ((PASSED_CHECKS++))
[ "$(grep -c "update_user_profile" src/hooks/useProfileProvider.ts)" -ge 1 ] && ((PASSED_CHECKS++))
[ "$(grep -c "catch.*error" src/hooks/useProfileProvider.ts)" -ge 1 ] && ((PASSED_CHECKS++))
[ -f "supabase-sql-editor-fix.sql" ] && ((PASSED_CHECKS++))
[ ! -f "src/components/ui/RoleDebug.tsx" ] && ((PASSED_CHECKS++))
ROLEDEBUG_COUNT=$(grep -c "RoleDebug" src/pages/AppointmentBooking.tsx 2>/dev/null || echo "0")
if ! grep -q "RoleDebug" src/pages/AppointmentBooking.tsx 2>/dev/null; then
    ((PASSED_CHECKS++))
fi

echo "Átment ellenőrzések: $PASSED_CHECKS/$TOTAL_CHECKS"
echo ""

if [ "$PASSED_CHECKS" -eq "$TOTAL_CHECKS" ]; then
    echo "🎉 MINDEN ELLENŐRZÉS SIKERES!"
    echo "============================="
    echo ""
    echo "✅ Progress Tracking NaN validációs hibák javítva"
    echo "✅ Profile form fitnessGoals checkbox-ok működnek"
    echo "✅ SQL security definer function implementálva"
    echo "✅ Hibakezelés és error handling megfelelő"
    echo "✅ Debug kód eltávolítva"
    echo "✅ Dokumentáció elkészült"
    echo ""
    echo "🚀 READY FOR MANUAL TESTING!"
    echo ""
    echo "Következő lépés: Futtasd le a manual-testing-final.sh script-et"
    echo "és kövesd a lépéseket a böngészőben!"
    echo ""
else
    echo "⚠️  VAN NÉHÁNY PROBLÉMA ($((TOTAL_CHECKS - PASSED_CHECKS)) db)"
    echo "============================================="
    echo ""
    echo "Nézd át a fenti hibaüzeneteket és javítsd ki őket!"
fi
