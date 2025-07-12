#!/bin/bash

# Profiles tábla létrehozása/frissítése script
# Ez a script létrehozza a profiles táblát a Supabase adatbázisban

echo "🚀 Profiles tábla létrehozása/frissítése..."
echo "ProfileFormData mezők alapján"
echo ""

# Ellenőrizzük, hogy létezik-e a create_profiles_table.sql fájl
if [[ ! -f "create_profiles_table.sql" ]]; then
    echo "❌ HIBA: create_profiles_table.sql fájl nem található!"
    echo "Győződj meg róla, hogy a script ugyanabban a könyvtárban van, mint a .sql fájl."
    exit 1
fi

echo "📋 A következő mezők lesznek létrehozva a profiles táblában:"
echo "   • display_name (TEXT) - ProfileFormData.displayName"
echo "   • full_name (TEXT) - szinkronizálva display_name-mel"
echo "   • height (INTEGER) - ProfileFormData.height"
echo "   • weight (DECIMAL) - ProfileFormData.weight"
echo "   • birthdate (DATE) - ProfileFormData.birthdate"
echo "   • gender (TEXT) - ProfileFormData.gender"
echo "   • fitness_goals (JSONB) - ProfileFormData.fitnessGoals"
echo "   • experience_level (TEXT) - ProfileFormData.experienceLevel"
echo ""

echo "🔐 RLS (Row Level Security) policy-k is létrejönnek:"
echo "   • Users can view own profile"
echo "   • Users can update own profile"
echo "   • Users can insert own profile"
echo ""

echo "⚙️  Trigger is létrejön a name mezők szinkronizálásához."
echo ""

echo "📝 KÖVETKEZŐ LÉPÉSEK:"
echo "1. Nyisd meg a Supabase Dashboard-ot"
echo "2. Menj a SQL Editor részbe"
echo "3. Másold be a create_profiles_table.sql fájl tartalmát"
echo "4. Futtasd le a scriptet"
echo ""

echo "💡 ALTERNATÍV MÓDSZER:"
echo "Ha van Supabase CLI telepítve, használhatod:"
echo "   supabase db reset"
echo "   vagy"
echo "   psql [CONNECTION_STRING] < create_profiles_table.sql"
echo ""

echo "🔍 A script tartalmát megtekintheted:"
echo "   cat create_profiles_table.sql"
echo ""

echo "✅ A script készen áll a futtatásra!"
echo "📁 Fájl helye: $(pwd)/create_profiles_table.sql"

# Fájl méret és utolsó módosítás
echo ""
echo "📊 Fájl információk:"
ls -lah create_profiles_table.sql | awk '{print "   Méret: " $5 ", Módosítva: " $6 " " $7 " " $8}'

echo ""
echo "🎯 Miután lefuttattad a scriptet a Supabase-ben:"
echo "   • A Profile oldal képes lesz menteni az adatokat"
echo "   • Minden ProfileFormData mező támogatott lesz"
echo "   • Az adatok biztonságosan tárolódnak RLS policy-kkel"
