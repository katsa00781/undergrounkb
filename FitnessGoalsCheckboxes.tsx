// FITNESS GOALS ALTERNATÍV KOMPONENS
// Ez a komponens helyettesíti a jelenlegi checkbox logikát a Profile.tsx-ben

const FitnessGoalsCheckboxes = ({ watch, setValue }: {
  watch: (name: string) => any;
  setValue: (name: string, value: any, options?: any) => void;
}) => {
  return (
    <div className="mt-2 space-y-2">
      {AVAILABLE_FITNESS_GOALS.map((goal) => {
        const goalsArray = Array.isArray(watch('fitnessGoals')) ? watch('fitnessGoals') : [];
        const isChecked = goalsArray.includes(goal);
        
        const handleGoalToggle = () => {
          console.log('🎯 Checkbox clicked:', goal, 'Currently checked:', isChecked);
          const currentGoals = watch('fitnessGoals') || [];
          let updatedGoals = Array.isArray(currentGoals) ? [...currentGoals] : [];
          
          if (isChecked) {
            updatedGoals = updatedGoals.filter(g => g !== goal);
            console.log('📤 Removing goal:', goal);
          } else {
            updatedGoals.push(goal);
            console.log('📥 Adding goal:', goal);
          }
          
          console.log('🔄 Updated goals array:', updatedGoals);
          setValue('fitnessGoals', updatedGoals, { shouldValidate: true });
        };

        return (
          <div key={goal} className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleGoalToggle}
              className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
            >
              <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                isChecked 
                  ? 'bg-primary-600 border-primary-600 text-white' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              }`}>
                {isChecked && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="ml-3 text-gray-700 dark:text-gray-300 select-none">
                {goal}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

// HASZNÁLAT:
// A jelenlegi checkbox kód helyett használd ezt:
// <FitnessGoalsCheckboxes watch={watch} setValue={setValue} />
