import { useState, useEffect } from 'react';
import { Calendar, MapPin, Star, Clock, Bell, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Booking {
  id: string;
  appointment_date: string;
  duration: number;
  status: string;
  price: number;
  service: {
    id: string;
    name: string;
  };
  pro: {
    business_name: string;
    photo: string | null;
    address: string | null;
  };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function ClientBookings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
    loadNotifications();
  }, [user, activeTab]);

  const loadBookings = async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('bookings')
      .select('id, appointment_date, duration, price, status, service_id, pro_id')
      .eq('client_id', user.id)
      .order('appointment_date', { ascending: activeTab === 'upcoming' });

    if (activeTab === 'upcoming') {
      query = query.gte('appointment_date', new Date().toISOString());
      query = query.in('status', ['pending', 'confirmed']);
    } else {
      query = query.lt('appointment_date', new Date().toISOString());
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      const formattedBookings = await Promise.all(
        data.map(async (booking: any) => {
          const { data: serviceData } = await supabase
            .from('services')
            .select('id, name')
            .eq('id', booking.service_id)
            .maybeSingle();

          const { data: companyData } = await supabase
            .from('company_profiles')
            .select('company_name, profile_photo, address, city')
            .eq('user_id', booking.pro_id)
            .maybeSingle();

          return {
            id: booking.id,
            appointment_date: booking.appointment_date,
            duration: booking.duration,
            price: booking.price,
            status: booking.status,
            service: {
              id: serviceData?.id || '',
              name: serviceData?.name || 'Service',
            },
            pro: {
              business_name: companyData?.company_name || 'N/A',
              photo: companyData?.profile_photo || null,
              address: companyData?.address || companyData?.city || null,
            },
          };
        })
      );
      setBookings(formattedBookings);
    } else {
      setBookings([]);
    }
    setLoading(false);
  };

  const loadNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .in('type', ['booking_confirmed', 'booking_cancelled', 'booking_completed'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setNotifications(data);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirme',
      completed: 'Termine',
      cancelled: 'Annule',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <div className="bg-gradient-to-r from-brand-600 to-brand-50 text-white px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <img src="/belleyaa.png" alt="BelleYa" className="h-24 w-auto" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Mes rendez-vous</h1>
        <div className="flex gap-2 bg-white/20 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-white text-brand-600 shadow-lg'
                : 'text-white hover:bg-white/10'
            }`}
          >
            À venir
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'past'
                ? 'bg-white text-brand-600 shadow-lg'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Passés
          </button>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        {notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-2xl shadow-lg p-5 border-l-4 ${
                  notification.type === 'booking_confirmed'
                    ? 'border-green-500'
                    : notification.type === 'booking_cancelled'
                    ? 'border-red-500'
                    : 'border-brand-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      notification.type === 'booking_confirmed'
                        ? 'bg-green-100'
                        : notification.type === 'booking_cancelled'
                        ? 'bg-red-100'
                        : 'bg-brand-100'
                    }`}>
                      <Bell className={`w-5 h-5 ${
                        notification.type === 'booking_confirmed'
                          ? 'text-green-600'
                          : notification.type === 'booking_cancelled'
                          ? 'text-red-600'
                          : 'text-brand-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{notification.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-600 to-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-xl mb-2">
              Aucun rendez-vous
            </h3>
            <p className="text-sm text-gray-500">
              {activeTab === 'upcoming'
                ? 'Vous n\'avez aucun rendez-vous à venir'
                : 'Aucun historique de rendez-vous'}
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
              <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  {booking.pro.photo ? (
                    <img
                      src={booking.pro.photo}
                      alt={booking.pro.business_name}
                      className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xl">
                        {booking.pro.business_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-lg">
                        {booking.service.name}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      {booking.pro.business_name}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm text-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-brand-600" />
                    </div>
                    <span className="font-medium">{formatDate(booking.appointment_date)} à {formatTime(booking.appointment_date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-brand-600" />
                    </div>
                    <span className="font-medium">{booking.duration} min</span>
                  </div>
                  {booking.pro.address && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-brand-600" />
                      </div>
                      <span className="font-medium truncate">{booking.pro.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 bg-gradient-to-r from-brand-50 to-brand-100/50 border-t border-brand-100 flex items-center justify-between">
                <span className="font-bold text-brand-600 text-xl">
                  {booking.price.toFixed(2)} €
                </span>
                {activeTab === 'past' && booking.status === 'completed' && (
                  <button className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-50 text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-all">
                    Laisser un avis
                  </button>
                )}
                {activeTab === 'upcoming' && (
                  <button className="px-5 py-2.5 border-2 border-brand-200 text-brand-600 font-semibold text-sm rounded-xl hover:bg-brand-50 transition-all">
                    Voir le détail
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
