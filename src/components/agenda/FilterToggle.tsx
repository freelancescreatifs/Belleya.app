import { FilterType } from '../../types/agenda';

interface FilterToggleProps {
  activeFilters: Set<FilterType>;
  onChange: (filters: Set<FilterType>) => void;
}

export default function FilterToggle({ activeFilters, onChange }: FilterToggleProps) {
  const toggleFilter = (filter: FilterType) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    onChange(newFilters);
  };

  const selectAll = () => {
    onChange(new Set<FilterType>(['events', 'tasks', 'social_media']));
  };

  const isAllSelected = activeFilters.size === 3;

  return (
    <div className="bg-gray-50 rounded-xl p-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={selectAll}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            isAllSelected
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => toggleFilter('events')}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            activeFilters.has('events')
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white'
          }`}
        >
          RDV / Formations
        </button>
        <button
          onClick={() => toggleFilter('tasks')}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            activeFilters.has('tasks')
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white'
          }`}
        >
          Tâches
        </button>
        <button
          onClick={() => toggleFilter('social_media')}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            activeFilters.has('social_media')
              ? 'bg-belleya-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white'
          }`}
        >
          Réseaux
        </button>
      </div>
    </div>
  );
}
