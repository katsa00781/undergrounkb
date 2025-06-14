#!/usr/bin/env node
/*
  Simple CLI to verify Supabase connection and run basic queries.
  Usage: node src/utils/testSupabaseQueries.cjs
*/

require('dotenv/config');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  try {
    const tables = ['profiles', 'users', 'exercises'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ Query failed for table "${table}":`, error.message);
        process.exit(1);
      }
      console.log(`✅ Query succeeded for table "${table}"`);
    }
    console.log('\nAll Supabase queries ran successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error while testing Supabase:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
