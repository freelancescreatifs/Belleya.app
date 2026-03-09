import { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, Heart, Scissors, Image as ImageIcon, Sparkles, Upload, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  ProviderProfile,
  followProvider,
  unfollowProvider,
  isFollowingProvider,
  getProviderReviews,
  createReview,
  Review,
} from '../../lib/socialHelpers';
import InstituteTabContent from '../../components/public-profile/InstituteTabContent';

interface ProviderProfilePageProps {
  slug: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  service_type: string;
  photo_url?: string | null;
  special_offer?: string | null;
  offer_type?: 'percentage' | 'fixed' | null;
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
  created_at: string;
  is_favorite: boolean;
}

export default function ProviderProfilePage({ slug }: ProviderProfilePageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [photos, setPhotos] = useState<ClientPhoto[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'gallery' | 'reviews' | 'institute'>('services');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', photo: null as File | null });
  const [submitting, setSubmitting] = useState(false);
  const [selectedSupplements, setSelectedSupplements] = useState<{ [serviceId: string]: string[] }>({});
  const [instituteData, setInstituteData] = useState({
    institute_photos: [] as Array<{ id: string; url: string; order: number }>,
    diplomas: [] as Array<{ id: string; name: string; year?: string }>,
    conditions: [] as Array<{ id: string; text: string }>,
    welcome_message: '',
    booking_instructions: '',
    cancellation_policy: '',
  });

  useEffect(() => {
    if (slug) {
      loadProviderProfile();
    }
  }, [slug]);

  useEffect(() => {
    if (provider && user) {
      checkFollowStatus();
    }
  }, [provider, user]);

  const loadProviderProfile = async () => {
    setLoading(true);
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('user_id, booking_slug, institute_photos, diplomas, conditions, welcome_message, booking_instructions, cancellation_policy')
        .eq('booking_slug', slug)
        .maybeSingle();

      if (companyError || !companyData) {
        console.error('Error loading company:', companyError);
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

      setProvider(providerData);
      setInstituteData({
        institute_photos: Array.isArray(companyData.institute_photos) ? companyData.institute_photos : [],
        diplomas: Array.isArray(companyData.diplomas) ? companyData.diplomas : [],
        conditions: Array.isArray(companyData.conditions) ? companyData.conditions : [],
        welcome_message: companyData.welcome_message || '',
        booking_instructions: companyData.booking_instructions || '',
        cancellation_policy: companyData.cancellation_policy || '',
      });
      await Promise.all([
        loadServices(companyData.user_id),
        loadPhotos(companyData.user_id),
        loadReviews(companyData.user_id),
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (userId: string) => {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        supplements:service_supplements(id, name, price, duration_minutes)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('name');

    if (!error && data) {
      setServices(data);
    }
  };

  const loadPhotos = async (userId: string) => {
    const { data: companyData } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!companyData) return;

    const { data, error } = await supabase
      .from('client_results_photos')
      .select('id, photo_url, service_name, created_at')
      .eq('company_id', companyData.id)
      .eq('show_in_gallery', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPhotos(data.map(p => ({ ...p, is_favorite: false })));
    }
  };

  const loadReviews = async (userId: string) => {
    const reviewsData = await getProviderReviews(userId);
    setReviews(reviewsData);
  };

  const checkFollowStatus = async () => {
    if (!provider || !user) return;
    const following = await isFollowingProvider(provider.user_id);
    setIsFollowing(following);
  };

  const handleFollowToggle = async () => {
    if (!provider || !user) {
      alert('Vous devez être connecté pour suivre un prestataire');
      return;
    }

    if (isFollowing) {
      const result = await unfollowProvider(provider.user_id);
      if (result.success) {
        setIsFollowing(false);
      }
    } else {
      const result = await followProvider(provider.user_id);
      if (result.success) {
        setIsFollowing(true);
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !user) {
      alert('Vous devez être connecté pour laisser un avis');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createReview(
        provider.user_id,
        reviewForm.rating,
        reviewForm.comment,
        undefined,
        reviewForm.photo
      );

      if (result.success) {
        setShowReviewForm(false);
        setReviewForm({ rating: 5, comment: '', photo: null });
        await loadReviews(provider.user_id);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profil introuvable</h1>
          <p className="text-gray-600 mb-6">Ce profil n'existe pas ou n'est plus disponible.</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <div className="bg-gradient-to-r from-brand-600 to-brand-50 text-white">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {provider.profile_photo ? (
                <img
                  src={provider.profile_photo}
                  alt={provider.company_name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-white/30">
                  <span className="text-white font-bold text-3xl">
                    {provider.company_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{provider.company_name}</h1>
              <p className="text-lg mb-3 text-white font-medium">{provider.activity_type || 'Professionnelle'}</p>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                {provider.reviews_count > 0 && (
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span className="font-bold">{provider.average_rating.toFixed(1)}</span>
                    <span className="text-sm">({provider.reviews_count})</span>
                  </div>
                )}

                {provider.followers_count > 0 && (
                  <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-sm">
                    <Heart className="w-4 h-4" />
                    <span>{provider.followers_count} abonné{provider.followers_count > 1 ? 's' : ''}</span>
                  </div>
                )}

                {provider.city && (
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{provider.city}</span>
                  </div>
                )}
              </div>

              {provider.bio && (
                <p className="text-white mb-4">{provider.bio}</p>
              )}

              {user && (
                <button
                  onClick={handleFollowToggle}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                    isFollowing
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-white text-brand-600 hover:bg-brand-50'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
                  {isFollowing ? 'Abonné' : 'S\'abonner'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-t-2xl border-b border-gray-200 sticky top-0 z-10">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('services')}
              className={`flex-1 py-4 px-4 font-semibold transition-all ${
                activeTab === 'services'
                  ? 'text-brand-600 border-b-2 border-brand-600'
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
              className={`flex-1 py-4 px-4 font-semibold transition-all ${
                activeTab === 'gallery'
                  ? 'text-brand-600 border-b-2 border-brand-600'
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
              className={`flex-1 py-4 px-4 font-semibold transition-all ${
                activeTab === 'reviews'
                  ? 'text-brand-600 border-b-2 border-brand-600'
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
              className={`flex-1 py-4 px-4 font-semibold transition-all ${
                activeTab === 'institute'
                  ? 'text-brand-600 border-b-2 border-brand-600'
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

        <div className="bg-white rounded-b-2xl p-6 shadow-sm">
          {activeTab === 'services' && (
            <div>
              {services.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Aucune prestation disponible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => {
                    const calculatedPrice = service.special_offer && service.offer_type
                      ? service.offer_type === 'percentage'
                        ? service.price * (1 - parseFloat(service.special_offer) / 100)
                        : service.price - parseFloat(service.special_offer)
                      : service.price;

                    const selectedSupps = selectedSupplements[service.id] || [];
                    const totalSupplementPrice = service.supplements
                      ? service.supplements
                          .filter(s => selectedSupps.includes(s.id))
                          .reduce((sum, s) => sum + s.price, 0)
                      : 0;
                    const totalSupplementTime = service.supplements
                      ? service.supplements
                          .filter(s => selectedSupps.includes(s.id))
                          .reduce((sum, s) => sum + s.duration_minutes, 0)
                      : 0;

                    return (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:border-brand-300 hover:shadow-lg transition-all bg-white"
                      >
                        <div className="flex gap-3 p-4">
                          {service.photo_url ? (
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                              <img
                                src={service.photo_url}
                                alt={service.name}
                                className="w-full h-full object-cover"
                              />
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
                                      -{service.special_offer}{service.offer_type === 'percentage' ? '%' : '€'}
                                    </span>
                                  )}
                                </div>
                                {service.service_type && (
                                  <p className="text-xs text-gray-500">{service.service_type}</p>
                                )}
                              </div>

                              <div className="text-right">
                                {service.special_offer && service.offer_type && (
                                  <div className="text-xs text-gray-400 line-through">
                                    {service.price.toFixed(2)} €
                                  </div>
                                )}
                                <span className="font-bold text-brand-600 text-lg">
                                  {calculatedPrice.toFixed(2)} €
                                </span>
                              </div>
                            </div>

                            {service.description && (
                              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{service.description}</p>
                            )}

                            <p className="text-gray-500 text-xs mb-3">
                              {service.duration + totalSupplementTime} minutes
                            </p>

                            {service.supplements && service.supplements.length > 0 && (
                              <div className="border-t border-gray-100 pt-3 mt-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Options disponibles:</p>
                                <div className="space-y-2">
                                  {service.supplements.map((supplement) => (
                                    <label
                                      key={supplement.id}
                                      className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 cursor-pointer transition-all"
                                    >
                                      <div className="flex items-center gap-2 flex-1">
                                        <input
                                          type="checkbox"
                                          checked={selectedSupps.includes(supplement.id)}
                                          onChange={(e) => {
                                            const newSupps = e.target.checked
                                              ? [...selectedSupps, supplement.id]
                                              : selectedSupps.filter(id => id !== supplement.id);
                                            setSelectedSupplements({
                                              ...selectedSupplements,
                                              [service.id]: newSupps
                                            });
                                          }}
                                          className="w-4 h-4 text-brand-600 rounded focus:ring-2 focus:ring-brand-500"
                                        />
                                        <span className="text-sm text-gray-700">{supplement.name}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>{supplement.duration_minutes} min</span>
                                        <span className="font-semibold text-brand-600">+{supplement.price.toFixed(2)} €</span>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                                {selectedSupps.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                                    <span className="font-semibold text-gray-900">Total:</span>
                                    <span className="font-bold text-brand-600">
                                      {(calculatedPrice + totalSupplementPrice).toFixed(2)} €
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <a
                              href={`/book/${slug}`}
                              className="mt-4 w-full py-2.5 bg-gradient-to-r from-brand-600 to-brand-50 text-white rounded-lg font-semibold hover:from-brand-700 hover:to-brand-100 transition-all shadow-sm hover:shadow-md block text-center"
                            >
                              Réserver
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'gallery' && (
            <div>
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
                                className="w-24 h-24 object-cover rounded-lg border-2 border-brand-300"
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
                            <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all">
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

          {activeTab === 'institute' && (
            <div>
              <InstituteTabContent
                institutePhotos={instituteData.institute_photos}
                diplomas={instituteData.diplomas}
                conditions={instituteData.conditions}
                welcomeMessage={instituteData.welcome_message}
                bookingInstructions={instituteData.booking_instructions}
                cancellationPolicy={instituteData.cancellation_policy}
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
