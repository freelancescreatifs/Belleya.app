import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, Mail, ArrowLeft, Check, LogIn, UserPlus, Tag, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CalendarItem, Event } from '../types/agenda';
import { formatMonthYear, getDaysInMonth, getFirstDayOfMonth } from '../lib/calendarHelpers';
import { generateTimeSlots } from '../lib/availabilityHelpers';

interface PublicBookingProps {
  slug: string;
}

interface ProProfile {
  id: string;
  slug: string;
  business_name: string;
  profession: string;
  bio: string;
  is_accepting_bookings: boolean;
  user_id: string;
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
  supplements?: Supplement[];
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
  const [events, setEvents] = useState<Event[]>([]);
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingStep, setBookingStep] = useState<'service' | 'date' | 'time' | 'info' | 'success' | 'account'>('service');
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [wantsAccount, setWantsAccount] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);

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
    }
  }, [proProfile]);

  const loadProProfile = async () => {
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('user_id, company_name, is_accepting_bookings')
        .eq('booking_slug', slug)
        .maybeSingle();

      if (companyError || !companyData) {
        console.error('Error loading profile:', companyError);
        setLoading(false);
        return;
      }

      const { data: userProfileData } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('user_id', companyData.user_id)
        .maybeSingle();

      const fullName = userProfileData
        ? `${userProfileData.first_name} ${userProfileData.last_name}`.trim()
        : '';

      setProProfile({
        id: companyData.user_id,
        slug: slug,
        business_name: companyData.company_name,
        profession: fullName || 'Professionnelle',
        bio: '',
        user_id: companyData.user_id,
        is_accepting_bookings: companyData.is_accepting_bookings ?? true,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    if (!proProfile) return;

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', proProfile.user_id)
      .maybeSingle();

    if (!userProfile) return;

    const { data, error } = await supabase
      .from('services')
      .select('id, name, description, duration, price, special_offer, offer_type')
      .eq('user_id', userProfile.user_id)
      .eq('status', 'active')
      .order('name');

    if (!error && data) {
      const servicesWithSupplements = await Promise.all(
        data.map(async (service) => {
          const { data: supplements } = await supabase
            .from('service_supplements')
            .select('id, name, price, duration_minutes')
            .eq('service_id', service.id)
            .order('name');

          return {
            ...service,
            supplements: supplements || []
          };
        })
      );
      setServices(servicesWithSupplements);
    }
  };

  const loadEvents = async () => {
    if (!proProfile) return;

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', proProfile.user_id)
      .maybeSingle();

    if (!userProfile) return;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userProfile.user_id)
      .gte('start_at', new Date().toISOString())
      .order('start_at');

    if (!error && data) {
      setEvents(data as Event[]);
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
    setBookingStep('info');
  };

  const handleClientInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (wantsAccount && !clientInfo.password) {
      alert('Veuillez définir un mot de passe pour créer votre compte');
      return;
    }

    if (wantsAccount && clientInfo.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    handleSubmitBooking();
  };

  const handleSubmitBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedService || !proProfile) return;
    if (!clientInfo.firstName || !clientInfo.lastName || !clientInfo.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    try {
      if (wantsAccount && clientInfo.password) {
        try {
          await signUp(
            clientInfo.email,
            clientInfo.password,
            'client',
            clientInfo.firstName,
            clientInfo.lastName
          );
        } catch (error: any) {
          if (!error.message?.includes('already registered')) {
            throw error;
          }
        }
      }

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

      setBookingId(result.bookingId);
      setBookingStep('success');
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la réservation. Veuillez réessayer.');
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
              ? 'bg-belleya-500 text-white font-bold'
              : isToday
              ? 'bg-belleya-100 text-belleya-deep font-semibold'
              : isPast
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-belleya-50 text-gray-700'
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
            className="px-6 py-3 bg-belleya-500 text-white rounded-lg hover:bg-belleya-primary transition-colors"
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
            {proProfile.business_name} n'accepte pas de réservations en ligne pour le moment.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-belleya-500 text-white rounded-lg hover:bg-belleya-primary transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-rose-400 to-pink-500 p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">{proProfile.business_name}</h1>
            <p className="text-belleya-100 text-lg">{proProfile.profession}</p>
            {proProfile.bio && <p className="mt-4 text-belleya-50">{proProfile.bio}</p>}
          </div>
        </div>

        {bookingStep === 'success' ? (
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Réservation envoyée !</h2>
              <p className="text-gray-600 mb-8">
                Votre demande de réservation a été transmise à {proProfile.business_name}. Vous recevrez une
                confirmation par email à {clientInfo.email}.
              </p>

              {!user && (
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6 mb-6 border-2 border-belleya-200">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <UserPlus className="w-6 h-6 text-belleya-primary" />
                    <h3 className="text-lg font-bold text-gray-900">Créez votre compte Belleya</h3>
                  </div>
                  <p className="text-gray-700 text-sm mb-4">
                    Retrouvez tous vos rendez-vous et facilitez vos prochaines réservations
                  </p>

                  {!showAccountCreation ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowAccountCreation(true)}
                        className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg"
                      >
                        Créer mon compte
                      </button>
                      <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Plus tard
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleAccountCreation} className="space-y-4 text-left">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={clientInfo.email}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                        <input
                          type="password"
                          required
                          value={accountForm.password}
                          onChange={(e) => setAccountForm({ password: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
                          minLength={6}
                          placeholder="Minimum 6 caractères"
                        />
                      </div>

                      {authError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                          {authError}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAccountCreation(false)}
                          className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={authLoading}
                          className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50"
                        >
                          {authLoading ? 'Création...' : 'Créer'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {user && (
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-belleya-500 text-white rounded-lg hover:bg-belleya-primary transition-colors"
                >
                  Retour à mes rendez-vous
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
              <div
                className={`flex items-center gap-2 whitespace-nowrap ${
                  bookingStep === 'service' ? 'text-belleya-primary font-semibold' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    bookingStep === 'service' ? 'bg-belleya-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  1
                </div>
                Prestation
              </div>
              <div className="flex-1 h-1 bg-gray-200 min-w-[20px]" />
              <div
                className={`flex items-center gap-2 whitespace-nowrap ${
                  bookingStep === 'date' ? 'text-belleya-primary font-semibold' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    bookingStep === 'date' ? 'bg-belleya-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  2
                </div>
                Date
              </div>
              <div className="flex-1 h-1 bg-gray-200 min-w-[20px]" />
              <div
                className={`flex items-center gap-2 whitespace-nowrap ${
                  bookingStep === 'time' ? 'text-belleya-primary font-semibold' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    bookingStep === 'time' ? 'bg-belleya-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  3
                </div>
                Heure
              </div>
              <div className="flex-1 h-1 bg-gray-200 min-w-[20px]" />
              <div
                className={`flex items-center gap-2 whitespace-nowrap ${
                  bookingStep === 'info' ? 'text-belleya-primary font-semibold' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    bookingStep === 'info' ? 'bg-belleya-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  4
                </div>
                Vos infos
              </div>
            </div>

            {bookingStep === 'service' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Choisissez une prestation</h2>
                {services.length === 0 ? (
                  <p className="text-gray-600">Aucune prestation disponible pour le moment.</p>
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
                          className="p-6 border-2 border-gray-200 rounded-xl hover:border-belleya-500 hover:bg-belleya-50 transition-all text-left relative"
                        >
                          {hasOffer && (
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {service.offer_type === 'percentage'
                                ? `-${service.special_offer}%`
                                : `-${service.special_offer}€`
                              }
                            </div>
                          )}

                          <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-20">{service.name}</h3>
                          {service.description && <p className="text-gray-600 text-sm mb-3">{service.description}</p>}

                          {hasSupplements && (
                            <div className="mb-3 text-xs text-gray-500 flex items-center gap-1">
                              <Plus className="w-3 h-3" />
                              {service.supplements!.length} supplément{service.supplements!.length > 1 ? 's' : ''} disponible{service.supplements!.length > 1 ? 's' : ''}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-700">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {service.duration} min
                            </span>
                            <div className="flex items-center gap-2">
                              {hasOffer ? (
                                <>
                                  <span className="text-gray-400 line-through">{pricing.original.toFixed(2)} €</span>
                                  <span className="font-bold text-belleya-primary text-lg">{pricing.discounted!.toFixed(2)} €</span>
                                </>
                              ) : (
                                <span className="font-semibold text-belleya-primary">{pricing.original.toFixed(2)} €</span>
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
                <div className="bg-belleya-50 border border-belleya-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-900">{selectedService.name}</p>
                  <p className="text-sm text-gray-600">
                    {calculateTotalDuration()} min - {calculateTotalPrice().toFixed(2)} €
                  </p>
                </div>

                {selectedService.supplements && selectedService.supplements.length > 0 && (
                  <div className="mb-6 bg-white border-2 border-belleya-200 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-belleya-500" />
                      Suppléments disponibles
                    </h3>
                    <div className="space-y-3">
                      {selectedService.supplements.map((supplement) => (
                        <label
                          key={supplement.id}
                          className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-belleya-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSupplements.includes(supplement.id)}
                            onChange={() => toggleSupplement(supplement.id)}
                            className="mt-1 w-5 h-5 text-belleya-500 rounded focus:ring-2 focus:ring-belleya-primary"
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
                              <span className="font-semibold text-belleya-primary">+{Number(supplement.price).toFixed(2)} €</span>
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
                <div className="bg-belleya-50 border border-belleya-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-900">{selectedService.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {calculateTotalDuration()} min - {calculateTotalPrice().toFixed(2)} €
                  </p>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Choisissez une heure</h2>

                {weeklyAvailability && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                    <p className="text-sm text-blue-800">
                      Les horaires affichés correspondent aux heures d'ouverture du salon. Les créneaux grisés sont déjà réservés ou indisponibles.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3">
                  {getAvailableTimeSlots(selectedDate).map((slot) => (
                    <div key={slot.time} className="relative group">
                      <button
                        disabled={!slot.available}
                        onClick={() => handleTimeSelect(slot.time)}
                        className={`w-full p-3 rounded-lg font-medium transition-all ${
                          slot.available
                            ? 'bg-belleya-100 text-belleya-deep hover:bg-belleya-500 hover:text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title={
                          !slot.available && slot.reason === 'booked'
                            ? 'Créneau déjà réservé'
                            : !slot.available && slot.reason === 'closed'
                            ? 'Salon fermé'
                            : undefined
                        }
                      >
                        {slot.time}
                      </button>
                      {!slot.available && slot.reason && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {slot.reason === 'booked' && 'Créneau déjà réservé'}
                          {slot.reason === 'closed' && 'Salon fermé'}
                          {slot.reason === 'past' && 'Créneau passé'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bookingStep === 'info' && selectedDate && selectedService && selectedTime && (
              <div>
                <button
                  onClick={() => setBookingStep('time')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Changer d'heure
                </button>
                <div className="bg-belleya-50 border border-belleya-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-900 mb-2">{selectedService.name}</p>
                  {selectedSupplements.length > 0 && (
                    <div className="text-xs text-gray-600 mb-2 space-y-1">
                      {selectedSupplements.map(suppId => {
                        const supp = selectedService.supplements?.find(s => s.id === suppId);
                        return supp ? (
                          <div key={suppId} className="flex items-center gap-2">
                            <Plus className="w-3 h-3" />
                            <span>{supp.name} (+{Number(supp.price).toFixed(2)} €)</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {selectedTime}
                  </p>
                  <div className="mt-2 pt-2 border-t border-belleya-200 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total</span>
                    <span className="text-lg font-bold text-belleya-primary">{calculateTotalPrice().toFixed(2)} €</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Vos informations</h2>

                <form onSubmit={handleClientInfoSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={clientInfo.firstName}
                        onChange={(e) => setClientInfo({ ...clientInfo, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                      <input
                        type="text"
                        required
                        value={clientInfo.lastName}
                        onChange={(e) => setClientInfo({ ...clientInfo, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
                      placeholder="06 12 34 56 78"
                    />
                  </div>

                  {!user && (
                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-belleya-200 rounded-xl p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <input
                          type="checkbox"
                          id="wantsAccount"
                          checked={wantsAccount}
                          onChange={(e) => setWantsAccount(e.target.checked)}
                          className="mt-1 w-5 h-5 text-belleya-500 rounded focus:ring-2 focus:ring-belleya-primary"
                        />
                        <div className="flex-1">
                          <label htmlFor="wantsAccount" className="font-semibold text-gray-900 cursor-pointer">
                            Créer mon compte BelleYa
                          </label>
                          <p className="text-sm text-gray-600 mt-1">
                            Suivez vos rendez-vous, découvrez de nouvelles pros et gérez vos favoris facilement
                          </p>
                        </div>
                      </div>

                      {wantsAccount && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mot de passe *
                          </label>
                          <input
                            type="password"
                            required={wantsAccount}
                            value={clientInfo.password}
                            onChange={(e) => setClientInfo({ ...clientInfo, password: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
                            placeholder="Minimum 6 caractères"
                            minLength={6}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Vous pourrez vous connecter immédiatement après votre réservation
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optionnel)</label>
                    <textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
                      placeholder="Informations supplémentaires pour votre rendez-vous..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50"
                  >
                    {submitting ? 'Réservation en cours...' : 'Confirmer la réservation'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
