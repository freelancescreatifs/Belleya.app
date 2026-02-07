import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  user_id: string;
}

interface Provider {
  user_id: string;
  company_name: string;
  profile_photo?: string | null;
  address?: string | null;
}

interface BookingAvailabilityModalProps {
  service: Service;
  provider: Provider;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface WeekSchedule {
  [key: string]: {
    is_open: boolean;
    start_time: string;
    end_time: string;
  };
}

export default function BookingAvailabilityModal({
  service,
  provider,
  onClose,
  onSuccess,
}: BookingAvailabilityModalProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule | null>(null);
  const [bookingNote, setBookingNote] = useState('');

  useEffect(() => {
    loadWeekSchedule();
  }, []);

  useEffect(() => {
    if (weekSchedule) {
      loadAvailableSlots();
    }
  }, [selectedDate, weekSchedule]);

  const loadWeekSchedule = async () => {
    const { data } = await supabase
      .from('company_profiles')
      .select('week_schedule')
      .eq('user_id', provider.user_id)
      .maybeSingle();

    if (data?.week_schedule) {
      setWeekSchedule(data.week_schedule as WeekSchedule);
    }
  };

  const loadAvailableSlots = async () => {
    if (!weekSchedule) return;

    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = weekSchedule[dayName];

    if (!daySchedule || !daySchedule.is_open) {
      setAvailableSlots([]);
      return;
    }

    const slots: TimeSlot[] = [];
    const startHour = parseInt(daySchedule.start_time.split(':')[0]);
    const startMinute = parseInt(daySchedule.start_time.split(':')[1]);
    const endHour = parseInt(daySchedule.end_time.split(':')[0]);
    const endMinute = parseInt(daySchedule.end_time.split(':')[1]);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      const slotEndMinutes = minutes + service.duration;
      if (slotEndMinutes <= endMinutes) {
        slots.push({
          time: timeString,
          available: true,
        });
      }
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data: existingEvents } = await supabase
      .from('events')
      .select('start_at, end_at')
      .eq('user_id', provider.user_id)
      .gte('start_at', `${dateStr}T00:00:00`)
      .lte('start_at', `${dateStr}T23:59:59`)
      .in('type', ['pro', 'personal']);

    const updatedSlots = slots.map(slot => {
      const slotDateTime = new Date(`${dateStr}T${slot.time}:00`);
      const slotEndTime = new Date(slotDateTime.getTime() + service.duration * 60000);

      const hasConflict = existingEvents?.some(event => {
        const eventStart = new Date(event.start_at);
        const eventEnd = new Date(event.end_at);
        return (
          (slotDateTime >= eventStart && slotDateTime < eventEnd) ||
          (slotEndTime > eventStart && slotEndTime <= eventEnd) ||
          (slotDateTime <= eventStart && slotEndTime >= eventEnd)
        );
      });

      return {
        ...slot,
        available: !hasConflict,
      };
    });

    setAvailableSlots(updatedSlots);
  };

  const handleBooking = async () => {
    if (!selectedTime || !user) return;

    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const startDateTime = new Date(`${dateStr}T${selectedTime}:00`);

      const { error } = await supabase.from('bookings').insert({
        client_id: user.id,
        pro_id: provider.user_id,
        service_id: service.id,
        appointment_date: startDateTime.toISOString(),
        duration: service.duration,
        price: service.price,
        status: 'pending',
        notes: bookingNote || null,
      });

      if (error) throw error;

      alert('Demande de rendez-vous envoyée avec succès');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      alert('Erreur lors de la réservation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const nextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
    setSelectedTime('');
  };

  const prevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    if (prev >= new Date(new Date().setHours(0, 0, 0, 0))) {
      setSelectedDate(prev);
      setSelectedTime('');
    }
  };

  const dayName = selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' });
  const daySchedule = weekSchedule?.[selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Réserver un créneau</h2>
            <p className="text-gray-600 mt-1">{service.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-brand-50 to-brand-100 rounded-xl p-4 border border-brand-200">
            <div className="flex items-start gap-4">
              {provider.profile_photo && (
                <img
                  src={provider.profile_photo}
                  alt={provider.company_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{provider.company_name}</h3>
                {provider.address && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    {provider.address}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-700">
                    <Clock className="w-4 h-4" />
                    {service.duration} min
                  </div>
                  <div className="font-bold text-brand-600">
                    {service.price} €
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sélectionnez une date
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={prevDay}
                disabled={selectedDate <= new Date(new Date().setHours(0, 0, 0, 0))}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 text-center">
                <div className="text-lg font-bold text-gray-900">
                  {selectedDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
              <button
                onClick={nextDay}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {daySchedule && !daySchedule.is_open ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Fermé ce jour-là</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucun créneau disponible ce jour</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Créneaux disponibles
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`py-3 px-4 rounded-lg font-medium transition-all ${
                        selectedTime === slot.time
                          ? 'bg-gradient-to-r from-brand-600 to-brand-100 text-white'
                          : slot.available
                          ? 'bg-white border-2 border-gray-200 hover:border-brand-300 text-gray-900'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optionnelle)
                </label>
                <textarea
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  rows={3}
                  placeholder="Informations complémentaires..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleBooking}
            disabled={!selectedTime || loading}
            className="px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Réservation...' : 'Confirmer la réservation'}
          </button>
        </div>
      </div>
    </div>
  );
}
