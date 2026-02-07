import { useState, useEffect, useRef } from 'react';
import { MapPin, Check, AlertCircle, Loader } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { geocodeAddress, GeocodeResult } from '../../lib/geocodingHelpers';
import 'leaflet/dist/leaflet.css';

function MapDebugger() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const size = map.getSize();

    console.log('🗺️ [AddressInput] MAP INIT', {
      containerWidth: container.offsetWidth,
      containerHeight: container.offsetHeight,
      mapWidth: size.x,
      mapHeight: size.y,
    });

    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.error('❌ [AddressInput] MAP ERROR: Container has 0 width or height!');
    }

    const tileErrorHandler = (e: any) => {
      console.error('❌ [AddressInput] TILE ERROR:', e.url);
    };

    map.on('tileerror', tileErrorHandler);

    return () => {
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
            setTimeout(forceResize, 100);
            return;
          }

          map.invalidateSize({ pan: false });

          setTimeout(() => {
            map.invalidateSize({ pan: false });
          }, 50);
        }, 0);
      });
    };

    forceResize();

    const handleResize = () => forceResize();
    const handleVisibility = () => {
      if (!document.hidden) {
        forceResize();
        setTimeout(forceResize, 200);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);

    const observer = new ResizeObserver(handleResize);
    const container = map.getContainer();
    if (container) {
      observer.observe(container);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  onGeocode: (result: GeocodeResult | null) => void;
  currentLocation: { latitude: number; longitude: number } | null;
  profilePhoto: string | null;
  error?: string | null;
  onErrorChange?: (error: string | null) => void;
}

const customIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function AddressInput({
  value,
  onChange,
  onGeocode,
  currentLocation,
  profilePhoto,
  error,
  onErrorChange,
}: AddressInputProps) {
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showMap && currentLocation) {
      setMapKey(prev => prev + 1);
    }
  }, [showMap, currentLocation]);

  useEffect(() => {
    if (!value || value.length < 3) {
      setGeocodingStatus('idle');
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      handleGeocodeAddress(value);
    }, 800);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value]);

  const handleGeocodeAddress = async (address: string) => {
    if (!address || address.length < 3) return;

    setGeocoding(true);
    setGeocodingStatus('idle');
    if (onErrorChange) onErrorChange(null);

    try {
      const result = await geocodeAddress(address);

      if (result) {
        setGeocodingStatus('success');
        onGeocode(result);
        setShowMap(true);
      } else {
        setGeocodingStatus('error');
        if (onErrorChange) {
          onErrorChange('Adresse introuvable. Essayez d\'ajouter la ville ou le code postal.');
        }
        onGeocode(null);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingStatus('error');
      if (onErrorChange) {
        onErrorChange('Erreur lors de la géolocalisation. Veuillez réessayer.');
      }
      onGeocode(null);
    } finally {
      setGeocoding(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    if (onErrorChange) onErrorChange(null);
    if (newValue.length < 3) {
      setGeocodingStatus('idle');
      setShowMap(false);
    }
  };

  const handleTestAddress = () => {
    if (value && value.length >= 3) {
      handleGeocodeAddress(value);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adresse
          {geocodingStatus === 'success' && (
            <span className="ml-2 inline-flex items-center gap-1 text-green-600 text-xs">
              <MapPin className="w-3 h-3" />
              Géolocalisée
            </span>
          )}
        </label>

        <div className="relative">
          <textarea
            value={value || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={() => {
              if (value && value.length >= 3 && geocodingStatus === 'idle') {
                handleGeocodeAddress(value);
              }
            }}
            rows={3}
            placeholder="Paris&#10;75011 Paris&#10;123 Rue de la République, 75001 Paris"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent ${
              error
                ? 'border-red-300'
                : geocodingStatus === 'success'
                ? 'border-green-300'
                : 'border-gray-300'
            }`}
          />

          <div className="absolute top-2 right-2 flex items-center gap-2">
            {geocoding && (
              <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <Loader className="w-3 h-3 animate-spin" />
                Géolocalisation...
              </div>
            )}
            {geocodingStatus === 'success' && !geocoding && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                <Check className="w-3 h-3" />
                OK
              </div>
            )}
            {geocodingStatus === 'error' && !geocoding && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <AlertCircle className="w-3 h-3" />
                Introuvable
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start justify-between mt-1">
          <p className="text-xs text-gray-500">
            Vous pouvez entrer une adresse partielle (ex: "Paris", "75011"). Le point sera approximatif.
          </p>
          <button
            type="button"
            onClick={handleTestAddress}
            disabled={geocoding || !value || value.length < 3}
            className="ml-2 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Tester
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {showMap && currentLocation && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Prévisualisation sur la carte
            </label>
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showMap ? 'Masquer' : 'Afficher'}
            </button>
          </div>

          {showMap && (
            <div className="h-64 rounded-lg overflow-hidden border border-gray-300 relative">
              <MapContainer
                key={`address-map-${mapKey}-${currentLocation.latitude}-${currentLocation.longitude}`}
                center={[currentLocation.latitude, currentLocation.longitude]}
                zoom={15}
                scrollWheelZoom={false}
                className="h-full w-full"
                style={{ height: '100%', width: '100%' }}
                whenReady={(map) => {
                  setTimeout(() => {
                    map.target.invalidateSize({ pan: false });
                  }, 100);
                }}
              >
                <MapDebugger />
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
                <Marker
                  position={[currentLocation.latitude, currentLocation.longitude]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="text-center p-2">
                      {profilePhoto && (
                        <img
                          src={profilePhoto}
                          alt="Profil"
                          className="w-12 h-12 rounded-full object-cover mx-auto mb-2 border-2 border-belleya-200"
                        />
                      )}
                      <p className="font-semibold text-gray-900 text-sm">Votre emplacement</p>
                      <p className="text-xs text-gray-600 mt-1">{value}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
