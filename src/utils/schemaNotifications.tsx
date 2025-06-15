
import toast from 'react-hot-toast';

type SchemaFixProps = {
  isError?: boolean;
};

/**
 * Utility function to show a schema fix notification to the user
 * @param message The message to display
 * @param options Options for customizing the notification
 */
export const showSchemaFixNotification = (message: string, { isError = true }: SchemaFixProps = {}) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 ${
          isError ? 'border-l-4 border-error-500' : ''
        }`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Schema Issue Detected
              </p>
              <p className="mt-1 text-sm text-gray-500">{message}</p>
              <p className="mt-2 text-xs text-gray-500">
                Run <code className="bg-gray-100 px-1 py-0.5 rounded">./fix-profile-database.sh</code> to fix
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
          >
            Dismiss
          </button>
        </div>
      </div>
    ),
    { duration: 8000 }
  );
};

export default showSchemaFixNotification;
