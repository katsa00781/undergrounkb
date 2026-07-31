import { describe, expect, it } from 'vitest';
import type { ManualGuest } from '@/lib/manualGuests';
import {
  findGuestForSubject,
  findSubjectIdForGuest,
  formatSubjectOptionLabel,
  resolveSubjectName,
  type FMSSubjectProfile,
} from '@/lib/fmsSubjectLinking';

function makeGuest(overrides: Partial<ManualGuest> & Pick<ManualGuest, 'id' | 'name'>): ManualGuest {
  return {
    linkedFmsUserId: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeSubject(overrides: Partial<FMSSubjectProfile> & Pick<FMSSubjectProfile, 'id'>): FMSSubjectProfile {
  return {
    email: null,
    full_name: null,
    ...overrides,
  };
}

const namedSubject = makeSubject({
  id: 'user-named',
  email: 'katsa007@gmail.com',
  full_name: 'Kácsor Zsolt',
});
const emailOnlySubject = makeSubject({ id: 'user-email', email: 'wpetya@gmail.com' });
const linkedGuest = makeGuest({ id: 'guest-linked', name: 'Wilk Péter', linkedFmsUserId: 'user-email' });
/** Szándékosan kisbetűs és ékezet nélküli — a névegyezésnek ezt is fognia kell. */
const freeGuest = makeGuest({ id: 'guest-free', name: '  kacsor zsolt ' });

describe('resolveSubjectName', () => {
  it('elsődlegesen a profil nevét adja vissza', () => {
    expect(resolveSubjectName(namedSubject, [linkedGuest])).toBe('Kácsor Zsolt');
  });

  it('név nélküli profilnál a kapcsolt vendég nevét adja vissza', () => {
    expect(resolveSubjectName(emailOnlySubject, [linkedGuest])).toBe('Wilk Péter');
  });

  it('null-t ad, ha sem profilnév, sem kapcsolt vendég nincs', () => {
    expect(resolveSubjectName(emailOnlySubject, [freeGuest])).toBeNull();
  });
});

describe('formatSubjectOptionLabel', () => {
  it('„Név (e-mail)” formában írja ki az ismert nevet', () => {
    expect(formatSubjectOptionLabel(namedSubject, [])).toBe('Kácsor Zsolt (katsa007@gmail.com)');
  });

  it('a kapcsolt vendég nevét is felhasználja', () => {
    expect(formatSubjectOptionLabel(emailOnlySubject, [linkedGuest])).toBe(
      'Wilk Péter (wpetya@gmail.com)',
    );
  });

  it('név hiányában az e-mail címet adja', () => {
    expect(formatSubjectOptionLabel(emailOnlySubject, [])).toBe('wpetya@gmail.com');
  });

  it('név és e-mail nélkül rövid azonosítóra esik vissza', () => {
    expect(formatSubjectOptionLabel(makeSubject({ id: 'abcdef123456' }), [])).toBe('Alany abcdef12');
  });
});

describe('findGuestForSubject', () => {
  it('a már kapcsolt vendéget adja vissza', () => {
    expect(findGuestForSubject('user-email', [emailOnlySubject], [freeGuest, linkedGuest])).toBe(
      linkedGuest,
    );
  });

  it('kapcsolat hiányában névegyezés alapján talál vendéget (ékezet- és kisbetű-függetlenül)', () => {
    expect(findGuestForSubject('user-named', [namedSubject], [linkedGuest, freeGuest])).toBe(
      freeGuest,
    );
  });

  it('nem vesz át más alanyhoz már kapcsolt, azonos nevű vendéget', () => {
    const takenGuest = makeGuest({
      id: 'guest-taken',
      name: 'Kácsor Zsolt',
      linkedFmsUserId: 'user-other',
    });

    expect(findGuestForSubject('user-named', [namedSubject], [takenGuest])).toBeNull();
  });

  it('null-t ad név nélküli alanyra és üres azonosítóra', () => {
    expect(findGuestForSubject('user-email', [emailOnlySubject], [freeGuest])).toBeNull();
    expect(findGuestForSubject('', [namedSubject], [freeGuest])).toBeNull();
  });
});

describe('findSubjectIdForGuest', () => {
  it('a meglévő kapcsolatot adja vissza', () => {
    expect(findSubjectIdForGuest(linkedGuest, [namedSubject, emailOnlySubject])).toBe('user-email');
  });

  it('kapcsolat hiányában azonos nevű profilt keres', () => {
    expect(findSubjectIdForGuest(freeGuest, [emailOnlySubject, namedSubject])).toBe('user-named');
  });

  it('üres stringet ad, ha nincs találat', () => {
    expect(findSubjectIdForGuest(makeGuest({ id: 'g', name: 'Rita' }), [namedSubject])).toBe('');
  });
});
