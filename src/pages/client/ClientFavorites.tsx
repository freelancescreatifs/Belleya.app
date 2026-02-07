import { useState, useEffect } from 'react';
import { Heart, MapPin, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Provider {
  id: string;
  user_id: string;
  company_name: string;
  profile_photo: string | null;
  profession: string | null;
  city: string | null;
  booking_slug: string | null;
  average_rating: number;
  review_count: number;
}

export default function ClientFavorites() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: followsData, error: followsError } = await supabase
        .from('provider_follows')
        .select('provider_id')
        .eq('client_id', user.id);

      if (followsError || !followsData || followsData.length === 0) {
        setLoading(false);
        return;
      }

      const providerUserIds = followsData.map(f => f.provider_id);

      const { data: providersData, error: providersError } = await supabase
        .from('public_provider_profiles')
        .select('*')
        .in('user_id', providerUserIds);

      if (!providersError && providersData) {
        setProviders(providersData);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderClick = (bookingSlug: string | null) => {
    if (bookingSlug) {
      window.location.href = `/provider/${bookingSlug}`;
    }
  };

  const handleUnfollow = async (providerId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('provider_follows')
        .delete()
        .eq('client_id', user.id)
        .eq('provider_id', providerId);

      if (!error) {
        setProviders(providers.filter(p => p.user_id !== providerId));
      }
    } catch (error) {
      console.error('Error unfollowing provider:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 pt-6 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">Mes favoris</h1>
          </div>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Mes favoris</h1>
          {providers.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {providers.length} prestataire{providers.length > 1 ? 's' : ''} suivi{providers.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[60vh]">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Aucun prestataire suivi
          </h2>
          <p className="text-gray-500 max-w-md">
            Explorez la carte et suivez vos prestataires préférés pour les retrouver facilement ici.
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => handleProviderClick(provider.booking_slug)}
              >
                <div className="flex items-start gap-4">
                  {provider.profile_photo ? (
                    <img
                      src={provider.profile_photo}
                      alt={provider.company_name}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-100 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xl font-bold">
                        {provider.company_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                      {provider.company_name}
                    </h3>
                    {provider.profession && (
                      <p className="text-sm text-gray-600 mb-2">{provider.profession}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {provider.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{provider.city}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>
                          {provider.average_rating > 0
                            ? provider.average_rating.toFixed(1)
                            : 'Nouveau'}
                        </span>
                        {provider.review_count > 0 && (
                          <span className="text-gray-400">
                            ({provider.review_count})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProviderClick(provider.booking_slug);
                  }}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
                >
                  Voir le profil
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnfollow(provider.user_id);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
