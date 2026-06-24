# 🔧 Gyakorlattár kategóriák javítása - GYORS ÚTMUTATÓ

## 🚀 GyorsStart

```bash
./check-and-fix-categories.sh
```

Ez a script végigvezet a teljes folyamaton.

## 📋 Fájlok és használatuk

### 1️⃣ Ellenőrzés
**Fájl:** `check_current_exercises.sql`
- **Mit csinál:** Megmutatja az adatbázis jelenlegi állapotát
- **Használat:** Másold be a Supabase SQL Editor-ba és futtasd le

### 2️⃣ Enum-ok hozzáadása
**Fájl:** `add_fms_smr_categories.sql`
- **Mit csinál:** Hozzáadja az 'fms' és 'smr' kategóriákat
- **Használat:** Csak EGYSZER futtasd le (ha még nem léteznek ezek)

### 3️⃣ Kategóriák javítása
**Fájl:** `fix_all_exercise_categories.sql`
- **Mit csinál:** Áthelyezi az összes gyakorlatot a helyes kategóriába
- **Használat:** Futtasd le az enum-ok hozzáadása után

## ⚠️ FONTOS SORREND

```
1. check_current_exercises.sql    (ellenőrzés)
   ↓
2. add_fms_smr_categories.sql    (csak ha szükséges)
   ↓
3. fix_all_exercise_categories.sql (javítás)
```

## 🎯 Mit javít?

### Előtte:
- ❌ FMS gyakorlatok a "mobility_flexibility" kategóriában
- ❌ SMR gyakorlatok a "recovery" kategóriában
- ❌ Szűrők nem működnek

### Utána:
- ✅ FMS gyakorlatok az "FMS korrekció" kategóriában
- ✅ SMR gyakorlatok az "SMR (Henger)" kategóriában
- ✅ Kettlebell gyakorlatok a "Kettlebell" kategóriában
- ✅ Szűrők tökéletesen működnek

## 🧪 Tesztelés

1. Nyisd meg: http://localhost:5173/exercises
2. Válaszd ki: "FMS korrekció" → Csak FMS gyakorlatok
3. Válaszd ki: "SMR (Henger)" → Csak SMR gyakorlatok
4. Válaszd ki: "Kettlebell" → Csak Kettlebell gyakorlatok

## 📞 Hibaelhárítás

### "unsafe use of new value" hiba
- **Ok:** Az enum értékeket két külön lépésben kell hozzáadni
- **Megoldás:** Először `add_fms_smr_categories.sql`, majd `fix_all_exercise_categories.sql`

### Üres kategóriák
- **Ok:** Az enum-ok még nincsenek hozzáadva
- **Megoldás:** Futtasd le az `add_fms_smr_categories.sql` scriptet

### Gyakorlatok rossz kategóriában
- **Megoldás:** Futtasd le újra a `fix_all_exercise_categories.sql` scriptet

## ✨ Eredmény

A frontend automatikusan felismeri az új kategóriákat:
- **Magyar nyelvű nevek**
- **Pontos szűrők**
- **Tiszta kategorizálás**
