import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AppointmentDetailModalProps {
  bookingId: string;
  onClose: () => void;
  onReschedule?: (bookingId: string) => void;
}

interface BookingDetail {
  id: string;
  appointment_date: string;
  duration: number;
  status: string;
  price: number;
  deposit_amount: number | null;
  service: {
    id: string;
    name: string;
    description: string | null;
  };
  pro: {
    business_name: string;
    photo: string | null;
    address: string | null;
    reschedule_hours: number;
  };
}

export default function AppointmentDetailModal({
  bookingId,
  onClose,
  onReschedule,
}: AppointmentDetailModalProps) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [canReschedule, setCanReschedule] = useState(false);
  const [rescheduleMessage, setRescheduleMessage] = useState('');

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();

      if (bookingError) throw bookingError;
      if (!bookingData) return;

      const { data: serviceData } = await supabase
        .from('services')
        .select('id, name, description')
        .eq('id', bookingData.service_id)
        .maybeSingle();

      const { data: companyData } = await supabase
        .from('company_profiles')
        .select('company_name, profile_photo, address, city, reschedule_hours')
        .eq('user_id', bookingData.pro_id)
        .maybeSingle();

      const detail: BookingDetail = {
        id: bookingData.id,
        appointment_date: bookingData.appointment_date,
        duration: bookingData.duration,
        status: bookingData.status,
        price: bookingData.price,
        deposit_amount: bookingData.deposit_amount,
        service: {
          id: serviceData?.id || '',
          name: serviceData?.name || 'Service',
          description: serviceData?.description || null,
        },
        pro: {
          business_name: companyData?.company_name || 'N/A',
          photo: companyData?.profile_photo || null,
          address: companyData?.address || companyData?.city || null,
          reschedule_hours: companyData?.reschedule_hours || 24,
        },
      };

      setBooking(detail);

      const appointmentDate = new Date(bookingData.appointment_date);
      const now = new Date();
      const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const rescheduleHours = detail.pro.reschedule_hours;

      if (hoursUntilAppointment >= rescheduleHours) {
        setCanReschedule(true);
        setRescheduleMessage('');
      } else {
        setCanReschedule(false);
        setRescheduleMessage(
          `Nous sommes désolé, vous ne pouvez pas modifier ce rendez-vous à moins de ${rescheduleHours}h avant votre rendez-vous. Votre acompte sera débité. Pour toute question, vous devez contacter directement le prestataire.`
        );
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
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
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      confirmed: 'bg-green-100 text-green-700 border-belleya-300',
      completed: 'bg-blue-100 text-blue-700 border-blue-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
    };
    const labels = {
      pending: 'En attente de confirmation',
      confirmed: 'Confirmé',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium border-2 ${
          styles[status as keyof typeof styles]
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const handleReschedule = () => {
    if (canReschedule && onReschedule && booking) {
      onReschedule(booking.id);
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Détail du rendez-vous</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            {booking.pro.photo ? (
              <img
                src={booking.pro.photo}
                alt={booking.pro.business_name}
                className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-600 to-brand-50 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {booking.pro.business_name.charAt(0)}
                </span>
              </div>
            )}

            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{booking.service.name}</h3>
              <p className="text-gray-600 font-medium">{booking.pro.business_name}</p>
              <div className="mt-2">{getStatusBadge(booking.status)}</div>
            </div>
          </div>

          {booking.service.description && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{booking.service.description}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-lg">
              <Calendar className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Date</p>
                <p className="text-gray-900 font-semibold capitalize">{formatDate(booking.appointment_date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-lg">
              <Clock className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Heure</p>
                <p className="text-gray-900 font-semibold">{formatTime(booking.appointment_date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-lg">
              <Clock className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 font-medium">Durée</p>
                <p className="text-gray-900 font-semibold">{booking.duration} minutes</p>
              </div>
            </div>

            {booking.pro.address && (
              <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-lg">
                <MapPin className="w-5 h-5 text-brand-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 font-medium">Adresse</p>
                  <p className="text-gray-900 font-semibold">{booking.pro.address}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-brand-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-medium">Prix</p>
                <p className="text-gray-900 font-semibold text-xl">{booking.price.toFixed(2)} €</p>
              </div>
            </div>

            {booking.deposit_amount && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Acompte versé</p>
                  <p className="text-blue-900 font-bold">{booking.deposit_amount.toFixed(2)} €</p>
                </div>
              </div>
            )}
          </div>

          {!canReschedule && rescheduleMessage && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium leading-relaxed">
                {rescheduleMessage}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
          >
            Fermer
          </button>
          {canReschedule && onReschedule && booking.status === 'confirmed' && (
            <button
              onClick={handleReschedule}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-50 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Modifier le rendez-vous
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
