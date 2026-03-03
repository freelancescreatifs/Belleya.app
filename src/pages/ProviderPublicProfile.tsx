import { useState, useEffect } from 'react';
import { Scissors, Image as ImageIcon, Star, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePublicProfile } from '../hooks/usePublicProfile';
import ProfileHeader from '../components/public-profile/ProfileHeader';
import ServiceCard from '../components/public-profile/ServiceCard';
import TimeSlotPicker from '../components/public-profile/TimeSlotPicker';
import BookingSummary from '../components/public-profile/BookingSummary';
import AuthGate from '../components/public-profile/AuthGate';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  photo_url?: string | null;
  service_type?: string;
  special_offer?: string | null;
  offer_type?: 'percentage' | 'fixed' | null;
  supplements?: Array<{
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  }>;
}

interface ClientPhoto {
  id: string;
  photo_url: string;
  service_name: string;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  client_name: string;
  created_at: string;
  photo_url: string | null;
}

type BookingStep = 'service' | 'datetime' | 'summary' | 'auth' | 'success';

export default function ProviderPublicProfile() {
  const pathname = window.location.pathname;
  const slug = pathname.replace('/profile/', '');
  const { user } = useAuth();
  const { loading, profile, error } = usePublicProfile(slug);

  const [activeTab, setActiveTab] = useState<'services' | 'gallery' | 'reviews' | 'institute'>('services');
  const [bookingStep, setBookingStep] = useState<BookingStep>('service');

  const [services, setServices] = useState<Service[]>([]);
  const [clientPhotos, setClientPhotos] = useState<ClientPhoto[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [creatingBooking, setCreatingBooking] = useState(false);

  useEffect(() => {
    if (profile) {
      loadServices();
      loadClientPhotos();
      loadReviews();
    }
  }, [profile]);

  async function loadServices() {
    if (!profile) return;

    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        supplements:service_supplements(id, name, duration_minutes, price)
      `)
      .eq('user_id', profile.userId)
      .eq('status', 'active')
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('name');

    if (!error && data) {
      setServices(data);
    }
  }

  async function loadClientPhotos() {
    if (!profile) return;

    const { data, error } = await supabase
      .from('client_results_photos')
      .select('id, photo_url, service_name, created_at')
      .eq('company_id', profile.companyId)
      .eq('show_in_gallery', true)
      .not('service_name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(12);

    if (!error && data) {
      setClientPhotos(data);
    }
  }

  async function loadReviews() {
    if (!profile) return;

    const { data, error } = await supabase
      .from('provider_reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        photo_url,
        client_id
      `)
      .eq('provider_id', profile.userId)
      .eq('is_visible', true)
      .eq('is_validated', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const reviewsWithNames = await Promise.all(
        data.map(async (review) => {
          const { data: clientData } = await supabase
            .from('clients')
            .select('first_name, last_name')
            .eq('id', review.client_id)
            .maybeSingle();

          const clientName = clientData
            ? `${clientData.first_name || ''} ${clientData.last_name || ''}`.trim()
            : 'Client anonyme';

          return {
            ...review,
            client_name: clientName || 'Client anonyme',
          };
        })
      );
      setReviews(reviewsWithNames);
    }
  }

  function handleSelectService(service: Service) {
    setSelectedService(service);
    setBookingStep('datetime');
  }

  function handleSelectTimeSlot(date: Date, time: string) {
    setSelectedDate(date);
    setSelectedTime(time);
    setBookingStep('summary');
  }

  function handleConfirmBooking() {
    if (user) {
      proceedWithBooking(user.id, '');
    } else {
      setBookingStep('auth');
    }
  }

  async function handleAuthenticated(userId: string, clientId: string) {
    await proceedWithBooking(userId, clientId);
  }

  async function proceedWithBooking(userId: string, clientId: string) {
    if (!selectedService || !selectedDate || !selectedTime || !profile) return;

    setCreatingBooking(true);

    try {
      if (!clientId) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', profile.userId)
          .eq('client_user_id', userId)
          .maybeSingle();

        if (existingClient) {
          clientId = existingClient.id;
        }
      }

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      const supplementsDuration = selectedSupplements.reduce((sum, suppId) => {
        const supp = selectedService.supplements?.find((s) => s.id === suppId);
        return sum + (supp?.duration_minutes || 0);
      }, 0);

      const totalDuration = selectedService.duration + supplementsDuration;
      const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60 * 1000);

      const serviceFinalPrice = selectedService.special_offer && selectedService.offer_type
        ? selectedService.offer_type === 'percentage'
          ? selectedService.price * (1 - parseFloat(selectedService.special_offer) / 100)
          : selectedService.price - parseFloat(selectedService.special_offer)
        : selectedService.price;

      const supplementsTotal = selectedSupplements.reduce((sum, suppId) => {
        const supp = selectedService.supplements?.find((s) => s.id === suppId);
        return sum + (supp?.price || 0);
      }, 0);

      const totalPrice = serviceFinalPrice + supplementsTotal;

      const { error: bookingError } = await supabase.from('booking_requests').insert({
        user_id: profile.userId,
        client_id: clientId || null,
        client_name: 'Client',
        client_email: '',
        service_name: selectedService.name,
        service_duration: totalDuration,
        service_price: totalPrice,
        requested_date: startDateTime.toISOString().split('T')[0],
        requested_time: selectedTime,
        status: 'pending',
        type: 'pro',
        source: 'public_booking',
        supplements: selectedSupplements.map((suppId) => {
          const supp = selectedService.supplements?.find((s) => s.id === suppId);
          return {
            id: suppId,
            name: supp?.name || '',
            price: supp?.price || 0,
            duration_minutes: supp?.duration_minutes || 0,
          };
        }),
      });

      if (bookingError) throw bookingError;

      setBookingStep('success');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Erreur lors de la création de la réservation');
    } finally {
      setCreatingBooking(false);
    }
  }

  function resetBooking() {
    setBookingStep('service');
    setSelectedService(null);
    setSelectedSupplements([]);
    setSelectedDate(null);
    setSelectedTime(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profil non trouvé</h2>
          <p className="text-gray-600 mb-6">{error || 'Ce profil n\'existe pas ou n\'est plus disponible.'}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <ProfileHeader
          companyName={profile.companyName}
          profilePhoto={profile.profilePhoto}
          bio={profile.bio}
          instagramUrl={profile.instagramUrl}
          address={profile.address}
          city={profile.city}
          averageRating={profile.averageRating}
          reviewsCount={profile.reviewsCount}
          followersCount={profile.followersCount}
          likesCount={profile.likesCount}
          photosCount={profile.photosCount}
        />

        <div className="bg-white border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 min-w-fit py-3 px-4 font-semibold transition-all ${
                activeTab === 'services'
                  ? 'text-rose-600 border-b-2 border-rose-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Scissors className="w-4 h-4" />
                <span>Services</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 min-w-fit py-3 px-4 font-semibold transition-all ${
                activeTab === 'gallery'
                  ? 'text-rose-600 border-b-2 border-rose-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>Galerie</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 min-w-fit py-3 px-4 font-semibold transition-all ${
                activeTab === 'reviews'
                  ? 'text-rose-600 border-b-2 border-rose-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Star className="w-4 h-4" />
                <span>Avis</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('institute')}
              className={`flex-1 min-w-fit py-3 px-4 font-semibold transition-all ${
                activeTab === 'institute'
                  ? 'text-rose-600 border-b-2 border-rose-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>Institut</span>
              </div>
            </button>
          </div>
        </div>

        <div className="p-6 bg-white rounded-b-xl">
          {activeTab === 'services' && (
            <div className="space-y-4">
              {services.length === 0 ? (
                <div className="text-center py-12">
                  <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun service disponible pour le moment</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Nos services</h3>
                  {services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onClick={() => handleSelectService(service)}
                      isSelected={selectedService?.id === service.id}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div>
              {clientPhotos.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune photo dans la galerie</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {clientPhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img
                        src={photo.photo_url}
                        alt={photo.service_name || 'Photo'}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      {photo.service_name && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white text-sm font-medium">{photo.service_name}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun avis pour le moment</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{review.client_name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
                    )}
                    {review.photo_url && (
                      <img
                        src={review.photo_url}
                        alt="Avis"
                        className="mt-3 w-full max-w-xs rounded-lg"
                        loading="lazy"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'institute' && (
            <div>
              {profile.institutePhotos.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune photo de l'institut</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {profile.institutePhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={photo.url}
                        alt="Institut"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {bookingStep !== 'service' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="my-8">
            {bookingStep === 'datetime' && selectedService && (
              <TimeSlotPicker
                providerId={profile.userId}
                serviceId={selectedService.id}
                serviceDuration={selectedService.duration}
                supplementsDuration={0}
                onSelectSlot={handleSelectTimeSlot}
                onClose={() => setBookingStep('service')}
              />
            )}

            {bookingStep === 'summary' && selectedService && selectedDate && selectedTime && (
              <BookingSummary
                service={selectedService}
                selectedSupplements={selectedService.supplements?.filter(s => selectedSupplements.includes(s.id)) || []}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onConfirm={handleConfirmBooking}
                onCancel={() => setBookingStep('service')}
              />
            )}

            {bookingStep === 'auth' && selectedService && selectedDate && selectedTime && (
              <AuthGate
                onAuthenticated={handleAuthenticated}
                bookingContext={{
                  service: selectedService,
                  selectedSupplements: selectedService.supplements?.filter(s => selectedSupplements.includes(s.id)) || [],
                  selectedDate,
                  selectedTime,
                }}
                providerId={profile.userId}
                companyId={profile.companyId}
              />
            )}

            {bookingStep === 'success' && (
              <div className="bg-white rounded-xl max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-belaya-bright" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Réservation envoyée !
                </h3>
                <p className="text-gray-600 mb-6">
                  Votre demande de réservation a été envoyée au prestataire. Vous recevrez une confirmation par email.
                </p>
                <button
                  onClick={resetBooking}
                  className="w-full px-6 py-3 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
