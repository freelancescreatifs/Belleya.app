interface WeeklyAvailability {
  [key: string]: Array<{
    start: string;
    end: string;
    available: boolean;
  }>;
}

interface Event {
  start_at: string;
  end_at: string;
  type: string;
}

const DAYS_MAP: { [key: number]: string } = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

const BLOCKING_EVENT_TYPES = ['client', 'personal', 'pro', 'formation', 'google', 'planity'];

function mergeAvailableRanges(
  daySchedule: Array<{ start: string; end: string; available: boolean }>
): Array<{ start: number; end: number }> {
  const available = daySchedule.filter((s) => s.available);
  if (available.length === 0) return [];

  const sorted = [...available].sort((a, b) => {
    const [ah, am] = a.start.split(':').map(Number);
    const [bh, bm] = b.start.split(':').map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  });

  const ranges: Array<{ start: number; end: number }> = [];
  const [firstH, firstM] = sorted[0].start.split(':').map(Number);
  const [firstEH, firstEM] = sorted[0].end.split(':').map(Number);
  let currentStart = firstH * 60 + firstM;
  let currentEnd = firstEH * 60 + firstEM;

  for (let i = 1; i < sorted.length; i++) {
    const [sh, sm] = sorted[i].start.split(':').map(Number);
    const [eh, em] = sorted[i].end.split(':').map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd = eh * 60 + em;

    if (slotStart <= currentEnd) {
      currentEnd = Math.max(currentEnd, slotEnd);
    } else {
      ranges.push({ start: currentStart, end: currentEnd });
      currentStart = slotStart;
      currentEnd = slotEnd;
    }
  }
  ranges.push({ start: currentStart, end: currentEnd });

  return ranges;
}

export function isTimeInOpeningHours(
  date: Date,
  time: string,
  durationMinutes: number,
  weeklyAvailability: WeeklyAvailability | null
): boolean {
  if (!weeklyAvailability) return false;

  const dayOfWeek = DAYS_MAP[date.getDay()];
  const daySchedule = weeklyAvailability[dayOfWeek];

  if (!daySchedule || daySchedule.length === 0) return false;

  const [hours, minutes] = time.split(':').map(Number);
  const slotStart = hours * 60 + minutes;
  const slotEnd = slotStart + durationMinutes;

  const ranges = mergeAvailableRanges(daySchedule);

  return ranges.some((range) => slotStart >= range.start && slotEnd <= range.end);
}

export function isSlotBlocked(
  slotStart: Date,
  slotEnd: Date,
  events: Event[]
): boolean {
  return events.some((event) => {
    if (!BLOCKING_EVENT_TYPES.includes(event.type)) {
      return false;
    }

    const eventStart = new Date(event.start_at);
    const eventEnd = new Date(event.end_at);

    return (
      (slotStart >= eventStart && slotStart < eventEnd) ||
      (slotEnd > eventStart && slotEnd <= eventEnd) ||
      (slotStart <= eventStart && slotEnd >= eventEnd)
    );
  });
}

export function generateTimeSlots(
  date: Date,
  serviceDuration: number,
  weeklyAvailability: WeeklyAvailability | null,
  events: Event[]
): Array<{ time: string; available: boolean; reason?: string }> {
  const slots: Array<{ time: string; available: boolean; reason?: string }> = [];
  const slotDuration = 30;
  const workStart = 7;
  const workEnd = 22;

  for (let hour = workStart; hour < workEnd; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const slotStart = new Date(date);
      slotStart.setHours(hour, minute, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

      const isPast = slotStart < new Date();
      if (isPast) {
        slots.push({ time, available: false, reason: 'past' });
        continue;
      }

      const isInOpeningHours = isTimeInOpeningHours(
        date,
        time,
        serviceDuration,
        weeklyAvailability
      );

      if (!isInOpeningHours) {
        slots.push({ time, available: false, reason: 'closed' });
        continue;
      }

      const isBlocked = isSlotBlocked(slotStart, slotEnd, events);
      if (isBlocked) {
        slots.push({ time, available: false, reason: 'booked' });
        continue;
      }

      slots.push({ time, available: true });
    }
  }

  return slots.filter((slot) => slot.reason !== 'closed' || slot.available);
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface DetailedWeeklyAvailability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

interface DaySchedule {
  is_open: boolean;
  start_time: string;
  end_time: string;
}

interface WeekSchedule {
  [key: string]: DaySchedule;
}

export function convertWeeklyAvailabilityToSchedule(
  availability: DetailedWeeklyAvailability
): WeekSchedule {
  const schedule: WeekSchedule = {};

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  days.forEach((day) => {
    const slots = availability[day as keyof DetailedWeeklyAvailability] || [];
    const availableSlots = slots.filter((slot) => slot.available);

    if (availableSlots.length === 0) {
      schedule[day] = {
        is_open: false,
        start_time: '09:00',
        end_time: '18:00',
      };
    } else {
      const firstSlot = availableSlots[0];
      const lastSlot = availableSlots[availableSlots.length - 1];

      schedule[day] = {
        is_open: true,
        start_time: firstSlot.start,
        end_time: lastSlot.end,
      };
    }
  });

  return schedule;
}

export function convertWeekScheduleToAvailability(
  schedule: WeekSchedule
): DetailedWeeklyAvailability {
  const availability: DetailedWeeklyAvailability = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  const TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00'
  ];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  days.forEach((day) => {
    const daySchedule = schedule[day];

    if (!daySchedule || !daySchedule.is_open) {
      availability[day as keyof DetailedWeeklyAvailability] = TIME_SLOTS.slice(0, -1).map((start, index) => ({
        start,
        end: TIME_SLOTS[index + 1],
        available: false,
      }));
      return;
    }

    const startTime = daySchedule.start_time;
    const endTime = daySchedule.end_time;

    availability[day as keyof DetailedWeeklyAvailability] = TIME_SLOTS.slice(0, -1).map((start, index) => {
      const slotEnd = TIME_SLOTS[index + 1];
      const isInRange = start >= startTime && slotEnd <= endTime;

      return {
        start,
        end: slotEnd,
        available: isInRange,
      };
    });
  });

  return availability;
}
