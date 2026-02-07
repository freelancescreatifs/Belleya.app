import { useState, useEffect } from 'react';
import { Instagram, Eye, EyeOff, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { canSwapContent } from '../../lib/publicationHelpers';
import InstagramFeedCard from './InstagramFeedCard';
import InstagramProfileHeader from './InstagramProfileHeader';
import InstagramPreviewModal from './InstagramPreviewModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: string;
  platform: string[] | string;
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
  is_published?: boolean;
}

interface InstagramProfile {
  instagram_profile_photo: string | null;
  instagram_username: string | null;
}

interface InstagramFeedProps {
  contents: ContentItem[];
  onContentUpdated: () => void;
  onContentEdit: (options: { mode: 'create' | 'edit'; contentId?: string; prefillData?: Partial<ContentItem> }) => void;
}

export default function InstagramFeed({ contents, onContentUpdated, onContentEdit }: InstagramFeedProps) {
  const { user } = useAuth();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState<ContentItem | null>(null);
  const [profile, setProfile] = useState<InstagramProfile>({
    instagram_profile_photo: null,
    instagram_username: null,
  });
  const [sortedContents, setSortedContents] = useState<ContentItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showPublished, setShowPublished] = useState(false);
  const [showDragHint, setShowDragHint] = useState(() => {
    return !localStorage.getItem('instagram_drag_hint_dismissed');
  });
  const [showFutureAlert, setShowFutureAlert] = useState(() => {
    return !localStorage.getItem('instagram_future_alert_dismissed');
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    const instagramContents = contents
      .filter(c => {
        const hasMedia = c.image_url || (c.media_urls && (
          typeof c.media_urls === 'string' ? JSON.parse(c.media_urls).length > 0 : c.media_urls.length > 0
        ));
        const platforms = Array.isArray(c.platform) ? c.platform : [c.platform];
        const isInstagram = platforms.some(p => p?.toLowerCase() === 'instagram');

        if (c.status === 'idea') return false;

        const isPublished = c.is_published === true;

        const statusFilter = showPublished ? true : !isPublished;

        return isInstagram && statusFilter && hasMedia;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.publication_date} ${a.publication_time || '00:00'}`).getTime();
        const dateB = new Date(`${b.publication_date} ${b.publication_time || '00:00'}`).getTime();
        return dateA - dateB;
      });

    setSortedContents(instagramContents);
  }, [contents, showPublished]);

  async function loadProfile() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('instagram_profile_photo, instagram_username')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading Instagram profile:', error);
    }
  }

  function handleEdit(content: ContentItem) {
    onContentEdit({ mode: 'edit', contentId: content.id });
  }

  function handlePreview(content: ContentItem) {
    setPreviewContent(content);
    setShowPreviewModal(true);
  }

  async function handleDelete(contentId: string) {
    try {
      const { error } = await supabase
        .from('content_calendar')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      onContentUpdated();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Erreur lors de la suppression');
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setIsDragging(false);

    if (!over || active.id === over.id) {
      return;
    }

    const contentA = sortedContents.find((item) => item.id === active.id);
    const contentB = sortedContents.find((item) => item.id === over.id);

    if (!contentA || !contentB) {
      return;
    }

    const swapValidation = canSwapContent(contentA, contentB);

    if (!swapValidation.allowed) {
      if (showFutureAlert && swapValidation.reason?.includes('date plus future')) {
        alert(swapValidation.reason);
        localStorage.setItem('instagram_future_alert_dismissed', 'true');
        setShowFutureAlert(false);
      } else if (!swapValidation.reason?.includes('date plus future')) {
        alert(swapValidation.reason);
      }
      return;
    }

    try {
      const tempDate = contentA.publication_date;
      const tempTime = contentA.publication_time;

      await supabase
        .from('content_calendar')
        .update({
          publication_date: contentB.publication_date,
          publication_time: contentB.publication_time
        })
        .eq('id', contentA.id);

      await supabase
        .from('content_calendar')
        .update({
          publication_date: tempDate,
          publication_time: tempTime
        })
        .eq('id', contentB.id);

      onContentUpdated();
    } catch (error) {
      console.error('Error swapping content dates:', error);
      alert('Erreur lors de l\'échange des dates');
    }
  }

  function handleDragStart() {
    setIsDragging(true);
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-2 h-full overflow-y-auto overflow-x-hidden max-w-full">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Feed Instagram</h2>
            <p className="text-sm text-gray-600">Réorganisez vos posts non publiés par glisser-déposer</p>
          </div>
        </div>
        <button
          onClick={() => setShowPublished(!showPublished)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            showPublished
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
          title={showPublished ? 'Masquer les posts publiés (date+heure atteinte)' : 'Afficher aussi les posts publiés'}
        >
          {showPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="text-xs font-medium">
            {showPublished ? 'Posts publiés visibles' : 'Masquer publiés'}
          </span>
        </button>
      </div>

      <div className="px-2">
        <InstagramProfileHeader postsCount={sortedContents.length} />
      </div>
      {isDragging && showDragHint && (
        <div className="mb-2 mx-2 p-3 bg-orange-100 border-2 border-orange-400 rounded-xl space-y-2 relative">
          <button
            onClick={() => {
              localStorage.setItem('instagram_drag_hint_dismissed', 'true');
              setShowDragHint(false);
            }}
            className="absolute top-2 right-2 text-orange-600 hover:text-orange-800 transition-colors"
            title="Ne plus afficher"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="text-sm font-medium text-orange-900 text-center pr-6">
            Les dates des deux posts seront échangées
          </p>
          <div className="text-xs text-orange-700 space-y-1">
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
              Seuls les posts "Non publié" peuvent être déplacés
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
              Vous ne pouvez pas déplacer vers une date plus future
            </p>
          </div>
        </div>
      )}

      {sortedContents.length === 0 ? (
        <div className="text-center py-8 px-2">
          <Instagram className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Aucun contenu Instagram prévu</p>
          <p className="text-sm text-gray-500">
            Ajoutez des médias à vos contenus pour les voir apparaître ici
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedContents.map(c => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 gap-0.5 sm:gap-1 w-full">
              {sortedContents.map(content => {
                const isPublished = content.is_published === true;

                return (
                  <InstagramFeedCard
                    key={content.id}
                    content={content}
                    onEdit={handleEdit}
                    onPreview={handlePreview}
                    onDelete={handleDelete}
                    isPublished={isPublished}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showPreviewModal && previewContent && (
        <InstagramPreviewModal
          content={previewContent}
          profilePhoto={profile.instagram_profile_photo}
          username={profile.instagram_username}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewContent(null);
          }}
        />
      )}
    </div>
  );
}
