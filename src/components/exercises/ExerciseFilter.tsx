import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface ExerciseFilterProps {
  categories: string[];
  movementPatterns: Record<string, string[]>;
  onFilterChange: (filters: {
    searchQuery: string;
    selectedCategory: string | null;
    selectedMovementPattern: string | null;
    selectedDifficulty: number | null; // Using numeric difficulty (1-5)
    showInactive: boolean;
  }) => void;
  showInactiveToggle?: boolean;
}

export const ExerciseFilter = ({
  categories,
  movementPatterns,
  onFilterChange,
  showInactiveToggle = false
}: ExerciseFilterProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMovementPattern, setSelectedMovementPattern] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [availableMovementPatterns, setAvailableMovementPatterns] = useState<string[]>([]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    applyFilters(e.target.value, selectedCategory, selectedMovementPattern, selectedDifficulty, showInactive);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value === '' ? null : e.target.value;
    setSelectedCategory(category);
    
    // Reset movement pattern when category changes
    setSelectedMovementPattern(null);
    
    // Update available movement patterns
    if (category) {
      setAvailableMovementPatterns(movementPatterns[category] || []);
    } else {
      setAvailableMovementPatterns([]);
    }
    
    applyFilters(searchQuery, category, null, selectedDifficulty, showInactive);
  };

  const handleMovementPatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pattern = e.target.value === '' ? null : e.target.value;
    setSelectedMovementPattern(pattern);
    applyFilters(searchQuery, selectedCategory, pattern, selectedDifficulty, showInactive);
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const difficulty = e.target.value === '' ? null : parseInt(e.target.value);
    setSelectedDifficulty(difficulty);
    applyFilters(searchQuery, selectedCategory, selectedMovementPattern, difficulty, showInactive);
  };

  const handleShowInactiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowInactive(e.target.checked);
    applyFilters(searchQuery, selectedCategory, selectedMovementPattern, selectedDifficulty, e.target.checked);
  };

  const applyFilters = (
    search: string,
    category: string | null,
    movementPattern: string | null,
    difficulty: number | null,
    inactive: boolean
  ) => {
    onFilterChange({
      searchQuery: search,
      selectedCategory: category,
      selectedMovementPattern: movementPattern,
      selectedDifficulty: difficulty,
      showInactive: inactive
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedMovementPattern(null);
    setSelectedDifficulty(null);
    setShowInactive(false);
    setAvailableMovementPatterns([]);
    
    onFilterChange({
      searchQuery: '',
      selectedCategory: null,
      selectedMovementPattern: null,
      selectedDifficulty: null,
      showInactive: false
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search exercises..."
            className="input pl-10 w-full"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <Filter size={18} />
          <span>Filter</span>
          {(selectedCategory || selectedMovementPattern || selectedDifficulty || showInactive) && (
            <span className="ml-1 rounded-full bg-primary-500 px-2 py-0.5 text-xs text-white">
              {[
                selectedCategory ? 1 : 0,
                selectedMovementPattern ? 1 : 0,
                selectedDifficulty ? 1 : 0,
                showInactive ? 1 : 0
              ].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>
      </div>
      
      {showFilters && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                value={selectedCategory || ''}
                onChange={handleCategoryChange}
                className="input mt-1 w-full"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Movement Pattern
              </label>
              <select
                value={selectedMovementPattern || ''}
                onChange={handleMovementPatternChange}
                className="input mt-1 w-full"
                disabled={!selectedCategory}
              >
                <option value="">All Patterns</option>
                {availableMovementPatterns.map(pattern => (
                  <option key={pattern} value={pattern}>
                    {pattern}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Difficulty
              </label>
              <select
                value={selectedDifficulty?.toString() || ''}
                onChange={handleDifficultyChange}
                className="input mt-1 w-full"
              >
                <option value="">All Levels</option>
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    Level {level} - {level === 1 ? 'Very Easy' : level === 2 ? 'Easy' : level === 3 ? 'Moderate' : level === 4 ? 'Hard' : 'Very Hard'}
                  </option>
                ))}
              </select>
            </div>
            
            {showInactiveToggle && (
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={handleShowInactiveChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Show Inactive</span>
                </label>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <X size={16} className="mr-1" />
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseFilter;
