import { useState } from 'react';
import { AlertCircle, Terminal } from 'lucide-react';

type SchemaFixNotificationProps = {
  show: boolean;
  message: string;
  onDismiss: () => void;
};

const SchemaFixNotification = ({ show, message, onDismiss }: SchemaFixNotificationProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  if (!show) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border border-warning-200 bg-warning-50 p-4 shadow-lg dark:border-warning-800 dark:bg-warning-900/30">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-warning-400 dark:text-warning-500" aria-hidden="true" />
        </div>
        <div className="ml-3 w-full">
          <h3 className="text-sm font-medium text-warning-800 dark:text-warning-300">
            Database Schema Issue
          </h3>
          <div className="mt-2">
            <p className="text-sm text-warning-700 dark:text-warning-400">
              {message}
            </p>
            
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-warning-600 underline hover:text-warning-800 dark:text-warning-400 dark:hover:text-warning-300"
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
            </div>
            
            {showDetails && (
              <div className="mt-3 space-y-3">
                <div className="rounded-md bg-gray-800 p-3">
                  <div className="flex items-center">
                    <Terminal className="mr-2 h-4 w-4 text-gray-300" />
                    <code className="text-xs text-gray-300">
                      ./fix-profile-database.sh
                    </code>
                  </div>
                </div>
                
                <div className="text-xs text-warning-700 dark:text-warning-400">
                  <p className="mb-1 font-medium">To fix this issue:</p>
                  <ol className="list-decimal pl-4">
                    <li>Open your terminal</li>
                    <li>Navigate to the project directory</li>
                    <li>Run the command above</li>
                    <li>After it completes, refresh the page</li>
                  </ol>
                </div>
                
                <div className="text-xs text-warning-700 dark:text-warning-400">
                  <p className="mb-1 font-medium">What this will do:</p>
                  <ul className="list-disc pl-4">
                    <li>Add missing database columns</li>
                    <li>Fix schema cache issues</li>
                    <li>Repair profile data handling</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-md bg-warning-50 px-3 py-1.5 text-sm font-medium text-warning-800 hover:bg-warning-100 dark:bg-warning-900 dark:text-warning-300 dark:hover:bg-warning-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemaFixNotification;
