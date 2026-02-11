import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Check,
  Tag,
  Plus,
  Star,
  Heart,
  Scissors,
  Image as ImageIcon,
  Sparkles,
  X,
  Upload,
  User,
  Mail,
  Phone as PhoneIcon,
  Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types/agenda';
import { formatMonthYear, getDaysInMonth, getFirstDayOfMonth } from '../lib/calendarHelpers';
import { generateTimeSlots } from '../lib/availabilityHelpers';
import {
  getProviderReviews,
  createReview,
  Review
} from '../lib/socialHelpers';

interface PublicBookingProps {
  slug: string;
}

interface ProProfile {
  user_id: string;
  slug: string;
  company_name: string;
  activity_type: string;
  bio: string;
  city: string;
  address: string | null;
  profile_photo: string | null;
  is_accepting_bookings: boolean;
  average_rating: number;
  reviews_count: number;
  followers_count: number;
  likesCount: number;
  photosCount: number;
  institute_photos: Array<{ id: string; url: string; order: number }>;
}

interface Supplement {
  id: string;
  name: string;
  price: number;
  duration_minutes: number | null;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  special_offer: string | null;
  offer_type: string | null;
  photo_url?: string | null;
  service_type?: string;
  supplements?: Supplement[];
}

interface ClientPhoto {
  id: string;
  photo_url: string;
  service_name: string;
  created_at: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface WeeklyAvailability {
  [key: string]: Array<{
    start: string;
    end: string;
    available: boolean;
  }>;
}

export default function PublicBooking({ slug }: PublicBookingProps) {
  const { user, signUp, signIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [proProfile, setProProfile] = useState<ProProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [photos, setPhotos] = useState<ClientPhoto[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'services' | 'gallery' | 'reviews' | 'institute'>('services');

  // Booking state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingStep, setBookingStep] = useState<'service' | 'date' | 'time' | 'account' | 'success'>('service');
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [bookingNotes, setBookingNotes] = useState('');

  // Client info & auth state
  const [clientInfo, setClientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [hasAccount, setHasAccount] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', photo: null as File | null });

  useEffect(() => {
    if (slug) {
      loadProProfile();
    }
  }, [slug]);

  useEffect(() => {
    if (proProfile) {
      loadServices();
      loadEvents();
      loadWeeklyAvailability();
      loadPhotos();
      loadReviews();
    }
  }, [proProfile]);

  const loadProProfile = async () => {
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('user_id, company_name, is_accepting_bookings, id, address, institute_photos')
        .eq('booking_slug', slug)
        .maybeSingle();

      if (companyError || !companyData) {
        console.error('Error loading profile:', companyError);
        setLoading(false);
        return;
      }

      const { data: providerData, error: providerError } = await supabase
        .from('public_provider_profiles')
        .select('*')
        .eq('user_id', companyData.user_id)
        .maybeSingle();

      if (providerError || !providerData) {
        console.error('Error loading provider:', providerError);
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

      setProProfile({
        ...providerData,
        slug: slug,
        is_accepting_bookings: companyData.is_accepting_bookings ?? true,
        address: companyData.address,
        likesCount: likesData?.length || 0,
        photosCount: photosCount || 0,
        institute_photos: Array.isArray(companyData.institute_photos) ? companyData.institute_photos : [],
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    if (!proProfile) return;

    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        supplements:service_supplements(id, name, price, duration_minutes)
      `)
      .eq('user_id', proProfile.user_id)
      .eq('status', 'active')
      .order('name');

    if (!error && data) {
      setServices(data);
    }
  };

  const loadPhotos = async () => {
    if (!proProfile) return;

    const { data: companyData } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', proProfile.user_id)
      .maybeSingle();

    if (!companyData) return;

    const { data, error } = await supabase
      .from('client_results_photos')
      .select('id, photo_url, service_name, created_at')
      .eq('company_id', companyData.id)
      .eq('show_in_gallery', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPhotos(data);
    }
  };

  const loadReviews = async () => {
    if (!proProfile) return;
    const reviewsData = await getProviderReviews(proProfile.user_id);
    setReviews(reviewsData);
  };

  const loadEvents = async () => {
    if (!proProfile) return;

    const { data, error } = await supabase
      .from('events')
      .select('start, end, type')
      .eq('user_id', proProfile.user_id)
      .gte('start', new Date().toISOString())
      .order('start');

    if (!error && data) {
      const formattedEvents = data.map(event => ({
        start_at: event.start,
        end_at: event.end,
        type: event.type
      }));
      setEvents(formattedEvents as Event[]);
    }
  };

  const loadWeeklyAvailability = async () => {
    if (!proProfile) return;

    const { data: companyData } = await supabase
      .from('company_profiles')
      .select('weekly_availability')
      .eq('user_id', proProfile.user_id)
      .maybeSingle();

    if (companyData?.weekly_availability) {
      setWeeklyAvailability(companyData.weekly_availability as WeeklyAvailability);
    }
  };

  const getAvailableTimeSlots = (date: Date): TimeSlot[] => {
    if (!selectedService) return [];
    return generateTimeSlots(date, selectedService.duration, weeklyAvailability, events);
  };

  const calculateServicePrice = (service: Service): { original: number; discounted: number | null } => {
    const basePrice = Number(service.price);

    if (!service.special_offer || !service.offer_type) {
      return { original: basePrice, discounted: null };
    }

    const offerValue = Number(service.special_offer);
    let discountedPrice = basePrice;

    if (service.offer_type === 'percentage') {
      discountedPrice = basePrice * (1 - offerValue / 100);
    } else if (service.offer_type === 'fixed') {
      discountedPrice = basePrice - offerValue;
    }

    return { original: basePrice, discounted: Math.max(0, discountedPrice) };
  };

  const calculateTotalPrice = (): number => {
    if (!selectedService) return 0;

    const servicePrice = calculateServicePrice(selectedService);
    const basePrice = servicePrice.discounted !== null ? servicePrice.discounted : servicePrice.original;

    const supplementsPrice = selectedSupplements.reduce((total, supplementId) => {
      const supplement = selectedService.supplements?.find(s => s.id === supplementId);
      return total + (supplement ? Number(supplement.price) : 0);
    }, 0);

    return basePrice + supplementsPrice;
  };

  const calculateTotalDuration = (): number => {
    if (!selectedService) return 0;

    const baseDuration = selectedService.duration;

    const supplementsDuration = selectedSupplements.reduce((total, supplementId) => {
      const supplement = selectedService.supplements?.find(s => s.id === supplementId);
      return total + (supplement?.duration_minutes || 0);
    }, 0);

    return baseDuration + supplementsDuration;
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedSupplements([]);
    setBookingStep('date');
    setActiveTab('services');
  };

  const toggleSupplement = (supplementId: string) => {
    setSelectedSupplements(prev =>
      prev.includes(supplementId)
        ? prev.filter(id => id !== supplementId)
        : [...prev, supplementId]
    );
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setBookingStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setBookingStep('account');
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (hasAccount) {
        await signIn(clientInfo.email, clientInfo.password);
      } else {
        if (clientInfo.password.length < 6) {
          setAuthError('Le mot de passe doit contenir au moins 6 caractères');
          setAuthLoading(false);
          return;
        }

        await signUp(
          clientInfo.email,
          clientInfo.password,
          'client',
          clientInfo.firstName,
          clientInfo.lastName
        );
      }

      await handleSubmitBooking();
    } catch (error: any) {
      if (hasAccount) {
        setAuthError('Email ou mot de passe incorrect');
      } else {
        if (error.message?.includes('already registered')) {
          setAuthError('Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.');
        } else {
          setAuthError('Erreur lors de la création du compte');
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedService || !proProfile) return;

    setSubmitting(true);

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, minutes, 0, 0);

      const selectedSupplementsData = selectedSupplements.map(suppId => {
        const supp = selectedService.supplements?.find(s => s.id === suppId);
        return supp ? {
          id: supp.id,
          name: supp.name,
          price: Number(supp.price),
          duration_minutes: supp.duration_minutes
        } : null;
      }).filter(Boolean);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-booking`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proSlug: slug,
          serviceId: selectedService.id,
          appointmentDate: appointmentDate.toISOString(),
          duration: calculateTotalDuration(),
          price: calculateTotalPrice(),
          notes: bookingNotes,
          supplements: selectedSupplementsData,
          clientInfo: {
            firstName: clientInfo.firstName,
            lastName: clientInfo.lastName,
            email: clientInfo.email,
            phone: clientInfo.phone,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erreur lors de la réservation');
      }

      setBookingStep('success');
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la réservation. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proProfile || !user) {
      alert('Vous devez être connecté pour laisser un avis');
      return;
    }

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
        await loadReviews();
        alert('Votre avis a été publié avec succès !');
      } else {
        alert(result.error || 'Erreur lors de la publication de l\'avis');
      }
    } catch (error) {
      alert('Erreur lors de la publication de l\'avis');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      const isSelected =
        selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();
      const isPast = date < today;

      days.push(
        <button
          key={day}
          type="button"
          disabled={isPast}
          onClick={() => handleDateSelect(date)}
          className={`h-12 flex items-center justify-center rounded-lg transition-all ${
            isSelected
              ? 'bg-rose-500 text-white font-bold'
              : isToday
              ? 'bg-rose-100 text-rose-900 font-semibold'
              : isPast
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-rose-50 text-gray-700'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!proProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profil introuvable</h1>
          <p className="text-gray-600 mb-6">Ce lien de réservation n'existe pas ou n'est plus actif.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!proProfile.is_accepting_bookings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Réservations fermées</h1>
          <p className="text-gray-600 mb-6">
            {proProfile.company_name} n'accepte pas de réservations en ligne pour le moment.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (bookingStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Réservation envoyée</h2>
            <p className="text-gray-600 mb-8">
              Votre demande de réservation a été transmise à {proProfile.company_name}. Vous recevrez une
              confirmation par email à {clientInfo.email}.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all font-medium"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Header Profile */}
      <div className="bg-gradient-to-r from-rose-400 to-pink-500 text-white">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {proProfile.profile_photo ? (
                <img
                  src={proProfile.profile_photo}
                  alt={proProfile.company_name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30 shadow-lg"
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
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span className="font-bold">{proProfile.average_rating.toFixed(1)}</span>
                    <span className="text-sm">({proProfile.reviews_count})</span>
                  </div>
                )}

                {proProfile.followers_count > 0 && (
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                    <Heart className="w-4 h-4" />
                    <span>{proProfile.followers_count} abonné{proProfile.followers_count > 1 ? 's' : ''}</span>
                  </div>
                )}

                {(proProfile.likesCount > 0 || proProfile.photosCount > 0) && (
                  <div className="flex items-center gap-1 text-xs text-white/90">
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {proProfile.likesCount > 0 && `${proProfile.likesCount} likes`}
                      {proProfile.likesCount > 0 && proProfile.photosCount > 0 && ' • '}
                      {proProfile.photosCount > 0 && `${proProfile.photosCount} photos`}
                    </span>
                  </div>
                )}
              </div>

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

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('services');
                if (bookingStep !== 'service' && bookingStep !== 'success') {
                  setBookingStep('service');
                  setSelectedService(null);
                  setSelectedDate(null);
                  setSelectedTime(null);
                }
              }}
              className={`flex-1 min-w-fit py-4 px-4 font-semibold transition-all ${
                activeTab === 'services'
                  ? 'text-rose-600 border-b-2 border-rose-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Scissors className="w-5 h-5" />
                <span>Services</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 min-w-fit py-4 px-4 font-semibold transition-all ${
                activeTab === 'gallery'
                  ? 'text-rose-600 border-b-2 border-rose-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <span>Galerie</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 min-w-fit py-4 px-4 font-semibold transition-all ${
                activeTab === 'reviews'
                  ? 'text-rose-600 border-b-2 border-rose-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Star className="w-5 h-5" />
                <span>Avis</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('institute')}
              className={`flex-1 min-w-fit py-4 px-4 font-semibold transition-all ${
                activeTab === 'institute'
                  ? 'text-rose-600 border-b-2 border-rose-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <span>Institut</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {activeTab === 'services' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {bookingStep === 'service' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Choisissez une prestation</h2>
                {services.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">Aucune prestation disponible pour le moment.</p>
                ) : (
                  <div className="grid gap-4">
                    {services.map((service) => {
                      const pricing = calculateServicePrice(service);
                      const hasOffer = pricing.discounted !== null;
                      const hasSupplements = service.supplements && service.supplements.length > 0;

                      return (
                        <button
                          key={service.id}
                          onClick={() => handleServiceSelect(service)}
                          className="border-2 border-gray-200 rounded-xl hover:border-rose-500 hover:bg-rose-50 transition-all text-left overflow-hidden relative"
                        >
                          {hasOffer && (
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-10">
                              <Sparkles className="w-3 h-3" />
                              {service.offer_type === 'percentage'
                                ? `-${service.special_offer}%`
                                : `-${service.special_offer}€`
                              }
                            </div>
                          )}

                          <div className="flex gap-3">
                            {service.photo_url ? (
                              <div className="w-24 h-24 flex-shrink-0">
                                <img
                                  src={service.photo_url}
                                  alt={service.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                                <Scissors className="w-10 h-10 text-rose-400" />
                              </div>
                            )}

                            <div className="flex-1 p-3 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h3>
                                  {service.service_type && <p className="text-xs text-gray-500 mb-2">{service.service_type}</p>}
                                  {service.description && <p className="text-gray-600 text-sm mb-2">{service.description}</p>}

                                  <div className="flex items-center gap-4 text-sm text-gray-700">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {service.duration} min
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  {hasOffer && (
                                    <div className="text-xs text-gray-400 line-through mb-0.5">
                                      {pricing.original.toFixed(2)} €
                                    </div>
                                  )}
                                  <span className="font-bold text-rose-500 text-sm whitespace-nowrap">
                                    {(hasOffer ? pricing.discounted! : pricing.original).toFixed(2)} €
                                  </span>
                                </div>
                              </div>

                              {hasSupplements && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-rose-400" />
                                    Options disponibles:
                                  </p>
                                  <div className="space-y-1">
                                    {service.supplements!.map((supplement) => (
                                      <div
                                        key={supplement.id}
                                        className="flex items-center justify-between text-xs"
                                      >
                                        <span className="text-gray-600">+ {supplement.name}</span>
                                        <div className="flex items-center gap-2">
                                          {supplement.duration_minutes && (
                                            <span className="text-gray-500">{supplement.duration_minutes} min</span>
                                          )}
                                          <span className="font-semibold text-rose-500">
                                            +{Number(supplement.price).toFixed(2)} €
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {bookingStep === 'date' && selectedService && (
              <div>
                <button
                  onClick={() => setBookingStep('service')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Changer de prestation
                </button>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-900">{selectedService.name}</p>
                  <p className="text-sm text-gray-600">
                    {calculateTotalDuration()} min - {calculateTotalPrice().toFixed(2)} €
                  </p>
                </div>

                {selectedService.supplements && selectedService.supplements.length > 0 && (
                  <div className="mb-6 bg-white border-2 border-rose-200 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-rose-500" />
                      Suppléments disponibles
                    </h3>
                    <div className="space-y-3">
                      {selectedService.supplements.map((supplement) => (
                        <label
                          key={supplement.id}
                          className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSupplements.includes(supplement.id)}
                            onChange={() => toggleSupplement(supplement.id)}
                            className="mt-1 w-5 h-5 text-rose-500 rounded focus:ring-2 focus:ring-rose-600"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{supplement.name}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              {supplement.duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  +{supplement.duration_minutes} min
                                </span>
                              )}
                              <span className="font-semibold text-rose-600">+{Number(supplement.price).toFixed(2)} €</span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-900 mb-6">Choisissez une date</h2>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() =>
                        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
                      }
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-semibold">{formatMonthYear(currentMonth)}</h3>
                    <button
                      onClick={() =>
                        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
                      }
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5 rotate-180" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-gray-600">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
                </div>
              </div>
            )}

            {bookingStep === 'time' && selectedDate && selectedService && (
              <div>
                <button
                  onClick={() => setBookingStep('date')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Changer de date
                </button>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-900">{selectedService.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {calculateTotalDuration()} min - {calculateTotalPrice().toFixed(2)} €
                  </p>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Choisissez une heure</h2>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {getAvailableTimeSlots(selectedDate).map((slot) => (
                    <div key={slot.time} className="relative group">
                      <button
                        disabled={!slot.available}
                        onClick={() => handleTimeSelect(slot.time)}
                        className={`w-full p-3 rounded-lg font-medium transition-all ${
                          slot.available
                            ? 'bg-rose-100 text-rose-900 hover:bg-rose-500 hover:text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {slot.time}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bookingStep === 'account' && selectedDate && selectedService && selectedTime && (
              <div>
                <button
                  onClick={() => setBookingStep('time')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Changer d'heure
                </button>

                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-900 mb-2">{selectedService.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {selectedTime}
                  </p>
                  <div className="mt-2 pt-2 border-t border-rose-200 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total</span>
                    <span className="text-lg font-bold text-rose-600">{calculateTotalPrice().toFixed(2)} €</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Inscription obligatoire</h3>
                  <p className="text-sm text-gray-700">
                    Pour valider votre rendez-vous, vous devez créer un compte ou vous connecter.
                  </p>
                </div>

                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setHasAccount(false)}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      !hasAccount
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Créer un compte
                  </button>
                  <button
                    onClick={() => setHasAccount(true)}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      hasAccount
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    J'ai un compte
                  </button>
                </div>

                <form onSubmit={handleAccountSubmit} className="space-y-4">
                  {!hasAccount && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4 inline mr-1" />
                          Prénom *
                        </label>
                        <input
                          type="text"
                          required
                          value={clientInfo.firstName}
                          onChange={(e) => setClientInfo({ ...clientInfo, firstName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-600 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4 inline mr-1" />
                          Nom *
                        </label>
                        <input
                          type="text"
                          required
                          value={clientInfo.lastName}
                          onChange={(e) => setClientInfo({ ...clientInfo, lastName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-600 focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                  </div>

                  {!hasAccount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <PhoneIcon className="w-4 h-4 inline mr-1" />
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={clientInfo.phone}
                        onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-600 focus:border-transparent"
                        placeholder="06 12 34 56 78"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      required
                      value={clientInfo.password}
                      onChange={(e) => setClientInfo({ ...clientInfo, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-600 focus:border-transparent"
                      placeholder="Minimum 6 caractères"
                      minLength={6}
                    />
                  </div>

                  {!hasAccount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optionnel)</label>
                      <textarea
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-600 focus:border-transparent"
                        placeholder="Informations supplémentaires..."
                      />
                    </div>
                  )}

                  {authError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                      {authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading || submitting}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50"
                  >
                    {authLoading || submitting
                      ? 'Validation en cours...'
                      : hasAccount
                      ? 'Se connecter et réserver'
                      : 'Créer mon compte et réserver'
                    }
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {photos.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune photo disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group aspect-square">
                    <img
                      src={photo.photo_url}
                      alt={photo.service_name || 'Photo'}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    {photo.service_name && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-xl">
                        <p className="text-white text-sm font-medium">{photo.service_name}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'institute' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {proProfile.institute_photos.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune photo de l'institut</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {proProfile.institute_photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden">
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

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            {user && (
              <div className="mb-6">
                {!showReviewForm ? (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="w-full py-3 border-2 border-rose-300 text-rose-600 rounded-xl font-semibold hover:bg-rose-50 transition-all"
                  >
                    Laisser un avis
                  </button>
                ) : (
                  <form onSubmit={handleSubmitReview} className="p-4 border-2 border-rose-300 rounded-xl">
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
                            <Star
                              className={`w-8 h-8 ${
                                star <= reviewForm.rating
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-gray-300'
                              }`}
                            />
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        placeholder="Partagez votre expérience..."
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Photo (optionnelle)</label>
                      <div className="flex items-center gap-4">
                        {reviewForm.photo ? (
                          <div className="relative">
                            <img
                              src={URL.createObjectURL(reviewForm.photo)}
                              alt="Preview"
                              className="w-24 h-24 object-cover rounded-lg border-2 border-rose-300"
                            />
                            <button
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, photo: null })}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-rose-50 transition-all">
                            <Upload className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">Ajouter une photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setReviewForm({ ...reviewForm, photo: file });
                                }
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
                        className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50"
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
                <p className="text-sm text-gray-500 mt-2">Soyez le premier à laisser un avis !</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{review.client_name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 mb-3">{review.comment}</p>
                    )}
                    {review.photo_url && (
                      <div className="mt-3">
                        <img
                          src={review.photo_url}
                          alt="Photo de l'avis"
                          className="w-full max-w-xs rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
