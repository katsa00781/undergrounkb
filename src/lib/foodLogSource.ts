import type { Database } from '../types/supabase';

type EntrySourceFields = Pick<
  Database['public']['Tables']['food_log_entries']['Row'],
  'source' | 'source_app'
>;

/**
 * A mobil app által az Apple Health-ből (jelenleg Yazióból) szinkronizált sor.
 * Ezeknél a mennyiség és a makrók „tulajdonosa” a forrásapp: a weben csak a
 * `meal_index` állítható, törölni sem szabad (a következő szinkron visszaírná).
 */
export function isSyncedEntry(entry: EntrySourceFields): boolean {
  return entry.source === 'healthkit';
}

/** A forrásapp megjelenítendő neve – a mobil app logikájával egyezően. */
export function entrySourceLabel(entry: EntrySourceFields): string {
  return entry.source_app?.startsWith('com.yazio') ? 'Yazio' : 'Health';
}
