import { useState, useEffect } from 'react';
import { Calendar, Check, RefreshCw, Unlink, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

interface CalendarIntegration {
  id: string;
  google_email: string | null;
  is_active: boolean;
  last_sync_at: string | null;
}

export default function GoogleCalendarIntegration() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [integration, setIntegration] = useState<CalendarIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (user) {
      loadIntegration();
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      showToast('success', 'Google Calendar connecte avec succes !');
      window.history.replaceState({}, '', window.location.pathname);
      loadIntegration();
    }
    if (params.get('google_error')) {
      const errorCode = params.get('google_error');
      const messages: Record<string, string> = {
        token_exchange_failed: 'Echec de la connexion Google. Veuillez reessayer.',
        save_failed: 'Erreur lors de la sauvegarde. Veuillez reessayer.',
        missing_params: 'Parametres manquants. Veuillez reessayer.',
        invalid_state: 'Session invalide. Veuillez reessayer.',
        internal_error: 'Erreur interne. Veuillez reessayer.',
      };
      showToast('error', messages[errorCode || ''] || 'Erreur de connexion Google Calendar');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadIntegration = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('id, google_email, is_active, last_sync_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .eq('is_active', true)
      .maybeSingle();

    if (!error && data) {
      setIntegration(data);
    } else {
      setIntegration(null);
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!user) return;
    setConnecting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        showToast('error', 'Session expirée. Veuillez vous reconnecter.');
        setConnecting(false);
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
        showToast('error', result.error || 'Erreur lors de la connexion');
        setConnecting(false);
      }
    } catch {
      showToast('error', 'Erreur de connexion. Veuillez reessayer.');
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.error) {
        showToast('error', 'Erreur de synchronisation');
      } else {
        showToast('success', `${result.count || 0} evenements synchronises`);
        await loadIntegration();
      }
    } catch {
      showToast('error', 'Erreur de synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user || !integration) return;
    setDisconnecting(true);

    try {
      const { error } = await supabase
        .from('calendar_integrations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', integration.id);

      if (error) {
        showToast('error', 'Erreur lors de la deconnexion');
      } else {
        setIntegration(null);
        showToast('success', 'Google Calendar deconnecte');
      }
    } catch {
      showToast('error', 'Erreur lors de la deconnexion');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Integrations</h2>
        <p className="text-sm text-gray-600">
          Connectez vos outils externes pour synchroniser vos donnees.
        </p>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg viewBox="0 0 24 24" className="w-7 h-7">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">Google Calendar</h3>
                {integration && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <Check className="w-3 h-3" />
                    Connecte
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3">
                Synchronisez votre Google Calendar pour bloquer automatiquement les creneaux
                occupes sur votre page de reservation publique.
              </p>

              {integration ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {integration.google_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Compte :</span>
                        <span className="font-medium text-gray-900">{integration.google_email}</span>
                      </div>
                    )}
                    {integration.last_sync_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Derniere synchro :</span>
                        <span className="text-gray-700">
                          {new Date(integration.last_sync_at).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className="flex items-center gap-2 px-4 py-2 bg-[#C43586] text-white rounded-lg hover:bg-[#a82d72] transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                      {syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
                    </button>

                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      <Unlink className="w-4 h-4" />
                      {disconnecting ? 'Deconnexion...' : 'Deconnecter'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                      En connectant votre Google Calendar, les creneaux occupes seront automatiquement
                      bloques sur votre page de reservation publique. Vos clients ne pourront pas
                      reserver pendant vos evenements Google Calendar.
                    </p>
                  </div>

                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-800 rounded-lg hover:border-[#C43586] hover:text-[#C43586] transition-all disabled:opacity-50 font-medium"
                  >
                    {connecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        Connecter Google Calendar
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
