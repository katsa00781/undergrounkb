import React, { useState } from 'react';
import WorkoutCalendar from '../components/WorkoutCalendar';
import { WorkoutWithLog, computeLogDuration, computeTotalVolume } from '../lib/workouts';
import { Calendar, CheckCircle2, Clock, Copy, Dumbbell, Edit2 } from 'lucide-react';
import WorkoutSectionHeader from '../components/workouts/WorkoutSectionHeader';
import { useNavigate } from 'react-router-dom';
import { formatWorkoutDate, formatWorkoutDuration } from '../lib/workoutDisplay';

const WorkoutCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedWorkouts, setSelectedWorkouts] = useState<WorkoutWithLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSelect = (date: Date, workouts: WorkoutWithLog[]) => {
    setSelectedDate(date);
    setSelectedWorkouts(workouts);
  };

  const handleEditWorkout = (workout: WorkoutWithLog) => {
    navigate('/workout-planner', { state: { editWorkout: workout } });
  };

  const handleCopyWorkout = (workout: WorkoutWithLog) => {
    navigate('/workout-planner', { state: { copyWorkout: workout } });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <WorkoutSectionHeader
          title="Edzésnaptár"
          description="Napi bontásban nézheted át az edzéseidet, és azonnal tovább tudsz menni szerkesztésre vagy új napra másolásra."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Component */}
          <div className="lg:col-span-2">
            <WorkoutCalendar onDateSelect={handleDateSelect} />
          </div>

          {/* Selected Date Details */}
          <div className="space-y-6">
            {selectedDate && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {formatWorkoutDate(selectedDate)}
                </h3>

                {selectedWorkouts.length > 0 ? (
                  <div className="space-y-4">
                    {selectedWorkouts.map((workout) => {
                      const logDuration = workout.latestLog ? computeLogDuration(workout.latestLog) : null;
                      return (
                      <div
                        key={workout.id}
                        className={`p-4 rounded-lg border ${
                          workout.isCompleted
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {workout.title}
                            </h4>
                            {workout.isCompleted && (
                              <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Teljesítve{workout.latestLog ? ` · ${formatWorkoutDate(workout.latestLog.date)}` : ''}
                                {logDuration !== null ? ` · ${logDuration} p` : ''}
                              </span>
                            )}
                          </div>
                          {workout.isCompleted
                            ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                            : <Dumbbell className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          }
                        </div>

                        <div className="mb-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditWorkout(workout)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-600"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Szerkesztés
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyWorkout(workout)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-600"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Másolás új napra
                          </button>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span>{formatWorkoutDuration(workout.duration)}</span>
                          </div>

                          {workout.notes && (
                            <div className="mt-3">
                              <p className="text-gray-700 dark:text-gray-300 text-sm">
                                {workout.notes}
                              </p>
                            </div>
                          )}

                          {workout.isCompleted && workout.latestLog?.sections && workout.latestLog.sections.length > 0 ? (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">
                                TELJESÍTETT GYAKORLATOK:
                              </p>
                              {(() => {
                                const logSections = workout.latestLog!.sections;
                                const completedExercises = logSections
                                  .flatMap(s => s.exercises)
                                  .filter(e => e.completed);
                                const volume = computeTotalVolume(logSections);
                                return (
                                  <>
                                    <div className="space-y-1">
                                      {completedExercises.slice(0, 5).map((ex, idx) => (
                                        <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                          • {ex.name ?? 'Gyakorlat'}
                                          {ex.actualSets != null && ex.actualReps != null
                                            ? `: ${ex.actualSets}×${ex.actualReps}${ex.actualWeight ? ` @ ${ex.actualWeight} kg` : ''}`
                                            : ''}
                                        </div>
                                      ))}
                                      {completedExercises.length > 5 && (
                                        <div className="text-xs text-gray-500 dark:text-gray-500">
                                          és még {completedExercises.length - 5} gyakorlat...
                                        </div>
                                      )}
                                    </div>
                                    {volume > 0 && (
                                      <div className="mt-2 text-xs font-medium text-green-700 dark:text-green-400">
                                        Összes tömeg: {volume.toLocaleString('hu-HU')} kg
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            workout.sections && workout.sections.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                  TERVEZETT GYAKORLATOK:
                                </p>
                                <div className="space-y-1">
                                  {workout.sections.slice(0, 3).map((section, idx) => (
                                    <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                      • {section.name}
                                    </div>
                                  ))}
                                  {workout.sections.length > 3 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                      és még {workout.sections.length - 3} szekció...
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Ezen a napon nem volt edzés
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Válassz egy másik napot a naptárból
                    </p>
                  </div>
                )}
              </div>
            )}

            {!selectedDate && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Válassz egy napot a naptárból
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Megtekintheted az aznapi edzéseket és részleteket
                  </p>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Gyors statisztikák
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Heti cél:</span>
                  <span className="font-medium text-gray-900 dark:text-white">3-4 edzés</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Átlag időtartam:</span>
                  <span className="font-medium text-gray-900 dark:text-white">45 perc</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Kedvenc nap:</span>
                  <span className="font-medium text-gray-900 dark:text-white">Hétfő</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutCalendarPage;
