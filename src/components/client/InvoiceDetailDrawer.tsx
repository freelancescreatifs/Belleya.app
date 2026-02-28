import { useState, useEffect } from 'react';
import { X, Send, FileText, Clock, Calendar, Trash2 } from 'lucide-react';
import { getInvoiceById, deleteInvoice, InvoiceWithDetails } from '../../lib/invoiceHelpers';
import SendInvoiceModal from './SendInvoiceModal';
import { useToast } from '../../hooks/useToast';

interface InvoiceDetailDrawerProps {
  invoiceId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  isProvider?: boolean;
}

export default function InvoiceDetailDrawer({
  invoiceId,
  isOpen,
  onClose,
  onDeleted,
  isProvider = false,
}: InvoiceDetailDrawerProps) {
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadInvoice();
    }
  }, [isOpen, invoiceId]);

  const loadInvoice = async () => {
    setLoading(true);
    const data = await getInvoiceById(invoiceId);
    setInvoice(data);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce récap ?')) {
      return;
    }

    setDeleting(true);
    const { error } = await deleteInvoice(invoiceId);

    if (error) {
      showToast('error', 'Erreur lors de la suppression');
      setDeleting(false);
      return;
    }

    showToast('success', 'Récap supprimé avec succès');
    onDeleted?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" />
            Détails du récap
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoice ? (
          <div className="p-6 space-y-6">
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-200">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{invoice.title}</h3>
              <div className="space-y-2 text-sm">
                {invoice.client && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">Cliente:</span>
                    <span>{invoice.client.first_name} {invoice.client.last_name}</span>
                  </div>
                )}
                {invoice.appointment && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>RDV du {new Date(invoice.appointment.start_time).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Créé le {new Date(invoice.created_at!).toLocaleDateString('fr-FR')} à {new Date(invoice.created_at!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3">Services facturés</h4>
              <div className="space-y-2">
                {invoice.items.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <div className="mt-1 space-y-1 text-sm text-gray-600">
                          <p>
                            Prix unitaire: {item.price.toFixed(2)}€
                            {item.quantity > 1 && ` × ${item.quantity}`}
                          </p>
                          {item.duration_minutes && (
                            <p className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.duration_minutes} min
                            </p>
                          )}
                          {item.discount > 0 && (
                            <p className="text-amber-600">
                              Remise: -{item.discount.toFixed(2)}€
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{item.line_total.toFixed(2)}€</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-medium text-gray-900">{invoice.subtotal.toFixed(2)}€</span>
              </div>

              {invoice.discount_total > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Remise globale</span>
                  <span className="font-medium text-amber-600">-{invoice.discount_total.toFixed(2)}€</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-brand-600">{invoice.total.toFixed(2)}€</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}

            {isProvider && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowSendModal(true)}
                  className="flex-1 px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Envoyer le récap
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-3 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Récap introuvable
          </div>
        )}
      </div>

      {showSendModal && invoice && (
        <SendInvoiceModal
          invoice={invoice}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => {
            showToast('success', 'Récap envoyé');
            loadInvoice();
          }}
        />
      )}
    </>
  );
}
