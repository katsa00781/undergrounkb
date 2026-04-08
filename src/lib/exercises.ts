import {
  createExercise as createExerciseFromService,
  deleteExercise as deleteExerciseFromService,
  ExerciseWithTaxonomy,
  ExerciseWriteInput,
  ExerciseWriteUpdate,
  getExercises as getExercisesFromService,
  updateExercise as updateExerciseFromService,
} from './exerciseService';

export type Exercise = ExerciseWithTaxonomy;

export const CATEGORIES = [
  'Strength Training',
  'Cardio',
  'Kettlebell',
  'Mobility/Flexibility',
  'HIIT',
  'Recovery',
  'FMS',
  'SMR'
] as const;

export const MOVEMENT_PATTERNS: { [key: string]: string[] } = {
  'Kettlebell': [
    'Gait – törzs stabilitás',
    'Gait mászásban – törzs stabilitás',
    'Csípő domináns – bilaterális (FMS aktív lábemelés)',
    'Csípő domináns – unilaterális (ASLR)',
    'Térd domináns – bilaterális (ASLR)',
    'Térd domináns – unilaterális (Kitörés)',
    'Horizontális nyomás – bilaterális (SM + törzs)',
    'Horizontális nyomás – unilaterális (SM + törzs)',
    'Horizontális húzás – bilaterális (SM)',
    'Horizontális húzás – unilaterális (SM + törzs)',
    'Vertikális nyomás – bilaterális',
    'Vertikális nyomás – unilaterális (SM + törzs)',
    'Vertikális húzás – bilaterális',
    'Stabilitás – anti-extenzió',
    'Stabilitás – anti-rotáció',
    'Stabilitás – anti-flexió',
    'Core – egyéb',
    'Lokális gyakorlatok (L)'
  ],
  'FMS': [
    'ASLR korrekció – első pár',
    'ASLR korrekció – második hármas',
    'SM korrekció – első pár',
    'SM korrekció – második hármas',
    'Stabilitás korrekció',
    'Felsőtest mobilizálás',
    'Mobilizálás',
    'Stabilitás – anti-extenzió',
    'Stabilitás – anti-rotáció',
    'Stabilitás – anti-flexió',
    'Térd domináns – bilaterális (ASLR)',
    'Térd domináns – unilaterális (Kitörés)',
    'Csípő domináns – bilaterális (FMS aktív lábemelés)',
    'Csípő domináns – unilaterális (ASLR)',
    'Horizontális nyomás – bilaterális (SM + törzs)'
  ],
  'SMR': [
    'Mobilizálás'
  ],
  'Mobility/Flexibility': [
    'Felsőtest mobilizálás',
    'Mobilizálás'
  ],
  'Recovery': [
    'Mobilizálás',
    'Felsőtest mobilizálás'
  ]
};

// Synonym map to normalize plan labels to canonical movement patterns
export const MOVEMENT_SYNONYMS: Record<string, string> = {
  // Knee dominant
  'Térdomináns BI': 'Térd domináns – bilaterális (ASLR)',
  'Térddomináns BI': 'Térd domináns – bilaterális (ASLR)',
  'Térddomináns Uni': 'Térd domináns – unilaterális (Kitörés)',
  // Hip dominant
  'Csípődomináns BI': 'Csípő domináns – bilaterális (FMS aktív lábemelés)',
  'Csípődomináns Uni': 'Csípő domináns – unilaterális (ASLR)',
  // Horizontal push/pull
  'Horizontális nyomás bi': 'Horizontális nyomás – bilaterális (SM + törzs)',
  'Horizontális nyomás uni': 'Horizontális nyomás – unilaterális (SM + törzs)',
  'Horizontális húzás bi': 'Horizontális húzás – bilaterális (SM)',
  'Horizontális húzás uni': 'Horizontális húzás – unilaterális (SM + törzs)',
  // Vertical push/pull (default to bilateral if unspecified)
  'Vertikális nyomás': 'Vertikális nyomás – bilaterális',
  'Vertikális Húzás': 'Vertikális húzás – bilaterális',
  // Gait/Core
  'Gait': 'Gait – törzs stabilitás',
  'Core': 'Core – egyéb',
  // FMS corrections (generic to stability correction as fallback)
  'FMS korrekció': 'Stabilitás korrekció',
  // Mobilization generic
  'Mobilizálás': 'Mobilizálás'
};

// Normalize a label from a plan into a canonical movement pattern string
export function normalizeMovementPattern(label: string): string {
  const trimmed = label.trim();
  // If already canonical, return as-is
  const kettlebellPatterns = MOVEMENT_PATTERNS['Kettlebell'];
  if (kettlebellPatterns.includes(trimmed)) return trimmed;
  // Try synonyms (case-sensitive keys as provided above)
  const synonym = MOVEMENT_SYNONYMS[trimmed];
  return synonym ?? trimmed;
}

// Check if a normalized label exists in canonical movement patterns
export function hasMovementPattern(label: string): boolean {
  const normalized = normalizeMovementPattern(label);
  return MOVEMENT_PATTERNS['Kettlebell'].includes(normalized);
}

export async function getExercises() {
  return getExercisesFromService({
    orderBy: {
      column: 'created_at',
      ascending: false,
    },
  });
}

export async function createExercise(exercise: ExerciseWriteInput) {
  return createExerciseFromService(exercise);
}

export async function updateExercise(id: string, exercise: ExerciseWriteUpdate) {
  return updateExerciseFromService(id, exercise);
}

export async function deleteExercise(id: string) {
  return deleteExerciseFromService(id);
}