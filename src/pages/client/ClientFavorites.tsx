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
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
        <div className="bg-gradient-to-r from-brand-600 to-brand-50 text-white px-6 pt-12 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <img src="/belleyaa.png" alt="BelleYa" className="h-24 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mes favoris</h1>
        </div>
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <div className="bg-gradient-to-r from-brand-600 to-brand-50 text-white px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <img src="/belleyaa.png" alt="BelleYa" className="h-24 w-auto" />
        </div>
        <h1 className="text-2xl font-bold text-white">Mes favoris</h1>
        {providers.length > 0 && (
          <p className="text-white/90 text-sm mt-1">
            {providers.length} prestataire{providers.length > 1 ? 's' : ''} suivi{providers.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="px-4 -mt-6">
        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-600 to-brand-50 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Aucun prestataire suivi
            </h2>
            <p className="text-gray-500 max-w-md mb-6">
              Explorez la carte et suivez vos prestataires préférés pour les retrouver facilement ici.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => handleProviderClick(provider.booking_slug)}
                >
                  <div className="flex items-start gap-4">
                    {provider.profile_photo ? (
                      <img
                        src={provider.profile_photo}
                        alt={provider.company_name}
                        className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-2xl font-bold">
                          {provider.company_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {provider.company_name}
                      </h3>
                      {provider.profession && (
                        <p className="text-sm text-gray-600 mb-3">{provider.profession}</p>
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
                          <span className="font-medium text-gray-900">
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

                <div className="px-5 pb-5 flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProviderClick(provider.booking_slug);
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-50 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                  >
                    Voir le profil
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnfollow(provider.user_id);
                    }}
                    className="px-4 py-3 border-2 border-brand-200 text-brand-600 rounded-xl font-semibold hover:bg-brand-50 transition-all"
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
