import { supabase } from '../config/supabase';

export interface ManualGuest {
  id: string;
  name: string;
  linkedFmsUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'workout-planner-manual-guests';

type ManualGuestRow = {
  id: string;
  owner_user_id: string;
  name: string;
  linked_fms_user_id: string | null;
  created_at: string;
  updated_at: string;
};

function getStorageKey(ownerUserId: string): string {
  return `${STORAGE_PREFIX}:${ownerUserId}`;
}

function isManualGuest(value: unknown): value is ManualGuest {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ManualGuest>;
  return typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.createdAt === 'string'
    && typeof candidate.updatedAt === 'string'
    && (candidate.linkedFmsUserId === undefined || candidate.linkedFmsUserId === null || typeof candidate.linkedFmsUserId === 'string');
}

function readLegacyGuests(ownerUserId: string): ManualGuest[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawValue = window.localStorage.getItem(getStorageKey(ownerUserId));
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isManualGuest);
  } catch {
    return [];
  }
}

function clearLegacyGuests(ownerUserId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(getStorageKey(ownerUserId));
}

function mapRowToManualGuest(row: ManualGuestRow): ManualGuest {
  return {
    id: row.id,
    name: row.name,
    linkedFmsUserId: row.linked_fms_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function migrateLegacyGuests(ownerUserId: string): Promise<void> {
  const legacyGuests = readLegacyGuests(ownerUserId);
  if (legacyGuests.length === 0) {
    return;
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('manual_guests')
    .select('name')
    .eq('owner_user_id', ownerUserId);

  if (existingError) {
    throw existingError;
  }

  const existingNames = new Set((existingRows || []).map((row) => row.name.trim().toLocaleLowerCase('hu')));
  const rowsToInsert = legacyGuests
    .filter((guest) => !existingNames.has(guest.name.trim().toLocaleLowerCase('hu')))
    .map((guest) => ({
      owner_user_id: ownerUserId,
      name: guest.name,
      linked_fms_user_id: guest.linkedFmsUserId ?? null,
    }));

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('manual_guests')
      .insert(rowsToInsert);

    if (insertError) {
      throw insertError;
    }
  }

  clearLegacyGuests(ownerUserId);
}

export async function listManualGuests(ownerUserId: string): Promise<ManualGuest[]> {
  await migrateLegacyGuests(ownerUserId);

  const { data, error } = await supabase
    .from('manual_guests')
    .select('id, owner_user_id, name, linked_fms_user_id, created_at, updated_at')
    .eq('owner_user_id', ownerUserId)
    .order('name');

  if (error) {
    throw error;
  }

  return ((data || []) as ManualGuestRow[]).map(mapRowToManualGuest);
}

export async function createManualGuest(ownerUserId: string, name: string): Promise<ManualGuest> {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error('A vendég neve kötelező.');
  }

  const guests = await listManualGuests(ownerUserId);
  const duplicate = guests.find((guest) => guest.name.trim().toLocaleLowerCase('hu') === normalizedName.toLocaleLowerCase('hu'));
  if (duplicate) {
    throw new Error('Ez a vendég már szerepel a listában.');
  }

  const { data, error } = await supabase
    .from('manual_guests')
    .insert({
      owner_user_id: ownerUserId,
      name: normalizedName,
      linked_fms_user_id: null,
    })
    .select('id, owner_user_id, name, linked_fms_user_id, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return mapRowToManualGuest(data as ManualGuestRow);
}

export async function deleteManualGuest(ownerUserId: string, guestId: string): Promise<void> {
  const { error } = await supabase
    .from('manual_guests')
    .delete()
    .eq('owner_user_id', ownerUserId)
    .eq('id', guestId);

  if (error) {
    throw error;
  }
}

export async function updateManualGuest(
  ownerUserId: string,
  guestId: string,
  updates: Partial<Pick<ManualGuest, 'name' | 'linkedFmsUserId'>>,
): Promise<ManualGuest> {
  const guests = await listManualGuests(ownerUserId);
  const guestIndex = guests.findIndex((guest) => guest.id === guestId);

  if (guestIndex === -1) {
    throw new Error('A vendég nem található.');
  }

  const currentGuest = guests[guestIndex];
  const nextName = updates.name === undefined ? currentGuest.name : updates.name.trim();

  if (!nextName) {
    throw new Error('A vendég neve kötelező.');
  }

  const duplicate = guests.find((guest, index) => (
    index !== guestIndex
      && guest.name.trim().toLocaleLowerCase('hu') === nextName.toLocaleLowerCase('hu')
  ));

  if (duplicate) {
    throw new Error('Ez a vendég már szerepel a listában.');
  }

  const { data, error } = await supabase
    .from('manual_guests')
    .update({
      name: nextName,
      linked_fms_user_id: updates.linkedFmsUserId === undefined ? currentGuest.linkedFmsUserId ?? null : updates.linkedFmsUserId,
    })
    .eq('owner_user_id', ownerUserId)
    .eq('id', guestId)
    .select('id, owner_user_id, name, linked_fms_user_id, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return mapRowToManualGuest(data as ManualGuestRow);
}

export async function getManualGuestById(ownerUserId: string, guestId: string): Promise<ManualGuest | null> {
  const { data, error } = await supabase
    .from('manual_guests')
    .select('id, owner_user_id, name, linked_fms_user_id, created_at, updated_at')
    .eq('owner_user_id', ownerUserId)
    .eq('id', guestId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRowToManualGuest(data as ManualGuestRow) : null;
}