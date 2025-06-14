# Workouts tábla dokumentáció

## Probléma
Az edzésnapló oldal nem működik, mert a `workouts` tábla nem létezik a Supabase adatbázisban.

## Megoldás
Létre kell hozni a `workouts` táblát az adatbázisban a megfelelő struktúrával és hozzáférési szabályokkal.

## Tábla struktúra

```sql
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  sections JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own workouts
CREATE POLICY "Users can view their own workouts" 
  ON public.workouts FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own workouts
CREATE POLICY "Users can insert their own workouts" 
  ON public.workouts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own workouts
CREATE POLICY "Users can update their own workouts" 
  ON public.workouts FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to delete their own workouts
CREATE POLICY "Users can delete their own workouts" 
  ON public.workouts FOR DELETE 
  USING (auth.uid() = user_id);
```

## A tábla adatszerkezete

A `sections` mező egy JSONB típusú oszlop, amely a következő struktúrát követi:

```typescript
export interface WorkoutSection {
  name: string;
  exercises: {
    exerciseId: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
    restPeriod?: number;
  }[];
}
```

## A migráció alkalmazása

A workouts tábla migrációját a következő módokon alkalmazhatod:

### 1. Az apply-workouts-migration.sh script használata:

```bash
./apply-workouts-migration.sh
```

Ez a szkript ellenőrzi, hogy telepítve van-e a Supabase CLI, majd alkalmazza a migrációt.

### 2. A Supabase CLI közvetlen használata:

```bash
supabase db push
```

### 3. Manuális SQL futtatása:

A SQL kódot bemásolhatod és futtathatod a Supabase SQL Editor-ban.

## Ellenőrzés

A migráció alkalmazása után ellenőrizd, hogy a tábla létrejött-e, és az edzésnapló oldal megfelelően működik-e:

```bash
node src/utils/testWorkoutsTable.cjs
```

Ha minden rendben ment, a következő üzenetet kell látnod: "✅ Workouts table exists!"
