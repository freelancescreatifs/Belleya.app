import { useState, useEffect } from 'react';
import { X, Plus, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SERVICE_TYPES, getServiceTypeLabel, type ServiceType } from '../../lib/serviceTypeHelpers';
import ClientSelector from '../shared/ClientSelector';
import StudentSelector from '../shared/StudentSelector';

interface Service {
  id: string;
  name: string;
  price: number;
  service_type: ServiceType;
  duration: number;
}

interface Supplement {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface Partnership {
  id: string;
  partner_name: string;
  commission_rate: number;
  status: string;
}

interface RevenueFormData {
  date: string;
  service_type: ServiceType;
  service_id: string;
  service_name: string;
  amount: number | string;
  payment_method: string;
  client_id: string;
  student_id: string;
  notes: string;
  selected_supplements: string[];
  partnership_id: string;
}

interface RevenueFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onCreateClient: () => void;
  onCreateStudent: (formationId: string | undefined, onCreated: (studentId: string, studentName: string) => void) => void;
  revenueId?: string;
}

export default function RevenueForm({ onClose, onSuccess, onCreateClient, onCreateStudent, revenueId }: RevenueFormProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [formData, setFormData] = useState<RevenueFormData>({
    date: new Date().toISOString().split('T')[0],
    service_type: 'prestation',
    service_id: '',
    service_name: '',
    amount: '',
    payment_method: '',
    client_id: '',
    student_id: '',
    notes: '',
    selected_supplements: [],
    partnership_id: ''
  });

  const [formErrors, setFormErrors] = useState({
    payment_method: false
  });

  useEffect(() => {
    loadServices();
    loadPartnerships();
  }, [user]);

  useEffect(() => {
    if (revenueId && services.length > 0) {
      loadRevenue();
    }
  }, [revenueId, services]);

  useEffect(() => {
    if (formData.service_id) {
      loadSupplements(formData.service_id);
    }
  }, [formData.service_id]);

  const loadServices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, service_type, duration')
        .eq('user_id', user.id)
        .in('status', ['active', 'hidden'])
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadPartnerships = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('partnerships')
        .select('id, partner_name, commission_rate, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('partner_name');

      if (error) throw error;
      setPartnerships(data || []);
    } catch (error) {
      console.error('Error loading partnerships:', error);
    }
  };

  const loadRevenue = async () => {
    if (!user || !revenueId) return;

    try {
      const revenueRes = await supabase
        .from('revenues')
        .select('*')
        .eq('id', revenueId)
        .single();

      if (revenueRes.error) throw revenueRes.error;

      const revenue = revenueRes.data;

      const supplementsRes = await supabase
        .from('revenue_supplements')
        .select('supplement_id')
        .eq('revenue_id', revenueId);

      const existingSupplements = supplementsRes.data || [];

      if (revenue) {
        const revenueTypeToServiceType: Record<string, ServiceType> = {
          'service': 'prestation',
          'formation': 'formation',
          'digital_sale': 'digital_sale',
          'commission': 'commission',
          'other': 'other'
        };

        const serviceIdFromName = revenue.service_name
          ? services.find(s => s.name === revenue.service_name)?.id || ''
          : '';

        let baseAmount = revenue.amount;
        const selectedSupplementIds = existingSupplements.map(s => s.supplement_id);

        if (serviceIdFromName) {
          const service = services.find(s => s.id === serviceIdFromName);
          if (service) {
            baseAmount = service.price;
          }
        }

        const studentId = revenue.student_id || '';

        if (studentId) {
          const { data: studentData } = await supabase
            .from('students')
            .select('id, first_name, last_name')
            .eq('id', studentId)
            .maybeSingle();

          if (studentData) {
            setStudentSearch(`${studentData.first_name} ${studentData.last_name}`);
          }
        }

        setFormData({
          date: revenue.date,
          service_type: revenueTypeToServiceType[revenue.revenue_type] || 'prestation',
          service_id: serviceIdFromName,
          service_name: revenue.service_name || '',
          amount: baseAmount,
          payment_method: revenue.payment_method,
          client_id: revenue.client_id || '',
          student_id: studentId,
          notes: revenue.notes || '',
          selected_supplements: selectedSupplementIds,
          partnership_id: revenue.partnership_id || ''
        });
      }
    } catch (error) {
      console.error('Error loading revenue:', error);
    }
  };

  const loadSupplements = async (serviceId: string) => {
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
  };

  const handleServiceTypeChange = (newType: ServiceType) => {
    setFormData({
      ...formData,
      service_type: newType,
      service_id: '',
      service_name: '',
      amount: '',
      client_id: '',
      student_id: '',
      selected_supplements: [],
      partnership_id: ''
    });
    setClientSearch('');
    setStudentSearch('');
    setSupplements([]);
  };

  const handleServiceSelect = (serviceId: string) => {
    if (serviceId === 'other') {
      setFormData({
        ...formData,
        service_id: 'other',
        service_name: '',
        amount: '',
        selected_supplements: []
      });
      setSupplements([]);
    } else {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        setFormData({
          ...formData,
          service_id: serviceId,
          service_name: service.name,
          amount: service.price,
          selected_supplements: []
        });
      }
    }
  };

  const calculateTotal = () => {
    const basePrice = Number(formData.amount) || 0;
    const supplementsTotal = supplements
      .filter(s => formData.selected_supplements.includes(s.id))
      .reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    return basePrice + supplementsTotal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.payment_method) {
      setFormErrors({ payment_method: true });
      return;
    }

    if (formData.service_type === 'formation' && !formData.student_id) {
      alert('Veuillez sélectionner un élève pour une formation');
      return;
    }

    setFormErrors({ payment_method: false });

    try {
      const totalAmount = calculateTotal();

      const revenueData = {
        user_id: user!.id,
        date: formData.date,
        amount: totalAmount,
        revenue_type: formData.service_type,
        payment_method: formData.payment_method,
        service_name: formData.service_name || null,
        client_id: formData.service_type === 'formation' ? null : (formData.client_id || null),
        student_id: formData.service_type === 'formation' ? (formData.student_id || null) : null,
        notes: formData.notes || null,
        partnership_id: formData.service_type === 'commission' && formData.partnership_id ? formData.partnership_id : null
      };

      console.log('=== STEP 1: Creating/Updating Revenue ===');
      console.log('Revenue payload:', revenueData);

      let revenue;
      let error;

      if (revenueId) {
        const result = await supabase
          .from('revenues')
          .update(revenueData)
          .eq('id', revenueId)
          .select()
          .single();
        revenue = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from('revenues')
          .insert(revenueData)
          .select()
          .single();
        revenue = result.data;
        error = result.error;
      }

      if (error) {
        console.error('=== ERROR in STEP 1: Revenue Insert Failed ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        const errorMsg = `Erreur création recette (revenues): ${error.message}${error.code ? ` (${error.code})` : ''}${error.details ? `\nDétails: ${error.details}` : ''}`;
        alert(errorMsg);
        throw error;
      }

      console.log('=== STEP 1: SUCCESS - Revenue created ===');
      console.log('Revenue ID:', revenue?.id);

      if (revenue) {
        if (revenueId) {
          console.log('=== STEP 2a: Deleting old supplements ===');
          await supabase
            .from('revenue_supplements')
            .delete()
            .eq('revenue_id', revenueId);
        }

        if (formData.selected_supplements.length > 0) {
          console.log('=== STEP 2b: Preparing supplements payload ===');
          console.log('Selected supplement IDs:', formData.selected_supplements);

          const supplementsPayload = [];

          for (const suppId of formData.selected_supplements) {
            const supplement = supplements.find(s => s.id === suppId);
            if (!supplement) {
              console.warn(`Supplement with id ${suppId} not found in list`);
              continue;
            }

            const price = Number(supplement.price);
            if (!Number.isFinite(price) || price <= 0) {
              console.error(`Invalid price for supplement ${supplement.name}:`, supplement.price);
              alert(`Erreur: Prix invalide pour le supplément "${supplement.name}"`);
              throw new Error(`Invalid price for supplement: ${supplement.name}`);
            }

            const durationMinutes = supplement.duration_minutes > 0 ? Number(supplement.duration_minutes) : null;
            if (durationMinutes !== null && !Number.isFinite(durationMinutes)) {
              console.error(`Invalid duration for supplement ${supplement.name}:`, supplement.duration_minutes);
              alert(`Erreur: Durée invalide pour le supplément "${supplement.name}"`);
              throw new Error(`Invalid duration for supplement: ${supplement.name}`);
            }

            if (!supplement.name || supplement.name.trim() === '') {
              console.error(`Empty name for supplement ${suppId}`);
              alert(`Erreur: Nom vide pour un supplément`);
              throw new Error('Supplement name is required');
            }

            supplementsPayload.push({
              revenue_id: revenue.id,
              supplement_id: suppId,
              quantity: 1,
              price_at_time: price,
              supplement_name: supplement.name.trim(),
              duration_minutes: durationMinutes
            });
          }

          if (supplementsPayload.length > 0) {
            console.log('=== STEP 2b: Inserting supplements ===');
            console.log('Supplements payload (validated):', JSON.stringify(supplementsPayload, null, 2));
            console.log('Number of supplements to insert:', supplementsPayload.length);

            const { data: insertedSupplements, error: suppError } = await supabase
              .from('revenue_supplements')
              .insert(supplementsPayload)
              .select();

            if (suppError) {
              console.error('=== ERROR in STEP 2b: Supplements Insert Failed ===');
              console.error('Error object:', suppError);
              console.error('Error message:', suppError.message);
              console.error('Error code:', suppError.code);
              console.error('Error details:', suppError.details);
              console.error('Error hint:', suppError.hint);
              console.error('Failed payload:', JSON.stringify(supplementsPayload, null, 2));

              const errorMsg = `Erreur ajout suppléments: ${suppError.message}${suppError.code ? ` (${suppError.code})` : ''}${suppError.details ? `\nDétails: ${suppError.details}` : ''}${suppError.hint ? `\nHint: ${suppError.hint}` : ''}`;
              alert(errorMsg);
              throw new Error(errorMsg);
            }

            console.log('=== STEP 2b: SUCCESS - Supplements inserted ===');
            console.log('Inserted supplements:', insertedSupplements);
          } else {
            console.log('=== STEP 2b: SKIPPED - No valid supplements to insert ===');
          }
        } else {
          console.log('=== STEP 2b: SKIPPED - No supplements selected ===');
        }
      }

      if (formData.service_type === 'formation' && formData.student_id) {
        console.log('=== STEP 3: Adding to student history ===');
        const { error: historyError } = await supabase
          .from('student_formation_history')
          .insert({
            student_id: formData.student_id,
            user_id: user!.id,
            formation_name: formData.service_name,
            amount_paid: totalAmount,
            date: formData.date
          });

        if (historyError) {
          console.error('Error adding to student history:', historyError);
        } else {
          console.log('=== STEP 3: SUCCESS - Student history updated ===');
        }
      }

      if (formData.service_type === 'commission' && formData.partnership_id) {
        console.log('=== STEP 4: Syncing with partnership ===');
        const partnership = partnerships.find(p => p.id === formData.partnership_id);

        if (partnership) {
          const { error: partnershipError } = await supabase
            .from('partnerships')
            .update({
              last_revenue_date: formData.date,
              last_revenue_amount: totalAmount
            })
            .eq('id', formData.partnership_id);

          if (partnershipError) {
            console.error('Error syncing with partnership:', partnershipError);
          } else {
            console.log('=== STEP 4: SUCCESS - Partnership synced ===');
          }
        }
      }

      console.log('=== ALL STEPS COMPLETED SUCCESSFULLY ===');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('=== FATAL ERROR ===');
      console.error('Full error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);

      if (error?.message && !error.message.includes('Erreur')) {
        const fullError = `Erreur inattendue: ${error.message}${error.code ? ` (${error.code})` : ''}`;
        alert(fullError);
      }
    }
  };

  const filteredServices = services.filter(s => s.service_type === formData.service_type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{revenueId ? 'Modifier la recette' : 'Nouvelle recette'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de recette <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.service_type}
              onChange={(e) => handleServiceTypeChange(e.target.value as ServiceType)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            >
              {SERVICE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {filteredServices.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.service_type === 'prestation' ? 'Prestation' :
                 formData.service_type === 'formation' ? 'Formation' :
                 formData.service_type === 'digital_sale' ? 'Vente digitale' :
                 formData.service_type === 'commission' ? 'Commission' :
                 'Service'} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.service_id}
                onChange={(e) => handleServiceSelect(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
              >
                <option value="">Sélectionner...</option>
                {filteredServices.map(service => (
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
              />
            </div>
          )}

          {formData.service_type === 'formation' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Élève <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <StudentSelector
                  value={formData.student_id}
                  onChange={(studentId, studentName) => {
                    console.log('[RevenueForm] Student selected:', studentId, studentName);
                    setFormData({ ...formData, student_id: studentId });
                    setStudentSearch(studentName);
                  }}
                  placeholder="Sélectionner un élève"
                />
                <button
                  type="button"
                  onClick={() => {
                    console.log('[RevenueForm] Create student clicked', { formationId: formData.service_id });
                    onCreateStudent(formData.service_id, (studentId, studentName) => {
                      console.log('[RevenueForm] Student created, auto-selecting:', studentId, studentName);
                      setFormData({ ...formData, student_id: studentId });
                      setStudentSearch(studentName);
                    });
                  }}
                  className="w-full px-4 py-2 text-left bg-belaya-50 hover:bg-belaya-100 text-belaya-primary font-medium flex items-center gap-2 rounded-lg border border-belaya-200"
                >
                  <Plus className="w-4 h-4" />
                  Créer un nouvel élève
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente (optionnel)</label>
              <div className="space-y-2">
                <ClientSelector
                  value={formData.client_id}
                  onChange={(clientId) => setFormData({ ...formData, client_id: clientId })}
                  placeholder="Sélectionner une cliente"
                />
                <button
                  type="button"
                  onClick={onCreateClient}
                  className="w-full px-4 py-2 text-left bg-belaya-50 hover:bg-belaya-100 text-belaya-primary font-medium flex items-center gap-2 rounded-lg border border-belaya-200"
                >
                  <Plus className="w-4 h-4" />
                  Créer une nouvelle cliente
                </button>
              </div>
            </div>
          )}

          {formData.service_type === 'commission' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partenariat <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.partnership_id}
                onChange={(e) => {
                  const partnershipId = e.target.value;
                  setFormData({ ...formData, partnership_id: partnershipId });

                  if (partnershipId) {
                    const partnership = partnerships.find(p => p.id === partnershipId);
                    if (partnership && !formData.amount) {
                      const suggestedAmount = (Number(formData.amount) || 0) * (partnership.commission_rate / 100);
                      if (suggestedAmount > 0) {
                        setFormData(prev => ({ ...prev, amount: suggestedAmount }));
                      }
                    }
                  }
                }}
                required={formData.service_type === 'commission'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
              >
                <option value="">Sélectionner un partenariat...</option>
                {partnerships.map(partnership => (
                  <option key={partnership.id} value={partnership.id}>
                    {partnership.partner_name} - {partnership.commission_rate}%
                  </option>
                ))}
              </select>
              {partnerships.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Aucun partenariat actif. Créez-en un dans l'onglet Partenariats.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value === '' ? '' : parseFloat(e.target.value) })}
              onFocus={(e) => e.target.select()}
              required
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
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
                      className="w-4 h-4 text-belaya-primary border-gray-300 rounded"
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

          <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-2xl font-bold text-gray-900">{calculateTotal().toFixed(2)} €</span>
            </div>
            {formData.selected_supplements.length > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Base: {(Number(formData.amount) || 0).toFixed(2)}€ + Suppléments: {(calculateTotal() - (Number(formData.amount) || 0)).toFixed(2)}€
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
                      ? 'border-belaya-500 bg-belaya-50'
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
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
              className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all"
            >
              {revenueId ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
