import React, { useState, useEffect } from 'react';
import { Upload, X, Plus, Trash2, Image as ImageIcon, User, MapPin, GraduationCap, FileText, Users, CreditCard, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Diploma {
  id: string;
  name: string;
  year?: string;
}

interface InstitutePhoto {
  id: string;
  url: string;
  order: number;
}

interface Condition {
  id: string;
  text: string;
  createdAt: string;
}

interface PersonalProfile {
  profile_photo: string | null;
  bio: string | null;
  address: string | null;
  country: string;
  diplomas: Diploma[];
  institute_photos: InstitutePhoto[];
  conditions: Condition[];
  allow_companion: boolean;
  max_companions: number;
  stripe_account_id: string | null;
  stripe_connected: boolean;
  paypal_email: string | null;
  paypal_connected: boolean;
}

const COUNTRIES = [
  'France', 'Belgique', 'Suisse', 'Canada', 'Luxembourg', 'Monaco', 'Autre'
];

export default function PersonalProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<PersonalProfile>({
    profile_photo: null,
    bio: null,
    address: null,
    country: 'France',
    diplomas: [],
    institute_photos: [],
    conditions: [],
    allow_companion: false,
    max_companions: 0,
    stripe_account_id: null,
    stripe_connected: false,
    paypal_email: null,
    paypal_connected: false
  });

  const [newCondition, setNewCondition] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingInstitute, setUploadingInstitute] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCompanyId(data.id);
        setProfile({
          profile_photo: data.profile_photo || null,
          bio: data.bio || null,
          address: data.address || null,
          country: data.country || 'France',
          diplomas: data.diplomas || [],
          institute_photos: data.institute_photos || [],
          conditions: data.conditions || [],
          allow_companion: data.allow_companion || false,
          max_companions: data.max_companions || 0,
          stripe_account_id: data.stripe_account_id || null,
          stripe_connected: data.stripe_connected || false,
          paypal_email: data.paypal_email || null,
          paypal_connected: data.paypal_connected || false
        });
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_profiles')
        .update({
          profile_photo: profile.profile_photo,
          bio: profile.bio,
          address: profile.address,
          country: profile.country,
          diplomas: profile.diplomas,
          institute_photos: profile.institute_photos,
          conditions: profile.conditions,
          allow_companion: profile.allow_companion,
          max_companions: profile.max_companions,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId);

      if (error) throw error;

      alert('Profil enregistré avec succès');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!companyId) return;

    setUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setProfile({ ...profile, profile_photo: publicUrl });
    } catch (error) {
      console.error('Erreur upload photo:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadInstitutePhoto = async (file: File) => {
    if (!companyId) return;

    setUploadingInstitute(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/institute-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('institute-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('institute-photos')
        .getPublicUrl(fileName);

      const newPhoto: InstitutePhoto = {
        id: Date.now().toString(),
        url: publicUrl,
        order: profile.institute_photos.length
      };

      setProfile({
        ...profile,
        institute_photos: [...profile.institute_photos, newPhoto]
      });
    } catch (error) {
      console.error('Erreur upload photo institut:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setUploadingInstitute(false);
    }
  };

  const removeInstitutePhoto = (id: string) => {
    setProfile({
      ...profile,
      institute_photos: profile.institute_photos.filter(p => p.id !== id)
    });
  };

  const addDiploma = () => {
    const newDiploma: Diploma = {
      id: Date.now().toString(),
      name: '',
      year: ''
    };
    setProfile({
      ...profile,
      diplomas: [...profile.diplomas, newDiploma]
    });
  };

  const updateDiploma = (id: string, field: 'name' | 'year', value: string) => {
    setProfile({
      ...profile,
      diplomas: profile.diplomas.map(d =>
        d.id === id ? { ...d, [field]: value } : d
      )
    });
  };

  const removeDiploma = (id: string) => {
    setProfile({
      ...profile,
      diplomas: profile.diplomas.filter(d => d.id !== id)
    });
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;

    const condition: Condition = {
      id: Date.now().toString(),
      text: newCondition.trim(),
      createdAt: new Date().toISOString()
    };

    setProfile({
      ...profile,
      conditions: [...profile.conditions, condition]
    });

    setNewCondition('');
  };

  const removeCondition = (id: string) => {
    setProfile({
      ...profile,
      conditions: profile.conditions.filter(c => c.id !== id)
    });
  };

  const connectStripe = () => {
    alert('La connexion Stripe sera implémentée prochainement');
  };

  const connectPayPal = () => {
    alert('La connexion PayPal sera implémentée prochainement');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section Identité & Présentation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Identité & Présentation</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo de profil
            </label>
            <div className="flex items-center gap-4">
              {profile.profile_photo ? (
                <div className="relative">
                  <img
                    src={profile.profile_photo}
                    alt="Photo de profil"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    onClick={() => setProfile({ ...profile, profile_photo: null })}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <User className="w-8 h-8 text-gray-400" />
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
                <div className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  {uploadingPhoto ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Télécharger
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biographie / Présentation
            </label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
              maxLength={500}
              placeholder="Présentez-vous en quelques mots..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {(profile.bio || '').length}/500 caractères
            </p>
          </div>
        </div>
      </div>

      {/* Section Localisation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Localisation</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse postale
            </label>
            <textarea
              value={profile.address || ''}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              rows={3}
              placeholder="123 Rue de la République&#10;75001 Paris"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pays
            </label>
            <select
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section Diplômes & Institut */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Diplômes & Institut</h3>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Diplômes
              </label>
              <button
                onClick={addDiploma}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            <div className="space-y-2">
              {profile.diplomas.map((diploma) => (
                <div key={diploma.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={diploma.name}
                    onChange={(e) => updateDiploma(diploma.id, 'name', e.target.value)}
                    placeholder="Nom du diplôme"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={diploma.year || ''}
                    onChange={(e) => updateDiploma(diploma.id, 'year', e.target.value)}
                    placeholder="Année"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeDiploma(diploma.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {profile.diplomas.length === 0 && (
                <p className="text-sm text-gray-500 italic">Aucun diplôme ajouté</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Photos de l'institut
              </label>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadInstitutePhoto(file);
                  }}
                  className="hidden"
                  disabled={uploadingInstitute}
                />
                <div className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
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
              {profile.institute_photos.map((photo) => (
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

              {profile.institute_photos.length === 0 && (
                <div className="col-span-3 flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Aucune photo ajoutée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Conditions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Conditions d'acceptation</h3>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') addCondition();
              }}
              placeholder="Ex: Je n'accepte pas une personne qui n'est jamais venue 3 fois de suite"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={addCondition}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>

          <div className="space-y-2">
            {profile.conditions.map((condition) => (
              <div
                key={condition.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="flex-1 text-sm text-gray-700">{condition.text}</p>
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {profile.conditions.length === 0 && (
              <p className="text-sm text-gray-500 italic">Aucune condition définie</p>
            )}
          </div>
        </div>
      </div>

      {/* Section Accompagnant */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Accompagnant</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.allow_companion}
                onChange={(e) => setProfile({
                  ...profile,
                  allow_companion: e.target.checked,
                  max_companions: e.target.checked ? profile.max_companions : 0
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-700">
              Autoriser les accompagnants
            </span>
          </div>

          {profile.allow_companion && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre maximum d'accompagnants
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={profile.max_companions}
                onChange={(e) => setProfile({ ...profile, max_companions: parseInt(e.target.value) || 0 })}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section Paiements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Paiements en ligne</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Stripe</p>
                <p className="text-sm text-gray-500">
                  {profile.stripe_connected ? (
                    <span className="text-belaya-bright flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Connecté
                    </span>
                  ) : (
                    'Non connecté'
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={connectStripe}
              className={`px-4 py-2 rounded-lg ${
                profile.stripe_connected
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {profile.stripe_connected ? 'Déconnecter' : 'Connecter'}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">PayPal</p>
                <p className="text-sm text-gray-500">
                  {profile.paypal_connected ? (
                    <span className="text-belaya-bright flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Connecté: {profile.paypal_email}
                    </span>
                  ) : (
                    'Non connecté'
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={connectPayPal}
              className={`px-4 py-2 rounded-lg ${
                profile.paypal_connected
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {profile.paypal_connected ? 'Déconnecter' : 'Connecter'}
            </button>
          </div>
        </div>
      </div>

      {/* Bouton Enregistrer */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Enregistrement...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Enregistrer le profil
            </>
          )}
        </button>
      </div>
    </div>
  );
}
