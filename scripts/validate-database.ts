import dotenv from 'dotenv';
import { testDatabaseConnection, validateDatabaseSchema } from '../src/utils/testDbConnection';

// Load environment variables
dotenv.config();

async function main() {
    console.log('\n🔍 Testing database connection and schema...\n');

    try {
        // Test connection
        const isConnected = await testDatabaseConnection();
        if (!isConnected) {
            throw new Error('Database connection test failed');
        }

        // Validate schema
        const schemaValidation = await validateDatabaseSchema();
        const allValid = Object.values(schemaValidation).every(Boolean);
        
        if (!allValid) {
            throw new Error('Schema validation failed');
        }

        console.log('\n✅ All tests passed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Tests failed:', error);
        process.exit(1);
    }
}

// Run tests
main().catch(console.error);
