import { useState, useEffect, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Activity,
  ArrowRight,
  ChevronDown,
  Info,
  RefreshCw,
  Save,
  User,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createFMSAssessment, getAllUsers } from '../lib/fms';
import { listManualGuests, ManualGuest, updateManualGuest } from '../lib/manualGuests';
import {
  FMS_EMPTY_FORM_VALUES,
  FMS_MOVEMENT_STEPS,
  calculatePartialTotalScore,
  fmsAssessmentSchema,
  isStepComplete,
  toFMSAssessmentDraft,
  type FMSAssessmentFormValues,
  type FMSScoreField,
} from '../lib/fmsAssessmentForm';
import { FMS_MAX_SCORE, FMS_SCORE_LABELS } from '../lib/fmsReport/constants';
import { buildFMSAssessmentPayload, type FMSClearingTestId } from '../lib/fmsScoring';
import {
  findGuestForSubject,
  findSubjectIdForGuest,
  formatSubjectOptionLabel,
  resolveSubjectName,
} from '../lib/fmsSubjectLinking';
import { FMSMovementStepCard } from '../components/fms/FMSMovementStepCard';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  // Kompatibilitás miatt a régi name mezőt is megtartjuk
  name?: string | null;
}

/** A 0–3 skála magyarázata a súgópanelben, a legjobb ponttól lefelé. */
const SCORE_LEGEND: { score: number; badgeClass: string }[] = [
  { score: 3, badgeClass: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300' },
  { score: 2, badgeClass: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300' },
  { score: 1, badgeClass: 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300' },
  { score: 0, badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
];

const FMSAssessment = () => {
  const { initialized, user } = useAuth();
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [manualGuests, setManualGuests] = useState<ManualGuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FMSAssessmentFormValues>({
    resolver: zodResolver(fmsAssessmentSchema),
    defaultValues: FMS_EMPTY_FORM_VALUES,
  });

  const values = watch();
  const selectedManualGuestId = values.manualGuestId;
  const selectedManualGuest = manualGuests.find(guest => guest.id === selectedManualGuestId);
  const selectedSubject = users.find(dbUser => dbUser.id === values.linkedUserId);
  const selectedSubjectName = selectedSubject
    ? resolveSubjectName(selectedSubject, manualGuests)
    : null;

  const guestField = register('manualGuestId');
  const subjectField = register('linkedUserId');

  useEffect(() => {
    if (initialized && user?.id) {
      void loadInitialData();
      return;
    }

    if (initialized) {
      setIsLoading(false);
    }
  }, [initialized, user?.id]);

  /** Vendégválasztás → a hozzá kapcsolt (vagy azonos nevű) adatbázisos alany. */
  const handleGuestChange = (event: ChangeEvent<HTMLSelectElement>) => {
    void guestField.onChange(event);

    const guest = manualGuests.find(item => item.id === event.target.value);
    setValue('linkedUserId', guest ? findSubjectIdForGuest(guest, users) : '', {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  /**
   * Alanyválasztás → ha az e-mail címhez tartozik ismert név (kapcsolt vendég
   * vagy azonos nevű, még szabad vendég), azt beállítjuk a vendégmezőbe.
   */
  const handleSubjectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    void subjectField.onChange(event);

    const matchingGuest = findGuestForSubject(event.target.value, users, manualGuests);
    if (!matchingGuest || matchingGuest.id === values.manualGuestId) {
      return;
    }

    setValue('manualGuestId', matchingGuest.id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadUsers(), loadManualGuests()]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();

      if (data.length === 0) {
        console.warn('No users found in the database');
        toast('Nincsenek felhasználók az adatbázisban. Először adj hozzá felhasználókat.', {
          icon: '⚠️',
          duration: 5000,
        });
      } else {
        setUsers(data);
        toast.success(`${data.length} felhasználó betöltve`);
      }
    } catch (error) {
      console.error('Failed to load users:', error);

      let errorMessage = 'FMS adatbázis-alanyok betöltése sikertelen';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }

      toast.error(errorMessage);
    }
  };

  const loadManualGuests = async () => {
    if (!user?.id) {
      setManualGuests([]);
      return;
    }

    try {
      const guests = await listManualGuests(user.id);
      setManualGuests(guests);
    } catch (error) {
      console.error('Failed to load manual guests:', error);
      toast.error('A manuális vendéglista betöltése sikertelen');
    }
  };

  const onSubmit = async (data: FMSAssessmentFormValues) => {
    try {
      setIsSubmitting(true);

      if (!user?.id) {
        throw new Error('A mentéshez be kell jelentkezned');
      }

      const selectedGuest = manualGuests.find(guest => guest.id === data.manualGuestId);
      if (!selectedGuest) {
        throw new Error('A kiválasztott vendég nem található');
      }

      if (selectedGuest.linkedFmsUserId !== data.linkedUserId) {
        await updateManualGuest(user.id, selectedGuest.id, { linkedFmsUserId: data.linkedUserId });
        await loadManualGuests();
      }

      // A nyers oldalankénti pontok és a belőlük levezetett 7 beszámított
      // pontszám együtt megy a DB-be — a total_score generált oszlop.
      await createFMSAssessment({
        user_id: data.linkedUserId,
        ...buildFMSAssessmentPayload(toFMSAssessmentDraft(data)),
        notes: data.notes || '',
      });

      toast.success('Értékelés sikeresen mentve');
      reset(FMS_EMPTY_FORM_VALUES);
      setCurrentStep(0);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to save assessment:', error);
      let errorMessage = 'Értékelés mentése sikertelen';

      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentMovement = FMS_MOVEMENT_STEPS[currentStep];
  const totalScore = calculatePartialTotalScore(values);

  const handleScoreChange = (field: FMSScoreField, score: number) => {
    setValue(field, score, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  const handleClearingChange = (field: FMSClearingTestId, painful: boolean) => {
    setValue(field, painful, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  const handleNext = () => {
    if (!isStepComplete(currentMovement, values)) {
      toast.error('Kérlek adj pontszámot minden oldalra a folytatás előtt');
      return;
    }
    setCurrentStep(Math.min(FMS_MOVEMENT_STEPS.length - 1, currentStep + 1));
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const handleSaveClick = () => {
    // Mentés előtt az összes lépést ellenőrizzük, nem csak az aktuálisat:
    // a hiányzó pontszámhoz visszaugrunk, különben a zod hibája láthatatlan
    // maradna az utolsó lépésen állva.
    const incompleteIndex = FMS_MOVEMENT_STEPS.findIndex(step => !isStepComplete(step, values));

    if (incompleteIndex !== -1) {
      setCurrentStep(incompleteIndex);
      toast.error(
        `Hiányzó pontszám: ${FMS_MOVEMENT_STEPS[incompleteIndex].label}. Töltsd ki a mentés előtt.`,
      );
      return;
    }

    if (!values.manualGuestId || !values.linkedUserId) {
      toast.error('Válassz vendéget és kapcsolt adatbázisos alanyt a mentés előtt');
      return;
    }

    setShowConfirmDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Betöltés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Functional Movement Screen
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Mozgásminták felmérése és a korlátozottságok azonosítása
          </p>
        </div>

        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="btn btn-outline inline-flex items-center gap-2"
        >
          <Info size={20} />
          <span>Útmutató</span>
          <ChevronDown
            size={20}
            className={`transform transition-transform ${showInstructions ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {showInstructions && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Hogyan pontozzuk a mozgásmintákat?
          </h2>
          <div className="space-y-3">
            {SCORE_LEGEND.map(({ score, badgeClass }) => (
              <div key={score} className="flex items-start gap-3">
                <div
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${badgeClass}`}
                >
                  {score}
                </div>
                <p className="text-gray-600 dark:text-gray-400">{FMS_SCORE_LABELS[score]}</p>
              </div>
            ))}
          </div>

          <h3 className="mb-2 mt-6 text-sm font-semibold text-gray-900 dark:text-white">
            Oldalankénti mérés és clearing tesztek
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>
              Öt teszt (akadálylépés, inline kitörés, vállmobilitás, aktív nyújtott lábemelés,
              rotációs stabilitás) oldalanként pontozódik — a felmérésbe a{' '}
              <span className="font-medium">gyengébb oldal</span> pontja számít be.
            </li>
            <li>
              A két oldal eltérése (aszimmetria) akkor is korrekciós indok, ha a beszámított pont
              egyébként elfogadható.
            </li>
            <li>
              Három teszthez clearing (fájdalom-provokációs) teszt tartozik. Ha az{' '}
              <span className="font-medium">pozitív</span>, az adott mozgásminta pontszáma 0,
              és orvosi kivizsgálás javasolt.
            </li>
          </ul>
        </div>
      )}

      {/* Felmért személy */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Válassz vendéget
          </label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex gap-2">
              <select
                {...guestField}
                onChange={handleGuestChange}
                className="input flex-grow pl-10"
                disabled={manualGuests.length === 0}
              >
                <option value="">
                  {manualGuests.length === 0
                    ? 'Nincs manuális vendég - előbb hozz létre a plannerben'
                    : 'Válassz vendéget'}
                </option>
                {manualGuests.map(guest => (
                  <option key={guest.id} value={guest.id}>
                    {guest.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  void loadInitialData();
                }}
                className="btn btn-outline btn-sm"
                title="Lista frissítése"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          {errors.manualGuestId && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {errors.manualGuestId.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Kapcsolt adatbázisos FMS alany
          </label>
          <select
            {...subjectField}
            onChange={handleSubjectChange}
            className="input mt-1 w-full"
            disabled={users.length === 0}
          >
            <option value="">
              {users.length === 0
                ? 'Nincs elérhető adatbázisos alany'
                : 'Válassz adatbázisos alanyt'}
            </option>
            {users.map(dbUser => (
              <option key={dbUser.id} value={dbUser.id}>
                {formatSubjectOptionLabel(dbUser, manualGuests)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            A felmérés a kiválasztott vendég nevéhez tartozik, de fizikailag ehhez az adatbázisos
            alanyhoz mentődik az FMS táblába. A két mező bármelyik irányban kitölthető: ha az
            alanyhoz ismert név tartozik, a vendég automatikusan beáll.
          </p>
          {selectedManualGuest && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Aktív vendég: {selectedManualGuest.name}
            </p>
          )}
          {selectedSubject && !selectedManualGuest && (
            <p className="mt-1 text-xs text-warning-600 dark:text-warning-400">
              {selectedSubjectName
                ? `Ehhez az alanyhoz „${selectedSubjectName}” néven nincs szabad vendég — válassz vendéget a listából.`
                : 'Ehhez az e-mail címhez még nem tartozik név — válassz vendéget, vagy hozz létre egyet a plannerben.'}
            </p>
          )}
          {errors.linkedUserId && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">
              {errors.linkedUserId.message}
            </p>
          )}
        </div>
      </div>

      {/* Aktuális mozgásminta */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                <Activity className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentMovement.label}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentMovement.description}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {currentStep + 1} / {FMS_MOVEMENT_STEPS.length}. teszt
              </p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {totalScore}
                <span className="text-sm text-gray-500 dark:text-gray-400">/{FMS_MAX_SCORE}</span>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
          <FMSMovementStepCard
            step={currentMovement}
            scores={values}
            clearingPain={
              currentMovement.clearingTest ? values[currentMovement.clearingTest.id] === true : false
            }
            onScoreChange={handleScoreChange}
            onClearingChange={handleClearingChange}
          />

          {currentStep === FMS_MOVEMENT_STEPS.length - 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Megjegyzés
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="input mt-1"
                placeholder="Megfigyelések, kiegészítések a felméréshez..."
              />
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="btn btn-outline"
            >
              Előző
            </button>

            {currentStep < FMS_MOVEMENT_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <span>Következő teszt</span>
                <ArrowRight size={20} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={isSubmitting}
                className="btn btn-primary inline-flex items-center gap-2"
              >
                <Save size={20} />
                <span>Felmérés lezárása</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Haladásjelző */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-primary-600 transition-all dark:bg-primary-400"
          style={{ width: `${((currentStep + 1) / FMS_MOVEMENT_STEPS.length) * 100}%` }}
        ></div>
      </div>

      {/* Megerősítő párbeszéd */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Felmérés mentése
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Biztosan mented ezt az FMS felmérést? Összpontszám: {totalScore}/{FMS_MAX_SCORE}
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="btn btn-outline"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Mentés...</span>
                  </div>
                ) : (
                  'Mentés'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FMSAssessment;
