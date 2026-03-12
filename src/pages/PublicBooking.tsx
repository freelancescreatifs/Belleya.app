import { useState, useEffect } from 'react';
import {
  ArrowLeft, Star, MapPin, Heart, Scissors, Image as ImageIcon, Sparkles,
  Upload, X, ChevronDown, Clock, Check, Plus, Instagram
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  getProviderReviews,
  createReview,
  Review,
} from '../lib/socialHelpers';
import InstituteTabContent from '../components/public-profile/InstituteTabContent';
import TimeSlotPicker from '../components/public-profile/TimeSlotPicker';
import BookingSummary from '../components/public-profile/BookingSummary';
import AuthGate from '../components/public-profile/AuthGate';
import QuoteRequestModal from '../components/public-profile/QuoteRequestModal';
import DepositPayment from '../components/client/DepositPayment';

interface PublicBookingProps {
  slug: string;
}

interface ProProfile {
  user_id: string;
  slug: string;
  company_name: string;
  company_id: string;
  activity_type: string;
  bio: string;
  city: string;
  address: string | null;
  profile_photo: string | null;
  instagram_url: string | null;
  is_accepting_bookings: boolean;
  average_rating: number;
  reviews_count: number;
  followers_count: number;
  likesCount: number;
  photosCount: number;
  institute_photos: Array<{ id: string; url: string; order: number }>;
  diplomas: Array<{ id: string; name: string; year?: string }>;
  conditions: Array<{ id: string; text: string }>;
  welcome_message: string;
  booking_instructions: string;
  cancellation_policy: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  category?: string;
  duration: number;
  price: number;
  is_on_quote?: boolean;
  service_type?: string;
  photo_url?: string | null;
  special_offer?: string | null;
  offer_type?: 'percentage' | 'fixed' | null;
  has_questionnaire?: boolean;
  supplements?: Array<{
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
  }>;
}

interface ClientPhoto {
  id: string;
  photo_url: string;
  service_name: string;
  service_category: string | null;
  created_at: string;
}

type BookingStep = 'browse' | 'datetime' | 'summary' | 'auth' | 'deposit' | 'success' | 'quote' | 'quote_auth';

const PHOTOS_PER_PAGE = 12;

export default function PublicBooking({ slug }: PublicBookingProps) {
  const { user, profile: authProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [proProfile, setProProfile] = useState<ProProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [photos, setPhotos] = useState<ClientPhoto[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [providerCategories, setProviderCategories] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<'services' | 'gallery' | 'reviews' | 'institute'>('services');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('all');
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState('all');
  const [photosDisplayCount, setPhotosDisplayCount] = useState(PHOTOS_PER_PAGE);
  const [loadingMorePhotos, setLoadingMorePhotos] = useState(false);

  const [bookingStep, setBookingStep] = useState<BookingStep>('browse');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');

  const [depositSettings, setDepositSettings] = useState({
    deposit_required: false,
    deposit_amount: 0,
    deposit_fee_payer: 'provider' as 'provider' | 'client',
    stripe_available: false,
    paypal_available: false,
  });

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', photo: null as File | null });
  const [submitting, setSubmitting] = useState(false);

  const isClientLoggedIn = !!user && authProfile?.role === 'client';

  useEffect(() => {
    if (slug) loadProProfile();
  }, [slug]);

  const loadProProfile = async () => {
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('user_id, company_name, is_accepting_bookings, id, address, instagram_url, institute_photos, diplomas, conditions, welcome_message, booking_instructions, cancellation_policy, deposit_required, deposit_amount, deposit_fee_payer')
        .eq('booking_slug', slug)
        .maybeSingle();

      if (companyError || !companyData) {
        setLoading(false);
        return;
      }

      const { data: providerData, error: providerError } = await supabase
        .from('public_provider_profiles')
        .select('*')
        .eq('user_id', companyData.user_id)
        .maybeSingle();

      if (providerError || !providerData) {
        setLoading(false);
        return;
      }

      const { count: photosCount } = await supabase
        .from('client_results_photos')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyData.id)
        .eq('show_in_gallery', true);

      const { data: likesData } = await supabase
        .from('content_likes')
        .select('id')
        .eq('content_type', 'client_photo');

      if (companyData.deposit_required && companyData.deposit_amount) {
        const { data: paymentAccounts } = await supabase
          .from('provider_payment_accounts')
          .select('provider, status, charges_enabled')
          .eq('company_id', companyData.id)
          .eq('status', 'active');

        const stripeActive = paymentAccounts?.some(a => a.provider === 'stripe' && a.charges_enabled) ?? false;
        const paypalActive = paymentAccounts?.some(a => a.provider === 'paypal' && a.charges_enabled) ?? false;

        setDepositSettings({
          deposit_required: true,
          deposit_amount: companyData.deposit_amount,
          deposit_fee_payer: companyData.deposit_fee_payer || 'provider',
          stripe_available: stripeActive,
          paypal_available: paypalActive,
        });
      }

      const profile: ProProfile = {
        ...providerData,
        slug,
        company_id: companyData.id,
        is_accepting_bookings: companyData.is_accepting_bookings ?? true,
        address: companyData.address,
        instagram_url: companyData.instagram_url || null,
        likesCount: likesData?.length || 0,
        photosCount: photosCount || 0,
        institute_photos: Array.isArray(companyData.institute_photos) ? companyData.institute_photos : [],
        diplomas: Array.isArray(companyData.diplomas) ? companyData.diplomas : [],
        conditions: Array.isArray(companyData.conditions) ? companyData.conditions : [],
        welcome_message: companyData.welcome_message || '',
        booking_instructions: companyData.booking_instructions || '',
        cancellation_policy: companyData.cancellation_policy || '',
      };

      setProProfile(profile);

      await Promise.all([
        loadServices(companyData.user_id),
        loadPhotos(companyData.id),
        loadReviews(companyData.user_id),
        loadProviderCategories(companyData.user_id),
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (userId: string) => {
    const [servicesRes, questionnairesRes] = await Promise.all([
      supabase
        .from('services')
        .select(`
          *,
          supplements:service_supplements(id, name, price, duration_minutes)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('name'),
      supabase
        .from('service_questionnaires')
        .select('service_id')
        .eq('user_id', userId)
        .eq('is_active', true),
    ]);

    if (!servicesRes.error && servicesRes.data) {
      const serviceIdsWithQ = new Set(
        (questionnairesRes.data || []).map((q: any) => q.service_id)
      );
      setServices(servicesRes.data.map((s: any) => ({
        ...s,
        has_questionnaire: serviceIdsWithQ.has(s.id),
      })));
    }
  };

  const loadProviderCategories = async (userId: string) => {
    const { data: catData } = await supabase
      .from('service_categories')
      .select('name')
      .eq('user_id', userId)
      .order('display_order')
      .order('name');

    if (catData && catData.length > 0) {
      setProviderCategories(catData.map(c => c.name));
      return;
    }

    const { data: serviceData } = await supabase
      .from('services')
      .select('category')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (serviceData) {
      const unique = [...new Set(serviceData.map(s => s.category).filter(Boolean))].sort();
      setProviderCategories(unique);
    }
  };

  const loadPhotos = async (companyId: string) => {
    const { data, error } = await supabase
      .from('client_results_photos')
      .select('id, photo_url, service_name, service_category, created_at')
      .eq('company_id', companyId)
      .eq('show_in_gallery', true)
      .order('created_at', { ascending: false });

    if (!error && data) setPhotos(data);
  };

  const loadReviews = async (userId: string) => {
    const reviewsData = await getProviderReviews(userId);
    setReviews(reviewsData);
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setSelectedSupplements([]);
    if (service.is_on_quote || service.has_questionnaire) {
      if (isClientLoggedIn) {
        setBookingStep('quote');
      } else {
        setBookingStep('quote_auth');
      }
    } else {
      setBookingStep('datetime');
    }
  };

  const handleSelectTimeSlot = (date: Date, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setBookingStep('summary');
  };

  const handleConfirmBooking = () => {
    if (isClientLoggedIn) {
      proceedWithBooking(user!.id, '');
    } else {
      setBookingStep('auth');
    }
  };

  const handleAuthenticated = async (userId: string, clientId: string) => {
    await proceedWithBooking(userId, clientId);
  };

  const proceedWithBooking = async (userId: string, clientId: string) => {
    if (!selectedService || !selectedDate || !selectedTime || !proProfile) return;

    setCreatingBooking(true);
    try {
      let userEmail = '';
      let userName = '';

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('email, first_name, last_name')
        .eq('user_id', userId)
        .maybeSingle();

      if (userProfile) {
        userEmail = userProfile.email || '';
        userName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
      }

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      const supplementsDuration = selectedSupplements.reduce((sum, suppId) => {
        const supp = selectedService.supplements?.find(s => s.id === suppId);
        return sum + (supp?.duration_minutes || 0);
      }, 0);
      const totalDuration = selectedService.duration + supplementsDuration;

      const serviceFinalPrice = selectedService.special_offer && selectedService.offer_type
        ? selectedService.offer_type === 'percentage'
          ? selectedService.price * (1 - parseFloat(selectedService.special_offer) / 100)
          : selectedService.price - parseFloat(selectedService.special_offer)
        : selectedService.price;

      const supplementsTotal = selectedSupplements.reduce((sum, suppId) => {
        const supp = selectedService.supplements?.find(s => s.id === suppId);
        return sum + (supp?.price || 0);
      }, 0);
      const totalPrice = serviceFinalPrice + supplementsTotal;

      const { data: booking, error: bookingError } = await supabase.from('bookings').insert({
        client_id: userId,
        pro_id: proProfile.user_id,
        service_id: selectedService.id,
        appointment_date: startDateTime.toISOString(),
        duration: totalDuration,
        price: totalPrice,
        status: 'pending',
        notes: `Reserv. par ${userName || 'Client'} (${userEmail})`,
        supplements: selectedSupplements.map(suppId => {
          const supp = selectedService.supplements?.find(s => s.id === suppId);
          return {
            id: suppId,
            name: supp?.name || '',
            price: supp?.price || 0,
            duration_minutes: supp?.duration_minutes || 0,
          };
        }),
      }).select('id').maybeSingle();

      if (bookingError) throw bookingError;

      setClientEmail(userEmail);
      setClientName(userName);

      const hasPaymentMethod = depositSettings.stripe_available || depositSettings.paypal_available;
      if (depositSettings.deposit_required && hasPaymentMethod && booking?.id) {
        setCreatedBookingId(booking.id);
        setBookingStep('deposit');
      } else {
        setBookingStep('success');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Erreur lors de la reservation. Veuillez reessayer.');
    } finally {
      setCreatingBooking(false);
    }
  };

  const resetBooking = () => {
    setBookingStep('browse');
    setSelectedService(null);
    setSelectedSupplements([]);
    setSelectedDate(null);
    setSelectedTime(null);
    setCreatedBookingId(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proProfile || !user) return;

    setSubmitting(true);
    try {
      const result = await createReview(
        proProfile.user_id,
        reviewForm.rating,
        reviewForm.comment,
        undefined,
        reviewForm.photo
      );

      if (result.success) {
        setShowReviewForm(false);
        setReviewForm({ rating: 5, comment: '', photo: null });
        await loadReviews(proProfile.user_id);
        alert('Votre avis a ete publie avec succes !');
      } else {
        alert(result.error || 'Erreur lors de la publication');
      }
    } catch {
      alert('Erreur lors de la publication');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!proProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profil introuvable</h1>
          <p className="text-gray-600 mb-6">Ce lien de reservation n'existe pas ou n'est plus actif.</p>
          <a href="/" className="inline-block px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
            Retour a l'accueil
          </a>
        </div>
      </div>
    );
  }

  if (!proProfile.is_accepting_bookings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reservations fermees</h1>
          <p className="text-gray-600 mb-6">
            {proProfile.company_name} n'accepte pas de reservations en ligne pour le moment.
          </p>
          <a href="/" className="inline-block px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
            Retour a l'accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <div className="bg-gradient-to-r from-brand-600 to-brand-50 text-white">
        <div className="container mx-auto px-4 py-6">
          <a
            href="/"
            className="relative z-10 inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </a>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {proProfile.profile_photo ? (
                <img
                  src={proProfile.profile_photo}
                  alt={proProfile.company_name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-white/30">
                  <span className="text-white font-bold text-3xl">
                    {proProfile.company_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{proProfile.company_name}</h1>
              {proProfile.activity_type && (
                <p className="text-lg mb-3 text-white font-medium">{proProfile.activity_type}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 mb-4">
                {proProfile.reviews_count > 0 && (
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span className="font-bold">{proProfile.average_rating.toFixed(1)}</span>
                    <span className="text-sm">({proProfile.reviews_count})</span>
                  </div>
                )}

                {proProfile.followers_count > 0 && (
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
                    <Heart className="w-4 h-4" />
                    <span>{proProfile.followers_count} abonne{proProfile.followers_count > 1 ? 's' : ''}</span>
                  </div>
                )}

                {proProfile.city && (
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{proProfile.city}</span>
                  </div>
                )}
              </div>

              {proProfile.instagram_url && (
                <a
                  href={proProfile.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-sm hover:bg-white/30 transition-colors mb-3"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{proProfile.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}</span>
                </a>
              )}

              {proProfile.bio && (
                <p className="text-white mb-3">{proProfile.bio}</p>
              )}

              {proProfile.address && (
                <div className="flex items-start gap-1 text-sm text-white/90">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{proProfile.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-t-2xl border-b border-gray-200 sticky top-0 z-10">
          <div className="flex gap-1">
            {(['services', 'gallery', 'reviews', 'institute'] as const).map(tab => {
              const icons = { services: Scissors, gallery: ImageIcon, reviews: Star, institute: ImageIcon };
              const labels = { services: 'Services', gallery: 'Galerie', reviews: 'Avis', institute: 'Institut' };
              const Icon = icons[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-4 font-semibold transition-all ${
                    activeTab === tab
                      ? 'text-brand-600 border-b-2 border-brand-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span>{labels[tab]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-b-2xl p-6 shadow-sm">
          {activeTab === 'services' && (
            <div>
              {services.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Aucune prestation disponible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {providerCategories.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                      <button
                        onClick={() => setServiceCategoryFilter('all')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                          serviceCategoryFilter === 'all'
                            ? 'bg-brand-600 text-white shadow-sm'
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
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                  {(serviceCategoryFilter === 'all' ? services : services.filter(s => s.category === serviceCategoryFilter)).map((service) => {
                    const calculatedPrice = service.special_offer && service.offer_type
                      ? service.offer_type === 'percentage'
                        ? service.price * (1 - parseFloat(service.special_offer) / 100)
                        : service.price - parseFloat(service.special_offer)
                      : service.price;

                    return (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:border-brand-300 hover:shadow-lg transition-all bg-white"
                      >
                        <div className="flex gap-3 p-4">
                          {service.photo_url ? (
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                              <img src={service.photo_url} alt={service.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-brand-100 to-brand-50 rounded-lg flex items-center justify-center">
                              <Scissors className="w-8 h-8 text-brand-300" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-gray-900">{service.name}</h3>
                                  {service.special_offer && service.offer_type && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-300 whitespace-nowrap">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                      -{service.special_offer}{service.offer_type === 'percentage' ? '%' : '\u20AC'}
                                    </span>
                                  )}
                                </div>
                                {service.service_type && (
                                  <p className="text-xs text-gray-500">{service.service_type}</p>
                                )}
                              </div>
                              <div className="text-right">
                                {service.is_on_quote ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">Sur devis</span>
                                ) : (
                                  <>
                                    {service.special_offer && service.offer_type && (
                                      <div className="text-xs text-gray-400 line-through">{service.price.toFixed(2)} €</div>
                                    )}
                                    <span className="font-bold text-brand-600 text-lg">{calculatedPrice.toFixed(2)} €</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {service.description && (
                              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{service.description}</p>
                            )}

                            <p className="text-gray-500 text-xs mb-3">
                              <Clock className="w-3 h-3 inline mr-1" />{service.duration} minutes
                            </p>

                            {service.supplements && service.supplements.length > 0 && (
                              <div className="border-t border-gray-100 pt-3 mt-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Options disponibles:</p>
                                <div className="space-y-1">
                                  {service.supplements.map((supplement) => (
                                    <div key={supplement.id} className="flex items-center justify-between text-xs">
                                      <span className="text-gray-600">+ {supplement.name}</span>
                                      <div className="flex items-center gap-2 text-gray-500">
                                        <span>{supplement.duration_minutes} min</span>
                                        <span className="font-semibold text-brand-600">+{supplement.price.toFixed(2)} €</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <button
                              onClick={() => handleSelectService(service)}
                              className="mt-4 w-full py-2.5 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md bg-gradient-to-r from-brand-600 to-brand-50 hover:from-brand-700 hover:to-brand-100"
                            >
                              {service.is_on_quote || service.has_questionnaire ? 'Demander un devis' : 'Reserver'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (() => {
            const galleryCategories = [...new Set(
              photos.map(p => p.service_category || p.service_name).filter(Boolean)
            )].sort();
            const filteredPhotos = galleryCategoryFilter === 'all'
              ? photos
              : photos.filter(p => p.service_category === galleryCategoryFilter || p.service_name === galleryCategoryFilter);
            const displayedPhotos = filteredPhotos.slice(0, photosDisplayCount);
            const hasMore = filteredPhotos.length > photosDisplayCount;

            return (
              <div>
                {photos.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucune photo disponible</p>
                  </div>
                ) : (
                  <>
                    {galleryCategories.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1">
                        <button
                          onClick={() => { setGalleryCategoryFilter('all'); setPhotosDisplayCount(PHOTOS_PER_PAGE); }}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                            galleryCategoryFilter === 'all'
                              ? 'bg-brand-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Toutes ({photos.length})
                        </button>
                        {galleryCategories.map(cat => {
                          const count = photos.filter(p => p.service_category === cat || p.service_name === cat).length;
                          return (
                            <button
                              key={cat}
                              onClick={() => { setGalleryCategoryFilter(cat); setPhotosDisplayCount(PHOTOS_PER_PAGE); }}
                              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                galleryCategoryFilter === cat
                                  ? 'bg-brand-600 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {cat} ({count})
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {displayedPhotos.map((photo) => (
                        <div key={photo.id} className="relative group aspect-square">
                          <img src={photo.photo_url} alt={photo.service_name || 'Photo'} className="w-full h-full object-cover rounded-xl" />
                          {photo.service_name && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-xl">
                              <p className="text-white text-sm font-medium">{photo.service_name}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {hasMore && (
                      <div className="text-center mt-6">
                        <button
                          onClick={() => {
                            setLoadingMorePhotos(true);
                            setTimeout(() => {
                              setPhotosDisplayCount(prev => prev + PHOTOS_PER_PAGE);
                              setLoadingMorePhotos(false);
                            }, 300);
                          }}
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

                    {filteredPhotos.length === 0 && galleryCategoryFilter !== 'all' && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Aucune photo dans cette categorie</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          {activeTab === 'reviews' && (
            <div>
              {user && (
                <div className="mb-6">
                  {!showReviewForm ? (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full py-3 border-2 border-brand-300 text-brand-600 rounded-xl font-semibold hover:bg-brand-50 transition-all"
                    >
                      Laisser un avis
                    </button>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="p-4 border-2 border-brand-300 rounded-xl">
                      <h3 className="font-bold text-gray-900 mb-4">Votre avis</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                              className="focus:outline-none"
                            >
                              <Star className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          placeholder="Partagez votre experience..."
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Photo (optionnelle)</label>
                        <div className="flex items-center gap-4">
                          {reviewForm.photo ? (
                            <div className="relative">
                              <img src={URL.createObjectURL(reviewForm.photo)} alt="Preview" className="w-24 h-24 object-cover rounded-lg border-2 border-brand-300" />
                              <button
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, photo: null })}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all">
                              <Upload className="w-5 h-5 text-gray-400" />
                              <span className="text-sm text-gray-600">Ajouter une photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setReviewForm({ ...reviewForm, photo: file });
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 py-2 bg-gradient-to-r from-brand-600 to-brand-50 text-white rounded-lg font-semibold hover:from-brand-700 hover:to-brand-100 transition-all disabled:opacity-50"
                        >
                          {submitting ? 'Publication...' : 'Publier'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun avis pour le moment</p>
                  <p className="text-sm text-gray-500 mt-2">Soyez le premier a laisser un avis !</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{review.client_name}</p>
                          <p className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-gray-700 mb-3">{review.comment}</p>}
                      {review.photo_url && (
                        <img src={review.photo_url} alt="Photo de l'avis" className="w-full max-w-xs rounded-lg border border-gray-200 mt-3" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'institute' && (
            <InstituteTabContent
              institutePhotos={proProfile.institute_photos}
              diplomas={proProfile.diplomas}
              conditions={proProfile.conditions}
              welcomeMessage={proProfile.welcome_message}
              bookingInstructions={proProfile.booking_instructions}
              cancellationPolicy={proProfile.cancellation_policy}
            />
          )}
        </div>
      </div>

      {bookingStep !== 'browse' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="my-8">
            {bookingStep === 'datetime' && selectedService && (
              <TimeSlotPicker
                providerId={proProfile.user_id}
                serviceId={selectedService.id}
                serviceDuration={selectedService.duration}
                supplementsDuration={selectedSupplements.reduce((sum, suppId) => {
                  const supp = selectedService.supplements?.find(s => s.id === suppId);
                  return sum + (supp?.duration_minutes || 0);
                }, 0)}
                onSelectSlot={handleSelectTimeSlot}
                onClose={resetBooking}
              />
            )}

            {bookingStep === 'summary' && selectedService && selectedDate && selectedTime && (
              <BookingSummary
                service={selectedService}
                selectedSupplements={selectedService.supplements?.filter(s => selectedSupplements.includes(s.id)) || []}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onConfirm={handleConfirmBooking}
                onCancel={resetBooking}
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
                providerId={proProfile.user_id}
                companyId={proProfile.company_id}
              />
            )}

            {bookingStep === 'quote_auth' && selectedService && (
              <AuthGate
                onAuthenticated={(userId) => {
                  setBookingStep('quote');
                }}
                bookingContext={{
                  service: selectedService,
                  selectedSupplements: [],
                  selectedDate: selectedDate || new Date(),
                  selectedTime: selectedTime || '09:00',
                }}
                providerId={proProfile.user_id}
                companyId={proProfile.company_id}
              />
            )}

            {bookingStep === 'quote' && selectedService && user && (
              <QuoteRequestModal
                service={selectedService}
                providerId={proProfile.user_id}
                companyId={proProfile.company_id}
                clientUserId={user.id}
                preferredDate={selectedDate}
                preferredTime={selectedTime}
                onSuccess={resetBooking}
                onClose={resetBooking}
              />
            )}

            {bookingStep === 'deposit' && createdBookingId && (
              <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
                <DepositPayment
                  bookingId={createdBookingId}
                  amount={depositSettings.deposit_amount}
                  companyName={proProfile.company_name}
                  serviceName={selectedService?.name || 'Service'}
                  clientEmail={clientEmail}
                  clientName={clientName}
                  stripeAvailable={depositSettings.stripe_available}
                  paypalAvailable={depositSettings.paypal_available}
                  feePayedByClient={depositSettings.deposit_fee_payer === 'client'}
                  onSuccess={() => setBookingStep('success')}
                  onCancel={() => setBookingStep('success')}
                />
              </div>
            )}

            {bookingStep === 'success' && (
              <div className="bg-white rounded-xl max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-belaya-bright" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Reservation envoyee !</h3>
                <p className="text-gray-600 mb-6">
                  Votre demande de reservation a ete envoyee a {proProfile.company_name}. Vous recevrez une confirmation par email.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={resetBooking}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Fermer
                  </button>
                  <a
                    href="/"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-50 text-white rounded-lg font-semibold hover:from-brand-700 hover:to-brand-100 transition-all text-center"
                  >
                    Accueil
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
