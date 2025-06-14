import { supabase } from '../config/supabase';

/**
 * Teszteli a Supabase kapcsolatot és alapvető lekérdezéseket futtat.
 * @returns A teszt eredménye igaz/hamis formában.
 */
export async function testSupabaseQueries(): Promise<boolean> {
  try {
    // Egyszerű lekérdezés a 'profiles' táblából
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
    if (profilesError) {
      console.error('Hiba a profiles lekérdezésnél:', profilesError);
      return false;
    }

    // Egyszerű lekérdezés a 'users' táblából
    const { data: users, error: usersError } = await supabase.from('users').select('*').limit(1);
    if (usersError) {
      console.error('Hiba a users lekérdezésnél:', usersError);
      return false;
    }

    // Egyszerű lekérdezés az 'exercises' táblából
    const { data: exercises, error: exercisesError } = await supabase.from('exercises').select('*').limit(1);
    if (exercisesError) {
      console.error('Hiba az exercises lekérdezésnél:', exercisesError);
      return false;
    }

    console.log('Supabase lekérdezések sikeresen lefutottak.');
    return true;
  } catch (error) {
    console.error('Hiba a Supabase lekérdezések tesztelése közben:', error);
    return false;
  }
}

// Ha közvetlenül futtatjuk a fájlt, lefuttatjuk a tesztet
if (require.main === module) {
  testSupabaseQueries().then(success => {
    if (success) {
      console.log('Supabase kapcsolat és lekérdezések rendben.');
    } else {
      console.log('Supabase kapcsolat vagy lekérdezés hiba.');
    }
  });
}
