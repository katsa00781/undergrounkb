import { Dumbbell } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = 'Betöltés...' }: LoadingScreenProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center">
        <div className="animate-pulse text-primary-600 dark:text-primary-400">
          <Dumbbell size={48} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          UGKettlebell Pro
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;