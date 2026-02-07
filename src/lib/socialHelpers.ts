import { supabase } from './supabase';

export interface ProviderProfile {
  user_id: string;
  company_name: string;
  activity_type: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  is_accepting_bookings: boolean;
  booking_slug: string | null;
  profile_photo: string | null;
  bio: string | null;
  first_name: string | null;
  last_name: string | null;
  followers_count: number;
  reviews_count: number;
  average_rating: number;
  distance?: number;
}

export interface Review {
  id: string;
  client_id: string;
  provider_id: string;
  booking_id: string | null;
  rating: number;
  comment: string | null;
  photo_url?: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  client_name?: string;
}

export const followProvider = async (providerId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Vous devez être connecté pour suivre un prestataire' };
    }

    const { error } = await supabase
      .from('provider_follows')
      .insert({
        client_id: user.id,
        provider_id: providerId,
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Vous suivez déjà ce prestataire' };
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error following provider:', error);
    return { success: false, error: 'Erreur lors du suivi' };
  }
};

export const unfollowProvider = async (providerId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Vous devez être connecté' };
    }

    const { error } = await supabase
      .from('provider_follows')
      .delete()
      .eq('client_id', user.id)
      .eq('provider_id', providerId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error unfollowing provider:', error);
    return { success: false, error: 'Erreur lors du désabonnement' };
  }
};

export const isFollowingProvider = async (providerId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('provider_follows')
      .select('id')
      .eq('client_id', user.id)
      .eq('provider_id', providerId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
};

export const getFollowedProviders = async (): Promise<ProviderProfile[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: follows } = await supabase
      .from('provider_follows')
      .select('provider_id')
      .eq('client_id', user.id);

    if (!follows || follows.length === 0) return [];

    const providerIds = follows.map(f => f.provider_id);

    const { data: providers, error } = await supabase
      .from('public_provider_profiles')
      .select('*')
      .in('user_id', providerIds);

    if (error) throw error;
    return providers || [];
  } catch (error) {
    console.error('Error getting followed providers:', error);
    return [];
  }
};

export const likeContent = async (contentType: string, contentId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Vous devez être connecté pour liker' };
    }

    const { error } = await supabase
      .from('content_likes')
      .insert({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Vous avez déjà liké ce contenu' };
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error liking content:', error);
    return { success: false, error: 'Erreur lors du like' };
  }
};

export const unlikeContent = async (contentType: string, contentId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Vous devez être connecté' };
    }

    const { error } = await supabase
      .from('content_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error unliking content:', error);
    return { success: false, error: 'Erreur lors du retrait du like' };
  }
};

export const hasLikedContent = async (contentType: string, contentId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('content_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
};

export const getProviderReviews = async (providerId: string): Promise<Review[]> => {
  try {
    const { data, error } = await supabase
      .from('provider_reviews')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_visible', true)
      .eq('is_validated', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) return [];

    const reviewsWithNames = await Promise.all(
      data.map(async (review) => {
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('user_id', review.client_id)
          .maybeSingle();

        return {
          ...review,
          client_name: userData
            ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Cliente'
            : 'Cliente',
        };
      })
    );

    return reviewsWithNames;
  } catch (error) {
    console.error('Error getting provider reviews:', error);
    return [];
  }
};

export const createReview = async (
  providerId: string,
  rating: number,
  comment: string,
  bookingId?: string,
  photoFile?: File | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Vous devez être connecté pour laisser un avis' };
    }

    let photoUrl: string | null = null;

    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('review-photos')
        .upload(fileName, photoFile);

      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
      } else if (uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('review-photos')
          .getPublicUrl(fileName);
        photoUrl = publicUrl;
      }
    }

    const { error } = await supabase
      .from('provider_reviews')
      .insert({
        client_id: user.id,
        provider_id: providerId,
        booking_id: bookingId || null,
        rating,
        comment,
        photo_url: photoUrl,
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Vous avez déjà laissé un avis pour ce rendez-vous' };
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating review:', error);
    return { success: false, error: 'Erreur lors de la création de l\'avis' };
  }
};

export const getNearbyProviders = async (
  userLat: number,
  userLon: number,
  maxDistance: number = 50
): Promise<ProviderProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('public_provider_profiles')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) throw error;

    const providersWithDistance = (data || []).map((provider: any) => ({
      ...provider,
      distance: calculateDistance(userLat, userLon, provider.latitude, provider.longitude),
    })).filter(p => p.distance !== null && p.distance <= maxDistance);

    providersWithDistance.sort((a, b) => a.distance! - b.distance!);

    return providersWithDistance;
  } catch (error) {
    console.error('Error getting nearby providers:', error);
    return [];
  }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number | null => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
