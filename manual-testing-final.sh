#!/bin/bash

# MANUAL TESTING COMPREHENSIVE GUIDE
# ==================================
# Ez a script végigvezet a teljes manuális tesztelésen

echo "🧪 COMPREHENSIVE MANUAL TESTING GUIDE"
echo "====================================="
echo ""

echo "📋 ELŐKÉSZÜLETEK:"
echo "----------------"
echo "1. ✅ Supabase SQL Editor: Futtasd le a 'supabase-sql-editor-fix.sql' tartalmat"
echo "2. ✅ React App: Indítsd el 'npm run dev' paranccsal"
echo "3. ✅ Browser: Nyisd meg a fejlesztői konzolt (F12)"
echo ""

echo "🎯 TESZT 1: PROFILE FORM - BASIC FUNCTIONALITY"
echo "=============================================="
echo ""
echo "LÉPÉSEK:"
echo "--------"
echo "1. Navigálj a Profile oldalra"
echo "2. Töltsd ki a Display Name mezőt (pl. 'John Doe')"
echo "3. Válassz magasságot és súlyt"
echo "4. Kattints a Save Profile gombra"
echo ""
echo "VÁRT EREDMÉNY:"
echo "✅ 'Profile updated successfully' üzenet megjelenik"
echo "✅ Nincs 403 Forbidden hiba"
echo "✅ Konzolban nincs hiba"
echo ""

echo "🎯 TESZT 2: FITNESS GOALS CHECKBOXES"
echo "===================================="
echo ""
echo "LÉPÉSEK:"
echo "--------"
echo "1. Maradj a Profile oldalon"
echo "2. Kattints különböző Fitness Goals checkbox-okra:"
echo "   → Weight Loss"
echo "   → Muscle Gain" 
echo "   → Strength"
echo "   → Endurance"
echo "   → Flexibility"
echo "3. Ments el a profilt"
echo ""
echo "VÁRT EREDMÉNY:"
echo "✅ Checkbox-ok reagálnak a kattintásra (bejelölődnek/kijelölődnek)"
echo "✅ Sikeres mentés után is megmaradnak a kiválasztott célok"
echo "✅ Konzolban látható: 'Updating fitness goals:' log"
echo ""

echo "🎯 TESZT 3: PROGRESS TRACKING - REQUIRED FIELDS ONLY"
echo "===================================================="
echo ""
echo "LÉPÉSEK:"
echo "--------"
echo "1. Navigálj a Progress Tracking oldalra"
echo "2. Kattints az 'Add New Measurement' gombra"
echo "3. Töltsd ki CSAK ezeket a kötelező mezőket:"
echo "   → Date: válassz egy dátumot"
echo "   → Weight: írj be egy súlyt (pl. 75)"
echo "4. Hagyd üresen az összes opcionális mezőt:"
echo "   → Body Fat %"
echo "   → Muscle Mass %"
echo "   → BMI"
echo "   → Deep Sleep (minutes)"
echo "5. Kattints a 'Save Measurement' gombra"
echo ""
echo "VÁRT EREDMÉNY:"
echo "✅ Sikeres mentés üzenet"
echo "✅ NINCS NaN validációs hiba"
echo "✅ NINCS 'required' hiba az opcionális mezőknél"
echo ""

echo "🎯 TESZT 4: PROGRESS TRACKING - OPTIONAL FIELDS WITH VALUES"
echo "=========================================================="
echo ""
echo "LÉPÉSEK:"
echo "--------"
echo "1. Adj hozzá újabb mérést"
echo "2. Töltsd ki a kötelező mezőket"
echo "3. Töltsd ki az opcionális mezőket ÉRVÉNYES értékekkel:"
echo "   → Body Fat %: 15"
echo "   → Muscle Mass %: 40"
echo "   → BMI: 23"
echo "   → Deep Sleep: 450"
echo "4. Ments el"
echo ""
echo "VÁRT EREDMÉNY:"
echo "✅ Sikeres mentés"
echo "✅ Minden mező értéke megjelenik a form-ban és a táblázatban"
echo ""

echo "🎯 TESZT 5: PROGRESS TRACKING - VALIDATION ERRORS"
echo "================================================="
echo ""
echo "LÉPÉSEK:"
echo "--------"
echo "1. Adj hozzá újabb mérést"
echo "2. Töltsd ki a kötelező mezőket"
echo "3. Adj meg HIBÁS értékeket az opcionális mezőkhöz:"
echo "   → Body Fat %: 70 (max 60%)"
echo "   → Muscle Mass %: 90 (max 80%)"
echo "   → BMI: 5 (min 10)"
echo "   → Deep Sleep: 700 (max 600)"
echo "4. Próbálj menteni"
echo ""
echo "VÁRT EREDMÉNY:"
echo "❌ Validációs hibák megjelennek az érintett mezők alatt"
echo "❌ Mentés nem történik meg"
echo "5. Javítsd ki a hibás értékeket érvényesekre"
echo "✅ Hibák eltűnnek"
echo "✅ Sikeres mentés"
echo ""

echo "🎯 TESZT 6: PROGRESS TRACKING - CONDITIONAL FIELDS"
echo "================================================="
echo ""
echo "LÉPÉSEK:"
echo "--------"
echo "1. Adj hozzá újabb mérést"
echo "2. Töltsd ki az alapmezőket"
echo "3. Add meg a Deep Sleep értéket (pl. 400)"
echo "4. Figyeld meg, hogy megjelenik-e a 'Rest Rating' mező"
echo "5. Válassz egy értéket (1-5 között)"
echo "6. Ments el"
echo ""
echo "VÁRT EREDMÉNY:"
echo "✅ Rest Rating mező megjelenik, amikor Deep Sleep ki van töltve"
echo "✅ Rest Rating mező eltűnik, amikor Deep Sleep törölve"
echo "✅ Sikeres mentés rest rating értékkel"
echo ""

echo "🎯 TESZT 7: EDGE CASES - EMPTY TO FILLED TO EMPTY"
echo "================================================="
echo ""
echo "LÉPÉSEK:"
echo "--------"
echo "1. Adj hozzá mérést csak kötelező mezőkkel"
echo "2. Ments el → ✅ Sikeres"
echo "3. Szerkeszd ugyanazt a mérést"
echo "4. Töltsd fel az opcionális mezőket"
echo "5. Ments el → ✅ Sikeres"
echo "6. Szerkeszd újra"
echo "7. Töröld az opcionális mezők tartalmát (hagyd üreseket)"
echo "8. Ments el"
echo ""
echo "VÁRT EREDMÉNY:"
echo "✅ Minden lépésben sikeres mentés"
echo "✅ Nincs NaN hiba üres mezők esetén"
echo "✅ Nincs 'required' hiba törlésnél"
echo ""

echo "📊 TESZT EREDMÉNYEK DOKUMENTÁLÁSA:"
echo "=================================="
echo ""
echo "Minden teszt után írj jegyzetet:"
echo ""
echo "□ TESZT 1 - Profile Basic: SIKERES / HIBA: _________________"
echo "□ TESZT 2 - Fitness Goals: SIKERES / HIBA: _________________"
echo "□ TESZT 3 - Progress Required: SIKERES / HIBA: _____________"
echo "□ TESZT 4 - Progress Optional: SIKERES / HIBA: _____________"
echo "□ TESZT 5 - Validation: SIKERES / HIBA: ___________________"
echo "□ TESZT 6 - Conditional: SIKERES / HIBA: __________________"
echo "□ TESZT 7 - Edge Cases: SIKERES / HIBA: ___________________"
echo ""

echo "🚨 HA HIBÁT TALÁLSZ:"
echo "==================="
echo ""
echo "1. Browser Console (F12) → másold ki a hibát"
echo "2. Network Tab → nézd meg a failed request-eket"
echo "3. Supabase Dashboard → ellenőrizd a logs-okat"
echo "4. Dokumentáld a pontos lépéseket, amik hibához vezettek"
echo ""

echo "✅ SIKERES TESZTELÉS ESETÉN:"
echo "============================"
echo ""
echo "Ha minden teszt sikeres, akkor:"
echo "→ A Profile oldal mentési problémája megoldva"
echo "→ A Progress Tracking NaN validációs hibák megoldva"
echo "→ Minden form megfelelően működik"
echo "→ Ready for production!"
echo ""

echo "🎉 TESZTELÉS KÉSZ!"
echo "=================="
echo ""
echo "Jelentsd vissza az eredményeket, hogy tudjuk, minden rendben van-e!"
