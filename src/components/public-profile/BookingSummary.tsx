import { Calendar, Clock, Euro, Sparkles, ArrowRight } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  special_offer?: string | null;
  offer_type?: 'percentage' | 'fixed' | null;
}

interface Supplement {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface BookingSummaryProps {
  service: Service;
  selectedSupplements: Supplement[];
  selectedDate: Date;
  selectedTime: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BookingSummary({
  service,
  selectedSupplements,
  selectedDate,
  selectedTime,
  onConfirm,
  onCancel,
}: BookingSummaryProps) {
  const serviceFinalPrice = service.special_offer && service.offer_type
    ? service.offer_type === 'percentage'
      ? service.price * (1 - parseFloat(service.special_offer) / 100)
      : service.price - parseFloat(service.special_offer)
    : service.price;

  const supplementsTotal = selectedSupplements.reduce((sum, sup) => sum + sup.price, 0);
  const totalPrice = serviceFinalPrice + supplementsTotal;

  const supplementsDuration = selectedSupplements.reduce((sum, sup) => sum + sup.duration_minutes, 0);
  const totalDuration = service.duration + supplementsDuration;

  const dateFormatted = selectedDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl max-w-lg w-full">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">
          Récapitulatif de votre réservation
        </h3>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Service</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{service.name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Clock className="w-4 h-4" />
                  <span>{service.duration} min</span>
                </div>
              </div>
              <div className="text-right">
                {service.special_offer && service.offer_type && (
                  <div className="text-xs text-gray-400 line-through">
                    {service.price.toFixed(2)} €
                  </div>
                )}
                <span className="font-bold text-gray-900">
                  {serviceFinalPrice.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>

        {selectedSupplements.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" />
              Options sélectionnées
            </h4>
            <div className="space-y-2">
              {selectedSupplements.map((supplement) => (
                <div key={supplement.id} className="bg-rose-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{supplement.name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>+{supplement.duration_minutes} min</span>
                      </div>
                    </div>
                    <span className="font-semibold text-rose-600">
                      +{supplement.price.toFixed(2)} €
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Date et heure</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-gray-900">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span className="capitalize">{dateFormatted}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-900">
              <Clock className="w-4 h-4 text-rose-500" />
              <span>{selectedTime}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Durée totale</span>
            <span className="font-medium text-gray-900">{totalDuration} min</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">TOTAL</span>
            <span className="text-2xl font-bold text-rose-600 flex items-center gap-1">
              {totalPrice.toFixed(2)} <Euro className="w-5 h-5" />
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end rounded-b-xl">
        <button
          onClick={onCancel}
          className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg flex items-center gap-2"
        >
          Continuer la réservation
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
