import { Dispatch, SetStateAction } from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ArrowRight, ChevronDown, ChevronRight, Copy, Link, Plus, Search, Timer, Trash2 } from 'lucide-react';
import { Exercise } from '../../lib/exercises';
import {
  getExerciseCategories,
  getExerciseCategoryLabel,
  getExerciseFMSFocuses,
  getExerciseTaxonomyDimensionOptions,
  getFMSFocusLabel,
  getFMSFocusOptions,
  getMovementPatternLabel,
} from '../../lib/exerciseService';
import {
  getDifficultyLabel,
  getPlaceholderExerciseMeta,
  Section,
  SectionExercise,
  WorkoutFormData,
} from '../../lib/workoutPlannerHelpers';
import { isComplexSection } from './KettlebellComplexBuilder';
import { isCardioSection } from './CardioSectionBuilder';
import { SectionExerciseFiltersApi } from '../../hooks/useSectionExerciseFilters';

interface WorkoutSectionsEditorProps {
  sections: Section[];
  setSections: Dispatch<SetStateAction<Section[]>>;
  exercises: Exercise[];
  register: UseFormRegister<WorkoutFormData>;
  errors: FieldErrors<WorkoutFormData>;
  collapsedSections: Record<string, boolean>;
  filters: SectionExerciseFiltersApi;
  onToggleCollapse: (sectionId: string) => void;
  onAddSection: () => void;
  onOpenComplexBuilder: () => void;
  onOpenCardioBuilder: () => void;
  onRemoveSection: (sectionIndex: number) => void;
  onDuplicateSection: (sectionIndex: number) => void;
  onAddExercise: (sectionIndex: number) => void;
  onRemoveExercise: (sectionIndex: number, exerciseIndex: number) => void;
  onDuplicateExercise: (sectionIndex: number, exerciseIndex: number) => void;
}

const getSectionSummary = (section: Section) => {
  const setCount = section.exercises.reduce((total, exercise) => total + (exercise.sets || 0), 0);
  return `${section.exercises.length} gyakorlat • ${setCount} sorozat`;
};

const getExerciseSummary = (exercise: SectionExercise) => {
  const prescription = `${exercise.sets || '-'} × ${exercise.reps || '-'}`;
  return exercise.weight ? `${prescription} • ${exercise.weight} kg` : prescription;
};

const getExerciseOptionLabel = (exercise: Exercise, categoryFilter?: string) => {
  if (categoryFilter === 'fms') {
    const primaryFocus = getExerciseFMSFocuses(exercise)[0];
    const focusLabel = getFMSFocusLabel(primaryFocus);

    if (focusLabel) {
      return `${focusLabel} • ${exercise.name}`;
    }
  }

  return exercise.name;
};

const WorkoutSectionsEditor = ({
  sections,
  setSections,
  exercises,
  register,
  errors,
  collapsedSections,
  filters,
  onToggleCollapse,
  onAddSection,
  onOpenComplexBuilder,
  onOpenCardioBuilder,
  onRemoveSection,
  onDuplicateSection,
  onAddExercise,
  onRemoveExercise,
  onDuplicateExercise,
}: WorkoutSectionsEditorProps) => {
  const {
    categoryFilters,
    movementPatternFilters,
    patternFamilyFilters,
    lateralityFilters,
    fmsFocusFilters,
    exerciseSearchQueries,
    getExerciseKey,
    getFilteredExercises,
    getAvailableMovementPatterns,
    updateCategoryFilter,
    updateMovementPatternFilter,
    updatePatternFamilyFilter,
    updateLateralityFilter,
    updateFMSFocusFilter,
    setSearchQuery,
    resetFiltersForExercise,
  } = filters;

  const exerciseCategories = getExerciseCategories();
  const fmsFocusOptions = getFMSFocusOptions();
  const categories = Array.from(new Set(exercises.map(ex => ex.category)));
  const categoryOptions = [
    ...exerciseCategories,
    ...categories
      .filter(category => !exerciseCategories.some(option => option.id === category))
      .map(category => ({ id: category as typeof exerciseCategories[number]['id'], label: getExerciseCategoryLabel(category) })),
  ];
  const patternFamilyOptions = getExerciseTaxonomyDimensionOptions(exercises, 'pattern_family');
  const lateralityOptions = getExerciseTaxonomyDimensionOptions(exercises, 'laterality');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edzés szekciók</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenComplexBuilder}
            className="btn btn-outline flex items-center gap-2 border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/20"
          >
            <Link size={15} />
            KB Komplex
          </button>
          <button
            type="button"
            onClick={onOpenCardioBuilder}
            className="btn btn-outline flex items-center gap-2 border-sky-400 text-sky-700 hover:bg-sky-50 dark:border-sky-600 dark:text-sky-400 dark:hover:bg-sky-900/20"
          >
            <Timer size={15} />
            Kardió
          </button>
          <button
            type="button"
            onClick={onAddSection}
            className="btn btn-outline flex items-center gap-2"
          >
            <Plus size={16} />
            Szekció hozzáadása
          </button>
        </div>
      </div>

      {sections.map((section, sectionIndex) => isCardioSection(section) ? (
        /* ── Kardió szekció ── */
        <div key={section.id} className="rounded-lg border border-sky-300 bg-sky-50 p-4 shadow-sm dark:border-sky-700 dark:bg-sky-950/20 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Timer size={16} className="shrink-0 text-sky-600 dark:text-sky-400" />
              <div>
                <input
                  {...register(`sections.${sectionIndex}.name`)}
                  type="text"
                  className="block rounded-md border border-sky-300 bg-transparent px-2 py-1 text-base font-semibold text-sky-900 shadow-sm focus:border-sky-500 focus:outline-none dark:border-sky-700 dark:text-sky-100"
                  value={section.name}
                  onChange={(e) => {
                    const ns = [...sections];
                    ns[sectionIndex].name = e.target.value;
                    setSections(ns);
                  }}
                />
                {section.exercises[0] && (() => {
                  const ex = section.exercises[0];
                  const parts: string[] = [];
                  if (ex.cardioDuration) parts.push(`${ex.cardioDuration} perc`);
                  if (ex.cardioDistance) parts.push(`${ex.cardioDistance} km`);
                  if (ex.cardioSpeed) parts.push(`${ex.cardioSpeed} km/h`);
                  if (ex.cardioIncline) parts.push(`${ex.cardioIncline}% dőlés`);
                  return parts.length > 0 ? (
                    <p className="mt-0.5 text-xs text-sky-700 dark:text-sky-400">
                      {parts.join(' · ')}
                    </p>
                  ) : null;
                })()}
                {section.exercises[0]?.notes && (
                  <p className="mt-0.5 text-xs text-sky-600 dark:text-sky-400">
                    {section.exercises[0].notes}
                  </p>
                )}
              </div>
            </div>
            {sections.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveSection(sectionIndex)}
                className="rounded-md p-2.5 text-sky-500 hover:bg-sky-100 hover:text-sky-700 dark:hover:bg-sky-900/30"
                title="Kardió szekció törlése"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      ) : isComplexSection(section) ? (
        /* ── Kettlebell Komplex szekció ── */
        <div key={section.id} className="rounded-lg border border-amber-300 bg-amber-50 p-4 shadow-sm dark:border-amber-700 dark:bg-amber-950/20 md:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <input
                  {...register(`sections.${sectionIndex}.name`)}
                  type="text"
                  className="block rounded-md border border-amber-300 bg-transparent px-2 py-1 text-base font-semibold text-amber-900 shadow-sm focus:border-amber-500 focus:outline-none dark:border-amber-700 dark:text-amber-100"
                  value={section.name}
                  onChange={(e) => {
                    const ns = [...sections];
                    ns[sectionIndex].name = e.target.value;
                    setSections(ns);
                  }}
                />
                {section.exercises.length > 0 && (
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                    {section.exercises[0]?.sets ?? '?'} kör
                    {section.exercises[section.exercises.length - 1]?.restPeriod
                      ? ` · ${section.exercises[section.exercises.length - 1].restPeriod} mp pihenő`
                      : ''}
                  </p>
                )}
              </div>
            </div>
            {sections.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveSection(sectionIndex)}
                className="rounded-md p-2.5 text-amber-500 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30"
                title="Komplex törlése"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Chain display */}
          <div className="flex flex-wrap items-center gap-1.5">
            {section.exercises.map((ex, exIdx) => {
              const exerciseData = exercises.find((e) => e.id === ex.exerciseId);
              const name = exerciseData?.name || ex.name || ex.exerciseName || '—';
              return (
                <span key={ex.id} className="flex items-center gap-1.5">
                  <span className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 shadow-sm dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
                    {name}
                    {ex.reps ? (
                      <span className="ml-1.5 font-bold text-amber-600 dark:text-amber-400">
                        ×{ex.reps}
                      </span>
                    ) : null}
                  </span>
                  {exIdx < section.exercises.length - 1 && (
                    <ArrowRight size={14} className="text-amber-500" />
                  )}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div key={section.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex flex-1 items-start gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => onToggleCollapse(section.id)}
                className="mt-1.5 rounded-md border border-gray-200 p-2.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                aria-label={collapsedSections[section.id] ? 'Szekció kinyitása' : 'Szekció összecsukása'}
              >
                {collapsedSections[section.id] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className="flex-1">
              <input
                {...register(`sections.${sectionIndex}.name`)}
                type="text"
                placeholder="Szekció neve, pl. Bemelegítés, fő blokk, levezetés"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-lg font-medium shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                value={section.name}
                onChange={(e) => {
                  const newSections = [...sections];
                  newSections[sectionIndex].name = e.target.value;
                  setSections(newSections);
                }}
              />
              {errors.sections?.[sectionIndex]?.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.sections[sectionIndex]?.name?.message}
                </p>
              )}
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{getSectionSummary(section)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onDuplicateSection(sectionIndex)}
                className="rounded-md border border-gray-200 p-2.5 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                title="Szekció duplikálása"
              >
                <Copy size={16} />
              </button>
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveSection(sectionIndex)}
                  className="rounded-md p-2.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                  title="Szekció törlése"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Exercises */}
          {!collapsedSections[section.id] && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">Gyakorlatok</h3>
              <button
                type="button"
                onClick={() => onAddExercise(sectionIndex)}
                className="btn btn-sm btn-outline flex items-center gap-1"
              >
                <Plus size={14} />
                Gyakorlat hozzáadása
              </button>
            </div>

            {section.exercises.map((exercise, exerciseIndex) => (
              <div key={exercise.id} className="rounded-md border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
                {(() => {
                  const exerciseKey = getExerciseKey(section.id, exercise.id);
                  const selectedExercise = exercise.exerciseId && !exercise.exerciseId.startsWith('placeholder-')
                    ? exercises.find(ex => ex.id === exercise.exerciseId)
                    : null;
                  const placeholderMeta = getPlaceholderExerciseMeta(exercise.exerciseId);
                  const selectedFMSFocus = fmsFocusFilters[exerciseKey];
                  const selectedExerciseFMSFocuses = selectedExercise ? getExerciseFMSFocuses(selectedExercise) : [];
                  const activeFilterCount = [
                    categoryFilters[exerciseKey],
                    movementPatternFilters[exerciseKey],
                    patternFamilyFilters[exerciseKey],
                    lateralityFilters[exerciseKey],
                    fmsFocusFilters[exerciseKey],
                    exerciseSearchQueries[exerciseKey],
                  ].filter(Boolean).length;
                  const selectedMovementPatternLabel = selectedExercise
                    ? getMovementPatternLabel(selectedExercise.movement_pattern)
                    : placeholderMeta?.movementPatternLabel;

                  return (
                    <>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Gyakorlat {exerciseIndex + 1}
                    </span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{getExerciseSummary(exercise)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDuplicateExercise(sectionIndex, exerciseIndex)}
                      className="rounded-md border border-gray-200 p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                      title="Gyakorlat duplikálása"
                    >
                      <Copy size={14} />
                    </button>
                    {section.exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveExercise(sectionIndex, exerciseIndex)}
                        className="rounded-md p-2.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                        title="Gyakorlat törlése"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Exercise Selection */}
                  <div>
                    <div>
                    <div className="mb-3 flex items-center justify-between sm:hidden">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Gyakorlatválasztó</p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                          {selectedExercise?.name || placeholderMeta?.title || 'Válassz gyakorlatot'}
                        </p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {getFilteredExercises(section.id, exercise.id).length} találat
                      </span>
                    </div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Gyakorlat
                    </label>

                    <div className="mb-3 mt-2 space-y-2">
                      {exercises.length > 0 && (
                        <>
                          <div className="relative">
                            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={exerciseSearchQueries[exerciseKey] || ''}
                              onChange={(e) => setSearchQuery(exerciseKey, e.target.value)}
                              className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                              placeholder="Keresés név, leírás vagy instrukció alapján"
                            />
                          </div>
                          <details className="rounded-md border border-gray-200 bg-white/70 px-3 py-2 dark:border-gray-600 dark:bg-gray-800/60">
                            <summary className="cursor-pointer list-none text-xs font-medium text-gray-600 dark:text-gray-300">
                              Speciális szűrők{activeFilterCount > 0 ? ` • ${activeFilterCount} aktív` : ''}
                            </summary>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Kategória
                                </label>
                                <select
                                  value={categoryFilters[exerciseKey] || ''}
                                  onChange={(e) => updateCategoryFilter(section.id, exercise.id, e.target.value)}
                                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                >
                                  <option value="">Összes kategória</option>
                                  {categoryOptions.map((category) => (
                                    <option key={category.id} value={category.id}>
                                      {category.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Mozgáscsalád
                                </label>
                                <select
                                  value={patternFamilyFilters[exerciseKey] || ''}
                                  onChange={(e) => updatePatternFamilyFilter(section.id, exercise.id, e.target.value)}
                                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                >
                                  <option value="">Összes család</option>
                                  {patternFamilyOptions.map((patternFamily) => (
                                    <option key={patternFamily.value} value={patternFamily.value}>
                                      {patternFamily.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Oldaliság
                                </label>
                                <select
                                  value={lateralityFilters[exerciseKey] || ''}
                                  onChange={(e) => updateLateralityFilter(section.id, exercise.id, e.target.value)}
                                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                >
                                  <option value="">Összes forma</option>
                                  {lateralityOptions.map((laterality) => (
                                    <option key={laterality.value} value={laterality.value}>
                                      {laterality.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {categoryFilters[exerciseKey] === 'fms' && (
                                <div className="sm:col-span-2 lg:col-span-3">
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                    FMS fókusz
                                  </label>
                                  <select
                                    value={selectedFMSFocus || ''}
                                    onChange={(e) => updateFMSFocusFilter(section.id, exercise.id, e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                  >
                                    <option value="">Mind a 7 FMS minta</option>
                                    {fmsFocusOptions.map((focus) => (
                                      <option key={focus.id} value={focus.id}>
                                        {focus.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Mozgásminta
                                </label>
                                <select
                                  value={movementPatternFilters[exerciseKey] || ''}
                                  onChange={(e) => updateMovementPatternFilter(section.id, exercise.id, e.target.value)}
                                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                >
                                  <option value="">Összes mozgásminta</option>
                                  {getAvailableMovementPatterns(section.id, exercise.id).map((pattern) => (
                                    <option key={pattern.id} value={pattern.id}>
                                      {pattern.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </details>
                        </>
                      )}

                      {exercises.length === 0 && (
                        <div className="mb-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Szűrők betöltése...</span>
                        </div>
                      )}
                    </div>

                    <select
                      {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.exerciseId`)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      value={exercise.exerciseId || ''}
                      onChange={(e) => {
                        const newSections = [...sections];
                        newSections[sectionIndex].exercises[exerciseIndex].exerciseId = e.target.value;
                        // Clear the placeholder name when a real exercise is selected
                        if (e.target.value && !e.target.value.startsWith('placeholder-')) {
                          newSections[sectionIndex].exercises[exerciseIndex].name = undefined;
                          newSections[sectionIndex].exercises[exerciseIndex].exerciseName = undefined;
                        }
                        setSections(newSections);
                      }}
                    >
                      <option value="">Válassz gyakorlatot</option>
                      {getFilteredExercises(section.id, exercise.id).map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {getExerciseOptionLabel(ex as Exercise, categoryFilters[exerciseKey])}
                        </option>
                      ))}
                    </select>

                    {/* Show filter info */}
                    {exercises.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {getFilteredExercises(section.id, exercise.id).length} / {exercises.length} gyakorlat látható
                        {(categoryFilters[exerciseKey] || movementPatternFilters[exerciseKey] || patternFamilyFilters[exerciseKey] || lateralityFilters[exerciseKey] || fmsFocusFilters[exerciseKey] || exerciseSearchQueries[exerciseKey]) && (
                          <button
                            type="button"
                            onClick={() => resetFiltersForExercise(exerciseKey)}
                            className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            Összes szűrő törlése
                          </button>
                        )}
                      </div>
                    )}

                    {selectedExercise && (
                      <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">{selectedExercise.name}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                          <span className="rounded-full bg-white/80 px-2 py-1 dark:bg-emerald-900/60">{getExerciseCategoryLabel(selectedExercise.category)}</span>
                          {selectedMovementPatternLabel && (
                            <span className="rounded-full bg-white/80 px-2 py-1 dark:bg-emerald-900/60">{selectedMovementPatternLabel}</span>
                          )}
                          {selectedExerciseFMSFocuses.map((focusId) => (
                            <span key={focusId} className="rounded-full bg-white/80 px-2 py-1 dark:bg-emerald-900/60">
                              FMS: {getFMSFocusLabel(focusId)}
                            </span>
                          ))}
                          <span className="rounded-full bg-white/80 px-2 py-1 dark:bg-emerald-900/60">Nehézség: {getDifficultyLabel(selectedExercise.difficulty)}</span>
                        </div>
                        {selectedExercise.description && (
                          <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">{selectedExercise.description}</p>
                        )}
                      </div>
                    )}

                    {placeholderMeta && (
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          Generált helykitöltő: {placeholderMeta.title}
                        </p>
                        <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                          {placeholderMeta.description}
                        </p>
                        {placeholderMeta.movementPatternLabel && (
                          <p className="mt-2 text-xs font-medium text-amber-900 dark:text-amber-100">
                            Ajánlott mozgásminta: {placeholderMeta.movementPatternLabel}
                          </p>
                        )}
                        {placeholderMeta.categoryLabel && (
                          <p className="mt-1 text-xs font-medium text-amber-900 dark:text-amber-100">
                            Ajánlott kategória: {placeholderMeta.categoryLabel}
                          </p>
                        )}
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Sets / Reps / Weight / Rest — 2 col mobilon, 4 col iPaden+ */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {/* Sets */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sorozat
                      </label>
                      <input
                        {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.sets`, { valueAsNumber: true })}
                        type="number"
                        min="1"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="3"
                        value={exercise.sets || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const newSections = [...sections];
                          const value = e.target.value;
                          newSections[sectionIndex].exercises[exerciseIndex].sets = value === '' ? undefined : Number(value) || 1;
                          setSections(newSections);
                        }}
                      />
                    </div>

                    {/* Reps */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ismétlés
                      </label>
                      <input
                        {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.reps`)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="8"
                        value={exercise.reps || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const newSections = [...sections];
                          newSections[sectionIndex].exercises[exerciseIndex].reps = e.target.value;
                          setSections(newSections);
                        }}
                      />
                    </div>

                    {/* Weight */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Súly (kg) <span className="text-xs text-gray-400">(opt.)</span>
                      </label>
                      <input
                        {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.weight`, {
                          setValueAs: (v) => v === '' || v === null || v === undefined ? undefined : Number(v)
                        })}
                        type="number"
                        step="0.5"
                        min="0"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="— kg"
                        value={exercise.weight || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const newSections = [...sections];
                          const value = e.target.value;
                          newSections[sectionIndex].exercises[exerciseIndex].weight = value === '' ? undefined : Number(value) || undefined;
                          setSections(newSections);
                        }}
                      />
                    </div>

                    {/* Rest Period */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Pihenő (mp) <span className="text-xs text-gray-400">(opt.)</span>
                      </label>
                      <input
                        {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.restPeriod`, {
                          setValueAs: (v) => v === '' || v === null || v === undefined ? undefined : Number(v)
                        })}
                        type="number"
                        min="0"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="60"
                        value={exercise.restPeriod || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const newSections = [...sections];
                          const value = e.target.value;
                          newSections[sectionIndex].exercises[exerciseIndex].restPeriod = value === '' ? undefined : Number(value) || undefined;
                          setSections(newSections);
                        }}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Megjegyzés <span className="text-gray-400 text-xs">(opcionális)</span>
                    </label>
                    <input
                      {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.notes`)}
                      type="text"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Kiegészítő megjegyzés vagy instrukció"
                      value={exercise.notes || ''}
                      onChange={(e) => {
                        const newSections = [...sections];
                        newSections[sectionIndex].exercises[exerciseIndex].notes = e.target.value;
                        setSections(newSections);
                      }}
                    />
                  </div>
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default WorkoutSectionsEditor;
