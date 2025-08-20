import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  Edit3, 
  Save, 
  X,
  Calendar,
  Clock,
  User
} from 'lucide-react';
import { Workout, updatePersonalWorkoutPerformance } from '../lib/workouts';
import { getExerciseById } from '../lib/exerciseService';

interface PersonalWorkoutTrackerProps {
  workout: Workout;
  onWorkoutUpdate: (updatedWorkout: Workout) => void;
  isReadOnly?: boolean;
}

interface ExerciseData {
  id: string;
  name: string;
  description: string;
}

const PersonalWorkoutTracker: React.FC<PersonalWorkoutTrackerProps> = ({
  workout,
  onWorkoutUpdate,
  isReadOnly = false
}) => {
  const [exercises, setExercises] = useState<Record<string, ExerciseData>>({});
  const [editingExercise, setEditingExercise] = useState<{sectionIndex: number, exerciseIndex: number} | null>(null);
  const [performanceData, setPerformanceData] = useState({
    actualSets: '',
    actualReps: '',
    actualWeight: '',
    personalNotes: '',
    completed: false
  });

  const loadExerciseData = useCallback(async () => {
    const exerciseData: Record<string, ExerciseData> = {};
    
    for (const section of workout.sections) {
      for (const exercise of section.exercises) {
        if (!exerciseData[exercise.exerciseId]) {
          try {
            const exerciseDetails = await getExerciseById(exercise.exerciseId);
            if (exerciseDetails) {
              exerciseData[exercise.exerciseId] = {
                id: exerciseDetails.id,
                name: exerciseDetails.name,
                description: exerciseDetails.description || ''
              };
            }
          } catch {
            console.error('Error loading exercise:', exercise.exerciseId);
            exerciseData[exercise.exerciseId] = {
              id: exercise.exerciseId,
              name: exercise.exerciseId,
              description: ''
            };
          }
        }
      }
    }
    
    setExercises(exerciseData);
  }, [workout]);

  useEffect(() => {
    loadExerciseData();
  }, [loadExerciseData]);

  const handleEditExercise = (sectionIndex: number, exerciseIndex: number) => {
    const exercise = workout.sections[sectionIndex].exercises[exerciseIndex];
    setPerformanceData({
      actualSets: exercise.actualSets?.toString() || '',
      actualReps: exercise.actualReps?.toString() || '',
      actualWeight: exercise.actualWeight?.toString() || '',
      personalNotes: exercise.personalNotes || '',
      completed: exercise.completed || false
    });
    setEditingExercise({ sectionIndex, exerciseIndex });
  };

  const handleSavePerformance = async () => {
    if (!editingExercise) return;

    try {
      const performance = {
        actualSets: performanceData.actualSets ? parseInt(performanceData.actualSets) : undefined,
        actualReps: performanceData.actualReps || undefined,
        actualWeight: performanceData.actualWeight ? parseFloat(performanceData.actualWeight) : undefined,
        personalNotes: performanceData.personalNotes || undefined,
        completed: performanceData.completed
      };

      const updatedWorkout = await updatePersonalWorkoutPerformance(
        workout.id,
        editingExercise.sectionIndex,
        editingExercise.exerciseIndex,
        performance
      );

      if (updatedWorkout) {
        onWorkoutUpdate(updatedWorkout);
      }

      setEditingExercise(null);
      setPerformanceData({
        actualSets: '',
        actualReps: '',
        actualWeight: '',
        personalNotes: '',
        completed: false
      });
    } catch (error) {
      console.error('Error saving performance:', error);
      alert('Nem sikerült menteni a teljesítményt');
    }
  };

  const handleCancelEdit = () => {
    setEditingExercise(null);
    setPerformanceData({
      actualSets: '',
      actualReps: '',
      actualWeight: '',
      personalNotes: '',
      completed: false
    });
  };

  const getCompletionStats = () => {
    let total = 0;
    let completed = 0;

    workout.sections.forEach(section => {
      section.exercises.forEach(exercise => {
        total++;
        if (exercise.completed) completed++;
      });
    });

    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const stats = getCompletionStats();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {workout.title}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(workout.date).toLocaleDateString('hu-HU')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{workout.duration} perc</span>
              </div>
              {workout.shared_from && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>Megosztott edzés</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.percentage.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stats.completed}/{stats.total} gyakorlat
            </div>
            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {workout.notes && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">{workout.notes}</p>
          </div>
        )}
      </div>

      {/* Workout sections */}
      <div className="p-6">
        {workout.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-8 last:mb-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {section.name}
            </h3>
            
            <div className="space-y-4">
              {section.exercises.map((exercise, exerciseIndex) => {
                const exerciseData = exercises[exercise.exerciseId];
                const isEditing = editingExercise?.sectionIndex === sectionIndex && 
                                editingExercise?.exerciseIndex === exerciseIndex;
                
                return (
                  <div
                    key={exerciseIndex}
                    className={`border rounded-lg p-4 transition-colors ${
                      exercise.completed 
                        ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {exerciseData?.name || exercise.exerciseId}
                          </h4>
                          {exercise.completed && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                        </div>

                        {/* Planned vs Actual */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Tervezett:</span>
                            <div className="text-gray-600 dark:text-gray-400">
                              {exercise.sets} sorozat × {exercise.reps} ismétlés
                              {exercise.weight && <span> @ {exercise.weight}kg</span>}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Teljesített:</span>
                            <div className="text-gray-600 dark:text-gray-400">
                              {exercise.actualSets || '-'} sorozat × {exercise.actualReps || '-'} ismétlés
                              {exercise.actualWeight && <span> @ {exercise.actualWeight}kg</span>}
                            </div>
                          </div>
                        </div>

                        {exercise.personalNotes && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Jegyzet: </span>
                            <span className="text-gray-600 dark:text-gray-400">{exercise.personalNotes}</span>
                          </div>
                        )}
                      </div>

                      {!isReadOnly && (
                        <button
                          onClick={() => handleEditExercise(sectionIndex, exerciseIndex)}
                          className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Edit form */}
                    {isEditing && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Sorozatok
                            </label>
                            <input
                              type="number"
                              value={performanceData.actualSets}
                              onChange={(e) => setPerformanceData(prev => ({ ...prev, actualSets: e.target.value }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              placeholder={exercise.sets.toString()}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Ismétlések
                            </label>
                            <input
                              type="text"
                              value={performanceData.actualReps}
                              onChange={(e) => setPerformanceData(prev => ({ ...prev, actualReps: e.target.value }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              placeholder={exercise.reps.toString()}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Súly (kg)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={performanceData.actualWeight}
                              onChange={(e) => setPerformanceData(prev => ({ ...prev, actualWeight: e.target.value }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              placeholder={exercise.weight?.toString() || '0'}
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Személyes jegyzet
                          </label>
                          <textarea
                            value={performanceData.personalNotes}
                            onChange={(e) => setPerformanceData(prev => ({ ...prev, personalNotes: e.target.value }))}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            rows={2}
                            placeholder="Megjegyzések a gyakorlatról..."
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={performanceData.completed}
                              onChange={(e) => setPerformanceData(prev => ({ ...prev, completed: e.target.checked }))}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Gyakorlat befejezve</span>
                          </label>

                          <div className="flex gap-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleSavePerformance}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                            >
                              <Save className="h-4 w-4" />
                              Mentés
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalWorkoutTracker;
