import { useState, useEffect } from 'react';
import { X, Calendar, Euro, CreditCard, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { type ServiceType } from '../../lib/serviceTypeHelpers';
import InfoTooltip from '../shared/InfoTooltip';

interface Service {
  id: string;
  name: string;
  price: number;
  service_type: ServiceType;
}

interface Supplement {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface CreateRevenueModalProps {
  clientId: string;
  clientName: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateRevenueModal({
  clientId,
  clientName,
  onClose,
  onCreated,
}: CreateRevenueModalProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    revenue_type: 'prestation' as ServiceType,
    amount: 0,
    service_id: '',
    service_name: '',
    payment_method: '',
    notes: '',
    selected_supplements: [] as string[],
  });
  const [formErrors, setFormErrors] = useState({
    payment_method: false,
  });

  useEffect(() => {
    loadServices();
  }, [user]);

  useEffect(() => {
    if (formData.service_id && formData.service_id !== 'other') {
      loadSupplements(formData.service_id);
    } else {
      setSupplements([]);
    }
  }, [formData.service_id]);

  async function loadServices() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, service_type')
        .eq('user_id', user.id)
        .in('status', ['active', 'hidden'])
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSupplements(serviceId: string) {
    if (!user || !serviceId) return;

    try {
      const { data, error } = await supabase
        .from('service_supplements')
        .select('id, name, price, duration_minutes')
        .eq('service_id', serviceId)
        .order('created_at');

      if (error) throw error;
      setSupplements(data || []);
    } catch (error) {
      console.error('Error loading supplements:', error);
      setSupplements([]);
    }
  }

  function handleRevenueTypeChange(newType: ServiceType) {
    setFormData({
      ...formData,
      revenue_type: newType,
      service_id: '',
      service_name: '',
      amount: 0,
      selected_supplements: [],
    });
  }

  function handleServiceChange(serviceId: string) {
    if (serviceId === 'other') {
      setFormData({
        ...formData,
        service_id: 'other',
        service_name: '',
        amount: 0,
        selected_supplements: [],
      });
    } else {
      const selectedService = services.find(s => s.id === serviceId);
      if (selectedService) {
        setFormData({
          ...formData,
          service_id: serviceId,
          service_name: selectedService.name,
          amount: selectedService.price,
          selected_supplements: [],
        });
      }
    }
  }

  function calculateTotal() {
    const basePrice = Number(formData.amount) || 0;
    const supplementsTotal = supplements
      .filter(s => formData.selected_supplements.includes(s.id))
      .reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    return basePrice + supplementsTotal;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!formData.payment_method) {
      setFormErrors({ payment_method: true });
      return;
    }

    if (formData.amount <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    setFormErrors({ payment_method: false });
    setSaving(true);

    try {
      const totalAmount = calculateTotal();

      const revenueData = {
        user_id: user.id,
        client_id: clientId,
        date: formData.date,
        amount: totalAmount,
        revenue_type: formData.revenue_type,
        payment_method: formData.payment_method,
        service_name: formData.service_name || null,
        notes: formData.notes || null,
      };

      console.log('Creating revenue from client drawer:', revenueData);

      const { data: revenue, error } = await supabase
        .from('revenues')
        .insert(revenueData)
        .select()
        .single();

      if (error) {
        console.error('Error creating revenue:', error);
        const errorMsg = `Erreur création recette: ${error.message}${error.code ? ` (${error.code})` : ''}${error.details ? `\nDétails: ${error.details}` : ''}`;
        alert(errorMsg);
        throw error;
      }

      if (revenue && formData.selected_supplements.length > 0) {
        const supplementsPayload = [];

        for (const suppId of formData.selected_supplements) {
          const supplement = supplements.find(s => s.id === suppId);
          if (!supplement) continue;

          const price = Number(supplement.price);
          if (!Number.isFinite(price) || price <= 0) {
            alert(`Erreur: Prix invalide pour le supplément "${supplement.name}"`);
            throw new Error(`Invalid price for supplement: ${supplement.name}`);
          }

          const durationMinutes = supplement.duration_minutes > 0 ? Number(supplement.duration_minutes) : null;

          supplementsPayload.push({
            revenue_id: revenue.id,
            supplement_id: suppId,
            quantity: 1,
            price_at_time: price,
            supplement_name: supplement.name.trim(),
            duration_minutes: durationMinutes,
          });
        }

        if (supplementsPayload.length > 0) {
          const { error: suppError } = await supabase
            .from('revenue_supplements')
            .insert(supplementsPayload);

          if (suppError) {
            console.error('Error adding supplements:', suppError);
            const errorMsg = `Erreur ajout suppléments: ${suppError.message}${suppError.code ? ` (${suppError.code})` : ''}`;
            alert(errorMsg);
            throw suppError;
          }
        }
      }

      onCreated();
      onClose();
    } catch (error: any) {
      console.error('Fatal error creating revenue:', error);
    } finally {
      setSaving(false);
    }
  }

  const filteredServices = services.filter(s => s.service_type === formData.revenue_type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ajouter une recette</h2>
            <p className="text-sm text-gray-600 mt-1">Pour {clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Chargement...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de recette <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.revenue_type}
                onChange={(e) => handleRevenueTypeChange(e.target.value as ServiceType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="prestation">Prestation</option>
                <option value="digital_sale">Vente digitale</option>
                <option value="commission">Commission</option>
                <option value="other">Autre</option>
                <option value="formation" disabled>Formation (non disponible depuis fiche cliente)</option>
              </select>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <Info className="w-3 h-3" />
                <span>Les formations se créent depuis la section Formation avec un élève</span>
              </div>
            </div>

            {filteredServices.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.revenue_type === 'prestation' ? 'Prestation' :
                   formData.revenue_type === 'digital_sale' ? 'Vente digitale' :
                   formData.revenue_type === 'commission' ? 'Commission' :
                   'Service'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.service_id}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Sélectionner...</option>
                  {filteredServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.price}€
                    </option>
                  ))}
                  <option value="other">Autre (saisie manuelle)</option>
                </select>
              </div>
            ) : null}

            {(filteredServices.length === 0 || formData.service_id === 'other' || !formData.service_id) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant (€) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {supplements.length > 0 && formData.service_id && formData.service_id !== 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Suppléments (optionnel)</label>
                <div className="space-y-2">
                  {supplements.map(supplement => (
                    <label key={supplement.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.selected_supplements.includes(supplement.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              selected_supplements: [...formData.selected_supplements, supplement.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              selected_supplements: formData.selected_supplements.filter(id => id !== supplement.id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-brand-600 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{supplement.name}</p>
                        <p className="text-xs text-gray-600">
                          +{supplement.price}€ {supplement.duration_minutes > 0 && `• +${supplement.duration_minutes} min`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total</span>
                <span className="text-2xl font-bold text-gray-900">{calculateTotal().toFixed(2)} €</span>
              </div>
              {formData.selected_supplements.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  Base: {formData.amount.toFixed(2)}€ + Suppléments: {(calculateTotal() - formData.amount).toFixed(2)}€
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode de paiement <span className="text-red-500">*</span>
              </label>
              <div className={`grid grid-cols-3 gap-3 ${formErrors.payment_method ? 'ring-2 ring-red-500 rounded-lg p-2' : ''}`}>
                {[
                  { value: 'cash', label: 'Espèces', emoji: '💵' },
                  { value: 'card', label: 'Carte', emoji: '💳' },
                  { value: 'transfer', label: 'Virement', emoji: '🏦' },
                  { value: 'paypal', label: 'PayPal', emoji: '💰' },
                  { value: 'other', label: 'Autre', emoji: '💸' },
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, payment_method: method.value });
                      setFormErrors({ payment_method: false });
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.payment_method === method.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{method.emoji}</div>
                    <div className="text-xs font-medium text-gray-700">{method.label}</div>
                  </button>
                ))}
              </div>
              {formErrors.payment_method && (
                <p className="mt-2 text-sm text-red-600">Veuillez sélectionner un mode de paiement</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="Informations complémentaires..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50"
              >
                {saving ? 'Ajout...' : 'Ajouter la recette'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
