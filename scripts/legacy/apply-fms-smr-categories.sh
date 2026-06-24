#!/bin/bash

# FMS és SMR kategóriák alkalmazása az adatbázisban
# Ez a script alkalmazni fogja az új kategóriákat a Supabase adatbázisban

echo "🔧 FMS és SMR kategóriák alkalmazása..."
echo ""
echo "⚠️  FONTOS: Ez a script frissíteni fogja az adatbázis kategóriákat."
echo "Győződj meg róla, hogy:"
echo "1. Van hozzáférésed a Supabase dashboard-hoz"
echo "2. Az adatbázis elérhető"
echo ""
echo "📋 A következő lépések lesznek végrehajtva:"
echo "1. FMS és SMR enum értékek hozzáadása"
echo "2. FMS gyakorlatok kategóriájának frissítése 'mobility_flexibility'-ről 'fms'-re"
echo "3. SMR gyakorlatok kategóriájának frissítése 'recovery'-ről 'smr'-re"
echo ""

read -p "Folytatod az alkalmazást? (i/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ii]$ ]]
then
    echo "❌ Megszakítva."
    exit 1
fi

echo ""
echo "📝 Nyisd meg a Supabase SQL Editor-t:"
echo "   https://supabase.com/dashboard/project/YOUR_PROJECT/sql"
echo ""
echo "⚠️  FONTOS: Két lépésben kell végrehajtani!"
echo ""
echo "📋 LÉPÉS 1: Enum értékek hozzáadása"
echo "   Másold be és futtasd le: add_fms_smr_categories.sql"
echo "   Fájl helye: $(pwd)/add_fms_smr_categories.sql"
echo ""
echo "✅ Ha az első script lefutott, nyomd meg az Enter-t..."
read

echo ""
echo "📋 LÉPÉS 2: Kategóriák frissítése"
echo "   Másold be és futtasd le: update_exercise_categories.sql"
echo "   Fájl helye: $(pwd)/update_exercise_categories.sql"
echo ""
echo "✅ Ha a második script is lefutott, nyomd meg az Enter-t..."
read

echo ""
echo "✅ Kategóriák sikeresen alkalmazva!"
echo ""
echo "🎯 Következő lépések:"
echo "1. Ellenőrizd a gyakorlattárban a szűrőket"
echo "2. FMS gyakorlatok: FMS korrekció kategória alatt"
echo "3. SMR gyakorlatok: SMR (Henger) kategória alatt"
echo "4. Kettlebell gyakorlatok: Kettlebell kategória alatt"
echo ""
echo "✨ Kész!"
