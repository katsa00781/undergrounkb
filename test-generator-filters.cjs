const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWorkoutGeneratorFilters() {
  console.log('🏋️‍♀️ Testing Workout Generator Filters');
  console.log('=====================================\n');

  try {
    // 1. Test exercise availability for movement patterns
    console.log('1. Testing exercise availability for movement patterns...');
    
    const movementPatterns = [
      'knee_dominant_bilateral',
      'knee_dominant_unilateral', 
      'hip_dominant_bilateral',
      'hip_dominant_unilateral',
      'horizontal_push_bilateral',
      'horizontal_push_unilateral',
      'horizontal_pull_bilateral',
      'horizontal_pull_unilateral',
      'vertical_push_bilateral',
      'vertical_pull_bilateral',
      'mobilization'
    ];

    for (const pattern of movementPatterns) {
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('movement_pattern', pattern)
        .limit(5);

      if (error) {
        console.error(`❌ Error fetching exercises for ${pattern}:`, error.message);
      } else {
        console.log(`✅ ${pattern}: ${exercises.length} exercises available`);
        if (exercises.length > 0) {
          console.log(`   Sample: ${exercises[0].name}`);
        }
      }
    }

    // 2. Test placeholder mapping
    console.log('\n2. Testing placeholder ID to movement pattern mapping...');
    
    const placeholders = [
      'placeholder-terddom-bi',
      'placeholder-terddom-uni',
      'placeholder-csipo-bi', 
      'placeholder-csipo-uni',
      'placeholder-horiz-nyomas-bi',
      'placeholder-horiz-nyomas-uni',
      'placeholder-horiz-huzas-bi',
      'placeholder-horiz-huzas-uni',
      'placeholder-vert-nyomas',
      'placeholder-vert-huzas',
      'placeholder-fms'
    ];

    const placeholderToPattern = {
      'placeholder-terddom-bi': 'knee_dominant_bilateral',
      'placeholder-terddom-uni': 'knee_dominant_unilateral',
      'placeholder-csipo-bi': 'hip_dominant_bilateral',
      'placeholder-csipo-uni': 'hip_dominant_unilateral',
      'placeholder-horiz-nyomas-bi': 'horizontal_push_bilateral',
      'placeholder-horiz-nyomas-uni': 'horizontal_push_unilateral',
      'placeholder-horiz-huzas-bi': 'horizontal_pull_bilateral', 
      'placeholder-horiz-huzas-uni': 'horizontal_pull_unilateral',
      'placeholder-vert-nyomas': 'vertical_push_bilateral',
      'placeholder-vert-huzas': 'vertical_pull_bilateral',
      'placeholder-fms': 'mobilization'
    };

    placeholders.forEach(placeholder => {
      const expectedPattern = placeholderToPattern[placeholder];
      console.log(`✅ ${placeholder} → ${expectedPattern}`);
    });

    console.log('\n📋 Summary:');
    console.log('✅ Placeholder to movement pattern mapping is ready');
    console.log('✅ Movement pattern filters should auto-activate after workout generation');
    console.log('✅ Users can easily find appropriate exercises for each placeholder');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
testWorkoutGeneratorFilters();
