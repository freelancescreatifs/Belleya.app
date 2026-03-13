import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getSectionsForProfessions, getSectionConfig, type ProfessionKey, type ClientSection } from '../../lib/professionHelpers';
import BelayaLoader from '../shared/BelayaLoader';

interface CustomField {
  id: string;
  field_name: string;
  field_type: 'text' | 'select' | 'number' | 'date';
  field_options: string[];
  is_required: boolean;
  display_order: number;
}

interface ClientFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  instagram_handle: string;
  birth_date: string;
  notes: string;
  nail_type: string;
  skin_type: string;
  hair_type: string;
  scalp_type: string;
  lash_type: string;
  brow_type: string;
  skin_conditions: string[];
  is_fidele: boolean;
  is_vip: boolean;
  [key: string]: string | string[] | boolean;
}

interface ClientFormProps {
  isEdit: boolean;
  clientId?: string;
  initialData?: ClientFormData;
  onSubmit: (data: ClientFormData, customData: Record<string, string>) => Promise<void>;
  onClose: () => void;
  source?: 'agenda' | 'clients' | 'other';
}

export default function ClientForm({ isEdit, clientId, initialData, onSubmit, onClose, source = 'other' }: ClientFormProps) {
  const { user } = useAuth();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [visibleSections, setVisibleSections] = useState<ClientSection[]>([]);
  const [formData, setFormData] = useState<ClientFormData>(
    initialData || {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      instagram_handle: '',
      birth_date: '',
      notes: '',
      nail_type: '',
      skin_type: '',
      hair_type: '',
      scalp_type: '',
      lash_type: '',
      brow_type: '',
      skin_conditions: [],
      is_fidele: false,
      is_vip: false,
    }
  );
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    console.log('[ClientForm] mounted', { isEdit, source: isEdit ? 'Edit' : 'Create', fromAgenda: !isEdit });
    loadCompanyProfile();
    loadCustomFields();
    if (isEdit && clientId) {
      loadClientCustomData();
    }
  }, [user, clientId]);

  async function loadCompanyProfile() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('primary_profession, additional_professions')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        const sections = getSectionsForProfessions(
          data.primary_profession as ProfessionKey,
          data.additional_professions as ProfessionKey[]
        );
        setVisibleSections(sections);
      }
    } catch (error) {
      console.error('Error loading company profile:', error);
    }
  }

  async function loadCustomFields() {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('custom_client_fields')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order');

      if (data) {
        setCustomFields(data);
      }
    } catch (error) {
      console.error('Error loading custom fields:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadClientCustomData() {
    if (!clientId) return;

    try {
      const { data } = await supabase
        .from('client_custom_data')
        .select('field_id, field_value')
        .eq('client_id', clientId);

      if (data) {
        const customDataMap: Record<string, string> = {};
        data.forEach(item => {
          customDataMap[item.field_id] = item.field_value || '';
        });
        setCustomData(customDataMap);
      }
    } catch (error) {
      console.error('Error loading client custom data:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[ClientForm] handleSubmit called', { formData, customData, source });
    console.log('[ClientForm] STOP NAVIGATION: preventDefault + stopPropagation');

    if (source === 'agenda') {
      console.log('[ClientForm] ⚠️ VERROU NAVIGATION ACTIF - Source: Agenda');
      console.log('[ClientForm] NO NAVIGATION ALLOWED - formulaire depuis Agenda');
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData, customData);
      console.log('[ClientForm] onSubmit completed successfully');

      if (source === 'agenda') {
        console.log('[ClientForm] ✅ SUCCESS from Agenda - NO NAVIGATION - staying on current page');
      }

      onClose();
    } catch (error: any) {
      console.error('[ClientForm] Error submitting form:', error);
      const errorMessage = error?.message || error?.error_description || 'Une erreur est survenue lors de l\'enregistrement';
      setError(errorMessage);

      if (source === 'agenda') {
        console.error('[ClientForm] ❌ ERROR from Agenda - NO NAVIGATION - staying on Agenda');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleCustomFieldChange(fieldId: string, value: string) {
    setCustomData({ ...customData, [fieldId]: value });
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
          <BelayaLoader variant="inline" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Modifier la cliente' : 'Nouvelle cliente'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <input
                type="text"
                value={formData.instagram_handle}
                onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                placeholder="@username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance
              </label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          {visibleSections.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Informations professionnelles</h3>
              <div className="space-y-4">
                {visibleSections.includes('nails') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type d'ongles
                    </label>
                    <select
                      value={formData.nail_type}
                      onChange={(e) => setFormData({ ...formData, nail_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner</option>
                      <option value="soft">Mous</option>
                      <option value="brittle">Cassants</option>
                      <option value="bitten">Rongés</option>
                      <option value="normal">Normaux</option>
                    </select>
                  </div>
                )}

                {visibleSections.includes('skin') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de peau
                    </label>
                    <select
                      value={formData.skin_type}
                      onChange={(e) => setFormData({ ...formData, skin_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner</option>
                      <option value="dry">Sèche</option>
                      <option value="oily">Grasse</option>
                      <option value="combination">Mixte</option>
                      <option value="sensitive">Sensible</option>
                      <option value="normal">Normale</option>
                    </select>
                  </div>
                )}

                {visibleSections.includes('skin_conditions') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      États de peau
                    </label>
                    <textarea
                      value={formData.skin_conditions.join(', ')}
                      onChange={(e) => setFormData({
                        ...formData,
                        skin_conditions: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      rows={2}
                      placeholder="Acné, rougeurs, cicatrices..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                )}

                {visibleSections.includes('hair') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de cheveux
                    </label>
                    <textarea
                      value={formData.hair_type}
                      onChange={(e) => setFormData({ ...formData, hair_type: e.target.value })}
                      rows={2}
                      placeholder="Texture, épaisseur, couleur, traitements..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                )}

                {visibleSections.includes('scalp') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cuir chevelu
                    </label>
                    <textarea
                      value={formData.scalp_type}
                      onChange={(e) => setFormData({ ...formData, scalp_type: e.target.value })}
                      rows={2}
                      placeholder="État, sensibilité, problèmes..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                )}

                {visibleSections.includes('lashes') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cils
                    </label>
                    <textarea
                      value={formData.lash_type}
                      onChange={(e) => setFormData({ ...formData, lash_type: e.target.value })}
                      rows={2}
                      placeholder="Longueur, densité, sensibilité..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                )}

                {visibleSections.includes('brows') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sourcils
                    </label>
                    <textarea
                      value={formData.brow_type}
                      onChange={(e) => setFormData({ ...formData, brow_type: e.target.value })}
                      rows={2}
                      placeholder="Forme, densité, préférences..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Préférences, allergies, habitudes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-brand-600 hover:to-brand-600 transition-all disabled:opacity-50"
            >
              {submitting ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
