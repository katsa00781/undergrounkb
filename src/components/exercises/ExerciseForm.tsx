import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { 
  ExerciseTaxonomyTag,
  ExerciseCategory, 
  MovementPattern, 
  createExercise, 
  getDerivedTaxonomySlugsForExerciseShape,
  getExerciseCategoryLabel,
  getMovementPatternLabel,
  listExerciseTaxonomyTags,
  updateExercise 
} from '../../lib/exerciseService';
import { useAuth } from '../../hooks/useAuth';

// Schema that matches the actual database structure
const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  movement_pattern: z.string().min(1, 'Movement pattern is required'),
  taxonomy_tag_slugs: z.array(z.string()).default([]),
  difficulty: z.number().int().min(1).max(5),
  image_url: z.string().url().optional().or(z.literal('')),
  video_url: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean().default(true)
});

export type ExerciseFormData = z.infer<typeof exerciseSchema>;

// Mapping from numeric difficulty to human-readable labels
const difficultyLabels: Record<number, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Moderate',
  4: 'Hard',
  5: 'Very Hard'
};

interface ExerciseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  categories: ExerciseCategory[];
  movementPatterns: Record<ExerciseCategory, MovementPattern[]>;
  initialData?: Partial<ExerciseFormData> & { id?: string } | null;
}

export const ExerciseForm = ({ 
  onSuccess, 
  onCancel,
  categories,
  movementPatterns,
  initialData 
}: ExerciseFormProps) => {
  const { user } = useAuth();
  const [availableMovementPatterns, setAvailableMovementPatterns] = useState<MovementPattern[]>([]);
  const [taxonomyTags, setTaxonomyTags] = useState<ExerciseTaxonomyTag[]>([]);
  const isEditing = Boolean(initialData?.id);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      instructions: initialData?.instructions || '',
      category: initialData?.category || '',
      movement_pattern: initialData?.movement_pattern || '',
      taxonomy_tag_slugs: initialData?.taxonomy_tag_slugs || [],
      difficulty: initialData?.difficulty !== undefined ? initialData.difficulty : 3,
      image_url: initialData?.image_url || '',
      video_url: initialData?.video_url || '',
      is_active: initialData?.is_active !== undefined ? initialData.is_active : true
    }
  });

  const selectedCategory = watch('category') as ExerciseCategory;
  const selectedMovementPattern = watch('movement_pattern') as MovementPattern;
  const selectedTaxonomyTagSlugs = watch('taxonomy_tag_slugs');
  const derivedTaxonomySlugs = selectedCategory && selectedMovementPattern
    ? getDerivedTaxonomySlugsForExerciseShape({
        category: selectedCategory,
        movement_pattern: selectedMovementPattern,
      })
    : [];
  const selectableManualTaxonomyTags = taxonomyTags.filter((tag) => !derivedTaxonomySlugs.includes(tag.slug));

  // Update movement patterns when category changes
  useEffect(() => {
    if (selectedCategory) {
      setAvailableMovementPatterns(movementPatterns[selectedCategory] || []);
    }
  }, [selectedCategory, movementPatterns]);

  useEffect(() => {
    const loadTaxonomyTags = async () => {
      try {
        const tags = await listExerciseTaxonomyTags({
          dimensions: ['category', 'equipment', 'pattern_family', 'laterality'],
        });
        setTaxonomyTags(tags);
      } catch (error) {
        console.error('Failed to load exercise taxonomy tags:', error);
      }
    };

    void loadTaxonomyTags();
  }, []);

  const onSubmit = async (data: ExerciseFormData) => {
    try {
      if (!user) {
        toast.error('You must be logged in to manage exercises');
        return;
      }

      const formattedData = {
        name: data.name,
        description: data.description,
        instructions: data.instructions,
        category: data.category as ExerciseCategory,
        movement_pattern: data.movement_pattern as MovementPattern,
        taxonomyTagSlugs: data.taxonomy_tag_slugs.filter((slug) => !derivedTaxonomySlugs.includes(slug)),
        difficulty: data.difficulty,
        image_url: data.image_url || null,
        video_url: data.video_url || null,
        is_active: data.is_active
      };

      if (isEditing && initialData?.id) {
        // Update existing exercise
        await updateExercise(initialData.id, formattedData);
        toast.success('Exercise updated successfully!');
      } else {
        // Create new exercise
        await createExercise({
          ...formattedData,
          created_by: user.id
        });
        toast.success('Exercise created successfully!');
      }

      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving exercise:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save exercise';
      toast.error(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Exercise Name *
          </label>
          <input
            type="text"
            {...register('name')}
            className="input mt-1 w-full"
            placeholder="e.g., Kettlebell Swing"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category *
          </label>
          <select {...register('category')} className="input mt-1 w-full">
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {getExerciseCategoryLabel(category)}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Movement Pattern *
          </label>
          <select {...register('movement_pattern')} className="input mt-1 w-full">
            <option value="">Select a movement pattern</option>
            {availableMovementPatterns.map(pattern => (
              <option key={pattern} value={pattern}>
                {getMovementPatternLabel(pattern) || pattern}
              </option>
            ))}
          </select>
          {errors.movement_pattern && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.movement_pattern.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Automatikus DB-besorolás
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {derivedTaxonomySlugs.length > 0 ? (
              taxonomyTags
                .filter((tag) => derivedTaxonomySlugs.includes(tag.slug))
                .map((tag) => (
                  <span key={tag.slug} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {tag.label}
                  </span>
                ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">A kategória és a mozgásminta kiválasztása után itt látszanak az automatikusan képzett címkék.</p>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            További DB-címkék
          </label>
          <Controller
            control={control}
            name="taxonomy_tag_slugs"
            render={({ field }) => (
              <select
                multiple
                value={field.value}
                onChange={(event) => {
                  const selectedValues = Array.from(event.target.selectedOptions).map((option) => option.value);
                  field.onChange(selectedValues);
                }}
                className="input mt-1 min-h-40 w-full"
              >
                {selectableManualTaxonomyTags.map((tag) => (
                  <option key={tag.slug} value={tag.slug}>
                    {tag.label} ({tag.dimension})
                  </option>
                ))}
              </select>
            )}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Itt adhatsz hozzá plusz besorolást, például Kettlebellt egy erő + vertikális nyomás + unilaterális gyakorlathoz.
          </p>
          {selectedTaxonomyTagSlugs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {taxonomyTags
                .filter((tag) => selectedTaxonomyTagSlugs.includes(tag.slug))
                .map((tag) => (
                  <span key={tag.slug} className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                    {tag.label}
                  </span>
                ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Difficulty *
          </label>
          <Controller
            control={control}
            name="difficulty"
            render={({ field }) => (
              <div className="mt-1">
                <div className="flex items-center justify-between">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="mt-1 text-center">
                  {difficultyLabels[field.value] || `Level ${field.value}`}
                </div>
              </div>
            )}
          />
          {errors.difficulty && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.difficulty.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="input mt-1 w-full"
            placeholder="Describe the exercise and its benefits..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Instructions
          </label>
          <textarea
            {...register('instructions')}
            rows={4}
            className="input mt-1 w-full"
            placeholder="Step-by-step instructions for performing the exercise..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Image URL
          </label>
          <input
            type="url"
            {...register('image_url')}
            className="input mt-1 w-full"
            placeholder="https://example.com/image.jpg"
          />
          {errors.image_url && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.image_url.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Video URL
          </label>
          <input
            type="url"
            {...register('video_url')}
            className="input mt-1 w-full"
            placeholder="https://youtube.com/watch?v=..."
          />
          {errors.video_url && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.video_url.message}</p>
          )}
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-4">
        {onCancel && (
          <button 
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? 'Saving...' : 'Save Exercise'}
        </button>
      </div>
    </form>
  );
};

export default ExerciseForm;
