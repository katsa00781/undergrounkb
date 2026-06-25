import { describe, it, expect } from 'vitest';
import {
  buildLongevitySessionMeta,
  validateLongevitySession,
  getLongevityModalityDay,
  getLongevityModalityLabel,
  LongevityWeekNumber,
} from '../longevityWorkoutGenerator';

describe('buildLongevitySessionMeta – modalitás-leképezés', () => {
  it('a STRENGTH nap hétfő és HIGH CNS-terhelésű', () => {
    const meta = buildLongevitySessionMeta(1, 'STRENGTH');
    expect(meta.day).toBe('Hétfő');
    expect(meta.cnsLoad).toBe('HIGH');
    expect(meta.strength).toBeDefined();
    expect(meta.stato).toBeUndefined();
    expect(meta.agt).toBeUndefined();
  });

  it('a STATO_DYNAMIC nap szerda és LOW CNS-terhelésű', () => {
    const meta = buildLongevitySessionMeta(1, 'STATO_DYNAMIC');
    expect(meta.day).toBe('Szerda');
    expect(meta.cnsLoad).toBe('LOW');
    expect(meta.stato?.tempo).toBe('2-0-2-0');
  });

  it('az AGT nap péntek és LOW CNS-terhelésű', () => {
    const meta = buildLongevitySessionMeta(1, 'AGT');
    expect(meta.day).toBe('Péntek');
    expect(meta.cnsLoad).toBe('LOW');
    expect(meta.agt?.maxHr).toBe(130);
  });
});

describe('buildLongevitySessionMeta – heti progresszió', () => {
  it('az erő szettszám hétről hétre nő (3 → 5)', () => {
    expect(buildLongevitySessionMeta(1, 'STRENGTH').strength?.sets).toBe(3);
    expect(buildLongevitySessionMeta(2, 'STRENGTH').strength?.sets).toBe(4);
    expect(buildLongevitySessionMeta(4, 'STRENGTH').strength?.sets).toBe(5);
  });

  it('a stato sorozatidő és terhelés a héttel emelkedik', () => {
    expect(buildLongevitySessionMeta(1, 'STATO_DYNAMIC').stato?.workSec).toBe(30);
    expect(buildLongevitySessionMeta(3, 'STATO_DYNAMIC').stato?.workSec).toBe(40);
    expect(buildLongevitySessionMeta(1, 'STATO_DYNAMIC').stato?.loadPct).toBe('30%');
  });

  it('az AGT körök hetente pontosan +3-mal nőnek (15 → 24)', () => {
    const rounds = ([1, 2, 3, 4] as LongevityWeekNumber[]).map(
      (week) => buildLongevitySessionMeta(week, 'AGT').agt?.rounds,
    );
    expect(rounds).toEqual([15, 18, 21, 24]);
  });
});

describe('buildLongevitySessionMeta – AGT változatok', () => {
  it('alapértelmezetten kettlebell swing (8 mp / 52 mp)', () => {
    const agt = buildLongevitySessionMeta(1, 'AGT').agt;
    expect(agt?.exerciseName).toBe('Kettlebell swing');
    expect(agt?.workSec).toBe(8);
    expect(agt?.restSec).toBe(52);
  });

  it('az Airdyne változat más eszközt és munka/pihenő párost ad', () => {
    const agt = buildLongevitySessionMeta(1, 'AGT', 'AIRDYNE').agt;
    expect(agt?.exerciseName).toContain('Airdyne');
    expect(agt?.workSec).toBe(7);
  });
});

describe('validateLongevitySession – invariánsok (spec 9. fej.)', () => {
  it('a helyes sablon nem ad figyelmeztetést', () => {
    expect(validateLongevitySession(buildLongevitySessionMeta(1, 'STRENGTH'))).toEqual([]);
    expect(validateLongevitySession(buildLongevitySessionMeta(3, 'AGT'))).toEqual([]);
  });

  it('HIGH CNS nap nem hétfői napon figyelmeztetést ad', () => {
    const meta = buildLongevitySessionMeta(1, 'STRENGTH');
    const tampered = { ...meta, day: 'Szerda' as const };
    const warnings = validateLongevitySession(tampered);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('hét elejére');
  });
});

describe('címke- és nap-getterek', () => {
  it('a modalitás magyar címkét és napot ad vissza', () => {
    expect(getLongevityModalityLabel('STRENGTH')).toBe('Erőfejlesztés');
    expect(getLongevityModalityDay('AGT')).toBe('Péntek');
  });
});
