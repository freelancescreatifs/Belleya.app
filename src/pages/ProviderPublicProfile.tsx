import { useState, useEffect, useCallback } from 'react';
import { Scissors, Image as ImageIcon, Star, Check, AlertCircle, Trash2, ChevronDown, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePublicProfile } from '../hooks/usePublicProfile';
import ProfileHeader from '../components/public-profile/ProfileHeader';
import ServiceCard from '../components/public-profile/ServiceCard';
import TimeSlotPicker from '../components/public-profile/TimeSlotPicker';
import BookingSummary from '../components/public-profile/BookingSummary';
import AuthGate from '../components/public-profile/AuthGate';
import InstituteTabContent from '../components/public-profile/InstituteTabContent';

interface Service {
  id: string;
  name: string;
  description: string;
  category?: string;
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
  service_category: string | null;
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

const PHOTOS_PER_PAGE = 12;

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
  const [providerCategories, setProviderCategories] = useState<string[]>([]);

  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('all');
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState('all');
  const [photosDisplayCount, setPhotosDisplayCount] = useState(PHOTOS_PER_PAGE);
  const [totalPhotosCount, setTotalPhotosCount] = useState(0);
  const [loadingMorePhotos, setLoadingMorePhotos] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<ClientPhoto | null>(null);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [creatingBooking, setCreatingBooking] = useState(false);
  const isOwner = !!user && !!profile && user.id === profile.userId;

  useEffect(() => {
    if (profile) {
      loadServices();
      loadClientPhotos();
      loadReviews();
      loadCategories();
    }
  }, [profile]);

  async function loadCategories() {
    if (!profile) return;

    const { data: catData } = await supabase
      .from('service_categories')
      .select('name')
      .eq('user_id', profile.userId)
      .order('display_order')
      .order('name');

    if (catData && catData.length > 0) {
      setProviderCategories(catData.map(c => c.name));
      return;
    }

    const { data: serviceData } = await supabase
      .from('services')
      .select('category')
      .eq('user_id', profile.userId)
      .eq('status', 'active');

    if (serviceData) {
      const unique = [...new Set(serviceData.map(s => s.category).filter(Boolean))].sort();
      setProviderCategories(unique);
    }
  }

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

  const loadClientPhotos = useCallback(async () => {
    if (!profile) return;

    const { count } = await supabase
      .from('client_results_photos')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', profile.companyId)
      .eq('show_in_gallery', true);

    setTotalPhotosCount(count || 0);

    const { data, error } = await supabase
      .from('client_results_photos')
      .select('id, photo_url, service_name, service_category, created_at')
      .eq('company_id', profile.companyId)
      .eq('show_in_gallery', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClientPhotos(data);
    }
  }, [profile]);

  async function loadReviews() {
    if (!profile) return;

    const { data, error } = await supabase
      .from('provider_reviews')
      .select('id, rating, comment, created_at, photo_url, client_id')
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

          return { ...review, client_name: clientName || 'Client anonyme' };
        })
      );
      setReviews(reviewsWithNames);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm('Supprimer cette photo de la galerie ?')) return;

    const photo = clientPhotos.find(p => p.id === photoId);
    if (!photo) return;

    const { error } = await supabase
      .from('client_results_photos')
      .update({ show_in_gallery: false })
      .eq('id', photoId);

    if (!error) {
      setClientPhotos(prev => prev.filter(p => p.id !== photoId));
      setTotalPhotosCount(prev => prev - 1);
      if (previewPhoto?.id === photoId) setPreviewPhoto(null);
    }
  }

  const filteredGalleryPhotos = galleryCategoryFilter === 'all'
    ? clientPhotos
    : clientPhotos.filter(p => p.service_category === galleryCategoryFilter || p.service_name === galleryCategoryFilter);

  const displayedPhotos = filteredGalleryPhotos.slice(0, photosDisplayCount);
  const hasMorePhotos = filteredGalleryPhotos.length > photosDisplayCount;

  function handleShowMore() {
    setLoadingMorePhotos(true);
    setTimeout(() => {
      setPhotosDisplayCount(prev => prev + PHOTOS_PER_PAGE);
      setLoadingMorePhotos(false);
    }, 300);
  }

  const filteredServices = serviceCategoryFilter === 'all'
    ? services
    : services.filter(s => s.category === serviceCategoryFilter);

  const galleryCategories = [...new Set(
    clientPhotos
      .map(p => p.service_category || p.service_name)
      .filter(Boolean)
  )].sort();

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

  async function proceedWithBooking(userId: string, _clientId: string) {
    if (!selectedService || !selectedDate || !selectedTime || !profile) return;

    setCreatingBooking(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      const supplementsDuration = selectedSupplements.reduce((sum, suppId) => {
        const supp = selectedService.supplements?.find((s) => s.id === suppId);
        return sum + (supp?.duration_minutes || 0);
      }, 0);

      const totalDuration = selectedService.duration + supplementsDuration;

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

      const { error: bookingError } = await supabase.from('bookings').insert({
        client_id: userId,
        pro_id: profile.userId,
        service_id: selectedService.id,
        appointment_date: startDateTime.toISOString(),
        duration: totalDuration,
        price: totalPrice,
        status: 'pending',
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
      alert('Erreur lors de la creation de la reservation');
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profil non trouve</h2>
          <p className="text-gray-600 mb-6">{error || 'Ce profil n\'existe pas ou n\'est plus disponible.'}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors"
          >
            Retour a l'accueil
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
            {(['services', 'gallery', 'reviews', 'institute'] as const).map((tab) => {
              const icons = { services: Scissors, gallery: ImageIcon, reviews: Star, institute: ImageIcon };
              const labels = { services: 'Services', gallery: 'Galerie', reviews: 'Avis', institute: 'Institut' };
              const Icon = icons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-fit py-3 px-4 font-semibold transition-all ${
                    activeTab === tab
                      ? 'text-rose-600 border-b-2 border-rose-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{labels[tab]}</span>
                  </div>
                </button>
              );
            })}
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
                  {providerCategories.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                      <button
                        onClick={() => setServiceCategoryFilter('all')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                          serviceCategoryFilter === 'all'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Tous
                      </button>
                      {providerCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setServiceCategoryFilter(cat)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                            serviceCategoryFilter === cat
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Nos services
                    {serviceCategoryFilter !== 'all' && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({filteredServices.length})
                      </span>
                    )}
                  </h3>

                  {filteredServices.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Aucun service dans cette categorie</p>
                    </div>
                  ) : (
                    filteredServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        onClick={() => handleSelectService(service)}
                        isSelected={selectedService?.id === service.id}
                      />
                    ))
                  )}
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
                <>
                  {galleryCategories.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1">
                      <button
                        onClick={() => { setGalleryCategoryFilter('all'); setPhotosDisplayCount(PHOTOS_PER_PAGE); }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                          galleryCategoryFilter === 'all'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Toutes ({clientPhotos.length})
                      </button>
                      {galleryCategories.map(cat => {
                        const count = clientPhotos.filter(p => p.service_category === cat || p.service_name === cat).length;
                        return (
                          <button
                            key={cat}
                            onClick={() => { setGalleryCategoryFilter(cat); setPhotosDisplayCount(PHOTOS_PER_PAGE); }}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                              galleryCategoryFilter === cat
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {cat} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {displayedPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                        onClick={() => setPreviewPhoto(photo)}
                      >
                        <img
                          src={photo.photo_url}
                          alt={photo.service_name || 'Photo'}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-sm font-medium">{photo.service_name || ''}</p>
                        </div>
                        {isOwner && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Retirer de la galerie"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {hasMorePhotos && (
                    <div className="text-center mt-6">
                      <button
                        onClick={handleShowMore}
                        disabled={loadingMorePhotos}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
                      >
                        {loadingMorePhotos ? (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        Voir plus
                      </button>
                    </div>
                  )}

                  {filteredGalleryPhotos.length === 0 && galleryCategoryFilter !== 'all' && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Aucune photo dans cette categorie</p>
                    </div>
                  )}
                </>
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
            <InstituteTabContent
              institutePhotos={profile.institutePhotos}
              diplomas={profile.diplomas}
              conditions={profile.conditions}
              welcomeMessage={profile.welcomeMessage}
              bookingInstructions={profile.bookingInstructions}
              cancellationPolicy={profile.cancellationPolicy}
            />
          )}
        </div>
      </div>

      {previewPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={previewPhoto.photo_url}
              alt={previewPhoto.service_name || 'Photo'}
              className="w-full h-full object-contain rounded-lg"
            />
            {previewPhoto.service_name && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
                <p className="text-white font-medium">{previewPhoto.service_name}</p>
              </div>
            )}
            {isOwner && (
              <button
                onClick={() => handleDeletePhoto(previewPhoto.id)}
                className="absolute top-3 right-3 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Retirer
              </button>
            )}
          </div>
        </div>
      )}

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
                  Reservation envoyee !
                </h3>
                <p className="text-gray-600 mb-6">
                  Votre demande de reservation a ete envoyee au prestataire. Vous recevrez une confirmation par email.
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
