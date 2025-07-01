#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate a comprehensive test to ensure 4-day program only generates placeholders
const testContent = `
// Test script to verify that 4-day program only generates placeholders
import { generateWorkoutPlan } from './src/lib/workoutGenerator.fixed.ts';

// Mock data for testing
const mockCategorizedExercises = {
  'térddomináns_bi': [{ id: 'real-exercise-1', name: 'Squat', movement_pattern: 'térddomináns bilaterális' }],
  'térddomináns_uni': [{ id: 'real-exercise-2', name: 'Lunge', movement_pattern: 'térddomináns unilaterális' }],
  'horizontális_nyomás_bi': [{ id: 'real-exercise-3', name: 'Push-up', movement_pattern: 'horizontális nyomás bilaterális' }],
  'horizontális_nyomás_uni': [{ id: 'real-exercise-4', name: 'Single Push-up', movement_pattern: 'horizontális nyomás unilaterális' }],
  'vertikális_nyomás_bi': [{ id: 'real-exercise-5', name: 'Press', movement_pattern: 'vertikális nyomás bilaterális' }],
  'vertikális_nyomás_uni': [{ id: 'real-exercise-6', name: 'Single Press', movement_pattern: 'vertikális nyomás unilaterális' }],
  'horizontális_húzás_bi': [{ id: 'real-exercise-7', name: 'Row', movement_pattern: 'horizontális húzás bilaterális' }],
  'vertikális_húzás_bi': [{ id: 'real-exercise-8', name: 'Pull-up', movement_pattern: 'vertikális húzás bilaterális' }],
  'csípődomináns_hajlított': [{ id: 'real-exercise-9', name: 'Hip Hinge', movement_pattern: 'csípődomináns hajlított' }],
  'csípődomináns_nyújtott': [{ id: 'real-exercise-10', name: 'Deadlift', movement_pattern: 'csípődomináns nyújtott' }],
  'rotációs': [{ id: 'real-exercise-11', name: 'Rotation', movement_pattern: 'rotációs' }],
  'rehab': [{ id: 'real-exercise-12', name: 'Rehab Exercise', movement_pattern: 'rehab' }],
  'gait': [{ id: 'real-exercise-13', name: 'Gait Exercise', movement_pattern: 'gait' }],
  'fms_korrekció': [{ id: 'real-exercise-14', name: 'FMS Correction', movement_pattern: 'fms_korrekció' }],
  'bemelegítés': [{ id: 'real-exercise-15', name: 'Warm-up', movement_pattern: 'bemelegítés' }],
  'pilometrikus': [{ id: 'real-exercise-16', name: 'Plyometric', movement_pattern: 'pilometrikus' }],
  'core': [{ id: 'real-exercise-17', name: 'Core Exercise', movement_pattern: 'core' }],
  'nyújtás': [{ id: 'real-exercise-18', name: 'Stretch', movement_pattern: 'nyújtás' }]
};

const mockFMSCorrections = ['Core stabilization', 'Hip mobility'];

// Test all days of 4-day program
console.log('🧪 Testing 4-day program placeholder generation...');

for (let day = 1; day <= 4; day++) {
  console.log(\`\\n📅 Testing Day \${day}...\`);
  
  const result = generateWorkoutPlan(
    'test-user-id', 
    \`Day \${day}\`, 
    '4napos',
    day,
    mockCategorizedExercises,
    null, // no FMS assessment
    mockFMSCorrections
  );

  let hasRealExerciseId = false;
  const realExerciseIds = [];
  const placeholderIds = [];

  // Check all exercises in all sections
  result.sections.forEach(section => {
    section.exercises.forEach(exercise => {
      if (exercise.exerciseId.startsWith('real-exercise-')) {
        hasRealExerciseId = true;
        realExerciseIds.push(exercise.exerciseId);
      } else if (exercise.exerciseId.startsWith('placeholder-')) {
        placeholderIds.push(exercise.exerciseId);
      }
    });
  });

  if (hasRealExerciseId) {
    console.log(\`❌ Day \${day} contains real exercise IDs:\`);
    realExerciseIds.forEach(id => console.log(\`  - \${id}\`));
  } else {
    console.log(\`✅ Day \${day} only contains placeholders\`);
  }

  console.log(\`📋 Placeholders found: \${placeholderIds.length}\`);
  placeholderIds.forEach(id => console.log(\`  - \${id}\`));
}

console.log('\\n🏆 Test completed!');
`;

fs.writeFileSync('test-4day-only-placeholders.mjs', testContent.trim());
console.log('📝 Created comprehensive 4-day placeholder test: test-4day-only-placeholders.mjs');
