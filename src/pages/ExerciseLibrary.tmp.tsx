import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { 
  Exercise, 
  ExerciseCategory, 
  MovementPattern, 
  getExercises, 
  deleteExercise, 
  updateExercise 
} from '../lib/exerciseService';
import ExerciseCard from '../components/exercises/ExerciseCard';
import ExerciseForm from '../components/exercises/ExerciseForm';
import ExerciseFilter from '../components/exercises/ExerciseFilter';
import ConfirmDialog from '../components/ui/ConfirmDialog';

// Define the categories and movement patterns
const CATEGORIES: ExerciseCategory[] = [
  'strength_training',
  'cardio',
  'kettlebell',
  'mobility_flexibility',
  'hiit',
  'recovery'
];

// Human-readable category labels
const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  'strength_training': 'Strength Training',
  'cardio': 'Cardio',
  'kettlebell': 'Kettlebell',
  'mobility_flexibility': 'Mobility & Flexibility',
  'hiit': 'HIIT',
  'recovery': 'Recovery'
};

// Create a mapping of categories to their movement patterns
const MOVEMENT_PATTERNS: Record<ExerciseCategory, MovementPattern[]> = {
  'kettlebell': [
    'gait_stability',
    'gait_crawling',
    'hip_dominant_bilateral',
    'hip_dominant_unilateral',
    'knee_dominant_bilateral',
    'knee_dominant_unilateral',
    'horizontal_push_bilateral',
    'horizontal_push_unilateral',
    'horizontal_pull_bilateral',
    'horizontal_pull_unilateral',
    'vertical_push_bilateral',
    'vertical_push_unilateral',
    'vertical_pull_bilateral',
    'stability_anti_extension',
    'stability_anti_rotation',
    'stability_anti_flexion',
    'core_other',
    'local_exercises',
    'upper_body_mobility',
    'aslr_correction_first',
    'aslr_correction_second',
    'sm_correction_first',
    'sm_correction_second',
    'stability_correction',
    'mobilization'
  ],
  'mobility_flexibility': [
    'upper_body_mobility',
    'mobilization'
  ],
  'strength_training': [
    'hip_dominant_bilateral',
    'hip_dominant_unilateral',
    'knee_dominant_bilateral',
    'knee_dominant_unilateral',
    'horizontal_push_bilateral',
    'horizontal_push_unilateral',
    'horizontal_pull_bilateral',
    'horizontal_pull_unilateral',
    'vertical_push_bilateral',
    'vertical_push_unilateral',
    'vertical_pull_bilateral',
    'core_other'
  ],
  'cardio': [
    'gait_stability'
  ],
  'hiit': [
    'gait_stability',
    'hip_dominant_bilateral',
    'knee_dominant_bilateral'
  ],
  'recovery': [
    'mobilization',
    'upper_body_mobility'
  ]
};

// Movement pattern labels in Hungarian
const MOVEMENT_PATTERN_LABELS: Record<MovementPattern, string> = {
  'gait_stability': 'Gait – törzs stabilitás',
  'gait_crawling': 'Gait mászásban – törzs stabilitás',
  'hip_dominant_bilateral': 'Csípő domináns – bilaterális (FMS aktív lábemelés)',
  'hip_dominant_unilateral': 'Csípő domináns – unilaterális (ASLR)',
  'knee_dominant_bilateral': 'Térd domináns – bilaterális (ASLR)',
  'knee_dominant_unilateral': 'Térd domináns – unilaterális (Kitörés)',
  'horizontal_push_bilateral': 'Horizontális nyomás – bilaterális (SM + törzs)',
  'horizontal_push_unilateral': 'Horizontális nyomás – unilaterális (SM + törzs)',
  'horizontal_pull_bilateral': 'Horizontális húzás – bilaterális (SM)',
  'horizontal_pull_unilateral': 'Horizontális húzás – unilaterális (SM + törzs)',
  'vertical_push_bilateral': 'Vertikális nyomás – bilaterális',
  'vertical_push_unilateral': 'Vertikális nyomás – unilaterális (SM + törzs)',
  'vertical_pull_bilateral': 'Vertikális húzás – bilaterális',
  'stability_anti_extension': 'Stabilitás – anti-extenzió',
  'stability_anti_rotation': 'Stabilitás – anti-rotáció',
  'stability_anti_flexion': 'Stabilitás – anti-flexió',
  'core_other': 'Core – egyéb',
  'local_exercises': 'Lokális gyakorlatok (L)',
  'upper_body_mobility': 'Felsőtest mobilizálás',
  'aslr_correction_first': 'ASLR korrekció – első pár',
  'aslr_correction_second': 'ASLR korrekció – második hármas',
  'sm_correction_first': 'SM korrekció – első pár',
  'sm_correction_second': 'SM korrekció – második hármas',
  'stability_correction': 'Stabilitás korrekció',
  'mobilization': 'Mobilizálás'
};

const ExerciseLibrary = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    searchQuery: '',
    selectedCategory: null as string | null,
    selectedMovementPattern: null as string | null,
    selectedDifficulty: null as number | null,
    showInactive: false
  });

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      const data = await getExercises();
      setExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      toast.error('Failed to load exercises');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setShowAddForm(true);
  };

  const handleDeleteExercise = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!exerciseToDelete) return;
    
    try {
      await deleteExercise(exerciseToDelete.id);
      toast.success('Exercise deleted successfully');
      await loadExercises();
    } catch (error) {
      console.error('Failed to delete exercise:', error);
      toast.error('Failed to delete exercise');
    } finally {
      setDeleteConfirmOpen(false);
      setExerciseToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingExercise(null);
    loadExercises();
  };

  const handleFilterChange = (newFilters: {
    searchQuery: string;
    selectedCategory: string | null;
    selectedMovementPattern: string | null;
    selectedDifficulty: number | null;
    showInactive: boolean;
  }) => {
    setFilters(newFilters);
  };

  // Apply filters
  const filteredExercises = exercises.filter(exercise => {
    // Filter by search query
    const matchesSearch = filters.searchQuery 
      ? exercise.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        (exercise.description?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ?? false)
      : true;
    
    // Filter by category
    const matchesCategory = filters.selectedCategory 
      ? exercise.category === filters.selectedCategory
      : true;
    
    // Filter by movement pattern
    const matchesMovementPattern = filters.selectedMovementPattern
      ? exercise.movement_pattern === filters.selectedMovementPattern
      : true;
    
    // Filter by difficulty
    const matchesDifficulty = filters.selectedDifficulty
      ? exercise.difficulty === filters.selectedDifficulty
      : true;
    
    // Filter by active status
    const matchesActiveState = !filters.showInactive
      ? exercise.is_active
      : true;
    
    return matchesSearch && matchesCategory && matchesMovementPattern && matchesDifficulty && matchesActiveState;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading exercises...</p>
        </div>
      </div>
    );
  }

  // Convert the categories and movement patterns to the format expected by the components
  const formattedCategories = CATEGORIES.map(cat => CATEGORY_LABELS[cat]);
  const formattedMovementPatterns = Object.entries(MOVEMENT_PATTERNS).reduce(
    (acc, [category, patterns]) => {
      const categoryLabel = CATEGORY_LABELS[category as ExerciseCategory];
      acc[categoryLabel] = patterns.map(pattern => MOVEMENT_PATTERN_LABELS[pattern]);
      return acc;
    },
    {} as Record<string, string[]>
  );

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exercise Library</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Browse and search through our collection of exercises</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => {
              setEditingExercise(null);
              setShowAddForm(!showAddForm);
            }}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            {showAddForm ? (
              <>
                <X size={20} />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus size={20} />
                <span>Add Exercise</span>
              </>
            )}
          </button>
        )}
      </div>

      {showAddForm ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
            {editingExercise ? 'Edit Exercise' : 'Add New Exercise'}
          </h2>
          
          <ExerciseForm
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowAddForm(false);
              setEditingExercise(null);
            }}
            categories={CATEGORIES} 
            movementPatterns={MOVEMENT_PATTERNS}
            initialData={editingExercise ? {
              id: editingExercise.id,
              name: editingExercise.name,
              description: editingExercise.description || undefined,
              instructions: editingExercise.instructions || undefined,
              category: editingExercise.category,
              movement_pattern: editingExercise.movement_pattern,
              difficulty: editingExercise.difficulty,
              image_url: editingExercise.image_url || undefined,
              video_url: editingExercise.video_url || undefined,
              is_active: editingExercise.is_active
            } : null}
          />
        </div>
      ) : (
        <>
          {/* Filter component */}
          <ExerciseFilter
            categories={formattedCategories}
            movementPatterns={formattedMovementPatterns}
            onFilterChange={handleFilterChange}
            showInactiveToggle={isAdmin}
          />

          {/* Exercise grid */}
          {filteredExercises.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-600 dark:text-gray-400">No exercises found matching your criteria</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredExercises.map(exercise => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={isAdmin ? handleEditExercise : undefined}
                  onDelete={isAdmin ? handleDeleteExercise : undefined}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Exercise"
        message={`Are you sure you want to delete "${exerciseToDelete?.name}"? This action will mark the exercise as inactive but not permanently remove it from the database.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        confirmButtonStyle="danger"
      />
    </div>
  );
};

export default ExerciseLibrary;