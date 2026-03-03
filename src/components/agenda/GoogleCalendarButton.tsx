import { useState } from 'react';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GoogleCalendarButtonProps {
  onSync: () => Promise<void>;
  isConnected: boolean;
}

export default function GoogleCalendarButton({ onSync, isConnected }: GoogleCalendarButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        window.location.href = '/settings?tab=integrations';
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.url) {
        window.location.href = result.url;
      } else {
        window.location.href = '/settings?tab=integrations';
      }
    } catch {
      window.location.href = '/settings?tab=integrations';
    } finally {
      setLoading(false);
    }
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
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <CalendarIcon className="w-4 h-4" />
        {loading ? 'Connexion...' : 'Connecter Google Calendar'}
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
      {loading ? 'Synchronisation...' : 'Synchroniser'}
    </button>
  );
}
