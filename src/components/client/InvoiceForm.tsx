import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { calculateLineTotal, calculateInvoiceTotals, InvoiceItem } from '../../lib/invoiceHelpers';
import { useToast } from '../../hooks/useToast';

interface Supplement {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  supplements?: Supplement[];
}

interface InvoiceFormProps {
  clientId: string;
  appointmentId?: string;
  providerId?: string;
  onSuccess?: (invoiceId: string) => void;
  onCancel?: () => void;
  prefilledServices?: Array<{
    service_id: string;
    service_name: string;
    price: number;
    duration?: number;
  }>;
}

export default function InvoiceForm({
  clientId,
  appointmentId,
  providerId,
  onSuccess,
  onCancel,
  prefilledServices = [],
}: InvoiceFormProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [discountTotal, setDiscountTotal] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadServices();
      initializeForm();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadServices = async () => {
    if (!currentUserId) return;

    const { data } = await supabase
      .from('services')
      .select(`
        id,
        name,
        price,
        duration,
        service_supplements (
          id,
          name,
          price,
          duration_minutes
        )
      `)
      .eq('user_id', currentUserId)
      .eq('status', 'active')
      .order('name');

    if (data) {
      const servicesWithSupplements = data.map(service => ({
        ...service,
        supplements: service.service_supplements || []
      }));
      setServices(servicesWithSupplements);
    }
  };

  const initializeForm = () => {
    if (appointmentId) {
      const date = new Date().toLocaleDateString('fr-FR');
      setTitle(`Reçu RDV du ${date}`);
    } else {
      setTitle('Prestation');
    }

    if (prefilledServices.length > 0) {
      const initialItems = prefilledServices.map(ps => ({
        service_id: ps.service_id,
        label: ps.service_name,
        price: ps.price,
        quantity: 1,
        duration_minutes: ps.duration,
        discount: 0,
        line_total: ps.price,
      }));
      setItems(initialItems);
    } else {
      addNewItem();
    }
  };

  const addNewItem = () => {
    setItems(prev => [
      ...prev,
      {
        service_id: null,
        label: '',
        price: 0,
        quantity: 1,
        duration_minutes: null,
        discount: 0,
        line_total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      showToast('Vous devez avoir au moins un service', 'error');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = { ...newItems[index] };

      if (field === 'service_id') {
        const service = services.find(s => s.id === value);
        if (service) {
          item.service_id = service.id;
          item.label = service.name;
          item.price = service.price;
          item.duration_minutes = service.duration;
        } else if (value === 'other') {
          item.service_id = null;
          item.label = '';
          item.price = 0;
          item.duration_minutes = null;
        }
      } else {
        item[field] = value;
      }

      item.line_total = calculateLineTotal(
        item.price,
        item.quantity,
        item.discount
      );

      newItems[index] = item;
      return newItems;
    });
  };

  const { subtotal, total } = calculateInvoiceTotals(items, discountTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserId) {
      showToast('Erreur: utilisateur non connecté', 'error');
      return;
    }

    if (!title.trim()) {
      showToast('Veuillez entrer un titre', 'error');
      return;
    }

    if (items.length === 0) {
      showToast('Veuillez ajouter au moins un service', 'error');
      return;
    }

    const hasEmptyItem = items.some(item => !item.label.trim() || item.price <= 0);
    if (hasEmptyItem) {
      showToast('Tous les services doivent avoir un nom et un prix valide', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          provider_id: currentUserId,
          client_id: clientId,
          appointment_id: appointmentId || null,
          title: title.trim(),
          notes: notes.trim() || null,
          subtotal,
          discount_total: discountTotal,
          total,
        })
        .select()
        .single();

      if (invoiceError) {
        throw new Error(invoiceError.message || 'Erreur lors de la création de la facture');
      }

      const itemsToInsert = items.map(item => ({
        invoice_id: invoice.id,
        service_id: item.service_id,
        label: item.label,
        price: item.price,
        quantity: item.quantity,
        duration_minutes: item.duration_minutes,
        discount: item.discount,
        line_total: item.line_total,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) {
        throw new Error(itemsError.message || 'Erreur lors de l\'ajout des services');
      }

      showToast('Reçu créé avec succès', 'success');
      onSuccess?.(invoice.id);
    } catch (error) {
      console.error('Error creating invoice:', error);
      showToast(
        error instanceof Error ? error.message : 'Erreur lors de la création du reçu',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre du reçu *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          placeholder="Ex: Reçu RDV du 12/02"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Services facturés *
          </label>
          <button
            type="button"
            onClick={addNewItem}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter un service
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Service
                    </label>
                    <select
                      value={item.service_id || 'other'}
                      onChange={(e) => updateItem(index, 'service_id', e.target.value === 'other' ? null : e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      <option value="other">Autre (saisir manuellement)</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name} - {service.price.toFixed(2)}€
                        </option>
                      ))}
                    </select>
                  </div>

                  {item.service_id && (() => {
                    const selectedService = services.find(s => s.id === item.service_id);
                    return selectedService?.supplements && selectedService.supplements.length > 0 ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-900 mb-2">
                          Suppléments disponibles :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedService.supplements.map(supplement => (
                            <button
                              key={supplement.id}
                              type="button"
                              onClick={() => {
                                setItems(prev => {
                                  const newItems = [...prev];
                                  newItems.splice(index + 1, 0, {
                                    service_id: null,
                                    label: supplement.name,
                                    price: supplement.price,
                                    quantity: 1,
                                    duration_minutes: supplement.duration_minutes,
                                    discount: 0,
                                    line_total: supplement.price,
                                  });
                                  return newItems;
                                });
                              }}
                              className="text-xs px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              {supplement.name} (+{supplement.price.toFixed(2)}€)
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {!item.service_id && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nom du service *
                      </label>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateItem(index, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        placeholder="Ex: Pose complète"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Prix unitaire *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Quantité
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Durée (min)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.duration_minutes || ''}
                        onChange={(e) => updateItem(index, 'duration_minutes', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Remise (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.discount}
                        onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500">Total ligne</span>
                    <span className="text-sm font-bold text-gray-900">
                      {item.line_total.toFixed(2)}€
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-brand-50 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Sous-total</span>
          <span className="text-sm font-medium text-gray-900">{subtotal.toFixed(2)}€</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <label className="text-sm text-gray-600">Remise globale (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={discountTotal}
            onChange={(e) => setDiscountTotal(parseFloat(e.target.value) || 0)}
            className="w-24 px-3 py-1 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-brand-200">
          <span className="text-base font-bold text-gray-900">Total</span>
          <span className="text-lg font-bold text-brand-600">{total.toFixed(2)}€</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (optionnel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          placeholder="Notes supplémentaires pour la cliente..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            disabled={loading}
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Enregistrement...' : 'Créer le reçu'}
        </button>
      </div>
    </form>
  );
}
