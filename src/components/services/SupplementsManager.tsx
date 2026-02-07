import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Euro, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { type ServiceType } from '../../lib/serviceTypeHelpers';

interface Supplement {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface SupplementsManagerProps {
  serviceId: string;
  serviceType?: ServiceType;
  onSupplementsChange?: () => void;
}

export default function SupplementsManager({ serviceId, serviceType = 'prestation', onSupplementsChange }: SupplementsManagerProps) {
  const { user } = useAuth();
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    duration_minutes: '',
    price: ''
  });

  useEffect(() => {
    if (serviceId) {
      loadSupplements();
    }
  }, [serviceId]);

  const loadSupplements = async () => {
    if (!user || !serviceId) return;

    try {
      const { data, error } = await supabase
        .from('service_supplements')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSupplements(data || []);
    } catch (error) {
      console.error('Error loading supplements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !serviceId || !formData.name || !formData.price) return;

    const priceValue = parseFloat(formData.price);
    const durationValue = formData.duration_minutes ? parseInt(formData.duration_minutes) : 0;

    if (isNaN(priceValue) || priceValue < 0) {
      alert('Prix invalide');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('service_supplements')
          .update({
            name: formData.name,
            duration_minutes: durationValue > 0 ? durationValue : null,
            price: priceValue
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('service_supplements')
          .insert({
            service_id: serviceId,
            user_id: user.id,
            name: formData.name,
            duration_minutes: durationValue > 0 ? durationValue : null,
            price: priceValue
          });

        if (error) throw error;
      }

      setFormData({ name: '', duration_minutes: '', price: '' });
      setShowForm(false);
      setEditingId(null);
      loadSupplements();
      onSupplementsChange?.();
    } catch (error) {
      console.error('Error saving supplement:', error);
      alert('Erreur lors de l\'enregistrement du supplément');
    }
  };

  const handleEdit = (supplement: Supplement) => {
    setEditingId(supplement.id);
    setFormData({
      name: supplement.name,
      duration_minutes: supplement.duration_minutes > 0 ? supplement.duration_minutes.toString() : '',
      price: supplement.price > 0 ? supplement.price.toString() : ''
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', duration_minutes: '', price: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce supplément ?')) return;

    try {
      const { error } = await supabase
        .from('service_supplements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadSupplements();
      onSupplementsChange?.();
    } catch (error) {
      console.error('Error deleting supplement:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Suppléments (optionnels)
        </label>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-belleya-primary hover:text-belleya-deep font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom du supplément</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Baby Boomer"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
            />
          </div>

          <div className={serviceType === 'prestation' ? 'grid grid-cols-2 gap-3' : ''}>
            {serviceType === 'prestation' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Durée (min)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.duration_minutes}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length > 0) {
                      value = value.replace(/^0+/, '') || '0';
                      if (value === '0' && e.target.value.length === 1) {
                        value = '';
                      }
                    }
                    setFormData({ ...formData, duration_minutes: value });
                  }}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prix (€)</label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.price}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = value.split('.');
                  if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                  }
                  if (value.length > 0 && !value.startsWith('.')) {
                    const beforeDot = value.split('.')[0];
                    const afterDot = value.includes('.') ? '.' + value.split('.')[1] : '';
                    const cleanedBeforeDot = beforeDot.replace(/^0+/, '') || (afterDot ? '0' : '');
                    value = cleanedBeforeDot + afterDot;
                  }
                  setFormData({ ...formData, price: value });
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-belleya-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!formData.name || !formData.price}
              className="flex-1 px-3 py-2 text-sm bg-belleya-500 text-white rounded-lg hover:bg-belleya-primary disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {editingId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {supplements.length === 0 ? (
        <p className="text-xs text-gray-500 italic">Aucun supplément</p>
      ) : (
        <div className="space-y-2">
          {supplements.map((supplement) => (
            <div
              key={supplement.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{supplement.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  {serviceType === 'prestation' && supplement.duration_minutes > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      +{supplement.duration_minutes} min
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                    <Euro className="w-3 h-3" />
                    +{supplement.price.toFixed(2)} €
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleEdit(supplement)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(supplement.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
