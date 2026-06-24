# 🎯 Célkövetési Rendszer - Adatbázis Séma

## Új táblák létrehozása

### 1. Cél típusok (goal_types)
```sql
-- Cél típusok tábla
CREATE TYPE goal_type AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE goal_category AS ENUM ('fitness', 'nutrition', 'health', 'lifestyle', 'personal');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'cancelled');

-- Célok tábla
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category goal_category NOT NULL DEFAULT 'fitness',
    type goal_type NOT NULL,
    target_value DECIMAL(10,2),
    target_unit VARCHAR(50), -- 'kg', 'reps', 'minutes', 'days', etc.
    current_value DECIMAL(10,2) DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status goal_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cél teljesítések tábla (checklist items)
CREATE TABLE IF NOT EXISTS public.goal_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    value_achieved DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Egyedi index: egy cél, egy nap csak egyszer teljesíthető
CREATE UNIQUE INDEX idx_goal_completions_unique 
ON public.goal_completions(goal_id, completion_date);
```

### 2. RLS Policies
```sql
-- Goals tábla policies
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Felhasználók csak saját céljaikat láthatják/módosíthatják
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- Goal completions tábla policies
ALTER TABLE public.goal_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goal completions" ON public.goal_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal completions" ON public.goal_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal completions" ON public.goal_completions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal completions" ON public.goal_completions
    FOR DELETE USING (auth.uid() = user_id);
```

### 3. Trigger funkciók
```sql
-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON public.goals 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Cél státusz automatikus frissítése
CREATE OR REPLACE FUNCTION update_goal_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Ha a cél lejárt, állítsd be completed-re
    UPDATE public.goals 
    SET status = CASE 
        WHEN end_date < CURRENT_DATE AND status = 'active' THEN 'completed'
        ELSE status
    END
    WHERE id = NEW.goal_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_goal_status
    AFTER INSERT OR UPDATE ON public.goal_completions
    FOR EACH ROW EXECUTE PROCEDURE update_goal_status();
```

## 📊 Cél típusok példák:

### Napi célok:
- 8 pohár víz elfogyasztása
- 30 perc mozgás
- 10,000 lépés
- 7 óra alvás

### Heti célok:  
- 3x edzés/hét
- 2x futás/hét
- Heti 1 kg fogyás

### Havi célok:
- 4 kg izomtömeg növelés
- 20 edzés/hónap

### Féléves/Éves célok:
- 10 kg fogyás
- Marathon futás
- Testzsír 15% alá
