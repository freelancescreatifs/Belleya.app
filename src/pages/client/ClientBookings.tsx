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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Mes rendez-vous</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              A venir
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'past'
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Passes
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${
                  notification.type === 'booking_confirmed'
                    ? 'border-green-500'
                    : notification.type === 'booking_cancelled'
                    ? 'border-red-500'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Bell className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              Aucun rendez-vous
            </h3>
            <p className="text-sm text-gray-500">
              {activeTab === 'upcoming'
                ? 'Vous n\'avez aucun rendez-vous a venir'
                : 'Aucun historique de rendez-vous'}
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {booking.pro.photo ? (
                    <img
                      src={booking.pro.photo}
                      alt={booking.pro.business_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-100 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {booking.pro.business_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-0.5">
                          {booking.service.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {booking.pro.business_name}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{formatDate(booking.appointment_date)} à {formatTime(booking.appointment_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{booking.duration} min</span>
                  </div>
                  {booking.pro.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{booking.pro.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-900 text-lg">
                  {booking.price.toFixed(2)} €
                </span>
                {activeTab === 'past' && booking.status === 'completed' && (
                  <button className="px-4 py-2 text-brand-600 font-medium text-sm hover:bg-brand-50 rounded-lg transition-colors">
                    Laisser un avis
                  </button>
                )}
                {activeTab === 'upcoming' && (
                  <button className="px-4 py-2 text-gray-600 font-medium text-sm hover:bg-gray-100 rounded-lg transition-colors">
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
