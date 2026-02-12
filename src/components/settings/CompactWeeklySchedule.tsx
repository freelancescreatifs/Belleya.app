import { useState } from 'react';
import { Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import WeeklySchedule from './WeeklySchedule';

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

interface CompactWeeklyScheduleProps {
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

function calculateOpeningHours(slots: TimeSlot[]): { start: string; end: string } | null {
  const availableSlots = slots.filter(slot => slot.available);
  if (availableSlots.length === 0) return null;

  const start = availableSlots[0].start;
  const end = availableSlots[availableSlots.length - 1].end;

  return { start, end };
}

export default function CompactWeeklySchedule({ availability, onChange }: CompactWeeklyScheduleProps) {
  const [showDetailedView, setShowDetailedView] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-6 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-belleya-primary" />
            Horaires d'ouverture
          </h4>
        </div>

        <div className="space-y-2">
          {DAYS.map(({ key, label }) => {
            const daySlots = availability[key as keyof WeeklyAvailability] || [];
            const hours = calculateOpeningHours(daySlots);

            return (
              <div
                key={key}
                className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-200"
              >
                <span className="font-medium text-gray-700 min-w-[100px]">{label}</span>
                {hours ? (
                  <span className="text-gray-600 text-sm">
                    {hours.start} – {hours.end}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm italic">Fermé</span>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowDetailedView(true)}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-sm text-belleya-primary hover:bg-belleya-primary/10 rounded-lg transition-colors"
        >
          <Clock className="w-4 h-4" />
          Gérer les créneaux détaillés
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
        <p className="text-sm text-blue-800">
          Les horaires affichés sont calculés automatiquement depuis vos créneaux actifs.
          Utilisez "Gérer les créneaux détaillés" pour une configuration fine par tranches de 30 minutes.
        </p>
      </div>

      {showDetailedView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-belleya-primary" />
                Gestion détaillée des créneaux
              </h3>
              <button
                onClick={() => setShowDetailedView(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Cliquez sur les créneaux de 30 minutes pour les activer ou désactiver.
                  Les horaires d'ouverture seront automatiquement calculés.
                </p>
              </div>

              <WeeklySchedule
                availability={availability}
                onChange={onChange}
              />
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-belleya-vivid rounded"></div>
                  <span className="text-gray-600">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <span className="text-gray-600">Indisponible</span>
                </div>
              </div>

              <button
                onClick={() => setShowDetailedView(false)}
                className="px-6 py-2 bg-belleya-primary text-white rounded-lg hover:bg-belleya-deep transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
