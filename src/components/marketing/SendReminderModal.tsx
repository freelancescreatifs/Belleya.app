import { useState, useEffect } from 'react';
import { X, Mail, MessageSquare, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  ClientReminder,
  replaceTemplateVariables,
  getDefaultDiscount
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
}

export default function SendReminderModal({
  isOpen,
  onClose,
  clients,
  channel,
  userId
}: SendReminderModalProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [validUntilDays, setValidUntilDays] = useState<number>(7);
  const [previewClient, setPreviewClient] = useState<ClientReminder | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && clients.length > 0) {
      setPreviewClient(clients[0]);
      loadTemplates();
    }
  }, [isOpen, clients]);

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

  const getPreviewMessage = () => {
    if (!selectedTemplate || !previewClient) return '';

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validUntilDays);

    return replaceTemplateVariables(
      selectedTemplate.content,
      previewClient,
      customDiscount,
      validUntil.toISOString()
    );
  };

  const handleSend = async () => {
    if (!selectedTemplate) return;

    setSending(true);
    setError(null);

    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validUntilDays);

      const sends = clients.map(client => ({
        user_id: userId,
        template_id: selectedTemplate.id,
        client_id: client.client_id,
        channel: channel,
        subject: channel === 'email' ? selectedTemplate.subject : null,
        content: replaceTemplateVariables(
          selectedTemplate.content,
          client,
          customDiscount,
          validUntil.toISOString()
        ),
        status: 'pending',
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('marketing_sends')
        .insert(sends);

      if (insertError) throw insertError;

      onClose();
      window.location.reload();
    } catch (err: any) {
      console.error('Error sending reminders:', err);
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const totalRevenue = clients.reduce((sum, c) => sum + c.average_basket, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Prévisualisation et envoi
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {clients.length} cliente{clients.length > 1 ? 's' : ''} • {channel === 'sms' ? 'SMS' : 'Email'} • CA potentiel: {totalRevenue.toFixed(0)} €
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template de message
            </label>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find(t => t.id === e.target.value);
                setSelectedTemplate(template || null);
                if (template) {
                  setCustomDiscount(template.discount_percentage || 0);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {previewClient && (
            <div className="mb-6">
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
                  className="text-sm px-3 py-1 border border-gray-300 rounded-lg"
                >
                  {clients.map((client) => (
                    <option key={client.client_id} value={client.client_id}>
                      {client.first_name} {client.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                {channel === 'email' && selectedTemplate?.subject && (
                  <div className="mb-3 pb-3 border-b border-gray-300">
                    <div className="text-xs text-gray-500 mb-1">Objet:</div>
                    <div className="font-medium text-gray-900">
                      {selectedTemplate.subject}
                    </div>
                  </div>
                )}
                <div className="whitespace-pre-wrap text-sm text-gray-900">
                  {getPreviewMessage()}
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Avant d'envoyer</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Vérifiez que le message est personnalisé et adapté</li>
              <li>• L'envoi sera enregistré dans l'historique</li>
              <li>• Les messages sont prêts à être envoyés manuellement</li>
              <li>• Pour l'instant, l'envoi automatique n'est pas actif (V2)</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
            disabled={sending}
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !selectedTemplate}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {channel === 'sms' ? (
              <MessageSquare className="w-4 h-4" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            {sending ? 'Envoi en cours...' : `Préparer l'envoi`}
          </button>
        </div>
      </div>
    </div>
  );
}
