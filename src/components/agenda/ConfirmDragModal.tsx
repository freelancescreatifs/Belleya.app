import { X, Check, Calendar, Clock } from 'lucide-react';
import { CalendarItem } from '../../types/agenda';
import { formatTime } from '../../lib/calendarHelpers';

interface ConfirmDragModalProps {
  item: CalendarItem;
  newStart: Date;
  newEnd: Date;
  mode: 'move' | 'resize';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDragModal({
  item,
  newStart,
  newEnd,
  mode,
  onConfirm,
  onCancel,
}: ConfirmDragModalProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const hasDateChanged =
    newStart.toDateString() !== item.start.toDateString();

  const hasTimeChanged =
    formatTime(newStart) !== formatTime(item.start) ||
    formatTime(newEnd) !== formatTime(item.end);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              {mode === 'move' ? (
                <Calendar className="w-5 h-5 text-blue-600" />
              ) : (
                <Clock className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {mode === 'move' ? 'Confirmer le déplacement' : 'Confirmer le redimensionnement'}
              </h3>
              <p className="text-sm text-gray-500">
                {item.title}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 py-4 border-t border-b border-gray-200">
          {hasDateChanged && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-500">Nouvelle date</div>
                <div className="font-medium text-gray-900">{formatDate(newStart)}</div>
              </div>
            </div>
          )}

          {hasTimeChanged && (
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-gray-500">Nouveau horaire</div>
                <div className="font-medium text-gray-900">
                  {formatTime(newStart)} - {formatTime(newEnd)}
                </div>
              </div>
            </div>
          )}

          {!hasDateChanged && !hasTimeChanged && (
            <div className="text-sm text-gray-500 text-center py-2">
              Aucun changement détecté
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
