# Workout Planner Filter Guide

## Kettlebell Pro Workout Planner Filter Functionality

A Workout Planner oldalon lehetőség van a gyakorlatok szűrésére kategória és mozgásminta alapján. Ez a dokumentum bemutatja, hogyan működik ez a funkció.

### Funkció áttekintése

Amikor új gyakorlatot adsz a workout tervezőhöz, minden gyakorlatnál külön szűrheted a választható gyakorlatokat:

1. Először **kategória** alapján (pl. Kettlebell, Strength Training, stb.)
2. Majd **mozgásminta** alapján, amely függ a kiválasztott kategóriától

### Működési elv

- Minden egyes gyakorlat hozzáadásánál külön választhatsz kategóriát és mozgásmintát
- A kategória kiválasztásakor a hozzá tartozó mozgásminták automatikusan szűrve jelennek meg a movement pattern select menüben
- A mozgásminta select csak akkor aktív, ha előzőleg már kiválasztottál egy kategóriát
- Mindkét szűrő (kategória és mozgásminta) együttesen határozzák meg a megjelenő gyakorlatokat
- A szűrési beállítások a szekción belül megmaradnak új gyakorlat hozzáadásakor

### Technikai részletek

- A kategória és mozgásminta értékek az adatbázisban enum típusként vannak tárolva (exercise_category és movement_pattern)
- A movement_pattern szűrés az adott kategóriához tartozó gyakorlatok egyedi movement_pattern értékei alapján történik
- A szűrő automatikusan figyelembe veszi a case-insensitive egyezést a kategóriáknál
- A kiválasztott kategória változásakor a mozgásminta szűrő automatikusan visszaáll alaphelyzetbe

### Adatbázis struktúra

Az exercises tábla releváns mezői:
- **category**: Az exercise_category enum típusú mező (pl. 'kettlebell', 'strength_training', stb.)
- **movement_pattern**: A movement_pattern enum típusú mező (pl. 'hip_dominant_bilateral', 'gait_stability', stb.)

### Hibaelhárítás

Ha a szűrők nem működnek megfelelően:

1. Ellenőrizd, hogy a kiválasztott kategóriához tartoznak-e gyakorlatok az adatbázisban
2. Ellenőrizd, hogy a gyakorlatok movement_pattern értékei megfelelők-e
3. A böngésző konzolján keresztül ellenőrizd, hogy nincs-e egyéb JavaScript hiba

### Példa használat

1. Válassz egy kategóriát (pl. "Kettlebell")
2. A mozgásminta select automatikusan aktiválódik és csak a kettlebell kategóriához tartozó mozgásmintákat mutatja
3. Válassz egy mozgásmintát (pl. "Csípő domináns - bilaterális")
4. Az elérhető gyakorlatok listája automatikusan szűkül a kiválasztott kritériumok alapján
