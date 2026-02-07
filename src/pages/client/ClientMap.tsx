import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Search, Navigation, Star, Calendar, Filter } from 'lucide-react';
import L, { DivIcon } from 'leaflet';
import { supabase } from '../../lib/supabase';
import { ProviderProfile, getNearbyProviders } from '../../lib/socialHelpers';
import { getCurrentPosition, geocodeAddress } from '../../lib/geocodingHelpers';
import ProviderMapMarker from '../../components/client/ProviderMapMarker';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];
const DEFAULT_ZOOM = 13;

function useContainerSize(ref: React.RefObject<HTMLDivElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const updateSize = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(ref.current);

    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, [ref]);

  return size;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

function MapDebugger() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const size = map.getSize();

    console.log('🗺️ MAP INIT', {
      containerWidth: container.offsetWidth,
      containerHeight: container.offsetHeight,
      mapWidth: size.x,
      mapHeight: size.y,
      center: map.getCenter(),
      zoom: map.getZoom(),
      tileLayerUrl: 'CARTO Light (no token needed)',
      timestamp: new Date().toISOString(),
    });

    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.error('❌ MAP ERROR: Container has 0 width or height!', {
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight,
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight,
      });
    }

    const tileLoadStartHandler = (e: any) => {
      console.log('🔄 Tile loading:', e.url);
    };

    const tileLoadHandler = (e: any) => {
      console.log('✅ Tile loaded:', e.url);
    };

    const tileErrorHandler = (e: any) => {
      console.error('❌ TILE ERROR:', {
        url: e.url,
        coords: e.coords,
        error: e.error,
        tile: e.tile,
      });

      fetch(e.url, { method: 'HEAD' })
        .then(response => {
          console.error('❌ Tile HTTP Status:', {
            url: e.url,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
          });
        })
        .catch(err => {
          console.error('❌ Tile fetch error:', err);
        });
    };

    map.on('tileloadstart', tileLoadStartHandler);
    map.on('tileload', tileLoadHandler);
    map.on('tileerror', tileErrorHandler);

    map.on('load', () => {
      console.log('✅ Map fully loaded');
    });

    map.on('zoomend', () => {
      console.log('🔍 Zoom changed:', map.getZoom());
    });

    map.on('moveend', () => {
      console.log('📍 Map moved:', map.getCenter());
    });

    return () => {
      map.off('tileloadstart', tileLoadStartHandler);
      map.off('tileload', tileLoadHandler);
      map.off('tileerror', tileErrorHandler);
    };
  }, [map]);

  return null;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const forceResize = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const container = map.getContainer();
          if (container.offsetWidth === 0 || container.offsetHeight === 0) {
            console.error('❌ Container still has 0 size, retrying...');
            setTimeout(forceResize, 100);
            return;
          }

          map.invalidateSize({ pan: false });

          setTimeout(() => {
            map.invalidateSize({ pan: false });
          }, 50);

          console.log('🔄 Map force resized:', {
            width: container.offsetWidth,
            height: container.offsetHeight,
          });
        }, 0);
      });
    };

    forceResize();

    const handleResize = () => forceResize();
    const handleOrientation = () => {
      setTimeout(forceResize, 100);
      setTimeout(forceResize, 300);
      setTimeout(forceResize, 600);
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        console.log('👁️ Page visible, force resizing...');
        forceResize();
        setTimeout(forceResize, 200);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientation);
    document.addEventListener('visibilitychange', handleVisibility);

    const observer = new ResizeObserver(handleResize);
    const container = map.getContainer();
    if (container) {
      observer.observe(container);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientation);
      document.removeEventListener('visibilitychange', handleVisibility);
      observer.disconnect();
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
  const [mapKey, setMapKey] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const containerSize = useContainerSize(mapContainerRef);

  const safeMapCenter: [number, number] = useMemo(() => {
    if (!mapCenter || mapCenter[0] === 0 || mapCenter[1] === 0) {
      return DEFAULT_CENTER;
    }
    return mapCenter;
  }, [mapCenter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerSize.width > 0 && containerSize.height > 0) {
        setMapKey(prev => prev + 1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [containerSize.width, containerSize.height]);

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

      <div
        ref={mapContainerRef}
        className="h-[60dvh] min-h-[500px] max-h-[700px] relative z-0"
        style={{
          height: containerSize.height > 0 ? `${containerSize.height}px` : '60dvh',
          minHeight: '500px',
          maxHeight: '700px'
        }}
      >
        {containerSize.width > 0 && containerSize.height > 0 && (
          <MapContainer
            key={`map-${mapKey}-${containerSize.width}-${containerSize.height}`}
            center={safeMapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            zoomControl={true}
            className="h-full w-full"
            style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}
            whenReady={(map) => {
              setTimeout(() => {
                map.target.invalidateSize({ pan: false });
              }, 100);
            }}
          >
            <MapDebugger />
            <MapUpdater center={safeMapCenter} zoom={mapZoom} />
            <MapResizer />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
              minZoom={3}
              keepBuffer={2}
              updateWhenIdle={false}
              updateWhenZooming={false}
              errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
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
        )}
        {(containerSize.width === 0 || containerSize.height === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement de la carte...</p>
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
