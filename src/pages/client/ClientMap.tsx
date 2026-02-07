import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Search, Navigation, Star, Calendar, Filter, ExternalLink, AlertCircle } from 'lucide-react';
import L, { DivIcon } from 'leaflet';
import { supabase } from '../../lib/supabase';
import { ProviderProfile, getNearbyProviders } from '../../lib/socialHelpers';
import { getCurrentPosition, geocodeAddress } from '../../lib/geocodingHelpers';
import ProviderMapMarker from '../../components/client/ProviderMapMarker';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];
const DEFAULT_ZOOM = 13;
const TILE_ERROR_THRESHOLD = 5;
const FALLBACK_TIMEOUT_MS = 3000;

type MapMode = 'leaflet' | 'iframe' | 'loading';

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const forceMapRedraw = () => {
      requestAnimationFrame(() => {
        map.invalidateSize({ animate: false, pan: false });
      });
    };

    setTimeout(forceMapRedraw, 100);
    setTimeout(forceMapRedraw, 300);
    setTimeout(forceMapRedraw, 600);

    const handleResize = () => forceMapRedraw();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [map]);

  return null;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
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

  const [mapMode, setMapMode] = useState<MapMode>('loading');
  const tileErrorCount = useRef(0);
  const fallbackTimer = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedTile = useRef(false);

  const createCustomIcon = (profilePhoto: string | null, companyName: string): DivIcon => {
    const photoHtml = profilePhoto
      ? `<img src="${profilePhoto}" alt="${companyName}" class="w-full h-full object-cover" />`
      : `<div class="w-full h-full bg-gradient-to-br from-gray-600 to-gray-400 flex items-center justify-center text-white font-bold text-lg">${companyName.charAt(0)}</div>`;

    return L.divIcon({
      className: 'custom-marker-icon',
      html: `
        <div class="relative">
          <div class="w-12 h-12 rounded-full border-3 border-white shadow-lg overflow-hidden ring-2 ring-gray-400 bg-white">
            ${photoHtml}
          </div>
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-700 border-2 border-white rounded-full"></div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48],
    });
  };

  useEffect(() => {
    loadProviders();

    fallbackTimer.current = setTimeout(() => {
      if (!hasLoadedTile.current) {
        console.warn('[ClientMap] Timeout - Basculement sur iframe');
        setMapMode('iframe');
      }
    }, FALLBACK_TIMEOUT_MS);

    setTimeout(() => {
      if (mapMode === 'loading') {
        setMapMode('leaflet');
      }
    }, 100);

    return () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, []);

  const handleTileError = () => {
    tileErrorCount.current += 1;
    console.error(`[ClientMap] Tile error ${tileErrorCount.current}/${TILE_ERROR_THRESHOLD}`);

    if (tileErrorCount.current >= TILE_ERROR_THRESHOLD) {
      console.warn('[ClientMap] Trop d\'erreurs - Basculement sur iframe');
      setMapMode('iframe');
    }
  };

  const handleTileLoad = () => {
    hasLoadedTile.current = true;
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
  };

  const loadProviders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getNearbyProviders(DEFAULT_CENTER, 50);
      setProviders(data || []);
    } catch (error) {
      console.error('Erreur chargement providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestGeolocation = async () => {
    try {
      const position = await getCurrentPosition();
      setUserLocation(position);
      setMapCenter(position);
      setShowGeolocationPrompt(false);
    } catch (error) {
      console.error('Géolocalisation refusée:', error);
      setShowGeolocationPrompt(false);
    }
  };

  const handleSearch = async () => {
    if (!searchAddress.trim()) return;

    setSearchLoading(true);
    try {
      const coords = await geocodeAddress(searchAddress);
      if (coords) {
        setMapCenter(coords);
        setMapZoom(14);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const professions = useMemo(() => {
    const uniqueProfs = new Set(providers.map(p => p.profession).filter(Boolean));
    return Array.from(uniqueProfs).sort();
  }, [providers]);

  const filteredProviders = useMemo(() => {
    if (selectedProfession === 'all') return providers;
    return providers.filter(p => p.profession === selectedProfession);
  }, [providers, selectedProfession]);

  const generateIframeUrl = () => {
    const bbox = [
      mapCenter[1] - 0.05,
      mapCenter[0] - 0.05,
      mapCenter[1] + 0.05,
      mapCenter[0] + 0.05
    ].join(',');

    if (filteredProviders.length === 1) {
      const provider = filteredProviders[0];
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${provider.latitude},${provider.longitude}`;
    }

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
  };

  const generateFullMapUrl = () => {
    return `https://www.openstreetmap.org/#map=${mapZoom}/${mapCenter[0]}/${mapCenter[1]}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Carte des Professionnels</h1>
            <p className="text-gray-600 mt-1">Trouvez les meilleurs pros près de chez vous</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-gray-200 text-gray-900'
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
        </div>

        {showGeolocationPrompt && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Navigation className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">Activer la géolocalisation</h3>
              <p className="text-sm text-blue-700 mt-1">
                Trouvez les professionnels les plus proches de vous
              </p>
            </div>
            <button
              onClick={requestGeolocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Activer
            </button>
          </div>
        )}

        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Filtrer par métier</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedProfession('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedProfession === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              {professions.map((prof) => (
                <button
                  key={prof}
                  onClick={() => setSelectedProfession(prof)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedProfession === prof
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {prof}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une adresse..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {searchLoading ? 'Recherche...' : 'Chercher'}
            </button>
          </div>

          <div className="relative w-full h-[350px] md:h-[500px] rounded-lg overflow-hidden border border-gray-200">
            {mapMode === 'iframe' && (
              <div className="absolute inset-0 z-10">
                <iframe
                  src={generateIframeUrl()}
                  className="w-full h-full border-0"
                  loading="lazy"
                  title="Carte des professionnels"
                />
                <div className="absolute top-4 right-4 z-20">
                  <a
                    href={generateFullMapUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-lg text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir en plein écran
                  </a>
                </div>
              </div>
            )}

            {mapMode === 'leaflet' && (
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="w-full h-full z-0"
                zoomControl={true}
              >
                <MapUpdater center={mapCenter} zoom={mapZoom} />
                <MapResizeHandler />
                <TileLayer
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                  eventHandlers={{
                    tileerror: handleTileError,
                    tileload: handleTileLoad
                  }}
                />

                {userLocation && (
                  <Marker
                    position={userLocation}
                    icon={L.divIcon({
                      className: 'user-location-marker',
                      html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
                      iconSize: [16, 16],
                      iconAnchor: [8, 8],
                    })}
                  />
                )}

                {filteredProviders.map((provider) => (
                  <Marker
                    key={provider.user_id}
                    position={[provider.latitude, provider.longitude]}
                    icon={createCustomIcon(provider.profile_photo, provider.company_name)}
                    eventHandlers={{
                      click: () => setSelectedProvider(provider)
                    }}
                  >
                    <Popup>
                      <ProviderMapMarker provider={provider} />
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}

            {mapMode === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement de la carte...</p>
                </div>
              </div>
            )}
          </div>

          {mapMode === 'iframe' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Mode carte simplifié :</strong> La carte interactive n'a pas pu se charger (bloqueur ou restriction réseau). Version simplifiée affichée.
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Professionnels à proximité ({filteredProviders.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProviders.map((provider) => (
              <div
                key={provider.user_id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setMapCenter([provider.latitude, provider.longitude]);
                  setMapZoom(15);
                  setSelectedProvider(provider);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {provider.profile_photo ? (
                      <img
                        src={provider.profile_photo}
                        alt={provider.company_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-400 flex items-center justify-center text-white font-bold">
                        {provider.company_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{provider.company_name}</h3>
                    {provider.profession && (
                      <p className="text-sm text-gray-600">{provider.profession}</p>
                    )}
                    {provider.city && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {provider.city}
                      </p>
                    )}
                    {provider.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-900">{provider.rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">({provider.reviews_count} avis)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
