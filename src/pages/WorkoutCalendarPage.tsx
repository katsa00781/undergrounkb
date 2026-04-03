import React, { useState } from 'react';
import WorkoutCalendar from '../components/WorkoutCalendar';
import { Workout } from '../lib/workouts';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Calendar, Clock, Copy, Dumbbell, Edit2 } from 'lucide-react';
import WorkoutSectionHeader from '../components/workouts/WorkoutSectionHeader';
import { useNavigate } from 'react-router-dom';

const WorkoutCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedWorkouts, setSelectedWorkouts] = useState<Workout[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSelect = (date: Date, workouts: Workout[]) => {
    setSelectedDate(date);
    setSelectedWorkouts(workouts);
  };

  const handleEditWorkout = (workout: Workout) => {
    navigate('/workout-planner', { state: { editWorkout: workout } });
  };

  const handleCopyWorkout = (workout: Workout) => {
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
                  {format(selectedDate, 'yyyy. MMMM d.', { locale: hu })}
                </h3>

                {selectedWorkouts.length > 0 ? (
                  <div className="space-y-4">
                    {selectedWorkouts.map((workout) => (
                      <div
                        key={workout.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {workout.title}
                          </h4>
                          <Dumbbell className="h-5 w-5 text-blue-500 flex-shrink-0" />
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
                            <span>{Math.round(workout.duration / 60)} perc</span>
                          </div>

                          {workout.notes && (
                            <div className="mt-3">
                              <p className="text-gray-700 dark:text-gray-300 text-sm">
                                {workout.notes}
                              </p>
                            </div>
                          )}

                          {workout.sections && workout.sections.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                GYAKORLATOK:
                              </p>
                              <div className="space-y-1">
                                {workout.sections.slice(0, 3).map((section, idx) => (
                                  <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                    • {section.name}
                                  </div>
                                ))}
                                {workout.sections.length > 3 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-500">
                                    és még {workout.sections.length - 3} gyakorlat...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
