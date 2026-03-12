import { useState, useEffect } from 'react';
import { X, FileText, Calendar, Clock, Phone, AlertCircle, Check, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
}

interface QuoteRequestModalProps {
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
    is_on_quote?: boolean;
  };
  providerId: string;
  companyId: string;
  clientUserId: string;
  preferredDate?: Date | null;
  preferredTime?: string | null;
  onSuccess: () => void;
  onClose: () => void;
}

export default function QuoteRequestModal({
  service,
  providerId,
  companyId,
  clientUserId,
  preferredDate,
  preferredTime,
  onSuccess,
  onClose,
}: QuoteRequestModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [clientPhone, setClientPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [existingPhone, setExistingPhone] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email')
        .eq('user_id', clientUserId)
        .maybeSingle();

      if (profile) {
        setClientName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim());
        setClientEmail(profile.email || '');
      }

      const { data: clientRecord } = await supabase
        .from('clients')
        .select('phone, first_name, last_name, email')
        .eq('user_id', providerId)
        .eq('belaya_user_id', clientUserId)
        .maybeSingle();

      if (clientRecord) {
        if (clientRecord.phone) {
          setClientPhone(clientRecord.phone);
          setExistingPhone(true);
        }
        if (!clientName && clientRecord.first_name) {
          setClientName(`${clientRecord.first_name} ${clientRecord.last_name || ''}`.trim());
        }
        if (!clientEmail && clientRecord.email) {
          setClientEmail(clientRecord.email);
        }
      }

      const { data: questionnaires } = await supabase
        .from('service_questionnaires')
        .select('id, title, description, fields')
        .eq('service_id', service.id)
        .eq('is_active', true)
        .limit(1);

      if (questionnaires && questionnaires.length > 0) {
        setQuestionnaire(questionnaires[0]);
      }
    } catch (err) {
      console.error('Error loading quote data:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleResponseChange(fieldId: string, value: any) {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  }

  function handleCheckboxChange(fieldId: string, option: string, checked: boolean) {
    const current = (responses[fieldId] as string[]) || [];
    if (checked) {
      handleResponseChange(fieldId, [...current, option]);
    } else {
      handleResponseChange(fieldId, current.filter((v: string) => v !== option));
    }
  }

  function validateForm(): boolean {
    if (!clientPhone.trim()) {
      setError('Le numero de telephone est obligatoire');
      return false;
    }

    if (questionnaire) {
      for (const field of questionnaire.fields) {
        if (field.required) {
          const val = responses[field.id];
          if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
            setError(`Le champ "${field.label}" est obligatoire`);
            return false;
          }
        }
      }
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('quote_requests').insert({
        client_user_id: clientUserId,
        provider_user_id: providerId,
        company_id: companyId,
        service_id: service.id,
        preferred_date: preferredDate ? preferredDate.toISOString().split('T')[0] : null,
        preferred_time: preferredTime || null,
        client_phone: clientPhone,
        client_name: clientName,
        client_email: clientEmail,
        questionnaire_responses: responses,
        questionnaire_id: questionnaire?.id || null,
        status: 'pending',
      });

      if (insertError) throw insertError;

      await supabase.from('notifications').insert({
        user_id: providerId,
        type: 'quote_request',
        title: 'Nouvelle demande de devis',
        message: `${clientName || 'Un client'} a fait une demande de devis pour "${service.name}".`,
        company_id: companyId,
      });

      if (!existingPhone && clientPhone) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', providerId)
          .eq('belaya_user_id', clientUserId)
          .maybeSingle();

        if (existingClient) {
          await supabase
            .from('clients')
            .update({ phone: clientPhone })
            .eq('id', existingClient.id);
        }
      }

      setStep('success');
    } catch (err: any) {
      console.error('Error submitting quote request:', err);
      setError(err.message || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(field: QuestionField) {
    const value = responses[field.id];

    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
        return (
          <input
            type={field.type}
            value={value || ''}
            onChange={(e) => handleResponseChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleResponseChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm resize-none"
          />
        );

      case 'select':
        return (
          <div className="relative">
            <select
              value={value || ''}
              onChange={(e) => handleResponseChange(field.id, e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm appearance-none bg-white"
            >
              <option value="">Selectionnez...</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => handleResponseChange(field.id, opt)}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(value as string[] || []).includes(opt)}
                  onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500 rounded"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleResponseChange(field.id, e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
          />
        );
    }
  }

  if (step === 'success') {
    return (
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">Votre demande a bien ete envoyee</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Votre prestataire vous contactera dans les plus brefs delais pour vous proposer un devis ou confirmer un rendez-vous.
        </p>
        <button
          onClick={() => { onSuccess(); onClose(); }}
          className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-50 text-white rounded-lg font-semibold hover:from-brand-700 hover:to-brand-100 transition-all"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
      <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Demande de devis</h3>
            <p className="text-xs text-gray-500">{service.name}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800 leading-relaxed">
                La date que vous selectionnez est <strong>indicative</strong> et ne correspond pas a un rendez-vous confirme.
                Merci de completer le questionnaire afin que votre prestataire puisse etudier votre demande.
              </p>
            </div>

            {(preferredDate || preferredTime) && (
              <div className="flex gap-3">
                {preferredDate && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 flex-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{preferredDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                )}
                {preferredTime && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{preferredTime}</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom <span className="text-gray-400 text-xs">(pre-rempli)</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-gray-50"
                readOnly={!!clientName}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-gray-400 text-xs">(pre-rempli)</span>
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm bg-gray-50"
                readOnly={!!clientEmail}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Telephone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm ${
                    existingPhone ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'
                  }`}
                  readOnly={existingPhone}
                  required
                />
              </div>
              {existingPhone && (
                <p className="text-xs text-gray-400 mt-1">Telephone deja enregistre sur votre fiche</p>
              )}
            </div>

            {questionnaire && (
              <div className="space-y-4">
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{questionnaire.title}</h4>
                  {questionnaire.description && (
                    <p className="text-xs text-gray-500 mb-4">{questionnaire.description}</p>
                  )}
                </div>

                {questionnaire.fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-teal-600 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Envoyer ma demande de devis'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
