import type { ManualGuest } from './manualGuests';
import { normalizeHungarianText } from './workoutPlannerHelpers';

/**
 * Az FMS űrlap vendég ↔ adatbázisos alany összekötésének tiszta rétege.
 *
 * A `profiles.full_name` a legtöbb sorban üres, a felmért személyek nevét a
 * `manual_guests` tábla őrzi. Ezért az alanyhoz tartozó név két forrásból jöhet:
 * elsődlegesen a profil neve, másodsorban a profilhoz kötött vendég neve.
 */

/** Az alanyválasztóhoz szükséges profilmezők. */
export interface FMSSubjectProfile {
  id: string;
  email: string | null;
  full_name: string | null;
}

/** A névegyezés ugyanúgy ékezet- és kisbetű-független, mint a plannerben. */
const normalizeName = normalizeHungarianText;

/** Az alanyhoz ismert név, vagy `null`, ha csak e-mail címünk van róla. */
export function resolveSubjectName(
  subject: FMSSubjectProfile,
  guests: ManualGuest[],
): string | null {
  const profileName = subject.full_name?.trim();
  if (profileName) {
    return profileName;
  }

  const linkedGuest = guests.find(guest => guest.linkedFmsUserId === subject.id);
  return linkedGuest?.name.trim() || null;
}

/** A legördülő felirata: „Név (e-mail)”, ha van név, különben az e-mail cím. */
export function formatSubjectOptionLabel(
  subject: FMSSubjectProfile,
  guests: ManualGuest[],
): string {
  const name = resolveSubjectName(subject, guests);
  const email = subject.email?.trim() || '';

  if (name && email) {
    return `${name} (${email})`;
  }

  return name || email || `Alany ${subject.id.slice(0, 8)}`;
}

/**
 * Az alanyhoz tartozó vendég: elsődlegesen a már meglévő kapcsolat alapján,
 * ennek hiányában a profil nevével egyező, még nem kapcsolt vendég.
 */
export function findGuestForSubject(
  subjectId: string,
  subjects: FMSSubjectProfile[],
  guests: ManualGuest[],
): ManualGuest | null {
  if (!subjectId) {
    return null;
  }

  const linkedGuest = guests.find(guest => guest.linkedFmsUserId === subjectId);
  if (linkedGuest) {
    return linkedGuest;
  }

  const profileName = subjects.find(subject => subject.id === subjectId)?.full_name?.trim();
  if (!profileName) {
    return null;
  }

  // Csak szabad (máshoz nem kötött) vendéget veszünk át, hogy egy azonos nevű,
  // már más alanyhoz kapcsolt vendéget ne írjunk át véletlenül.
  return (
    guests.find(
      guest => !guest.linkedFmsUserId && normalizeName(guest.name) === normalizeName(profileName),
    ) ?? null
  );
}

/**
 * A vendéghez tartozó alany azonosítója: a meglévő kapcsolat, ennek hiányában a
 * vendég nevével egyező `full_name`-ű profil. Üres string = nincs találat.
 */
export function findSubjectIdForGuest(
  guest: ManualGuest,
  subjects: FMSSubjectProfile[],
): string {
  if (guest.linkedFmsUserId) {
    return guest.linkedFmsUserId;
  }

  const guestName = normalizeName(guest.name);
  if (!guestName) {
    return '';
  }

  const match = subjects.find(
    subject => subject.full_name && normalizeName(subject.full_name) === guestName,
  );

  return match?.id ?? '';
}
