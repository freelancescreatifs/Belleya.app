import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Search, Navigation, Star, Calendar, Filter, ExternalLink } from 'lucide-react';
import L, { DivIcon } from 'leaflet';
import { supabase } from '../../lib/supabase';
import { ProviderProfile, getNearbyProviders } from '../../lib/socialHelpers';
import { getCurrentPosition, geocodeAddress } from '../../lib/geocodingHelpers';
import ProviderMapMarker from '../../components/client/ProviderMapMarker';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];
const DEFAULT_ZOOM = 13;

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const forceMapRedraw = () => {
      requestAnimationFrame(() => {
        map.invalidateSize({ animate: false, pan: false });
      });
    };

    const handleResize = () => {
      forceMapRedraw();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        forceMapRedraw();
      }
    };

    setTimeout(forceMapRedraw, 100);
    setTimeout(forceMapRedraw, 300);
    setTimeout(forceMapRedraw, 600);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [map]);

  return null;
}

export default function ClientMap() {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showGeolocationPrompt, setShowGeolocationPrompt] = useState(true);
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const createCustomIcon = (profilePhoto: string | null, companyName: string): DivIcon => {
    const photoHtml = profilePhoto
      ? `<img src="${profilePhoto}" alt="${companyName}" class="w-full h-full object-cover" />`
      : `<div class="w-full h-full bg-gradient-to-br from-brand-600 to-brand-100 flex items-center justify-center text-white font-bold text-lg">${companyName.charAt(0)}</div>`;

    return L.divIcon({
      className: 'custom-marker-icon',
      html: `
        <div class="relative">
          <div class="w-12 h-12 rounded-full border-3 border-white shadow-lg overflow-hidden ring-2 ring-brand-400 bg-white">
            ${photoHtml}
          </div>
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-brand-500 border-2 border-white rounded-full"></div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });
  };

  const customIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const userIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  useEffect(() => {
    setTimeout(() => setMapReady(true), 100);
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
      setUserLocation([position.latitude, position.longitude]);
      setMapCenter([position.latitude, position.longitude]);
      setMapZoom(14);
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
      const nearby = await getNearbyProviders(userLocation[0], userLocation[1], 50);

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
        const newLocation: [number, number] = [result.latitude, result.longitude];
        setUserLocation(newLocation);
        setMapCenter(newLocation);
        setMapZoom(13);
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

  const openInGoogleMaps = (provider: ProviderProfile) => {
    if (provider.latitude && provider.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${provider.latitude},${provider.longitude}`;
      window.open(url, '_blank');
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
    <div className="bg-gray-50 min-h-screen overflow-y-auto">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
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

      <div className="map-wrapper">
        {mapReady ? (
          <MapContainer
            key="map-container"
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            zoomControl={true}
            preferCanvas={false}
            style={{ height: '100%', width: '100%' }}
          >
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <MapResizeHandler />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
              subdomains={['a', 'b', 'c']}
              detectRetina={true}
              keepBuffer={2}
              updateWhenIdle={false}
              updateWhenZooming={true}
            />

            {userLocation && (
              <Marker position={userLocation} icon={userIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold text-blue-600">Vous êtes ici</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {filteredProviders.map((provider) => {
              if (!provider.latitude || !provider.longitude) return null;

              return (
                <Marker
                  key={provider.user_id}
                  position={[provider.latitude, provider.longitude]}
                  icon={createCustomIcon(provider.profile_photo, provider.company_name)}
                  eventHandlers={{
                    click: () => setSelectedProvider(provider),
                  }}
                >
                  <Popup>
                    <ProviderMapMarker
                      provider={provider}
                      onViewProfile={() => handleViewProfile(provider.user_id)}
                    />
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Chargement de la carte...</p>
            </div>
          </div>
        )}
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
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all"
              >
                <div className="flex gap-4">
                  <div
                    className="flex-shrink-0 cursor-pointer"
                    onClick={() => handleViewProfile(provider.user_id)}
                  >
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
                    <h3
                      className="font-bold text-gray-900 text-lg mb-1 cursor-pointer hover:text-brand-600"
                      onClick={() => handleViewProfile(provider.user_id)}
                    >
                      {provider.company_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {provider.activity_type || 'Professionnelle'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mb-3">
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

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewProfile(provider.user_id)}
                        className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
                      >
                        Voir le profil
                      </button>
                      <button
                        onClick={() => openInGoogleMaps(provider)}
                        className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Itinéraire
                      </button>
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
