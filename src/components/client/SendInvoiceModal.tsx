import { useState } from 'react';
import { X, Mail, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { sendInvoiceEmail, sendInvoiceSMS, InvoiceWithDetails } from '../../lib/invoiceHelpers';
import { useToast } from '../../hooks/useToast';

interface SendInvoiceModalProps {
  invoice: InvoiceWithDetails;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SendInvoiceModal({
  invoice,
  onClose,
  onSuccess,
}: SendInvoiceModalProps) {
  const [sendEmail, setSendEmail] = useState(!!invoice.client?.email);
  const [sendSMS, setSendSMS] = useState(!!invoice.client?.phone);
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const clientName = invoice.client?.first_name || 'Client';
  const hasEmail = !!invoice.client?.email;
  const hasPhone = !!invoice.client?.phone;

  const appointmentDate = invoice.appointment
    ? new Date(invoice.appointment.start_time).toLocaleDateString('fr-FR')
    : '';

  const itemsList = invoice.items
    .map(item => {
      const quantityText = item.quantity > 1 ? ` x${item.quantity}` : '';
      return `${item.label}${quantityText} (${item.line_total.toFixed(2)}€)`;
    })
    .join(', ');

  const defaultMessage = `Bonjour ${clientName}, merci pour votre visite${appointmentDate ? ` le ${appointmentDate}` : ''}. Voici votre récap : ${itemsList}. Total : ${invoice.total.toFixed(2)}€. À bientôt ! 💗`;

  const messagePreview = customMessage || defaultMessage;

  const handleSend = async () => {
    if (!sendEmail && !sendSMS) {
      showToast('error', 'Veuillez sélectionner au moins un canal d\'envoi');
      return;
    }

    setLoading(true);

    try {
      const results = [];

      if (sendEmail && hasEmail) {
        const emailResult = await sendInvoiceEmail(invoice.id!, customMessage || undefined);
        results.push({ channel: 'email', ...emailResult });
      }

      if (sendSMS && hasPhone) {
        const smsResult = await sendInvoiceSMS(invoice.id!, customMessage || undefined);
        results.push({ channel: 'sms', ...smsResult });
      }

      const allSuccess = results.every(r => r.success);
      const someSuccess = results.some(r => r.success);

      if (allSuccess) {
        showToast('success', 'Récap envoyé avec succès');
        onSuccess?.();
        onClose();
      } else if (someSuccess) {
        const failedChannels = results
          .filter(r => !r.success)
          .map(r => r.channel === 'email' ? 'Email' : 'SMS')
          .join(', ');
        showToast('warning', `Envoi partiel : échec pour ${failedChannels}`);
        onSuccess?.();
        onClose();
      } else {
        const errors = results.map(r => r.error).filter(Boolean).join(', ');
        showToast('error', errors || 'Échec de l\'envoi');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      showToast('error', 'Erreur lors de l\'envoi du récap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Envoyer le récap</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!hasEmail && !hasPhone && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Aucune coordonnée disponible</p>
                <p className="mt-1">Cette cliente n'a ni email ni téléphone enregistré. Vous ne pourrez pas envoyer le récap automatiquement.</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Canaux d'envoi
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                  sendEmail && hasEmail
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 bg-gray-50'
                } ${!hasEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  disabled={!hasEmail}
                  className="w-5 h-5 text-brand-600 rounded focus:ring-2 focus:ring-brand-500"
                />
                <Mail className="w-5 h-5 text-brand-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Email</p>
                  {hasEmail ? (
                    <p className="text-sm text-gray-600">{invoice.client?.email}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Email non renseigné</p>
                  )}
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                  sendSMS && hasPhone
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 bg-gray-50'
                } ${!hasPhone ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={sendSMS}
                  onChange={(e) => setSendSMS(e.target.checked)}
                  disabled={!hasPhone}
                  className="w-5 h-5 text-brand-600 rounded focus:ring-2 focus:ring-brand-500"
                />
                <MessageSquare className="w-5 h-5 text-brand-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">SMS</p>
                  {hasPhone ? (
                    <p className="text-sm text-gray-600">{invoice.client?.phone}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Téléphone non renseigné</p>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message personnalisé (optionnel)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              placeholder={defaultMessage}
            />
            <p className="mt-2 text-xs text-gray-500">
              Laissez vide pour utiliser le message par défaut
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
              <span>👁️</span>
              Aperçu du message
            </h3>
            <div className="bg-white rounded-lg p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {messagePreview}
            </div>
            {sendSMS && messagePreview.length > 160 && (
              <p className="mt-2 text-xs text-amber-600">
                ⚠️ Message tronqué à 160 caractères pour SMS
              </p>
            )}
          </div>

          <div className="bg-brand-50 rounded-xl p-4 border border-brand-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Récapitulatif de la facture</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente</span>
                <span className="font-medium">{clientName} {invoice.client?.last_name || ''}</span>
              </div>
              {appointmentDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Date RDV</span>
                  <span className="font-medium">{appointmentDate}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre de services</span>
                <span className="font-medium">{invoice.items.length}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-brand-200">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-brand-600">{invoice.total.toFixed(2)}€</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={loading || (!sendEmail && !sendSMS)}
            className="flex-1 px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {loading ? 'Envoi en cours...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}
