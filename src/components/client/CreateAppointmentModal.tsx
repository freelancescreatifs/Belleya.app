import { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface CreateAppointmentModalProps {
  clientId: string;
  clientName: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateAppointmentModal({
  clientId,
  clientName,
  onClose,
  onCreated,
}: CreateAppointmentModalProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    service_id: '',
    notes: '',
  });

  useEffect(() => {
    loadServices();
  }, [user]);

  async function loadServices() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!formData.service_id) {
      alert('Veuillez sélectionner un service');
      return;
    }

    if (!formData.date) {
      alert('Veuillez sélectionner une date');
      return;
    }

    if (!formData.time) {
      alert('Veuillez sélectionner une heure');
      return;
    }

    setSaving(true);

    try {
      const selectedService = services.find(s => s.id === formData.service_id);
      if (!selectedService) {
        alert('Service introuvable');
        setSaving(false);
        return;
      }

      const startAt = new Date(`${formData.date}T${formData.time}`);
      const endAt = new Date(startAt.getTime() + selectedService.duration * 60000);

      const { error } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          client_id: clientId,
          service_id: formData.service_id,
          title: selectedService.name,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          status: 'confirmed',
          type: 'pro',
          notes: formData.notes || null,
        });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      alert('Rendez-vous créé avec succès');
      onCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      alert(`Erreur lors de la création du rendez-vous: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Créer un rendez-vous</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service *
              </label>
              <select
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner un service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.duration} min - {service.price}€)
                  </option>
                ))}
              </select>
              {services.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  Aucun service disponible. Créez-en un dans l'onglet Services.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
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
                disabled={saving || services.length === 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50"
              >
                {saving ? 'Création...' : 'Créer le RDV'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
