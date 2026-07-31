# Project: UGKettlebell Pro

## Overview
Személyi edzők számára készült kettlebell edzéstervező platform: ügyfélkezelés, FMS felmérés, edzésgenerálás, célkövetés és időpontfoglalás. Magyar nyelvű UI.

## Tech Stack
- **Frontend**: React 18 + TypeScript 5.5 (strict), Vite 5, React Router 6
- **Styling**: Tailwind CSS 3.4 (custom color system: primary/secondary/accent/success/warning/error)
- **State**: Zustand 4.5, React Context (auth, theme)
- **Forms**: React Hook Form + Zod validáció
- **Backend**: Supabase (PostgreSQL + Auth PKCE + Realtime RLS)
- **Email**: EmailJS (meghívók, értesítések) + Supabase Edge Function SMTP (FMS riport PDF csatolmánnyal)
- **PDF**: jsPDF + jspdf-autotable, beágyazott Manrope TTF-fel (lazy-loaded)
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
npm run dev          # Dev szerver (port 5173 — fix, `strictPort`; HMR ugyanezen a porton WS upgrade-del)
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
- **BACKLOG.md karbantartása — KÖTELEZŐ**: minden érdemi módosítás után frissítsd a [BACKLOG.md](BACKLOG.md)-t, **még mielőtt késznek jelented a feladatot**. A fájl a projekt aktuális állapotának egyetlen forrása, ezért nem elég a kódot megírni. Konkrétan: (1) a lezárt munkát vedd fel az **5. Done** szekcióba dátummal (`YYYY-MM-DD`) és 2–4 mondatos érdemi leírással — mi változott, mely fájlok/migrációk, mit fed teszt, mi maradt ki szándékosan; (2) frissítsd az **1. Jelenlegi állapot** snapshotot, ha új route/tábla/funkció került be, és a „Tech állapot" számait (teszt- és migrációszám, build/lint/typecheck eredmény) a **ténylegesen lefuttatott** parancsok alapján — ne becsülj; (3) írd át a fejlécben az „Utolsó frissítés" dátumot és a mellette lévő rövid címkét; (4) ha menet közben új hibát vagy adósságot találsz, de nem javítod, vedd fel nyitott tételként a **3. Minőség / stabilitás** vagy a **4. Jövőbeni fejlesztések** szekcióba prioritással. Ha egy tétel már szerepel a backlogban, azt jelöld késznek `[x]`-szel új sor helyett
- **Fájlnév**: PascalCase komponenseknek, camelCase service/hook fájloknak
- **Szerepkörök**: `'admin'` | `'user'` — admin-only route-ok külön védve
- **Adatbázis**: RLS policy-k minden táblán, service rétegen keresztül érintkezz a DB-vel
- **UI szöveg**: Magyar — minden label, hibaüzenet, felhasználói szöveg magyar
- **Stílus**: Tailwind utility class-ok, custom color token-ek (`primary-500`, `error-400`, stb.), dark mode `class` alapú
- **Design tokenek**: Csak szemantikus színskálák használhatók (`primary`/`secondary`/`accent`/`success`/`warning`/`error`/`gray`) — nyers Tailwind-színt (red/amber/emerald/…) ne írj komponensbe. Kivétel a hűvös kiegészítők: `blue` (info/„tervezett"), `sky` (kardió-szekció), `purple`/`pink` (metrika-azonosítók). Világos téma = Daylight (smaragd+korall), sötét = Volt (lime); a skálák a [src/index.css](src/index.css) CSS-változóiból jönnek. Sötét módban a primary/secondary/success/warning 400–700 árnyalatai világosak — ilyen háttéren `dark:text-gray-900` felirat kell (a `.btn-primary`/`.btn-secondary` receptek ezt már kezelik).
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
- **Microciklus / Program réteg**: a Periodizált / Pwron / Longevity generátorokból egy gombbal többhetes program (2/4/6 hét) generálható. Tiszta tervező-logika: `src/lib/microcycle/{types,buildPlan}.ts` (`buildMicrocyclePlan` — hetek × edzésnapok dátumozással + heti clamp, unit-tesztelt); orchestrátor: `src/lib/microcycleGenerator.ts` (`generateMicrocycle` — a meglévő generátorokat hívja végig és batch-menti); perzisztencia: `src/lib/programService.ts` + új `workout_programs` tábla, a `workouts` táblán `program_id`/`program_week`/`program_day_label`/`program_sequence` FK-oszlopokkal (1:N, `ON DELETE CASCADE`). UI: a `WorkoutGeneratorPanels` „Microciklus" kapcsolója + `ProgramsPage`/`ProgramDetailPage` (`/programs`, `/programs/:id`). A Sablon generátor szándékosan kimarad (nincs heti progressziója).
- **Supabase migrációk**: `supabase/migrations/` — sémaváltoztatáshoz mindig ide adjunk új migration fájlt
- **Deployment**: Vercel-re (`vercel.json`) és Netlify-ra (`netlify.toml`) is konfigurálva
- **DB fix szkriptek**: A korábbi séma/permission fix SQL/shell scriptek a `scripts/legacy/` mappában archiválva (2026-06-24); a gyökérben már csak `build.sh` és `deploy.sh` maradt
- **Régi Markdown-jegyzetek**: A korábbi egyszeri „fix/summary/status" md-fájlok a `docs/legacy/` mappában archiválva (2026-06-24); a gyökérben csak a core (CLAUDE/BACKLOG/README), a `database.md` és a setup/deployment guide-ok maradtak
- **Meghívórendszer**: Publikus `/invite/:token` route, AdminUI-ban kezelhető meghívók (EmailJS-en keresztül küldve)
- **FMS riport (PDF + e-mail)**: Admin route-ok `/fms-results` (alanylista) és `/fms-results/:userId` (riport + dátumválasztó), oldalak: `FMSResultsPage`/`FMSReportPage`, komponensek: `components/fms/{FMSScoreGrid,FMSReportView,SendFMSReportDialog}.tsx`. A tiszta domain a `src/lib/fmsReport/`-ban: `constants.ts` (`FMS_TEST_ORDER`, `FMS_SCORE_BANDS` — a 14-21/10-13/0-9 értelmezési sávok, `FMS_TEST_DESCRIPTIONS`, PDF hex-paletta), `buildReportModel.ts` (unit-tesztelt), `pdf.ts` (jsPDF, dinamikus import → külön chunk), `fonts.ts`. **Magyar ékezet**: a jsPDF beépített fontjai cp1252-esek, amiben nincs `ő`/`ű` — ezért a `public/fonts/Manrope-{Regular,Bold}.ttf` (a Manrope variable fontból instance-olt, latin-extended-A-ra szűkített statikus TTF) beágyazása kötelező; ezt a `fmsReportPdf.test.ts` őrzi. Az e-mailt a `supabase/functions/send-fms-report/` küldi (Gmail SMTP 465/implicit TLS denomailerrel, cserélhető transport az `EMAIL_TRANSPORT` secrettel; admin-ellenőrzés kötelező) — beállítás: [docs/fms_report_email_setup.md](docs/fms_report_email_setup.md). Determinisztikus korrekciókhoz `getFMSCorrectionsForAssessment` (nem az `identifyFMSCorrections`, ami szándékosan véletlenszerű).
- **FMS riport értékelése — nem az összpontszám dönt**: a szöveges összegzést a [src/lib/fmsReport/risk.ts](src/lib/fmsReport/risk.ts) (`resolveFMSRisk`, unit-tesztelt: `fmsReportRisk.test.ts`) adja, nem a `band`. Három szint (`ready` / `corrective` / `restricted`), a végső a legrosszabb indoké: **0 pont vagy pozitív clearing teszt** → `restricted`, **bármely 1 pontos minta vagy oldalkülönbség** → legalább `corrective`, egyébként a pontsáv alapszintje. Enélkül egy 18/21-es felmérés azt állította, hogy „minden rendben", miközben egy teszt 1 pontos és aszimmetrikus volt. A `model.band` megmaradt, de **csak numerikus kontextus** (pontsáv-határok) — felhasználónak szánt szövegben (riport fejléc, PDF, e-mail, eredménylista badge) mindig a `model.risk` label/summary/reasons jelenjen meg. A badge-osztályok közösek: `components/fms/riskStyles.ts`
- **FMS pontozás (oldalankénti mérés + clearing tesztek)**: a tiszta szabályok a [src/lib/fmsScoring.ts](src/lib/fmsScoring.ts)-ben (unit-tesztelt: `fmsScoring.test.ts`). **5 teszt oldalanként pontozódik** (`FMS_SIDED_TEST_IDS`: akadálylépés, inline kitörés, vállmobilitás, ASLR, rotációs stabilitás) — a beszámított pont a **gyengébb oldal** (`resolveSidedScore`); 2 teszt szimmetrikus (mély guggolás, törzsstabil fekvőtámasz). **3 clearing (fájdalom-provokációs) teszt** (`FMS_CLEARING_TESTS`): `sm_clearing` → vállmobilitás, `tspu_clearing` → törzsstabil fekvőtámasz, `rs_clearing` → rotációs stabilitás; pozitív esetben az adott teszt pontszáma kötelezően **0**. A DB-ben a 7 meglévő pontszám-oszlop a **beszámított** pont marad (a `total_score` generált oszlop erre épül), a nyers oldalankénti értékek az új `<teszt>_left`/`_right` oszlopokban vannak (migráció: `20260801130000`). Régi felméréseknél ezek `null`-ok — visszamenőleg **ne** találd ki őket a beszámított pontból. Az űrlap rétege: [src/lib/fmsAssessmentForm.ts](src/lib/fmsAssessmentForm.ts) (`FMS_MOVEMENT_STEPS`, zod séma, `toFMSAssessmentDraft`), UI: `components/fms/{FMSScoreSelector,FMSMovementStepCard}.tsx`. A pontszámok **üresen indulnak**, nem 0-val: a 0 az FMS-ben „fájdalom", azt véletlenül nem szabad menteni
- **FMS vendég ↔ adatbázisos alany összekötés**: a `profiles.full_name` a legtöbb soron `null` (a nevek a `manual_guests` táblában élnek), ezért az alanyhoz tartozó nevet a [src/lib/fmsSubjectLinking.ts](src/lib/fmsSubjectLinking.ts) oldja fel (unit-tesztelt): `resolveSubjectName` (profilnév → kapcsolt vendég neve), `formatSubjectOptionLabel` („Név (e-mail)"), `findGuestForSubject` / `findSubjectIdForGuest`. Az `FMSAssessment` űrlapon a két select **kétirányú**: bármelyik kitölthető elsőként, és a másik automatikusan beáll (kapcsolat, ill. ékezetfüggetlen névegyezés alapján — a `normalizeHungarianText`-tel, mint a plannerben). Névegyezésnél csak **még nem kapcsolt** vendéget veszünk át, hogy egy azonos nevű, más alanyhoz kötött vendéget ne írjunk át. A `getAllUsers` (`lib/fms.ts`) ezért **nyersen** adja vissza a `full_name`-et (a megjelenítési visszaesés a `name` mezőben van) — ne állítsd vissza az e-mailre eső fallbackre
- **FMS korrekciós adatbázis**: `src/lib/workoutGenerator/fmsCorrectionExercises.ts` — mind a 7 mozgásmintához **pontosan egy gyakorlat modalitásonként**, fix sorrendben: SMR → FMS szalag → saját testsúly → kettlebell (oldás → mobilizálás → aktív stabilizálás → terhelt megerősítés). Más eszköz (gép, súlyzó, TRX, stb.) nem kerülhet bele; a szerkezetet és a modalitás-halmazt unit teszt őrzi (`fmsCorrections.test.ts`). Minden tételhez tartozik `name` / `dosage` / `cue`, ezek jelennek meg a riport „Javasolt korrekciós gyakorlatok" szekciójában (PDF + webes nézet) és az edzésgenerátorban (`identifyFMSCorrections` a gyakorlat**nevet** teszi a tervbe). **Korrekciós indok**: nem csak a 2 alatti pontszám, hanem az **oldalkülönbség** is (`FMSCorrectionGroup.reasons`: `'low_score'` / `'asymmetry'`) — egy 3/2-es akadálylépés beszámított pontja 2, mégis célzott korrekciót kíván; enélkül a riport korrekciót jelzett a fejlécben, de üres volt a gyakorlat-szekció. Új gyakorlat felvételekor a `FMSCorrectionModality` uniót ne bővítsd — a négy modalitás szándékos megkötés
- **FMS RLS**: a `fms_admin_all` policy 2026-08-01-ig soha nem illeszkedett (nem létező `user_role` JWT claim-et vizsgált), így az admin nem tudta más felmérését sem olvasni, sem menteni. Javítva a `public.current_user_is_admin()` `SECURITY DEFINER` helperrel — új admin-policyhoz ezt használd, ne a régi `is_admin(uuid)`-ot
- **RLS önhivatkozás tilos**: admin-policy-ba SOHA ne írj inline `SELECT ... FROM public.profiles` subqueryt — a `profiles` saját policy-jában ez `42P17 infinite recursion`-t okoz a tábla MINDEN lekérdezésénél (a saját profil olvasásánál is), amitől a kliens nem kapja meg a `role`-t, és néma tünetként az összes admin menüpont eltűnik a sidebarból. Ez történt a `20260731120000` migrációval, javítva: `20260801120000_fix_profiles_admin_rls_recursion.sql` (`public.current_user_is_admin()`)
