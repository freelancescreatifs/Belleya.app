import { User, Mail, Phone, LogOut, ChevronRight, Image as ImageIcon, Camera, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ClientPhoto {
  id: string;
  photo_url: string;
  service_name: string | null;
  created_at: string;
}

export default function ClientProfile() {
  const { user, profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [myPhotos, setMyPhotos] = useState<ClientPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    photo_url: profile?.photo_url || ''
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-brand-600 to-brand-50 text-white px-4 pt-12 pb-8">
        <div className="flex flex-col items-center">
          {profile?.photo_url ? (
            <img
              src={profile.photo_url}
              alt="Photo de profil"
              className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-white/20"
            />
          ) : (
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold mb-1">
            {profile?.first_name && profile?.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : 'Mon profil'}
          </h1>
          <p className="text-brand-100">Cliente BelleYa</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <h2 className="font-bold text-gray-900 px-4 pt-4 pb-2">
            Ma galerie
          </h2>

          {loadingPhotos ? (
            <div className="px-4 py-8 text-center text-gray-500">
              Chargement...
            </div>
          ) : myPhotos.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Aucune photo pour le moment</p>
              <p className="text-gray-500 text-xs mt-1">
                Vos photos de résultats apparaitront ici
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {myPhotos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square">
                    <img
                      src={photo.photo_url}
                      alt={photo.service_name || 'Photo'}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {photo.service_name && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
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

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <h2 className="font-bold text-gray-900 px-4 pt-4 pb-2">
            Informations personnelles
          </h2>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center gap-3 px-4 py-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>

            {profile?.phone && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Telephone</p>
                  <p className="font-medium text-gray-900">{profile.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <h2 className="font-bold text-gray-900 px-4 pt-4 pb-2">
            Parametres
          </h2>

          <button
            onClick={() => setShowEditModal(true)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-gray-900">Modifier mon profil</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">Notifications</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">Confidentialite</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full bg-white rounded-xl shadow-sm px-4 py-4 flex items-center justify-center gap-2 text-red-600 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-5 h-5" />
          {isSigningOut ? 'Déconnexion en cours...' : 'Deconnexion'}
        </button>

        <div className="text-center text-sm text-gray-500 py-4">
          BelleYa v1.0
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
    </div>
  );
}
