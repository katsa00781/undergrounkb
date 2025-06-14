import { useState } from 'react';
import { Play, Edit, Trash2, Info } from 'lucide-react';
import type { Exercise } from '../../lib/exerciseService';

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exercise: Exercise) => void;
  isAdmin?: boolean;
}

const difficultyLabels: Record<number, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Moderate',
  4: 'Hard',
  5: 'Very Hard'
};

export const ExerciseCard = ({ exercise, onEdit, onDelete, isAdmin = false }: ExerciseCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-success-100 text-success-800';
      case 2: return 'bg-success-200 text-success-800';
      case 3: return 'bg-warning-100 text-warning-800';
      case 4: return 'bg-warning-200 text-warning-800';
      case 5: return 'bg-error-100 text-error-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`rounded-lg border ${!exercise.is_active ? 'border-gray-300 bg-gray-50 opacity-70' : 'border-gray-200 bg-white'} p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{exercise.name}</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-md bg-primary-100 px-2 py-1 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-300">
              {exercise.category}
            </span>
            <span className="inline-flex items-center rounded-md bg-secondary-100 px-2 py-1 text-xs font-medium text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300">
              {exercise.movement_pattern}
            </span>
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
              {difficultyLabels[exercise.difficulty] || `Level ${exercise.difficulty}`}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="Toggle details"
          >
            <Info size={18} />
          </button>
          {exercise.video_url && (
            <a
              href={exercise.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Watch video"
            >
              <Play size={18} />
            </a>
          )}
          {(isAdmin || onEdit) && (
            <button
              onClick={() => onEdit?.(exercise)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Edit"
            >
              <Edit size={18} />
            </button>
          )}
          {(isAdmin || onDelete) && (
            <button
              onClick={() => onDelete?.(exercise)}
              className="rounded-full p-1 text-gray-400 hover:bg-error-100 hover:text-error-600 dark:hover:bg-error-900 dark:hover:text-error-300"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-3 dark:border-gray-700">
          {exercise.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{exercise.description}</p>
            </div>
          )}
          
          {exercise.instructions && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Instructions</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{exercise.instructions}</p>
            </div>
          )}

          {exercise.image_url && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Image</h4>
              <div className="mt-1 h-48 w-full overflow-hidden rounded-md">
                <img 
                  src={exercise.image_url} 
                  alt={exercise.name}
                  className="h-full w-full object-cover" 
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;
