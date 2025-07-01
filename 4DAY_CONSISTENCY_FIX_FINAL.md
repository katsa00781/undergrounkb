# 4 Napos Edzésterv Placeholder Konzisztencia - Javítási Összefoglaló

## ✅ Végzett Javítások

### Day1Plan (Robbanékonyság fókusz)
- **FMS korrekció**: Egységesített az fms-correction-1/2 vagy placeholder-fms logikára
- **Strukturált gyakorlatok**: 
  - Térddomináns: `placeholder-terddom-bi/uni` (movement_pattern alapján)
  - Nyomás: `placeholder-horiz/vert-nyomas-bi/uni` (movement_pattern alapján)
  - Húzás: `placeholder-horiz/vert-huzas-bi` (movement_pattern alapján)  
  - Csípő: `placeholder-csipo-hajlitott/nyujtott` (movement_pattern alapján)
  - Rotációs/Rehab: `placeholder-rotacios/rehab`
  - Gait: `placeholder-gait`

### Day2Plan (Erő fókusz)
- Ugyanaz a logika mint Day1Plan
- Előnyben részesíti: Uni térddomináns, Vertikális nyomás, Horizontális húzás, Nyújtott csípő

### Day3Plan, Day4Plan
- A korábban javított logika maradt

## 🔍 Jelenlegi Állapot
- **Bemelegítés, pilometrikus, core, nyújtás**: továbbra is `exercise?.id || 'placeholder-...'` logika (ez így helyes)
- **Strukturált gyakorlatok**: clean placeholder logika, name a getRandomExercise() eredményéből
- **FMS korrekciók**: egységesített fms-correction-1/2 vagy placeholder-fms logika

## 🎯 Konzisztencia a 2/3 napos tervekkel
A 4 napos terv most már **konzisztens** a 2 és 3 napos tervekkel:
- ✅ ExerciseId: specifikus placeholder
- ✅ Name: getRandomExercise().name || default name  
- ✅ FMS: fms-correction-X vagy placeholder-fms
- ✅ Minden mozgásminta placeholder beállítja a megfelelő szűrőt a WorkoutPlanner.tsx-ben

## 📋 Várható Eredmény
- ✅ Select menük üresek (nincs előre kiválasztott gyakorlat)
- ✅ Label mutatja a generált gyakorlat nevét
- ✅ Szűrők automatikusan beállnak a placeholder alapján
- ✅ Felhasználó szűrt listából választhat

## 🧪 Tesztelési Eredmények
- ✅ Build sikeres (TypeScript hiba nélkül)
- ✅ Placeholder mapping 15/17 helyes (core és stretch szándékosan nincs szűrőhöz kötve)
- ✅ Minden movement pattern placeholder megfelelően van leképezve

Az egységesítés **sikeres**, a 4 napos terv most már ugyanúgy működik, mint a 2 és 3 napos tervek!
