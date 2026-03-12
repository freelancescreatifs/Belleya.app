import { useState, useEffect } from 'react';
import { Plus, Trash2, X, GripVertical, ChevronDown, ChevronUp, Save, ClipboardList, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface QuestionField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date' | 'file';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface Questionnaire {
  id: string;
  title: string;
  description: string;
  fields: QuestionField[];
  is_active: boolean;
  send_once_only: boolean;
}

interface Props {
  serviceId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texte court' },
  { value: 'textarea', label: 'Texte long' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Liste deroulante' },
  { value: 'radio', label: 'Choix unique' },
  { value: 'checkbox', label: 'Cases a cocher' },
  { value: 'file', label: 'Fichier / Photo' },
];

export default function QuestionnaireBuilder({ serviceId, onClose, onUpdate }: Props) {
  const { user } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formFields, setFormFields] = useState<QuestionField[]>([]);
  const [sendOnceOnly, setSendOnceOnly] = useState(true);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  useEffect(() => {
    loadQuestionnaires();
  }, [serviceId]);

  const loadQuestionnaires = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('service_questionnaires')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at');

    if (data) {
      setQuestionnaires(data.map(q => ({
        ...q,
        fields: Array.isArray(q.fields) ? q.fields : []
      })));
    }
    setLoading(false);
  };

  const generateFieldId = () => `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const addField = () => {
    const newField: QuestionField = {
      id: generateFieldId(),
      label: '',
      type: 'text',
      required: false,
      options: [],
      placeholder: '',
    };
    setFormFields([...formFields, newField]);
    setExpandedField(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<QuestionField>) => {
    setFormFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const removeField = (fieldId: string) => {
    setFormFields(prev => prev.filter(f => f.id !== fieldId));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...formFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFormFields(newFields);
  };

  const startEdit = (questionnaire: Questionnaire) => {
    setEditingId(questionnaire.id);
    setFormTitle(questionnaire.title);
    setFormDescription(questionnaire.description || '');
    setFormFields(questionnaire.fields);
    setSendOnceOnly(questionnaire.send_once_only);
    setShowNewForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
    setFormFields([]);
    setSendOnceOnly(true);
    setShowNewForm(false);
    setExpandedField(null);
  };

  const handleSave = async () => {
    if (!user || !formTitle.trim()) return;

    const validFields = formFields.filter(f => f.label.trim());
    if (validFields.length === 0) return;

    setSaving(true);

    const payload = {
      service_id: serviceId,
      user_id: user.id,
      title: formTitle.trim(),
      description: formDescription.trim(),
      fields: validFields,
      send_once_only: sendOnceOnly,
    };

    if (editingId) {
      await supabase
        .from('service_questionnaires')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editingId);
    } else {
      await supabase
        .from('service_questionnaires')
        .insert(payload);
    }

    setSaving(false);
    resetForm();
    loadQuestionnaires();
    onUpdate?.();
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    await supabase
      .from('service_questionnaires')
      .update({ is_active: !currentState })
      .eq('id', id);
    loadQuestionnaires();
    onUpdate?.();
  };

  const deleteQuestionnaire = async (id: string) => {
    if (!confirm('Supprimer ce questionnaire ? Les reponses existantes seront conservees.')) return;
    await supabase
      .from('service_questionnaires')
      .delete()
      .eq('id', id);
    loadQuestionnaires();
    onUpdate?.();
  };

  const needsOptions = (type: string) => ['select', 'radio', 'checkbox'].includes(type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-lg">
              <ClipboardList className="w-5 h-5 text-brand-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Questionnaires du service</h3>
              <p className="text-xs text-gray-500">Crees des formulaires envoyes automatiquement aux clients</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : !showNewForm ? (
            <div className="space-y-4">
              {questionnaires.length === 0 && (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Aucun questionnaire pour ce service</p>
                  <p className="text-gray-400 text-xs mt-1">Creez un questionnaire pour recueillir des informations avant la prestation</p>
                </div>
              )}

              {questionnaires.map((q) => (
                <div key={q.id} className={`border rounded-xl p-4 transition-all ${q.is_active ? 'border-brand-200 bg-brand-50/50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{q.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${q.is_active ? 'bg-brand-200 text-brand-800' : 'bg-gray-200 text-gray-600'}`}>
                          {q.is_active ? 'Actif' : 'Inactif'}
                        </span>
                        {q.send_once_only && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">1 seule fois</span>
                        )}
                      </div>
                      {q.description && <p className="text-xs text-gray-600 mb-2">{q.description}</p>}
                      <p className="text-xs text-gray-500">{q.fields.length} question{q.fields.length > 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleActive(q.id, q.is_active)}
                        className={`p-1.5 rounded-lg transition-colors ${q.is_active ? 'text-brand-600 hover:bg-brand-100' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={q.is_active ? 'Desactiver' : 'Activer'}
                      >
                        {q.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => startEdit(q)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => deleteQuestionnaire(q.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setShowNewForm(true)}
                className="w-full py-3 border-2 border-dashed border-brand-300 rounded-xl text-brand-700 font-medium hover:bg-brand-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Creer un questionnaire
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre du questionnaire *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Fiche client - Soins du visage"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnelle)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Informations pour la cliente..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  checked={sendOnceOnly}
                  onChange={(e) => setSendOnceOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-blue-900">Envoyer une seule fois par client</span>
                  <p className="text-xs text-blue-700">Le questionnaire ne sera pas renvoye si le client a deja reserve ce service</p>
                </div>
              </label>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Questions ({formFields.length})</label>
                  <button
                    type="button"
                    onClick={addField}
                    className="px-3 py-1.5 text-xs font-medium bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Ajouter
                  </button>
                </div>

                {formFields.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-sm text-gray-500">Ajoutez des questions a votre questionnaire</p>
                  </div>
                )}

                <div className="space-y-3">
                  {formFields.map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div
                        className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedField(expandedField === field.id ? null : field.id)}
                      >
                        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900">
                            {field.label || `Question ${index + 1}`}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({FIELD_TYPES.find(t => t.value === field.type)?.label})
                          </span>
                          {field.required && <span className="ml-1 text-red-500 text-xs">*</span>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }}
                            disabled={index === formFields.length - 1}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {expandedField === field.id && (
                        <div className="p-4 space-y-3 border-t border-gray-200">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Intitule de la question *</label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              placeholder="Ex: Avez-vous des allergies ?"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Type de reponse</label>
                              <select
                                value={field.type}
                                onChange={(e) => updateField(field.id, { type: e.target.value as QuestionField['type'] })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                              >
                                {FIELD_TYPES.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer pb-2">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                />
                                <span className="text-sm text-gray-700">Obligatoire</span>
                              </label>
                            </div>
                          </div>

                          {!needsOptions(field.type) && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder (optionnel)</label>
                              <input
                                type="text"
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                placeholder="Texte d'aide..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                              />
                            </div>
                          )}

                          {needsOptions(field.type) && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Options (une par ligne)</label>
                              <textarea
                                value={(field.options || []).join('\n')}
                                onChange={(e) => updateField(field.id, { options: e.target.value.split('\n') })}
                                onBlur={(e) => updateField(field.id, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                                rows={4}
                                placeholder={"Option 1\nOption 2\nOption 3"}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                              />
                              <p className="text-xs text-gray-400 mt-1">Appuyez sur Entree pour ajouter une nouvelle option</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 flex gap-3 justify-end bg-gray-50 rounded-b-xl flex-shrink-0">
          {showNewForm ? (
            <>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formTitle.trim() || formFields.filter(f => f.label.trim()).length === 0}
                className="px-6 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Enregistrement...' : editingId ? 'Mettre a jour' : 'Creer'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
