import { FMS_MAX_SCORE, FMS_SCORE_LABELS } from './constants';
import type { FMSReportRow, FMSRiskAssessment, FMSRiskLevel, FMSRiskLevelId, FMSScoreBand } from './types';

/**
 * A riport értelmezése — az összpontszám **önmagában nem elég**.
 *
 * Az FMS protokoll szerint egy 0 vagy 1 pontos mozgásminta, illetve a két oldal
 * közötti különbség önállóan is korrekciós indok, akkor is, ha az összpontszám
 * a 14-es küszöb fölött van (pl. 18/21 egyetlen 1 pontos ASLR mellett). A
 * korábbi riport csak a pontsávot (`FMS_SCORE_BANDS`) mondta ki a fejlécben, így
 * ilyen esetben azt állította, hogy „a mozgásminták összességében stabilak".
 */
export const FMS_RISK_LEVELS: Record<FMSRiskLevelId, FMSRiskLevel> = {
  ready: {
    id: 'ready',
    label: 'Jó funkcionális mozgásminta',
    summary:
      'Egyetlen mozgásminta sem esett 2 pont alá, és nincs kimutatott oldalkülönbség. Az edzés '
      + 'terhelhető, a hangsúly a teljesítmény fejlesztésén és a meglévő minőség fenntartásán lehet.',
  },
  corrective: {
    id: 'corrective',
    label: 'Korrekció szükséges',
    summary:
      'Az összpontszám önmagában kedvező lehet, de egy 1 pontos mozgásminta vagy a két oldal '
      + 'közötti különbség önállóan is korrekciós indok. Az érintett minták terhelése visszafogandó, '
      + 'amíg a pontszámuk 2-re nem javul.',
  },
  restricted: {
    id: 'restricted',
    label: 'Korlátozott terhelhetőség',
    summary:
      'A felmérés fájdalmat vagy 0 pontos mozgásmintát jelzett, illetve az összpontszám nagyon '
      + 'alacsony. Elsődlegesen korrekciós munka javasolt; fájdalom esetén az érintett mozgásmintát '
      + 'az orvosi kivizsgálás eredményéig nem szabad terhelni.',
  },
};

/** A pontsáv önmagában is meghatároz egy minimális kockázati szintet. */
const BAND_RISK_LEVEL: Record<FMSScoreBand['id'], FMSRiskLevelId> = {
  good: 'ready',
  acceptable: 'corrective',
  poor: 'restricted',
};

/** Súlyosság szerint növekvő sorrend — a végső szint a legrosszabb indok szintje. */
const LEVEL_SEVERITY: Record<FMSRiskLevelId, number> = {
  ready: 0,
  corrective: 1,
  restricted: 2,
};

function worse(a: FMSRiskLevelId, b: FMSRiskLevelId): FMSRiskLevelId {
  return LEVEL_SEVERITY[a] >= LEVEL_SEVERITY[b] ? a : b;
}

/**
 * A fejlécben megjelenő értékelés indokai — konkrét, ellenőrizhető megállapítások,
 * hogy a szöveges összegzés és a részletes tábla ne mondhasson mást.
 */
function buildReasons(rows: FMSReportRow[], totalScore: number, band: FMSScoreBand): string[] {
  const reasons: string[] = [];

  rows.forEach(row => {
    if (row.score !== 0) return;

    reasons.push(
      row.clearingPain && row.clearingTest
        ? `${row.label}: 0 pont — a(z) „${row.clearingTest.label}” fájdalmat provokált`
        : `${row.label}: 0 pont — ${FMS_SCORE_LABELS[0].toLowerCase()}`,
    );
  });

  rows.forEach(row => {
    if (row.score !== 1) return;
    reasons.push(`${row.label}: 1 pont — ${FMS_SCORE_LABELS[1].toLowerCase()}`);
  });

  rows.forEach(row => {
    if (!row.hasAsymmetry || !row.sides) return;
    reasons.push(`${row.label}: oldalkülönbség (bal ${row.sides.left} / jobb ${row.sides.right})`);
  });

  if (band.id !== 'good') {
    reasons.push(`Összpontszám ${totalScore} / ${FMS_MAX_SCORE} — a 14 pontos küszöb alatt`);
  }

  return reasons;
}

/**
 * A riport tényleges értékelése. Tiszta függvény: a sorokból (beszámított pont,
 * clearing teszt, oldalankénti pontok) és a pontsávból dolgozik.
 */
export function resolveFMSRisk(
  rows: FMSReportRow[],
  totalScore: number,
  band: FMSScoreBand,
): FMSRiskAssessment {
  const hasPain = rows.some(row => row.score === 0 || row.clearingPain);
  const limitedRows = rows.filter(row => row.score === 1);
  const asymmetricRows = rows.filter(row => row.hasAsymmetry);

  let level: FMSRiskLevelId = BAND_RISK_LEVEL[band.id];

  if (limitedRows.length > 0 || asymmetricRows.length > 0) {
    level = worse(level, 'corrective');
  }
  if (hasPain) {
    level = worse(level, 'restricted');
  }

  return {
    ...FMS_RISK_LEVELS[level],
    reasons: buildReasons(rows, totalScore, band),
  };
}
