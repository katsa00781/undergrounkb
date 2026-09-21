import { supabase } from '../config/supabase';

// Apple Health adatok (mobil app HealthKit szinkronjából, `daily_logs` tábla).
// Csak olvasás: a webes oldal nem ír ide, az adatot a mobil app szinkronizálja.

export interface DailyHealthLog {
  id: string;
  user_id: string;
  date: string;
  steps: number | null;
  active_energy_kcal: number | null;
  sleep_minutes: number | null;
  sleep_in_bed_minutes: number | null;
  sleep_deep_minutes: number | null;
  sleep_rem_minutes: number | null;
  sleep_light_minutes: number | null;
  sleep_awake_minutes: number | null;
  sleep_score: number | null;
  sleep_efficiency: number | null;
  sleep_start: string | null;
  sleep_end: string | null;
  resting_heart_rate: number | null;
  hrv_sdnn: number | null;
}

/** A legfrissebb napi Apple Health napló (bármely mezője lehet üres, ha aznap nincs adat). */
export async function getLatestDailyHealthLog(userId: string): Promise<DailyHealthLog | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('getLatestDailyHealthLog error:', error);
    return null;
  }
  return data as DailyHealthLog | null;
}

/** Napi Apple Health naplók az utolsó `days` napra, dátum szerint növekvő sorrendben. */
export async function getDailyHealthLogs(userId: string, days = 30): Promise<DailyHealthLog[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceDate = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sinceDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('getDailyHealthLogs error:', error);
    return [];
  }
  return (data ?? []) as DailyHealthLog[];
}

/** Percben megadott időtartam „ó p” formátumban, vagy „—” ha nincs adat. */
export function formatHealthDuration(minutes: number | null): string {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h} ó ${m} p` : `${m} p`;
}
