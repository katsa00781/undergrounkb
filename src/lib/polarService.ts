import { supabase } from '../config/supabase';

// Polar AccessLink OAuth2 + szinkron kliensoldali service.
// A client_secret-et NEM tartalmazza: a token-cserét és a szinkront Edge Function
// végzi szerver oldalon (polar-oauth, polar-sync).

const POLAR_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_POLAR_CLIENT_ID || '',
  // A redirect_uri-nak egyeznie kell a Polar admin felületén regisztrálttal.
  REDIRECT_URI:
    import.meta.env.VITE_POLAR_REDIRECT_URI ||
    `${window.location.origin}/polar/callback`,
};

const POLAR_AUTHORIZE_URL = 'https://flow.polar.com/oauth2/authorization';
const STATE_STORAGE_KEY = 'polar_oauth_state';

export interface PolarStatus {
  connected: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
}

export interface CardioSession {
  id: string;
  polar_exercise_id: string;
  source: string;
  start_time: string | null;
  duration_seconds: number | null;
  sport: string | null;
  calories: number | null;
  hr_avg: number | null;
  hr_max: number | null;
  training_load: number | null;
  hr_zones: unknown;
  created_at: string;
}

/** Be van-e állítva a Polar kliens azonosító (különben nincs értelme a gombnak). */
export const isPolarConfigured = (): boolean => POLAR_CONFIG.CLIENT_ID !== '';

/** Összerakja a Polar authorize URL-t és eltárol egy CSRF-védő state-et. */
export function getPolarAuthUrl(): string {
  const state = crypto.randomUUID();
  localStorage.setItem(STATE_STORAGE_KEY, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: POLAR_CONFIG.CLIENT_ID,
    redirect_uri: POLAR_CONFIG.REDIRECT_URI,
    scope: 'accesslink.read_all',
    state,
  });

  return `${POLAR_AUTHORIZE_URL}?${params.toString()}`;
}

/** Ellenőrzi a visszakapott state-et a CSRF védelemhez. */
export function verifyPolarState(state: string | null): boolean {
  const stored = localStorage.getItem(STATE_STORAGE_KEY);
  localStorage.removeItem(STATE_STORAGE_KEY);
  return !!state && !!stored && state === stored;
}

/** Authorization code beváltása az Edge Functionön keresztül. */
export async function exchangePolarCode(code: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('polar-oauth', {
    body: { code },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

/** Új edzések szinkronizálása. Visszaadja az importált darabszámot. */
export async function syncPolar(): Promise<number> {
  const { data, error } = await supabase.functions.invoke('polar-sync', {
    body: {},
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data?.imported ?? 0;
}

/** A Polar kapcsolat állapota (token kiolvasása nélkül). */
export async function getPolarStatus(): Promise<PolarStatus> {
  const { data, error } = await supabase.rpc('get_polar_status');
  if (error) {
    console.error('get_polar_status error:', error);
    return { connected: false, connectedAt: null, lastSyncAt: null };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { connected: false, connectedAt: null, lastSyncAt: null };
  return {
    connected: !!row.connected,
    connectedAt: row.connected_at ?? null,
    lastSyncAt: row.last_sync_at ?? null,
  };
}

/** Polar fiók leválasztása (a kapcsolat törlése). */
export async function disconnectPolar(): Promise<void> {
  const { error } = await supabase
    .from('polar_connections')
    .delete()
    .neq('user_id', '00000000-0000-0000-0000-000000000000');
  if (error) throw new Error(error.message);
}

/** A felhasználó importált cardio edzései, legújabb elöl. */
export async function getCardioSessions(): Promise<CardioSession[]> {
  const { data, error } = await supabase
    .from('cardio_sessions')
    .select('*')
    .order('start_time', { ascending: false });
  if (error) {
    console.error('getCardioSessions error:', error);
    return [];
  }
  return (data ?? []) as CardioSession[];
}
