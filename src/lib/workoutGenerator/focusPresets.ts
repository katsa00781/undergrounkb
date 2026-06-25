import {
  CycleWeek,
  FocusPreset,
  PrescriptionConfig,
  TrainingFocus,
  WorkoutExercise,
  WorkoutSectionGenerated,
  getTrainingFocusLabel,
} from './types';

const POWER_WEEK_PRESETS: Record<CycleWeek, PrescriptionConfig> = {
  1: { sets: 6, reps: '5', restPeriod: 180, intensity: '30-50% 1RM', note: 'Összismétlés: 30-40 / gyakorlat • Szettminták: 6x6, 6x4, 6x5' },
  2: { sets: 6, reps: '6', restPeriod: 180, intensity: '30-50% 1RM', note: 'Összismétlés: 30-40 / gyakorlat • Szettminták: 6x6, 6x4, 6x5' },
  3: { sets: 4, reps: '4', restPeriod: 210, intensity: '50-80% 1RM', note: 'Összismétlés: 12-16 / gyakorlat • Szettminták: 4x3, 5x3, 4x4' },
  4: { sets: 5, reps: '3', restPeriod: 210, intensity: '50-80% 1RM', note: 'Összismétlés: 12-16 / gyakorlat • Szettminták: 4x3, 5x3, 4x4' },
  5: { sets: 4, reps: '3', restPeriod: 210, intensity: '30-50% 1RM', note: 'Összismétlés: 12-16 / gyakorlat • 1 fő gyakorlat' },
  6: { sets: 6, reps: '5', restPeriod: 210, intensity: '30-50% 1RM', note: 'Összismétlés: 30-40 / gyakorlat • Szettminták: 6x6, 6x4, 6x5' },
};

const STRENGTH_WEEK_PRESETS: Record<CycleWeek, PrescriptionConfig> = {
  1: { sets: 5, reps: '5', restPeriod: 105, intensity: '75-80% 1RM', note: 'Összismétlés: 25-30 / gyakorlat • 2-3 fő gyakorlat • 2 kiegészítő' },
  2: { sets: 4, reps: '3', restPeriod: 135, intensity: '70-80% 1RM', note: 'Összismétlés: 12-15 / gyakorlat • 3 fő gyakorlat • 2 kiegészítő' },
  3: { sets: 5, reps: '2', restPeriod: 150, intensity: '80-90% 1RM', note: 'Összismétlés: 9-10 / gyakorlat • Szettminták: 6x3, 5x2, 5x3, 6x2, 3x3, 4x3' },
  4: { sets: 3, reps: '3', restPeriod: 150, intensity: '80-90% 1RM', note: 'Összismétlés: 9-10 / gyakorlat • Szettminták: 6x3, 5x2, 5x3, 6x2, 3x3, 4x3' },
  5: { sets: 5, reps: '2', restPeriod: 150, intensity: '80-90% 1RM', note: 'Összismétlés: 9-10 / gyakorlat • Szettminták: 6x3, 5x2, 5x3, 6x2, 3x3, 4x3' },
  6: { sets: 5, reps: '3', restPeriod: 135, intensity: '70-80% 1RM', note: 'Összismétlés: 12-15 / gyakorlat • 3 fő gyakorlat • 2 kiegészítő' },
};

export function getFocusPreset(focus: TrainingFocus, week: CycleWeek): FocusPreset {
  if (focus === 'robbanekonysag') {
    const main = POWER_WEEK_PRESETS[week];
    return {
      label: getTrainingFocusLabel(focus),
      summary: `${main.intensity}, pihenő ${main.restPeriod} mp, ${main.note}`,
      main,
      accessory: { sets: 3, reps: '6-8', restPeriod: 90, intensity: '30-50% 1RM', note: 'Technikai kivitelezés, robbanékony szándék' },
      core: { sets: 3, reps: '8-10', restPeriod: 60, note: 'Törzsstabilitás és kontroll' },
      carry: { sets: 3, reps: '20-30 méter', restPeriod: 60, note: 'Minőségi tartás és gait kontroll' },
      correction: { sets: 2, reps: '8-10', restPeriod: 45, note: 'Sérülésmegelőzés és mozgásminőség' },
    };
  }

  if (focus === 'allokepesseg') {
    const duration = 5 + week;
    const rest = week <= 2 ? 90 : 80;
    return {
      label: getTrainingFocusLabel(focus),
      summary: `15 mp munka / gyakorlat, ${rest} mp pihenő, ${duration} perc munkaidő`,
      main: { sets: 1, reps: `${duration} perc blokk • 15 mp munka`, restPeriod: rest, note: 'Metcon vagy körmunka jellegű főblokk' },
      accessory: { sets: 3, reps: '15 mp', restPeriod: rest, note: 'Folyamatos tempó, alacsony holtidő' },
      core: { sets: 3, reps: '15-30 mp', restPeriod: 30, note: 'Állóképességi törzsmunka' },
      carry: { sets: 4, reps: '20-30 méter', restPeriod: 45, note: 'Kondicionáló cipelés' },
      correction: { sets: 2, reps: '8-10', restPeriod: 30, note: 'Mozgásminőség fenntartása' },
    };
  }

  if (focus === 'hipertrofia') {
    return {
      label: getTrainingFocusLabel(focus),
      summary: '36-50 ismétlés, 70-80% 1RM, 1-2 perc pihenő, 6-9 gyakorlat',
      main: { sets: 4, reps: '12', restPeriod: 90, intensity: '70-80% 1RM', note: 'Szettminták: 4x12, 5x10, 5x8' },
      accessory: { sets: 5, reps: '10', restPeriod: 75, intensity: '70-80% 1RM', note: 'Volumen fókusz, 2-4 edzés / hét izomcsoportonként' },
      core: { sets: 3, reps: '12-15', restPeriod: 45 },
      carry: { sets: 3, reps: '20-30 méter', restPeriod: 45 },
      correction: { sets: 2, reps: '10-12', restPeriod: 30 },
    };
  }

  if (focus === 'max_ero_hipertrofia') {
    return {
      label: getTrainingFocusLabel(focus),
      summary: '24-36 ismétlés, 80-90% 1RM, 2-3 perc pihenő, 4-6 gyakorlat',
      main: { sets: 6, reps: '5', restPeriod: 150, intensity: '80-90% 1RM', note: 'Szettminták: 6x6, 5x5, 6x5, 7x4' },
      accessory: { sets: 4, reps: '6-8', restPeriod: 120, intensity: '75-85% 1RM', note: '2-4 edzés / hét izomcsoportonként' },
      core: { sets: 3, reps: '10-12', restPeriod: 60 },
      carry: { sets: 3, reps: '20-30 méter', restPeriod: 60 },
      correction: { sets: 2, reps: '8-10', restPeriod: 45 },
    };
  }

  if (focus === 'max_ero') {
    return {
      label: getTrainingFocusLabel(focus),
      summary: '9-15 ismétlés, 85-95% 1RM, 3-6 perc pihenő, 3-5 gyakorlat',
      main: { sets: 5, reps: '3', restPeriod: 240, intensity: '85-95% 1RM', note: 'Szettminták: 4x3, 5x3, 6x2' },
      accessory: { sets: 3, reps: '5-6', restPeriod: 150, intensity: '75-85% 1RM', note: '2-4 edzés / hét izomcsoportonként' },
      core: { sets: 3, reps: '8-10', restPeriod: 60 },
      carry: { sets: 3, reps: '15-20 méter', restPeriod: 60 },
      correction: { sets: 2, reps: '8-10', restPeriod: 45 },
    };
  }

  if (focus === 'hipertrofia_zsircsokkentes') {
    return {
      label: getTrainingFocusLabel(focus),
      summary: '36-50 ismétlés, 70-80% 1RM, 30-60 mp pihenő, 6-9 gyakorlat',
      main: { sets: 4, reps: '12', restPeriod: 45, intensity: '70-80% 1RM', note: 'Szettminták: 4x12, 5x10, 5x8' },
      accessory: { sets: 5, reps: '10', restPeriod: 30, intensity: '70-80% 1RM', note: 'Sűrített volumen, magasabb anyagcsere-igény' },
      core: { sets: 3, reps: '12-15', restPeriod: 30 },
      carry: { sets: 4, reps: '20-30 méter', restPeriod: 30 },
      correction: { sets: 2, reps: '10-12', restPeriod: 30 },
    };
  }

  const main = STRENGTH_WEEK_PRESETS[week];
  return {
    label: getTrainingFocusLabel('ero'),
    summary: `${main.intensity}, pihenő ${main.restPeriod} mp, ${main.note}`,
    main,
    accessory: { sets: 2, reps: '6-8', restPeriod: 90, intensity: '70-80% 1RM', note: 'Kiegészítő erőfejlesztés • 2 kiegészítő gyakorlat' },
    core: { sets: 3, reps: '8-10', restPeriod: 60, note: 'Törzs és stabilitás' },
    carry: { sets: 3, reps: '20-30 méter', restPeriod: 60, note: 'Erő-állóképességi cipelés' },
    correction: { sets: 2, reps: '8-10', restPeriod: 45, note: 'Korrekció és sérülésmegelőzés' },
  };
}

function classifyExerciseRole(exercise: WorkoutExercise): 'main' | 'core' | 'carry' | 'correction' {
  const token = `${exercise.exerciseId || ''} ${exercise.name || ''}`.toLowerCase();

  if (token.includes('fms') || token.includes('stretch') || token.includes('rehab') || token.includes('mobil')) {
    return 'correction';
  }

  if (token.includes('gait') || token.includes('cipel')) {
    return 'carry';
  }

  if (token.includes('core') || token.includes('rotacios') || token.includes('stabil')) {
    return 'core';
  }

  return 'main';
}

function mergeInstruction(existingInstruction: string | undefined, note: string | undefined, intensity: string | undefined): string | undefined {
  const parts = [existingInstruction, note, intensity ? `Célterhelés: ${intensity}` : undefined].filter(Boolean);
  return parts.length > 0 ? parts.join(' | ') : undefined;
}

function applyConfigToExercise(exercise: WorkoutExercise, config: PrescriptionConfig): WorkoutExercise {
  return {
    ...exercise,
    sets: config.sets,
    reps: config.reps,
    restPeriod: config.restPeriod,
    instruction: mergeInstruction(exercise.instruction, config.note, config.intensity),
  };
}

export function applyFocusPresetToSections(sections: WorkoutSectionGenerated[], preset: FocusPreset): WorkoutSectionGenerated[] {
  return sections.map((section) => ({
    ...section,
    exercises: section.exercises.map((exercise) => {
      const role = classifyExerciseRole(exercise);

      if (role === 'correction') {
        return applyConfigToExercise(exercise, preset.correction);
      }

      if (role === 'carry') {
        return applyConfigToExercise(exercise, preset.carry);
      }

      if (role === 'core') {
        return applyConfigToExercise(exercise, preset.core);
      }

      return applyConfigToExercise(exercise, preset.main);
    }),
  }));
}
