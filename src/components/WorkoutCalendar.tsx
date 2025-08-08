import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Dumbbell, Clock, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { hu } from 'date-fns/locale';
import { getWorkouts, Workout } from '../lib/workouts';
import { useAuth } from '../hooks/useAuth';

interface WorkoutCalendarProps {
  onDateSelect?: (date: Date, workouts: Workout[]) => void;
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ onDateSelect }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const loadWorkouts = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const workoutsData = await getWorkouts(user.id);
      setWorkouts(workoutsData);
    } catch (error) {
      console.error('Failed to load workouts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadWorkouts();
    }
  }, [user, currentDate, loadWorkouts]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get workouts for a specific date
  const getWorkoutsForDate = (date: Date): Workout[] => {
    return workouts.filter(workout => 
      isSameDay(new Date(workout.date), date)
    );
  };

  // Calculate workout statistics for the month
  const monthStats = {
    totalWorkouts: workouts.filter(w => 
      isSameMonth(new Date(w.date), currentDate)
    ).length,
    totalDuration: workouts
      .filter(w => isSameMonth(new Date(w.date), currentDate))
      .reduce((sum, w) => sum + w.duration, 0),
    workoutDays: new Set(
      workouts
        .filter(w => isSameMonth(new Date(w.date), currentDate))
        .map(w => format(new Date(w.date), 'yyyy-MM-dd'))
    ).size
  };

  const handleDateClick = (date: Date) => {
    const dayWorkouts = getWorkoutsForDate(date);
    setSelectedDate(date);
    onDateSelect?.(date, dayWorkouts);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const getDayClasses = (date: Date) => {
    const dayWorkouts = getWorkoutsForDate(date);
    const hasWorkouts = dayWorkouts.length > 0;
    const isSelected = selectedDate && isSameDay(date, selectedDate);
    const isTodayDate = isToday(date);
    
    let classes = 'relative w-full h-16 p-1 text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer flex flex-col items-center justify-center';
    
    if (!isSameMonth(date, currentDate)) {
      classes += ' text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800';
    } else {
      classes += ' text-gray-900 dark:text-white bg-white dark:bg-gray-800';
    }
    
    if (hasWorkouts) {
      classes += ' bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
    }
    
    if (isSelected) {
      classes += ' ring-2 ring-blue-500 dark:ring-blue-400';
    }
    
    if (isTodayDate) {
      classes += ' ring-2 ring-orange-400 dark:ring-orange-500';
    }
    
    return classes;
  };

  const weekDays = ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Edzésnaptár
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-medium text-gray-900 dark:text-white min-w-[160px] text-center">
              {format(currentDate, 'yyyy. MMMM', { locale: hu })}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Monthly Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <Dumbbell className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{monthStats.totalWorkouts}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Edzések</span>
          </div>
          <div className="flex flex-col items-center">
            <Clock className="h-5 w-5 text-green-500 mb-1" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(monthStats.totalDuration / 60)}h</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Össz idő</span>
          </div>
          <div className="flex flex-col items-center">
            <TrendingUp className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{monthStats.workoutDays}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Aktív napok</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date) => {
            const dayWorkouts = getWorkoutsForDate(date);
            return (
              <div
                key={date.toISOString()}
                className={getDayClasses(date)}
                onClick={() => handleDateClick(date)}
              >
                <span className="font-medium">
                  {format(date, 'd')}
                </span>
                {dayWorkouts.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      {dayWorkouts.length}
                    </span>
                  </div>
                )}
                {isToday(date) && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {format(selectedDate, 'yyyy. MMMM d. (EEEE)', { locale: hu })}
          </h3>
          {getWorkoutsForDate(selectedDate).length > 0 ? (
            <div className="space-y-2">
              {getWorkoutsForDate(selectedDate).map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{workout.title}</span>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round(workout.duration / 60)} perc
                    </div>
                  </div>
                  <Dumbbell className="h-4 w-4 text-blue-500" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-sm">Ezen a napon nem volt edzés</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkoutCalendar;
