const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/workoutGenerator.fixed.ts');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all getRandomExercise(...).id with just the placeholder
const patterns = [
  // Térddomináns gyakorlatok
  {
    search: /getRandomExercise\(categorizedExercises, 'térddomináns_bi'\)\?.id \|\|/g,
    replace: ''
  },
  {
    search: /getRandomExercise\(categorizedExercises, 'térddomináns_uni'\)\?.id \|\|/g,
    replace: ''
  },
  // Csípődomináns gyakorlatok
  {
    search: /getRandomExercise\(categorizedExercises, 'csípődomináns_nyújtott'\)\?.id \|\|/g,
    replace: ''
  },
  {
    search: /getRandomExercise\(categorizedExercises, 'csípődomináns_hajlított'\)\?.id \|\|/g,
    replace: ''
  },
  // Horizontális nyomás
  {
    search: /getRandomExercise\(categorizedExercises, 'horizontális_nyomás_bi'\)\?.id \|\|/g,
    replace: ''
  },
  {
    search: /getRandomExercise\(categorizedExercises, 'horizontális_nyomás_uni'\)\?.id \|\|/g,
    replace: ''
  },
  // Horizontális húzás
  {
    search: /getRandomExercise\(categorizedExercises, 'horizontális_húzás_bi'\)\?.id \|\|/g,
    replace: ''
  },
  {
    search: /getRandomExercise\(categorizedExercises, 'horizontális_húzás_uni'\)\?.id \|\|/g,
    replace: ''
  },
  // Vertikális gyakorlatok
  {
    search: /getRandomExercise\(categorizedExercises, 'vertikális_nyomás_bi'\)\?.id \|\|/g,
    replace: ''
  },
  {
    search: /getRandomExercise\(categorizedExercises, 'vertikális_húzás_bi'\)\?.id \|\|/g,
    replace: ''
  }
];

console.log('Fixing workout generator to use only placeholders...');

patterns.forEach((pattern, index) => {
  const matches = content.match(pattern.search);
  if (matches) {
    console.log(`Pattern ${index + 1}: Found ${matches.length} matches`);
    content = content.replace(pattern.search, pattern.replace);
  } else {
    console.log(`Pattern ${index + 1}: No matches found`);
  }
});

// Write the modified content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Workout generator fixed! All exercises now use placeholders consistently.');
console.log('🎯 This ensures that the filter auto-activation works for all programs.');
