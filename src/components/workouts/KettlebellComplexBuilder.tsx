import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, ArrowRight, X, Link, Save, BookOpen, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Exercise } from '../../lib/exercises';
import type { Section, SectionExercise } from '../../lib/workoutPlannerHelpers';
import { useAuth } from '../../hooks/useAuth';
import {
  listKbComplexes,
  createKbComplex,
  deleteKbComplex,
  type KbComplex,
} from '../../lib/kbComplexService';

const COMPLEX_PREFIX = 'KB Komplex';

export const isComplexSection = (section: { name: string }) =>
  section.name.startsWith(COMPLEX_PREFIX);

interface ComplexSlot {
  id: string;
  exerciseId: string;
  exerciseName: string;
  reps: number | string;
}

interface KettlebellComplexBuilderProps {
  exercises: Exercise[];
  onAdd: (section: Section) => void;
  onClose: () => void;
}

const emptySlot = (id: string): ComplexSlot => ({
  id,
  exerciseId: '',
  exerciseName: '',
  reps: 5,
});

type Tab = 'build' | 'saved';

export default function KettlebellComplexBuilder({
  exercises,
  onAdd,
  onClose,
}: KettlebellComplexBuilderProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('build');
  const [slots, setSlots] = useState<ComplexSlot[]>([
    emptySlot('1'),
    emptySlot('2'),
    emptySlot('3'),
  ]);
  const [rounds, setRounds] = useState(3);
  const [restBetweenRounds, setRestBetweenRounds] = useState(60);
  const [searches, setSearches] = useState<Record<string, string>>({});
  const [complexName, setComplexName] = useState('');
  const [savedComplexes, setSavedComplexes] = useState<KbComplex[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const kettlebellExercises = useMemo(
    () => exercises.filter((ex) => ex.is_active),
    [exercises],
  );

  useEffect(() => {
    if (tab === 'saved' && user?.id) {
      setIsLoadingSaved(true);
      listKbComplexes(user.id)
        .then(setSavedComplexes)
        .catch(() => toast.error('Nem sikerült betölteni a mentett komplexeket'))
        .finally(() => setIsLoadingSaved(false));
    }
  }, [tab, user?.id]);

  const getFiltered = (slotId: string) => {
    const q = (searches[slotId] || '').toLowerCase().trim();
    if (!q) return kettlebellExercises.slice(0, 60);
    return kettlebellExercises.filter((ex) => ex.name.toLowerCase().includes(q)).slice(0, 60);
  };

  const updateSlot = (id: string, patch: Partial<ComplexSlot>) =>
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addSlot = () => {
    if (slots.length >= 4) return;
    setSlots((prev) => [...prev, emptySlot(Date.now().toString())]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 2) return;
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const filledSlots = slots.filter((s) => s.exerciseId);
  const canAdd = filledSlots.length >= 2;

  const buildSection = (titleOverride?: string): Section => {
    const sectionId = Date.now().toString();
    const title = titleOverride
      ? `${COMPLEX_PREFIX} – ${titleOverride}`
      : complexName.trim()
        ? `${COMPLEX_PREFIX} – ${complexName.trim()}`
        : COMPLEX_PREFIX;

    const sectionExercises: SectionExercise[] = filledSlots.map((slot, idx) => ({
      id: `${sectionId}-${idx + 1}`,
      exerciseId: slot.exerciseId,
      sets: rounds,
      reps: slot.reps,
      notes: '[K]',
      restPeriod: idx === filledSlots.length - 1 ? restBetweenRounds : 0,
    }));

    return { id: sectionId, name: title, exercises: sectionExercises };
  };

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(buildSection());
  };

  const handleSaveToDb = async () => {
    if (!canAdd || !user?.id) return;
    const name = complexName.trim() || 'Névtelen komplex';
    setIsSaving(true);
    try {
      await createKbComplex(user.id, {
        name,
        rounds,
        rest_between_rounds: restBetweenRounds,
        exercises: filledSlots.map((s) => ({
          exerciseId: s.exerciseId,
          exerciseName: s.exerciseName,
          reps: s.reps,
        })),
      });
      toast.success('Komplex elmentve!');
      if (tab === 'saved') {
        const updated = await listKbComplexes(user.id);
        setSavedComplexes(updated);
      }
    } catch {
      toast.error('Mentés sikertelen');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSaved = (complex: KbComplex) => {
    setComplexName(complex.name);
    setRounds(complex.rounds);
    setRestBetweenRounds(complex.rest_between_rounds);
    const newSlots = complex.exercises.map((ex, i) => ({
      id: (i + 1).toString(),
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      reps: ex.reps,
    }));
    setSlots(newSlots.length >= 2 ? newSlots : [...newSlots, emptySlot('extra')]);
    setSearches({});
    setTab('build');
    toast.success('Komplex betöltve – szerkesztheted vagy hozzáadhatod');
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      await deleteKbComplex(id);
      setSavedComplexes((prev) => prev.filter((c) => c.id !== id));
      toast.success('Komplex törölve');
    } catch {
      toast.error('Törlés sikertelen');
    }
  };

  const handleAddSavedDirectly = (complex: KbComplex) => {
    const sectionId = Date.now().toString();
    const title = `${COMPLEX_PREFIX} – ${complex.name}`;
    const sectionExercises: SectionExercise[] = complex.exercises.map((ex, idx) => ({
      id: `${sectionId}-${idx + 1}`,
      exerciseId: ex.exerciseId,
      sets: complex.rounds,
      reps: ex.reps,
      notes: '[K]',
      restPeriod: idx === complex.exercises.length - 1 ? complex.rest_between_rounds : 0,
    }));
    onAdd({ id: sectionId, name: title, exercises: sectionExercises });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Link size={18} className="text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Kettlebell Komplex
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setTab('build')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'build'
                ? 'border-amber-500 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Plus size={14} />
            Összeállítás
          </button>
          <button
            type="button"
            onClick={() => setTab('saved')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === 'saved'
                ? 'border-amber-500 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <BookOpen size={14} />
            Mentett komplexek
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'build' && (
            <div className="space-y-4 p-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Elnevezés <span className="text-gray-400">(opcionális)</span>
                </label>
                <input
                  type="text"
                  value={complexName}
                  onChange={(e) => setComplexName(e.target.value)}
                  placeholder="pl. Reggeli komplex A"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Rounds & Rest */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Körök száma
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={rounds}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setRounds(Math.max(1, Number(e.target.value)))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Pihenő körök közt (mp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={restBetweenRounds}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setRestBetweenRounds(Math.max(0, Number(e.target.value)))}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Exercise slots */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Gyakorlatok (2–4)
                  {kettlebellExercises.length > 0 && (
                    <span className="ml-1 text-gray-400">({kettlebellExercises.length} elérhető)</span>
                  )}
                </p>

                {slots.map((slot, idx) => (
                  <div key={slot.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {idx + 1}. gyakorlat
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.id)}
                        disabled={slots.length <= 2}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Selected exercise display */}
                    {slot.exerciseId && (
                      <div className="mb-2 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 dark:border-amber-700 dark:bg-amber-900/20">
                        <Check size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                          {slot.exerciseName}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSlot(slot.id, { exerciseId: '', exerciseName: '' })}
                          className="ml-auto text-amber-500 hover:text-amber-700 dark:hover:text-amber-300"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {/* Search + Select */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <input
                          type="text"
                          value={searches[slot.id] || ''}
                          onChange={(e) =>
                            setSearches((prev) => ({ ...prev, [slot.id]: e.target.value }))
                          }
                          placeholder={slot.exerciseId ? 'Csere keresése...' : 'Keresés...'}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />
                        <select
                          value=""
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const ex = exercises.find((x) => x.id === e.target.value);
                            updateSlot(slot.id, {
                              exerciseId: e.target.value,
                              exerciseName: ex?.name || '',
                            });
                            setSearches((prev) => ({ ...prev, [slot.id]: '' }));
                          }}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        >
                          <option value="">
                            {getFiltered(slot.id).length === 0
                              ? 'Nincs találat'
                              : '— Válassz gyakorlatot —'}
                          </option>
                          {getFiltered(slot.id).map((ex) => (
                            <option key={ex.id} value={ex.id}>
                              {ex.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Reps */}
                      <div className="w-16 shrink-0">
                        <label className="block text-center text-xs text-gray-500 dark:text-gray-400">Ism.</label>
                        <input
                          type="text"
                          value={slot.reps}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => updateSlot(slot.id, { reps: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-2.5 text-center text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {slots.length < 4 && (
                  <button
                    type="button"
                    onClick={addSlot}
                    className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                  >
                    <Plus size={14} />
                    Gyakorlat hozzáadása
                  </button>
                )}
              </div>

              {/* Preview */}
              {filledSlots.length >= 2 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Előnézet</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-sm font-medium text-amber-900 dark:text-amber-100">
                    {filledSlots.map((s, i) => (
                      <span key={s.id} className="flex items-center gap-1">
                        <span>
                          {s.exerciseName} <span className="font-bold">×{s.reps}</span>
                        </span>
                        {i < filledSlots.length - 1 && (
                          <ArrowRight size={13} className="text-amber-500" />
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    {rounds} kör · {restBetweenRounds} mp pihenő körök közt
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === 'saved' && (
            <div className="p-4">
              {isLoadingSaved ? (
                <p className="py-8 text-center text-sm text-gray-500">Betöltés...</p>
              ) : savedComplexes.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Még nincs mentett komplex.</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Állíts össze egyet az „Összeállítás" fülön és mentsd el.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedComplexes.map((complex) => (
                    <div
                      key={complex.id}
                      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{complex.name}</p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {complex.rounds} kör · {complex.rest_between_rounds} mp pihenő
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            {complex.exercises.map((ex, i) => (
                              <span key={i} className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300">
                                <span>{ex.exerciseName} <span className="font-semibold">×{ex.reps}</span></span>
                                {i < complex.exercises.length - 1 && (
                                  <ArrowRight size={10} className="text-gray-400" />
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSaved(complex.id)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Törlés"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadSaved(complex)}
                          className="flex-1 rounded-md border border-amber-300 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
                        >
                          Szerkesztés
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSavedDirectly(complex)}
                          className="flex-1 rounded-md bg-amber-500 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
                        >
                          Hozzáadás az edzéshez
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === 'build' && (
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline w-full sm:w-auto"
            >
              Mégse
            </button>
            {user && (
              <button
                type="button"
                onClick={handleSaveToDb}
                disabled={!canAdd || isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20 sm:w-auto"
              >
                <Save size={14} />
                {isSaving ? 'Mentés...' : 'Mentés könyvtárba'}
              </button>
            )}
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="btn btn-primary flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              <Link size={15} />
              Hozzáadás az edzéstervhez
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
