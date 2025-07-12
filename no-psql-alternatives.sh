#!/bin/bash

# PSQL HIÁNYZIK - ALTERNATÍV MEGOLDÁSOK
echo "🚫 PSQL kliens nem található"
echo "================================"

echo ""
echo "📋 OPCIÓK:"
echo ""

echo "1️⃣  SUPABASE DASHBOARD (AJÁNLOTT)"
echo "   → Nyisd meg: https://supabase.com/dashboard"
echo "   → SQL Editor → Másold be: supabase-sql-editor-fix.sql"
echo "   → Kattints 'Run' gomb"
echo ""

echo "2️⃣  POSTGRESQL KLIENS TELEPÍTÉSE"
echo "   macOS-en (Homebrew):"
echo "   brew install postgresql"
echo ""
echo "   macOS-en (MacPorts):"
echo "   sudo port install postgresql15"
echo ""
echo "   Vagy letöltheted: https://www.postgresql.org/download/macosx/"
echo ""

echo "3️⃣  ONLINE SQL TOOL"
echo "   → Supabase Table Editor"
echo "   → phpPgAdmin (ha van access)"
echo "   → Bármely PostgreSQL web kliens"
echo ""

echo "4️⃣  DOCKER HASZNÁLATA"
echo "   docker run --rm -it postgres:15 psql \"\$DATABASE_URL\""
echo ""

echo "📁 KÉSZÜLT FÁJLOK:"
echo "✅ supabase-sql-editor-fix.sql     (Copy-paste ready)"
echo "✅ SUPABASE_SQL_TUTORIAL.md        (Step-by-step guide)"
echo "✅ fix-full-name-only.sql          (Minimal fix)"
echo ""

echo "🎯 KÖVETKEZŐ LÉPÉS:"
echo "1. Nyisd meg a Supabase Dashboard-ot"
echo "2. Menj az SQL Editor-hez"
echo "3. Másold be a 'supabase-sql-editor-fix.sql' tartalmát"
echo "4. Futtasd le"
echo "5. Teszteld a Profile oldalt"
echo ""

echo "✅ Frontend javítások már készen vannak!"
echo "   → fitness_goals checkbox javítva"
echo "   → full_name mentési logika javítva"
echo ""

echo "📞 Ha segítség kell:"
echo "   → Nézd meg: SUPABASE_SQL_TUTORIAL.md"
echo "   → Vagy jelentsd vissza a hibákat"

echo ""
echo "🔗 HASZNOS LINKEK:"
echo "   Supabase Docs: https://supabase.com/docs/guides/database"
echo "   PostgreSQL Download: https://www.postgresql.org/download/"
