# UGKettlebell Pro — Backlog

> Ez a fájl a projekt **jelenlegi állapotát** rögzíti, és ide gyűjtjük a **jövőbeni fejlesztéseket** is.
> Frissítsd, amikor egy feladatot elkezdesz, befejezel, vagy új ötlet merül fel.
>
> Utolsó frissítés: **2026-06-25** (minőség/stabilitás: Vitest + 41 unit teszt, CI tesztlépés, toast-egységesítés, RLS audit)

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
  - Longevity (`/longevity-generator`)
- Programok (`/programs`, `/programs/:id`) — microciklus-alapú többhetes programok
- Gyakorlatkönyvtár (`/exercises`, `/exercises/:id`)
- FMS felmérés (`/assessment`)
- Felhasználókezelés (`/users`, admin)
- Polar integráció (`/polar/callback`) — legutóbbi commit
- Kettlebell komplex builder + Cardió (legutóbbi commitok)
- Edzésmegosztás (workout sharing)

### Tech állapot
- Build: **zöld** (`npm run build` sikeres); lint: **0 error** (22 örökölt warning); typecheck (`tsc --noEmit`): **zöld**
- Tesztek: **Vitest, 41 unit teszt zöld** (`npm test`) — generátor + taxonómia tiszta logika
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
- [x] **Nagy fájlok refaktorálása** (CLAUDE.md is jelöli): ✅ 2026-06-25
  - [x] `WorkoutPlanner.tsx` (2303 → 920 sor) — komponensekre bontva ✅ 2026-06-25
  - [x] `workoutGenerator.fixed.ts` (1620 → 242 sor) — modulokra bontva ✅ 2026-06-25
  - [x] `exerciseService.ts` (869 → 225 sor) — `src/lib/exerciseTaxonomy/` modulokra bontva ✅ 2026-06-25
  - [x] `ProgressTracking.tsx` (748 → 141 sor) — `components/progress/` komponensekre + `progressTrackingHelpers.ts`-be bontva ✅ 2026-06-25
- [x] **Supabase teszt-/segéd-fájlok konszolidálása**: 3 halott fájl törölve (`supabaseConnection.ts` — `SupabaseConnectionManager`, 0 import; `utils/testConnection.ts` — 0 import; `lib/testSupabaseConnection.ts` — csak a halott `testConnection.ts` importálta). Megmaradt a 2 ténylegesen használt: `supabaseTest.ts` (UserManagement) és `supabaseUtils.ts` (megosztott `handleSupabaseError` / `testSupabaseConnection`). Build zöld. ✅ 2026-06-24

---

## 3. Minőség / stabilitás 🟡

- [x] **Build + lint zöld állapot ellenőrzése és CI-ba kötése** ✅ 2026-06-25: build + lint zöld (0 ESLint error, 22 örökölt warning). A meglévő `.github/workflows/build-test.yml` kiegészítve `npm test` lépéssel (lint → test → build sorrend).
- [x] **Tesztlefedettség: kritikus generátor-logikára unit tesztek** ✅ 2026-06-25: Vitest 2 bevezetve (`vitest.config.ts`, `npm test` / `test:watch` / `test:coverage` szkriptek). 41 unit teszt 5 fájlban a tiszta üzleti logikára: `exerciseCategorizer` (kategorizálás, random/first választás), `fmsCorrections`, `focusPresets` (periodizáció + szekció-alkalmazás), taxonómia `filters` (szűrés, FMS-fókusz) és `metadata` (címkék). Közös `fixtures.ts` factory-k.
- [x] **RLS policy-k auditja minden táblán** ✅ 2026-06-25: statikus (migrációk) + élő (Supabase advisor) audit. **Eredmény: tiszta** — mind a 21 UGKettlebell tábla RLS-enabled, és az élő biztonsági advisor 0 RLS-találatot ad rájuk (nincs hiányzó policy, nincs „always true" permisszív policy). A `polar_connections`/`cardio_sessions` szándékosan korlátozott (kliens csak DELETE/SELECT, írást a service-role Edge Function végzi — dokumentálva a migrációban). Lásd lentebb a kapcsolódó nyitott találatokat (függvény search_path, séma-drift).
- [x] **Hibakezelés egységesítése (toast magyarul)** ✅ 2026-06-25: a 17 natív blokkoló `alert()` hívás (4 cél-/edzés-komponensben: `GoalsManagement`, `GoalsDashboard`, `EnhancedGoalForm`, `PersonalWorkoutTracker`) lecserélve a domináns `react-hot-toast` `toast.success()` / `toast.error()` hívásokra. Maradék: lásd a két párhuzamos toast-rendszer tételt lentebb.
- [x] **`.env.example` naprakészsége (Polar + EmailJS változók)** ✅ 2026-06-25: ellenőrizve — minden használt `import.meta.env.VITE_*` változó szerepel benne (EmailJS×3, Polar×2, Supabase×2). Naprakész, módosítás nem kellett.

### Nyitott biztonsági / konzisztencia találatok (audit melléktermék, 2026-06-25)

- [ ] **Függvény `search_path` hardening** 🟡: ~30 saját `SECURITY DEFINER` Postgres-függvény (`is_admin`, `handle_new_user`, `get_polar_status`, `is_current_user_admin`, `create_user_invite`, `use_invite_token`, `validate_invite_token`, `join_appointment`/`leave_appointment`, `increment/decrement_participants`, `update_goal_*`, `sync_exercise_derived_taxonomy_assignments`, stb.) a Supabase advisor szerint `function_search_path_mutable` (privilégium-eszkaláció kockázat). Megoldás: külön migrációban `ALTER FUNCTION ... SET search_path = public, pg_temp`. (Megjegyzés: a Supabase projekt megosztott egy kosárlabda-statisztika alkalmazással — annak tábláit/függvényeit NE bántsuk.)
- [ ] **Séma-drift: hiányzó migrációk** 🔴: a `goals`, `goal_completions` és `pending_invites` táblákat a kód használja (`.from('goals')` stb.) és az élő DB-ben léteznek (RLS-enabled), de **nincs hozzájuk migration a `supabase/migrations/`-ban**. Friss DB-felálláskor hiányoznának. Megoldás: a meglévő élő séma exportálása új migration fájlokba (CREATE TABLE + RLS policies).
- [ ] **Két párhuzamos toast-rendszer** 🟢: a `react-hot-toast` (`<Toaster>` a `main.tsx`-ben, a komponensek többsége) mellett a shadcn `components/ui/use-toast` (`<Toaster>` az `App.tsx`-ben) is mountolva van, ezt csak a `supabaseUtils.ts` és `fmsService.ts` használja. Érdemes egy rendszerre konszolidálni (javasolt: react-hot-toast).
- [ ] **Projektszintű Supabase warningok** 🟢: „Leaked Password Protection Disabled" (kapcsold be a Supabase Auth beállításoknál) és „vulnerable Postgres version" (frissítés elérhető) — megosztott infra, döntés a tulajdonossal.
- [x] **Mozgásminta (`movement_pattern`) adat-drift** 🟡 ✅ 2026-06-27: 24 erőedzés-gyakorlat olyan `movement_pattern` értéket használt, ami nincs a UI `MOVEMENT_PATTERN_OPTIONS`-ban → nem jelentek meg kanonikus címkével a szűrőben, és a derived-trigger CASE sem fogta meg őket (csak `strength` tag maradt). Új `20260627123000_normalize_legacy_movement_patterns.sql` migráció a kanonikus leképezéssel: `anti_extension`→`stability_anti_extension`, `anti_lateral_flexion`→`stability_anti_flexion`, `loaded_carry`→`gait_stability`, `corrective`→`local_exercises`, `locomotion`→`gait_crawling`. Az `AFTER UPDATE OF movement_pattern` trigger automatikusan újragenerálta a pattern-family + exact_pattern derived tageket; a manuális tagek érintetlenek. Élő DB-n alkalmazva + ellenőrizve (0 legacy minta maradt). Nincs TS-kódváltozás → build/lint/teszt érintetlen.

---

## 4. Jövőbeni fejlesztések (feature backlog)

> Ide írjuk az új ötleteket. Minden tételhez: rövid leírás + prioritás.

- [ ] _(ide jönnek az új funkció-ötletek)_

---

## 5. Done (lezárt tételek)

- [x] **Gyakorlattár taxonómia-revízió: KB-címke + mozgásminta-normalizálás** (2026-06-27): a teljes gyakorlattár (161 gyakorlat) átnézve. **(A)** Mozgásminta-drift: 24 erőedzés-gyakorlat legacy `movement_pattern`-je a kanonikus enum-értékekre képezve (`20260627123000` migráció) — visszaálltak a pattern-family/exact-pattern derived tagek (pl. Plank → `anti_extension`+`core`, Windmill/TGU → `anti_flexion`+`core`, Farmer járás → `gait`). **(B)** Kettlebell-szűrhetőség: 14 Erőedzés-kategóriás KB-gyakorlat manuális `kettlebell` taget kapott (`20260627124000` migráció) — 5 egyértelmű (Goblet guggolás, Windmill, TGU, Batwing, Forró krumpli) + 9 KB-vel tipikusan végzett (egylábas felhúzás/evezés, egykezes evezés, farmer járás ×2, push press, libikóka padlón nyomás, jó reggelt, áthúzás), edzői jóváhagyással. Erőedzés-kategóriás kettlebell-címkés gyakorlatok: 17 → 31. **(C)** Élő-adat anomália javítva: a kettlebell-kategóriás „Bicepsz emelés KB" sosem szinkronizált derived kettlebell tagje pótolva (teljes derived re-sync; idempotens, a create-migráció amúgy is tartalmazza). Nincs TS-kódváltozás → build/lint/teszt érintetlen.
- [x] **Gyakorlattár kategória-szűrő javítása** (2026-06-27): a szűrő nem találta a legnagyobb csoportot, mert az `exercises.category` oszlopban legacy seed-értékek maradtak, amelyek nem egyeztek a UI kanonikus kategória-listájával: `strength` (79 sor, a UI csak `strength_training`-et kínál) és `core` (20 sor, nincs ilyen UI-kategória) → 99 gyakorlat kiesett a szűrésből. Mivel a derived-taxonómia trigger is csak `strength_training`-et ismer, ezeknél a taxonómia-fallback is elbukott. Javítás: új `20260627122000_normalize_legacy_exercise_categories.sql` migráció a `strength`/`core` → `strength_training` normalizálással (a `core` döntés alapján Erőedzésbe olvad; a core-jelleg a mozgásminta-szűrőben marad). Az `AFTER UPDATE OF category` trigger automatikusan újragenerálta a 99 `strength` derived kategória-taget. Élő DB-n alkalmazva + ellenőrizve (kategória-eloszlás kanonikus, 99 derived strength tag). Nincs TS-kódváltozás → build/lint/teszt érintetlen. Kapcsolódó nyitott találat (mozgásminta-drift) a 3. szekcióban rögzítve.
- [x] **Edzéstervező UX-finomítás + microciklus-generálás** (2026-06-25): **(A)** Input-UX inkrementális csiszolás: a `WorkoutSectionsEditor` gyakorlat-kártyái összecsukhatók (kitöltött gyakorlat alapból összegző-fejléccé csukva), a speciális szűrők rejtett `<details>`-e felfedezhetőbb (chevron + „N aktív" badge), a `WorkoutPlanner`-en vékony **sticky összegző sáv**, generált tervnél a szekciók 4 fölött alapból csukva + „Mind kinyit/becsuk" gomb, a Résztvevők/FMS blokk **összecsukható accordionban**. **(B)** Microciklus (2/4/6 hetes program) egy gombbal a Periodizált/Pwron/Longevity panelekről: új `workout_programs` tábla + `workouts.program_id`/`program_week`/`program_day_label`/`program_sequence` FK-oszlopok (migráció + élő Supabase apply, security advisor tiszta a táblára), tiszta `buildMicrocyclePlan` logika (hetek × edzésnapok dátumozással + heti clamp), `microcycleGenerator` orchestrátor (a meglévő generátorokat hívja végig és batch-menti), `programService` CRUD, új `ProgramsPage`/`ProgramDetailPage` (`/programs`, `/programs/:id`) + sidebar-nav. 9 új unit teszt a tervező-logikára (61 teszt zöld). A Sablon generátor szándékosan kimaradt. Build + lint (0 error) + tsc + teszt zöld.
- [x] **Longevity generátor (4 hetes protokoll)** (2026-06-25): új `longevityWorkoutGenerator.ts` a „4 hetes Longevity edzésprotokoll" spec alapján — heti hármas sablon (Hétfő STRENGTH/HIGH CNS, Szerda STATO_DYNAMIC/LOW, Péntek AGT/LOW) hétről hétre progresszióval (erő: szett+terhelés, stato: idő+terhelés, AGT: körök +3/hét). Single-session kimenet (hét 1-4 + modalitás a UI-ban választva), mint a Pwronnál; AGT eszközváltozat (kettlebell swing alapértelmezett / Airdyne / dombfutás). Beépített invariáns-validáció (spec 9. fej.: CNS-sorrend, AGT 130 pulzusplafon, progresszió-korlát) figyelmeztetésként a notes-ban. Wiring: `PlannerMode` bővítve, `LongevityGeneratorPanel`, route `/workout-planner/longevity-generator` + page, nav (header + sidebar), WorkoutPlanner generálási ág. 11 új unit teszt a tiszta logikára (`buildLongevitySessionMeta`, `validateLongevitySession`) — 52 teszt zöld. A spec opcionális műszak-moduláció rétege (10. fej., `[S]`) szándékosan kimaradt. Build + lint + tsc zöld.
- [x] **Minőség/stabilitás csomag** (2026-06-25): Vitest 2 + 41 unit teszt (generátor + taxonómia tiszta logika), CI `npm test` lépés, 17 natív `alert()` → `react-hot-toast` egységesítés (4 komponens), `.env.example` ellenőrzés, teljes RLS audit (migrációk + élő Supabase advisor — tiszta a 21 saját táblán). Új találatok rögzítve a 3. szekcióban: függvény `search_path` hardening, séma-drift (`goals`/`goal_completions`/`pending_invites` migráció nélkül), két párhuzamos toast-rendszer. Build + lint + tsc + teszt zöld.
- [x] **`exerciseService.ts` modulokra bontása** (2026-06-25): a 869 soros service 225 sorra csökkent (-74%); a `.ts` továbbra is a belépési pont (megtartja a Supabase CRUD-ot — `getExercises`/`getExerciseById`/`createExercise`/`updateExercise`/`deleteExercise`/`listExerciseTaxonomyTags` + a `replaceManualTaxonomyAssignments` helpert — és re-exportál minden publikus típust/függvényt, így a 9 importáló fájl egyikét sem kellett módosítani). Kiszervezve a `src/lib/exerciseTaxonomy/` mappába: `types.ts` (összes `export type`), `constants.ts` (kategória/mozgásminta-opciók + FMS-fókusz nevek + taxonómia-slug map-ek + szűrhető slug-halmazok), `mapping.ts` (`mapExerciseWithTaxonomy` + derived-slug + tag-getterek), `metadata.ts` (label/option getterek), `filters.ts` (`filterExercisesList` + kategória/minta-szűrők + `getExerciseFMSFocuses`). Build + lint zöld.
- [x] **`ProgressTracking.tsx` komponensekre bontása** (2026-06-25): a 748 soros oldal 141 sorra csökkent (-81%). A főkomponens megtartja az adatbetöltést (`loadWeights` + `useAutoRefresh`) és a kompozíciót. Kiszervezve: `lib/progressTrackingHelpers.ts` (`weightSchema` zod + `WeightFormData` + `CHART_METRICS` adatvezérelt metrika-konfiguráció + `buildChartData`/`buildChartOptions`/`getChartLabels` — az 5× ismételt `switch (activeChart)` egy config-tömbbé olvasztva), `components/progress/MeasurementForm.tsx` (saját `useForm`), `ProgressChartCard.tsx` (Chart.js + metrika-gombok), `ProgressStatsCard.tsx`, `RecentEntriesCard.tsx`. Build + lint zöld.
- [x] **`workoutGenerator.fixed.ts` modulokra bontása** (2026-06-25): az 1620 soros generátor 242 sorra csökkent (-85%); a `.fixed.ts` továbbra is a belépési pont (re-exportál minden publikus típust/függvényt, így egyetlen importáló fájlt sem kellett módosítani). Kiszervezve a `src/lib/workoutGenerator/` mappába: `types.ts` (típusok + `TRAINING_FOCUS_OPTIONS` + `getTrainingFocusLabel`), `exerciseCategorizer.ts` (konstansok + `categorizeExercises` + `getRandomExercise`/`getFirstAvailableExercise`), `fmsCorrections.ts` (`FMS_CORRECTIONS` + `identifyFMSCorrections`), `focusPresets.ts` (periodizációs presetek + `getFocusPreset` + `applyFocusPresetToSections`), `dayPlans.ts` (`generate2DayPlan`/`generate3DayPlan`/`generateDay1-4Plan`). A két publikus függvény közti duplikáció (alapsúly-kiegészítés, FMS-lekérés) közös helperekbe (`applyDefaultWeights`, `fetchFMSCorrections`) emelve. Build + lint zöld.
- [x] **`WorkoutPlanner.tsx` komponensekre bontása** (2026-06-25): a 2303 soros oldal 920 sorra csökkent (-60%). Kiszervezve: `lib/workoutPlannerHelpers.ts` (típusok + `workoutSchema` + `getPlaceholderExerciseMeta` + default factory-k), `hooks/useSectionExerciseFilters.ts` (per-exercise szűrőállapot + műveletek), `components/workouts/ParticipantSelector.tsx`, `WorkoutSummaryCards.tsx`, `WorkoutSectionsEditor.tsx` (kardió/komplex/standard szekció renderelés). A `Section`/`SectionExercise` típus a helpers-be került (a builderek importja átállítva, körkörös import megszüntetve). Lint + build zöld.
- [x] **Supabase teszt-/segéd-fájlok konszolidálása** (2026-06-24): 3 halott fájl törölve, 2 használt maradt; build zöld
- [x] **`userService.ts` → `users.ts` merge** (2026-06-24): egyetlen használt export átemelve, import átállítva, `userService.ts` törölve; build zöld
- [x] **`workouts.ts:473` gyakorlatnév-feloldás** (2026-06-24): batch `id -> name` lekérdezés a `getWorkoutProgressTrend`-ben; nincs több TODO/FIXME a kódban
- [x] **Markdown-takarítás** (2026-06-24): 29 db egyszeri „fix/summary/status/complete" jegyzet a `docs/legacy/`-ba archiválva (`git mv`, history megőrizve); a gyökérben a 42 md-ből 13 érdemi maradt (CLAUDE/BACKLOG/README + database.md + setup/deployment guide-ok). `database.md` (README hivatkozás) és `DEPLOYMENT_GUIDE.md` (`deploy.sh` hivatkozás) szándékosan maradt
- [x] **Kódbázis takarítás** (2026-06-24): `workoutGenerator.ts` + 6 stale fájl + 2 használaton kívüli dup-service törölve; 100 SQL/shell fix-szkript a `scripts/legacy/`-ba archiválva; CLAUDE.md/BACKLOG.md frissítve; build zöld
- [x] Polar integráció bevezetése (commit `05ce6a4`)
- [x] Cardió és kettlebell komplex hozzáadása (commit `55a7851`)
- [x] Edzésnaptár funkció (commit `d371990`)
- [x] Edzésmegosztó rendszer (commit `a76c42c`)
