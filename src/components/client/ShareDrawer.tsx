import { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, ExternalLink } from 'lucide-react';

interface ShareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contentTitle: string;
  contentDescription?: string;
  contentImageUrl?: string;
  providerName: string;
  shareUrl: string;
}

const SHARE_PLATFORMS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'x',
    label: 'X',
    color: '#000000',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: 'telegram',
    label: 'Telegram',
    color: '#0088CC',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
];

export default function ShareDrawer({
  isOpen,
  onClose,
  contentTitle,
  contentDescription,
  contentImageUrl,
  providerName,
  shareUrl,
}: ShareDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const shareText = `${contentTitle} - ${providerName}${contentDescription ? `\n${contentDescription}` : ''}`;
  const fullShareUrl = shareUrl.startsWith('http') ? shareUrl : `${window.location.origin}${shareUrl}`;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: contentTitle,
        text: shareText,
        url: fullShareUrl,
      });
      onClose();
    } catch (err) {
      if ((err as DOMException).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = fullShareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePlatformShare = (platformId: string) => {
    const encodedUrl = encodeURIComponent(fullShareUrl);
    const encodedText = encodeURIComponent(shareText);

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%0A${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    };

    const url = urls[platformId];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div
      className={`fixed inset-0 z-50 transition-colors duration-300 ${
        isAnimating ? 'bg-black/40' : 'bg-transparent'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-6 pb-2 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Partager</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {(contentImageUrl || contentTitle) && (
          <div className="mx-6 mb-4 p-3 bg-gray-50 rounded-xl flex items-center gap-3">
            {contentImageUrl && (
              <img
                src={contentImageUrl}
                alt=""
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{contentTitle}</p>
              <p className="text-xs text-gray-500 truncate">{providerName}</p>
            </div>
          </div>
        )}

        {supportsNativeShare && (
          <div className="px-6 mb-4">
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-gradient-to-r from-brand-600 to-belaya-bright text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              <Share2 className="w-5 h-5" />
              <span>Partager via...</span>
              <ExternalLink className="w-4 h-4 opacity-70" />
            </button>
          </div>
        )}

        <div className="px-6 mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {supportsNativeShare ? 'Ou partager directement sur' : 'Partager sur'}
          </p>
        </div>

        <div className="px-6 pb-4">
          <div className="grid grid-cols-4 gap-4">
            {SHARE_PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformShare(platform.id)}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-transform group-hover:scale-110 group-active:scale-95"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.icon}
                </div>
                <span className="text-xs text-gray-600 font-medium">{platform.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-8">
          <button
            onClick={handleCopyLink}
            className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-medium border-2 transition-all ${
              copied
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span>Lien copie !</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copier le lien</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
