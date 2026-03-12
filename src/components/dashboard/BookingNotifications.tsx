import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { autoSendQuestionnairesOnBooking } from '../../lib/questionnaireHelpers';
import { Bell, X, Check, Calendar, Clock, User } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  booking_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface Booking {
  id: string;
  appointment_date: string;
  duration: number;
  price: number;
  status: string;
  notes: string;
  client_id: string;
  service: {
    name: string;
  };
  client: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

export default function BookingNotifications() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bookingDetails, setBookingDetails] = useState<{ [key: string]: Booking }>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      subscribeToNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'booking_request')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setNotifications(data);

        const bookingIds = data.filter(n => n.booking_id).map(n => n.booking_id);
        if (bookingIds.length > 0) {
          await loadBookingDetails(bookingIds);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookingDetails = async (bookingIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          appointment_date,
          duration,
          price,
          status,
          notes,
          client_id,
          service:services(name),
          client:user_profiles(first_name, last_name, phone)
        `)
        .in('id', bookingIds)
        .eq('status', 'pending');

      if (error) throw error;

      if (data) {
        const detailsMap: { [key: string]: Booking } = {};
        for (const booking of data) {
          detailsMap[booking.id] = booking as any;
        }
        setBookingDetails(detailsMap);
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
    }
  };

  const subscribeToNotifications = () => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
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
  };

  const handleAcceptBooking = async (notificationId: string, bookingId: string) => {
    setProcessing(bookingId);

    try {
      console.log('Calling accept_booking RPC with booking_id:', bookingId);

      const { data, error: rpcError } = await supabase.rpc('accept_booking', {
        p_booking_id: bookingId
      });

      console.log('RPC Response:', { data, error: rpcError });

      if (rpcError) {
        console.error('RPC Error details:', {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code
        });
        throw rpcError;
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || data?.message || 'Erreur lors de l\'acceptation';
        console.error('RPC returned failure:', data);
        throw new Error(errorMsg);
      }

      console.log('Booking accepted successfully:', data);

      if (profile?.company_id) {
        const { data: bookingInfo } = await supabase
          .from('bookings')
          .select('service_id')
          .eq('id', bookingId)
          .maybeSingle();

        if (bookingInfo?.service_id) {
          autoSendQuestionnairesOnBooking(
            bookingId,
            bookingInfo.service_id,
            profile.company_id,
            user!.id
          );
        }
      }

      const { error: notifError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (notifError) throw notifError;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const newDetails = { ...bookingDetails };
      delete newDetails[bookingId];
      setBookingDetails(newDetails);

      alert('Réservation acceptée avec succès ! Le client et le rendez-vous ont été ajoutés automatiquement.');
    } catch (error: any) {
      console.error('Error accepting booking:', error);
      const errorMessage = error?.message || error?.details || 'Erreur lors de l\'acceptation de la réservation';
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectBooking = async (notificationId: string, bookingId: string) => {
    const reason = prompt('Raison du refus (optionnel):');

    setProcessing(bookingId);

    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason || 'Le professionnel n\'est pas disponible à cette date'
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      const { error: notifError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (notifError) throw notifError;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const newDetails = { ...bookingDetails };
      delete newDetails[bookingId];
      setBookingDetails(newDetails);
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Erreur lors du refus de la réservation');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-belaya-500" />
          <h2 className="text-lg font-semibold text-gray-900">Nouvelles réservations</h2>
        </div>
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-belaya-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          Nouvelles réservations ({notifications.length})
        </h2>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => {
          const booking = notification.booking_id ? bookingDetails[notification.booking_id] : null;

          return (
            <div
              key={notification.id}
              className="border border-belaya-200 rounded-lg p-4 bg-belaya-50"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                </div>
              </div>

              {booking && (
                <div className="bg-white rounded-lg p-4 space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {booking.client?.first_name} {booking.client?.last_name}
                    </span>
                    {booking.client?.phone && (
                      <span className="text-gray-600">• {booking.client.phone}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {formatDate(booking.appointment_date)} à {formatTime(booking.appointment_date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {booking.service.name} - {booking.duration} min - {booking.price} €
                    </span>
                  </div>

                  {booking.notes && (
                    <div className="text-sm bg-gray-50 rounded p-2">
                      <span className="font-medium text-gray-700">Note: </span>
                      <span className="text-gray-600">{booking.notes}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => notification.booking_id && handleAcceptBooking(notification.id, notification.booking_id)}
                  disabled={processing === notification.booking_id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-belaya-vivid text-white rounded-lg hover:bg-belaya-bright transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {processing === notification.booking_id ? 'En cours...' : 'Accepter'}
                </button>
                <button
                  onClick={() => notification.booking_id && handleRejectBooking(notification.id, notification.booking_id)}
                  disabled={processing === notification.booking_id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  {processing === notification.booking_id ? 'En cours...' : 'Refuser'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
