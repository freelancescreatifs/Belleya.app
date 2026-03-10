import { useState, useEffect, useCallback } from 'react';
import { X, Send, Instagram, Loader, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContentItem {
  id: string;
  title: string;
  caption?: string;
  description?: string;
  content_type: string;
  platform: string[] | string;
  publication_date: string;
  publication_time?: string;
  image_url?: string;
  media_urls?: string[];
  media_type?: string;
}

interface ConnectionStatus {
  instagram_connected: boolean;
  tiktok_connected: boolean;
  connected_platforms: string[];
  has_profile: boolean;
}

interface PublishModalProps {
  content: ContentItem;
  onClose: () => void;
  onPublished: () => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  twitter: 'X (Twitter)',
};

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .55.04.81.11v-3.5a6.37 6.37 0 00-.81-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/>
    </svg>
  );
}

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform) {
    case 'instagram': return <Instagram className={className} />;
    case 'tiktok': return <TikTokIcon className={className} />;
    default: return <Send className={className} />;
  }
}

export default function PublishModal({ content, onClose, onPublished }: PublishModalProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const manageUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-post-manage`;
  const publishUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publish-social-content`;

  const getHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  useEffect(() => {
    loadConnectionStatus();
  }, []);

  async function loadConnectionStatus() {
    try {
      const headers = await getHeaders();
      const res = await fetch(manageUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'check-status' }),
      });
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus(data);

        const contentPlatforms = Array.isArray(content.platform)
          ? content.platform
          : typeof content.platform === 'string'
            ? content.platform.split(',').map(s => s.trim())
            : [];

        const connectedList: string[] = data.connected_platforms || [];
        const preselected = contentPlatforms.filter(p =>
          connectedList.some((c: string) => c.toLowerCase() === p.toLowerCase())
        );
        setSelectedPlatforms(preselected);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function togglePlatform(platform: string) {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  }

  function isPlatformConnected(platform: string): boolean {
    if (!connectionStatus) return false;
    const connected = connectionStatus.connected_platforms || [];
    return connected.some((c: string) => c.toLowerCase() === platform.toLowerCase());
  }

  async function handlePublish() {
    if (!selectedPlatforms.length) return;
    setPublishing(true);
    try {
      const headers = await getHeaders();
      const isFuture = content.publication_date &&
        new Date(`${content.publication_date}T${content.publication_time || '12:00'}:00`) > new Date();

      const res = await fetch(publishUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'publish',
          content_id: content.id,
          platforms: selectedPlatforms,
          schedule: isFuture,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult({
          success: true,
          message: data.scheduled
            ? `Publication programmee sur ${selectedPlatforms.map(p => PLATFORM_LABELS[p] || p).join(', ')}`
            : `Publie sur ${selectedPlatforms.map(p => PLATFORM_LABELS[p] || p).join(', ')}`,
        });
        setTimeout(() => {
          onPublished();
          onClose();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || 'Erreur lors de la publication',
        });
      }
    } catch {
      setResult({ success: false, message: 'Erreur reseau' });
    } finally {
      setPublishing(false);
    }
  }

  const contentPlatforms = Array.isArray(content.platform)
    ? content.platform
    : typeof content.platform === 'string'
      ? content.platform.split(',').map(s => s.trim())
      : [];

  const mediaUrls = content.media_urls
    ? (typeof content.media_urls === 'string' ? JSON.parse(content.media_urls) : content.media_urls)
    : content.image_url ? [content.image_url] : [];

  const caption = content.caption || content.description || content.title || '';
  const isFuture = content.publication_date &&
    new Date(`${content.publication_date}T${content.publication_time || '23:59'}:00`) > new Date();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl">
              <Send className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Publier sur les reseaux</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {result && (
            <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${
              result.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {result.success
                ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
                : <AlertCircle className="w-5 h-5 flex-shrink-0" />
              }
              {result.message}
            </div>
          )}

          <div className="flex gap-3">
            {mediaUrls[0] && (
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                {content.content_type === 'reel' || content.content_type === 'video' ? (
                  <video src={mediaUrls[0]} className="w-full h-full object-cover" />
                ) : (
                  <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{content.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{caption}</p>
              {isFuture && (
                <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  Programmee le {new Date(content.publication_date).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          ) : !connectionStatus?.has_profile ? (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Aucun compte connecte</p>
                <p className="mt-1">Connectez vos reseaux sociaux dans Parametres &gt; Integrations.</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Publier sur
                </label>
                <div className="space-y-2">
                  {contentPlatforms.map(platform => {
                    const connected = isPlatformConnected(platform);
                    const selected = selectedPlatforms.includes(platform);
                    return (
                      <button
                        key={platform}
                        onClick={() => connected && togglePlatform(platform)}
                        disabled={!connected}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                          selected && connected
                            ? 'border-orange-400 bg-orange-50'
                            : connected
                              ? 'border-gray-200 hover:border-gray-300 bg-white'
                              : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <PlatformIcon platform={platform} className="w-5 h-5" />
                          <span className="font-medium text-gray-900">
                            {PLATFORM_LABELS[platform] || platform}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!connected && (
                            <span className="text-xs text-gray-400">Non connecte</span>
                          )}
                          {selected && connected && (
                            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                              <CheckCircle className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          {!selected && connected && (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {contentPlatforms.some(p => !isPlatformConnected(p)) && (
                <p className="text-xs text-gray-400">
                  Certaines plateformes ne sont pas connectees. Allez dans Parametres &gt; Integrations.
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || !selectedPlatforms.length || !!result?.success}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {publishing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Publication...
              </>
            ) : isFuture ? (
              <>
                <Clock className="w-4 h-4" />
                Programmer
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publier maintenant
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
