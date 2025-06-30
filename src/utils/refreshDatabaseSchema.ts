import { supabase } from '../config/supabase';

/**
 * This utility function refreshes the Supabase client's database schema cache.
 * It can be called when you encounter schema-related errors.
 * 
 * For example, when a migration adds new columns but the client still gets errors
 * like "Could not find the 'column_name' in the schema cache".
 */
export async function refreshDatabaseSchema() {
  try {
    // Force a request that will update the schema cache
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error refreshing database schema:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to refresh database schema cache:', err);
    return false;
  }
}

/**
 * Verifies if a specific table and column exists in the database.
 * This is useful for troubleshooting schema issues.
 * 
 * @param tableName Table to check
 * @param columnName Column to check
 * @returns Promise resolving to a boolean indicating if the column exists
 */
export async function verifyColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    // Execute a raw SQL query to check if the column exists
    const { data, error } = await supabase.rpc('check_column_exists', {
      p_table_name: tableName,
      p_column_name: columnName
    });

    if (error) {
      console.error(`Error checking for column '${columnName}' in table '${tableName}':`, error);
      return false;
    }

    return !!data;
  } catch (err) {
    console.error(`Failed to check for column '${columnName}' in table '${tableName}':`, err);
    return false;
  }
}
