import { supabase } from '../src/config/supabase';
import { testDatabaseConnection, validateDatabaseSchema } from '../src/utils/testDbConnection';

async function testMigrations() {
    console.log('Testing database connection and migrations...');

    // Test basic connection
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
        console.error('❌ Database connection failed');
        process.exit(1);
    }
    console.log('✅ Database connection successful');

    // Validate schema
    const schemaValidation = await validateDatabaseSchema();
    console.log('\nSchema validation results:');
    Object.entries(schemaValidation).forEach(([table, isValid]) => {
        console.log(`${isValid ? '✅' : '❌'} ${table}`);
    });

    // Test RLS policies
    console.log('\nTesting RLS policies...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        console.log('⚠️ No authenticated session - skipping RLS tests');
    } else {
        try {
            // Test appointments access
            const { error: appointmentsError } = await supabase
                .from('appointments')
                .select('*')
                .limit(1);
            
            console.log(`${!appointmentsError ? '✅' : '❌'} Appointments RLS policy`);

            // Test profiles access
            const { error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .limit(1);
            
            console.log(`${!profilesError ? '✅' : '❌'} Profiles RLS policy`);

        } catch (error) {
            console.error('❌ RLS policy tests failed:', error);
        }
    }
}

testMigrations().catch(console.error);
