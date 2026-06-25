import { RotateCw, Sparkles } from 'lucide-react';
import { CycleWeek, ProgramType, TRAINING_FOCUS_OPTIONS, TrainingFocus, WorkoutDay } from '../../lib/workoutGenerator.fixed';
import {
  PWRON_PROGRAM_OPTIONS,
  PwronPrescriptionMode,
  PwronProgramType,
  PwronSessionVariant,
  PwronWeekNumber,
  getPwronProgramTypeLabel,
  getPwronWeeklySetPatternOptions,
} from '../../lib/pwronWorkoutGenerator';
import {
  LONGEVITY_AGT_VARIANT_OPTIONS,
  LONGEVITY_MODALITY_OPTIONS,
  LongevityAgtVariant,
  LongevityModality,
  LongevityWeekNumber,
  getLongevityModalityDay,
  getLongevityModalityLabel,
} from '../../lib/longevityWorkoutGenerator';

const getAvailableDays = (programType: ProgramType): WorkoutDay[] => {
  if (programType === '2napos') {
    return [1, 2];
  }

  if (programType === '3napos') {
    return [1, 2, 3];
  }

  return [1, 2, 3, 4];
};

const getProgramTypeLabel = (programType: ProgramType) => {
  if (programType === '2napos') {
    return '2 napos program';
  }

  if (programType === '3napos') {
    return '3 napos program';
  }

  return '4 napos program';
};

const getDayLabel = (programType: ProgramType, day: WorkoutDay) => {
  if (programType === '2napos') {
    if (day === 1) return 'Nap 1 - Robbanékonyság';
    return 'Nap 2 - Erő';
  }

  if (programType === '3napos') {
    if (day === 1) return 'Nap 1 - Robbanékonyság/Erő';
    if (day === 2) return 'Nap 2 - Erő/Robbanékonyság';
    return 'Nap 3 - Robbanékonyság/Erő';
  }

  if (day === 1) return 'Nap 1 - Felsőtest nyomás és húzás';
  if (day === 2) return 'Nap 2 - Alsótest csípő és térd domináns';
  if (day === 3) return 'Nap 3 - Robbanékonyság/Erő';
  return 'Nap 4 - Felsőtest nyomás és húzás';
};

const ProgramTypeSelector = ({
  selectedProgramType,
  onProgramTypeChange,
}: {
  selectedProgramType: ProgramType;
  onProgramTypeChange: (programType: ProgramType) => void;
}) => (
  <div className="mb-6">
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
      Programtípus
    </label>
    <div className="flex flex-wrap gap-2">
      {(['2napos', '3napos', '4napos'] as ProgramType[]).map((programType) => (
        <button
          key={programType}
          type="button"
          onClick={() => onProgramTypeChange(programType)}
          className={`rounded-md px-4 py-2 ${
            selectedProgramType === programType
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {getProgramTypeLabel(programType)}
        </button>
      ))}
    </div>
  </div>
);

const DaySelector = ({
  selectedProgramType,
  selectedWorkoutDay,
  onWorkoutDayChange,
}: {
  selectedProgramType: ProgramType;
  selectedWorkoutDay: WorkoutDay;
  onWorkoutDayChange: (day: WorkoutDay) => void;
}) => (
  <div className="mb-4">
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
      Edzésnap
    </label>
    <div className="flex flex-wrap gap-2">
      {getAvailableDays(selectedProgramType).map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => onWorkoutDayChange(day)}
          className={`rounded-md px-4 py-2 ${
            selectedWorkoutDay === day
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {getDayLabel(selectedProgramType, day)}
        </button>
      ))}
    </div>
  </div>
);

export const TemplateGeneratorPanel = ({
  fmsMessage,
  selectedProgramType,
  selectedWorkoutDay,
  onProgramTypeChange,
  onWorkoutDayChange,
  onSwitchToPeriodized,
  onClose,
  onGenerate,
  isGenerating,
}: {
  fmsMessage: string;
  selectedProgramType: ProgramType;
  selectedWorkoutDay: WorkoutDay;
  onProgramTypeChange: (programType: ProgramType) => void;
  onWorkoutDayChange: (day: WorkoutDay) => void;
  onSwitchToPeriodized: () => void;
  onClose: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) => (
  <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">2/3/4 napos sablongenerátor</h2>
    <p className="mb-4 text-gray-600 dark:text-gray-400">
      Ez a generátor a 2, 3 és 4 napos sablonstruktúrákat adja vissza közvetlen blokkelrendezéssel.
    </p>
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
      {fmsMessage}
    </div>

    <div className="mb-6">
      <button
        type="button"
        onClick={onSwitchToPeriodized}
        className="rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40"
      >
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Átváltás ciklus alapú tervezőre</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Heti fókusz és terhelési preset alapján írja rá a prescriptiont a kiválasztott sablonra.
        </p>
      </button>
    </div>

    <ProgramTypeSelector
      selectedProgramType={selectedProgramType}
      onProgramTypeChange={onProgramTypeChange}
    />

    <DaySelector
      selectedProgramType={selectedProgramType}
      selectedWorkoutDay={selectedWorkoutDay}
      onWorkoutDayChange={onWorkoutDayChange}
    />

    <div className="mb-6 mt-4 rounded bg-gray-50 p-3 dark:bg-gray-700">
      <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Kiválasztott tervező:</h3>
      <p className="text-gray-600 dark:text-gray-400">2/3/4 napos sablontervező</p>
      <p className="text-gray-600 dark:text-gray-400">
        {getProgramTypeLabel(selectedProgramType)} - {getDayLabel(selectedProgramType, selectedWorkoutDay)}
      </p>
    </div>

    <div className="flex justify-end space-x-2">
      <button type="button" onClick={onClose} className="btn btn-ghost">
        Mégse
      </button>
      <button type="button" onClick={onGenerate} className="btn btn-primary flex items-center gap-2" disabled={isGenerating}>
        {isGenerating ? (
          <>
            <RotateCw size={16} className="animate-spin" />
            Generálás...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Terv generálása
          </>
        )}
      </button>
    </div>
  </div>
);

export const PeriodizedGeneratorPanel = ({
  fmsMessage,
  selectedProgramType,
  selectedWorkoutDay,
  selectedCycleWeek,
  selectedTrainingFocus,
  onProgramTypeChange,
  onWorkoutDayChange,
  onCycleWeekChange,
  onTrainingFocusChange,
  onSwitchToTemplate,
  onClose,
  onGenerate,
  isGenerating,
}: {
  fmsMessage: string;
  selectedProgramType: ProgramType;
  selectedWorkoutDay: WorkoutDay;
  selectedCycleWeek: CycleWeek;
  selectedTrainingFocus: TrainingFocus;
  onProgramTypeChange: (programType: ProgramType) => void;
  onWorkoutDayChange: (day: WorkoutDay) => void;
  onCycleWeekChange: (week: CycleWeek) => void;
  onTrainingFocusChange: (focus: TrainingFocus) => void;
  onSwitchToTemplate: () => void;
  onClose: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) => (
  <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Ciklus alapú generátor</h2>
    <p className="mb-4 text-gray-600 dark:text-gray-400">
      Ez a generátor heti fókusz és ciklus preset alapján írja rá a prescriptiont a kiválasztott alap sablonra.
    </p>
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
      {fmsMessage}
    </div>

    <div className="mb-6">
      <button
        type="button"
        onClick={onSwitchToTemplate}
        className="rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40"
      >
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Átváltás 2/3/4 napos sablongenerátorra</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Közvetlen napstruktúrák, előre definiált blokklogikával. Nem használ ciklushetet vagy fókusz presetet.
        </p>
      </button>
    </div>

    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Ciklus hét</label>
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4, 5, 6] as CycleWeek[]).map((week) => (
            <button
              key={week}
              type="button"
              onClick={() => onCycleWeekChange(week)}
              className={`rounded-md px-3 py-2 text-sm ${
                selectedCycleWeek === week
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {week}. hét
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          A kiválasztott hét határozza meg az intenzitási és volumen presetet.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Edzésfókusz</label>
        <select
          value={selectedTrainingFocus}
          onChange={(e) => onTrainingFocusChange(e.target.value as TrainingFocus)}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          {TRAINING_FOCUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          A generátor a főblokkok prescriptionjét ehhez a célhoz igazítja.
        </p>
      </div>
    </div>

    <ProgramTypeSelector
      selectedProgramType={selectedProgramType}
      onProgramTypeChange={onProgramTypeChange}
    />

    <DaySelector
      selectedProgramType={selectedProgramType}
      selectedWorkoutDay={selectedWorkoutDay}
      onWorkoutDayChange={onWorkoutDayChange}
    />

    <div className="mb-6 mt-4 rounded bg-gray-50 p-3 dark:bg-gray-700">
      <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Kiválasztott tervező:</h3>
      <p className="text-gray-600 dark:text-gray-400">Ciklus alapú tervező</p>
      <p className="text-gray-600 dark:text-gray-400">
        {getProgramTypeLabel(selectedProgramType)} - {getDayLabel(selectedProgramType, selectedWorkoutDay)}
      </p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {selectedCycleWeek}. hét • {TRAINING_FOCUS_OPTIONS.find((option) => option.value === selectedTrainingFocus)?.label}
      </p>
    </div>

    <div className="flex justify-end space-x-2">
      <button type="button" onClick={onClose} className="btn btn-ghost">
        Mégse
      </button>
      <button type="button" onClick={onGenerate} className="btn btn-primary flex items-center gap-2" disabled={isGenerating}>
        {isGenerating ? (
          <>
            <RotateCw size={16} className="animate-spin" />
            Generálás...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Terv generálása
          </>
        )}
      </button>
    </div>
  </div>
);

export const PwronGeneratorPanel = ({
  message,
  selectedProgramType,
  selectedWeek,
  selectedVariant,
  selectedPrescriptionMode,
  selectedPowerSetPattern,
  selectedMainSetPattern,
  athleteName,
  onProgramTypeChange,
  onWeekChange,
  onVariantChange,
  onPrescriptionModeChange,
  onPowerSetPatternChange,
  onMainSetPatternChange,
  onAthleteNameChange,
  onSwitchToTemplate,
  onClose,
  onGenerate,
  isGenerating,
}: {
  message: string;
  selectedProgramType: PwronProgramType;
  selectedWeek: PwronWeekNumber;
  selectedVariant: PwronSessionVariant;
  selectedPrescriptionMode: PwronPrescriptionMode;
  selectedPowerSetPattern: string;
  selectedMainSetPattern: string;
  athleteName: string;
  onProgramTypeChange: (programType: PwronProgramType) => void;
  onWeekChange: (week: PwronWeekNumber) => void;
  onVariantChange: (variant: PwronSessionVariant) => void;
  onPrescriptionModeChange: (mode: PwronPrescriptionMode) => void;
  onPowerSetPatternChange: (pattern: string) => void;
  onMainSetPatternChange: (pattern: string) => void;
  onAthleteNameChange: (athleteName: string) => void;
  onSwitchToTemplate: () => void;
  onClose: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) => {
  const availablePatterns = getPwronWeeklySetPatternOptions(selectedProgramType, selectedWeek);

  return (
  <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Pwron generátor</h2>
    <p className="mb-4 text-gray-600 dark:text-gray-400">
      A Pwron generátor a Program lap közös napi sablonját tölti fel az Erő, Hipertrófia vagy Hipertrófia + zsírcsökkentés
      program 6 hetes periodizációs paramétereivel.
    </p>
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
      {message}
    </div>

    <div className="mb-6">
      <button
        type="button"
        onClick={onSwitchToTemplate}
        className="rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40"
      >
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Átváltás 2/3/4 napos tervezőre</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          A meglévő sablongenerátor és ciklusgenerátor külön rendszerként továbbra is elérhető.
        </p>
      </button>
    </div>

    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Pwron program</label>
        <div className="flex flex-wrap gap-2">
          {PWRON_PROGRAM_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onProgramTypeChange(option.value)}
              className={`rounded-md px-3 py-2 text-sm ${
                selectedProgramType === option.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <label htmlFor="pwron-athlete-name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Sportoló neve
        </label>
        <input
          id="pwron-athlete-name"
          type="text"
          value={athleteName}
          onChange={(event) => onAthleteNameChange(event.target.value)}
          placeholder="Opcionális"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>
    </div>

    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Ciklus hét</label>
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4, 5, 6] as PwronWeekNumber[]).map((week) => (
            <button
              key={week}
              type="button"
              onClick={() => onWeekChange(week)}
              className={`rounded-md px-3 py-2 text-sm ${
                selectedWeek === week
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {week}. hét
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Napi variáns</label>
        <div className="flex gap-2">
          {(['A', 'B'] as PwronSessionVariant[]).map((variant) => (
            <button
              key={variant}
              type="button"
              onClick={() => onVariantChange(variant)}
              className={`rounded-md px-4 py-2 text-sm ${
                selectedVariant === variant
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {variant} variáns
            </button>
          ))}
        </div>
      </div>
    </div>

    <div className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Prescription kitöltés</label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPrescriptionModeChange('auto')}
          className={`rounded-md px-4 py-2 text-sm ${
            selectedPrescriptionMode === 'auto'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Automatikus
        </button>
        <button
          type="button"
          onClick={() => onPrescriptionModeChange('manual')}
          className={`rounded-md px-4 py-2 text-sm ${
            selectedPrescriptionMode === 'manual'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Kézi
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Automatikus módban a variáns alapján választ mintát, kézi módban te adod meg a Power és fő blokk prescriptiont.
      </p>
    </div>

    {selectedPrescriptionMode === 'manual' && (
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Power prescription</label>
          <select
            value={selectedPowerSetPattern}
            onChange={(event) => onPowerSetPatternChange(event.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            {availablePatterns.power.map((pattern) => (
              <option key={pattern} value={pattern}>
                {pattern}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Fő blokk prescription</label>
          <select
            value={selectedMainSetPattern}
            onChange={(event) => onMainSetPatternChange(event.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            {availablePatterns.main.map((pattern) => (
              <option key={pattern} value={pattern}>
                {pattern}
              </option>
            ))}
          </select>
        </div>
      </div>
    )}

    <div className="mb-6 mt-4 rounded bg-gray-50 p-3 dark:bg-gray-700">
      <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Kiválasztott tervező:</h3>
      <p className="text-gray-600 dark:text-gray-400">Pwron programgenerátor</p>
      <p className="text-gray-600 dark:text-gray-400">
        {getPwronProgramTypeLabel(selectedProgramType)} • {selectedWeek}. hét • {selectedVariant} variáns
      </p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Prescription: {selectedPrescriptionMode === 'auto' ? 'Automatikus' : `Kézi (Power: ${selectedPowerSetPattern}, Fő blokk: ${selectedMainSetPattern})`}
      </p>
    </div>

    <div className="flex justify-end space-x-2">
      <button type="button" onClick={onClose} className="btn btn-ghost">
        Mégse
      </button>
      <button type="button" onClick={onGenerate} className="btn btn-primary flex items-center gap-2" disabled={isGenerating}>
        {isGenerating ? (
          <>
            <RotateCw size={16} className="animate-spin" />
            Generálás...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Terv generálása
          </>
        )}
      </button>
    </div>
  </div>
  );
};

export const LongevityGeneratorPanel = ({
  message,
  selectedWeek,
  selectedModality,
  selectedAgtVariant,
  athleteName,
  onWeekChange,
  onModalityChange,
  onAgtVariantChange,
  onAthleteNameChange,
  onSwitchToTemplate,
  onClose,
  onGenerate,
  isGenerating,
}: {
  message: string;
  selectedWeek: LongevityWeekNumber;
  selectedModality: LongevityModality;
  selectedAgtVariant: LongevityAgtVariant;
  athleteName: string;
  onWeekChange: (week: LongevityWeekNumber) => void;
  onModalityChange: (modality: LongevityModality) => void;
  onAgtVariantChange: (variant: LongevityAgtVariant) => void;
  onAthleteNameChange: (athleteName: string) => void;
  onSwitchToTemplate: () => void;
  onClose: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) => (
  <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Longevity generátor</h2>
    <p className="mb-4 text-gray-600 dark:text-gray-400">
      4 hetes Longevity protokoll: heti hármas sablon (Hétfő erő, Szerda stato-dinamikus, Péntek AGT) hétről hétre
      progresszióval. Válassz hetet és modalitást – a generátor a kiválasztott edzésnap session-jét adja vissza.
    </p>
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
      {message}
    </div>

    <div className="mb-6">
      <button
        type="button"
        onClick={onSwitchToTemplate}
        className="rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40"
      >
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Átváltás 2/3/4 napos tervezőre</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          A többi generátor (sablon, ciklus, Pwron) külön rendszerként továbbra is elérhető.
        </p>
      </button>
    </div>

    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Hét</label>
        <div className="flex flex-wrap gap-2">
          {([1, 2, 3, 4] as LongevityWeekNumber[]).map((week) => (
            <button
              key={week}
              type="button"
              onClick={() => onWeekChange(week)}
              className={`rounded-md px-3 py-2 text-sm ${
                selectedWeek === week
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {week}. hét
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          A hét határozza meg a progressziót (erő: szett/terhelés, stato: idő/terhelés, AGT: körök +3/hét).
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <label htmlFor="longevity-athlete-name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Sportoló neve
        </label>
        <input
          id="longevity-athlete-name"
          type="text"
          value={athleteName}
          onChange={(event) => onAthleteNameChange(event.target.value)}
          placeholder="Opcionális"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>
    </div>

    <div className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Modalitás / edzésnap</label>
      <div className="flex flex-wrap gap-2">
        {LONGEVITY_MODALITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onModalityChange(option.value)}
            className={`rounded-md px-3 py-2 text-sm ${
              selectedModality === option.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {option.day} – {option.label}
          </button>
        ))}
      </div>
    </div>

    {selectedModality === 'AGT' && (
      <div className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">AGT eszköz / változat</label>
        <select
          value={selectedAgtVariant}
          onChange={(event) => onAgtVariantChange(event.target.value as LongevityAgtVariant)}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          {LONGEVITY_AGT_VARIANT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Alapértelmezett a kettlebell swing. A pulzusplafon mindig 130 alatt, teljesítményesésnél a session véget ér.
        </p>
      </div>
    )}

    <div className="mb-6 mt-4 rounded bg-gray-50 p-3 dark:bg-gray-700">
      <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Kiválasztott tervező:</h3>
      <p className="text-gray-600 dark:text-gray-400">Longevity protokoll</p>
      <p className="text-gray-600 dark:text-gray-400">
        {selectedWeek}. hét • {getLongevityModalityDay(selectedModality)} – {getLongevityModalityLabel(selectedModality)}
        {selectedModality === 'AGT'
          ? ` • ${LONGEVITY_AGT_VARIANT_OPTIONS.find((option) => option.value === selectedAgtVariant)?.label}`
          : ''}
      </p>
    </div>

    <div className="flex justify-end space-x-2">
      <button type="button" onClick={onClose} className="btn btn-ghost">
        Mégse
      </button>
      <button type="button" onClick={onGenerate} className="btn btn-primary flex items-center gap-2" disabled={isGenerating}>
        {isGenerating ? (
          <>
            <RotateCw size={16} className="animate-spin" />
            Generálás...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Terv generálása
          </>
        )}
      </button>
    </div>
  </div>
);