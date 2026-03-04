import { useState } from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: string;
  platform: string;
  publication_date: string;
  publication_time?: string;
  status: 'idea' | 'script' | 'shooting' | 'editing' | 'scheduled' | 'published';
  image_url: string;
  caption?: string;
  media_urls?: string[] | string;
  media_type?: string;
}

interface InstagramPreviewModalProps {
  content: ContentItem;
  profilePhoto: string | null;
  username: string | null;
  onClose: () => void;
}

export default function InstagramPreviewModal({
  content,
  profilePhoto,
  username,
  onClose,
}: InstagramPreviewModalProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const mediaUrls = typeof content.media_urls === 'string'
    ? JSON.parse(content.media_urls || '[]')
    : content.media_urls || [];

  const allMediaUrls = content.image_url && !mediaUrls.includes(content.image_url)
    ? [content.image_url, ...mediaUrls]
    : mediaUrls.length > 0
    ? mediaUrls
    : content.image_url
    ? [content.image_url]
    : [];

  const isCarousel = allMediaUrls.length > 1;
  const currentMedia = allMediaUrls[currentMediaIndex];
  const isVideo = content.media_type === 'video' || currentMedia?.endsWith('.mp4') || currentMedia?.endsWith('.mov');

  function handlePrevious() {
    setCurrentMediaIndex((prev) => (prev === 0 ? allMediaUrls.length - 1 : prev - 1));
  }

  function handleNext() {
    setCurrentMediaIndex((prev) => (prev === allMediaUrls.length - 1 ? 0 : prev + 1));
  }

  function formatDate() {
    const date = new Date(content.publication_date);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function getStatusBadge() {
    const badges = {
      idea: { label: 'Idée', className: 'bg-gray-100 text-gray-800' },
      script: { label: 'Script', className: 'bg-orange-100 text-orange-800' },
      shooting: { label: 'Tournage', className: 'bg-rose-100 text-rose-800' },
      editing: { label: 'Montage', className: 'bg-sky-100 text-sky-800' },
      scheduled: { label: 'Programmé', className: 'bg-blue-100 text-blue-800' },
      published: { label: 'Posté', className: 'bg-green-100 text-green-800' },
    };

    const badge = badges[content.status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden flex"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        <div className="w-2/3 bg-black flex items-center justify-center relative">
          {currentMedia && (
            <>
              {isVideo ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    src={currentMedia}
                    className="max-w-full max-h-full object-contain"
                    controls
                    autoPlay={isVideoPlaying}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                  />
                </div>
              ) : (
                <img
                  src={currentMedia}
                  alt={content.title}
                  className="max-w-full max-h-full object-contain"
                />
              )}

              {isCarousel && (
                <>
                  {currentMediaIndex > 0 && (
                    <button
                      onClick={handlePrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-900" />
                    </button>
                  )}
                  {currentMediaIndex < allMediaUrls.length - 1 && (
                    <button
                      onClick={handleNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-900" />
                    </button>
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                    {allMediaUrls.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="w-1/3 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 via-pink-400 to-orange-400 p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">
                  {username || 'Votre profil'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 via-pink-400 to-orange-400 p-0.5">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                </div>
                <p className="font-semibold text-sm text-gray-900">
                  {username || 'Votre profil'}
                </p>
              </div>

              {content.caption && (
                <p className="text-sm text-gray-900 whitespace-pre-wrap mb-2">
                  {content.caption}
                </p>
              )}
            </div>

            <div className="text-xs text-gray-500 border-t border-gray-200 pt-3 space-y-1">
              <p>Type: {content.content_type}</p>
              <p>Date prévue: {formatDate()}</p>
              {content.publication_time && (
                <p>Heure: {content.publication_time}</p>
              )}
              <div className="pt-2">{getStatusBadge()}</div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Heart className="w-6 h-6 text-gray-700 hover:text-red-500 cursor-pointer transition-colors" />
                <MessageCircle className="w-6 h-6 text-gray-700 hover:text-blue-500 cursor-pointer transition-colors" />
                <Send className="w-6 h-6 text-gray-700 hover:text-belaya-vivid cursor-pointer transition-colors" />
              </div>
              <Bookmark className="w-6 h-6 text-gray-700 hover:text-orange-500 cursor-pointer transition-colors" />
            </div>
            <p className="text-xs text-gray-500">Aperçu - Mode prévisualisation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
