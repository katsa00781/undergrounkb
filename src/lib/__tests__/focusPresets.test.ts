import { describe, it, expect } from 'vitest';
import { getFocusPreset, applyFocusPresetToSections } from '../workoutGenerator/focusPresets';
import { getTrainingFocusLabel } from '../workoutGenerator/types';
import type { WorkoutSectionGenerated } from '../workoutGenerator/types';

describe('getFocusPreset', () => {
  it('a robbanékonyság fókusz heti periodizációt használ (week befolyásolja a fő blokkot)', () => {
    const week1 = getFocusPreset('robbanekonysag', 1);
    const week3 = getFocusPreset('robbanekonysag', 3);
    expect(week1.main).not.toEqual(week3.main);
    expect(week1.label).toBe('Robbanékonyság');
  });

  it('az állóképesség fókusz munkaidőt a héttel növeli', () => {
    const week1 = getFocusPreset('allokepesseg', 1);
    const week4 = getFocusPreset('allokepesseg', 4);
    expect(week1.summary).toContain('6 perc');
    expect(week4.summary).toContain('9 perc');
  });

  it('a hipertrófia fókusz fix presetet ad (héttől független)', () => {
    expect(getFocusPreset('hipertrofia', 1)).toEqual(getFocusPreset('hipertrofia', 5));
  });

  it('minden fókusz teljes preset-struktúrát ad (main/accessory/core/carry/correction)', () => {
    const focuses = ['ero', 'robbanekonysag', 'allokepesseg', 'hipertrofia', 'max_ero_hipertrofia', 'max_ero', 'hipertrofia_zsircsokkentes'] as const;
    for (const focus of focuses) {
      const preset = getFocusPreset(focus, 1);
      expect(preset.label).toBe(getTrainingFocusLabel(focus));
      for (const role of ['main', 'accessory', 'core', 'carry', 'correction'] as const) {
        expect(preset[role].sets).toBeGreaterThan(0);
        expect(preset[role].reps).toBeTruthy();
        expect(preset[role].restPeriod).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('applyFocusPresetToSections', () => {
  const sections: WorkoutSectionGenerated[] = [
    {
      name: 'Fő blokk',
      exercises: [
        { exerciseId: 'kb-press', name: 'Kettlebell nyomás', sets: 0, reps: '' },
        { exerciseId: 'fms-mobil', name: 'FMS mobilizálás', sets: 0, reps: '' },
        { exerciseId: 'carry-1', name: 'Cipelés farmer', sets: 0, reps: '' },
        { exerciseId: 'core-1', name: 'Core plank stabil', sets: 0, reps: '' },
      ],
    },
  ];

  it('a gyakorlat szerepe szerint a megfelelő preset-konfigurációt alkalmazza', () => {
    const preset = getFocusPreset('ero', 1);
    const [section] = applyFocusPresetToSections(sections, preset);
    const [main, correction, carry, core] = section.exercises;

    expect(main.sets).toBe(preset.main.sets);
    expect(correction.sets).toBe(preset.correction.sets);
    expect(carry.sets).toBe(preset.carry.sets);
    expect(core.sets).toBe(preset.core.sets);
  });

  it('nem mutálja az eredeti szekciókat', () => {
    const preset = getFocusPreset('ero', 1);
    applyFocusPresetToSections(sections, preset);
    expect(sections[0].exercises[0].sets).toBe(0);
  });

  it('az intenzitást beleírja az instruction mezőbe, ha van', () => {
    const preset = getFocusPreset('max_ero', 1);
    const [section] = applyFocusPresetToSections(sections, preset);
    expect(section.exercises[0].instruction).toContain('Célterhelés');
  });
});
