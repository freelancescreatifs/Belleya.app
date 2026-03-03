import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PublicProfileData {
  userId: string;
  companyId: string;
  companyName: string;
  profilePhoto: string | null;
  bio: string | null;
  instagramUrl: string | null;
  address: string | null;
  city: string | null;
  averageRating: number;
  reviewsCount: number;
  followersCount: number;
  likesCount: number;
  photosCount: number;
  isAcceptingBookings: boolean;
  weeklyAvailability: any;
  weekSchedule: any;
  advanceBookingHours: number;
  bufferTimeMinutes: number;
  depositRequired: boolean;
  depositAmount: number | null;
  institutePhotos: Array<{ id: string; url: string; order: number }>;
  diplomas: Array<{ id: string; name: string; year?: string }>;
  conditions: Array<{ id: string; text: string }>;
  welcomeMessage: string;
  bookingInstructions: string;
  cancellationPolicy: string;
}

export function usePublicProfile(slug: string) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadProfile();

      const subscription = supabase
        .channel(`public_profile:${slug}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'company_profiles',
            filter: `booking_slug=eq.${slug}`,
          },
          (payload) => {
            if (profile) {
              loadProfile();
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [slug]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('booking_slug', slug)
        .maybeSingle();

      if (companyError) throw companyError;
      if (!companyData) {
        throw new Error('Profil non trouvé');
      }

      const { count: followersCount } = await supabase
        .from('provider_follows')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', companyData.user_id);

      const { count: photosCount } = await supabase
        .from('client_results_photos')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyData.id)
        .eq('show_in_gallery', true);

      const { data: reviewsData } = await supabase
        .from('provider_reviews')
        .select('rating')
        .eq('provider_id', companyData.user_id)
        .eq('is_visible', true)
        .eq('is_validated', true);

      const reviewsCount = reviewsData?.length || 0;
      const averageRating = reviewsCount > 0
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsCount
        : 0;

      const { data: likesData } = await supabase
        .from('content_likes')
        .select('id')
        .eq('content_type', 'client_photo');

      setProfile({
        userId: companyData.user_id,
        companyId: companyData.id,
        companyName: companyData.company_name || 'Prestataire',
        profilePhoto: companyData.profile_photo,
        bio: companyData.bio,
        instagramUrl: companyData.instagram_url,
        address: companyData.address,
        city: companyData.city,
        averageRating,
        reviewsCount,
        followersCount: followersCount || 0,
        likesCount: likesData?.length || 0,
        photosCount: photosCount || 0,
        isAcceptingBookings: companyData.is_accepting_bookings ?? true,
        weeklyAvailability: companyData.weekly_availability,
        weekSchedule: companyData.week_schedule,
        advanceBookingHours: companyData.advance_booking_hours ?? 24,
        bufferTimeMinutes: companyData.buffer_time_minutes ?? 15,
        depositRequired: companyData.deposit_required ?? false,
        depositAmount: companyData.deposit_amount,
        institutePhotos: Array.isArray(companyData.institute_photos) ? companyData.institute_photos : [],
        diplomas: Array.isArray(companyData.diplomas) ? companyData.diplomas : [],
        conditions: Array.isArray(companyData.conditions) ? companyData.conditions : [],
        welcomeMessage: companyData.welcome_message || '',
        bookingInstructions: companyData.booking_instructions || '',
        cancellationPolicy: companyData.cancellation_policy || '',
      });
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  return { loading, profile, error, reload: loadProfile };
}
