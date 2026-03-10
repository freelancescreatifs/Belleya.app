import { useState, useEffect, useCallback } from 'react';
import { Instagram, Check, Loader, Unlink, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

interface ConnectionStatus {
  instagram_connected: boolean;
  tiktok_connected: boolean;
  connected_platforms: string[];
  has_profile: boolean;
}

export default function SocialAccountConnections() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>({
    instagram_connected: false,
    tiktok_connected: false,
    connected_platforms: [],
    has_profile: false,
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-post-manage`;

  const getHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const loadStatus = useCallback(async () => {
    if (!user) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'check-status' }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user, apiUrl, getHeaders]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const handleFocus = () => {
      if (connecting) {
        setConnecting(null);
        setRefreshing(true);
        loadStatus().finally(() => setRefreshing(false));
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [connecting, loadStatus]);

  async function ensureProfile(): Promise<boolean> {
    if (status.has_profile) return true;
    const headers = await getHeaders();
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'create-profile' }),
    });
    if (!res.ok) {
      showToast('error', 'Erreur lors de la creation du profil');
      return false;
    }
    return true;
  }

  async function handleConnect(platform: string) {
    setConnecting(platform);
    try {
      const created = await ensureProfile();
      if (!created) {
        setConnecting(null);
        return;
      }

      const headers = await getHeaders();
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'get-link-url',
          platforms: [platform],
          redirect_url: window.location.href,
        }),
      });

      if (!res.ok) {
        showToast('error', 'Impossible de generer le lien de connexion');
        setConnecting(null);
        return;
      }

      const data = await res.json();
      if (data.access_url) {
        window.open(data.access_url, '_blank', 'noopener');
      } else {
        showToast('error', 'Lien de connexion non disponible');
        setConnecting(null);
      }
    } catch {
      showToast('error', 'Erreur de connexion');
      setConnecting(null);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Deconnecter tous vos comptes sociaux ? Cette action est irreversible.')) return;
    setDisconnecting(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'delete-profile' }),
      });
      if (res.ok) {
        setStatus({
          instagram_connected: false,
          tiktok_connected: false,
          connected_platforms: [],
          has_profile: false,
        });
        showToast('success', 'Comptes deconnectes');
      } else {
        showToast('error', 'Erreur lors de la deconnexion');
      }
    } catch {
      showToast('error', 'Erreur lors de la deconnexion');
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
    showToast('success', 'Statut mis a jour');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 text-[#C43586] animate-spin" />
      </div>
    );
  }

  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      connected: status.instagram_connected,
      color: 'from-[#E1306C] to-[#F77737]',
      bgLight: 'bg-pink-50',
      textColor: 'text-[#E1306C]',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .55.04.81.11v-3.5a6.37 6.37 0 00-.81-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/>
        </svg>
      ),
      connected: status.tiktok_connected,
      color: 'from-[#000000] to-[#25F4EE]',
      bgLight: 'bg-gray-50',
      textColor: 'text-gray-900',
    },
  ];

  const anyConnected = status.instagram_connected || status.tiktok_connected;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Comptes sociaux</h3>
          <p className="text-gray-600 text-sm mt-1">
            Connectez vos comptes pour publier directement depuis Belleya
          </p>
        </div>
        {status.has_profile && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isConnecting = connecting === platform.id;

          return (
            <div
              key={platform.id}
              className="flex items-center justify-between p-5 bg-white rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${platform.bgLight}`}>
                  <Icon className={`w-6 h-6 ${platform.textColor}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {platform.connected ? (
                      <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                        <Check className="w-4 h-4" />
                        Connecte
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-gray-400">
                        <AlertCircle className="w-4 h-4" />
                        Non connecte
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {platform.connected ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg">
                    <Check className="w-4 h-4" />
                    Actif
                  </span>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r ${platform.color} hover:opacity-90 transition-opacity disabled:opacity-50`}
                  >
                    {isConnecting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Connecter
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {connecting && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <Loader className="w-5 h-5 animate-spin flex-shrink-0" />
          <p>
            Une fenetre de connexion s'est ouverte. Connectez votre compte puis revenez ici.
            Le statut sera mis a jour automatiquement.
          </p>
        </div>
      )}

      {anyConnected && (
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            {disconnecting ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Unlink className="w-4 h-4" />
            )}
            Deconnecter tous les comptes
          </button>
        </div>
      )}
    </div>
  );
}
