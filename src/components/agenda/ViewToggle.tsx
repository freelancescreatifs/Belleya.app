import { CalendarView } from '../../types/agenda';

interface ViewToggleProps {
  view: CalendarView;
  onChange: (view: CalendarView) => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl p-1.5 w-full max-w-md mx-auto">
      <button
        onClick={() => onChange('day')}
        className={`flex-1 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
          view === 'day'
            ? 'bg-belleya-500 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
        }`}
      >
        Jour
      </button>
      <button
        onClick={() => onChange('week')}
        className={`flex-1 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
          view === 'week'
            ? 'bg-belleya-500 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
        }`}
      >
        Semaine
      </button>
      <button
        onClick={() => onChange('month')}
        className={`flex-1 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
          view === 'month'
            ? 'bg-belleya-500 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900 hover:bg-white'
        }`}
      >
        Mois
      </button>
    </div>
  );
}
