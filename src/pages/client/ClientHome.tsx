import { useState, useEffect } from 'react';
import { Calendar, MapPin, Star, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ProviderProfile, getNearbyProviders, getFollowedProviders } from '../../lib/socialHelpers';
import { getCurrentPosition } from '../../lib/geocodingHelpers';
import ProviderFeedCard from '../../components/client/ProviderFeedCard';
import ContentFeedCard from '../../components/client/ContentFeedCard';
import SpecialOffersSlider from '../../components/client/SpecialOffersSlider';

interface Booking {
  id: string;
  appointment_date: string;
  service: {
    name: string;
    duration: number;
  };
  pro: {
    business_name: string;
    profession: string;
    city: string;
  };
}

interface ClientHomeProps {
  onNavigateToMap: () => void;
}

export default function ClientHome({ onNavigateToMap }: ClientHomeProps) {
  const { user, profile } = useAuth();
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [forYouProviders, setForYouProviders] = useState<ProviderProfile[]>([]);
  const [followingProviders, setFollowingProviders] = useState<ProviderProfile[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [followingContent, setFollowingContent] = useState<any[]>([]);

  useEffect(() => {
    loadNextBooking();
    loadUserLocation();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'foryou' && userLocation) {
      loadForYouFeed();
    } else if (activeTab === 'following') {
      loadFollowingFeed();
    }
  }, [activeTab, userLocation]);

  const loadNextBooking = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        appointment_date,
        status,
        service_id,
        pro_id
      `)
      .eq('client_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .gte('appointment_date', new Date().toISOString())
      .order('appointment_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      setLoading(false);
      return;
    }

    const { data: serviceData } = await supabase
      .from('services')
      .select('name, duration')
      .eq('id', data.service_id)
      .maybeSingle();

    const { data: proData } = await supabase
      .from('company_profiles')
      .select('company_name, user_id')
      .eq('user_id', data.pro_id)
      .maybeSingle();

    if (serviceData && proData) {
      const formattedBooking: Booking = {
        id: data.id,
        appointment_date: data.appointment_date,
        service: {
          name: serviceData.name,
          duration: serviceData.duration,
        },
        pro: {
          business_name: proData.company_name,
          profession: 'Professionnel',
          city: 'N/A',
        },
      };
      setNextBooking(formattedBooking);
    }

    setLoading(false);
  };

  const loadUserLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setUserLocation({ lat: position.latitude, lng: position.longitude });
    } catch (error) {
      console.log('Geolocation not available, loading all providers');
      setUserLocation({ lat: 48.8566, lng: 2.3522 });
    }
  };

  const loadForYouFeed = async () => {
    setFeedLoading(true);
    try {
      const [clientPhotosResult, contentCalendarResult] = await Promise.all([
        supabase
          .from('client_results_photos')
          .select(`
            id,
            photo_url,
            service_name,
            service_category,
            caption,
            created_at,
            company_id,
            likes_count,
            comments_count
          `)
          .eq('show_in_gallery', true)
          .order('created_at', { ascending: false })
          .limit(25),

        supabase
          .from('content_calendar')
          .select(`
            id,
            title,
            caption,
            media_urls,
            publication_date,
            company_id,
            platform
          `)
          .not('media_urls', 'is', null)
          .eq('is_published', true)
          .order('publication_date', { ascending: false })
          .limit(25)
      ]);

      const allContent = [];

      if (clientPhotosResult.data) {
        const clientPhotosWithProviders = await Promise.all(
          clientPhotosResult.data.map(async (photo) => {
            const { data: providerData } = await supabase
              .from('company_profiles')
              .select('company_name, profile_photo, user_id, booking_slug')
              .eq('id', photo.company_id)
              .maybeSingle();

            return {
              id: photo.id,
              title: photo.service_name || 'Résultat',
              description: photo.caption || '',
              media_url: photo.photo_url,
              platform: 'Galerie Cliente',
              published_date: photo.created_at,
              likes_count: photo.likes_count || 0,
              comments_count: photo.comments_count || 0,
              company_id: photo.company_id,
              content_type: 'client_photo',
              service_category: photo.service_category,
              service_name: photo.service_name,
              provider: {
                company_name: providerData?.company_name || 'Professionnel',
                photo_url: providerData?.profile_photo,
                user_id: providerData?.user_id,
                booking_slug: providerData?.booking_slug
              }
            };
          })
        );
        allContent.push(...clientPhotosWithProviders);
      }

      if (contentCalendarResult.data) {
        const feedContentWithProviders = await Promise.all(
          contentCalendarResult.data.map(async (content) => {
            const { data: providerData } = await supabase
              .from('company_profiles')
              .select('company_name, profile_photo, user_id, booking_slug')
              .eq('id', content.company_id)
              .maybeSingle();

            const { count: likesCount } = await supabase
              .from('content_likes')
              .select('id', { count: 'exact', head: true })
              .eq('content_type', 'content_calendar')
              .eq('content_id', content.id);

            const { count: commentsCount } = await supabase
              .from('content_comments')
              .select('id', { count: 'exact', head: true })
              .eq('content_type', 'content_calendar')
              .eq('content_id', content.id);

            const mediaUrl = Array.isArray(content.media_urls) && content.media_urls.length > 0
              ? content.media_urls[0]
              : null;

            return {
              id: content.id,
              title: content.title || 'Post',
              description: content.caption || '',
              media_url: mediaUrl,
              platform: content.platform || 'Feed',
              published_date: content.publication_date,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              company_id: content.company_id,
              content_type: 'content_calendar',
              provider: {
                company_name: providerData?.company_name || 'Professionnel',
                photo_url: providerData?.profile_photo,
                user_id: providerData?.user_id,
                booking_slug: providerData?.booking_slug
              }
            };
          })
        );
        allContent.push(...feedContentWithProviders);
      }

      allContent.sort((a, b) =>
        new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
      );

      setFollowingContent(allContent);
    } catch (error) {
      console.error('Error loading for you feed:', error);
    } finally {
      setFeedLoading(false);
    }
  };

  const loadFollowingFeed = async () => {
    setFeedLoading(true);
    try {
      const { data: followsData } = await supabase
        .from('provider_follows')
        .select('provider_id')
        .eq('client_id', user?.id);

      if (!followsData || followsData.length === 0) {
        setFollowingContent([]);
        setFeedLoading(false);
        return;
      }

      const providerUserIds = followsData.map(f => f.provider_id);

      const { data: companyIds } = await supabase
        .from('company_profiles')
        .select('id')
        .in('user_id', providerUserIds);

      if (!companyIds || companyIds.length === 0) {
        setFollowingContent([]);
        setFeedLoading(false);
        return;
      }

      const companyIdsList = companyIds.map(c => c.id);

      const [clientPhotosResult, contentCalendarResult] = await Promise.all([
        supabase
          .from('client_results_photos')
          .select(`
            id,
            photo_url,
            service_name,
            service_category,
            caption,
            created_at,
            company_id,
            likes_count,
            comments_count
          `)
          .in('company_id', companyIdsList)
          .eq('show_in_gallery', true)
          .order('created_at', { ascending: false })
          .limit(25),

        supabase
          .from('content_calendar')
          .select(`
            id,
            title,
            caption,
            media_urls,
            publication_date,
            company_id,
            platform
          `)
          .in('company_id', companyIdsList)
          .not('media_urls', 'is', null)
          .eq('is_published', true)
          .order('publication_date', { ascending: false })
          .limit(25)
      ]);

      const allContent = [];

      if (clientPhotosResult.data) {
        const clientPhotosWithProviders = await Promise.all(
          clientPhotosResult.data.map(async (photo) => {
            const { data: providerData } = await supabase
              .from('company_profiles')
              .select('company_name, profile_photo, user_id, booking_slug')
              .eq('id', photo.company_id)
              .maybeSingle();

            return {
              id: photo.id,
              title: photo.service_name || 'Résultat',
              description: photo.caption || '',
              media_url: photo.photo_url,
              platform: 'Galerie Cliente',
              published_date: photo.created_at,
              likes_count: photo.likes_count || 0,
              comments_count: photo.comments_count || 0,
              company_id: photo.company_id,
              content_type: 'client_photo',
              service_category: photo.service_category,
              service_name: photo.service_name,
              provider: {
                company_name: providerData?.company_name || 'Professionnel',
                photo_url: providerData?.profile_photo,
                user_id: providerData?.user_id,
                booking_slug: providerData?.booking_slug
              }
            };
          })
        );
        allContent.push(...clientPhotosWithProviders);
      }

      if (contentCalendarResult.data) {
        const feedContentWithProviders = await Promise.all(
          contentCalendarResult.data.map(async (content) => {
            const { data: providerData } = await supabase
              .from('company_profiles')
              .select('company_name, profile_photo, user_id, booking_slug')
              .eq('id', content.company_id)
              .maybeSingle();

            const { count: likesCount } = await supabase
              .from('content_likes')
              .select('id', { count: 'exact', head: true })
              .eq('content_type', 'content_calendar')
              .eq('content_id', content.id);

            const { count: commentsCount } = await supabase
              .from('content_comments')
              .select('id', { count: 'exact', head: true })
              .eq('content_type', 'content_calendar')
              .eq('content_id', content.id);

            const mediaUrl = Array.isArray(content.media_urls) && content.media_urls.length > 0
              ? content.media_urls[0]
              : null;

            return {
              id: content.id,
              title: content.title || 'Post',
              description: content.caption || '',
              media_url: mediaUrl,
              platform: content.platform || 'Feed',
              published_date: content.publication_date,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              company_id: content.company_id,
              content_type: 'content_calendar',
              provider: {
                company_name: providerData?.company_name || 'Professionnel',
                photo_url: providerData?.profile_photo,
                user_id: providerData?.user_id,
                booking_slug: providerData?.booking_slug
              }
            };
          })
        );
        allContent.push(...feedContentWithProviders);
      }

      allContent.sort((a, b) =>
        new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
      );

      setFollowingContent(allContent);
    } catch (error) {
      console.error('Error loading following feed:', error);
    } finally {
      setFeedLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const handleViewProfile = (providerId: string) => {
    const provider =
      activeTab === 'foryou'
        ? forYouProviders.find((p) => p.user_id === providerId)
        : followingProviders.find((p) => p.user_id === providerId);

    if (provider?.booking_slug) {
      window.location.href = `/provider/${provider.booking_slug}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <div className="bg-gradient-to-r from-brand-600 to-brand-50 text-white px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <img src="/belleyaa.png" alt="BelleYa" className="h-24 w-auto" />
        </div>
        <p className="text-white text-lg">
          Bonjour {profile?.first_name || 'cliente'} !
        </p>
      </div>

      <div className="px-4 -mt-4">
        <SpecialOffersSlider userLocation={userLocation} onNavigateToMap={onNavigateToMap} />

        <div className="mb-6">
          <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('foryou')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'foryou'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-50 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Pour toi</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'following'
                  ? 'bg-gradient-to-r from-brand-600 to-brand-50 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" />
                <span>Suivies</span>
              </div>
            </button>
          </div>

          {feedLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : activeTab === 'foryou' ? (
            followingContent.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Aucun contenu disponible
                </h3>
                <p className="text-gray-600">
                  Les pros n'ont pas encore publié de résultats clients
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followingContent.map((content) => (
                  <ContentFeedCard
                    key={content.id}
                    content={content}
                    provider={content.provider}
                    currentUserId={user?.id || ''}
                    contentType={content.content_type}
                  />
                ))}
              </div>
            )
          ) : followingContent.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Aucun contenu disponible
              </h3>
              <p className="text-gray-600 mb-6">
                Les pros que vous suivez n'ont pas encore publié de contenu
              </p>
              <button
                onClick={() => setActiveTab('foryou')}
                className="px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-50 text-white rounded-xl font-semibold hover:from-brand-700 hover:to-brand-100 transition-all"
              >
                Découvrir des pros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followingContent.map((content) => (
                <ContentFeedCard
                  key={content.id}
                  content={content}
                  provider={content.provider}
                  currentUserId={user?.id || ''}
                  contentType={content.content_type}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
