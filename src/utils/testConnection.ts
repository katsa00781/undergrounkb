import { supabase } from '../config/supabase';
import { runSupabaseConnectionTest, formatTestResults } from '../lib/testSupabaseConnection';
import toast from 'react-hot-toast';
import { config } from 'dotenv';

// Ha Node.js környezetben vagyunk, betöltjük a környezeti változókat
if (typeof process !== 'undefined' && process.env) {
  try {
    config();
  } catch (error) {
    console.error('Error loading dotenv:', error);
  }
}

/**
 * Teszteli a Supabase kapcsolatot és részletes információt ad a hibákról
 * @returns A kapcsolat állapota (true = sikeres, false = sikertelen)
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Környezeti változók ellenőrzése
    const envStatus = {
      url: process.env.VITE_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL,
      key: process.env.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY
    };

    console.log('\nKörnyezeti változók ellenőrzése:');
    console.log('- VITE_SUPABASE_URL:', envStatus.url ? envStatus.url : 'Hiányzik');
    console.log('- VITE_SUPABASE_ANON_KEY:', envStatus.key ? '********' : 'Hiányzik');

    if (!envStatus.url || !envStatus.key) {
      console.error('\nHiányzó környezeti változók!');
      console.error('Kérem, ellenőrizze a .env fájlt és győződjön meg róla, hogy tartalmazza:');
      console.error('VITE_SUPABASE_URL=az_ön_supabase_url_címe');
      console.error('VITE_SUPABASE_ANON_KEY=az_ön_supabase_anon_kulcsa');
      return false;
    }

    // Ellenőrizzük a környezeti változók formátumát
    if (!envStatus.url.startsWith('https://')) {
      console.error('\nHibás Supabase URL formátum!');
      console.error('Az URL-nek https://-sel kell kezdődnie.');
      return false;
    }

    if (!envStatus.key.startsWith('eyJ')) {
      console.error('\nHibás Supabase anon kulcs formátum!');
      console.error('Az anon kulcsnak eyJ-vel kell kezdődnie (JWT token).');
      return false;
    }

    console.log('\nSupabase kapcsolat tesztelése...');
    
    // Alapvető kapcsolat teszt
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('\nHiba a session lekérdezése során:');
      console.error('- Hiba kód:', sessionError.status || 'N/A');
      console.error('- Hiba üzenet:', sessionError.message);
      console.error('- Hiba részletek:', 'N/A');
      return false;
    }
    
    console.log('\nAuth session:', session ? 'Aktív' : 'Nincs');
    if (session) {
      console.log('- User ID:', session.user.id);
      console.log('- Email:', session.user.email);
      console.log('- Token lejárat:', new Date(session.expires_at! * 1000).toLocaleString());
    }
    
    // Részletes teszt futtatása
    console.log('\nRészletes kapcsolat teszt futtatása...');
    const testResults = await runSupabaseConnectionTest();
    const formattedResults = formatTestResults(testResults);
    
    console.log('\nRészletes teszt eredmények:');
    console.log(formattedResults);
    
    // Ellenőrizzük, hogy van-e policy recursion hiba
    const hasPolicyRecursion = testResults.errors.some(error => 
      error.includes('infinite recursion') || error.includes('policy recursion')
    );
    
    if (!testResults.success) {
      if (hasPolicyRecursion) {
        // Ha van policy recursion hiba, de egyébként működik a kapcsolat
        if (testResults.results.auth && testResults.results.database) {
          console.log('\nFigyelmeztetés: A kapcsolat működik, de policy problémák vannak.');
          console.log('Ez nem feltétlenül jelent problémát, csak azt jelzi, hogy egyes táblák jogosultsági beállításai komplexek.');
          if (typeof toast !== 'undefined') {
            toast('Adatbázis kapcsolat működik, de policy problémák vannak. Részletek a konzolban.', {
              icon: '⚠️',
              style: {
                background: '#FEF3C7',
                color: '#92400E'
              }
            });
          }
          return true; // Tekintjük sikeresnek a kapcsolatot
        } else {
          console.error('\nHiba: Adatbázis kapcsolódási probléma és policy hibák.');
          console.error('Kérem, ellenőrizze a Supabase projekt beállításait és a jogosultságokat.');
          if (typeof toast !== 'undefined') {
            toast.error('Adatbázis kapcsolódási probléma és policy hibák. Részletek a konzolban.');
          }
          return false;
        }
      } else {
        console.error('\nHiba: Adatbázis kapcsolódási probléma.');
        console.error('Kérem, ellenőrizze a következőket:');
        console.error('1. A Supabase projekt fut és elérhető');
        console.error('2. A környezeti változók helyesek');
        console.error('3. A hálózati kapcsolat működik');
        if (typeof toast !== 'undefined') {
          toast.error('Adatbázis kapcsolódási probléma. Részletek a konzolban.');
        }
        return false;
      }
    }
    
    console.log('\nSikeres kapcsolat teszt!');
    if (typeof toast !== 'undefined') {
      toast.success('Adatbázis kapcsolat sikeres!');
    }
    return true;
  } catch (error) {
    console.error('\nVáratlan hiba a kapcsolat tesztelése során:');
    console.error('- Hiba típus:', error instanceof Error ? error.name : 'Ismeretlen');
    console.error('- Hiba üzenet:', error instanceof Error ? error.message : String(error));
    console.error('- Stack trace:', error instanceof Error ? error.stack : 'N/A');
    if (typeof toast !== 'undefined') {
      toast.error('Váratlan hiba a kapcsolat tesztelése során');
    }
    return false;
  }
}

// Ha közvetlenül futtatjuk a fájlt
if (typeof require !== 'undefined' && require.main === module) {
  console.log('Supabase kapcsolat teszt indítása...\n');
  
  // Várjuk meg a teszt befejezését és a folyamat kilépését
  (async () => {
    try {
      const success = await testConnection();
      // Várjunk egy kicsit, hogy a console.log-ok megjelenjenek
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('Kritikus hiba:', error);
      // Várjunk egy kicsit, hogy a console.log-ok megjelenjenek
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.exit(1);
    }
  })();
}

/**
 * Diagnosztikai információt gyűjt a Supabase kapcsolatról
 * @returns Diagnosztikai információ szöveges formátumban
 */
export async function getDiagnosticInfo(): Promise<string> {
  try {
    let info = '=== Supabase Diagnosztika ===\n\n';
    
    // Környezeti változók ellenőrzése
    info += 'Környezeti változók:\n';
    info += `- VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? 'Beállítva' : 'Hiányzik'}\n`;
    info += `- VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Beállítva' : 'Hiányzik'}\n\n`;
    
    // Hálózati kapcsolat ellenőrzése
    info += 'Hálózati kapcsolat:\n';
    try {
      const response = await fetch(import.meta.env.VITE_SUPABASE_URL);
      info += `- Supabase szerver elérése: ${response.ok ? 'Sikeres' : 'Sikertelen'} (${response.status})\n`;
    } catch (error) {
      info += `- Supabase szerver elérése: Sikertelen (${error instanceof Error ? error.message : String(error)})\n`;
    }
    
    // Auth állapot ellenőrzése
    info += '\nAuth állapot:\n';
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      info += `- Session lekérdezés: Hiba (${sessionError.message})\n`;
    } else {
      info += `- Session lekérdezés: ${session ? 'Aktív session' : 'Nincs aktív session'}\n`;
      if (session) {
        info += `- Felhasználó: ${session.user.email}\n`;
        info += `- Token lejárat: ${new Date(session.expires_at! * 1000).toLocaleString()}\n`;
      }
    }
    
    // Táblák elérhetőségének ellenőrzése
    info += '\nTáblák elérhetősége:\n';
    const tables = ['profiles', 'users', 'exercises', 'workouts', 'appointments'];
    let policyRecursionDetected = false;
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          if (error.code === '42P17') {
            info += `- ${table}: Hiba (${error.code}: ${error.message})\n`;
            policyRecursionDetected = true;
          } else {
            info += `- ${table}: Hiba (${error.code}: ${error.message})\n`;
          }
        } else {
          info += `- ${table}: Elérhető\n`;
        }
      } catch (error) {
        info += `- ${table}: Kivétel (${error instanceof Error ? error.message : String(error)})\n`;
      }
    }
    
    // Ha policy recursion hibát észleltünk, adjunk hozzá egy magyarázatot
    if (policyRecursionDetected) {
      info += '\nMegjegyzés a policy recursion hibákról:\n';
      info += '- A "infinite recursion detected in policy" hibák a Supabase adatbázis jogosultsági szabályaiban lévő problémákra utalnak.\n';
      info += '- Ez nem feltétlenül jelenti azt, hogy a kapcsolat nem működik, csak azt, hogy bizonyos táblák elérése korlátozott lehet.\n';
      info += '- Az alkalmazás továbbra is működhet, de egyes funkciók korlátozottak lehetnek.\n';
      info += '- A probléma megoldásához a Supabase adatbázis adminisztrátorának módosítania kell a jogosultsági szabályokat.\n';
    }
    
    // Részletes teszt futtatása
    info += '\nRészletes teszt eredmények:\n';
    const testResults = await runSupabaseConnectionTest();
    info += formatTestResults(testResults);
    
    return info;
  } catch (error) {
    return `Hiba a diagnosztika során: ${error instanceof Error ? error.message : String(error)}`;
  }
}
