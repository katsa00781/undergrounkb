import { describe, expect, it } from 'vitest';
import {
  formatSleepRested,
  isPoorSleepNight,
  isSleepMismatch,
  sleepRestedLabel,
  sleepRestedTone,
  summarizeSleepByShift,
  summarizeSleepTrend,
} from '../sleepRested';

describe('formatSleepRested', () => {
  it('a skálaértéket és a címkét írja ki', () => {
    expect(formatSleepRested(2)).toBe('Kipihentség: 2/5 · fáradt');
    expect(formatSleepRested(5)).toBe('Kipihentség: 5/5 · teljesen kipihent');
  });

  it('NULL vagy skálán kívüli értékre nem ad szöveget', () => {
    expect(formatSleepRested(null)).toBeNull();
    expect(formatSleepRested(0)).toBeNull();
    expect(formatSleepRested(6)).toBeNull();
    expect(sleepRestedLabel(undefined)).toBeNull();
  });
});

describe('sleepRestedTone', () => {
  it('1–2 alacsony, 3 közepes, 4–5 magas', () => {
    expect([1, 2, 3, 4, 5].map(sleepRestedTone)).toEqual(['low', 'low', 'mid', 'high', 'high']);
    expect(sleepRestedTone(null)).toBeNull();
  });
});

describe('isPoorSleepNight', () => {
  it('55 alatti pontszámnál rossz éjszaka', () => {
    expect(isPoorSleepNight({ sleep_score: 54, sleep_rested: null })).toBe(true);
    expect(isPoorSleepNight({ sleep_score: 55, sleep_rested: null })).toBe(false);
  });

  it('jó pontszám mellett is rossz, ha a kipihentség legfeljebb 2', () => {
    expect(isPoorSleepNight({ sleep_score: 82, sleep_rested: 2 })).toBe(true);
    expect(isPoorSleepNight({ sleep_score: 82, sleep_rested: 3 })).toBe(false);
  });

  it('adat nélkül nem számít rossznak', () => {
    expect(isPoorSleepNight({ sleep_score: null, sleep_rested: null })).toBe(false);
  });
});

describe('isSleepMismatch', () => {
  it('70-es pontszám és 2-es kipihentség eltérés', () => {
    expect(isSleepMismatch({ sleep_score: 70, sleep_rested: 2 })).toBe(true);
    expect(isSleepMismatch({ sleep_score: 69, sleep_rested: 1 })).toBe(false);
    expect(isSleepMismatch({ sleep_score: 90, sleep_rested: 3 })).toBe(false);
    expect(isSleepMismatch({ sleep_score: 90, sleep_rested: null })).toBe(false);
  });
});

describe('summarizeSleepByShift', () => {
  const night = (shift_key: string | null, sleep_score: number | null, sleep_rested: number | null) => ({
    shift_key,
    sleep_score,
    sleep_rested,
  });

  it('műszakonként átlagol, csak a kitöltött kipihentségű éjszakákból', () => {
    const result = summarizeSleepByShift([
      night('reggeles', 80, 2),
      night('reggeles', 74, 3),
      night('reggeles', 60, null),
      night('delutanos', null, 4),
    ]);
    expect(result).toEqual([
      { shiftKey: 'reggeles', label: 'Reggeles', nights: 2, avgRested: 2.5, avgScore: 77, mismatches: 1 },
      { shiftKey: 'delutanos', label: 'Délutános', nights: 1, avgRested: 4, avgScore: null, mismatches: 0 },
    ]);
  });

  it('a kipihentséget 1 tizedesre kerekíti', () => {
    const [group] = summarizeSleepByShift([night('ejszakas', 50, 2), night('ejszakas', 50, 2), night('ejszakas', 50, 3)]);
    expect(group.avgRested).toBe(2.3);
  });

  it('fix sorrendet ad, a hiányzó és ismeretlen műszak a „Nincs megadva” csoportba kerül a végére', () => {
    const result = summarizeSleepByShift([
      night(null, 70, 4),
      night('valami', 70, 4),
      night('pihenonap', 85, 5),
      night('reggeles', 60, 3),
    ]);
    expect(result.map((g) => g.label)).toEqual(['Reggeles', 'Pihenőnap', 'Nincs megadva']);
    expect(result[2].nights).toBe(2);
  });

  it('üres bemenetre üres listát ad', () => {
    expect(summarizeSleepByShift([])).toEqual([]);
  });
});

describe('summarizeSleepTrend', () => {
  it('a rossz éjszakákat a mobil szabályával számolja, az adat nélküli napokat kihagyja', () => {
    expect(
      summarizeSleepTrend([
        { sleep_score: 82, sleep_rested: 2 },
        { sleep_score: 50, sleep_rested: null },
        { sleep_score: 76, sleep_rested: 4 },
        { sleep_score: null, sleep_rested: null },
      ]),
    ).toEqual({ nights: 3, poorNights: 2, avgScore: 69, avgRested: 3 });
  });

  it('adat nélkül nullás összesítést ad', () => {
    expect(summarizeSleepTrend([])).toEqual({ nights: 0, poorNights: 0, avgScore: null, avgRested: null });
  });
});
