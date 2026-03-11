import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Navigation, Star, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ProviderProfile, getNearbyProviders } from '../../lib/socialHelpers';
import { getCurrentPosition, geocodeAddress } from '../../lib/geocodingHelpers';
import ProviderMapMarker from '../../components/client/ProviderMapMarker';
import CategoryChips from '../../components/client/CategoryChips';
import ToastContainer from '../../components/shared/ToastContainer';
import { useToast } from '../../hooks/useToast';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];
const DEFAULT_ZOOM = 11;

function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

function MapSizeHandler() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

function MapEventHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click: () => {
      onMapClick();
    }
  });
  return null;
}

export default function ClientMap() {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showGeolocationPrompt, setShowGeolocationPrompt] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toasts, dismissToast, success, error } = useToast();

  const userIcon = useMemo(() => L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-10 h-10 rounded-full bg-blue-500 border-4 border-white shadow-lg flex items-center justify-center">
          <div class="w-3 h-3 rounded-full bg-white"></div>
        </div>
      </div>
    `,
    className: 'custom-user-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  }), []);

  const createProviderIcon = (provider: ProviderProfile) => {
    const photoHtml = provider.profile_photo
      ? `<img src="${provider.profile_photo}" alt="${provider.company_name}" class="w-full h-full object-cover" />`
      : `<div class="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold text-lg">${provider.company_name.charAt(0)}</div>`;

    return L.divIcon({
      html: `
        <div class="relative transform transition-transform hover:scale-110">
          <div class="w-12 h-12 rounded-full border-3 border-white shadow-lg overflow-hidden ring-2 ring-gray-800 bg-white">
            ${photoHtml}
          </div>
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-800 border-2 border-white rounded-full"></div>
        </div>
      `,
      className: 'custom-provider-marker',
      iconSize: [48, 56],
      iconAnchor: [24, 56]
    });
  };

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
        error('Votre navigateur ne supporte pas la géolocalisation');
        return;
      }

      const permission = await navigator.permissions.query({ name: 'geolocation' });

      if (permission.state === 'denied') {
        error('La géolocalisation est bloquée');
        return;
      }

      const position = await getCurrentPosition();
      const newLocation = { lat: position.latitude, lng: position.longitude };
      setUserLocation(newLocation);
      setMapCenter([position.latitude, position.longitude]);
      setMapZoom(13);
      setShowGeolocationPrompt(false);
      success('Position activée');
    } catch (err: any) {
      console.error('Geolocation error:', err);

      if (err.code === 1) {
        error('Permission de géolocalisation refusée');
      } else if (err.code === 2) {
        error('Impossible d\'obtenir votre position');
      } else if (err.code === 3) {
        error('La demande de géolocalisation a expiré');
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
      const { data, error: fetchError } = await supabase
        .from('public_provider_profiles')
        .select('*')
        .not('profile_photo', 'is', null)
        .not('address', 'is', null)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (fetchError) throw fetchError;

      setProviders(data || []);
    } catch (err) {
      console.error('Error loading providers:', err);
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
        setMapCenter([result.latitude, result.longitude]);
        setMapZoom(13);
        setShowGeolocationPrompt(false);
        success('Adresse trouvée');
      } else {
        error('Adresse introuvable');
      }
    } catch (err) {
      console.error('Search error:', err);
      error('Erreur lors de la recherche');
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
    if (selectedCategory === 'all') {
      return providers;
    }
    return providers.filter((p) => p.activity_type === selectedCategory);
  }, [providers, selectedCategory]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(providers.map((p) => p.activity_type).filter(Boolean)));
    return unique.sort();
  }, [providers]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/30 to-white">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="bg-gradient-to-r from-brand-50 to-brand-100/50 border-b-2 border-brand-100 sticky top-0 z-[1000] shadow-md">
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <img
                src="/belaya_logo.png"
                alt="Belaya.app"
                className="h-10 w-auto"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-belaya-powder to-belaya-deep bg-clip-text text-transparent">
                Carte des pros
              </h1>
            </div>

            <button
              onClick={() => window.open('https://support.belaya.app', '_blank')}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border-2 border-brand-100"
              aria-label="Aide et support"
            >
              <HelpCircle className="w-5 h-5 text-belaya-medium" />
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">Aide</span>
            </button>
          </div>

          {showGeolocationPrompt && (
            <div className="mb-4 p-4 bg-white border-2 border-brand-100 rounded-xl shadow-md">
              <p className="text-sm text-gray-700 mb-3 font-medium">
                Activez la géolocalisation pour trouver les pros près de chez vous
              </p>
              <div className="flex gap-2">
                <button
                  onClick={requestGeolocation}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-belaya-powder to-belaya-bright text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all hover:scale-105"
                >
                  <Navigation className="w-4 h-4" />
                  Activer ma position
                </button>
              </div>
            </div>
          )}

          {!showGeolocationPrompt && userLocation && (
            <div className="mb-4 flex items-center justify-between p-3 bg-white border-2 border-belaya-powder rounded-xl shadow-md">
              <p className="text-sm text-belaya-deep flex items-center gap-2 font-medium">
                <MapPin className="w-4 h-4" />
                Position activée
              </p>
              <button
                onClick={requestGeolocation}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-belaya-powder to-belaya-bright text-white rounded-lg text-xs font-medium hover:shadow-lg transition-all"
              >
                <Navigation className="w-3 h-3" />
                Actualiser
              </button>
            </div>
          )}

          <form onSubmit={handleSearchAddress} className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-belaya-medium" />
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Entrer une ville ou adresse..."
              className="w-full pl-12 pr-24 py-3 bg-white border-2 border-brand-100 rounded-xl focus:ring-2 focus:ring-belaya-bright focus:border-belaya-bright shadow-sm text-sm sm:text-base"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-belaya-powder to-belaya-bright text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {searchLoading ? 'Recherche...' : 'OK'}
            </button>
          </form>

          <CategoryChips
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            totalCount={providers.length}
            filteredCount={filteredProviders.length}
          />
        </div>
      </div>

      <div className="relative z-0 w-full map-wrapper-client">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="leaflet-map-client"
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxZoom={20}
          />

          <MapViewController center={mapCenter} zoom={mapZoom} />
          <MapSizeHandler />
          <MapEventHandler onMapClick={() => setSelectedProvider(null)} />

          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userIcon}
            />
          )}

          {filteredProviders.map((provider) => {
            if (!provider.latitude || !provider.longitude) return null;

            return (
              <Marker
                key={provider.user_id}
                position={[provider.latitude, provider.longitude]}
                icon={createProviderIcon(provider)}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    setSelectedProvider(provider);
                  }
                }}
              >
                {selectedProvider?.user_id === provider.user_id && (
                  <Popup
                    closeButton={true}
                    onClose={() => setSelectedProvider(null)}
                    className="custom-popup"
                  >
                    <ProviderMapMarker
                      provider={provider}
                      onViewProfile={() => handleViewProfile(provider.user_id)}
                    />
                  </Popup>
                )}
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="p-4">
        <h2 className="text-lg font-bold bg-gradient-to-r from-belaya-powder to-belaya-deep bg-clip-text text-transparent mb-4">
          Pros à proximité
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-belaya-bright mx-auto mb-4"></div>
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
                className="bg-white rounded-xl shadow-md border-2 border-brand-100 p-4 hover:shadow-lg transition-all cursor-pointer hover:border-belaya-powder hover:-translate-y-1"
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
