# Project: UGKettlebell Pro

## Overview
Személyi edzők számára készült kettlebell edzéstervező platform: ügyfélkezelés, FMS felmérés, edzésgenerálás, célkövetés és időpontfoglalás. Magyar nyelvű UI.

## Tech Stack
- **Frontend**: React 18 + TypeScript 5.5 (strict), Vite 5, React Router 6
- **Styling**: Tailwind CSS 3.4 (custom color system: primary/secondary/accent/success/warning/error)
- **State**: Zustand 4.5, React Context (auth, theme)
- **Forms**: React Hook Form + Zod validáció
- **Backend**: Supabase (PostgreSQL + Auth PKCE + Realtime RLS)
- **Email**: EmailJS (meghívók, értesítések)
- **Charts**: Chart.js + react-chartjs-2
- **UI**: Lucide React ikonok, Headless UI, Radix UI

## Project Structure
```
src/
├── components/     # Újrafelhasználható UI komponensek (ui/, layout/, exercises/, workouts/)
├── pages/          # Route-szintű oldalak (Dashboard, WorkoutPlanner, FMSAssessment, stb.)
├── lib/            # Üzleti logika és service-ek (workoutGenerator, exerciseService, stb.)
├── contexts/       # AuthContext, ThemeContext
├── hooks/          # useAuth, useProfile, useRolePermission, useAutoRefresh
├── config/         # supabase.ts (kliens init + SupabaseManager singleton)
├── types/          # supabase.ts (auto-generált DB típusok)
└── utils/          # Segédfüggvények, tesztek
supabase/
└── migrations/     # 22 SQL migrációs fájl (PostgreSQL séma)
```

## Architecture
**Adatfolyam**: Supabase Auth → AuthContext → custom hook-ok → service függvények (lib/) → Supabase RLS → UI  
**Rétegek**: Pages (route) → Components (UI) → Hooks (állapot) → Services (lib/) → Supabase  
**Minták**: SupabaseManager singleton, Context API auth/téma, service layer elválasztás, lazy-loaded route-ok

## Key Files
- [src/main.tsx](src/main.tsx) — belépési pont, provider-ek
- [src/App.tsx](src/App.tsx) — root komponens, kapcsolatkezelés, EmailJS init
- [src/routes.tsx](src/routes.tsx) — összes route, role-based védelem
- [src/config/supabase.ts](src/config/supabase.ts) — Supabase kliens
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) — globális auth állapot
- [src/lib/workoutGenerator.fixed.ts](src/lib/workoutGenerator.fixed.ts) — fő edzésgeneráló belépési pont (242 sor: `generateWorkoutPlan`/`generateWorkoutPlanV2` + re-exportok); a logika a `src/lib/workoutGenerator/` modulokban: `types.ts`, `exerciseCategorizer.ts`, `fmsCorrections.ts`, `focusPresets.ts`, `dayPlans.ts`
- [src/lib/exerciseService.ts](src/lib/exerciseService.ts) — gyakorlat CRUD belépési pont (225 sor: Supabase CRUD + taxonómia-hozzárendelés + re-exportok); a tiszta logika a `src/lib/exerciseTaxonomy/` modulokban: `types.ts`, `constants.ts` (kategória/mozgásminta/FMS taxonómia-adatok), `mapping.ts` (taxonómia-leképezés), `metadata.ts` (label/option getterek), `filters.ts` (gyakorlatszűrés + FMS-fókusz)
- [src/pages/WorkoutPlanner.tsx](src/pages/WorkoutPlanner.tsx) — edzéstervező oldal (920 sor); a UI komponensekre bontva: `components/workouts/{ParticipantSelector,WorkoutSummaryCards,WorkoutSectionsEditor}.tsx`, a szűrőlogika a `hooks/useSectionExerciseFilters.ts`-ben, a típusok/segédek a `lib/workoutPlannerHelpers.ts`-ben
- [src/pages/ProgressTracking.tsx](src/pages/ProgressTracking.tsx) — haladáskövető oldal (141 sor: adatbetöltés + kompozíció); a UI komponensekre bontva: `components/progress/{MeasurementForm,ProgressChartCard,ProgressStatsCard,RecentEntriesCard}.tsx`, a séma + chart-metrika-konfiguráció a `lib/progressTrackingHelpers.ts`-ben
- [src/types/supabase.ts](src/types/supabase.ts) — összes DB típusdefiníció

## Development Commands
```bash
npm run dev          # Dev szerver (port 24678, HMR)
npm run build        # Production build (dist/)
npm run lint         # ESLint ellenőrzés
npm run preview      # Production preview
npm test             # Vitest unit tesztek (egyszeri futás)
npm run test:watch   # Vitest watch módban
npm run test:coverage # Lefedettségi riport
```
Tesztek: `src/lib/__tests__/` (Vitest 2, `vitest.config.ts` — node környezet, `@` alias). A tiszta generátor- és taxonómia-logikát fedik; közös fixture factory-k a `fixtures.ts`-ben.
`.env` szükséges változók: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_EMAILJS_*` (lásd [.env.example](.env.example))

## Conventions
- **Fájlnév**: PascalCase komponenseknek, camelCase service/hook fájloknak
- **Szerepkörök**: `'admin'` | `'user'` — admin-only route-ok külön védve
- **Adatbázis**: RLS policy-k minden táblán, service rétegen keresztül érintkezz a DB-vel
- **UI szöveg**: Magyar — minden label, hibaüzenet, felhasználói szöveg magyar
- **Stílus**: Tailwind utility class-ok, custom color token-ek (`primary-500`, `error-400`, stb.), dark mode `class` alapú
- **Komponens méret**: WorkoutPlanner.tsx és workoutGenerator.fixed.ts nagyon nagy — refaktorálásra jelölve
- **Útvonalak**: Path alias `@/*` → `./src/*` (tsconfig-ban konfigurálva)

## Key Types & Interfaces
Fő típusok helye: [src/types/supabase.ts](src/types/supabase.ts)
- `Database` — teljes Supabase séma típus (táblák, nézetek, enum-ok)
- `UserRole` — `'admin' | 'user'`
- `ExerciseCategory` — `'Kettlebell' | 'FMS' | 'SMR' | 'Mobility/Flexibility' | ...`
- `MovementPattern` — 19 mozgásminta (kettlebell osztályozáshoz)
- Workout/Exercise/FMS típusok: [src/lib/exercises.ts](src/lib/exercises.ts), [src/lib/workouts.ts](src/lib/workouts.ts)

## Important Notes
- **Generátor**: `workoutGenerator.fixed.ts` az egyetlen aktív edzésgenerátor (a korábbi `workoutGenerator.ts` 2026-06-24-én törölve)
- **Pwron generátor**: `pwronWorkoutGenerator.ts` — speciális periodizált 4 napos split
- **Longevity generátor**: `longevityWorkoutGenerator.ts` — 4 hetes Longevity belépő protokoll (heti hármas sablon: Hétfő erő / Szerda stato-dinamikus / Péntek AGT; hétről hétre progresszió). Single-session kimenet (hét + modalitás a UI-ban választva), mint a Pwronnál. Route: `/workout-planner/longevity-generator`, panel: `LongevityGeneratorPanel`. A tiszta logikát (`buildLongevitySessionMeta`, `validateLongevitySession`) unit teszt fedi. A spec opcionális műszak-moduláció rétege (10. fej.) szándékosan kimaradt.
- **Supabase migrációk**: `supabase/migrations/` — sémaváltoztatáshoz mindig ide adjunk új migration fájlt
- **Deployment**: Vercel-re (`vercel.json`) és Netlify-ra (`netlify.toml`) is konfigurálva
- **DB fix szkriptek**: A korábbi séma/permission fix SQL/shell scriptek a `scripts/legacy/` mappában archiválva (2026-06-24); a gyökérben már csak `build.sh` és `deploy.sh` maradt
- **Régi Markdown-jegyzetek**: A korábbi egyszeri „fix/summary/status" md-fájlok a `docs/legacy/` mappában archiválva (2026-06-24); a gyökérben csak a core (CLAUDE/BACKLOG/README), a `database.md` és a setup/deployment guide-ok maradtak
- **Meghívórendszer**: Publikus `/invite/:token` route, AdminUI-ban kezelhető meghívók (EmailJS-en keresztül küldve)
