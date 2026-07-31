import { describe, expect, it } from 'vitest';
import { buildFMSReportModel } from '@/lib/fmsReport/buildReportModel';
import { makeFMSAssessment, makeFMSDraft, makeSidedFMSAssessment } from './fixtures';

/**
 * Az értékelés (`model.risk`) nem eshet egybe a puszta pontsávval: az FMS-ben egy
 * 1 pontos vagy aszimmetrikus mozgásminta akkor is korrekciós indok, ha az
 * összpontszám a 14-es küszöb fölött van.
 */
function buildModel(assessment = makeFMSAssessment()) {
  return buildFMSReportModel({
    assessment,
    clientName: 'Teszt Elek',
    clientEmail: 'teszt@example.com',
    trainerName: 'Edző Béla',
  });
}

/** Oldalankénti pontokból épített felmérés (a beszámított pontot a prod logika adja). */
function buildSidedModel(overrides: Parameters<typeof makeFMSDraft>[0]) {
  return buildModel(makeSidedFMSAssessment(makeFMSDraft(overrides)));
}

describe('FMS értékelés (risk)', () => {
  it('hibátlan felmérésnél "jó" szint, indoklás nélkül', () => {
    const model = buildModel();

    expect(model.risk.id).toBe('ready');
    expect(model.risk.label).toBe('Jó funkcionális mozgásminta');
    expect(model.risk.reasons).toEqual([]);
  });

  it('1 pontos, aszimmetrikus mozgásminta jó pontsáv mellett is korrekciót jelez', () => {
    // A bejelentett eset: 1 pontos aktív nyújtott lábemelés az egyik oldalon,
    // 18 / 21 összpontszámmal (a "jó" sávban).
    const model = buildSidedModel({
      active_straight_leg_raise_left: 1,
      active_straight_leg_raise_right: 3,
      deep_squat: 2,
    });

    expect(model.totalScore).toBe(18);
    // A pontsáv továbbra is a jó tartomány — de az értékelés már nem az.
    expect(model.band.id).toBe('good');
    expect(model.risk.id).toBe('corrective');
    expect(model.risk.label).toBe('Korrekció szükséges');
    expect(model.risk.summary).not.toContain('összességében stabilak');

    expect(model.risk.reasons).toContain(
      'Aktív nyújtott lábemelés: 1 pont — nem tudja végrehajtani a mozgást',
    );
    expect(model.risk.reasons).toContain(
      'Aktív nyújtott lábemelés: oldalkülönbség (bal 1 / jobb 3)',
    );
  });

  it('önmagában az oldalkülönbség is korrekciót jelez', () => {
    const model = buildSidedModel({ hurdle_step_left: 2, hurdle_step_right: 3 });

    // 20 / 21, egyetlen minta sem esett 2 pont alá.
    expect(model.totalScore).toBe(20);
    expect(model.risk.id).toBe('corrective');
    expect(model.risk.reasons).toEqual(['Akadálylépés: oldalkülönbség (bal 2 / jobb 3)']);
  });

  it('a 0 pontos (fájdalmas) mozgásminta korlátozott terhelhetőséget jelez', () => {
    const model = buildModel(makeFMSAssessment({ trunk_stability_pushup: 0, total_score: 18 }));

    expect(model.risk.id).toBe('restricted');
    expect(model.risk.label).toBe('Korlátozott terhelhetőség');
    expect(model.risk.reasons[0]).toBe(
      'Törzsstabil fekvőtámasz: 0 pont — fájdalom a mozgás közben',
    );
  });

  it('a pozitív clearing tesztet nevesíti az indoklásban', () => {
    const model = buildSidedModel({ rs_clearing: true });

    expect(model.risk.id).toBe('restricted');
    expect(model.risk.reasons[0]).toBe(
      'Rotációs stabilitás: 0 pont — a(z) „Gerinc-flexiós clearing teszt” fájdalmat provokált',
    );
  });

  it('a gyenge pontsáv önmagában is rontja az értékelést', () => {
    // 13 / 21 → "elfogadható" sáv, fájdalom nélkül.
    const model = buildModel(
      makeFMSAssessment({
        deep_squat: 2,
        hurdle_step: 2,
        inline_lunge: 2,
        shoulder_mobility: 2,
        total_score: 13,
      }),
    );

    expect(model.totalScore).toBe(13);
    expect(model.risk.id).toBe('corrective');
    expect(model.risk.reasons).toContain('Összpontszám 13 / 21 — a 14 pontos küszöb alatt');
  });

  it('az indokok sorrendje: fájdalom → gyenge minta → oldalkülönbség → összpontszám', () => {
    const model = buildSidedModel({
      tspu_clearing: true,
      deep_squat: 1,
      shoulder_mobility_left: 2,
      shoulder_mobility_right: 3,
    });

    expect(model.risk.reasons.map(reason => reason.split(':')[0])).toEqual([
      'Törzsstabil fekvőtámasz',
      'Mély guggolás',
      'Vállmobilitás',
    ]);
  });

  it('determinisztikus: azonos felmérésből azonos értékelés', () => {
    const assessment = makeSidedFMSAssessment(makeFMSDraft({ inline_lunge_left: 1 }));

    expect(buildModel(assessment).risk).toEqual(buildModel(assessment).risk);
  });
});
