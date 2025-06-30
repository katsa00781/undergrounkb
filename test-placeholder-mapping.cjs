const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Placeholder ID-k és hozzájuk tartozó mozgásminták
const PLACEHOLDER_MAPPINGS = [
  { placeholder: 'placeholder-terddom-bi', expected: 'knee_dominant_bilateral' },
  { placeholder: 'placeholder-terddom-uni', expected: 'knee_dominant_unilateral' },
  { placeholder: 'placeholder-csipo-bi', expected: 'hip_dominant_bilateral' },
  { placeholder: 'placeholder-csipo-uni', expected: 'hip_dominant_unilateral' },
  { placeholder: 'placeholder-horiz-nyomas-bi', expected: 'horizontal_push_bilateral' },
  { placeholder: 'placeholder-horiz-nyomas-uni', expected: 'horizontal_push_unilateral' },
  { placeholder: 'placeholder-horiz-huzas-bi', expected: 'horizontal_pull_bilateral' },
  { placeholder: 'placeholder-horiz-huzas-uni', expected: 'horizontal_pull_unilateral' },
  { placeholder: 'placeholder-vert-nyomas', expected: 'vertical_push_bilateral' },
  { placeholder: 'placeholder-vert-huzas', expected: 'vertical_pull_bilateral' },
  { placeholder: 'placeholder-fms', expected: 'mobilization' },
  { placeholder: 'placeholder-gait', expected: 'mobilization' },
  { placeholder: 'placeholder-gait-core', expected: 'mobilization' },
  { placeholder: 'placeholder-rehab', expected: 'mobilization' }
];

// Frontend mapping függvény (ugyanaz mint a WorkoutPlanner.tsx-ben)
function getMovementPatternForPlaceholder(placeholderId) {
  let movementPattern = '';
  
  // Térddominás gyakorlatok
  if (placeholderId.includes('terddom-bi')) {
    movementPattern = 'knee_dominant_bilateral';
  } else if (placeholderId.includes('terddom-uni')) {
    movementPattern = 'knee_dominant_unilateral';
  } 
  // Csípődominás gyakorlatok
  else if (placeholderId.includes('csipo-bi')) {
    movementPattern = 'hip_dominant_bilateral';
  } else if (placeholderId.includes('csipo-uni')) {
    movementPattern = 'hip_dominant_unilateral';
  } 
  // Horizontális nyomás
  else if (placeholderId.includes('horiz-nyomas-bi')) {
    movementPattern = 'horizontal_push_bilateral';
  } else if (placeholderId.includes('horiz-nyomas-uni')) {
    movementPattern = 'horizontal_push_unilateral';
  } 
  // Horizontális húzás
  else if (placeholderId.includes('horiz-huzas-bi')) {
    movementPattern = 'horizontal_pull_bilateral';
  } else if (placeholderId.includes('horiz-huzas-uni')) {
    movementPattern = 'horizontal_pull_unilateral';
  } 
  // Vertikális nyomás
  else if (placeholderId.includes('vert-nyomas')) {
    movementPattern = 'vertical_push_bilateral';
  } 
  // Vertikális húzás
  else if (placeholderId.includes('vert-huzas')) {
    movementPattern = 'vertical_pull_bilateral';
  } 
  // FMS korrekciók
  else if (placeholderId.includes('fms')) {
    movementPattern = 'mobilization';
  }
  // Gait és core gyakorlatok
  else if (placeholderId.includes('gait')) {
    movementPattern = 'mobilization';
  }
  // Rehabilitációs gyakorlatok
  else if (placeholderId.includes('rehab')) {
    movementPattern = 'mobilization';
  }
  
  return movementPattern;
}

async function testPlaceholderMapping() {
  console.log('🎯 Testing Placeholder to Movement Pattern Mapping');
  console.log('==================================================\n');

  console.log('Testing placeholder ID mapping logic...\n');
  
  let allPassed = true;
  
  for (const mapping of PLACEHOLDER_MAPPINGS) {
    const result = getMovementPatternForPlaceholder(mapping.placeholder);
    const passed = result === mapping.expected;
    
    console.log(`${passed ? '✅' : '❌'} ${mapping.placeholder} -> ${result} (expected: ${mapping.expected})`);
    
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log(`\n${allPassed ? '✅ All mappings passed!' : '❌ Some mappings failed!'}\n`);
  
  // Test exercise availability for each movement pattern
  console.log('Testing exercise availability for each movement pattern...\n');
  
  for (const mapping of PLACEHOLDER_MAPPINGS) {
    try {
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select('id, name, movement_pattern')
        .eq('movement_pattern', mapping.expected)
        .limit(3);

      if (error) {
        console.error(`❌ Error fetching exercises for ${mapping.expected}:`, error.message);
      } else {
        console.log(`📊 ${mapping.expected}: ${exercises.length} exercises available`);
        if (exercises.length > 0) {
          exercises.forEach(ex => {
            console.log(`   - ${ex.name} (ID: ${ex.id})`);
          });
        } else {
          console.log('   ⚠️  No exercises found for this movement pattern!');
        }
      }
    } catch (error) {
      console.error(`❌ Database error for ${mapping.expected}:`, error.message);
    }
    console.log('');
  }
  
  // Test egy minta generált workout
  console.log('Testing sample generated workout placeholders...\n');
  
  const samplePlaceholders = [
    'placeholder-terddom-bi',
    'placeholder-horiz-nyomas-bi', 
    'placeholder-vert-huzas',
    'placeholder-csipo-bi',
    'placeholder-fms'
  ];
  
  console.log('Sample workout placeholders and their expected filters:');
  samplePlaceholders.forEach(placeholder => {
    const pattern = getMovementPatternForPlaceholder(placeholder);
    console.log(`${placeholder} -> Filter: ${pattern}`);
  });
}

// Run the test
testPlaceholderMapping().catch(console.error);
