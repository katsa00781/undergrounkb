import { useState } from 'react';
import { X, Timer } from 'lucide-react';
import type { Section, SectionExercise } from '../../pages/WorkoutPlanner';

export const CARDIO_PREFIX = 'Kardió';

export const isCardioSection = (section: { name: string }) =>
  section.name.startsWith(CARDIO_PREFIX);

export type CardioActivityType =
  | 'treadmill_walk'
  | 'treadmill_run'
  | 'rowing'
  | 'bike'
  | 'elliptical'
  | 'other';

const ACTIVITY_OPTIONS: { value: CardioActivityType; label: string; hasIncline: boolean; hasSplit: boolean }[] = [
  { value: 'treadmill_walk', label: 'Futópad – gyaloglás', hasIncline: true, hasSplit: false },
  { value: 'treadmill_run', label: 'Futópad – futás', hasIncline: true, hasSplit: false },
  { value: 'rowing', label: 'Evezőpad', hasIncline: false, hasSplit: true },
  { value: 'bike', label: 'Szobabicikli', hasIncline: false, hasSplit: false },
  { value: 'elliptical', label: 'Elliptikus tréner', hasIncline: false, hasSplit: false },
  { value: 'other', label: 'Egyéb kardió', hasIncline: false, hasSplit: false },
];

interface CardioSectionBuilderProps {
  onAdd: (section: Section) => void;
  onClose: () => void;
}

export default function CardioSectionBuilder({ onAdd, onClose }: CardioSectionBuilderProps) {
  const [activityType, setActivityType] = useState<CardioActivityType>('treadmill_walk');
  const [duration, setDuration] = useState<number | ''>(30);
  const [distance, setDistance] = useState<number | ''>('');
  const [speed, setSpeed] = useState<number | ''>('');
  const [incline, setIncline] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const selected = ACTIVITY_OPTIONS.find((o) => o.value === activityType)!;
  const canAdd = duration !== '' && Number(duration) > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    const sectionId = Date.now().toString();
    const activityLabel = selected.label;

    const exercise: SectionExercise = {
      id: `${sectionId}-1`,
      exerciseId: 'cardio-session',
      sets: 1,
      reps: 1,
      notes: notes || undefined,
      cardioActivityType: activityType,
      cardioDuration: Number(duration),
      cardioDistance: distance !== '' ? Number(distance) : undefined,
      cardioSpeed: speed !== '' ? Number(speed) : undefined,
      cardioIncline: incline !== '' ? Number(incline) : undefined,
    };

    onAdd({
      id: sectionId,
      name: `${CARDIO_PREFIX} – ${activityLabel}`,
      exercises: [exercise],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Timer size={18} className="text-sky-600 dark:text-sky-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Kardió edzés hozzáadása
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

        <div className="space-y-4 p-4">
          {/* Activity type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tevékenység
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as CardioActivityType)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {ACTIVITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration + Distance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Időtartam (perc) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={duration}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Távolság (km) <span className="text-xs text-gray-400">(opt.)</span>
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={distance}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setDistance(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="2.5"
              />
            </div>
          </div>

          {/* Speed + Incline (activity specific) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {selected.hasSplit ? 'Split (mp/500m)' : 'Sebesség (km/h)'}
                <span className="ml-1 text-xs text-gray-400">(opt.)</span>
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={speed}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setSpeed(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder={selected.hasSplit ? '120' : '5.0'}
              />
            </div>
            {selected.hasIncline ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dőlésszög (%) <span className="text-xs text-gray-400">(opt.)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={incline}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setIncline(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="2"
                />
              </div>
            ) : (
              <div /> /* spacer */
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Megjegyzés <span className="text-xs text-gray-400">(opcionális)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="pl. Z2 pulzuszóna, könnyű tempó"
            />
          </div>

          {/* Preview */}
          {canAdd && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 dark:border-sky-800 dark:bg-sky-950/30">
              <p className="text-xs font-medium text-sky-700 dark:text-sky-300">Előnézet</p>
              <p className="mt-1 text-sm font-semibold text-sky-900 dark:text-sky-100">
                {selected.label}
              </p>
              <p className="mt-0.5 text-sm text-sky-700 dark:text-sky-300">
                {duration} perc
                {distance !== '' ? ` · ${distance} km` : ''}
                {speed !== '' ? ` · ${speed} ${selected.hasSplit ? 'mp/500m' : 'km/h'}` : ''}
                {incline !== '' && selected.hasIncline ? ` · ${incline}% dőlés` : ''}
              </p>
              {notes && <p className="mt-1 text-xs text-sky-600 dark:text-sky-400">{notes}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline w-full sm:w-auto">
            Mégse
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            <Timer size={15} />
            Hozzáadás az edzéstervhez
          </button>
        </div>
      </div>
    </div>
  );
}
