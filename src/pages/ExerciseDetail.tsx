import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Dumbbell, Target, AlertCircle, Play, Bookmark, Share2 } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscleGroups: string[];
  description: string;
  imageUrl?: string;
  instructions: string[];
  tips: string[];
  duration: string;
  calories: number;
  videoUrl?: string;
}

const SAMPLE_EXERCISE: Exercise = {
  id: '1',
  name: 'Barbell Back Squat',
  category: 'Strength Training',
  equipment: 'Barbell, Squat Rack',
  difficulty: 'intermediate',
  muscleGroups: ['Quadriceps', 'Hamstrings', 'Glutes', 'Core'],
  description: 'A compound exercise targeting the lower body and core muscles, essential for building overall strength and muscle mass.',
  imageUrl: 'https://images.pexels.com/photos/4164761/pexels-photo-4164761.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  instructions: [
    'Position the barbell on your upper back, resting it on your traps or rear deltoids',
    'Stand with feet shoulder-width apart, toes slightly pointed outward',
    'Brace your core and maintain a neutral spine',
    'Begin the descent by breaking at the hips and knees simultaneously',
    'Lower yourself until your thighs are parallel to the ground or slightly below',
    'Drive through your heels to return to the starting position',
    'Maintain proper form throughout the movement'
  ],
  tips: [
    'Keep your chest up and core engaged throughout the movement',
    'Track your knees in line with your toes',
    'Breathe in during the descent and exhale during the ascent',
    'Start with lighter weights to perfect form before increasing load'
  ],
  duration: '45-60 seconds per set',
  calories: 8,
  videoUrl: 'https://example.com/squat-tutorial'
};

const ExerciseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Simulate API call
    const fetchExercise = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setExercise(SAMPLE_EXERCISE);
      } catch (err) {
        setError('Failed to load exercise details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercise();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading exercise details...</p>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-error-500" />
          <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Exercise not found</h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{error || 'The exercise you\'re looking for doesn\'t exist.'}</p>
          <Link to="/exercises" className="btn btn-primary mt-4">
            Back to Exercise Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/exercises"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={20} />
          <span>Back to Library</span>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Exercise image and basic info */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {exercise.imageUrl && (
              <img
                src={exercise.imageUrl}
                alt={exercise.name}
                className="h-64 w-full object-cover lg:h-96"
              />
            )}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white lg:text-3xl">
                  {exercise.name}
                </h1>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className={`rounded-full p-2 transition-colors ${
                      isSaved
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Bookmark size={20} />
                  </button>
                  <button className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
              
              <p className="mt-4 text-gray-600 dark:text-gray-400">{exercise.description}</p>
              
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
                  <Dumbbell className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{exercise.category}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
                  <Target className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{exercise.difficulty}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
                  <Clock className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{exercise.duration}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/30">
                  <Dumbbell className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{exercise.equipment}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Muscle groups */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Target Muscle Groups</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {exercise.muscleGroups.map((muscle) => (
                <span
                  key={muscle}
                  className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800 dark:bg-primary-900/30 dark:text-primary-400"
                >
                  {muscle}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions and tips */}
        <div className="space-y-6">
          {exercise.videoUrl && (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <div className="aspect-video bg-gray-100 dark:bg-gray-700">
                <div className="flex h-full items-center justify-center">
                  <button className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
                    <Play size={20} />
                    <span>Watch Tutorial</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Instructions</h2>
            <ol className="mt-4 space-y-4">
              {exercise.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                    {index + 1}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tips</h2>
            <ul className="mt-4 space-y-4">
              {exercise.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-4">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500"></span>
                  <span className="text-gray-600 dark:text-gray-400">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetail;