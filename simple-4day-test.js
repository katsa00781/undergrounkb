const { generateWorkoutPlan } = require('./src/lib/workoutGenerator.fixed.ts');

console.log('🧪 Simple test - generating Day 1 of 4-day program...');

// Mock data
const mockCategorizedExercises = {
  'térddomináns_bi': [{ id: 'REAL-EXERCISE-1', name: 'Squat', movement_pattern: 'térddomináns bilaterális' }],
  'térddomináns_uni': [{ id: 'REAL-EXERCISE-2', name: 'Lunge', movement_pattern: 'térddomináns unilaterális' }],
  'horizontális_nyomás_bi': [{ id: 'REAL-EXERCISE-3', name: 'Push-up', movement_pattern: 'horizontális nyomás bilaterális' }],
  'horizontális_nyomás_uni': [{ id: 'REAL-EXERCISE-4', name: 'Single Push-up', movement_pattern: 'horizontális nyomás unilaterális' }],
  'vertikális_nyomás_bi': [{ id: 'REAL-EXERCISE-5', name: 'Press', movement_pattern: 'vertikális nyomás bilaterális' }],
  'vertikális_nyomás_uni': [{ id: 'REAL-EXERCISE-6', name: 'Single Press', movement_pattern: 'vertikális nyomás unilaterális' }],
  'horizontális_húzás_bi': [{ id: 'REAL-EXERCISE-7', name: 'Row', movement_pattern: 'horizontális húzás bilaterális' }],
  'vertikális_húzás_bi': [{ id: 'REAL-EXERCISE-8', name: 'Pull-up', movement_pattern: 'vertikális húzás bilaterális' }],
  'csípődomináns_hajlított': [{ id: 'REAL-EXERCISE-9', name: 'Hip Hinge', movement_pattern: 'csípődomináns hajlított' }],
  'csípődomináns_nyújtott': [{ id: 'REAL-EXERCISE-10', name: 'Deadlift', movement_pattern: 'csípődomináns nyújtott' }],
  'bemelegítés': [{ id: 'REAL-EXERCISE-15', name: 'Warm-up', movement_pattern: 'bemelegítés' }],
  'pilometrikus': [{ id: 'REAL-EXERCISE-16', name: 'Plyometric', movement_pattern: 'pilometrikus' }],
  'core': [{ id: 'REAL-EXERCISE-17', name: 'Core Exercise', movement_pattern: 'core' }],
  'nyújtás': [{ id: 'REAL-EXERCISE-18', name: 'Stretch', movement_pattern: 'nyújtás' }]
};

const mockFMSCorrections = ['Core stabilization', 'Hip mobility'];

try {
  const result = generateWorkoutPlan(
    'test-user-id', 
    'Day 1', 
    '4napos',
    1,
    mockCategorizedExercises,
    null,
    mockFMSCorrections
  );

  console.log('✅ Generated workout plan successfully');
  console.log('📋 Sections:', result.sections.length);
  
  let hasRealId = false;
  let placeholderCount = 0;
  
  result.sections.forEach((section, idx) => {
    console.log(`\n📝 Section ${idx + 1}: ${section.name}`);
    section.exercises.forEach((exercise, exIdx) => {
      console.log(`  Exercise ${exIdx + 1}:`);
      console.log(`    ID: ${exercise.exerciseId}`);
      console.log(`    Name: ${exercise.name}`);
      
      if (exercise.exerciseId.startsWith('REAL-EXERCISE-')) {
        hasRealId = true;
        console.log('    ❌ REAL EXERCISE ID FOUND!');
      } else if (exercise.exerciseId.startsWith('placeholder-')) {
        placeholderCount++;
        console.log('    ✅ Placeholder');
      } else {
        console.log('    ❓ Unknown ID format');
      }
    });
  });
  
  console.log(`\n🎯 Summary:`);
  console.log(`  Has real exercise IDs: ${hasRealId ? '❌ YES' : '✅ NO'}`);
  console.log(`  Placeholder count: ${placeholderCount}`);
  
} catch (error) {
  console.log('❌ Error generating workout plan:', error.message);
}
