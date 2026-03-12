import { useState } from 'react';
import { X, Mail, MessageSquare, Send, AlertCircle, Calendar, Clock } from 'lucide-react';
import { Event } from '../../types/agenda';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { formatDate, formatTime } from '../../lib/calendarHelpers';

interface ClientDetails {
  email: string | null;
  phone: string | null;
  first_name: string;
  last_name: string;
}

interface SendReceiptModalProps {
  event: Event;
  clientDetails: ClientDetails;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SendReceiptModal({
  event,
  clientDetails,
  onClose,
  onSuccess,
}: SendReceiptModalProps) {
  const hasEmail = !!clientDetails.email;
  const hasPhone = !!clientDetails.phone;
  const [sendEmail, setSendEmail] = useState(hasEmail);
  const [sendSms, setSendSms] = useState(hasPhone);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const clientName = `${clientDetails.first_name} ${clientDetails.last_name}`.trim();
  const serviceName = event.service?.name || event.title;
  const servicePrice = event.service?.price != null ? `${Number(event.service.price).toFixed(2)}€` : 'N/A';
  const eventDate = formatDate(new Date(event.start_at));
  const eventTime = `${formatTime(new Date(event.start_at))} - ${formatTime(new Date(event.end_at))}`;

  const handleSend = async () => {
    if (!sendEmail && !sendSms) {
      showToast('error', 'Veuillez sélectionner au moins un canal');
      return;
    }

    setLoading(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        showToast('error', 'Session expirée, veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-receipt`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          eventId: event.id,
          sendEmail,
          sendSms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur serveur');
      }

      if (data.success) {
        showToast('success', 'Reçu envoyé avec succès !');
        onSuccess?.();
        onClose();
      } else {
        const failedChannels: string[] = [];
        const succeededChannels: string[] = [];

        if (sendEmail) {
          if (data.emailSent) succeededChannels.push('Email');
          else failedChannels.push('Email');
        }
        if (sendSms) {
          if (data.smsSent) succeededChannels.push('SMS');
          else failedChannels.push('SMS');
        }

        if (succeededChannels.length > 0) {
          showToast('warning', `Envoi partiel : échec pour ${failedChannels.join(', ')}`);
          onSuccess?.();
          onClose();
        } else {
          showToast('error', 'Échec de l\'envoi du reçu');
        }
      }
    } catch (error) {
      console.error('Error sending receipt:', error);
      showToast('error', error instanceof Error ? error.message : 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Envoyer le reçu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Détails du rendez-vous</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente</span>
                <span className="font-medium text-gray-900">{clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prestation</span>
                <span className="font-medium text-gray-900">{serviceName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Date
                </span>
                <span className="font-medium text-gray-900">{eventDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Horaire
                </span>
                <span className="font-medium text-gray-900">{eventTime}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-emerald-200">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-emerald-600 text-base">{servicePrice}</span>
              </div>
            </div>
          </div>

          {!hasEmail && !hasPhone && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Aucune coordonnée disponible</p>
                <p className="mt-1">Cette cliente n'a ni email ni téléphone enregistré.</p>
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
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-gray-50'
                } ${!hasEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  disabled={!hasEmail}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                />
                <Mail className="w-5 h-5 text-emerald-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Par Email</p>
                  {hasEmail ? (
                    <p className="text-sm text-gray-600">{clientDetails.email}</p>
                  ) : (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Email non renseigné
                    </p>
                  )}
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                  sendSms && hasPhone
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-gray-50'
                } ${!hasPhone ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  disabled={!hasPhone}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                />
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Par SMS</p>
                  {hasPhone ? (
                    <p className="text-sm text-gray-600">{clientDetails.phone}</p>
                  ) : (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Téléphone non renseigné
                    </p>
                  )}
                </div>
              </label>
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
            disabled={loading || (!sendEmail && !sendSms)}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {loading ? 'Envoi en cours...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}
