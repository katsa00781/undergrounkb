import { FMSAssessment } from '../fms';

// Az FMS korrekciók listája
const FMS_CORRECTIONS: Record<string, string[]> = {
  deep_squat: [
    'Csípő mozgékonyság javítása',
    'Boka dorziflexió fejlesztése',
    'Core stabilizáció'
  ],
  hurdle_step: [
    'Csípő stabilitás fejlesztése',
    'Egyensúlyfejlesztés',
    'Lépés mechanika javítása'
  ],
  inline_lunge: [
    'Csípő mobilitás javítása',
    'Térd stabilitás fejlesztése',
    'Törzs kontrollfejlesztés'
  ],
  shoulder_mobility: [
    'Váll mobilitás növelése',
    'Mellizom nyújtás',
    'Lapocka stabilitás'
  ],
  active_straight_leg_raise: [
    'Hamstring nyújtás',
    'Csípőhajlító nyújtás',
    'Medence pozíció javítása'
  ],
  trunk_stability_pushup: [
    'Core stabilizáció',
    'Vállöv stabilitás fejlesztése',
    'Plank variációk'
  ],
  rotary_stability: [
    'Rotációs core erősítés',
    'Csípő-vállöv koordináció',
    'Egyoldali stabilitás fejlesztése'
  ]
};

/**
 * Az FMS korrekciók azonosítása a felmérés alapján
 * @param assessment - Az FMS felmérés
 * @returns Az ajánlott korrekciók listája
 */
export function identifyFMSCorrections(assessment: FMSAssessment | null): string[] {
  if (!assessment) return [];

  const corrections: string[] = [];

  // Minden 2 alatti pontszám esetén korrekciós gyakorlatot ajánlunk
  Object.keys(assessment).forEach(key => {
    if (['id', 'user_id', 'date', 'notes', 'created_at', 'updated_at', 'total_score'].includes(key)) {
      return; // Ezeket a mezőket kihagyjuk
    }

    // Biztonságos típuskonverzió
    const score = assessment[key as keyof FMSAssessment];
    if (typeof score === 'number' && score < 2 && FMS_CORRECTIONS[key]) {
      // Véletlenszerűen választunk egy korrekciót a lehetséges opciók közül
      const correction = FMS_CORRECTIONS[key][Math.floor(Math.random() * FMS_CORRECTIONS[key].length)];
      corrections.push(correction);
    }
  });

  return corrections;
}
