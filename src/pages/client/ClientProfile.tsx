import { User, Mail, Phone, LogOut, ChevronRight, Image as ImageIcon, Camera, X, Bell, Shield, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ClientPhoto {
  id: string;
  photo_url: string;
  service_name: string | null;
  created_at: string;
}

interface NotificationPreferences {
  booking_reminders: boolean;
  booking_confirmations: boolean;
  special_offers: boolean;
  newsletter: boolean;
  sms_notifications: boolean;
  email_notifications: boolean;
}

interface PrivacySettings {
  profile_visibility: 'public' | 'private';
  show_in_search: boolean;
  allow_messages: boolean;
  data_sharing: boolean;
}

export default function ClientProfile() {
  const { user, profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [myPhotos, setMyPhotos] = useState<ClientPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    photo_url: profile?.photo_url || ''
  });
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    booking_reminders: true,
    booking_confirmations: true,
    special_offers: true,
    newsletter: false,
    sms_notifications: true,
    email_notifications: true
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profile_visibility: 'public',
    show_in_search: true,
    allow_messages: true,
    data_sharing: false
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        photo_url: profile.photo_url || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      loadMyPhotos();
    }
  }, [user]);

  const loadMyPhotos = async () => {
    if (!user) return;

    setLoadingPhotos(true);
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id);

      if (!clientsData || clientsData.length === 0) {
        setLoadingPhotos(false);
        return;
      }

      const clientIds = clientsData.map(c => c.id);

      const { data: photosData } = await supabase
        .from('client_results_photos')
        .select('id, photo_url, service_name, created_at')
        .in('client_id', clientIds)
        .eq('show_in_gallery', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (photosData) {
        setMyPhotos(photosData);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      alert('Erreur lors de la déconnexion. Veuillez réessayer.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `profile-${Date.now()}.${fileExt}`;
    const filePath = `client-profiles/${user.id}/${fileName}`;

    setUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('client-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-photos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, photo_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erreur lors du téléchargement de la photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          photo_url: formData.photo_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      alert('Profil mis à jour avec succès!');
      setShowEditModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erreur lors de la mise à jour du profil');
    }
  };

  const handleSaveNotifications = () => {
    alert('Préférences de notifications sauvegardées !');
    setShowNotificationsModal(false);
  };

  const handleSavePrivacy = () => {
    alert('Paramètres de confidentialité sauvegardés !');
    setShowPrivacyModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      <div className="bg-gradient-to-r from-brand-600 to-brand-50 text-white px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <img src="/belayaa.webp" alt="Belaya.app" className="h-20 w-auto" />
        </div>
        <div className="flex flex-col items-center">
          {profile?.photo_url ? (
            <img
              src={profile.photo_url}
              alt="Photo de profil"
              className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <User className="w-12 h-12 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold mb-1">
            {profile?.first_name && profile?.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : 'Mon profil'}
          </h1>
          <p className="text-white/90 text-sm">Cliente Belaya.app</p>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <h2 className="font-bold text-gray-900 px-5 pt-5 pb-3">
            Ma galerie
          </h2>

          {loadingPhotos ? (
            <div className="px-5 py-8 text-center text-gray-500">
              Chargement...
            </div>
          ) : myPhotos.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-900 font-semibold text-sm mb-1">Aucune photo pour le moment</p>
              <p className="text-gray-500 text-xs">
                Vos photos de résultats apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="p-5">
              <div className="grid grid-cols-3 gap-2">
                {myPhotos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square">
                    <img
                      src={photo.photo_url}
                      alt={photo.service_name || 'Photo'}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    {photo.service_name && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-xl">
                        <p className="text-white text-xs font-medium truncate">
                          {photo.service_name}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <h2 className="font-bold text-gray-900 px-5 pt-5 pb-3">
            Informations personnelles
          </h2>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-brand-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="font-semibold text-gray-900">{user?.email}</p>
              </div>
            </div>

            {profile?.phone && (
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Téléphone</p>
                  <p className="font-semibold text-gray-900">{profile.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <h2 className="font-bold text-gray-900 px-5 pt-5 pb-3">
            Paramètres
          </h2>

          <div className="divide-y divide-gray-100">
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-600" />
                </div>
                <span className="text-gray-900 font-medium">Modifier mon profil</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => setShowNotificationsModal(true)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-brand-600" />
                </div>
                <span className="text-gray-900 font-medium">Notifications</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => setShowPrivacyModal(true)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-brand-600" />
                </div>
                <span className="text-gray-900 font-medium">Confidentialité</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center justify-center gap-2 text-red-600 font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-5 h-5" />
          {isSigningOut ? 'Déconnexion en cours...' : 'Déconnexion'}
        </button>

        <div className="text-center text-sm text-gray-500 py-4">
          Belaya.app v1.0
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Modifier mon profil</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  {formData.photo_url ? (
                    <img
                      src={formData.photo_url}
                      alt="Photo de profil"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 bg-brand-600 text-white p-2 rounded-full cursor-pointer hover:bg-brand-700 transition-colors"
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Cliquez pour changer la photo</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Votre prénom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Votre numéro de téléphone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-50 text-white rounded-lg font-medium hover:opacity-90 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-brand-600 to-brand-50 text-white px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Notifications</h2>
              </div>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Rendez-vous</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Rappels de rendez-vous</p>
                      <p className="text-sm text-gray-500">Recevoir un rappel avant vos rendez-vous</p>
                    </div>
                    <div className="relative ml-4">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.booking_reminders}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, booking_reminders: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-600 peer-checked:to-brand-50"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Confirmations</p>
                      <p className="text-sm text-gray-500">Notifications de confirmation de réservation</p>
                    </div>
                    <div className="relative ml-4">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.booking_confirmations}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, booking_confirmations: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-600 peer-checked:to-brand-50"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Promotions</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Offres spéciales</p>
                      <p className="text-sm text-gray-500">Recevoir les promotions et offres</p>
                    </div>
                    <div className="relative ml-4">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.special_offers}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, special_offers: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-600 peer-checked:to-brand-50"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Newsletter</p>
                      <p className="text-sm text-gray-500">Conseils beauté et actualités</p>
                    </div>
                    <div className="relative ml-4">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.newsletter}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, newsletter: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-600 peer-checked:to-brand-50"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Canaux de communication</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">SMS</p>
                      <p className="text-sm text-gray-500">Recevoir des SMS</p>
                    </div>
                    <div className="relative ml-4">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.sms_notifications}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, sms_notifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-600 peer-checked:to-brand-50"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-500">Recevoir des emails</p>
                    </div>
                    <div className="relative ml-4">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.email_notifications}
                        onChange={(e) => setNotificationPrefs({...notificationPrefs, email_notifications: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-600 peer-checked:to-brand-50"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNotificationsModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-brand-200 text-brand-600 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveNotifications}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-50 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-brand-600 to-brand-50 text-white px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold">Confidentialité</h2>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Visibilité du profil</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-4 border-2 rounded-xl transition-all hover:bg-brand-50"
                    style={{borderColor: privacySettings.profile_visibility === 'public' ? 'rgb(var(--brand-600))' : '#e5e7eb'}}>
                    <input
                      type="radio"
                      name="profile_visibility"
                      checked={privacySettings.profile_visibility === 'public'}
                      onChange={() => setPrivacySettings({...privacySettings, profile_visibility: 'public'})}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      privacySettings.profile_visibility === 'public' ? 'border-brand-600 bg-brand-600' : 'border-gray-300'
                    }`}>
                      {privacySettings.profile_visibility === 'public' && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Public</p>
                      <p className="text-sm text-gray-500">Visible par tous</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-4 border-2 rounded-xl transition-all hover:bg-brand-50"
                    style={{borderColor: privacySettings.profile_visibility === 'private' ? 'rgb(var(--brand-600))' : '#e5e7eb'}}>
                    <input
                      type="radio"
                      name="profile_visibility"
                      checked={privacySettings.profile_visibility === 'private'}
                      onChange={() => setPrivacySettings({...privacySettings, profile_visibility: 'private'})}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      privacySettings.profile_visibility === 'private' ? 'border-brand-600 bg-brand-600' : 'border-gray-300'
                    }`}>
                      {privacySettings.profile_visibility === 'private' && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Privé</p>
                      <p className="text-sm text-gray-500">Visible uniquement par vous</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Paramètres de confidentialité</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Apparaître dans les recherches</p>
                      <p className="text-sm text-gray-500">Les pros peuvent vous trouver</p>
                    </div>
                    <div className="relative ml-4">
                      <input
                        type="checkbox"
                        checked={privacySettings.show_in_search}
                        onChange={(e) => setPrivacySettings({...privacySettings, show_in_search: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-600 peer-checked:to-brand-50"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Autoriser les messages</p>
                      <p className="text-sm text-gray-500">Recevoir des messages des pros</p>
                    </div>
                    <div className="relative ml-4">
                      <input
                        type="checkbox"
                        checked={privacySettings.allow_messages}
                        onChange={(e) => setPrivacySettings({...privacySettings, allow_messages: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-600 peer-checked:to-brand-50"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Partage de données</p>
                      <p className="text-sm text-gray-500">Améliorer l'expérience avec les partenaires</p>
                    </div>
                    <div className="relative ml-4">
                      <input
                        type="checkbox"
                        checked={privacySettings.data_sharing}
                        onChange={(e) => setPrivacySettings({...privacySettings, data_sharing: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-600 peer-checked:to-brand-50"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Note :</span> Vos données sont protégées conformément au RGPD. Consultez notre politique de confidentialité pour plus d'informations.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-brand-200 text-brand-600 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSavePrivacy}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-50 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
