import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Student, StudentStatus } from '../../types/training';

interface Service {
  id: string;
  name: string;
  service_type: string;
  status: string;
}

interface StudentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  student?: Student;
  onStudentCreated?: (studentId: string) => void;
  preselectedFormationId?: string;
  hideFormationField?: boolean;
  source?: 'agenda' | 'training' | 'other';
}

export default function StudentForm({ onClose, onSuccess, student, onStudentCreated, preselectedFormationId, hideFormationField, source = 'other' }: StudentFormProps) {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formations, setFormations] = useState<Service[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(student?.photo_url || null);
  const [uploading, setUploading] = useState(false);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);

  const [formData, setFormData] = useState({
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    instagram_username: student?.instagram_username || '',
    email: student?.email || '',
    phone: student?.phone || '',
    training_start_date: student?.training_start_date || new Date().toISOString().split('T')[0],
    training_end_date: student?.training_end_date || endDate.toISOString().split('T')[0],
    training_level: student?.training_level || '',
    formation_id: student?.formation_id || preselectedFormationId || '',
    internal_notes: student?.internal_notes || '',
    photo_url: student?.photo_url || '',
  });

  useEffect(() => {
    console.log('[StudentForm] mounted', { isEdit: !!student, source: student ? 'Edit' : 'Create', fromAgenda: !student && !!onStudentCreated });
    if (user) {
      loadFormations();
    }
  }, [user]);

  async function loadFormations() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, service_type, status')
        .eq('user_id', user.id)
        .eq('service_type', 'formation')
        .in('status', ['active', 'hidden'])
        .order('name');

      if (error) throw error;
      setFormations(data || []);
    } catch (error) {
      console.error('Error loading formations:', error);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Maximum 5 Mo.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image.');
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile || !user) return null;

    try {
      setUploading(true);
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user.id}/students/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('service-photos')
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('service-photos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[StudentForm] handleSubmit called', { formData, source });
    console.log('[StudentForm] STOP NAVIGATION: preventDefault + stopPropagation');

    if (source === 'agenda') {
      console.log('[StudentForm] ⚠️ VERROU NAVIGATION ACTIF - Source: Agenda');
      console.log('[StudentForm] NO NAVIGATION ALLOWED - formulaire depuis Agenda');
    }

    if (!profile?.company_id) {
      console.error('[StudentForm] No company_id found');
      alert('Erreur: Profil d\'entreprise manquant');
      return;
    }

    setLoading(true);
    try {
      let photoUrl = formData.photo_url;

      if (photoFile) {
        const uploadedUrl = await uploadPhoto();
        if (uploadedUrl) {
          photoUrl = uploadedUrl;

          if (student?.photo_url) {
            const oldPath = student.photo_url.split('/service-photos/')[1];
            if (oldPath) {
              await supabase.storage.from('service-photos').remove([oldPath]);
            }
          }
        }
      }

      const dataToSave = {
        ...formData,
        photo_url: photoUrl,
        formation_id: formData.formation_id || null,
      };

      if (student) {
        const { error } = await supabase
          .from('students')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', student.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        onSuccess();
        onClose();
      } else {
        console.log('═══════════════════════════════════════════════════════');
        console.log('[AgendaCreate] Création élève DEBUT');
        console.log('[AgendaCreate] Table cible: students');
        console.log('[AgendaCreate] Tenant (company_id):', profile.company_id);
        console.log('[AgendaCreate] First name:', dataToSave.first_name);
        console.log('[AgendaCreate] Last name:', dataToSave.last_name);
        console.log('[AgendaCreate] PAYLOAD:', JSON.stringify(dataToSave, null, 2));
        console.log('═══════════════════════════════════════════════════════');

        const { data, error } = await supabase
          .from('students')
          .insert({
            ...dataToSave,
            company_id: profile.company_id,
          })
          .select()
          .single();

        if (error) {
          console.error('═══════════════════════════════════════════════════════');
          console.error('[AgendaCreate] ERREUR INSERT DATABASE:');
          console.error('[AgendaCreate] Error code:', error.code);
          console.error('[AgendaCreate] Error message:', error.message);
          console.error('[AgendaCreate] Error details:', error.details);
          console.error('[AgendaCreate] Error hint:', error.hint);
          console.error('═══════════════════════════════════════════════════════');
          throw error;
        }

        if (!data) {
          console.error('[AgendaCreate] ERREUR: No data returned after insert');
          throw new Error('Aucune donnée retournée après l\'insertion');
        }

        console.log('[AgendaCreate] ✅ INSERT SUCCESS, ID:', data.id);

        console.log('[AgendaCreate] Vérification post-insert...');
        const { data: verifyData, error: verifyError } = await supabase
          .from('students')
          .select('id, first_name, last_name, company_id')
          .eq('id', data.id)
          .maybeSingle();

        if (verifyError) {
          console.error('[AgendaCreate] ⚠️ Erreur vérification:', verifyError);
        } else if (verifyData) {
          console.log('[AgendaCreate] ✅ VERIFICATION SUCCESS:', verifyData);
        } else {
          console.error('[AgendaCreate] ⚠️ Élève non trouvé après insert!');
        }

        if (data && onStudentCreated) {
          console.log('[AgendaCreate] Calling onStudentCreated avec ID:', data.id);
          onStudentCreated(data.id);
        }

        if (source === 'agenda') {
          console.log('[StudentForm] ✅ SUCCESS from Agenda - NO NAVIGATION - staying on current page');
        }

        onSuccess();
        onClose();
        console.log('[AgendaCreate] ✅ PROCESS TERMINE - Modal fermé');
        console.log('═══════════════════════════════════════════════════════');
      }
    } catch (error: any) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('[AgendaCreate] ❌ EXCEPTION CATCHEE:');
      console.error('[AgendaCreate] Error type:', error?.constructor?.name);
      console.error('[AgendaCreate] Error code:', error?.code);
      console.error('[AgendaCreate] Error message:', error?.message);
      console.error('[AgendaCreate] Error details:', error?.details);
      console.error('[AgendaCreate] Full error:', error);
      console.error('═══════════════════════════════════════════════════════');
      console.error('[AgendaCreate] ❌ ERREUR - NE PAS FERMER MODAL - NE PAS NAVIGUER');

      alert(`❌ ERREUR CRÉATION ÉLÈVE\n\nMessage: ${error?.message || 'Erreur inconnue'}\nCode: ${error?.code || 'N/A'}\n\nVoir console (F12) pour détails`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {student ? 'Modifier l\'élève' : 'Nouvel élève'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pseudo Instagram
            </label>
            <input
              type="text"
              value={formData.instagram_username}
              onChange={(e) => setFormData({ ...formData, instagram_username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
              placeholder="@username"
            />
          </div>

          {!hideFormationField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formation suivie
              </label>
              <select
                value={formData.formation_id}
                onChange={(e) => setFormData({ ...formData, formation_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
              >
                <option value="">Sélectionnez une formation</option>
                {formations.map((formation) => (
                  <option key={formation.id} value={formation.id}>
                    {formation.name}
                  </option>
                ))}
              </select>
              {formations.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Créez d'abord des services de type "Formation" dans l'onglet Services
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de début *
              </label>
              <input
                type="date"
                required
                value={formData.training_start_date}
                onChange={(e) => setFormData({ ...formData, training_start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de fin *
              </label>
              <input
                type="date"
                required
                value={formData.training_end_date}
                onChange={(e) => setFormData({ ...formData, training_end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niveau de formation
            </label>
            <select
              value={formData.training_level}
              onChange={(e) => setFormData({ ...formData, training_level: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
            >
              <option value="">Sélectionnez un niveau</option>
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="avance">Avancé</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo de l'élève
            </label>
            <div className="space-y-3">
              {photoPreview && (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Aperçu"
                    className="w-32 h-32 object-cover rounded-full border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-belleya-50 text-belleya-primary rounded-lg hover:bg-belleya-100 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                {uploading && (
                  <span className="text-sm text-gray-500">Upload en cours...</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">ℹ️ Statut automatique</p>
            <p className="text-sm text-blue-700">
              Le statut de l'élève est calculé automatiquement en fonction des dates :
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Avant la date de début → <span className="font-semibold">À venir</span></li>
              <li>Entre début et fin → <span className="font-semibold">En cours</span></li>
              <li>Après la date de fin → <span className="font-semibold">Terminé</span></li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes internes
            </label>
            <textarea
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent resize-none"
              placeholder="Notes personnelles sur l'élève..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-belleya-500 text-white rounded-lg hover:bg-belleya-primary transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : student ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
