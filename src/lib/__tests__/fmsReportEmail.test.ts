import { describe, expect, it, vi } from 'vitest';
import { buildFMSReportModel } from '@/lib/fmsReport/buildReportModel';
import { makeFMSAssessment, makeFMSDraft, makeSidedFMSAssessment } from './fixtures';

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

  it('fájdalom esetén orvosi kivizsgálásra hívja fel a figyelmet', () => {
    expect(buildDefaultEmailContent(buildModel({ shoulder_mobility: 0 })).bodyText).toContain(
      'orvosi kivizsgálás javasolt',
    );
  });

  it('fájdalom nélkül nem tesz bele figyelmeztetést', () => {
    expect(buildDefaultEmailContent(buildModel()).bodyText).not.toContain('orvosi kivizsgálás');
  });

  it('megadja a korrekciót igénylő mozgásminták számát', () => {
    const { bodyText } = buildDefaultEmailContent(buildModel({ deep_squat: 1, hurdle_step: 0 }));

    expect(bodyText).toContain('(2 mozgásminta)');
  });

  it('jó összpontszám mellett is a korrekciós értékelést írja ki, indoklással', () => {
    // 18 / 21, de az aktív egyenes lábemelés az egyik oldalon 1 pont.
    const model = buildFMSReportModel({
      assessment: makeSidedFMSAssessment(
        makeFMSDraft({
          active_straight_leg_raise_left: 1,
          active_straight_leg_raise_right: 3,
          deep_squat: 2,
        }),
      ),
      clientName: 'Teszt Elek',
      clientEmail: 'teszt@example.com',
      trainerName: 'Edző Béla',
    });

    const { bodyText } = buildDefaultEmailContent(model);

    expect(bodyText).toContain('18 / 21');
    expect(bodyText).toContain('Értékelés: Korrekció szükséges');
    expect(bodyText).not.toContain('Jó funkcionális mozgásminta');
    expect(bodyText).toContain('- Aktív nyújtott lábemelés: 1 pont');
    expect(bodyText).toContain('- Aktív nyújtott lábemelés: oldalkülönbség (bal 1 / jobb 3)');
  });

  it('hibátlan felmérésnél nincs "kiemelt megállapítás" blokk', () => {
    expect(buildDefaultEmailContent(buildModel()).bodyText).not.toContain('Kiemelt megállapítások');
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
