import { useState, useEffect } from 'react';
import { Eye, Save, Upload, X, Plus, Trash2, MapPin, Instagram, Heart, Star, Sparkles, AlertCircle, Image as ImageIcon, Scissors, Clock, ChevronDown, ChevronUp, Share2, Check, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GeocodeResult } from '../lib/geocodingHelpers';
import { convertWeeklyAvailabilityToSchedule, convertWeekScheduleToAvailability } from '../lib/availabilityHelpers';
import { SERVICE_CATEGORIES } from '../lib/categoryHelpers';
import AddressInput from '../components/settings/AddressInput';
import CompactWeeklySchedule from '../components/settings/CompactWeeklySchedule';
import BookingSettings from '../components/settings/BookingSettings';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PublicProfileData {
  profile_photo: string | null;
  bio: string | null;
  instagram_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  institute_photos: Array<{ id: string; url: string; order: number }>;
  diplomas: Array<{ id: string; name: string; year?: string }>;
  conditions: Array<{ id: string; text: string }>;
  special_offer: string | null;
  followers_count: number;
  likes_count: number;
  photos_count: number;
}

interface ServiceSupplement {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  status: 'active' | 'inactive';
  service_type?: string;
  photo_url?: string | null;
  special_offer?: string | null;
  offer_type?: 'percentage' | 'fixed' | null;
  supplements?: ServiceSupplement[];
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
  is_visible: boolean;
  is_validated: boolean;
  photo_url: string | null;
  service_category: string | null;
}

function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

function MapSizeHandler() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

export default function PublicProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [profileData, setProfileData] = useState<PublicProfileData>({
    profile_photo: null,
    bio: null,
    instagram_url: null,
    address: null,
    latitude: null,
    longitude: null,
    city: null,
    institute_photos: [],
    diplomas: [],
    conditions: [],
    special_offer: null,
    followers_count: 0,
    likes_count: 0,
    photos_count: 0,
  });
  const [services, setServices] = useState<Service[]>([]);
  const [clientPhotos, setClientPhotos] = useState<ClientPhoto[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingInstitute, setUploadingInstitute] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'services' | 'gallery' | 'reviews'>('services');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showGalleryUploadModal, setShowGalleryUploadModal] = useState(false);
  const [pendingGalleryFile, setPendingGalleryFile] = useState<File | null>(null);
  const [pendingGalleryPreview, setPendingGalleryPreview] = useState<string | null>(null);
  const [selectedGalleryClient, setSelectedGalleryClient] = useState<string>('');
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>('');
  const [clients, setClients] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [weeklyAvailability, setWeeklyAvailability] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const [existingFiscalData, setExistingFiscalData] = useState<{
    vat_mode: string | null;
    acre: boolean | null;
    versement_liberatoire: boolean | null;
  }>({
    vat_mode: null,
    acre: null,
    versement_liberatoire: null,
  });
  const [bookingSettings, setBookingSettings] = useState({
    default_appointment_duration: 60,
    advance_booking_hours: 24,
    buffer_time_minutes: 15,
    max_bookings_per_day: null as number | null,
    auto_accept_bookings: false,
    email_notifications: true,
    sms_notifications: false,
    welcome_message: '',
    booking_instructions: '',
    cancellation_policy: '',
    deposit_required: false,
    deposit_amount: null as number | null,
    deposit_fee_payer: 'provider' as 'provider' | 'client',
  });

  useEffect(() => {
    if (isInitialLoad) {
      loadData();
    }
  }, [user, isInitialLoad]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (companyError) {
        console.error('[PublicProfile] Error loading company:', {
          error: companyError,
          code: companyError.code,
          message: companyError.message
        });
        throw companyError;
      }

      if (companyData) {
        console.log('[PublicProfile] Company data loaded:', {
          id: companyData.id,
          name: companyData.company_name,
          vat_mode: companyData.vat_mode,
          acre: companyData.acre,
          versement_liberatoire: companyData.versement_liberatoire
        });

        setCompanyId(companyData.id);
        setCompanyName(companyData.company_name || '');

        setExistingFiscalData({
          vat_mode: companyData.vat_mode || null,
          acre: companyData.acre ?? null,
          versement_liberatoire: companyData.versement_liberatoire ?? null,
        });

        setProfileData({
          profile_photo: companyData.profile_photo || null,
          bio: companyData.bio || null,
          instagram_url: companyData.instagram_url || null,
          address: companyData.address || null,
          latitude: companyData.latitude || null,
          longitude: companyData.longitude || null,
          city: companyData.city || null,
          institute_photos: Array.isArray(companyData.institute_photos) ? companyData.institute_photos : [],
          diplomas: Array.isArray(companyData.diplomas) ? companyData.diplomas : [],
          conditions: Array.isArray(companyData.conditions) ? companyData.conditions : [],
          special_offer: companyData.special_offer || null,
          followers_count: 0,
          likes_count: 0,
          photos_count: 0,
        });

        if (companyData.week_schedule) {
          const availability = convertWeekScheduleToAvailability(companyData.week_schedule);
          setWeeklyAvailability(availability);
        } else if (companyData.weekly_availability) {
          setWeeklyAvailability(companyData.weekly_availability);
        }

        setBookingSettings({
          default_appointment_duration: companyData.default_appointment_duration ?? 60,
          advance_booking_hours: companyData.advance_booking_hours ?? 24,
          buffer_time_minutes: companyData.buffer_time_minutes ?? 15,
          max_bookings_per_day: companyData.max_bookings_per_day ?? null,
          auto_accept_bookings: companyData.auto_accept_bookings ?? false,
          email_notifications: companyData.email_notifications ?? true,
          sms_notifications: companyData.sms_notifications ?? false,
          welcome_message: companyData.welcome_message || '',
          booking_instructions: companyData.booking_instructions || '',
          cancellation_policy: companyData.cancellation_policy || '',
          deposit_required: companyData.deposit_required ?? false,
          deposit_amount: companyData.deposit_amount ?? null,
          deposit_fee_payer: companyData.deposit_fee_payer || 'provider',
        });
      } else {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userProfile && !companyName) {
          const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
          if (fullName) {
            setCompanyName(fullName);
          }
        }
      }

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('name');

      if (servicesData) {
        const servicesWithSupplements = await Promise.all(
          servicesData.map(async (service) => {
            const { data: supplements } = await supabase
              .from('service_supplements')
              .select('id, name, duration_minutes, price')
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

      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('first_name');

      if (clientsData) {
        setClients(clientsData);
      }

      const { data: photosData } = await supabase
        .from('client_results_photos')
        .select('id, photo_url, service_name, created_at')
        .eq('company_id', companyData?.id)
        .eq('show_in_gallery', true)
        .not('service_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(12);

      if (photosData) {
        setClientPhotos(photosData);
      }

      const { data: reviewsData } = await supabase
        .from('provider_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          is_visible,
          is_validated,
          photo_url,
          service_category,
          client_id
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (reviewsData) {
        const reviewsWithNames = await Promise.all(
          reviewsData.map(async (review) => {
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

      await loadStats(companyData?.id);
    } catch (error) {
      console.error('[PublicProfile] Fatal error loading data:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  const loadStats = async (compId: string | undefined) => {
    if (!compId) return;

    try {
      const { count: followersCount } = await supabase
        .from('provider_follows')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', user?.id);

      const { count: photosCount } = await supabase
        .from('client_results_photos')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', compId);

      const { data: likesData } = await supabase
        .from('content_likes')
        .select('id')
        .eq('content_type', 'client_photo');

      setProfileData(prev => ({
        ...prev,
        followers_count: followersCount || 0,
        photos_count: photosCount || 0,
        likes_count: likesData?.length || 0,
      }));
    } catch (error) {
      console.error('[PublicProfile] Error loading stats:', error);
    }
  };

  const handleAddressGeocode = (result: GeocodeResult | null) => {
    if (result) {
      setProfileData({
        ...profileData,
        latitude: result.latitude,
        longitude: result.longitude,
      });
      if (result.formattedAddress) {
        const parts = result.formattedAddress.split(',');
        const city = parts[parts.length - 2]?.trim() || null;
        setProfileData((prev) => ({ ...prev, city }));
      }
      setAddressError(null);
    } else {
      setProfileData({
        ...profileData,
        latitude: null,
        longitude: null,
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!companyName || !companyName.trim()) {
      setNameError('Le nom de l\'entreprise est obligatoire');
      return;
    }

    setNameError(null);

    setSaving(true);
    try {
      const DEFAULT_VAT_MODE = 'VAT_FRANCHISE';
      const DEFAULT_ACRE = false;
      const DEFAULT_VERSEMENT_LIBERATOIRE = false;

      const vatMode = existingFiscalData.vat_mode || DEFAULT_VAT_MODE;
      const acre = existingFiscalData.acre ?? DEFAULT_ACRE;
      const versementLiberatoire = existingFiscalData.versement_liberatoire ?? DEFAULT_VERSEMENT_LIBERATOIRE;

      if (!vatMode) {
        console.error('[PublicProfile] CRITICAL: vat_mode is null after fallback!');
        alert('Erreur: vat_mode est null. Veuillez contacter le support.');
        setSaving(false);
        return;
      }

      const weekSchedule = convertWeeklyAvailabilityToSchedule(weeklyAvailability);

      const payload: any = {
        user_id: user.id,
        company_name: companyName.trim(),
        profile_photo: profileData.profile_photo,
        bio: profileData.bio,
        instagram_url: profileData.instagram_url,
        address: profileData.address,
        latitude: profileData.latitude,
        longitude: profileData.longitude,
        city: profileData.city,
        institute_photos: profileData.institute_photos,
        diplomas: profileData.diplomas,
        conditions: profileData.conditions,
        special_offer: profileData.special_offer,
        weekly_availability: weeklyAvailability,
        week_schedule: weekSchedule,
        vat_mode: vatMode,
        acre: acre,
        versement_liberatoire: versementLiberatoire,
        default_appointment_duration: bookingSettings.default_appointment_duration,
        advance_booking_hours: bookingSettings.advance_booking_hours,
        buffer_time_minutes: bookingSettings.buffer_time_minutes,
        max_bookings_per_day: bookingSettings.max_bookings_per_day,
        auto_accept_bookings: bookingSettings.auto_accept_bookings,
        email_notifications: bookingSettings.email_notifications,
        sms_notifications: bookingSettings.sms_notifications,
        welcome_message: bookingSettings.welcome_message,
        booking_instructions: bookingSettings.booking_instructions,
        cancellation_policy: bookingSettings.cancellation_policy,
        deposit_required: bookingSettings.deposit_required,
        deposit_amount: bookingSettings.deposit_amount,
        deposit_fee_payer: bookingSettings.deposit_fee_payer,
        updated_at: new Date().toISOString(),
      };

      if (!companyId) {
        payload.activity_type = null;
        payload.creation_date = null;
        payload.legal_status = null;
        payload.country = 'France';
      }

      console.log('[PublicProfile] ========== PAYLOAD DEBUG ==========');
      console.log('[PublicProfile] user_id:', payload.user_id);
      console.log('[PublicProfile] company_name:', payload.company_name);
      console.log('[PublicProfile] vat_mode:', payload.vat_mode);
      console.log('[PublicProfile] acre:', payload.acre);
      console.log('[PublicProfile] versement_liberatoire:', payload.versement_liberatoire);
      console.log('[PublicProfile] Full payload:', JSON.stringify(payload, null, 2));
      console.log('[PublicProfile] onConflict key: user_id');
      console.log('[PublicProfile] companyId (existing):', companyId);
      console.log('[PublicProfile] ====================================');

      const { data, error } = await supabase
        .from('company_profiles')
        .upsert(payload, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('[PublicProfile] Save error:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('[PublicProfile] Profile saved successfully:', { id: data?.id });

      if (data?.id) {
        setCompanyId(data.id);
      }

      alert('Profil enregistré avec succès !');
    } catch (error: any) {
      console.error('[PublicProfile] Fatal save error:', error);
      alert(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!user) return;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('service-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-photos')
        .getPublicUrl(fileName);

      setProfileData({ ...profileData, profile_photo: publicUrl });
    } catch (error) {
      console.error('[PublicProfile] Error uploading photo:', error);
      alert('Erreur lors de l\'upload de la photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadInstitutePhoto = async (file: File) => {
    if (!user) return;

    setUploadingInstitute(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/institute-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('service-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-photos')
        .getPublicUrl(fileName);

      const newPhoto = {
        id: Date.now().toString(),
        url: publicUrl,
        order: profileData.institute_photos.length,
      };

      setProfileData({
        ...profileData,
        institute_photos: [...profileData.institute_photos, newPhoto],
      });
    } catch (error) {
      console.error('[PublicProfile] Error uploading institute photo:', error);
      alert('Erreur lors de l\'upload de la photo');
    } finally {
      setUploadingInstitute(false);
    }
  };

  const removeInstitutePhoto = (id: string) => {
    setProfileData({
      ...profileData,
      institute_photos: profileData.institute_photos.filter(p => p.id !== id),
    });
  };

  const addDiploma = () => {
    setProfileData({
      ...profileData,
      diplomas: [...profileData.diplomas, { id: Date.now().toString(), name: '', year: '' }],
    });
  };

  const updateDiploma = (id: string, field: 'name' | 'year', value: string) => {
    setProfileData({
      ...profileData,
      diplomas: profileData.diplomas.map(d =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    });
  };

  const removeDiploma = (id: string) => {
    setProfileData({
      ...profileData,
      diplomas: profileData.diplomas.filter(d => d.id !== id),
    });
  };

  const addCondition = (text: string) => {
    if (!text.trim()) return;

    setProfileData({
      ...profileData,
      conditions: [...profileData.conditions, {
        id: Date.now().toString(),
        text: text.trim(),
      }],
    });
  };

  const removeCondition = (id: string) => {
    setProfileData({
      ...profileData,
      conditions: profileData.conditions.filter(c => c.id !== id),
    });
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    const { error } = await supabase
      .from('services')
      .update({ status: newStatus })
      .eq('id', serviceId);

    if (!error) {
      setServices(services.map(s =>
        s.id === serviceId ? { ...s, status: newStatus } : s
      ));
    }
  };

  const toggleReviewVisibility = async (reviewId: string, currentVisibility: boolean) => {
    const { error } = await supabase
      .from('provider_reviews')
      .update({ is_visible: !currentVisibility })
      .eq('id', reviewId);

    if (!error) {
      setReviews(reviews.map(r =>
        r.id === reviewId ? { ...r, is_visible: !currentVisibility } : r
      ));
    }
  };

  const toggleReviewValidation = async (reviewId: string, currentValidation: boolean) => {
    const updateData: any = {
      is_validated: !currentValidation
    };

    if (!currentValidation) {
      updateData.validated_at = new Date().toISOString();
    } else {
      updateData.validated_at = null;
    }

    const { error } = await supabase
      .from('provider_reviews')
      .update(updateData)
      .eq('id', reviewId);

    if (!error) {
      setReviews(reviews.map(r =>
        r.id === reviewId ? { ...r, is_validated: !currentValidation } : r
      ));
    }
  };

  const shareReviewOnSocial = (review: Review) => {
    const text = `${review.rating}/5 ⭐\n"${review.comment || 'Excellent service!'}"`;
    const url = `https://www.instagram.com/`;

    if (navigator.share) {
      navigator.share({
        title: 'Avis client',
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Texte copié dans le presse-papier !');
    }
  };

  const handleGalleryFileSelect = (file: File) => {
    const preview = URL.createObjectURL(file);
    setPendingGalleryFile(file);
    setPendingGalleryPreview(preview);
    setShowGalleryUploadModal(true);
  };

  const handleCancelGalleryUpload = () => {
    if (pendingGalleryPreview) {
      URL.revokeObjectURL(pendingGalleryPreview);
    }
    setPendingGalleryFile(null);
    setPendingGalleryPreview(null);
    setSelectedGalleryClient('');
    setSelectedGalleryCategory('');
    setShowGalleryUploadModal(false);
  };

  const handleConfirmGalleryUpload = async () => {
    if (!user || !companyId || !pendingGalleryFile) {
      console.log('[PublicProfile] Missing requirements:', { user: !!user, companyId, file: !!pendingGalleryFile });
      return;
    }

    if (!selectedGalleryCategory) {
      alert('Veuillez sélectionner une catégorie pour cette photo');
      return;
    }

    setUploadingGallery(true);
    try {
      console.log('[PublicProfile] Starting upload with:', {
        companyId,
        category: selectedGalleryCategory,
        clientId: selectedGalleryClient || null
      });

      const fileExt = pendingGalleryFile.name.split('.').pop();
      const fileName = `${companyId}/gallery-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('client-media')
        .upload(fileName, pendingGalleryFile);

      if (uploadError) {
        console.error('[PublicProfile] Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('client-media')
        .getPublicUrl(fileName);

      console.log('[PublicProfile] File uploaded, URL:', publicUrl);

      const insertData = {
        company_id: companyId,
        photo_url: publicUrl,
        show_in_gallery: true,
        uploaded_by: user.id,
        client_id: selectedGalleryClient && selectedGalleryClient.trim() !== '' ? selectedGalleryClient : null,
        service_id: null,
        service_name: selectedGalleryCategory,
      };

      console.log('[PublicProfile] Inserting data:', insertData);

      const { error: insertError } = await supabase
        .from('client_results_photos')
        .insert(insertData);

      if (insertError) {
        console.error('[PublicProfile] Database insert error:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw insertError;
      }

      console.log('[PublicProfile] Photo inserted successfully');

      const { data: photosData } = await supabase
        .from('client_results_photos')
        .select('id, photo_url, service_name, created_at')
        .eq('company_id', companyId)
        .eq('show_in_gallery', true)
        .not('service_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(12);

      if (photosData) {
        console.log('[PublicProfile] Loaded photos:', photosData.length);
        setClientPhotos(photosData);
      }

      handleCancelGalleryUpload();
      alert('Photo publiée avec succès !');
    } catch (error: any) {
      console.error('[PublicProfile] Error uploading gallery photo:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details
      });
      alert(`Erreur lors de l'upload de la photo: ${error?.message || 'Erreur inconnue'}`);
    } finally {
      setUploadingGallery(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profil public</h1>
            <p className="text-gray-600">Configurez votre profil visible par les clientes</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || geocoding}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-pink-600 transition-all shadow-lg disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {geocoding ? 'Géolocalisation...' : saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>

        {nameError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Champ obligatoire manquant</p>
              <p className="text-sm text-red-700">{nameError}</p>
            </div>
          </div>
        )}

        {addressError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Erreur d'adresse</p>
              <p className="text-sm text-red-700">{addressError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Edit Form */}
          <div className="space-y-6">
            {/* Company Name */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Informations de base</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    setNameError(null);
                  }}
                  placeholder="Nom de votre salon / institut"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent ${
                    nameError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Champ obligatoire
                </p>
              </div>
            </div>

            {/* Profile Photo & Bio */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Photo & Presentation</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo de profil
                  </label>
                  <div className="flex items-center gap-4">
                    {profileData.profile_photo ? (
                      <div className="relative">
                        <img
                          src={profileData.profile_photo}
                          alt="Photo de profil"
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                        />
                        <button
                          onClick={() => setProfileData({ ...profileData, profile_photo: null })}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <Sparkles className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadProfilePhoto(file);
                        }}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                      <div className="px-4 py-2 bg-belaya-primary text-white rounded-lg hover:bg-belaya-700 flex items-center gap-2">
                        {uploadingPhoto ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Upload...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Telecharger
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biographie
                  </label>
                  <textarea
                    value={profileData.bio || ''}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    rows={4}
                    maxLength={500}
                    placeholder="Presentez-vous et partagez votre passion..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(profileData.bio || '').length}/500 caracteres
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram (URL complete)
                  </label>
                  <input
                    type="url"
                    value={profileData.instagram_url || ''}
                    onChange={(e) => setProfileData({ ...profileData, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/votre_compte"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>

                <AddressInput
                  value={profileData.address || ''}
                  onChange={(address) => setProfileData({ ...profileData, address })}
                  onGeocode={handleAddressGeocode}
                  currentLocation={
                    profileData.latitude && profileData.longitude
                      ? { latitude: profileData.latitude, longitude: profileData.longitude }
                      : null
                  }
                  profilePhoto={profileData.profile_photo}
                  error={addressError}
                  onErrorChange={setAddressError}
                />
              </div>
            </div>

            {/* Horaires d'ouverture - Vue compacte */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Horaires & Disponibilités</h3>
              <CompactWeeklySchedule
                availability={weeklyAvailability}
                onChange={setWeeklyAvailability}
              />
            </div>

            {/* Paramètres de réservation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Paramètres de réservation</h3>
              <BookingSettings
                settings={bookingSettings}
                onChange={setBookingSettings}
              />
            </div>

            {/* Institute Photos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Photos de l'institut</h3>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadInstitutePhoto(file);
                    }}
                    className="hidden"
                    disabled={uploadingInstitute}
                  />
                  <div className="px-3 py-1 text-sm bg-belaya-primary text-white rounded hover:bg-belaya-700 flex items-center gap-1">
                    {uploadingInstitute ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Upload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Ajouter
                      </>
                    )}
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {profileData.institute_photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt="Photo institut"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeInstitutePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Diplomas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Diplomes</h3>
                <button
                  onClick={addDiploma}
                  className="px-3 py-1 text-sm bg-belaya-primary text-white rounded hover:bg-belaya-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>

              <div className="space-y-2">
                {profileData.diplomas.map((diploma) => (
                  <div key={diploma.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={diploma.name}
                      onChange={(e) => updateDiploma(diploma.id, 'name', e.target.value)}
                      placeholder="Nom du diplome"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={diploma.year || ''}
                      onChange={(e) => updateDiploma(diploma.id, 'year', e.target.value)}
                      placeholder="Annee"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    />
                    <button
                      onClick={() => removeDiploma(diploma.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Conditions</h3>

              <div className="space-y-3">
                {profileData.conditions.map((condition) => (
                  <div key={condition.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="flex-1 text-sm text-gray-700">{condition.text}</p>
                    <button
                      onClick={() => removeCondition(condition.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nouvelle condition..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCondition((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                      addCondition(input.value);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-belaya-primary text-white rounded-lg hover:bg-belaya-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Live Preview */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="bg-white rounded-xl shadow-lg border-2 border-belaya-200 overflow-hidden">
              <div className="bg-gradient-to-r from-rose-100 to-pink-100 p-3 flex items-center gap-2 border-b border-belaya-200">
                <Eye className="w-5 h-5 text-belaya-primary" />
                <span className="font-semibold text-gray-900">Apercu en temps reel</span>
              </div>

              <div className="max-h-[800px] overflow-y-auto">
                {/* Preview Header */}
                <div className="bg-gradient-to-r from-rose-400 to-pink-500 text-white p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {profileData.profile_photo ? (
                        <img
                          src={profileData.profile_photo}
                          alt={companyName}
                          className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-white/30">
                          <span className="text-white font-bold text-2xl">
                            {companyName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-1">{companyName}</h2>

                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-sm">
                          <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                          <span className="font-bold">4.8</span>
                          <span>(12)</span>
                        </div>

                        <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-xs">
                          <Heart className="w-3 h-3" />
                          <span>{profileData.followers_count} abonne{profileData.followers_count > 1 ? 's' : ''}</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs">
                          <Sparkles className="w-3 h-3" />
                          <span>{profileData.likes_count} likes • {profileData.photos_count} photos</span>
                        </div>
                      </div>

                      {profileData.bio && (
                        <p className="text-belaya-50 text-sm mb-3">{profileData.bio}</p>
                      )}

                      {profileData.instagram_url && (
                        <a
                          href={profileData.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-white/90 hover:text-white"
                        >
                          <Instagram className="w-4 h-4" />
                          Instagram
                        </a>
                      )}

                      {profileData.address && (
                        <div className="flex items-start gap-1 mt-2 text-xs text-belaya-100">
                          <MapPin className="w-3 h-3 mt-0.5" />
                          <span>{profileData.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Map Preview */}
                {profileData.latitude && profileData.longitude && (
                  <div className="p-4 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-belaya-primary" />
                      <h4 className="font-bold text-gray-900 text-sm">Localisation</h4>
                    </div>
                    <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-md" style={{ height: '250px' }}>
                      <MapContainer
                        center={[profileData.latitude, profileData.longitude]}
                        zoom={15}
                        scrollWheelZoom={false}
                        zoomControl={true}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                          maxZoom={20}
                        />
                        <MapViewController center={[profileData.latitude, profileData.longitude]} zoom={15} />
                        <MapSizeHandler />
                        <Marker
                          position={[profileData.latitude, profileData.longitude]}
                          icon={L.divIcon({
                            html: `
                              <div class="relative transform transition-transform hover:scale-110">
                                <div class="w-12 h-12 rounded-full border-3 border-white shadow-lg overflow-hidden ring-2 ring-belaya-primary bg-white">
                                  ${profileData.profile_photo
                                    ? `<img src="${profileData.profile_photo}" alt="${companyName}" class="w-full h-full object-cover" />`
                                    : `<div class="w-full h-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">${companyName.charAt(0)}</div>`
                                  }
                                </div>
                                <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-belaya-primary border-2 border-white rounded-full"></div>
                              </div>
                            `,
                            className: 'custom-provider-marker',
                            iconSize: [48, 56],
                            iconAnchor: [24, 56]
                          })}
                        />
                      </MapContainer>
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="bg-white border-b border-gray-200">
                  <div className="flex">
                    <button
                      onClick={() => setPreviewTab('services')}
                      className={`flex-1 py-3 px-4 font-semibold transition-all ${
                        previewTab === 'services'
                          ? 'text-[#C43586] border-b-2 border-[#C43586]'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Scissors className="w-4 h-4" />
                        <span>Services</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setPreviewTab('gallery')}
                      className={`flex-1 py-3 px-4 font-semibold transition-all ${
                        previewTab === 'gallery'
                          ? 'text-[#C43586] border-b-2 border-[#C43586]'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        <span>Galerie</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setPreviewTab('reviews')}
                      className={`flex-1 py-3 px-4 font-semibold transition-all ${
                        previewTab === 'reviews'
                          ? 'text-[#C43586] border-b-2 border-[#C43586]'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Star className="w-4 h-4" />
                        <span>Avis</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-4 space-y-4">
                  {previewTab === 'services' && (
                    <div className="space-y-4">
                      {/* Institute Photos */}
                      {profileData.institute_photos.length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 text-sm">Photos de l'institut</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {profileData.institute_photos.slice(0, 6).map((photo) => (
                              <img
                                key={photo.id}
                                src={photo.url}
                                alt="Institut"
                                className="w-full aspect-square object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}


                      {/* Services */}
                      {services.filter(s => s.status === 'active').length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 text-sm">Mes services</h4>
                          <div className="space-y-2">
                            {services.filter(s => s.status === 'active').map((service) => (
                              <div key={service.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="flex gap-3">
                                  {service.photo_url ? (
                                    <div className="w-20 h-20 flex-shrink-0">
                                      <img
                                        src={service.photo_url}
                                        alt={service.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                                      <Scissors className="w-8 h-8 text-belaya-300" />
                                    </div>
                                  )}
                                  <div className="flex-1 p-3 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="font-semibold text-gray-900 text-sm truncate">{service.name}</p>
                                          {service.special_offer && service.offer_type && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-300">
                                              <Sparkles className="w-3 h-3 mr-1" />
                                              -{service.special_offer}{service.offer_type === 'percentage' ? '%' : '€'}
                                            </span>
                                          )}
                                        </div>
                                        {service.service_type && (
                                          <p className="text-xs text-gray-500">{service.service_type}</p>
                                        )}
                                        <p className="text-xs text-gray-600 mt-1">{service.duration} min</p>
                                      </div>
                                      <div className="text-right">
                                        {service.special_offer && service.offer_type && (
                                          <div className="text-xs text-gray-400 line-through mb-0.5">
                                            {service.price} €
                                          </div>
                                        )}
                                        <span className="font-bold text-belaya-primary text-sm whitespace-nowrap">
                                          {service.special_offer && service.offer_type ? (
                                            service.offer_type === 'percentage'
                                              ? (service.price * (1 - parseFloat(service.special_offer) / 100)).toFixed(2)
                                              : (service.price - parseFloat(service.special_offer)).toFixed(2)
                                          ) : service.price} €
                                        </span>
                                      </div>
                                    </div>

                                    {service.supplements && service.supplements.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-100">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Options disponibles:</p>
                                        <div className="space-y-1">
                                          {service.supplements.map((supplement) => (
                                            <div key={supplement.id} className="flex items-center justify-between text-xs">
                                              <span className="text-gray-600">+ {supplement.name}</span>
                                              <div className="flex items-center gap-2">
                                                <span className="text-gray-500">{supplement.duration_minutes} min</span>
                                                <span className="font-semibold text-belaya-primary">+{supplement.price} €</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Diplomas */}
                      {profileData.diplomas.length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 text-sm">Diplomes</h4>
                          <div className="space-y-1">
                            {profileData.diplomas.map((diploma) => (
                              <div key={diploma.id} className="text-sm text-gray-700">
                                {diploma.name} {diploma.year && `(${diploma.year})`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Conditions */}
                      {profileData.conditions.length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 text-sm">Conditions</h4>
                          <div className="space-y-1">
                            {profileData.conditions.map((condition) => (
                              <div key={condition.id} className="text-sm text-gray-600">
                                • {condition.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {previewTab === 'gallery' && (
                    <div>
                      <div className="mb-4">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleGalleryFileSelect(file);
                            }}
                            className="hidden"
                            disabled={uploadingGallery}
                          />
                          <div className="w-full py-3 border-2 border-dashed border-belaya-300 rounded-xl text-belaya-primary font-medium hover:bg-belaya-50 transition-all flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4" />
                            Ajouter une photo/video
                          </div>
                        </label>
                      </div>

                      {clientPhotos.length === 0 ? (
                        <div className="text-center py-12">
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 text-sm">Aucune photo dans la galerie</p>
                          <p className="text-xs text-gray-500 mt-2">Ajoutez des photos depuis vos fiches clients ou directement ici</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {clientPhotos.map((photo) => (
                            <div key={photo.id} className="relative aspect-square">
                              <img
                                src={photo.photo_url}
                                alt={photo.service_name || 'Photo'}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              {photo.service_name && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                                  <p className="text-white text-xs font-medium">{photo.service_name}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {previewTab === 'reviews' && (
                    <div className="space-y-3">
                      {reviews.length === 0 ? (
                        <div className="text-center py-12">
                          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 text-sm">Aucun avis pour le moment</p>
                          <p className="text-xs text-gray-500 mt-2">Les avis de vos clients apparaitront ici</p>
                        </div>
                      ) : (
                        reviews.map((review) => (
                          <div key={review.id} className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900 text-sm">{review.client_name}</p>
                                  {!review.is_visible && (
                                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">Masqué</span>
                                  )}
                                  {review.is_validated && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Validé</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mb-1">
                                  {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  ))}
                                </div>
                                {review.comment && (
                                  <p className="text-gray-700 text-xs mt-1">{review.comment}</p>
                                )}
                                {review.service_category && (
                                  <p className="text-gray-500 text-xs mt-1">Service: {review.service_category}</p>
                                )}
                                <p className="text-gray-500 text-xs mt-1">
                                  {new Date(review.created_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <button
                                onClick={() => toggleReviewValidation(review.id, review.is_validated)}
                                className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                  review.is_validated
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {review.is_validated ? (
                                  <>
                                    <Check className="w-3 h-3 inline mr-1" />
                                    Validé
                                  </>
                                ) : (
                                  <>Valider</>
                                )}
                              </button>
                              <button
                                onClick={() => toggleReviewVisibility(review.id, review.is_visible)}
                                className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                  review.is_visible
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                }`}
                              >
                                {review.is_visible ? 'Masquer' : 'Afficher'}
                              </button>
                              <button
                                onClick={() => shareReviewOnSocial(review)}
                                className="px-2 py-1.5 text-xs font-medium bg-belaya-100 text-belaya-deep rounded-lg hover:bg-belaya-200 transition-colors"
                              >
                                <Share2 className="w-3 h-3 inline mr-1" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Upload Modal */}
      {showGalleryUploadModal && pendingGalleryFile && pendingGalleryPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Ajouter une photo à la galerie</h3>
              <button
                onClick={handleCancelGalleryUpload}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={pendingGalleryPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedGalleryCategory}
                  onChange={(e) => setSelectedGalleryCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {SERVICE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente associée <span className="text-gray-500">(Optionnel)</span>
                </label>
                <select
                  value={selectedGalleryClient}
                  onChange={(e) => setSelectedGalleryClient(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                >
                  <option value="">Aucune cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Si vous sélectionnez une cliente, la photo apparaîtra également dans sa fiche client
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Cette photo sera automatiquement publiée dans :</strong>
                </p>
                <ul className="text-sm text-blue-900 mt-2 space-y-1 ml-4 list-disc">
                  <li>Votre profil public - Galerie (aperçu en temps réel)</li>
                  <li>Feed "Pour toi" (visible par toutes les clientes)</li>
                  <li>Section "Suivis" (pour vos abonnées)</li>
                  {selectedGalleryClient && <li>Fiche de la cliente sélectionnée - Galerie - Ses résultats</li>}
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
              <button
                onClick={handleCancelGalleryUpload}
                disabled={uploadingGallery}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmGalleryUpload}
                disabled={uploadingGallery || !selectedGalleryCategory}
                className="px-6 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50"
              >
                {uploadingGallery ? 'Publication...' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
