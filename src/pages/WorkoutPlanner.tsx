import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, Trash2, GripVertical } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Exercise, getExercises } from '../lib/exercises';
import { createWorkout } from '../lib/workouts';
import { getMovementPatterns, MovementPattern } from '../lib/exerciseService';
import toast from 'react-hot-toast';

const workoutSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  notes: z.string().optional(),
  sections: z.array(z.object({
    name: z.string().min(1, 'Section name is required'),
    exercises: z.array(z.object({
      exerciseId: z.string().min(1, 'Exercise is required'),
      sets: z.number().min(1, 'Must have at least 1 set'),
      reps: z.number().min(1, 'Must have at least 1 rep'),
      weight: z.number().optional(),
      notes: z.string().optional(),
      restPeriod: z.number().optional(),
    })),
  })),
});

type WorkoutFormData = z.infer<typeof workoutSchema>;

const WorkoutPlanner = () => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sections, setSections] = useState([{ id: '1', name: 'Main Workout', exercises: [{ id: '1' }] }]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<{ [sectionId: string]: string }>({});
  const [movementPatternFilters, setMovementPatternFilters] = useState<{ [sectionId: string]: string }>({});


  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      sections: [{ name: 'Main Workout', exercises: [{ sets: 3, reps: 10 }] }],
    },
  });

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const data = await getExercises();
      setExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      toast.error('Failed to load exercises');
    }
  };

  const onSubmit = async (data: WorkoutFormData) => {
    try {
      setIsLoading(true);
      console.log('Form data to submit:', JSON.stringify(data, null, 2));
      
      if (!user) {
        throw new Error('User is not logged in');
      }
      
      // Validate sections before saving
      if (!data.sections || data.sections.length === 0) {
        throw new Error('Workout must have at least one section');
      }
      
      for (const section of data.sections) {
        if (!section.exercises || section.exercises.length === 0) {
          throw new Error(`Section "${section.name}" must have at least one exercise`);
        }
        
        for (const exercise of section.exercises) {
          if (!exercise.exerciseId) {
            throw new Error('All exercises must be selected');
          }
        }
      }
      
      console.log('Calling createWorkout with user_id:', user.id);
      
      const savedWorkout = await createWorkout({
        ...data,
        user_id: user.id,
      });

      console.log('Workout saved successfully:', savedWorkout);
      toast.success('Workout saved successfully');
      reset();
      setSections([{ id: '1', name: 'Main Workout', exercises: [{ id: '1' }] }]);
      setCategoryFilters({});
      setMovementPatternFilters({});
    } catch (error) {
      console.error('Error saving workout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save workout';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const addSection = () => {
    const newSectionId = Date.now().toString();
    setSections([...sections, { id: newSectionId, name: '', exercises: [{ id: '1' }] }]);
  };

  const removeSection = (sectionIndex: number) => {
    setSections(sections.filter((_, i) => i !== sectionIndex));
    const newCategoryFilters = { ...categoryFilters };
    delete newCategoryFilters[sections[sectionIndex].id];
    setCategoryFilters(newCategoryFilters);
  };

  const addExercise = (sectionIndex: number) => {
    const newSections = [...sections];
    // Simply add a new exercise with a unique ID
    newSections[sectionIndex].exercises.push({ id: Date.now().toString() });
    setSections(newSections);
  };

  const removeExercise = (sectionIndex: number, exerciseIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].exercises = newSections[sectionIndex].exercises.filter((_, i) => i !== exerciseIndex);
    setSections(newSections);
  };

  const categories = Array.from(new Set(exercises.map(ex => ex.category)));

  // Get movement patterns for a given category


  const getFilteredExercises = (sectionId: string) => {
    const selectedCategory = categoryFilters[sectionId];
    const selectedMovementPattern = movementPatternFilters[sectionId];
    
    return exercises.filter(ex => {
      // Apply category filter
      const matchesCategory = !selectedCategory || ex.category.toLowerCase() === selectedCategory.toLowerCase();
      
      // Apply movement pattern filter
      const matchesMovementPattern = !selectedMovementPattern || ex.movement_pattern === selectedMovementPattern;
      
      return matchesCategory && matchesMovementPattern;
    });
  };

  const updateCategoryFilter = (sectionId: string, category: string) => {
    // Update category filter
    setCategoryFilters(prev => {
      const newCategory = category === prev[sectionId] ? '' : category;
      return {
        ...prev,
        [sectionId]: newCategory,
      };
    });
    
    // Reset movement pattern filter when category changes
    setMovementPatternFilters(prev => ({
      ...prev,
      [sectionId]: '', 
    }));
  };
  
  const updateMovementPatternFilter = (sectionId: string, movementPattern: string) => {
    setMovementPatternFilters(prev => ({
      ...prev,
      [sectionId]: movementPattern === prev[sectionId] ? '' : movementPattern,
    }));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Plan Your Workout</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create a new workout plan by adding exercises and setting your goals.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Workout Details</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Workout Title
              </label>
              <input
                type="text"
                id="title"
                {...register('title')}
                className="input mt-1"
                placeholder="e.g., Upper Body Strength"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date
              </label>
              <input
                type="date"
                id="date"
                {...register('date')}
                className="input mt-1"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration (minutes)
              </label>
              <input
                type="number"
                id="duration"
                {...register('duration', { valueAsNumber: true })}
                className="input mt-1"
                placeholder="60"
                min="1"
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.duration.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                className="input mt-1"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Workout Sections</h2>
            <button
              type="button"
              onClick={addSection}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus size={20} />
              <span>Add Section</span>
            </button>
          </div>

          <div className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div
                key={section.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Section Name
                    </label>
                    <input
                      type="text"
                      {...register(`sections.${sectionIndex}.name`)}
                      className="input mt-1"
                      placeholder="e.g., Warm-up, Main Sets, Cool-down"
                    />
                  </div>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(sectionIndex)}
                      className="ml-4 text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>

                {/* Szekció-szintű szűrők eltávolítva, mivel minden gyakorlatnál elérhetőek */}

                <div className="space-y-4">
                  {section.exercises.map((exercise, exerciseIndex) => (
                    <div
                      key={exercise.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Exercise {exerciseIndex + 1}
                          </h3>
                        </div>
                        {section.exercises.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExercise(sectionIndex, exerciseIndex)}
                            className="text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Exercise
                          </label>
                          
                          {/* Exercise filters buttons */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            <div className="flex-1">
                              <select
                                className="input mt-1 w-full"
                                onChange={(e) => updateCategoryFilter(section.id, e.target.value)}
                                value={categoryFilters[section.id] || ''}
                              >
                                <option value="">All Categories</option>
                                {categories.map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="flex-1">
                              <select
                                className="input mt-1 w-full"
                                onChange={(e) => updateMovementPatternFilter(section.id, e.target.value)}
                                value={movementPatternFilters[section.id] || ''}
                                disabled={!categoryFilters[section.id]}
                              >
                                <option value="">All Movement Patterns</option>
                                {categoryFilters[section.id] && 
                                  exercises
                                    .filter(ex => ex.category.toLowerCase() === categoryFilters[section.id].toLowerCase())
                                    .map(ex => ex.movement_pattern)
                                    .filter((value, index, self) => self.indexOf(value) === index) // get unique values
                                    .map(pattern => {
                                      // Find the nice label for this pattern from the exerciseService
                                      const patternInfo = getMovementPatterns().find(p => p.id === pattern);
                                      const label = patternInfo ? patternInfo.label : pattern;
                                      return (
                                        <option key={pattern} value={pattern}>
                                          {label}
                                        </option>
                                      );
                                    })
                                }
                              </select>
                            </div>
                          </div>
                          
                          {/* Exercise select */}
                          <select
                            {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.exerciseId`)}
                            className="input mt-1 w-full"
                          >
                            <option value="">Select an exercise</option>
                            {getFilteredExercises(section.id).map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                {ex.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Sets
                          </label>
                          <input
                            type="number"
                            {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.sets`, { valueAsNumber: true })}
                            className="input mt-1"
                            placeholder="3"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Reps
                          </label>
                          <input
                            type="number"
                            {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.reps`, { valueAsNumber: true })}
                            className="input mt-1"
                            placeholder="10"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.weight`, { valueAsNumber: true })}
                            className="input mt-1"
                            placeholder="0"
                            min="0"
                            step="0.5"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Rest Period (seconds)
                          </label>
                          <input
                            type="number"
                            {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.restPeriod`, { valueAsNumber: true })}
                            className="input mt-1"
                            placeholder="60"
                            min="0"
                            step="5"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Notes
                          </label>
                          <input
                            type="text"
                            {...register(`sections.${sectionIndex}.exercises.${exerciseIndex}.notes`)}
                            className="input mt-1"
                            placeholder="Any specific instructions..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addExercise(sectionIndex)}
                    className="btn btn-outline w-full"
                  >
                    <Plus size={20} />
                    <span>Add Exercise to Section</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              reset();
              setSections([{ id: '1', name: 'Main Workout', exercises: [{ id: '1' }] }]);
              setCategoryFilters({});
              setMovementPatternFilters({});
            }}
            className="btn btn-outline"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save size={20} />
                <span>Save Workout</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutPlanner;