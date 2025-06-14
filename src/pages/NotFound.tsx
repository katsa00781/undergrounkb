import { Link } from 'react-router-dom';
import { Dumbbell, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
          <Dumbbell className="h-12 w-12 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="mt-6 text-4xl font-extrabold text-gray-900 dark:text-white">404</h1>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">Page not found</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Home size={20} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;