import { useState, useEffect } from 'react';
import { X, Mail, MessageSquare, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import {
  ClientReminder,
  replaceTemplateVariables
} from '../../lib/marketingHelpers';

interface Template {
  id: string;
  name: string;
  type: 'sms' | 'email';
  category: string;
  subject: string | null;
  content: string;
  discount_percentage: number | null;
}

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientReminder[];
  channel: 'sms' | 'email';
  userId: string;
  providerName?: string;
}

type Step = 'compose' | 'confirm' | 'result';

interface SendSummary {
  sent: number;
  failed: number;
  total: number;
}

export default function SendReminderModal({
  isOpen,
  onClose,
  clients,
  channel,
  userId,
  providerName = 'votre prestataire'
}: SendReminderModalProps) {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [validUntilDays, setValidUntilDays] = useState<number>(7);
  const [customSubject, setCustomSubject] = useState<string>('');
  const [previewClient, setPreviewClient] = useState<ClientReminder | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('compose');
  const [summary, setSummary] = useState<SendSummary | null>(null);

  useEffect(() => {
    if (isOpen && clients.length > 0) {
      setPreviewClient(clients[0]);
      setStep('compose');
      setSummary(null);
      setError(null);
      loadTemplates();
    }
  }, [isOpen, clients]);

  useEffect(() => {
    if (selectedTemplate && channel === 'email') {
      setCustomSubject(selectedTemplate.subject || `Un message pour vous de ${providerName}`);
    }
  }, [selectedTemplate, channel, providerName]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_templates')
        .select('*')
        .eq('type', channel)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);

      if (data && data.length > 0) {
        const defaultTemplate = data.find(t =>
          t.category === clients[0]?.reminder_type
        ) || data[0];

        setSelectedTemplate(defaultTemplate);
        setCustomDiscount(defaultTemplate.discount_percentage || 0);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const getValidUntilDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + validUntilDays);
    return d.toISOString();
  };

  const getPreviewMessage = () => {
    if (!selectedTemplate || !previewClient) return '';
    return replaceTemplateVariables(
      selectedTemplate.content,
      previewClient,
      customDiscount,
      getValidUntilDate()
    );
  };

  const clientsWithContact = clients.filter(c =>
    channel === 'sms' ? !!c.phone : !!c.email
  );

  const clientsWithoutContact = clients.filter(c =>
    channel === 'sms' ? !c.phone : !c.email
  );

  const handleConfirm = () => {
    if (!selectedTemplate) return;
    if (clientsWithContact.length === 0) {
      setError(`Aucune cliente sélectionnée n'a de ${channel === 'sms' ? 'numéro de téléphone' : 'adresse email'}.`);
      return;
    }
    setError(null);
    setStep('confirm');
  };

  const handleSend = async () => {
    if (!selectedTemplate) return;

    setSending(true);
    setError(null);

    try {
      const validUntil = getValidUntilDate();
      const now = new Date().toISOString();

      const sends = clientsWithContact.map(client => ({
        user_id: userId,
        template_id: selectedTemplate.id,
        client_id: client.client_id,
        channel,
        subject: channel === 'email' ? (customSubject || selectedTemplate.subject) : null,
        content: replaceTemplateVariables(
          selectedTemplate.content,
          client,
          customDiscount,
          validUntil
        ),
        status: 'pending',
        created_at: now
      }));

      const { data: insertedRows, error: insertError } = await supabase
        .from('marketing_sends')
        .insert(sends)
        .select('id, client_id, content, subject');

      if (insertError) throw insertError;

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const edgeSends = (insertedRows || []).map((row: any) => {
        const client = clientsWithContact.find(c => c.client_id === row.client_id);
        return {
          send_id: row.id,
          client_id: row.client_id,
          first_name: client?.first_name || '',
          email: client?.email || null,
          phone: client?.phone || null,
          subject: row.subject,
          content: row.content
        };
      });

      const response = await fetch(`${supabaseUrl}/functions/v1/send-marketing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': anonKey
        },
        body: JSON.stringify({
          channel,
          sends: edgeSends,
          provider_name: providerName
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'envoi');
      }

      const { summary: sendSummary, results } = result;

      const updatePromises = (results || []).map((r: any) =>
        supabase
          .from('marketing_sends')
          .update({
            status: r.status,
            sent_at: r.status === 'sent' ? now : null,
            error_message: r.error || null
          })
          .eq('id', r.send_id)
      );

      await Promise.all(updatePromises);

      setSummary(sendSummary);
      setStep('result');

      if (sendSummary.failed === 0) {
        showToast('success', `${sendSummary.sent} ${channel === 'sms' ? 'SMS' : 'email(s)'} envoyé(s) avec succès`);
      } else if (sendSummary.sent > 0) {
        showToast('warning', `Certains messages n'ont pas pu être envoyés (${sendSummary.failed} échec(s))`);
      } else {
        showToast('error', `Échec de l'envoi — aucun message n'a été transmis`);
      }
    } catch (err: any) {
      console.error('Error sending reminders:', err);
      setError(err.message || 'Erreur lors de l\'envoi');
      showToast('error', err.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const totalRevenue = clients.reduce((sum, c) => sum + c.average_basket, 0);
  const channelLabel = channel === 'sms' ? 'SMS' : 'Email';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'result' ? 'Envoi terminé' : `Envoi par ${channelLabel}`}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {clients.length} cliente{clients.length > 1 ? 's' : ''} • {channelLabel} • CA potentiel: {totalRevenue.toFixed(0)} €
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {step === 'compose' && (
            <>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template de message
                </label>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value);
                    setSelectedTemplate(template || null);
                    if (template) setCustomDiscount(template.discount_percentage || 0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              {channel === 'email' && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objet de l'email
                  </label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder={`Un message pour vous de ${providerName}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remise proposée (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valable pendant (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={validUntilDays}
                    onChange={(e) => setValidUntilDays(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>

              {previewClient && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Prévisualisation
                    </label>
                    <select
                      value={previewClient.client_id}
                      onChange={(e) => {
                        const client = clients.find(c => c.client_id === e.target.value);
                        if (client) setPreviewClient(client);
                      }}
                      className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-1 focus:ring-pink-500"
                    >
                      {clients.map((client) => (
                        <option key={client.client_id} value={client.client_id}>
                          {client.first_name} {client.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    {channel === 'email' && customSubject && (
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Objet</div>
                        <div className="font-medium text-gray-900 text-sm">{customSubject}</div>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                      {getPreviewMessage()}
                    </div>
                  </div>
                </div>
              )}

              {clientsWithoutContact.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    {clientsWithoutContact.length} cliente{clientsWithoutContact.length > 1 ? 's' : ''} sans {channel === 'sms' ? 'numéro' : 'email'} sera ignorée{clientsWithoutContact.length > 1 ? 's' : ''}.
                    {clientsWithContact.length} message{clientsWithContact.length > 1 ? 's' : ''} sera{clientsWithContact.length > 1 ? 'ont' : ''} envoyé{clientsWithContact.length > 1 ? 's' : ''}.
                  </p>
                </div>
              )}
            </>
          )}

          {step === 'confirm' && (
            <div className="py-4">
              <div className="flex flex-col items-center text-center mb-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  channel === 'sms' ? 'bg-rose-100' : 'bg-pink-100'
                }`}>
                  {channel === 'sms'
                    ? <MessageSquare className="w-8 h-8 text-rose-500" />
                    : <Mail className="w-8 h-8 text-pink-600" />
                  }
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirmer l'envoi</h3>
                <p className="text-gray-600 text-base">
                  Vous allez envoyer{' '}
                  <span className="font-semibold text-gray-900">{clientsWithContact.length} {channelLabel}{clientsWithContact.length > 1 ? 's' : ''}</span>{' '}
                  à{' '}
                  <span className="font-semibold text-gray-900">{clientsWithContact.length} cliente{clientsWithContact.length > 1 ? 's' : ''}</span>.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl divide-y divide-gray-100 mb-6">
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-gray-500">Canal</span>
                  <span className="font-medium text-gray-900">{channelLabel}</span>
                </div>
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-gray-500">Destinataires</span>
                  <span className="font-medium text-gray-900">{clientsWithContact.length} clientes</span>
                </div>
                {channel === 'email' && customSubject && (
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-gray-500">Objet</span>
                    <span className="font-medium text-gray-900 max-w-[60%] text-right">{customSubject}</span>
                  </div>
                )}
                {customDiscount > 0 && (
                  <div className="px-4 py-3 flex justify-between text-sm">
                    <span className="text-gray-500">Remise</span>
                    <span className="font-medium text-pink-600">-{customDiscount}%</span>
                  </div>
                )}
                <div className="px-4 py-3 flex justify-between text-sm">
                  <span className="text-gray-500">CA potentiel</span>
                  <span className="font-medium text-gray-900">{totalRevenue.toFixed(0)} €</span>
                </div>
              </div>

              {clientsWithoutContact.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                  {clientsWithoutContact.length} cliente{clientsWithoutContact.length > 1 ? 's' : ''} ignorée{clientsWithoutContact.length > 1 ? 's' : ''} (sans {channel === 'sms' ? 'téléphone' : 'email'}).
                </div>
              )}
            </div>
          )}

          {step === 'result' && summary && (
            <div className="py-4 flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                summary.failed === 0 ? 'bg-green-100' : summary.sent > 0 ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                <CheckCircle className={`w-8 h-8 ${
                  summary.failed === 0 ? 'text-green-500' : summary.sent > 0 ? 'text-amber-500' : 'text-red-500'
                }`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {summary.failed === 0 ? 'Envoi réussi !' : summary.sent > 0 ? 'Envoi partiel' : 'Échec de l\'envoi'}
              </h3>

              <div className="flex gap-6 mt-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{summary.sent}</div>
                  <div className="text-sm text-gray-500 mt-1">Envoyé{summary.sent > 1 ? 's' : ''}</div>
                </div>
                {summary.failed > 0 && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">{summary.failed}</div>
                    <div className="text-sm text-gray-500 mt-1">Échec{summary.failed > 1 ? 's' : ''}</div>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500">
                Les envois sont enregistrés dans l'historique.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
          {step === 'compose' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedTemplate}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  channel === 'sms'
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'bg-pink-600 hover:bg-pink-700'
                }`}
              >
                {channel === 'sms'
                  ? <MessageSquare className="w-4 h-4" />
                  : <Mail className="w-4 h-4" />
                }
                Continuer
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <button
                onClick={() => setStep('compose')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                disabled={sending}
              >
                Retour
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  channel === 'sms'
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'bg-pink-600 hover:bg-pink-700'
                }`}
              >
                <Send className="w-4 h-4" />
                {sending ? 'Envoi en cours...' : `Envoyer ${clientsWithContact.length} ${channelLabel}${clientsWithContact.length > 1 ? 's' : ''}`}
              </button>
            </>
          )}

          {step === 'result' && (
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
