import { useState, useEffect } from 'react';
import { connectionManager, supabase } from '../../config/supabase';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface ConnectionTestProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

const ConnectionTest = ({ onConnectionChange }: ConnectionTestProps) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setIsLoading(true);
      
      // Check connection using the unified manager
      const isConnected = await connectionManager.checkConnection();
      setIsConnected(isConnected);
      setConnectionStatus(connectionManager.getConnectionStatus());
      
      // Generate diagnostic info
      const info = await generateDiagnosticInfo();
      setDiagnosticInfo(info);
      
      // Notify parent component about connection state
      if (onConnectionChange) {
        onConnectionChange(isConnected);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setIsConnected(false);
      
      if (onConnectionChange) {
        onConnectionChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected === null) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Kapcsolat ellenőrzése...</span>
      </div>
    );
  }

  // Generate diagnostic information
  const generateDiagnosticInfo = async (): Promise<string> => {
    try {
      let info = '=== Supabase Connection Diagnostics ===\n\n';
      
      // Connection status
      info += `Connection Status: ${connectionStatus}\n\n`;
      
      // Environment variables check
      info += 'Environment Variables:\n';
      info += `- VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}\n`;
      info += `- VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}\n\n`;
      
      // Check auth state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      info += 'Auth State:\n';
      if (sessionError) {
        info += `- Session Error: ${sessionError.message}\n`;
      } else {
        info += `- Session: ${session ? 'Active' : 'None'}\n`;
        if (session?.user) {
          info += `- User: ${session.user.email}\n`;
        }
      }
      
      return info;
    } catch (error) {
      return `Error generating diagnostic info: ${error instanceof Error ? error.message : String(error)}`;
    }
  };
  
  // Check if there are policy recursion issues
  const hasPolicyRecursion = diagnosticInfo.includes('infinite recursion') || 
                            diagnosticInfo.includes('policy recursion') ||
                            diagnosticInfo.includes('42P17');

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            hasPolicyRecursion ? (
              <AlertCircle className="h-5 w-5 text-warning-500 dark:text-warning-400" />
            ) : (
              <CheckCircle className="h-5 w-5 text-success-500 dark:text-success-400" />
            )
          ) : (
            <AlertCircle className="h-5 w-5 text-error-500 dark:text-error-400" />
          )}
          <span className="font-medium text-gray-900 dark:text-white">
            {isConnected 
              ? hasPolicyRecursion 
                ? 'Adatbázis kapcsolat aktív (policy problémákkal)' 
                : 'Adatbázis kapcsolat aktív'
              : 'Adatbázis kapcsolat hiba'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {showDetails ? 'Részletek elrejtése' : 'Részletek mutatása'}
          </button>
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="flex items-center space-x-1 rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Újratesztelés</span>
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4">
          <div className="max-h-60 overflow-auto rounded-md bg-gray-50 p-3 font-mono text-xs dark:bg-gray-900">
            <pre className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-300">
              {diagnosticInfo || 'Nincs diagnosztikai információ.'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionTest;
