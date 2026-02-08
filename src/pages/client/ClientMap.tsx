import { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import { MapPin, Search, Navigation, Star, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ProviderProfile, getNearbyProviders } from '../../lib/socialHelpers';
import { getCurrentPosition, geocodeAddress } from '../../lib/geocodingHelpers';
import ProviderMapMarker from '../../components/client/ProviderMapMarker';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const DEFAULT_CENTER: { lng: number; lat: number } = { lng: 2.3522, lat: 48.8566 };
const DEFAULT_ZOOM = 12;

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

export default function ClientMap() {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewState, setViewState] = useState<ViewState>({
    longitude: DEFAULT_CENTER.lng,
    latitude: DEFAULT_CENTER.lat,
    zoom: DEFAULT_ZOOM,
  });
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showGeolocationPrompt, setShowGeolocationPrompt] = useState(true);
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    requestGeolocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadProviders();
    } else {
      loadProvidersWithoutLocation();
    }
  }, [userLocation]);

  const requestGeolocation = async () => {
    try {
      if (!navigator.geolocation) {
        alert('Votre navigateur ne supporte pas la géolocalisation');
        return;
      }

      const permission = await navigator.permissions.query({ name: 'geolocation' });

      if (permission.state === 'denied') {
        alert('La géolocalisation est bloquée. Veuillez activer la géolocalisation dans les paramètres de votre navigateur.');
        return;
      }

      const position = await getCurrentPosition();
      const newLocation = { lat: position.latitude, lng: position.longitude };
      setUserLocation(newLocation);
      setViewState({
        longitude: position.longitude,
        latitude: position.latitude,
        zoom: 13,
      });
      setShowGeolocationPrompt(false);
    } catch (error: any) {
      console.error('Geolocation error:', error);

      if (error.code === 1) {
        alert('Permission de géolocalisation refusée. Veuillez autoriser l\'accès à votre position dans les paramètres de votre navigateur.');
      } else if (error.code === 2) {
        alert('Impossible d\'obtenir votre position. Vérifiez que les services de localisation sont activés.');
      } else if (error.code === 3) {
        alert('La demande de géolocalisation a expiré. Veuillez réessayer.');
      }

      setShowGeolocationPrompt(true);
    }
  };

  const loadProviders = async () => {
    if (!userLocation) return;

    setLoading(true);
    try {
      const nearby = await getNearbyProviders(userLocation.lat, userLocation.lng, 50);

      const eligibleProviders = nearby.filter(
        (p) =>
          p.profile_photo &&
          p.address &&
          p.latitude !== null &&
          p.longitude !== null
      );

      setProviders(eligibleProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProvidersWithoutLocation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('public_provider_profiles')
        .select('*')
        .not('profile_photo', 'is', null)
        .not('address', 'is', null)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAddress.trim()) return;

    setSearchLoading(true);
    try {
      const result = await geocodeAddress(searchAddress);
      if (result) {
        const newLocation = { lat: result.latitude, lng: result.longitude };
        setUserLocation(newLocation);
        setViewState({
          longitude: result.longitude,
          latitude: result.latitude,
          zoom: 13,
        });
        setShowGeolocationPrompt(false);
      } else {
        alert('Adresse introuvable. Veuillez réessayer avec une autre adresse.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleViewProfile = (providerId: string) => {
    const provider = providers.find((p) => p.user_id === providerId);
    if (provider?.booking_slug) {
      window.location.href = `/provider/${provider.booking_slug}`;
    }
  };

  const filteredProviders = useMemo(() => {
    if (selectedProfession === 'all') {
      return providers;
    }
    return providers.filter((p) => p.activity_type === selectedProfession);
  }, [providers, selectedProfession]);

  const professions = useMemo(() => {
    const unique = Array.from(new Set(providers.map((p) => p.activity_type).filter(Boolean)));
    return unique.sort();
  }, [providers]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-[1000]">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Carte des pros</h1>

          {showGeolocationPrompt && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800 mb-3">
                Activez la géolocalisation pour trouver les pros près de chez vous
              </p>
              <div className="flex gap-2">
                <button
                  onClick={requestGeolocation}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors active:bg-blue-800"
                >
                  <Navigation className="w-4 h-4" />
                  Activer ma position
                </button>
              </div>
            </div>
          )}

          {!showGeolocationPrompt && userLocation && (
            <div className="mb-4 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Position activée
              </p>
              <button
                onClick={requestGeolocation}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors active:bg-green-800"
              >
                <Navigation className="w-3 h-3" />
                Actualiser
              </button>
            </div>
          )}

          <form onSubmit={handleSearchAddress} className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Entrer une ville ou adresse..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {searchLoading ? 'Recherche...' : 'OK'}
            </button>
          </form>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres
            </button>
            <span className="text-sm text-gray-600">
              {filteredProviders.length} {filteredProviders.length === 1 ? 'pro' : 'pros'}
            </span>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Métier
              </label>
              <select
                value={selectedProfession}
                onChange={(e) => setSelectedProfession(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="all">Tous les métiers</option>
                {professions.map((profession) => (
                  <option key={profession} value={profession}>
                    {profession}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="h-[60dvh] min-h-[500px] max-h-[700px] relative z-0">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/light-v11"
          style={{ width: '100%', height: '100%' }}
          attributionControl={true}
        >
          <NavigationControl position="top-right" />
          <GeolocateControl
            position="top-right"
            trackUserLocation
            showUserHeading
            onGeolocate={(e) => {
              setUserLocation({ lat: e.coords.latitude, lng: e.coords.longitude });
            }}
          />

          {userLocation && (
            <Marker
              longitude={userLocation.lng}
              latitude={userLocation.lat}
              anchor="bottom"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-500 border-4 border-white shadow-lg flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                </div>
              </div>
            </Marker>
          )}

          {filteredProviders.map((provider) => {
            if (!provider.latitude || !provider.longitude) return null;

            return (
              <Marker
                key={provider.user_id}
                longitude={provider.longitude}
                latitude={provider.latitude}
                anchor="bottom"
              >
                <div
                  className="cursor-pointer transform transition-transform hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProvider(provider);
                  }}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-3 border-white shadow-lg overflow-hidden ring-2 ring-gray-800 bg-white">
                      {provider.profile_photo ? (
                        <img
                          src={provider.profile_photo}
                          alt={provider.company_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold text-lg">
                          {provider.company_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-800 border-2 border-white rounded-full"></div>
                  </div>
                </div>
              </Marker>
            );
          })}

          {selectedProvider && selectedProvider.latitude && selectedProvider.longitude && (
            <Popup
              longitude={selectedProvider.longitude}
              latitude={selectedProvider.latitude}
              anchor="bottom"
              offset={20}
              onClose={() => setSelectedProvider(null)}
              closeButton={true}
              closeOnClick={false}
              className="mapbox-popup-custom"
            >
              <ProviderMapMarker
                provider={selectedProvider}
                onViewProfile={() => handleViewProfile(selectedProvider.user_id)}
              />
            </Popup>
          )}
        </Map>
      </div>

      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Pros à proximité
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Aucune pro trouvée
            </h3>
            <p className="text-gray-600">
              Essayez d'élargir votre recherche ou de modifier les filtres
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProviders.map((provider) => (
              <div
                key={provider.user_id}
                onClick={() => handleViewProfile(provider.user_id)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer hover:border-gray-300"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {provider.profile_photo ? (
                      <img
                        src={provider.profile_photo}
                        alt={provider.company_name}
                        className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">
                          {provider.company_name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {provider.company_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {provider.activity_type || 'Professionnelle'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      {provider.distance !== undefined && (
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            {provider.distance < 1
                              ? `${Math.round(provider.distance * 1000)} m`
                              : `${provider.distance.toFixed(1)} km`}
                          </span>
                        </div>
                      )}

                      {provider.reviews_count > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span className="font-bold text-gray-900">
                            {provider.average_rating.toFixed(1)}
                          </span>
                          <span className="text-gray-600">
                            ({provider.reviews_count})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
