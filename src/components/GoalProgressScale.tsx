import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GoalProgressScaleProps {
  startingValue?: number;
  currentValue: number;
  targetValue: number;
  unit?: string;
  startDate: string;
  endDate: string;
  isIncreasing?: boolean; // true = növekedés a cél (pl. lépésszám), false = csökkenés (pl. súlycsökkenés)
}

const GoalProgressScale: React.FC<GoalProgressScaleProps> = ({
  startingValue,
  currentValue,
  targetValue,
  unit = '',
  startDate,
  endDate,
  isIncreasing = true
}) => {
  // Dátumok kezelése
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  // Időbeli progress (%)
  const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const timeProgress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
  
  // Érték alapú progress (%)
  const baseValue = startingValue ?? (isIncreasing ? 0 : targetValue * 2);
  const totalChange = Math.abs(targetValue - baseValue);
  const currentChange = isIncreasing 
    ? currentValue - baseValue
    : baseValue - currentValue;
  
  const valueProgress = totalChange > 0 
    ? Math.min(100, Math.max(0, (currentChange / totalChange) * 100))
    : 0;
  
  // Státusz meghatározása
  const isOnTrack = valueProgress >= timeProgress * 0.9; // 90%-os tolerancia
  const isCompleted = valueProgress >= 100;
  
  // Trend ikon
  const getTrendIcon = () => {
    if (isCompleted) return null;
    if (valueProgress > timeProgress) {
      return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    } else if (valueProgress < timeProgress * 0.8) {
      return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
    return <Minus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
  };
  
  // Színek
  const getProgressColor = () => {
    if (isCompleted) return 'bg-green-500 dark:bg-green-600';
    if (isOnTrack) return 'bg-blue-500 dark:bg-blue-600';
    if (valueProgress < timeProgress * 0.8) return 'bg-red-500 dark:bg-red-600';
    return 'bg-yellow-500 dark:bg-yellow-600';
  };
  
  const getTrackColor = () => {
    if (isCompleted) return 'bg-green-100 dark:bg-green-900/30';
    return 'bg-gray-200 dark:bg-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* Érték skála */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Haladás</span>
            {getTrendIcon()}
          </div>
          <span className={`font-semibold ${isOnTrack ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {Math.round(valueProgress)}%
          </span>
        </div>
        
        {/* Progress bar - érték alapú */}
        <div className="relative">
          <div className={`w-full h-3 rounded-full ${getTrackColor()}`}>
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(100, valueProgress)}%` }}
            />
          </div>
          
          {/* Időbeli marker (függőleges vonal) */}
          {!isCompleted && timeProgress < 100 && (
            <div 
              className="absolute top-0 h-3 w-0.5 bg-gray-400 dark:bg-gray-500"
              style={{ left: `${timeProgress}%` }}
              title={`Időbeli progress: ${Math.round(timeProgress)}%`}
            />
          )}
        </div>
        
        {/* Értékek megjelenítése */}
        <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400">Kiindulás</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {baseValue} {unit}
            </span>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-gray-500 dark:text-gray-400">Jelenlegi</span>
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {currentValue} {unit}
            </span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-gray-500 dark:text-gray-400">Cél</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {targetValue} {unit}
            </span>
          </div>
        </div>
      </div>
      
      {/* Időskála */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{start.toLocaleDateString('hu-HU')}</span>
          <span className="font-medium">
            {elapsedDays} / {totalDays} nap
          </span>
          <span>{end.toLocaleDateString('hu-HU')}</span>
        </div>
        
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
          <div 
            className="h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, timeProgress)}%` }}
          />
        </div>
      </div>
      
      {/* Státusz üzenet */}
      <div className={`text-xs p-2 rounded-lg ${
        isCompleted 
          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
          : isOnTrack 
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
      }`}>
        {isCompleted && '🎉 Célod elérted! Gratulálunk!'}
        {!isCompleted && isOnTrack && '✅ Jó ütemben haladsz a cél felé!'}
        {!isCompleted && !isOnTrack && valueProgress < timeProgress * 0.8 && '⚠️ Lemaradásban vagy, gyorsítani kell!'}
        {!isCompleted && !isOnTrack && valueProgress >= timeProgress * 0.8 && '📊 Rendben haladsz, de törekedhetsz jobbra!'}
      </div>
    </div>
  );
};

export default GoalProgressScale;
