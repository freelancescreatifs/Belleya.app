import { useState, useEffect } from 'react';
import { Plus, X, Trash2, GripVertical, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ActivityType {
  id: string;
  label: string;
}

interface CustomField {
  id: string;
  field_name: string;
  field_type: 'text' | 'select' | 'number' | 'date';
  field_options: string[];
  is_required: boolean;
  display_order: number;
}

export default function ActivityTypesManager() {
  const { user } = useAuth();
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [fieldForm, setFieldForm] = useState({
    field_name: '',
    field_type: 'text' as 'text' | 'select' | 'number' | 'date',
    field_options: [] as string[],
    is_required: false,
  });
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    try {
      const { data: companyData } = await supabase
        .from('company_profiles')
        .select('activity_types, id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (companyData?.activity_types) {
        setActivityTypes(
          companyData.activity_types.map((label: string, index: number) => ({
            id: `activity-${index}`,
            label,
          }))
        );
      }

      const { data: fieldsData } = await supabase
        .from('custom_client_fields')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order');

      if (fieldsData) {
        setCustomFields(fieldsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveActivityTypes() {
    if (!user) return;
    setSaving(true);

    try {
      const activityLabels = activityTypes.map(a => a.label);

      const { error } = await supabase
        .from('company_profiles')
        .update({ activity_types: activityLabels })
        .eq('user_id', user.id);

      if (error) throw error;
      alert('Types d\'activité sauvegardés');
    } catch (error) {
      console.error('Error saving activity types:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  function handleAddActivity() {
    if (!newActivity.trim()) return;

    setActivityTypes([
      ...activityTypes,
      { id: `activity-${Date.now()}`, label: newActivity.trim() }
    ]);
    setNewActivity('');
  }

  function handleRemoveActivity(id: string) {
    setActivityTypes(activityTypes.filter(a => a.id !== id));
  }

  async function handleSaveCustomField() {
    if (!user || !fieldForm.field_name.trim()) return;
    setSaving(true);

    try {
      const { data: companyData } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (editingField) {
        const { error } = await supabase
          .from('custom_client_fields')
          .update({
            field_name: fieldForm.field_name,
            field_type: fieldForm.field_type,
            field_options: fieldForm.field_options,
            is_required: fieldForm.is_required,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingField.id);

        if (error) throw error;
      } else {
        const maxOrder = customFields.length > 0
          ? Math.max(...customFields.map(f => f.display_order))
          : 0;

        const { error } = await supabase
          .from('custom_client_fields')
          .insert({
            user_id: user.id,
            company_id: companyData?.id || null,
            field_name: fieldForm.field_name,
            field_type: fieldForm.field_type,
            field_options: fieldForm.field_options,
            is_required: fieldForm.is_required,
            display_order: maxOrder + 1,
          });

        if (error) throw error;
      }

      setShowFieldModal(false);
      setEditingField(null);
      setFieldForm({
        field_name: '',
        field_type: 'text',
        field_options: [],
        is_required: false,
      });
      loadData();
    } catch (error) {
      console.error('Error saving custom field:', error);
      alert('Erreur lors de la sauvegarde du champ');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteField(fieldId: string) {
    if (!confirm('Supprimer ce champ personnalisé ? Les données associées seront perdues.')) return;

    try {
      const { error } = await supabase
        .from('custom_client_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('Erreur lors de la suppression');
    }
  }

  function openEditField(field: CustomField) {
    setEditingField(field);
    setFieldForm({
      field_name: field.field_name,
      field_type: field.field_type,
      field_options: field.field_options || [],
      is_required: field.is_required,
    });
    setShowFieldModal(true);
  }

  function handleAddOption() {
    if (!newOption.trim()) return;
    setFieldForm({
      ...fieldForm,
      field_options: [...fieldForm.field_options, newOption.trim()],
    });
    setNewOption('');
  }

  function handleRemoveOption(index: number) {
    setFieldForm({
      ...fieldForm,
      field_options: fieldForm.field_options.filter((_, i) => i !== index),
    });
  }

  if (loading) {
    return <div className="text-gray-500">Chargement...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Types d'activité</h3>
            <p className="text-sm text-gray-600 mt-1">
              Définissez les activités que vous proposez (ongles, cheveux, esthétique, etc.)
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {activityTypes.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
              <span className="flex-1 text-gray-900">{activity.label}</span>
              <button
                onClick={() => handleRemoveActivity(activity.id)}
                className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newActivity}
            onChange={(e) => setNewActivity(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddActivity()}
            placeholder="Nouvelle activité..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
          />
          <button
            onClick={handleAddActivity}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleSaveActivityTypes}
          disabled={saving}
          className="w-full px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50"
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder les types d\'activité'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Champs personnalisés clients</h3>
            <p className="text-sm text-gray-600 mt-1">
              Créez des champs spécifiques pour vos fiches clients (type de peau, longueur cheveux, etc.)
            </p>
          </div>
          <button
            onClick={() => {
              setEditingField(null);
              setFieldForm({
                field_name: '',
                field_type: 'text',
                field_options: [],
                is_required: false,
              });
              setShowFieldModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouveau champ
          </button>
        </div>

        {customFields.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            <SettingsIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun champ personnalisé</p>
            <p className="text-sm mt-1">Cliquez sur "Nouveau champ" pour en créer un</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customFields.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{field.field_name}</span>
                    {field.is_required && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                        Obligatoire
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Type: {field.field_type}
                    {field.field_type === 'select' && field.field_options.length > 0 && (
                      <span className="ml-2">({field.field_options.join(', ')})</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => openEditField(field)}
                  className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteField(field.id)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingField ? 'Modifier le champ' : 'Nouveau champ personnalisé'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du champ *
                </label>
                <input
                  type="text"
                  value={fieldForm.field_name}
                  onChange={(e) => setFieldForm({ ...fieldForm, field_name: e.target.value })}
                  placeholder="Ex: Type de peau, Longueur cheveux..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de champ
                </label>
                <select
                  value={fieldForm.field_type}
                  onChange={(e) => setFieldForm({ ...fieldForm, field_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
                >
                  <option value="text">Texte</option>
                  <option value="select">Liste déroulante</option>
                  <option value="number">Nombre</option>
                  <option value="date">Date</option>
                </select>
              </div>

              {fieldForm.field_type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options de la liste
                  </label>
                  <div className="space-y-2 mb-2">
                    {fieldForm.field_options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="flex-1 px-3 py-2 bg-gray-50 rounded">{option}</span>
                        <button
                          onClick={() => handleRemoveOption(index)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                      placeholder="Nouvelle option..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
                    />
                    <button
                      onClick={handleAddOption}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldForm.is_required}
                    onChange={(e) => setFieldForm({ ...fieldForm, is_required: e.target.checked })}
                    className="w-4 h-4 text-belleya-primary border-gray-300 rounded focus:ring-belleya-primary"
                  />
                  <span className="text-sm text-gray-700">Champ obligatoire</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowFieldModal(false);
                  setEditingField(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveCustomField}
                disabled={saving || !fieldForm.field_name.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50"
              >
                {saving ? 'Sauvegarde...' : editingField ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
