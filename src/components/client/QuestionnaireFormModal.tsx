import { useState } from 'react';
import { X, ClipboardList, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface QuestionField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'date' | 'file';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface Submission {
  id: string;
  questionnaire_title: string;
  questionnaire_description?: string;
  questionnaire_fields: QuestionField[];
  service_name: string;
  company_id: string;
}

interface Props {
  submission: Submission;
  onClose: () => void;
  onCompleted: () => void;
}

export default function QuestionnaireFormModal({ submission, onClose, onCompleted }: Props) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateResponse = (fieldId: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const toggleCheckboxOption = (fieldId: string, option: string) => {
    const current = responses[fieldId] || [];
    const updated = current.includes(option)
      ? current.filter((o: string) => o !== option)
      : [...current, option];
    updateResponse(fieldId, updated);
  };

  const handleSubmit = async () => {
    const missingRequired = submission.questionnaire_fields
      .filter(f => f.required)
      .filter(f => {
        const val = responses[f.id];
        if (Array.isArray(val)) return val.length === 0;
        return !val && val !== 0;
      });

    if (missingRequired.length > 0) {
      setError(`Veuillez remplir les champs obligatoires: ${missingRequired.map(f => f.label).join(', ')}`);
      return;
    }

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('client_questionnaire_submissions')
      .update({
        responses,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', submission.id);

    if (updateError) {
      setError('Erreur lors de l\'envoi. Veuillez reessayer.');
      setSaving(false);
      return;
    }

    const { data: companyData } = await supabase
      .from('company_profiles')
      .select('user_id')
      .eq('id', submission.company_id)
      .maybeSingle();

    if (companyData) {
      await supabase.from('notifications').insert({
        user_id: companyData.user_id,
        type: 'questionnaire_completed',
        title: 'Questionnaire complete',
        message: `Un client a complete le questionnaire "${submission.questionnaire_title}" pour le service "${submission.service_name}".`,
        company_id: submission.company_id,
      });
    }

    setSaving(false);
    onCompleted();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-xl">
              <ClipboardList className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{submission.questionnaire_title}</h3>
              <p className="text-xs text-gray-500">Service: {submission.service_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {submission.questionnaire_fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'text' && (
                <input
                  type="text"
                  value={responses[field.id] || ''}
                  onChange={(e) => updateResponse(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  value={responses[field.id] || ''}
                  onChange={(e) => updateResponse(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={responses[field.id] || ''}
                  onChange={(e) => updateResponse(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              )}

              {field.type === 'date' && (
                <input
                  type="date"
                  value={responses[field.id] || ''}
                  onChange={(e) => updateResponse(field.id, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              )}

              {field.type === 'select' && (
                <select
                  value={responses[field.id] || ''}
                  onChange={(e) => updateResponse(field.id, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Selectionner...</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {field.type === 'radio' && (
                <div className="space-y-2">
                  {(field.options || []).map((opt) => (
                    <label key={opt} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name={field.id}
                        value={opt}
                        checked={responses[field.id] === opt}
                        onChange={() => updateResponse(field.id, opt)}
                        className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'checkbox' && (
                <div className="space-y-2">
                  {(field.options || []).map((opt) => (
                    <label key={opt} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={(responses[field.id] || []).includes(opt)}
                        onChange={() => toggleCheckboxOption(field.id, opt)}
                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'file' && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateResponse(field.id, file.name);
                    }}
                    className="text-sm text-gray-600"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-gray-200 flex gap-3 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors font-medium"
          >
            Plus tard
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {saving ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}
