import { useState, useEffect, useRef } from 'react';
import { MapPin, Check, AlertCircle, Loader } from 'lucide-react';
import Map, { Marker, Popup } from 'react-map-gl';
import { geocodeAddress, GeocodeResult } from '../../lib/geocodingHelpers';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  onGeocode: (result: GeocodeResult | null) => void;
  currentLocation: { latitude: number; longitude: number } | null;
  profilePhoto: string | null;
  error?: string | null;
  onErrorChange?: (error: string | null) => void;
}

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
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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
            <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
              <Map
                initialViewState={{
                  longitude: currentLocation.longitude,
                  latitude: currentLocation.latitude,
                  zoom: 15
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/light-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                scrollZoom={false}
                dragPan={true}
                dragRotate={false}
                touchZoomRotate={false}
              >
                <Marker
                  longitude={currentLocation.longitude}
                  latitude={currentLocation.latitude}
                  anchor="bottom"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-red-500 border-4 border-white shadow-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </Marker>

                <Popup
                  longitude={currentLocation.longitude}
                  latitude={currentLocation.latitude}
                  anchor="top"
                  offset={15}
                  closeButton={false}
                  closeOnClick={false}
                  className="map-preview-popup"
                >
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
              </Map>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
