import { Scissors, Sparkles, Clock } from 'lucide-react';

interface ServiceSupplement {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    description?: string;
    duration: number;
    price: number;
    photo_url?: string | null;
    service_type?: string;
    special_offer?: string | null;
    offer_type?: 'percentage' | 'fixed' | null;
    supplements?: ServiceSupplement[];
  };
  onClick?: () => void;
  isSelected?: boolean;
}

export default function ServiceCard({ service, onClick, isSelected }: ServiceCardProps) {
  const finalPrice = service.special_offer && service.offer_type
    ? service.offer_type === 'percentage'
      ? service.price * (1 - parseFloat(service.special_offer) / 100)
      : service.price - parseFloat(service.special_offer)
    : service.price;

  const hasSupplements = service.supplements && service.supplements.length > 0;

  return (
    <div
      onClick={onClick}
      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'border-rose-500 bg-rose-50 shadow-md ring-2 ring-rose-200'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
      }`}
    >
      <div className="flex gap-3">
        {service.photo_url ? (
          <div className="w-20 h-20 flex-shrink-0">
            <img
              src={service.photo_url}
              alt={service.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center">
            <Scissors className="w-8 h-8 text-white" />
          </div>
        )}

        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm">
                  {service.name}
                </p>
                {service.special_offer && service.offer_type && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-300">
                    <Sparkles className="w-3 h-3 mr-1" />
                    -{service.special_offer}{service.offer_type === 'percentage' ? '%' : '€'}
                  </span>
                )}
              </div>

              {service.service_type && (
                <p className="text-xs text-gray-500 mt-0.5">{service.service_type}</p>
              )}

              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                <Clock className="w-3 h-3" />
                <span>{service.duration} min</span>
              </div>
            </div>

            <div className="text-right">
              {service.special_offer && service.offer_type && (
                <div className="text-xs text-gray-400 line-through mb-0.5">
                  {service.price.toFixed(2)} €
                </div>
              )}
              <span className="font-bold text-rose-500 text-sm whitespace-nowrap">
                {finalPrice.toFixed(2)} €
              </span>
            </div>
          </div>

          {hasSupplements && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-rose-400" />
                Options disponibles:
              </p>
              <div className="space-y-1">
                {service.supplements!.map((supplement) => (
                  <div
                    key={supplement.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-600">+ {supplement.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{supplement.duration_minutes} min</span>
                      <span className="font-semibold text-rose-500">
                        +{supplement.price.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
