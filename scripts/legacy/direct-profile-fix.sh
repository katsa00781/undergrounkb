#!/bin/bash

# Direkt SQL a profile mezők létrehozására
echo "Creating profile fields directly in the database..."

# Az alap parancs, amely létrehozza az összes oszlopot
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d= -f2)
SUPABASE_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d= -f2)

# SQL a mezők létrehozására
SQL=$(cat <<EOF
-- Lépésenként hozzuk létre a hiányzó oszlopokat
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthdate date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fitness_goals text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience_level text;

-- Ellenőrzés: a legelső sorhoz adjunk adatokat teszt céljából
UPDATE public.profiles 
SET 
  first_name = 'Test',
  last_name = 'User',
  height = 180,
  weight = 75,
  gender = 'male',
  experience_level = 'intermediate'
WHERE id = (SELECT id FROM public.profiles LIMIT 1);
EOF
)

# Próbáljuk meg több módon is futtatni az SQL-t
# 1. REST API használata
echo "1. Trying REST API..."
curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"${SQL}\"}" | cat

# 2. Próbáljuk meg a supabase CLI-t, ha elérhető
echo -e "\n\n2. Trying Supabase CLI if available..."
if command -v supabase &> /dev/null; then
  echo "${SQL}" | supabase db execute
else
  echo "Supabase CLI not available"
fi

echo -e "\nFinished database update attempts. Check the application to see if fields are now available."
