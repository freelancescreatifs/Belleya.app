import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pencil, Eye, Trash2, Send } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  feed_order: number;
  notes: string;
  caption?: string;
  content_structure?: string;
  media_urls?: string[];
  media_type?: string;
}

interface InstagramFeedCardProps {
  content: ContentItem;
  onEdit: (content: ContentItem) => void;
  onPreview: (content: ContentItem) => void;
  onDelete?: (contentId: string) => void;
  onPublish?: (content: ContentItem) => void;
  isPublished?: boolean;
}

export default function InstagramFeedCard({ content, onEdit, onPreview, onDelete, onPublish, isPublished = false }: InstagramFeedCardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: content.id,
    disabled: isPublished
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const mediaUrls = content.media_urls && typeof content.media_urls === 'string'
    ? JSON.parse(content.media_urls)
    : content.media_urls || (content.image_url ? [content.image_url] : []);

  const isCarousel = content.media_type === 'carousel' || mediaUrls.length > 1;
  const isVideo = content.media_type === 'video';

  function handlePrevSlide(e: React.MouseEvent) {
    e.stopPropagation();
    setCurrentSlide(prev => (prev === 0 ? mediaUrls.length - 1 : prev - 1));
  }

  function handleNextSlide(e: React.MouseEvent) {
    e.stopPropagation();
    setCurrentSlide(prev => (prev === mediaUrls.length - 1 ? 0 : prev + 1));
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    onEdit(content);
  }

  function handlePreview(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    onPreview(content);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (onDelete && confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) {
      onDelete(content.id);
    }
  }

  function handlePublish(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    onPublish?.(content);
  }

  const hasMedia = mediaUrls.length > 0;
  const canPublish = !isPublished && hasMedia && onPublish && content.status !== 'idea';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isPublished ? {} : listeners)}
      className={`bg-white overflow-hidden group relative transition-all ${
        isPublished
          ? 'cursor-not-allowed opacity-70 border-2 border-belaya-200'
          : isDragging
          ? 'ring-4 ring-orange-400 shadow-2xl scale-105 z-50 cursor-move'
          : 'hover:ring-2 hover:ring-orange-200 cursor-move'
      }`}
      title={isPublished ? 'Contenu publié - Non déplaçable (date+heure de publication atteinte)' : 'Glisser pour réorganiser'}
    >
      <div
        className="relative bg-gray-100"
        style={{ aspectRatio: '4/5' }}
      >
        {isVideo && mediaUrls[0] ? (
          <div className="relative w-full h-full pointer-events-none">
            <video
              src={mediaUrls[0]}
              className="w-full h-full object-cover"
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="w-16 h-16 text-white" />
            </div>
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 text-xs font-medium flex items-center gap-1">
              <Play className="w-2.5 h-2.5" />
              Reel
            </div>
          </div>
        ) : (
          <>
            <img
              src={mediaUrls[currentSlide] || content.image_url}
              alt={content.title}
              className="w-full h-full object-cover pointer-events-none"
            />

            {isCarousel && (
              <>
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 text-xs font-medium flex items-center gap-1">
                  <span>{currentSlide + 1}/{mediaUrls.length}</span>
                </div>

                {mediaUrls.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevSlide}
                      className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all pointer-events-auto z-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextSlide}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all pointer-events-auto z-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {mediaUrls.map((_, index) => (
                        <div
                          key={index}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            index === currentSlide
                              ? 'bg-white w-6'
                              : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

        <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
          <button
            onClick={handlePreview}
            className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm pointer-events-auto"
            title="Voir l'aperçu"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleEdit}
            className="p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm pointer-events-auto"
            title="Modifier"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {canPublish && (
            <button
              onClick={handlePublish}
              className="p-1.5 bg-emerald-500/80 hover:bg-emerald-600/90 text-white rounded-full transition-all backdrop-blur-sm pointer-events-auto"
              title="Publier sur les réseaux"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 bg-red-500/70 hover:bg-red-600/90 text-white rounded-full transition-all backdrop-blur-sm pointer-events-auto"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
