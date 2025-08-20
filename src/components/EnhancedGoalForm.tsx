import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { GoalType, GoalCategory, CreateGoalData } from '../lib/goals';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';

interface EnhancedGoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: CreateGoalData) => Promise<void>;
  initialData?: Partial<CreateGoalData>;
  isEditing?: boolean;
}

const EnhancedGoalForm: React.FC<EnhancedGoalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<CreateGoalData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'fitness',
    type: initialData?.type || 'daily',
    target_value: initialData?.target_value || 1,
    target_unit: initialData?.target_unit || '',
    start_date: initialData?.start_date || new Date().toISOString().split('T')[0],
    end_date: initialData?.end_date || ''
  });

  const [durationType, setDurationType] = useState<'days' | 'weeks' | 'months'>('days');
  const [durationValue, setDurationValue] = useState(30);

  // Automatikus end_date számítás
  const calculateEndDate = (startDate: string, type: GoalType, durationType: 'days' | 'weeks' | 'months', durationValue: number) => {
    const start = new Date(startDate);
    
    if (type === 'daily') {
      switch (durationType) {
        case 'days':
          return format(addDays(start, durationValue), 'yyyy-MM-dd');
        case 'weeks':
          return format(addWeeks(start, durationValue), 'yyyy-MM-dd');
        case 'months':
          return format(addMonths(start, durationValue), 'yyyy-MM-dd');
      }
    }
    
    if (type === 'weekly') {
      return format(addWeeks(start, durationValue), 'yyyy-MM-dd');
    }
    
    if (type === 'monthly') {
      return format(addMonths(start, durationValue), 'yyyy-MM-dd');
    }
    
    if (type === 'quarterly') {
      return format(addMonths(start, durationValue * 3), 'yyyy-MM-dd');
    }
    
    if (type === 'yearly') {
      return format(addYears(start, durationValue), 'yyyy-MM-dd');
    }
    
    return format(addDays(start, 30), 'yyyy-MM-dd');
  };

  const handleInputChange = (field: keyof CreateGoalData, value: string | number | GoalType | GoalCategory) => {
    const newFormData = { ...formData, [field]: value };
    
    // Automatikus end_date frissítés
    if (field === 'start_date' || field === 'type') {
      newFormData.end_date = calculateEndDate(
        newFormData.start_date,
        newFormData.type,
        durationType,
        durationValue
      );
    }
    
    setFormData(newFormData);
  };

  const handleNumberInputChange = (field: keyof CreateGoalData, value: string) => {
    // Üres string esetén undefined marad, különben számként értelmezi
    if (value === '') {
      const newFormData = { ...formData };
      if (field === 'target_value') {
        newFormData.target_value = undefined;
      }
      setFormData(newFormData);
    } else {
      const numericValue = parseInt(value) || 1;
      handleInputChange(field, numericValue);
    }
  };

  const handleDurationChange = (type: 'days' | 'weeks' | 'months', value: number) => {
    setDurationType(type);
    setDurationValue(value);
    
    const newEndDate = calculateEndDate(formData.start_date, formData.type, type, value);
    setFormData({ ...formData, end_date: newEndDate });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('A cél címe kötelező!');
      return;
    }
    
    if (!formData.target_value || formData.target_value <= 0) {
      alert('A célérték kötelező és nagyobb kell legyen 0-nál!');
      return;
    }
    
    // Biztos, hogy van valid target_value
    const submitData = {
      ...formData,
      target_value: formData.target_value || 1
    };
    
    await onSubmit(submitData);
    onClose();
  };

  const getTypeDescription = (type: GoalType) => {
    const descriptions = {
      daily: 'Minden nap teljesítendő cél',
      weekly: 'Hetente teljesítendő cél',
      monthly: 'Havonta teljesítendő cél',
      quarterly: 'Negyedévente teljesítendő cél',
      yearly: 'Évente teljesítendő cél'
    };
    return descriptions[type];
  };

  const getUnitSuggestions = (category: GoalCategory) => {
    const suggestions = {
      fitness: ['edzés', 'km', 'perc', 'ismétlés', 'súly (kg)'],
      health: ['pohár víz', 'óra alvás', 'lépés', 'vitamin'],
      nutrition: ['adag zöldség', 'liter víz', 'kalória', 'fehérje (g)'],
      lifestyle: ['könyv', 'meditáció (perc)', 'napló bejegyzés'],
      personal: ['óra tanulás', 'projekt', 'készség gyakorlás']
    };
    return suggestions[category] || [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Cél szerkesztése' : 'Új cél létrehozása'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cím */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cél címe *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="pl. Napi 8 pohár víz"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Leírás */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Leírás
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Részletes leírás a célról..."
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Kategória és típus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategória
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value as GoalCategory)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="fitness">Fitnesz</option>
                  <option value="health">Egészség</option>
                  <option value="nutrition">Táplálkozás</option>
                  <option value="lifestyle">Életmód</option>
                  <option value="personal">Személyes fejlődés</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ismétlődés típusa *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as GoalType)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Napi</option>
                  <option value="weekly">Heti</option>
                  <option value="monthly">Havi</option>
                  <option value="quarterly">Negyedéves</option>
                  <option value="yearly">Éves</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getTypeDescription(formData.type)}
                </p>
              </div>
            </div>

            {/* Cél érték és mértékegység */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Célérték
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.target_value || ''}
                  onChange={(e) => handleNumberInputChange('target_value', e.target.value)}
                  placeholder="Célérték"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mértékegység
                </label>
                <input
                  type="text"
                  value={formData.target_unit}
                  onChange={(e) => handleInputChange('target_unit', e.target.value)}
                  placeholder="pl. pohár, km, perc"
                  list="unit-suggestions"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <datalist id="unit-suggestions">
                  {getUnitSuggestions(formData.category).map(unit => (
                    <option key={unit} value={unit} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Időtartam */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cél időtartama
              </label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleDurationChange('days', 30)}
                  className={`p-2 text-sm rounded-lg border ${
                    durationType === 'days' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-300 text-gray-700'
                  }`}
                >
                  Napban
                </button>
                <button
                  type="button"
                  onClick={() => handleDurationChange('weeks', 4)}
                  className={`p-2 text-sm rounded-lg border ${
                    durationType === 'weeks' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-300 text-gray-700'
                  }`}
                >
                  Hetekben
                </button>
                <button
                  type="button"
                  onClick={() => handleDurationChange('months', 1)}
                  className={`p-2 text-sm rounded-lg border ${
                    durationType === 'months' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-300 text-gray-700'
                  }`}
                >
                  Hónapokban
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={durationValue || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === '' ? 1 : parseInt(value) || 1;
                    handleDurationChange(durationType, numValue);
                  }}
                  placeholder="30"
                  className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {durationType === 'days' ? 'nap' : durationType === 'weeks' ? 'hét' : 'hónap'}
                </span>
              </div>
            </div>

            {/* Dátumok */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kezdő dátum
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Befejezés dátuma
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
              >
                Mégse
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {isEditing ? 'Frissítés' : 'Létrehozás'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedGoalForm;
