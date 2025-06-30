import { supabase } from '../config/supabase';

export async function testDatabaseConnection() {
    try {

        // Test public access to profiles
        const { error: profilesError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);

        if (profilesError) {
            console.error('Public profiles access test failed:', profilesError);
            return false;
        }

        // Test public access to appointments
        const { error: appointmentsError } = await supabase
            .from('appointments')
            .select('count')
            .limit(1);

        if (appointmentsError) {
            console.error('Public appointments access test failed:', appointmentsError);
            return false;
        }

        // Get current auth status
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('Session check failed:', sessionError);
            return false;
        }

        if (!session) {

            return true;
        }

        // Test authenticated access

        // Try to read own profile
        const { error: authProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (authProfileError) {
            console.error('Authenticated profile access test failed:', authProfileError);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Database connection test failed:', err);
        return false;
    }
}

export async function validateDatabaseSchema() {
    const tables = ['profiles', 'appointments', 'appointments_participants', 'exercises', 'workouts'];
    const results: Record<string, boolean> = {};

    for (const table of tables) {
        try {
            const { error } = await supabase
                .from(table)
                .select('*')
                .limit(0);

            results[table] = !error;
            if (error) {
                console.error(`Table ${table} validation failed:`, error);
            } else {

            }
        } catch (err) {
            results[table] = false;
            console.error(`Error validating ${table}:`, err);
        }
    }

    return results;
}
