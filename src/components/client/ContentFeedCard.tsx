import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ShareDrawer from './ShareDrawer';

interface ContentFeedCardProps {
  content: {
    id: string;
    title: string;
    description: string;
    media_url?: string;
    platform: string[] | string;
    published_date?: string;
    likes_count: number;
    comments_count: number;
    company_id: string;
    service_category?: string;
    service_name?: string;
  };
  provider: {
    company_name: string;
    photo_url?: string;
    booking_slug?: string;
  };
  currentUserId: string;
  contentType?: 'client_photo' | 'content_calendar' | 'inspiration';
  onContentClick?: (contentId: string) => void;
}

interface Comment {
  id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  user_name?: string;
}

export default function ContentFeedCard({ content, provider, currentUserId, contentType = 'content_calendar', onContentClick }: ContentFeedCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(content.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(content.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showShareDrawer, setShowShareDrawer] = useState(false);

  useEffect(() => {
    checkIfLiked();
  }, [content.id, currentUserId]);

  const checkIfLiked = async () => {
    try {
      const { data } = await supabase
        .from('content_likes')
        .select('id')
        .eq('content_type', contentType)
        .eq('content_id', content.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const refreshLikesCount = async () => {
    const table = contentType === 'client_photo' ? 'client_results_photos' : 'content_calendar';
    const { data } = await supabase
      .from(table)
      .select('likes_count')
      .eq('id', content.id)
      .maybeSingle();
    if (data) setLikesCount(data.likes_count || 0);
  };

  const refreshCommentsCount = async () => {
    const table = contentType === 'client_photo' ? 'client_results_photos' : 'content_calendar';
    const { data } = await supabase
      .from(table)
      .select('comments_count')
      .eq('id', content.id)
      .maybeSingle();
    if (data) setCommentsCount(data.comments_count || 0);
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('content_likes')
          .delete()
          .eq('content_type', contentType)
          .eq('content_id', content.id)
          .eq('user_id', currentUserId);
        if (!error) {
          setIsLiked(false);
          await refreshLikesCount();
        }
      } else {
        const { error } = await supabase
          .from('content_likes')
          .insert({
            content_type: contentType,
            content_id: content.id,
            user_id: currentUserId
          });
        if (!error) {
          setIsLiked(true);
          await refreshLikesCount();
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const loadComments = async () => {
    try {
      const { data: commentsData } = await supabase
        .from('content_comments')
        .select(`
          id,
          user_id,
          comment_text,
          created_at,
          is_approved
        `)
        .eq('content_type', contentType)
        .eq('content_id', content.id)
        .order('created_at', { ascending: false });

      if (commentsData) {
        const commentsWithNames = await Promise.all(
          commentsData.map(async (comment) => {
            const { data: clientData } = await supabase
              .from('clients')
              .select('first_name, last_name')
              .eq('user_id', comment.user_id)
              .maybeSingle();

            return {
              ...comment,
              user_name: clientData
                ? `${clientData.first_name} ${clientData.last_name}`
                : 'Utilisateur'
            };
          })
        );
        setComments(commentsWithNames);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleShowComments = async () => {
    if (!showComments) {
      await loadComments();
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('content_comments')
        .insert({
          content_type: contentType,
          content_id: content.id,
          user_id: currentUserId,
          comment_text: newComment.trim()
        })
        .select()
        .single();

      if (data) {
        setNewComment('');
        await refreshCommentsCount();
        await loadComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)}j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const handleProviderClick = () => {
    if (provider.booking_slug) {
      window.location.href = `/provider/${provider.booking_slug}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleProviderClick}
        >
          {provider.photo_url ? (
            <img
              src={provider.photo_url}
              alt={provider.company_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-belleya-deep flex items-center justify-center text-white font-semibold">
              {provider.company_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{provider.company_name}</p>
            <p className="text-xs text-gray-500">{formatDate(content.published_date)}</p>
          </div>
        </div>
        <span className="text-xs text-gray-500 uppercase">{content.platform}</span>
      </div>

      {content.media_url && (
        <div
          className="cursor-pointer aspect-square"
          onClick={handleProviderClick}
        >
          <img
            src={content.media_url}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-6 mb-3">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 text-gray-700 hover:text-brand-600 transition-colors"
          >
            <Heart
              className={`w-6 h-6 ${isLiked ? 'fill-brand-600 text-brand-600' : ''}`}
            />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          <button
            onClick={handleShowComments}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-sm font-medium">{commentsCount}</span>
          </button>

          <button
            onClick={() => setShowShareDrawer(true)}
            className="flex items-center gap-2 text-gray-700 hover:text-belleya-bright transition-colors ml-auto"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-2">
          {contentType === 'client_photo' ? (
            <>
              {content.service_category && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">Catégorie:</span>
                  <span className="text-sm font-semibold text-gray-900">{content.service_category}</span>
                </div>
              )}
              {content.service_name && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">Service:</span>
                  <span className="text-sm font-semibold text-gray-900">{content.service_name}</span>
                </div>
              )}
              {content.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{content.description}</p>
              )}
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-900">{content.title}</p>
              {content.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{content.description}</p>
              )}
            </>
          )}
        </div>

        {showComments && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="flex items-start gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button
                onClick={handleAddComment}
                disabled={isLoading || !newComment.trim()}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publier
              </button>
            </div>

            {comments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">Aucun commentaire</p>
            )}

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-belleya-deep flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {comment.user_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-sm font-semibold text-gray-900">{comment.user_name}</p>
                    <p className="text-sm text-gray-700 mt-1">{comment.comment_text}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(comment.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ShareDrawer
        isOpen={showShareDrawer}
        onClose={() => setShowShareDrawer(false)}
        contentTitle={content.title}
        contentDescription={content.description}
        contentImageUrl={content.media_url}
        providerName={provider.company_name}
        shareUrl={provider.booking_slug ? `/provider/${provider.booking_slug}` : ''}
      />
    </div>
  );
}
