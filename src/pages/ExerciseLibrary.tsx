import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { 
  Exercise, 
  ExerciseCategory, 
  filterExercisesList,
  getExerciseTaxonomyDimensionOptions,
  getExerciseCategories,
  getExerciseCategoryMovementPatternMap,
  getExerciseCategoryLabel,
  getExerciseFMSFocuses,
  getFMSFocusOptions,
  getExerciseManualTaxonomySlugs,
  getMovementPatternLabel,
  getExercises, 
  deleteExercise
} from '../lib/exerciseService';
import ExerciseCard from '../components/exercises/ExerciseCard';
import ExerciseForm from '../components/exercises/ExerciseForm';
import ExerciseFilter from '../components/exercises/ExerciseFilter';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const FMS_FOCUS_OPTIONS = getFMSFocusOptions();
const CATEGORIES: ExerciseCategory[] = getExerciseCategories().map((category) => category.id);
const MOVEMENT_PATTERNS = getExerciseCategoryMovementPatternMap();

const ExerciseLibrary = () => {
  const { user: _user } = useAuth();
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
    selectedPatternFamily: null as string | null,
    selectedLaterality: null as string | null,
    selectedFMSFocus: null as string | null,
    selectedDifficulty: null as number | null,
    showInactive: false
  });

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setIsLoading(true);
      const data = await getExercises({ includeInactive: true });
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
    selectedPatternFamily: string | null;
    selectedLaterality: string | null;
    selectedFMSFocus: string | null;
    selectedDifficulty: number | null;
    showInactive: boolean;
  }) => {
    setFilters(newFilters);
  };

  // Apply filters
  const filteredExercises = filterExercisesList(exercises, filters, {
    isFmsCandidate: (exercise) => exercise.category === 'fms' || getExerciseFMSFocuses(exercise).length > 0,
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
  const formattedCategories = getExerciseCategories().map(category => ({
    value: category.id,
    label: getExerciseCategoryLabel(category.id),
  }));
  const formattedMovementPatterns = Object.entries(MOVEMENT_PATTERNS).reduce(
    (acc, [category, patterns]) => {
      acc[category] = patterns.map(pattern => ({
        value: pattern,
        label: getMovementPatternLabel(pattern) || pattern,
      }));
      return acc;
    },
    {} as Record<string, Array<{ value: string; label: string }>>
  );
  const patternFamilyOptions = getExerciseTaxonomyDimensionOptions(exercises, 'pattern_family');
  const lateralityOptions = getExerciseTaxonomyDimensionOptions(exercises, 'laterality');

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
              taxonomy_tag_slugs: getExerciseManualTaxonomySlugs(editingExercise),
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
            patternFamilies={patternFamilyOptions}
            lateralities={lateralityOptions}
            fmsFocuses={FMS_FOCUS_OPTIONS.map(focus => ({ value: focus.id, label: focus.label }))}
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