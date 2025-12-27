#!/bin/bash

# Script: apply-goals-starting-value.sh
# Cél: starting_value mező hozzáadása a user_goals táblához

echo "🎯 Starting value mező hozzáadása a célokhoz..."

# Supabase projekt URL és kulcs ellenőrzése
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "⚠️  FIGYELEM: SUPABASE_URL és SUPABASE_SERVICE_KEY környezeti változók nem állnak rendelkezésre"
    echo "A migráció Supabase Dashboard-on keresztül futtatható:"
    echo "1. Nyisd meg: https://app.supabase.com/project/_/sql"
    echo "2. Másold be az add-starting-value-to-goals.sql tartalmát"
    echo "3. Futtasd a query-t"
    exit 1
fi

# SQL fájl ellenőrzése
if [ ! -f "add-starting-value-to-goals.sql" ]; then
    echo "❌ Hiba: add-starting-value-to-goals.sql nem található"
    exit 1
fi

echo "📂 SQL fájl megtalálva"
echo "🔄 Migráció futtatása..."

# SQL futtatása
psql "$SUPABASE_URL" -f add-starting-value-to-goals.sql

if [ $? -eq 0 ]; then
    echo "✅ Migráció sikeresen lefutott!"
    echo ""
    echo "📊 Ellenőrzés: user_goals tábla struktúra"
    psql "$SUPABASE_URL" -c "
        SELECT 
            column_name, 
            data_type, 
            is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'user_goals' 
          AND column_name IN ('starting_value', 'current_value', 'target_value')
        ORDER BY ordinal_position;
    "
    
    echo ""
    echo "🎉 starting_value mező sikeresen hozzáadva a célokhoz!"
else
    echo "❌ Hiba történt a migráció során"
    exit 1
fi
