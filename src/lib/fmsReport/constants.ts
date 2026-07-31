import { FMS_FOCUS_OPTIONS } from '../exerciseTaxonomy/constants';
import type { FMSFocusId } from '../exerciseTaxonomy/types';
import type { FMSScoreBand } from './types';

/**
 * A 7 teszt kanonikus sorrendje. Egyetlen forrásból (FMS_FOCUS_OPTIONS) származik,
 * hogy a riport, a korrekciók és a taxonómia sose csússzon el egymástól.
 */
export const FMS_TEST_ORDER: FMSFocusId[] = FMS_FOCUS_OPTIONS.map(option => option.id);

export const FMS_MAX_SCORE = FMS_TEST_ORDER.length * 3;

/**
 * Értelmezési sávok. Korábban csak a docs/fms_assessments_table.md-ben léteztek,
 * innentől kódban, hogy a riport és az UI ugyanazt mondja.
 */
export const FMS_SCORE_BANDS: FMSScoreBand[] = [
  {
    id: 'good',
    min: 14,
    max: 21,
    label: 'Jó funkcionális mozgásminta',
    summary:
      'A mozgásminták összességében stabilak. Az edzés terhelhető, a hangsúly a teljesítmény fejlesztésén és a meglévő minőség fenntartásán lehet.',
  },
  {
    id: 'acceptable',
    min: 10,
    max: 13,
    label: 'Elfogadható, korrekcióval',
    summary:
      'Több mozgásmintában kompenzáció látszik. Az edzés mellé célzott korrekciós blokk javasolt, a terhelés fokozatos emelésével.',
  },
  {
    id: 'poor',
    min: 0,
    max: 9,
    label: 'Magas sérülésrizikó',
    summary:
      'A mozgásminták jelentős korlátozottságot mutatnak. Elsődlegesen korrekciós munka javasolt, a nagy terhelésű, összetett gyakorlatok visszafogásával.',
  },
];

/** A 0–3 pontos FMS skála magyar jelentése. */
export const FMS_SCORE_LABELS: Record<number, string> = {
  0: 'Fájdalom a mozgás közben',
  1: 'Nem tudja végrehajtani a mozgást',
  2: 'Végrehajtja, de kompenzációval',
  3: 'Tiszta végrehajtás, kompenzáció nélkül',
};

/**
 * Rövid magyar tesztleírások. (A felvevő űrlapon jelenleg angol leírások vannak;
 * a riport magyar nyelvű, ezért itt saját szövegek szerepelnek.)
 */
export const FMS_TEST_DESCRIPTIONS: Record<FMSFocusId, string> = {
  deep_squat:
    'A csípő, a térd és a boka együttes mozgékonyságát, valamint a vállöv és a törzs stabilitását méri egy szimmetrikus, mély guggolásban.',
  hurdle_step:
    'A lépés mechanikáját vizsgálja: az egyik láb terhelése mellett mennyire marad stabil a csípő és egyenes a törzs.',
  inline_lunge:
    'Szűk alátámasztási felületen méri a csípő mobilitását és a törzs oldalirányú stabilitását, terhelt kitörés-helyzetben.',
  shoulder_mobility:
    'A vállöv kétoldali mozgástartományát méri a rotáció, az abdukció és a lapockamozgás együttesében.',
  active_straight_leg_raise:
    'A hátsó combizom és a vádli nyújthatóságát vizsgálja úgy, hogy közben a medence és az ellenoldali láb stabil marad.',
  trunk_stability_pushup:
    'A törzs szagittális síkú stabilitását méri: a test egyetlen egységként mozdul-e, derékbeesés nélkül.',
  rotary_stability:
    'A törzs több síkú, aszimmetrikus terhelés alatti stabilitását és a vállöv-csípő koordinációt vizsgálja.',
};

/**
 * A PDF hex színei. A jsPDF nem ismeri a Tailwind osztályokat, ezért a világos
 * (Daylight) téma skáláit fixáljuk itt — a forrás a src/index.css megfelelő
 * CSS-változója, kommentben az RGB triplettel.
 */
export const FMS_REPORT_COLORS = {
  primary600: '#0E6E54', // --color-primary-600: 14 110 84
  primary500: '#18966E', // --color-primary-500: 24 150 110
  primary50: '#ECFAF4', // --color-primary-50: 236 250 244
  success500: '#21A859', // --color-success-500: 33 168 89
  warning500: '#E2A90B', // --color-warning-500: 226 169 11
  error500: '#F0445E', // --color-error-500: 240 68 94
  gray900: '#12181A',
  gray600: '#5C6660',
  gray400: '#9AA39C',
  gray200: '#E1E6DF',
  gray50: '#F6F8F4',
  white: '#FFFFFF',
} as const;

/** A 0–3 pontszámhoz tartozó jelzőszín a riportban. */
export function getScoreColor(score: number): string {
  if (score >= 3) return FMS_REPORT_COLORS.success500;
  if (score >= 2) return FMS_REPORT_COLORS.warning500;
  return FMS_REPORT_COLORS.error500;
}
