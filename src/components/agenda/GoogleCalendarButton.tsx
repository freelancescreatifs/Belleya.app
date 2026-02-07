import { useState } from 'react';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';

interface GoogleCalendarButtonProps {
  onSync: () => void;
  isConnected: boolean;
}

export default function GoogleCalendarButton({ onSync, isConnected }: GoogleCalendarButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    alert('Intégration Google Calendar à venir. Pour le moment, cette fonctionnalité nécessite une configuration OAuth côté serveur.');
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      await onSync();
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <CalendarIcon className="w-4 h-4" />
        Connecter Google Calendar
      </button>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      Synchroniser
    </button>
  );
}
