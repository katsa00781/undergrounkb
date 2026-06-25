import { describe, it, expect } from 'vitest';
import { identifyFMSCorrections } from '../workoutGenerator/fmsCorrections';
import { makeFMSAssessment } from './fixtures';

describe('identifyFMSCorrections', () => {
  it('null felmérésre üres listát ad', () => {
    expect(identifyFMSCorrections(null)).toEqual([]);
  });

  it('hibátlan (minden pontszám >= 2) felmérésre nincs korrekció', () => {
    expect(identifyFMSCorrections(makeFMSAssessment())).toEqual([]);
  });

  it('2 alatti pontszámra a megfelelő minta korrekcióját ajánlja', () => {
    const corrections = identifyFMSCorrections(makeFMSAssessment({ deep_squat: 1 }));
    expect(corrections).toHaveLength(1);
    expect([
      'Csípő mozgékonyság javítása',
      'Boka dorziflexió fejlesztése',
      'Core stabilizáció',
    ]).toContain(corrections[0]);
  });

  it('több gyenge minta esetén mintánként egy korrekciót ad', () => {
    const corrections = identifyFMSCorrections(
      makeFMSAssessment({ deep_squat: 1, shoulder_mobility: 0 }),
    );
    expect(corrections).toHaveLength(2);
  });

  it('a meta-mezőket (total_score, notes, id) nem értelmezi pontszámként', () => {
    // total_score 1, de nem szabad korrekciót generálnia
    const corrections = identifyFMSCorrections(makeFMSAssessment({ total_score: 1 }));
    expect(corrections).toEqual([]);
  });
});
