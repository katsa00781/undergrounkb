# UGKettlebell Pro Adatbázis Dokumentáció

## Adatbázis kapcsolat

A projektben Supabase-t használunk adatbázisként, amely PostgreSQL alapú backend szolgáltatás.

### Kapcsolati beállítások
```
VITE_SUPABASE_URL=https://iipcpjczjjkwwifwzmut.supabase.co
VITE_SUPABASE_ANON_KEY=[A biztonsági kulcs az .env fájlban található]
```

## Táblák

### Profilok (profiles)

- **Célja**: A felhasználói adatok és jogosultságok tárolása
- **Elsődleges kulcs**: `id` (UUID, hivatkozás az auth.users táblára)
- **Mezők**:
  - `email` (TEXT, nem lehet null)
  - `role` (user_role ENUM: 'admin', 'user')
  - `full_name` (TEXT)
  - `avatar_url` (TEXT)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
  - `updated_at` (TIMESTAMP WITH TIME ZONE)

### Időpontok (appointments)
- **Célja**: Edzés időpontok/foglalások kezelése
- **Elsődleges kulcs**: `id` (UUID)
- **Mezők**:
  - `title` (TEXT, nem lehet null)
  - `description` (TEXT)
  - `start_time` (TIMESTAMP WITH TIME ZONE)
  - `end_time` (TIMESTAMP WITH TIME ZONE)
  - `max_participants` (INTEGER)
  - `current_participants` (INTEGER)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
  - `updated_at` (TIMESTAMP WITH TIME ZONE)
  - `created_by` (UUID, külső kulcs auth.users táblához)
  - `is_cancelled` (BOOLEAN)

### Időpont résztvevők (appointments_participants)
- **Célja**: Kapcsolótábla időpontok és résztvevők között
- **Összetett elsődleges kulcs**: (`appointment_id`, `user_id`)
- **Mezők**:
  - `appointment_id` (UUID, külső kulcs appointments táblához)
  - `user_id` (UUID, külső kulcs auth.users táblához)
  - `created_at` (TIMESTAMP WITH TIME ZONE)

### FMS Értékelések (fms_assessments)
- **Célja**: A Functional Movement Screen (FMS) tesztek eredményeinek tárolása
- **Elsődleges kulcs**: `id` (UUID)
- **Mezők**:
  - `user_id` (UUID, külső kulcs auth.users táblához)
  - `date` (date, alapértelmezett: jelenlegi dátum)
  - `deep_squat` (0-3 közötti egész szám)
  - `hurdle_step` (0-3 közötti egész szám)
  - `inline_lunge` (0-3 közötti egész szám)
  - `shoulder_mobility` (0-3 közötti egész szám)
  - `active_straight_leg_raise` (0-3 közötti egész szám)
  - `trunk_stability_pushup` (0-3 közötti egész szám)
  - `rotary_stability` (0-3 közötti egész szám)
  - `total_score` (generált mező az összes pontszám összegével)

### Gyakorlatok (exercises)
- **Kategóriák**:
  - Strength Training
  - Cardio
  - Kettlebell
  - Mobility/Flexibility
  - HIIT
  - Recovery

- **Mozgásminták**:
  1. Gait alapú mozgások:
     - Gait – törzs stabilitás
     - Gait mászásban – törzs stabilitás

  2. Csípő dominás mozgások:
     - Csípő domináns – bilaterális (FMS aktív lábemelés)
     - Csípő domináns – unilaterális (ASLR)

  3. Térd dominás mozgások:
     - Térd domináns – bilaterális (ASLR)
     - Térd domináns – unilaterális (Kitörés)

  4. Horizontális mozgások:
     - Horizontális nyomás – bilaterális (SM + törzs)
     - Horizontális nyomás – unilaterális (SM + törzs)
     - Horizontális húzás – bilaterális (SM)
     - Horizontális húzás – unilaterális (SM + törzs)

  5. Vertikális mozgások:
     - Vertikális nyomás – bilaterális
     - Vertikális nyomás – unilaterális (SM + törzs)
     - Vertikális húzás – bilaterális

  6. Stabilitás gyakorlatok:
     - Stabilitás – anti-extenzió
     - Stabilitás – anti-rotáció
     - Stabilitás – anti-flexió
     - Core – egyéb

  7. Korrekciós gyakorlatok:
     - Lokális gyakorlatok (L)
     - Felsőtest mobilizálás
     - ASLR korrekció – első pár
     - ASLR korrekció – második hármas
     - SM korrekció – első pár
     - SM korrekció – második hármas
     - Stabilitás korrekció
     - Mobilizálás

## Row Level Security (RLS)

A projektben a következő RLS policy-ket használunk:

### Profiles RLS Policies
- **allow_public_select**: Minden felhasználó megtekintheti a profilokat
- **allow_individual_update**: Felhasználók csak saját profiljukat módosíthatják
- **allow_individual_delete**: Felhasználók csak saját profiljukat törölhetik

### Appointments RLS Policies
- **Anyone can view appointments**: Minden felhasználó megtekintheti az időpontokat
- **Authenticated users can create appointments**: Hitesített felhasználók létrehozhatnak időpontokat
- **Users can manage their own appointments**: Felhasználók csak saját időpontjaikat módosíthatják/törölhetik

## Migrációs fájlok

A projekt a következő migrációs fájlokat tartalmazza a `supabase/migrations` könyvtárban:

- `20250613000001_create_profiles.sql` - Profiles tábla létrehozása
- `20250613000002_create_appointments.sql` - Időpontok tábla létrehozása
- `20250613000003_create_functions.sql` - Segédfüggvények létrehozása
- `20250613000004_fix_profile_policies.sql` - Profile policy-k javítása
- `20250613000005_simplify_policies.sql` - Policy-k egyszerűsítése
- `20250613000006_ultimate_fix.sql` - Rekurziós problémák végleges javítása

## Környezeti változók

A Supabase kapcsolathoz szükséges környezeti változók a `.env` fájlban találhatók:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```