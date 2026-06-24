# UGKettlebell Pro — Backlog

> Ez a fájl a projekt **jelenlegi állapotát** rögzíti, és ide gyűjtjük a **jövőbeni fejlesztéseket** is.
> Frissítsd, amikor egy feladatot elkezdesz, befejezel, vagy új ötlet merül fel.
>
> Utolsó frissítés: **2026-06-24** (takarítás végrehajtva)

---

## Jelölések

- `[ ]` nyitott · `[~]` folyamatban · `[x]` kész
- Prioritás: 🔴 magas · 🟡 közepes · 🟢 alacsony

---

## 1. Jelenlegi állapot (snapshot)

### Működő funkciók (route-ok alapján)
- Auth: regisztráció, login, meghívó-elfogadás (`/invite/:token`), PKCE
- Dashboard, Profil
- Edzésnapló (`/log`), Edzésnaptár (`/calendar`), Saját edzések (`/my-workouts`)
- Haladáskövetés (`/progress`), Célok (`/goals`)
- Időpontfoglalás (`/appointments`) + admin kezelés (`/appointments/manage`)
- Edzéstervező (`/workout-planner`) + 3 generátor al-oldal:
  - Sablon (`/template-generator`)
  - Periodizált (`/periodized-generator`)
  - Pwron (`/pwron-generator`)
- Gyakorlatkönyvtár (`/exercises`, `/exercises/:id`)
- FMS felmérés (`/assessment`)
- Felhasználókezelés (`/users`, admin)
- Polar integráció (`/polar/callback`) — legutóbbi commit
- Kettlebell komplex builder + Cardió (legutóbbi commitok)
- Edzésmegosztás (workout sharing)

### Tech állapot
- Build: **zöld** (`npm run build` sikeres, 2026-06-24-i takarítás után ellenőrizve)
- TODO/FIXME a kódban: 0 db (a `workouts.ts:473` gyakorlatnév-feloldás megoldva)
- 22 Supabase migráció a `supabase/migrations/`-ban
- A korábbi 100 SQL/shell fix-szkript a `scripts/legacy/`-ba archiválva; a gyökérben már csak `build.sh`, `deploy.sh` maradt
- A 29 db egyszeri „fix/summary/status" Markdown-jegyzet a `docs/legacy/`-ba archiválva; a gyökérben már csak a 13 érdemi md maradt (core + setup/deployment guide-ok)

---

## 2. Takarítás — EL KELL VÉGEZNI 🔴

> **Döntés (2026-06-24):** A `workoutGenerator.fixed.ts` a fő/aktív generátor. A `workoutGenerator.ts` NEM kell.

- [x] **`src/lib/workoutGenerator.ts` törlése.** Megerősítve: sehol nem volt rá import-hivatkozás (a kód mindenhol a `.fixed`-et használja). Törölve, CLAUDE.md pontosítva. ✅ 2026-06-24
- [x] **Gyökérkönyvtár takarítása (100 SQL/shell fix-szkript).** A `scripts/legacy/` mappába archiválva (`git mv`, így a history megmarad). A `package.json` `fix:*` / `reset:*` / `check:*` szkriptjei az új `scripts/legacy/` útvonalakra állítva; a `build.sh` és `deploy.sh` a gyökérben maradt. ✅ 2026-06-24
- [x] **Stale fájlok törlése** (verziókövetésbe nem valók): mind a 6 fájl törölve. ✅ 2026-06-24
  - `README.md.new`
  - `src/pages/ProgressTracking.tsx.new`, `ProgressTracking.tsx.backup`
  - `src/pages/Profile.tsx.bak`
  - `src/pages/WorkoutPlanner.fixed.tsx.bak`
  - `src/pages/ExerciseLibrary.tmp.tsx.bak`
- [x] **Duplikált service-ek (használaton kívüliek) törlése**: `emailService-new.ts` (0 import) és `appointmentService.ts` (0 import) törölve. ✅ 2026-06-24
- [x] **`users.ts` vs `userService.ts` összevonása**: az egyetlen külsőleg használt export (`isCurrentUserAdmin`, RPC `is_admin`-alapú) átemelve a `users.ts`-be; a `fmsService.ts` importja átállítva; a `userService.ts` (és a benne lévő, sehol nem importált Profile-segédek) törölve. Build + typecheck zöld. ✅ 2026-06-24
- [x] **`src/lib/workouts.ts:473` TODO**: a `getWorkoutProgressTrend` most batch-lekérdezéssel (`id -> name` map, egyetlen `exercises` query) oldja fel a valódi gyakorlatneveket; ismeretlen id-nál a régi fallback (id) marad. ✅ 2026-06-24
- [ ] **Nagy fájlok refaktorálása** (CLAUDE.md is jelöli):
  - `WorkoutPlanner.tsx` (2303 sor) — komponensekre bontani 🔴
  - `workoutGenerator.fixed.ts` (1620 sor) 🟡
  - `exerciseService.ts` (869 sor), `ProgressTracking.tsx` (748 sor) 🟢
- [x] **Supabase teszt-/segéd-fájlok konszolidálása**: 3 halott fájl törölve (`supabaseConnection.ts` — `SupabaseConnectionManager`, 0 import; `utils/testConnection.ts` — 0 import; `lib/testSupabaseConnection.ts` — csak a halott `testConnection.ts` importálta). Megmaradt a 2 ténylegesen használt: `supabaseTest.ts` (UserManagement) és `supabaseUtils.ts` (megosztott `handleSupabaseError` / `testSupabaseConnection`). Build zöld. ✅ 2026-06-24

---

## 3. Minőség / stabilitás 🟡

- [ ] Build + lint zöld állapot ellenőrzése és CI-ba kötése
- [ ] Tesztlefedettség: jelenleg csak `src/lib/__tests__` van — kritikus generátor-logikára unit tesztek
- [ ] RLS policy-k auditja minden táblán (CLAUDE.md konvenció szerint kötelező)
- [ ] Hibakezelés egységesítése (toast/üzenetek magyarul, konzisztensen)
- [ ] `.env.example` naprakészsége (Polar + EmailJS változók)

---

## 4. Jövőbeni fejlesztések (feature backlog)

> Ide írjuk az új ötleteket. Minden tételhez: rövid leírás + prioritás.

- [ ] _(ide jönnek az új funkció-ötletek)_
          k
---

## 5. Done (lezárt tételek)

- [x] **Supabase teszt-/segéd-fájlok konszolidálása** (2026-06-24): 3 halott fájl törölve, 2 használt maradt; build zöld
- [x] **`userService.ts` → `users.ts` merge** (2026-06-24): egyetlen használt export átemelve, import átállítva, `userService.ts` törölve; build zöld
- [x] **`workouts.ts:473` gyakorlatnév-feloldás** (2026-06-24): batch `id -> name` lekérdezés a `getWorkoutProgressTrend`-ben; nincs több TODO/FIXME a kódban
- [x] **Markdown-takarítás** (2026-06-24): 29 db egyszeri „fix/summary/status/complete" jegyzet a `docs/legacy/`-ba archiválva (`git mv`, history megőrizve); a gyökérben a 42 md-ből 13 érdemi maradt (CLAUDE/BACKLOG/README + database.md + setup/deployment guide-ok). `database.md` (README hivatkozás) és `DEPLOYMENT_GUIDE.md` (`deploy.sh` hivatkozás) szándékosan maradt
- [x] **Kódbázis takarítás** (2026-06-24): `workoutGenerator.ts` + 6 stale fájl + 2 használaton kívüli dup-service törölve; 100 SQL/shell fix-szkript a `scripts/legacy/`-ba archiválva; CLAUDE.md/BACKLOG.md frissítve; build zöld
- [x] Polar integráció bevezetése (commit `05ce6a4`)
- [x] Cardió és kettlebell komplex hozzáadása (commit `55a7851`)
- [x] Edzésnaptár funkció (commit `d371990`)
- [x] Edzésmegosztó rendszer (commit `a76c42c`)
