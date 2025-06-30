const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWorkoutPlannerData() {
  console.log('🧪 Testing Workout Planner Data');
  console.log('===============================\n');

  try {
    // 1. Test exercises loading
    console.log('1. Testing exercises loading...');
    const { data: exercises, error: exerciseError } = await supabase
      .from('exercises')
      .select('*')
      .limit(5);

    if (exerciseError) {
      console.error('❌ Failed to fetch exercises:', exerciseError.message);
      return;
    }

    console.log(`✅ Successfully fetched ${exercises.length} exercises`);
    if (exercises.length > 0) {
      console.log('Sample exercise:', {
        id: exercises[0].id,
        name: exercises[0].name,
        category: exercises[0].category,
        movement_pattern: exercises[0].movement_pattern
      });
    }

    // 2. Test categories
    console.log('\n2. Testing categories...');
    const categories = [...new Set(exercises.map(ex => ex.category))];
    console.log('Available categories:', categories);

    // 3. Test movement patterns
    console.log('\n3. Testing movement patterns...');
    const movementPatterns = [...new Set(exercises.map(ex => ex.movement_pattern))];
    console.log('Available movement patterns:', movementPatterns);

    // 4. Test filtering by category
    console.log('\n4. Testing category filtering...');
    for (const category of categories.slice(0, 2)) {
      const { data: filteredExercises, error: filterError } = await supabase
        .from('exercises')
        .select('*')
        .eq('category', category)
        .limit(3);

      if (filterError) {
        console.error(`❌ Failed to filter by category ${category}:`, filterError.message);
      } else {
        console.log(`✅ Category "${category}": ${filteredExercises.length} exercises`);
      }
    }

    // 5. Test filtering by movement pattern
    console.log('\n5. Testing movement pattern filtering...');
    for (const pattern of movementPatterns.slice(0, 2)) {
      const { data: filteredExercises, error: filterError } = await supabase
        .from('exercises')
        .select('*')
        .eq('movement_pattern', pattern)
        .limit(3);

      if (filterError) {
        console.error(`❌ Failed to filter by movement pattern ${pattern}:`, filterError.message);
      } else {
        console.log(`✅ Movement pattern "${pattern}": ${filteredExercises.length} exercises`);
      }
    }

    // 6. Test combined filtering
    console.log('\n6. Testing combined filtering...');
    if (categories.length > 0 && movementPatterns.length > 0) {
      const { data: combinedFiltered, error: combinedError } = await supabase
        .from('exercises')
        .select('*')
        .eq('category', categories[0])
        .eq('movement_pattern', movementPatterns[0]);

      if (combinedError) {
        console.error('❌ Failed to apply combined filters:', combinedError.message);
      } else {
        console.log(`✅ Combined filter (${categories[0]} + ${movementPatterns[0]}): ${combinedFiltered.length} exercises`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`- Total exercises: ${exercises.length}`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Movement patterns: ${movementPatterns.length}`);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
testWorkoutPlannerData();
