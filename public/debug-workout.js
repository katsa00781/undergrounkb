console.log('🔍 Debugging Workout Planner Filters');

// Add debug logging to WorkoutPlanner component
window.debugWorkoutPlanner = {
  logFilteredExercises: (sectionId, exerciseId, categoryFilter, movementPatternFilter) => {
    console.log('Filter Debug:', {
      sectionId,
      exerciseId,
      categoryFilter,
      movementPatternFilter,
      exerciseKey: `${sectionId}-${exerciseId}`
    });
  },
  
  logAllExercises: (exercises) => {
    console.log('All exercises:', exercises.slice(0, 3));
  },
  
  logCategories: (categories) => {
    console.log('Categories:', categories);
  }
};

console.log('Debug functions available on window.debugWorkoutPlanner');
