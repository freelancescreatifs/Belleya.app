import React, { useState } from 'react';
import { Clock, Copy, Check, X } from 'lucide-react';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface WeeklyAvailability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

interface WeeklyScheduleProps {
  availability: WeeklyAvailability;
  onChange: (availability: WeeklyAvailability) => void;
}

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
] as const;

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00'
];

export default function WeeklySchedule({ availability, onChange }: WeeklyScheduleProps) {
  const [copyFromDay, setCopyFromDay] = useState<string | null>(null);

  const generateDefaultSlots = (): TimeSlot[] => {
    return TIME_SLOTS.slice(0, -1).map((start, index) => ({
      start,
      end: TIME_SLOTS[index + 1],
      available: false
    }));
  };

  const getSlots = (day: string): TimeSlot[] => {
    const slots = availability[day as keyof WeeklyAvailability];
    if (!slots || slots.length === 0) {
      return generateDefaultSlots();
    }
    return slots;
  };

  const toggleSlot = (day: string, slotIndex: number) => {
    const slots = [...getSlots(day)];
    slots[slotIndex].available = !slots[slotIndex].available;

    onChange({
      ...availability,
      [day]: slots
    });
  };

  const toggleAllDay = (day: string, available: boolean) => {
    const slots = getSlots(day).map(slot => ({
      ...slot,
      available
    }));

    onChange({
      ...availability,
      [day]: slots
    });
  };

  const copySchedule = (fromDay: string, toDay: string) => {
    const slots = [...getSlots(fromDay)];

    onChange({
      ...availability,
      [toDay]: slots
    });

    setCopyFromDay(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span>Cliquez sur les créneaux pour les activer/désactiver</span>
      </div>

      <div className="overflow-x-auto w-full max-w-full">
        <div className="min-w-[800px]">
          {DAYS.map(({ key, label }) => {
            const slots = getSlots(key);
            const allAvailable = slots.every(s => s.available);
            const someAvailable = slots.some(s => s.available);

            return (
              <div key={key} className="mb-4 bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{label}</h4>

                  <div className="flex items-center gap-2">
                    {copyFromDay && copyFromDay !== key && (
                      <button
                        onClick={() => copySchedule(copyFromDay, key)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Coller ici
                      </button>
                    )}

                    {copyFromDay === key ? (
                      <button
                        onClick={() => setCopyFromDay(null)}
                        className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Annuler
                      </button>
                    ) : (
                      <button
                        onClick={() => setCopyFromDay(key)}
                        disabled={!someAvailable}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copier
                      </button>
                    )}

                    <button
                      onClick={() => toggleAllDay(key, true)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Tout activer
                    </button>

                    <button
                      onClick={() => toggleAllDay(key, false)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Tout désactiver
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-8 gap-2">
                  {slots.map((slot, index) => (
                    <button
                      key={`${slot.start}-${slot.end}`}
                      onClick={() => toggleSlot(key, index)}
                      className={`px-2 py-2 text-xs rounded transition-colors ${
                        slot.available
                          ? 'bg-green-100 text-green-800 border border-belaya-300 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-medium">{slot.start}</div>
                      <div className="text-[10px] opacity-75">{slot.end}</div>
                      {!slot.available && (
                        <div className="text-[9px] mt-1 opacity-60">Indispo</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex-shrink-0 w-3 h-3 bg-belaya-vivid rounded mt-1"></div>
        <div className="text-sm">
          <p className="font-medium text-gray-900">Disponible</p>
          <p className="text-gray-600">Les créneaux en vert sont disponibles pour les réservations</p>
        </div>
      </div>

      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex-shrink-0 w-3 h-3 bg-gray-400 rounded mt-1"></div>
        <div className="text-sm">
          <p className="font-medium text-gray-900">Indisponible</p>
          <p className="text-gray-600">Les créneaux grisés ne sont pas disponibles pour les réservations</p>
        </div>
      </div>
    </div>
  );
}
