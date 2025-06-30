import { supabase } from '../config/supabase';

/**
 * Teszteli a Supabase kapcsolatot és alapvető lekérdezéseket futtat.
 * @returns A teszt eredménye igaz/hamis formában.
 */
export async function testSupabaseQueries(): Promise<boolean> {
  try {
    // Egyszerű lekérdezés a 'profiles' táblából
    const { error: profilesError } = await supabase.from('profiles').select('*').limit(1);
    if (profilesError) {
      console.error('Hiba a profiles lekérdezésnél:', profilesError);
      return false;
    }

    // Megjegyzés: Az alkalmazás már nem használja a 'users' táblát, minden felhasználói adat a 'profiles' táblában van
    // A tesztben nincs szükség a users táblára, mert fentebb már ellenőriztük a profiles táblát

    // Egyszerű lekérdezés az 'exercises' táblából
    const { error: exercisesError } = await supabase.from('exercises').select('*').limit(1);
    if (exercisesError) {
      console.error('Hiba az exercises lekérdezésnél:', exercisesError);
      return false;
    }

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

    } else {

    }
  });
}
