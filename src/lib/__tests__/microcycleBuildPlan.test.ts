import { describe, it, expect } from 'vitest';
import { buildMicrocyclePlan, addDays } from '../microcycle/buildPlan';
import type { MicrocycleRequest } from '../microcycle/types';

const baseReq = (overrides: Partial<MicrocycleRequest> & { params: MicrocycleRequest['params'] }): MicrocycleRequest => ({
  userId: 'user-1',
  name: 'Teszt program',
  startDate: '2026-07-06', // hétfő
  weekCount: 4,
  ...overrides,
});

describe('addDays', () => {
  it('TZ-független dátumösszeadás', () => {
    expect(addDays('2026-07-06', 0)).toBe('2026-07-06');
    expect(addDays('2026-07-06', 4)).toBe('2026-07-10');
    expect(addDays('2026-07-06', 7)).toBe('2026-07-13');
    // hónaphatár átlépése
    expect(addDays('2026-07-30', 4)).toBe('2026-08-03');
  });
});

describe('buildMicrocyclePlan – longevity', () => {
  const req = baseReq({
    weekCount: 4,
    params: { mode: 'longevity', agtVariant: 'KETTLEBELL_SWING' },
  });

  it('heti 3 session × 4 hét = 12 session', () => {
    const { sessions } = buildMicrocyclePlan(req);
    expect(sessions).toHaveLength(12);
  });

  it('a modalitások a megfelelő hétköznapokra esnek (H/Sze/P)', () => {
    const { sessions } = buildMicrocyclePlan(req);
    const week1 = sessions.filter((s) => s.week === 1);
    expect(week1.map((s) => s.date)).toEqual(['2026-07-06', '2026-07-08', '2026-07-10']);
    expect(week1.map((s) => s.generator.kind)).toEqual(['longevity', 'longevity', 'longevity']);
    expect(week1.map((s) => (s.generator.kind === 'longevity' ? s.generator.modality : null))).toEqual([
      'STRENGTH',
      'STATO_DYNAMIC',
      'AGT',
    ]);
  });

  it('a sourceWeek a héttel nő, a sequence folytonos', () => {
    const { sessions } = buildMicrocyclePlan(req);
    expect(sessions.map((s) => s.sequence)).toEqual([...Array(12).keys()]);
    expect(sessions.find((s) => s.week === 3)?.sourceWeek).toBe(3);
  });

  it('weekCount=2 nem ad figyelmeztetést és 6 session', () => {
    const { sessions, warnings } = buildMicrocyclePlan(baseReq({
      weekCount: 2,
      params: { mode: 'longevity' },
    }));
    expect(sessions).toHaveLength(6);
    expect(warnings).toHaveLength(0);
  });
});

describe('buildMicrocyclePlan – periodizált', () => {
  it('3napos × 6 hét = 18 session, H/Sze/P', () => {
    const { sessions } = buildMicrocyclePlan(baseReq({
      weekCount: 6,
      params: { mode: 'periodized', programType: '3napos', trainingFocus: 'ero' },
    }));
    expect(sessions).toHaveLength(18);
    const week1 = sessions.filter((s) => s.week === 1);
    expect(week1.map((s) => s.date)).toEqual(['2026-07-06', '2026-07-08', '2026-07-10']);
    expect(week1.map((s) => (s.generator.kind === 'periodized' ? s.generator.day : null))).toEqual([1, 2, 3]);
  });

  it('a cycleWeek a periodizált generátoron a héttel egyezik', () => {
    const { sessions } = buildMicrocyclePlan(baseReq({
      weekCount: 4,
      params: { mode: 'periodized', programType: '2napos', trainingFocus: 'hipertrofia' },
    }));
    const week2day1 = sessions.find((s) => s.week === 2 && s.generator.kind === 'periodized' && s.generator.day === 1);
    expect(week2day1?.generator.kind).toBe('periodized');
    if (week2day1?.generator.kind === 'periodized') {
      expect(week2day1.generator.cycleWeek).toBe(2);
      expect(week2day1.generator.trainingFocus).toBe('hipertrofia');
    }
  });
});

describe('buildMicrocyclePlan – pwron + clamp', () => {
  it('pwron heti 2 variáns (A/B), H/Cs', () => {
    const { sessions } = buildMicrocyclePlan(baseReq({
      weekCount: 4,
      params: { mode: 'pwron', programType: 'ERO' },
    }));
    expect(sessions).toHaveLength(8);
    const week1 = sessions.filter((s) => s.week === 1);
    expect(week1.map((s) => s.date)).toEqual(['2026-07-06', '2026-07-09']);
    expect(week1.map((s) => (s.generator.kind === 'pwron' ? s.generator.sessionVariant : null))).toEqual(['A', 'B']);
  });

  it('weekCount > max esetén az utolsó hetet ismétli + figyelmeztet', () => {
    const { sessions, warnings } = buildMicrocyclePlan(baseReq({
      weekCount: 6,
      params: { mode: 'longevity' },
    }));
    expect(sessions).toHaveLength(18);
    expect(warnings.length).toBeGreaterThan(0);
    const week5 = sessions.find((s) => s.week === 5);
    const week6 = sessions.find((s) => s.week === 6);
    expect(week5?.sourceWeek).toBe(4);
    expect(week6?.sourceWeek).toBe(4);
  });
});
