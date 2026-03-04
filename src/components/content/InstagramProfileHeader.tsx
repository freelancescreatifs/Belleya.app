import { useState, useEffect } from 'react';
import { Camera, CreditCard as Edit2, Save, X, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface InstagramProfile {
  instagram_profile_photo: string | null;
  instagram_username: string | null;
  instagram_bio: string | null;
  instagram_website: string | null;
  instagram_followers_count: number;
  instagram_following_count: number;
}

interface InstagramProfileHeaderProps {
  postsCount: number;
}

export default function InstagramProfileHeader({ postsCount }: InstagramProfileHeaderProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<InstagramProfile>({
    instagram_profile_photo: null,
    instagram_username: null,
    instagram_bio: null,
    instagram_website: null,
    instagram_followers_count: 0,
    instagram_following_count: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<InstagramProfile>(profile);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function loadProfile() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('instagram_profile_photo, instagram_username, instagram_bio, instagram_website, instagram_followers_count, instagram_following_count')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const profileData = {
          instagram_profile_photo: data.instagram_profile_photo,
          instagram_username: data.instagram_username,
          instagram_bio: data.instagram_bio,
          instagram_website: data.instagram_website,
          instagram_followers_count: data.instagram_followers_count || 0,
          instagram_following_count: data.instagram_following_count || 0,
        };
        setProfile(profileData);
        setEditData(profileData);
      }
    } catch (error) {
      console.error('Error loading Instagram profile:', error);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/instagram-profile-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('content-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-media')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('company_profiles')
        .update({ instagram_profile_photo: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, instagram_profile_photo: publicUrl }));
      setEditData(prev => ({ ...prev, instagram_profile_photo: publicUrl }));
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erreur lors de l\'upload de la photo');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_profiles')
        .update({
          instagram_username: editData.instagram_username,
          instagram_bio: editData.instagram_bio,
          instagram_website: editData.instagram_website,
          instagram_followers_count: editData.instagram_followers_count,
          instagram_following_count: editData.instagram_following_count,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditData(profile);
    setIsEditing(false);
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    return num.toLocaleString('fr-FR');
  };

  return (
    <div className="bg-white p-2">
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-rose-400 via-pink-400 to-orange-400 p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {profile.instagram_profile_photo ? (
                    <img
                      src={profile.instagram_profile_photo}
                      alt="Profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              </div>
              <label className="absolute bottom-0 right-0 p-1.5 bg-orange-500 rounded-full cursor-pointer hover:bg-orange-600 transition-colors">
                <Camera className="w-3 h-3 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={editData.instagram_username || ''}
                onChange={(e) => setEditData({ ...editData, instagram_username: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nom d'utilisateur"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Abonnés</label>
                  <input
                    type="number"
                    min="0"
                    value={editData.instagram_followers_count}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setEditData({ ...editData, instagram_followers_count: value });
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Suivi(e)s</label>
                  <input
                    type="number"
                    min="0"
                    value={editData.instagram_following_count}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setEditData({ ...editData, instagram_following_count: value });
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Biographie</label>
            <textarea
              value={editData.instagram_bio || ''}
              onChange={(e) => setEditData({ ...editData, instagram_bio: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Biographie..."
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Site web</label>
            <input
              type="url"
              value={editData.instagram_website || ''}
              onChange={(e) => setEditData({ ...editData, instagram_website: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 bg-blue-500 text-white text-sm font-semibold rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-0 right-0 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>

          <div className="flex items-center gap-6 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-rose-400 via-pink-400 to-orange-400 p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {profile.instagram_profile_photo ? (
                    <img
                      src={profile.instagram_profile_photo}
                      alt="Profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 flex gap-8 pr-10">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">{postsCount}</div>
                <div className="text-xs text-gray-500">publications</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">{formatNumber(profile.instagram_followers_count)}</div>
                <div className="text-xs text-gray-500">abonnés</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">{formatNumber(profile.instagram_following_count)}</div>
                <div className="text-xs text-gray-500">suivi(e)s</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {profile.instagram_username || 'Nom d\'utilisateur'}
            </h3>

            {profile.instagram_bio && (
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {profile.instagram_bio}
              </p>
            )}

            {profile.instagram_website && (
              <a
                href={profile.instagram_website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-900 font-medium hover:text-blue-700"
              >
                {profile.instagram_website.replace(/^https?:\/\//, '')}
              </a>
            )}

            {!profile.instagram_username && !profile.instagram_bio && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Compléter votre profil
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
