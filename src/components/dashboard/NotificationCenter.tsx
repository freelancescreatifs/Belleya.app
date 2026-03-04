import { useState, useEffect } from 'react';
import { Bell, Check, X, Calendar, Star, Heart, Users, Eye, Repeat, Share2, CheckCircle, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  metadata: any;
  is_read: boolean;
  is_acted: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  compact?: boolean;
}

export default function NotificationCenter({ compact = true }: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();

      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(compact ? 5 : 50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleAcceptAppointment = async (notificationId: string, bookingId: string) => {
    try {
      const { data, error: rpcError } = await supabase.rpc('accept_booking', {
        p_booking_id: bookingId
      });

      if (rpcError) throw rpcError;
      if (!data || !data.success) {
        throw new Error(data?.error || 'Erreur lors de l\'acceptation');
      }

      await supabase
        .from('notifications')
        .update({ is_acted: true, is_read: true })
        .eq('id', notificationId);

      loadNotifications();
    } catch (error: any) {
      console.error('Error accepting appointment:', error);
      alert(`Erreur: ${error?.message || 'Impossible d\'accepter le rendez-vous'}`);
    }
  };

  const handleRejectAppointment = async (notificationId: string, bookingId: string) => {
    const reason = prompt('Raison du refus (optionnel):');
    if (reason === null) return;

    try {
      await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason || 'Le professionnel n\'est pas disponible à cette date'
        })
        .eq('id', bookingId);

      await supabase
        .from('notifications')
        .update({ is_acted: true, is_read: true })
        .eq('id', notificationId);

      loadNotifications();
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      alert('Erreur lors du refus du rendez-vous');
    }
  };

  const handleValidateReview = async (notificationId: string, reviewId: string) => {
    try {
      await supabase
        .from('provider_reviews')
        .update({ is_validated: true, validated_at: new Date().toISOString(), is_visible: true })
        .eq('id', reviewId);

      await supabase
        .from('notifications')
        .update({ is_acted: true, is_read: true })
        .eq('id', notificationId);

      loadNotifications();
    } catch (error) {
      console.error('Error validating review:', error);
      alert('Erreur lors de la validation de l\'avis');
    }
  };

  const handleRejectReview = async (notificationId: string, reviewId: string) => {
    try {
      await supabase.from('provider_reviews').delete().eq('id', reviewId);

      await supabase
        .from('notifications')
        .update({ is_acted: true, is_read: true })
        .eq('id', notificationId);

      loadNotifications();
    } catch (error) {
      console.error('Error rejecting review:', error);
      alert('Erreur lors du refus de l\'avis');
    }
  };

  const handleApproveComment = async (notificationId: string, commentId: string) => {
    try {
      await supabase
        .from('content_comments')
        .update({ is_approved: true })
        .eq('id', commentId);

      await supabase
        .from('notifications')
        .update({ is_acted: true, is_read: true })
        .eq('id', notificationId);

      loadNotifications();
    } catch (error) {
      console.error('Error approving comment:', error);
      alert('Erreur lors de l\'approbation du commentaire');
    }
  };

  const handleRejectComment = async (notificationId: string, commentId: string) => {
    try {
      await supabase.from('content_comments').delete().eq('id', commentId);

      await supabase
        .from('notifications')
        .update({ is_acted: true, is_read: true })
        .eq('id', notificationId);

      loadNotifications();
    } catch (error) {
      console.error('Error rejecting comment:', error);
      alert('Erreur lors du refus du commentaire');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_request':
      case 'booking_request':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'review_received':
        return <Star className="w-5 h-5 text-amber-500" />;
      case 'comment_received':
        return <MessageCircle className="w-5 h-5 text-rose-500" />;
      case 'new_follower':
        return <Users className="w-5 h-5 text-belaya-500" />;
      case 'new_like':
        return <Heart className="w-5 h-5 text-belaya-primary" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'A l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    return date.toLocaleDateString('fr-FR');
  };

  const renderNotificationActions = (notification: Notification) => {
    if (notification.is_acted) {
      return (
        <div className="flex items-center gap-1 text-xs text-belaya-bright mt-2">
          <CheckCircle className="w-3 h-3" />
          Traitée
        </div>
      );
    }

    switch (notification.type) {
      case 'appointment_request':
      case 'booking_request':
        if (!notification.entity_id) return null;
        return (
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAcceptAppointment(notification.id, notification.entity_id!);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-belaya-vivid text-white rounded-lg text-xs font-medium hover:bg-belaya-bright transition-colors"
            >
              <Check className="w-3 h-3" />
              Accepter
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRejectAppointment(notification.id, notification.entity_id!);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
              Refuser
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notification.id);
                window.location.href = '/agenda';
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-3 h-3" />
              Voir détails
            </button>
          </div>
        );

      case 'review_received':
        if (!notification.entity_id) return null;
        return (
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleValidateReview(notification.id, notification.entity_id!);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-belaya-vivid text-white rounded-lg text-xs font-medium hover:bg-belaya-bright transition-colors"
            >
              <Check className="w-3 h-3" />
              Approuver
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRejectReview(notification.id, notification.entity_id!);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
              Refuser
            </button>
          </div>
        );

      case 'comment_received':
        if (!notification.entity_id) return null;
        return (
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApproveComment(notification.id, notification.entity_id!);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-belaya-vivid text-white rounded-lg text-xs font-medium hover:bg-belaya-bright transition-colors"
            >
              <Check className="w-3 h-3" />
              Approuver
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRejectComment(notification.id, notification.entity_id!);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
              Supprimer
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="fixed right-4 top-20 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[calc(100vh-100px)] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-rose-50 to-pink-50">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-belaya-primary hover:text-belaya-deep font-medium"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-belaya-500 mx-auto"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune notification</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.is_read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                            {renderNotificationActions(notification)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      window.location.href = '/notifications';
                    }}
                    className="w-full text-center text-sm text-belaya-primary hover:text-belaya-deep font-medium"
                  >
                    Voir toutes les notifications
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Toutes les notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-belaya-primary hover:text-belaya-deep font-medium"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-belaya-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Aucune notification
          </h3>
          <p className="text-gray-600">
            Vous n'avez pas encore reçu de notifications
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                !notification.is_read
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {notification.title}
                    </h4>
                    {!notification.is_read && (
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mb-2">
                    {formatTimeAgo(notification.created_at)}
                  </p>
                  {renderNotificationActions(notification)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
