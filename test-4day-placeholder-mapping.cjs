/**
 * Test script for checking that 4-day program generator uses specific placeholders
 * that match the WorkoutPlanner.tsx filter mapping
 */

const fs = require('fs');
const path = require('path');

// Read the workout generator file
const generatorPath = path.join(__dirname, 'src/lib/workoutGenerator.fixed.ts');
const generatorContent = fs.readFileSync(generatorPath, 'utf8');

// Read the WorkoutPlanner file
const plannerPath = path.join(__dirname, 'src/pages/WorkoutPlanner.tsx');
const plannerContent = fs.readFileSync(plannerPath, 'utf8');

console.log('🧪 Testing 4-day program placeholder mapping...\n');

// Extract all placeholders from the 4-day generator functions
const fourDayFunctions = ['generateDay1Plan', 'generateDay2Plan', 'generateDay3Plan', 'generateDay4Plan'];
const placeholderPattern = /exerciseId:\s*['"`]([^'"`]*placeholder-[^'"`]*)['"`]/g;

let allPlaceholders = new Set();
let matches;

// Find all placeholders in the generator
while ((matches = placeholderPattern.exec(generatorContent)) !== null) {
  const placeholder = matches[1];
  allPlaceholders.add(placeholder);
}

console.log('📋 Found placeholders in generator:');
Array.from(allPlaceholders).sort().forEach(placeholder => {
  console.log(`  - ${placeholder}`);
});
console.log();

// Extract placeholder handling from WorkoutPlanner.tsx
const placeholderHandlingPattern = /placeholderId\.includes\(['"`]([^'"`]+)['"`]\)/g;
let handledPlaceholders = new Set();

while ((matches = placeholderHandlingPattern.exec(plannerContent)) !== null) {
  const placeholderPart = matches[1];
  handledPlaceholders.add(placeholderPart);
}

console.log('🎯 Placeholder patterns handled in WorkoutPlanner.tsx:');
Array.from(handledPlaceholders).sort().forEach(pattern => {
  console.log(`  - *${pattern}*`);
});
console.log();

// Check if all placeholders from generator are handled in planner
let unmappedPlaceholders = [];
let mappedPlaceholders = [];

Array.from(allPlaceholders).forEach(placeholder => {
  let isMapped = false;
  
  Array.from(handledPlaceholders).forEach(pattern => {
    if (placeholder.includes(pattern)) {
      isMapped = true;
    }
  });
  
  if (isMapped) {
    mappedPlaceholders.push(placeholder);
  } else {
    unmappedPlaceholders.push(placeholder);
  }
});

console.log('✅ Properly mapped placeholders:');
mappedPlaceholders.sort().forEach(placeholder => {
  console.log(`  - ${placeholder}`);
});
console.log();

if (unmappedPlaceholders.length > 0) {
  console.log('❌ Unmapped placeholders (these won\'t trigger filters):');
  unmappedPlaceholders.sort().forEach(placeholder => {
    console.log(`  - ${placeholder}`);
  });
  console.log();
} else {
  console.log('🎉 All placeholders are properly mapped!');
}

// Specific check for 4-day program consistency
console.log('🔍 Checking 4-day program specific placeholders...');

const specificPlaceholders = Array.from(allPlaceholders).filter(p => 
  p.includes('terddom') || 
  p.includes('csipo') || 
  p.includes('nyomas') || 
  p.includes('huzas')
);

console.log('\n📊 Movement pattern placeholders:');
specificPlaceholders.sort().forEach(placeholder => {
  // Check if this specific placeholder has a clear movement pattern
  let movementType = 'unknown';
  if (placeholder.includes('terddom-bi')) movementType = 'knee_dominant_bilateral';
  else if (placeholder.includes('terddom-uni')) movementType = 'knee_dominant_unilateral';
  else if (placeholder.includes('csipo-hajlitott')) movementType = 'hip_dominant_bent_leg';
  else if (placeholder.includes('csipo-nyujtott')) movementType = 'hip_dominant_straight_leg';
  else if (placeholder.includes('csipo-bi')) movementType = 'hip_dominant_bilateral';
  else if (placeholder.includes('csipo-uni')) movementType = 'hip_dominant_unilateral';
  else if (placeholder.includes('horiz-nyomas-bi')) movementType = 'horizontal_push_bilateral';
  else if (placeholder.includes('horiz-nyomas-uni')) movementType = 'horizontal_push_unilateral';
  else if (placeholder.includes('vert-nyomas-bi')) movementType = 'vertical_push_bilateral';
  else if (placeholder.includes('vert-nyomas-uni')) movementType = 'vertical_push_unilateral';
  else if (placeholder.includes('horiz-huzas-bi')) movementType = 'horizontal_pull_bilateral';
  else if (placeholder.includes('horiz-huzas-uni')) movementType = 'horizontal_pull_unilateral';
  else if (placeholder.includes('vert-huzas-bi')) movementType = 'vertical_pull_bilateral';
  else if (placeholder.includes('vert-huzas-uni')) movementType = 'vertical_pull_unilateral';
  
  console.log(`  - ${placeholder} → ${movementType}`);
});

console.log('\n🏆 Test Summary:');
console.log(`  Total placeholders: ${allPlaceholders.size}`);
console.log(`  Mapped placeholders: ${mappedPlaceholders.length}`);
console.log(`  Unmapped placeholders: ${unmappedPlaceholders.length}`);
console.log(`  Movement pattern placeholders: ${specificPlaceholders.length}`);

if (unmappedPlaceholders.length === 0) {
  console.log('\n🎉 All tests passed! 4-day program placeholders are properly mapped.');
  process.exit(0);
} else {
  console.log('\n❌ Some placeholders are not mapped. Please fix the WorkoutPlanner.tsx mapping.');
  process.exit(1);
}
