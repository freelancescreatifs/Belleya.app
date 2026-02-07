import { Calendar as CalendarIcon } from 'lucide-react';

export default function PlanityButton() {
  const handleConnect = () => {
    alert('Intégration Planity à venir. Cette fonctionnalité sera disponible prochainement une fois l\'API Planity accessible.');
  };

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <CalendarIcon className="w-4 h-4" />
      Connecter Planity
    </button>
  );
}
