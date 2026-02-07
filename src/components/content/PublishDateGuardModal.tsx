import { X, AlertTriangle, Calendar } from 'lucide-react';
import { useState } from 'react';

interface PublishDateGuardModalProps {
  isOpen: boolean;
  contentTitle: string;
  currentDate: string;
  onConfirm: (newDate: string) => void;
  onCancel: () => void;
}

export default function PublishDateGuardModal({
  isOpen,
  contentTitle,
  currentDate,
  onConfirm,
  onCancel
}: PublishDateGuardModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const formattedCurrentDate = new Date(currentDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Date de publication future
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900 leading-relaxed">
              <span className="font-semibold">"{contentTitle}"</span> a une date de publication prévue le {formattedCurrentDate}, qui est dans le futur.
            </p>
            <p className="text-sm text-amber-800 mt-2">
              Pour marquer ce contenu comme <span className="font-semibold">Publié</span>, la date de publication doit être aujourd'hui ou dans le passé.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Choisir une nouvelle date de publication
              </label>
              <input
                type="date"
                value={selectedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                La date doit être aujourd'hui ou dans le passé
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(selectedDate)}
            disabled={new Date(selectedDate) > new Date()}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mettre à jour et publier
          </button>
        </div>
      </div>
    </div>
  );
}
