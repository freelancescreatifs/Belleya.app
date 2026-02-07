import { Star, MapPin } from 'lucide-react';
import { ProviderProfile } from '../../lib/socialHelpers';

interface ProviderMapMarkerProps {
  provider: ProviderProfile;
  onViewProfile: () => void;
}

export default function ProviderMapMarker({ provider, onViewProfile }: ProviderMapMarkerProps) {
  return (
    <div
      onClick={onViewProfile}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-4 w-72 border border-brand-300/30 animate-in fade-in zoom-in duration-200 cursor-pointer hover:shadow-brand-500/20 hover:shadow-xl transition-all hover:scale-105"
    >
      <div className="flex gap-3 mb-3">
        <div className="relative flex-shrink-0">
          {provider.profile_photo ? (
            <img
              src={provider.profile_photo}
              alt={provider.company_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-brand-400/50 ring-2 ring-brand-500/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-100 flex items-center justify-center border-2 border-brand-400/50 ring-2 ring-brand-500/20">
              <span className="text-white font-bold text-xl">
                {provider.company_name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm truncate">
            {provider.company_name}
          </h3>
          <p className="text-xs text-gray-300 truncate">
            {provider.activity_type || 'Professionnelle'}
          </p>

          {provider.distance !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-brand-400" />
              <span className="text-xs text-gray-200 font-medium">
                {provider.distance < 1
                  ? `${Math.round(provider.distance * 1000)} m`
                  : `${provider.distance.toFixed(1)} km`}
              </span>
            </div>
          )}
        </div>
      </div>

      {provider.reviews_count > 0 && (
        <div className="flex items-center gap-2 mb-3 px-2 py-1 bg-gray-700/50 rounded-lg border border-gray-600/50">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-white">
              {provider.average_rating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-gray-300">
            ({provider.reviews_count} avis)
          </span>
        </div>
      )}

      {provider.followers_count > 0 && (
        <p className="text-xs text-gray-300">
          {provider.followers_count} {provider.followers_count === 1 ? 'abonnée' : 'abonnées'}
        </p>
      )}
    </div>
  );
}
