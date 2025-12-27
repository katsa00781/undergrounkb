# Gyakorlattár szűrők javítása - Teljes útmutató

## Probléma

A gyakorlattárban a szűrők nem működtek helyesen:
- FMS gyakorlatok nem jelentek meg az FMS szűrőnél
- SMR gyakorlatok nem jelentek meg az SMR szűrőnél
- Kettlebell gyakorlatok keveredtek más kategóriákkal

## Megoldás - 3 lépéses folyamat

### 🔍 LÉPÉS 1: Jelenlegi állapot ellenőrzése

Futtasd le a Supabase SQL Editor-ban:
```bash
check_current_exercises.sql
```

Ez megmutatja:
- Milyen kategóriák vannak használatban
- Hány gyakorlat van minden kategóriában
- Milyen mozgásminták vannak használva
- Mely gyakorlatok vannak rossz kategóriában

### 📝 LÉPÉS 2: Enum értékek hozzáadása

Ha még nem léteznek az 'fms' és 'smr' kategóriák, futtasd le:
```bash
add_fms_smr_categories.sql
```

Ez hozzáadja:
- `fms` enum értéket az exercise_category típushoz
- `smr` enum értéket az exercise_category típushoz

### ✅ LÉPÉS 3: Gyakorlatok kategóriáinak javítása

Futtasd le:
```bash
fix_all_exercise_categories.sql
```

Ez automatikusan:
- ✅ Áthelyezi az FMS gyakorlatokat az 'fms' kategóriába (mozgásminta és név alapján)
- ✅ Áthelyezi az SMR gyakorlatokat az 'smr' kategóriába (név alapján)
- ✅ Beállítja a kettlebell gyakorlatokat
- ✅ Ellenőrzi az eredményeket

## Gyors útmutató

### Automatikus script használata:

```bash
./check-and-fix-categories.sh
```

### Vagy manuálisan:

1. **Ellenőrzés:**
   - Nyisd meg: https://supabase.com/dashboard
   - SQL Editor → Új query
   - Másold be: `check_current_exercises.sql`
   - Futtasd le és nézd meg az eredményeket

2. **Enum-ok hozzáadása (ha szükséges):**
   - SQL Editor → Új query
   - Másold be: `add_fms_smr_categories.sql`
   - Futtasd le

3. **Kategóriák javítása:**
   - SQL Editor → Új query
   - Másold be: `fix_all_exercise_categories.sql`
   - Futtasd le

4. **Ellenőrzés:**
   - A script végén látni fogod:
     - Hány gyakorlat van minden kategóriában
     - FMS gyakorlatok listáját
     - SMR gyakorlatok listáját
     - Kettlebell gyakorlatok mintáit

## Kategorizálási szabályok

### FMS kategória
A következő gyakorlatok kerülnek az FMS kategóriába:
- Mozgásminta alapján:
  - `aslr_correction_first`
  - `aslr_correction_second`
  - `sm_correction_first`
  - `sm_correction_second`
  - `stability_correction`
- Név alapján:
  - 'FMS' tartalmú nevek
  - Specifikus FMS korrekciós gyakorlatok (pl. Bird dog, Dead bug, Plank hold, stb.)

### SMR kategória
A következő gyakorlatok kerülnek az SMR kategóriába:
- Név alapján:
  - 'SMR' kezdetű nevek
  - 'henger' tartalmú nevek
  - 'foam roll' tartalmú nevek

### Kettlebell kategória
A következő gyakorlatok kerülnek a Kettlebell kategóriába:
- 'kettlebell' tartalmú nevek
- 'KB' tartalmú nevek
- 'girya' tartalmú nevek

## Használat

A gyakorlattárban most már külön szűrőként jelennek meg:
- ✅ **FMS korrekció** - Az összes FMS korrekciós gyakorlat
- ✅ **SMR (Henger)** - Az összes SMR hengeres gyakorlat
- ✅ **Kettlebell** - Az összes kettlebell gyakorlat
- ✅ **Erősítő edzés** - Strength training
- ✅ **Cardio** - Cardio gyakorlatok
- ✅ **Mobilitás és nyújtás** - Mobility & flexibility
- ✅ **HIIT** - HIIT edzések
- ✅ **Regeneráció** - Recovery gyakorlatok

## Mozgásminták kategóriánként

### Kettlebell
- Gait mozgások
- Csípő/térd domináns gyakorlatok (bi/uni)
- Nyomó és húzó mozgások (horizontális/vertikális)
- Core stabilitás gyakorlatok

### FMS korrekció
- ASLR korrekciók
- SM korrekciók
- Stabilitás korrekciók
- Felsőtest mobilitás
- Általános mobilizálás

### SMR (Henger)
- Mobilizálás (hengerezés)

## Tesztelés

1. Nyisd meg a gyakorlattárat
2. Válassz "FMS korrekció" kategóriát - FMS gyakorlatok jelennek meg
3. Válassz "SMR (Henger)" kategóriát - SMR gyakorlatok jelennek meg
4. Válassz "Kettlebell" kategóriát - Kettlebell gyakorlatok jelennek meg
5. Ellenőrizd a mozgásminta szűrőket is minden kategóriában

## Következő lépések (opcionális)

Ha további finomítás szükséges:
- További alkategóriák hozzáadása
- Nehézségi szintek pontosítása
- Keresési funkció bővítése
- Többnyelvű támogatás fejlesztése
