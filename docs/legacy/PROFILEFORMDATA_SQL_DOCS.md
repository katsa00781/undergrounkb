# ProfileFormData SQL Konverzió - Dokumentáció

Ez a dokumentáció bemutatja, hogy hogyan konvertálható a `ProfileFormData` TypeScript típus SQL műveletekké a profiles tábla kezeléséhez.

## Fájlok

### 1. `profileformdata_to_sql.sql`
Komplett SQL kód gyűjtemény, amely tartalmazza:
- UPSERT műveleteket
- SELECT lekérdezéseket
- UPDATE műveletek
- Validációs queries
- Triggers és helper függvények
- Minta adatok

### 2. `src/utils/profileSqlUtils.ts`
TypeScript utility függvények:
- **Típus definíciók**: `ProfileFormData`, `ProfileRecord`, `ProfileSqlParams`
- **Konverziós függvények**: form data ↔ SQL paraméterek
- **ProfileSqlHelper osztály**: high-level adatbázis műveletek
- **Validációs függvények**: adatok ellenőrzése
- **FitnessGoalsHelper**: fitness célok kezelése

### 3. `src/utils/profileSqlExamples.ts`
Használati példák és kódrészletek.

## ProfileFormData struktúra

```typescript
type ProfileFormData = {
  displayName: string;                    // Megjelenítendő név (kötelező, min 2 karakter)
  height: number | null | undefined;     // Magasság cm-ben
  weight: number | null | undefined;     // Súly kg-ban
  birthdate: string | undefined;         // Születési dátum (YYYY-MM-DD)
  gender: 'male' | 'female' | 'other' | '' | undefined;
  fitnessGoals: string[];                 // Fitness célok tömbje
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | '' | undefined;
}
```

## Profiles tábla struktúra

Az SQL script alapján a tábla a következő oszlopokat tartalmazza:

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,                  -- auth.users.id referencia
    display_name TEXT,                    -- Megjelenítendő név
    full_name TEXT,                       -- Teljes név (sync display_name-mel)
    height INTEGER,                       -- Magasság cm-ben
    weight DECIMAL(5,2),                  -- Súly kg-ban (decimal)
    birthdate DATE,                       -- Születési dátum
    gender TEXT CHECK (gender IN ('male', 'female', 'other', '')),
    fitness_goals JSONB DEFAULT '[]'::jsonb, -- Fitness célok JSON tömbként
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', '')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Főbb konverziós műveletek

### 1. Form Data → SQL paraméterek

```typescript
const sqlParams = profileFormDataToSqlParams(userId, formData);
// Eredmény:
// {
//   userId: "uuid",
//   displayName: "John Doe",
//   height: 180,
//   weight: 75.5,
//   birthdate: "1990-05-15",
//   gender: "male",
//   fitnessGoals: '["Weight Loss","Strength"]', // JSON string
//   experienceLevel: "intermediate"
// }
```

### 2. SQL paraméterek → tömb (prepared statements-hez)

```typescript
const paramArray = sqlParamsToArray(sqlParams);
// Eredmény: [userId, displayName, height, weight, birthdate, gender, fitnessGoals, experienceLevel]
```

### 3. Database Record → Form Data

```typescript
const formData = profileRecordToFormData(dbRecord);
// Automatikusan kezeli:
// - JSONB fitness_goals parsing
// - Date string konverzió
// - Null értékek kezelése
// - Enum típus casting
```

## SQL műveletek

### UPSERT (INSERT ON CONFLICT)

```sql
INSERT INTO public.profiles (
    id, display_name, full_name, height, weight, birthdate, 
    gender, fitness_goals, experience_level, updated_at
) VALUES (
    $1, $2, $2, $3, $4, $5::DATE, $6, $7::JSONB, $8, NOW()
) ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    full_name = EXCLUDED.display_name,
    height = EXCLUDED.height,
    weight = EXCLUDED.weight,
    birthdate = EXCLUDED.birthdate,
    gender = EXCLUDED.gender,
    fitness_goals = EXCLUDED.fitness_goals,
    experience_level = EXCLUDED.experience_level,
    updated_at = NOW();
```

### SELECT ProfileFormData formátumban

```sql
SELECT 
    id,
    COALESCE(display_name, full_name, '') as "displayName",
    height,
    weight,
    TO_CHAR(birthdate, 'YYYY-MM-DD') as birthdate,
    COALESCE(gender, '') as gender,
    COALESCE(fitness_goals, '[]'::jsonb) as "fitnessGoals",
    COALESCE(experience_level, '') as "experienceLevel"
FROM public.profiles 
WHERE id = $1;
```

## Használat React komponensben

```typescript
// Profile.tsx-ben
import { profileFormDataToSqlParams, sqlParamsToArray } from '../utils/profileSqlUtils';

const onSubmit = async (data: ProfileFormData) => {
  try {
    const sqlParams = profileFormDataToSqlParams(user.id, data);
    const paramArray = sqlParamsToArray(sqlParams);
    
    const { error } = await supabase.rpc('execute_sql', {
      query: PROFILE_SQL_QUERIES.UPSERT,
      params: paramArray
    });
    
    if (error) throw error;
    setSuccessMessage('Profile updated successfully!');
  } catch (error) {
    setErrorMessage('Failed to update profile: ' + error.message);
  }
};
```

## ProfileSqlHelper osztály használata

```typescript
import { ProfileSqlHelper } from '../utils/profileSqlUtils';

const profileHelper = new ProfileSqlHelper(supabase);

// Profil mentése
await profileHelper.upsertProfile(userId, formData);

// Profil betöltése
const profileData = await profileHelper.getProfile(userId);

// Profil létezésének ellenőrzése
const exists = await profileHelper.profileExists(userId);
```

## Fitness Goals kezelése

```typescript
import { FitnessGoalsHelper } from '../utils/profileSqlUtils';

// Elérhető célok
const availableGoals = FitnessGoalsHelper.AVAILABLE_GOALS;
// ["Weight Loss", "Muscle Gain", "Strength", "Endurance", "Flexibility"]

// Goal hozzáadása
const updatedGoals = FitnessGoalsHelper.addGoal(currentGoals, "Strength");

// Goal eltávolítása
const filteredGoals = FitnessGoalsHelper.removeGoal(currentGoals, "Weight Loss");

// Validáció
const isValid = FitnessGoalsHelper.validateGoals(goals);
```

## Speciális funkciók

### 1. Trigger a name mezők szinkronizálásához

Automatikusan szinkronizálja a `display_name` és `full_name` mezőket:

```sql
CREATE TRIGGER sync_names_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_display_name_to_full_name();
```

### 2. Preprocessing mentés előtt

```typescript
const cleanedFormData = preprocessProfileFormData(rawFormData);
// - Trimeli a stringeket
// - 0 értékeket null-lá konvertálja
// - Type safety biztosítása
```

### 3. Validációs lekérdezések

```sql
-- Profil adatok validálása
SELECT 
    id,
    display_name IS NOT NULL as has_display_name,
    height BETWEEN 100 AND 250 as valid_height,
    weight BETWEEN 30 AND 300 as valid_weight,
    birthdate IS NOT NULL AND birthdate <= CURRENT_DATE as valid_birthdate,
    gender IN ('male', 'female', 'other', '') as valid_gender,
    jsonb_array_length(COALESCE(fitness_goals, '[]'::jsonb)) >= 0 as valid_fitness_goals,
    experience_level IN ('beginner', 'intermediate', 'advanced', '') as valid_experience_level
FROM public.profiles 
WHERE id = $1;
```

## Következő lépések

1. **Tesztelés**: Manuális tesztelés a Profile oldalon
2. **Migrációs script**: A profiles tábla automatikus frissítése
3. **RLS politikák**: Row Level Security beállítása
4. **Error handling**: Részletesebb hibakezelés implementálása
5. **Monitoring**: Adatbázis műveletek naplózása

## Fájlok telepítése

1. **SQL script futtatása**: `profileformdata_to_sql.sql` végrehajtása az adatbázisban
2. **TypeScript utils importálása**: `profileSqlUtils.ts` használata a komponensekben
3. **Példák áttanulmányozása**: `profileSqlExamples.ts` referencia anyagként

Ez a rendszer biztosítja a ProfileFormData és az SQL adatbázis közötti konzisztens és típusbiztos konverziót.
