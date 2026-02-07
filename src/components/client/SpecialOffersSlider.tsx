import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Star, Sparkles, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SpecialOffer {
  id: string;
  service_name: string;
  service_type: string;
  duration: number;
  price: number;
  special_offer: string;
  offer_type: 'percentage' | 'fixed';
  photo_url?: string;
  provider: {
    user_id: string;
    company_name: string;
    profile_photo?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    booking_slug?: string;
  };
  distance?: number;
}

interface SpecialOffersSliderProps {
  userLocation: { lat: number; lng: number } | null;
  onNavigateToMap: () => void;
}

const categories = [
  { id: 'all', label: 'Tout' },
  { id: 'nails', label: 'Ongles' },
  { id: 'hair', label: 'Cheveux' },
  { id: 'makeup', label: 'Maquillage' },
  { id: 'beauty', label: 'Beauté' },
];

export default function SpecialOffersSlider({ userLocation, onNavigateToMap }: SpecialOffersSliderProps) {
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSpecialOffers();
  }, [userLocation]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredOffers(offers);
    } else {
      setFilteredOffers(offers.filter(offer => offer.service_type === selectedCategory));
    }
  }, [selectedCategory, offers]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const loadSpecialOffers = async () => {
    setLoading(true);
    try {
      const { data: servicesData, error } = await supabase
        .from('services')
        .select(`
          id,
          name,
          service_type,
          duration,
          price,
          special_offer,
          offer_type,
          photo_url,
          user_id
        `)
        .not('special_offer', 'is', null)
        .eq('status', 'active');

      if (error) throw error;

      if (!servicesData || servicesData.length === 0) {
        setOffers([]);
        setLoading(false);
        return;
      }

      const offersWithProviders = await Promise.all(
        servicesData.map(async (service) => {
          const { data: providerData } = await supabase
            .from('company_profiles')
            .select('id, user_id, company_name, profile_photo, address, city, latitude, longitude, booking_slug')
            .eq('user_id', service.user_id)
            .maybeSingle();

          if (!providerData) return null;

          let distance: number | undefined;
          if (userLocation && providerData.latitude && providerData.longitude) {
            distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              providerData.latitude,
              providerData.longitude
            );
          }

          return {
            id: service.id,
            service_name: service.name,
            service_type: service.service_type,
            duration: service.duration,
            price: service.price,
            special_offer: service.special_offer,
            offer_type: service.offer_type,
            photo_url: service.photo_url,
            provider: {
              user_id: providerData.user_id,
              company_name: providerData.company_name,
              profile_photo: providerData.profile_photo,
              address: providerData.address,
              city: providerData.city,
              latitude: providerData.latitude,
              longitude: providerData.longitude,
              booking_slug: providerData.booking_slug,
            },
            distance,
          };
        })
      );

      const validOffers = offersWithProviders.filter((offer): offer is SpecialOffer => offer !== null);
      validOffers.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return 0;
      });

      setOffers(validOffers);
    } catch (error) {
      console.error('Error loading special offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 320;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const calculateDiscountedPrice = (offer: SpecialOffer): number => {
    if (offer.offer_type === 'percentage') {
      const percentage = parseFloat(offer.special_offer);
      return offer.price * (1 - percentage / 100);
    } else {
      const fixedDiscount = parseFloat(offer.special_offer);
      return offer.price - fixedDiscount;
    }
  };

  const handleOfferClick = (offer: SpecialOffer) => {
    if (offer.provider.booking_slug) {
      window.location.href = `/provider/${offer.provider.booking_slug}`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-bold text-gray-900">Offres exclusives</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Offres exclusives</h2>
            <p className="text-xs text-gray-500">Près de chez vous</p>
          </div>
        </div>
        <button
          onClick={onNavigateToMap}
          className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors"
        >
          Voir tout
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-brand-600 to-brand-100 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="relative">
        {filteredOffers.length > 1 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </>
        )}

        <div
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredOffers.length === 0 ? (
            <div className="w-full text-center py-8 text-gray-500">
              Aucune offre dans cette catégorie
            </div>
          ) : (
            filteredOffers.map((offer) => {
              const discountedPrice = calculateDiscountedPrice(offer);

              return (
                <div
                  key={offer.id}
                  onClick={() => handleOfferClick(offer)}
                  className="flex-shrink-0 w-72 bg-gradient-to-br from-white to-brand-50 rounded-xl border-2 border-brand-200 overflow-hidden hover:border-brand-400 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="relative">
                    {offer.photo_url ? (
                      <img
                        src={offer.photo_url}
                        alt={offer.service_name}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
                        <Tag className="w-12 h-12 text-white" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {offer.offer_type === 'percentage'
                          ? `-${offer.special_offer}%`
                          : `-${offer.special_offer}€`}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {offer.provider.profile_photo ? (
                        <img
                          src={offer.provider.profile_photo}
                          alt={offer.provider.company_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-100 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {offer.provider.company_name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate">
                          {offer.provider.company_name}
                        </h3>
                        {offer.distance !== undefined && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{offer.distance.toFixed(1)} km</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-gray-900 mb-2">{offer.service_name}</h4>

                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                      <Clock className="w-3 h-3" />
                      <span>{offer.duration} min</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-brand-100">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-gray-400 line-through">{offer.price.toFixed(2)}€</span>
                        <span className="text-xl font-bold text-brand-600">{discountedPrice.toFixed(2)}€</span>
                      </div>
                      <button className="px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg text-sm font-semibold hover:from-brand-600 hover:to-brand-600 transition-all shadow-sm">
                        Réserver
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
