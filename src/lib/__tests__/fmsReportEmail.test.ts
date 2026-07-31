import { describe, expect, it, vi } from 'vitest';
import { buildFMSReportModel } from '@/lib/fmsReport/buildReportModel';
import { makeFMSAssessment } from './fixtures';

// A modul a Supabase klienst importálja, amit unit tesztben nem akarunk példányosítani.
vi.mock('@/config/supabase', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const { buildDefaultEmailContent } = await import('@/lib/fmsReportEmail');

function buildModel(overrides: Parameters<typeof makeFMSAssessment>[0] = {}) {
  return buildFMSReportModel({
    assessment: makeFMSAssessment({ date: '2026-03-14', ...overrides }),
    clientName: 'Teszt Elek',
    clientEmail: 'teszt@example.com',
    trainerName: 'Edző Béla',
  });
}

describe('buildDefaultEmailContent', () => {
  it('a tárgy tartalmazza az ügyfél nevét és a formázott dátumot', () => {
    const { subject } = buildDefaultEmailContent(buildModel());

    expect(subject).toContain('Teszt Elek');
    expect(subject).toContain('2026. 03. 14.');
  });

  it('a levélszöveg magyar megszólítást, összpontszámot és aláírást tartalmaz', () => {
    const { bodyText } = buildDefaultEmailContent(buildModel({ total_score: 17 }));

    expect(bodyText).toContain('Kedves Teszt Elek!');
    expect(bodyText).toContain('17 / 21');
    expect(bodyText).toContain('Edző Béla');
  });

  it('jelzi, ha nincs korrekciós javaslat', () => {
    const { bodyText } = buildDefaultEmailContent(buildModel());

    expect(bodyText).toContain('sem volt szükség korrekciós javaslatra');
  });

  it('megadja a korrekciót igénylő mozgásminták számát', () => {
    const { bodyText } = buildDefaultEmailContent(buildModel({ deep_squat: 1, hurdle_step: 0 }));

    expect(bodyText).toContain('(2 mozgásminta)');
  });

  it('edző neve nélkül is működik', () => {
    const model = buildFMSReportModel({
      assessment: makeFMSAssessment(),
      clientName: 'Teszt Elek',
      clientEmail: null,
      trainerName: null,
    });

    expect(buildDefaultEmailContent(model).bodyText).toContain('UG Kettlebell Pro');
  });
});
