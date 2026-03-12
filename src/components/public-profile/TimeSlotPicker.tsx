import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatMonthYear, getDaysInMonth, getFirstDayOfMonth } from '../../lib/calendarHelpers';
import { generateTimeSlots } from '../../lib/availabilityHelpers';

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface Event {
  start: string;
  end: string;
}

interface WeeklyAvailability {
  [key: string]: Array<{
    start: string;
    end: string;
    available: boolean;
  }>;
}

interface TimeSlotPickerProps {
  providerId: string;
  serviceId: string;
  serviceDuration: number;
  supplementsDuration?: number;
  onSelectSlot: (date: Date, time: string) => void;
  onClose: () => void;
}

export default function TimeSlotPicker({
  providerId,
  serviceId,
  serviceDuration,
  supplementsDuration = 0,
  onSelectSlot,
  onClose,
}: TimeSlotPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [bufferTime, setBufferTime] = useState(15);
  const [advanceBookingHours, setAdvanceBookingHours] = useState(24);
  const [loading, setLoading] = useState(true);

  const totalDuration = serviceDuration + supplementsDuration;

  useEffect(() => {
    loadProviderSettings();
    loadEvents();
  }, [providerId]);

  useEffect(() => {
    if (selectedDate && weeklyAvailability) {
      calculateTimeSlots(selectedDate);
    }
  }, [selectedDate, weeklyAvailability, events]);

  async function loadProviderSettings() {
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('weekly_availability, week_schedule, buffer_time_minutes, advance_booking_hours')
        .eq('user_id', providerId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWeeklyAvailability(data.weekly_availability || data.week_schedule || {});
        setBufferTime(data.buffer_time_minutes || 15);
        setAdvanceBookingHours(data.advance_booking_hours || 24);
      }
    } catch (error) {
      console.error('Error loading provider settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadEvents() {
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('events')
        .select('start_at, end_at')
        .eq('user_id', providerId)
        .gte('start_at', startOfMonth.toISOString())
        .lte('start_at', endOfMonth.toISOString());

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  function mergeAvailableRanges(
    daySlots: Array<{ start: string; end: string; available: boolean }>
  ): Array<{ startMin: number; endMin: number }> {
    const available = daySlots.filter((s) => s.available);
    if (available.length === 0) return [];

    const sorted = [...available].sort((a, b) => {
      const [ah, am] = a.start.split(':').map(Number);
      const [bh, bm] = b.start.split(':').map(Number);
      return ah * 60 + am - (bh * 60 + bm);
    });

    const ranges: Array<{ startMin: number; endMin: number }> = [];
    const [fh, fm] = sorted[0].start.split(':').map(Number);
    const [feh, fem] = sorted[0].end.split(':').map(Number);
    let curStart = fh * 60 + fm;
    let curEnd = feh * 60 + fem;

    for (let i = 1; i < sorted.length; i++) {
      const [sh, sm] = sorted[i].start.split(':').map(Number);
      const [eh, em] = sorted[i].end.split(':').map(Number);
      const slotStart = sh * 60 + sm;
      const slotEnd = eh * 60 + em;

      if (slotStart <= curEnd) {
        curEnd = Math.max(curEnd, slotEnd);
      } else {
        ranges.push({ startMin: curStart, endMin: curEnd });
        curStart = slotStart;
        curEnd = slotEnd;
      }
    }
    ranges.push({ startMin: curStart, endMin: curEnd });
    return ranges;
  }

  function calculateTimeSlots(date: Date) {
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const dayAvailability = weeklyAvailability?.[dayName] || [];

    if (dayAvailability.length === 0) {
      setTimeSlots([]);
      return;
    }

    const ranges = mergeAvailableRanges(dayAvailability);
    if (ranges.length === 0) {
      setTimeSlots([]);
      return;
    }

    const slots: TimeSlot[] = [];
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + advanceBookingHours * 60 * 60 * 1000);

    ranges.forEach((range) => {
      let currentTime = range.startMin;

      while (currentTime + totalDuration <= range.endMin) {
        const hours = Math.floor(currentTime / 60);
        const minutes = currentTime % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        const slotDateTime = new Date(date);
        slotDateTime.setHours(hours, minutes, 0, 0);

        if (slotDateTime < minBookingTime) {
          slots.push({
            time: timeString,
            available: false,
            reason: `Réservation minimum ${advanceBookingHours}h à l'avance`,
          });
        } else {
          const slotEnd = new Date(slotDateTime.getTime() + (totalDuration + bufferTime) * 60 * 1000);

          const hasConflict = events.some((event) => {
            const eventStart = new Date(event.start_at);
            const eventEnd = new Date(event.end_at);

            return (
              (slotDateTime >= eventStart && slotDateTime < eventEnd) ||
              (slotEnd > eventStart && slotEnd <= eventEnd) ||
              (slotDateTime <= eventStart && slotEnd >= eventEnd)
            );
          });

          slots.push({
            time: timeString,
            available: !hasConflict,
            reason: hasConflict ? 'Créneau déjà réservé' : undefined,
          });
        }

        currentTime += 30;
      }
    });

    setTimeSlots(slots);
  }

  function isDateAvailable(date: Date): boolean {
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    const dayAvailability = weeklyAvailability?.[dayName] || [];
    return dayAvailability.some((slot) => slot.available);
  }

  function handleDateClick(day: number) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return;
    if (!isDateAvailable(date)) return;

    setSelectedDate(date);
  }

  function handleTimeClick(time: string) {
    if (!selectedDate) return;
    const slot = timeSlots.find((s) => s.time === time);
    if (!slot?.available) return;

    onSelectSlot(selectedDate, time);
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des disponibilités...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl max-w-2xl w-full">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rose-500" />
          Choisissez votre créneau
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h4 className="font-semibold text-gray-900">
              {formatMonthYear(currentMonth)}
            </h4>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isPast = date < today;
              const isToday = date.getTime() === today.getTime();
              const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth.getMonth();
              const isAvailable = !isPast && isDateAvailable(date);

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={isPast || !isAvailable}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-rose-500 text-white shadow-md'
                      : isToday
                      ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                      : isAvailable
                      ? 'hover:bg-gray-100 text-gray-900'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-500" />
              Créneaux disponibles le {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </h4>

            {timeSlots.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucun créneau disponible ce jour</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => handleTimeClick(slot.time)}
                    disabled={!slot.available}
                    title={slot.reason}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      slot.available
                        ? 'bg-white border-2 border-gray-200 text-gray-900 hover:border-rose-500 hover:bg-rose-50'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
