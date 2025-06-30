const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExercisesData() {
  console.log('📊 Checking Exercises Data for Workout Planner');
  console.log('=============================================\n');

  try {
    // 1. Get all exercises
    console.log('1. Fetching all exercises...');
    const { data: allExercises, error: allError } = await supabase
      .from('exercises')
      .select('*')
      .order('name');

    if (allError) {
      console.error('❌ Failed to fetch all exercises:', allError.message);
      return;
    }

    console.log(`✅ Total exercises in database: ${allExercises.length}`);

    // 2. Group by categories
    console.log('\n2. Exercises by category:');
    const exercisesByCategory = allExercises.reduce((acc, ex) => {
      if (!acc[ex.category]) acc[ex.category] = [];
      acc[ex.category].push(ex);
      return acc;
    }, {});

    Object.entries(exercisesByCategory).forEach(([category, exercises]) => {
      console.log(`   ${category}: ${exercises.length} exercises`);
      if (exercises.length > 0) {
        console.log(`      Sample: ${exercises[0].name}`);
      }
    });

    // 3. Group by movement patterns
    console.log('\n3. Exercises by movement pattern:');
    const exercisesByPattern = allExercises.reduce((acc, ex) => {
      if (!acc[ex.movement_pattern]) acc[ex.movement_pattern] = [];
      acc[ex.movement_pattern].push(ex);
      return acc;
    }, {});

    Object.entries(exercisesByPattern).forEach(([pattern, exercises]) => {
      console.log(`   ${pattern}: ${exercises.length} exercises`);
    });

    // 4. Test specific filters
    console.log('\n4. Testing specific filter combinations:');
    
    const categories = Object.keys(exercisesByCategory);
    const patterns = Object.keys(exercisesByPattern);
    
    if (categories.length > 0 && patterns.length > 0) {
      const testCategory = categories[0];
      const testPattern = patterns[0];
      
      console.log(`\nTesting filter: category="${testCategory}" + pattern="${testPattern}"`);
      
      const { data: filteredExercises, error: filterError } = await supabase
        .from('exercises')
        .select('*')
        .eq('category', testCategory)
        .eq('movement_pattern', testPattern);

      if (filterError) {
        console.error('❌ Filter test failed:', filterError.message);
      } else {
        console.log(`✅ Filter result: ${filteredExercises.length} exercises`);
        filteredExercises.forEach(ex => {
          console.log(`   - ${ex.name} (${ex.category}, ${ex.movement_pattern})`);
        });
      }
    }

    // 5. Check if exercises are active
    console.log('\n5. Checking active exercises:');
    const activeExercises = allExercises.filter(ex => ex.is_active);
    const inactiveExercises = allExercises.filter(ex => !ex.is_active);
    
    console.log(`   Active exercises: ${activeExercises.length}`);
    console.log(`   Inactive exercises: ${inactiveExercises.length}`);

    if (inactiveExercises.length > 0) {
      console.log('   Note: Some exercises are marked as inactive and may not appear in the planner');
    }

    // 6. Summary and recommendations
    console.log('\n📋 Summary and Recommendations:');
    if (allExercises.length === 0) {
      console.log('❌ No exercises found in database. Please add exercises first.');
    } else if (categories.length < 2) {
      console.log('⚠️  Very few categories. Consider adding more exercises in different categories.');
    } else if (patterns.length < 2) {
      console.log('⚠️  Very few movement patterns. Consider adding exercises with different movement patterns.');
    } else {
      console.log('✅ Exercise data looks good for filter testing.');
      console.log(`   Categories available: ${categories.join(', ')}`);
      console.log(`   Movement patterns available: ${patterns.slice(0, 5).join(', ')}${patterns.length > 5 ? '...' : ''}`);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the check
checkExercisesData();
