import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Clock, User, FileText, Calendar, Receipt, Plus, Send } from 'lucide-react';
import { Event } from '../../types/agenda';
import { supabase } from '../../lib/supabase';
import EventForm from './EventForm';
import { formatDate, formatTime } from '../../lib/calendarHelpers';
import { getInvoiceByAppointment } from '../../lib/invoiceHelpers';
import InvoiceDetailDrawer from '../client/InvoiceDetailDrawer';
import InvoiceForm from '../client/InvoiceForm';
import SendReceiptModal from './SendReceiptModal';
import { useToast } from '../../hooks/useToast';

interface EventDrawerProps {
  event: Event;
  onClose: () => void;
  onUpdate: (event: Event) => void;
  onDelete: (eventId: string) => void;
  existingEvents: any[];
}

export default function EventDrawer({ event, onClose, onUpdate, onDelete, existingEvents }: EventDrawerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [formationDates, setFormationDates] = useState({
    startDate: event.start_at.split('T')[0],
    endDate: event.end_at.split('T')[0],
  });
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [clientDetails, setClientDetails] = useState<{
    email: string | null;
    phone: string | null;
    first_name: string;
    last_name: string;
  } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (event.type === 'pro' && event.client_id) {
      checkInvoice();
      loadClientDetails();
    }
  }, [event.id]);

  const checkInvoice = async () => {
    const { data } = await getInvoiceByAppointment(event.id);
    if (data) {
      setInvoiceId(data.id);
    }
  };

  const loadClientDetails = async () => {
    if (!event.client_id) return;
    const { data } = await supabase
      .from('clients')
      .select('first_name, last_name, email, phone')
      .eq('id', event.client_id)
      .maybeSingle();
    if (data) {
      setClientDetails(data);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;
      onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('error', 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (updatedEvent: Event) => {
    onUpdate(updatedEvent);
    setIsEditing(false);
  };

  const handleFormationDatesUpdate = async () => {
    if (!event.student_id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          training_start_date: formationDates.startDate,
          training_end_date: formationDates.endDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.student_id);

      if (error) throw error;

      onUpdate({
        ...event,
        start_at: `${formationDates.startDate}T09:00:00`,
        end_at: `${formationDates.endDate}T18:00:00`,
      });
      setIsEditingDates(false);
    } catch (error: any) {
      console.error('Error updating formation dates:', error);
      alert(`Erreur lors de la mise à jour : ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels = {
      confirmed: 'Confirmé',
      pending: 'En attente',
      cancelled: 'Annulé',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      pro: 'bg-blue-100 text-blue-800',
      formation: 'bg-blue-100 text-blue-800',
      personal: 'bg-purple-100 text-purple-800',
      google: 'bg-gray-100 text-gray-800',
      planity: 'bg-belleya-100 text-belleya-deep',
    };
    const labels = {
      pro: 'Professionnel',
      formation: 'Formation',
      personal: 'Personnel',
      google: 'Google Calendar',
      planity: 'Planity',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type as keyof typeof styles]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Modifier le rendez-vous' : 'Détails du rendez-vous'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isEditing ? (
              <EventForm
                event={event}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
                existingEvents={existingEvents}
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{event.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {getTypeBadge(event.type)}
                    {getStatusBadge(event.status)}
                    {invoiceId && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                        <Receipt className="w-3 h-3" />
                        Récap disponible
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      {event.type === 'formation' ? (
                        <>
                          <div className="text-sm text-gray-600 mb-1">Période de formation</div>
                          <div className="font-medium text-gray-900">
                            {new Date(event.start_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                          <div className="text-gray-600">→</div>
                          <div className="font-medium text-gray-900">
                            {new Date(event.end_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium text-gray-900">
                            {formatDate(new Date(event.start_at))}
                          </div>
                          <div className="text-gray-600">
                            {formatTime(new Date(event.start_at))} - {formatTime(new Date(event.end_at))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {event.student && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-gray-600">Élève</div>
                        <div className="font-medium text-gray-900">{event.student.name}</div>
                      </div>
                    </div>
                  )}

                  {event.client && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-gray-600">Cliente</div>
                        <div className="font-medium text-gray-900">{event.client.name}</div>
                      </div>
                    </div>
                  )}

                  {event.service && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-gray-600">Service</div>
                        <div className="font-medium text-gray-900">{event.service.name}</div>
                      </div>
                    </div>
                  )}

                  {event.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-2">Notes</div>
                      <div className="text-gray-900 whitespace-pre-wrap">{event.notes}</div>
                    </div>
                  )}

                  {event.type === 'pro' && event.client_id && (
                    <div className="bg-brand-50 rounded-lg p-4 border border-brand-200">
                      {invoiceId ? (
                        <button
                          onClick={() => setShowInvoiceDetail(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                        >
                          <Receipt className="w-4 h-4" />
                          Voir le récap
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowInvoiceForm(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Créer un reçu
                        </button>
                      )}
                    </div>
                  )}

                  {event.type === 'pro' && event.client_id && (
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <button
                        onClick={() => setShowReceiptModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        Envoyer le recu par email / SMS
                      </button>
                    </div>
                  )}
                </div>

                {event.type !== 'google' && event.type !== 'planity' && !event.id.startsWith('formation-') && (
                  <div className="flex gap-3 pt-6 border-t">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                )}
                {event.id.startsWith('formation-') && !isEditingDates && (
                  <div className="flex gap-3 pt-6 border-t">
                    <button
                      onClick={() => setIsEditingDates(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Modifier la période
                    </button>
                  </div>
                )}
                {event.id.startsWith('formation-') && isEditingDates && (
                  <div className="space-y-4 pt-6 border-t">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-3">Modifier la période de formation</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-1">
                            Date de début
                          </label>
                          <input
                            type="date"
                            value={formationDates.startDate}
                            onChange={(e) => setFormationDates({ ...formationDates, startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-1">
                            Date de fin
                          </label>
                          <input
                            type="date"
                            value={formationDates.endDate}
                            onChange={(e) => setFormationDates({ ...formationDates, endDate: e.target.value })}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleFormationDatesUpdate}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingDates(false);
                            setFormationDates({
                              startDate: event.start_at.split('T')[0],
                              endDate: event.end_at.split('T')[0],
                            });
                          }}
                          disabled={loading}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvoiceDetail && invoiceId && (
        <InvoiceDetailDrawer
          invoiceId={invoiceId}
          isOpen={showInvoiceDetail}
          onClose={() => setShowInvoiceDetail(false)}
          onDeleted={() => {
            setInvoiceId(null);
            setShowInvoiceDetail(false);
          }}
          isProvider={true}
        />
      )}

      {showReceiptModal && clientDetails && (
        <SendReceiptModal
          event={event}
          clientDetails={clientDetails}
          onClose={() => setShowReceiptModal(false)}
          onSuccess={() => setShowReceiptModal(false)}
        />
      )}

      {showInvoiceForm && event.client_id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Créer un reçu</h2>
              <button
                onClick={() => setShowInvoiceForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <InvoiceForm
                clientId={event.client_id}
                appointmentId={event.id}
                providerId={event.user_id}
                prefilledServices={event.service ? [{
                  service_id: event.service.id,
                  service_name: event.service.name,
                  price: event.service.price || 0,
                  duration: event.service.duration || 0,
                }] : []}
                onSuccess={(newInvoiceId) => {
                  setInvoiceId(newInvoiceId);
                  setShowInvoiceForm(false);
                }}
                onCancel={() => setShowInvoiceForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
