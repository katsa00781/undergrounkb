import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface ExerciseFilterProps {
  categories: Array<{ value: string; label: string }>;
  movementPatterns: Record<string, Array<{ value: string; label: string }>>;
  patternFamilies?: Array<{ value: string; label: string }>;
  lateralities?: Array<{ value: string; label: string }>;
  fmsFocuses?: Array<{ value: string; label: string }>;
  onFilterChange: (filters: {
    searchQuery: string;
    selectedCategory: string | null;
    selectedMovementPattern: string | null;
    selectedPatternFamily: string | null;
    selectedLaterality: string | null;
    selectedFMSFocus: string | null;
    selectedDifficulty: number | null; // Using numeric difficulty (1-5)
    showInactive: boolean;
  }) => void;
  showInactiveToggle?: boolean;
}

export const ExerciseFilter = ({
  categories,
  movementPatterns,
  patternFamilies = [],
  lateralities = [],
  fmsFocuses,
  onFilterChange,
  showInactiveToggle = false
}: ExerciseFilterProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMovementPattern, setSelectedMovementPattern] = useState<string | null>(null);
  const [selectedPatternFamily, setSelectedPatternFamily] = useState<string | null>(null);
  const [selectedLaterality, setSelectedLaterality] = useState<string | null>(null);
  const [selectedFMSFocus, setSelectedFMSFocus] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const allMovementPatterns = Array.from(
    new Map(
      Object.values(movementPatterns)
        .flat()
        .map((pattern) => [pattern.value, pattern])
    ).values()
  );
  const availableMovementPatterns = selectedCategory
    ? movementPatterns[selectedCategory] || []
    : allMovementPatterns;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    applyFilters(e.target.value, selectedCategory, selectedMovementPattern, selectedPatternFamily, selectedLaterality, selectedFMSFocus, selectedDifficulty, showInactive);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value === '' ? null : e.target.value;
    setSelectedCategory(category);
    
    // Reset movement pattern when category changes
    setSelectedMovementPattern(null);
    
    setSelectedFMSFocus(null);
    applyFilters(searchQuery, category, null, selectedPatternFamily, selectedLaterality, null, selectedDifficulty, showInactive);
  };

  const handleMovementPatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pattern = e.target.value === '' ? null : e.target.value;
    setSelectedMovementPattern(pattern);
    applyFilters(searchQuery, selectedCategory, pattern, selectedPatternFamily, selectedLaterality, selectedFMSFocus, selectedDifficulty, showInactive);
  };

  const handlePatternFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const patternFamily = e.target.value === '' ? null : e.target.value;
    setSelectedPatternFamily(patternFamily);
    applyFilters(searchQuery, selectedCategory, selectedMovementPattern, patternFamily, selectedLaterality, selectedFMSFocus, selectedDifficulty, showInactive);
  };

  const handleLateralityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const laterality = e.target.value === '' ? null : e.target.value;
    setSelectedLaterality(laterality);
    applyFilters(searchQuery, selectedCategory, selectedMovementPattern, selectedPatternFamily, laterality, selectedFMSFocus, selectedDifficulty, showInactive);
  };

  const handleFMSFocusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const focus = e.target.value === '' ? null : e.target.value;
    setSelectedFMSFocus(focus);
    applyFilters(searchQuery, selectedCategory, selectedMovementPattern, selectedPatternFamily, selectedLaterality, focus, selectedDifficulty, showInactive);
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const difficulty = e.target.value === '' ? null : parseInt(e.target.value);
    setSelectedDifficulty(difficulty);
    applyFilters(searchQuery, selectedCategory, selectedMovementPattern, selectedPatternFamily, selectedLaterality, selectedFMSFocus, difficulty, showInactive);
  };

  const handleShowInactiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowInactive(e.target.checked);
    applyFilters(searchQuery, selectedCategory, selectedMovementPattern, selectedPatternFamily, selectedLaterality, selectedFMSFocus, selectedDifficulty, e.target.checked);
  };

  const applyFilters = (
    search: string,
    category: string | null,
    movementPattern: string | null,
    patternFamily: string | null,
    laterality: string | null,
    fmsFocus: string | null,
    difficulty: number | null,
    inactive: boolean
  ) => {
    onFilterChange({
      searchQuery: search,
      selectedCategory: category,
      selectedMovementPattern: movementPattern,
      selectedPatternFamily: patternFamily,
      selectedLaterality: laterality,
      selectedFMSFocus: fmsFocus,
      selectedDifficulty: difficulty,
      showInactive: inactive
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedMovementPattern(null);
    setSelectedPatternFamily(null);
    setSelectedLaterality(null);
    setSelectedFMSFocus(null);
    setSelectedDifficulty(null);
    setShowInactive(false);
    
    onFilterChange({
      searchQuery: '',
      selectedCategory: null,
      selectedMovementPattern: null,
      selectedPatternFamily: null,
      selectedLaterality: null,
      selectedFMSFocus: null,
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
          {(selectedCategory || selectedMovementPattern || selectedPatternFamily || selectedLaterality || selectedDifficulty || showInactive) && (
            <span className="ml-1 rounded-full bg-primary-500 px-2 py-0.5 text-xs text-white">
              {[
                selectedCategory ? 1 : 0,
                selectedMovementPattern ? 1 : 0,
                selectedPatternFamily ? 1 : 0,
                selectedLaterality ? 1 : 0,
                selectedFMSFocus ? 1 : 0,
                selectedDifficulty ? 1 : 0,
                showInactive ? 1 : 0
              ].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>
      </div>
      
      {showFilters && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kategória
              </label>
              <select
                value={selectedCategory || ''}
                onChange={handleCategoryChange}
                className="input mt-1 w-full"
              >
                <option value="">Összes kategória</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mozgáscsalád
              </label>
              <select
                value={selectedPatternFamily || ''}
                onChange={handlePatternFamilyChange}
                className="input mt-1 w-full"
              >
                <option value="">Összes család</option>
                {patternFamilies.map((patternFamily) => (
                  <option key={patternFamily.value} value={patternFamily.value}>
                    {patternFamily.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Oldaliság
              </label>
              <select
                value={selectedLaterality || ''}
                onChange={handleLateralityChange}
                className="input mt-1 w-full"
              >
                <option value="">Összes forma</option>
                {lateralities.map((laterality) => (
                  <option key={laterality.value} value={laterality.value}>
                    {laterality.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mozgásminta
              </label>
              <select
                value={selectedMovementPattern || ''}
                onChange={handleMovementPatternChange}
                className="input mt-1 w-full"
              >
                <option value="">Összes minta</option>
                {availableMovementPatterns.map(pattern => (
                  <option key={pattern.value} value={pattern.value}>
                    {pattern.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory === 'fms' && fmsFocuses && fmsFocuses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  FMS fókusz
                </label>
                <select
                  value={selectedFMSFocus || ''}
                  onChange={handleFMSFocusChange}
                  className="input mt-1 w-full"
                >
                  <option value="">Mind a 7 minta</option>
                  {fmsFocuses.map(focus => (
                    <option key={focus.value} value={focus.value}>
                      {focus.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nehézség
              </label>
              <select
                value={selectedDifficulty?.toString() || ''}
                onChange={handleDifficultyChange}
                className="input mt-1 w-full"
              >
                <option value="">Összes szint</option>
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    {level}. szint - {level === 1 ? 'Nagyon könnyű' : level === 2 ? 'Könnyű' : level === 3 ? 'Közepes' : level === 4 ? 'Nehéz' : 'Nagyon nehéz'}
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
                  <span className="text-sm text-gray-700 dark:text-gray-300">Inaktívak mutatása</span>
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
              Szűrők törlése
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseFilter;
