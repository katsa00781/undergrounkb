import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  TrendingUp,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Workout, getWorkoutProgressTrend } from '../lib/workouts';
import { supabase } from '../config/supabase';
import { useAuth } from '../hooks/useAuth';
import PersonalWorkoutTracker from '../components/PersonalWorkoutTracker';

interface WorkoutProgressData {
  date: string;
  completion_rate: number;
  total_exercises: number;
  completed_exercises: number;
}

const MyWorkouts: React.FC = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [progressData, setProgressData] = useState<WorkoutProgressData[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadWorkouts();
      loadProgressData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadWorkouts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setWorkouts(data || []);
    } catch (error) {
      console.error('Error loading workouts:', error);
      setError('Nem sikerült betölteni az edzéseket');
    } finally {
      setLoading(false);
    }
  };

  const loadProgressData = async () => {
    if (!user) return;

    try {
      const trend = await getWorkoutProgressTrend(user.id, '30'); // Last 30 days
      // Transform the trend data to match our WorkoutProgressData interface
      const transformedData: WorkoutProgressData[] = trend.map(item => ({
        date: item.date,
        completion_rate: item.completed ? 100 : 0,
        total_exercises: 1,
        completed_exercises: item.completed ? 1 : 0
      }));
      setProgressData(transformedData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const handleWorkoutUpdate = (updatedWorkout: Workout) => {
    setWorkouts(prev => 
      prev.map(w => w.id === updatedWorkout.id ? updatedWorkout : w)
    );
    setSelectedWorkout(updatedWorkout);
    
    // Reload progress data after update
    loadProgressData();
  };

  const getFilteredWorkouts = () => {
    return workouts.filter(workout => {
      if (filter === 'all') return true;
      
      const completionRate = getWorkoutCompletionRate(workout);
      
      if (filter === 'completed') return completionRate === 100;
      if (filter === 'pending') return completionRate < 100;
      
      return true;
    });
  };

  const getWorkoutCompletionRate = (workout: Workout) => {
    let total = 0;
    let completed = 0;

    workout.sections.forEach(section => {
      section.exercises.forEach(exercise => {
        total++;
        if (exercise.completed) completed++;
      });
    });

    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getProgressSummary = () => {
    const last7Days = progressData.slice(-7);
    const avgCompletion = last7Days.length > 0 
      ? last7Days.reduce((sum, day) => sum + day.completion_rate, 0) / last7Days.length 
      : 0;
    
    const totalWorkouts = workouts.length;
    const completedWorkouts = workouts.filter(w => getWorkoutCompletionRate(w) === 100).length;
    
    return {
      avgCompletion,
      totalWorkouts,
      completedWorkouts,
      pendingWorkouts: totalWorkouts - completedWorkouts
    };
  };

  const filteredWorkouts = getFilteredWorkouts();
  const summary = getProgressSummary();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedWorkout) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedWorkout(null)}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            ← Vissza az edzésekhez
          </button>
        </div>
        
        <PersonalWorkoutTracker
          workout={selectedWorkout}
          onWorkoutUpdate={handleWorkoutUpdate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edzéseim
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Személyes és megosztott edzések követése
          </p>
        </div>
        
        <button
          onClick={loadWorkouts}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.avgCompletion.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Átlagos teljesítés (7 nap)
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totalWorkouts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Összes edzés
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.completedWorkouts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Befejezett edzés
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-orange-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.pendingWorkouts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Folyamatban lévő
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Szűrés:</span>
        </div>
        
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Összes' },
            { key: 'completed', label: 'Befejezett' },
            { key: 'pending', label: 'Folyamatban' }
          ].map(option => (
            <button
              key={option.key}
              onClick={() => setFilter(option.key as typeof filter)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === option.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Workouts List */}
      <div className="space-y-4">
        {filteredWorkouts.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nincs edzés
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' 
                ? 'Még nincs edzés hozzárendelve' 
                : `Nincs ${filter === 'completed' ? 'befejezett' : 'folyamatban lévő'} edzés`
              }
            </p>
          </div>
        ) : (
          filteredWorkouts.map(workout => {
            const completionRate = getWorkoutCompletionRate(workout);
            const isCompleted = completionRate === 100;
            
            return (
              <div
                key={workout.id}
                className={`p-6 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  isCompleted
                    ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => setSelectedWorkout(workout)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {workout.title}
                      </h3>
                      {isCompleted && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {workout.shared_from && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          <User className="h-3 w-3" />
                          Megosztott
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(workout.date).toLocaleDateString('hu-HU')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{workout.duration} perc</span>
                      </div>
                    </div>

                    {workout.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {workout.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {workout.sections.reduce((total, section) => total + section.exercises.length, 0)} gyakorlat
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {completionRate.toFixed(0)}%
                        </span>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyWorkouts;
