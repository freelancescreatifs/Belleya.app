import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Event, EventType, EventStatus } from '../../types/agenda';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toLocalDateString } from '../../lib/calendarHelpers';
import ClientSelector from '../shared/ClientSelector';
import StudentSelector from '../shared/StudentSelector';
import ClientForm from '../client/ClientForm';
import StudentForm from '../training/StudentForm';

interface EventFormProps {
  event?: Event;
  initialDate?: Date;
  onSave: (event: Event) => void;
  onCancel: () => void;
  existingEvents: any[];
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  service_type: 'prestation' | 'formation';
}

export default function EventForm({ event, initialDate, onSave, onCancel, existingEvents }: EventFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);

  const [formData, setFormData] = useState({
    type: event?.type || 'pro' as EventType,
    title: event?.title || '',
    startDate: event ? event.start_at.split('T')[0] : initialDate ? toLocalDateString(initialDate) : toLocalDateString(new Date()),
    startTime: event ? new Date(event.start_at).toTimeString().slice(0, 5) : initialDate ? `${String(initialDate.getHours()).padStart(2, '0')}:${String(initialDate.getMinutes()).padStart(2, '0')}` : '09:00',
    endDate: event ? event.end_at.split('T')[0] : initialDate ? toLocalDateString(initialDate) : toLocalDateString(new Date()),
    endTime: event ? new Date(event.end_at).toTimeString().slice(0, 5) : initialDate ? `${String(initialDate.getHours() + 1).padStart(2, '0')}:${String(initialDate.getMinutes()).padStart(2, '0')}` : '10:00',
    clientId: event?.client_id || '',
    studentId: event?.student_id || '',
    serviceId: event?.service_id || '',
    notes: event?.notes || '',
    status: event?.status || 'confirmed' as EventStatus,
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('services')
      .select('id, name, price, duration, service_type')
      .eq('user_id', user.id)
      .in('status', ['active', 'hidden'])
      .order('name');
    if (data) setServices(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.type === 'personal' && !formData.title.trim()) {
      alert('Veuillez saisir un titre');
      return;
    }

    if ((formData.type === 'pro' || formData.type === 'formation') && !formData.serviceId) {
      alert(formData.type === 'formation' ? 'Veuillez sélectionner une formation' : 'Veuillez sélectionner un service');
      return;
    }

    setLoading(true);

    try {
      const startAt = new Date(`${formData.startDate}T${formData.startTime}`);
      const endAt = new Date(`${formData.endDate}T${formData.endTime}`);

      if (startAt >= endAt) {
        alert('La date de fin doit être après la date de début');
        setLoading(false);
        return;
      }

      let eventTitle = formData.title;
      if ((formData.type === 'pro' || formData.type === 'formation') && formData.serviceId && !formData.title.trim()) {
        const selectedService = services.find(s => s.id === formData.serviceId);
        if (selectedService) {
          eventTitle = selectedService.name;
        }
      }

      if (!eventTitle.trim()) {
        eventTitle = formData.type === 'formation' ? 'Formation' : 'Rendez-vous professionnel';
      }

      let badgeType = null;
      if (formData.type === 'formation' && formData.studentId) {
        badgeType = 'student';
      } else if (formData.type === 'pro' && formData.clientId) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('is_vip, is_fidele')
          .eq('id', formData.clientId)
          .maybeSingle();

        if (clientData?.is_vip) {
          badgeType = 'vip';
        } else if (clientData?.is_fidele) {
          badgeType = 'fidele';
        }
      }

      const eventData = {
        user_id: user.id,
        type: formData.type,
        title: eventTitle,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        client_id: formData.type === 'formation' ? null : (formData.clientId || null),
        student_id: formData.type === 'formation' ? (formData.studentId || null) : null,
        service_id: formData.serviceId || null,
        notes: formData.notes || null,
        status: formData.status,
        badge_type: badgeType,
      };

      let savedEvent;

      if (event) {
        const { data, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id)
          .select()
          .single();

        if (error) throw error;
        savedEvent = data;
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;
        savedEvent = data;
      }

      if (savedEvent && formData.type === 'pro' && formData.clientId && formData.serviceId && formData.status === 'confirmed') {
        const selectedService = services.find(s => s.id === formData.serviceId);
        if (selectedService) {
          await syncWithClientHistory(savedEvent.id, formData.clientId, formData.serviceId, selectedService.price, startAt.toISOString());
        }
      }

      if (savedEvent) onSave(savedEvent);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const syncWithClientHistory = async (eventId: string, clientId: string, serviceId: string, price: number, serviceDate: string) => {
    try {
      if (!user) return;

      const selectedService = services.find(s => s.id === serviceId);
      if (!selectedService) return;

      const { error } = await supabase
        .from('client_services')
        .insert({
          user_id: user.id,
          client_id: clientId,
          service_id: serviceId,
          service_name: selectedService.name,
          service_category: 'beauty',
          price: price,
          duration: selectedService.duration,
          performed_at: serviceDate,
        });

      if (error) {
        console.error('Error syncing with client services:', error);
      }
    } catch (error) {
      console.error('Error in syncWithClientHistory:', error);
    }
  };

  const filteredServices = formData.type === 'formation'
    ? services.filter(s => s.service_type === 'formation')
    : formData.type === 'pro'
    ? services.filter(s => s.service_type === 'prestation')
    : [];

  const handleClientCreated = async (clientData: any, customData: Record<string, string>) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('[AgendaCreate] handleClientCreated DEBUT');
    console.log('[AgendaCreate] Table cible: clients');
    console.log('[AgendaCreate] Tenant (user_id):', user?.id);
    console.log('[AgendaCreate] Payload keys:', Object.keys(clientData));
    console.log('[AgendaCreate] First name:', clientData.first_name);
    console.log('[AgendaCreate] Last name:', clientData.last_name);
    console.log('═══════════════════════════════════════════════════════');

    if (!user) {
      console.error('[AgendaCreate] ERREUR CRITIQUE: No user found');
      throw new Error('Utilisateur non connecté');
    }

    try {
      const newClient = {
        user_id: user.id,
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        phone: clientData.phone || null,
        email: clientData.email || null,
        instagram_handle: clientData.instagram_handle || null,
        birth_date: clientData.birth_date || null,
        notes: clientData.notes || null,
        nail_type: clientData.nail_type || null,
        skin_type: clientData.skin_type || null,
        hair_type: clientData.hair_type || null,
        scalp_type: clientData.scalp_type || null,
        lash_type: clientData.lash_type || null,
        brow_type: clientData.brow_type || null,
        skin_conditions: clientData.skin_conditions || [],
      };

      console.log('[AgendaCreate] PAYLOAD COMPLET:', JSON.stringify(newClient, null, 2));
      console.log('[AgendaCreate] INSERT INTO clients...');

      const { data, error } = await supabase
        .from('clients')
        .insert(newClient)
        .select()
        .single();

      if (error) {
        console.error('═══════════════════════════════════════════════════════');
        console.error('[AgendaCreate] ERREUR INSERT DATABASE:');
        console.error('[AgendaCreate] Error code:', error.code);
        console.error('[AgendaCreate] Error message:', error.message);
        console.error('[AgendaCreate] Error details:', error.details);
        console.error('[AgendaCreate] Error hint:', error.hint);
        console.error('═══════════════════════════════════════════════════════');
        throw error;
      }

      if (!data) {
        console.error('[AgendaCreate] ERREUR: No data returned after insert');
        throw new Error('Aucune donnée retournée après l\'insertion');
      }

      console.log('[AgendaCreate] ✅ INSERT SUCCESS, ID:', data.id);

      console.log('[AgendaCreate] Vérification post-insert...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, user_id')
        .eq('id', data.id)
        .maybeSingle();

      if (verifyError) {
        console.error('[AgendaCreate] ⚠️ Erreur vérification:', verifyError);
      } else if (verifyData) {
        console.log('[AgendaCreate] ✅ VERIFICATION SUCCESS:', verifyData);
      } else {
        console.error('[AgendaCreate] ⚠️ Cliente non trouvée après insert!');
      }

      if (Object.keys(customData).length > 0) {
        console.log('[AgendaCreate] Insertion custom fields...');
        const customFieldsData = Object.entries(customData).map(([fieldId, value]) => ({
          client_id: data.id,
          field_id: fieldId,
          field_value: value,
        }));

        const { error: customError } = await supabase.from('client_custom_data').insert(customFieldsData);
        if (customError) {
          console.error('[AgendaCreate] Custom data error:', customError);
        }
      }

      console.log('[AgendaCreate] Auto-sélection cliente ID:', data.id);
      setFormData(prev => ({ ...prev, clientId: data.id }));

      console.log('[AgendaCreate] ✅ PROCESS TERMINE - RESTE SUR AGENDA');
      console.log('[AgendaCreate] Modal sera fermé par ClientForm via onClose()');
      console.log('═══════════════════════════════════════════════════════');
    } catch (error: any) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('[AgendaCreate] ❌ EXCEPTION CATCHEE:');
      console.error('[AgendaCreate] Error type:', error?.constructor?.name);
      console.error('[AgendaCreate] Error code:', error?.code);
      console.error('[AgendaCreate] Error message:', error?.message);
      console.error('[AgendaCreate] Error details:', error?.details);
      console.error('[AgendaCreate] Full error:', error);
      console.error('═══════════════════════════════════════════════════════');
      console.error('[AgendaCreate] ❌ ERREUR - Modal reste ouvert pour réessayer');

      alert(`Erreur lors de la création de la cliente:\n${error?.message || 'Erreur inconnue'}\n\nVeuillez réessayer.`);
      throw error;
    }
  };

  const handleStudentCreated = (studentId: string) => {
    console.log('[EventForm] handleStudentCreated called, ID:', studentId);
    if (!studentId) {
      console.error('[EventForm] Invalid student ID');
      return;
    }
    setFormData(prev => ({ ...prev, studentId }));
    console.log('[EventForm] Élève auto-sélectionné, modal sera fermé par StudentForm via onClose()');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de rendez-vous *
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType, serviceId: '' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
          disabled={event?.type === 'google' || event?.type === 'planity'}
        >
          <option value="pro">Prestation</option>
          <option value="formation">Formation</option>
          <option value="personal">Personnel</option>
        </select>
      </div>

      {formData.type === 'formation' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Formation *
          </label>
          <select
            value={formData.serviceId}
            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            required
          >
            <option value="">Sélectionner une formation</option>
            {filteredServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.price}€ ({service.duration} min)
              </option>
            ))}
          </select>
        </div>
      )}

      {formData.type === 'pro' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service *
          </label>
          <select
            value={formData.serviceId}
            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            required
          >
            <option value="">Sélectionner un service</option>
            {filteredServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.price}€ ({service.duration} min)
              </option>
            ))}
          </select>
        </div>
      )}

      {formData.type === 'personal' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            required
          />
        </div>
      )}

      {formData.type === 'formation' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Élève (optionnel)
          </label>
          <StudentSelector
            value={formData.studentId}
            onChange={(studentId) => setFormData({ ...formData, studentId })}
            placeholder="Sélectionner un élève"
          />
          <button
            type="button"
            onClick={() => {
              console.log('[Agenda] openCreateStudent modal', { component: 'StudentForm', source: 'Agenda', isModal: true });
              setShowStudentForm(true);
            }}
            className="w-full mt-2 px-4 py-2 text-left bg-belaya-50 hover:bg-belaya-100 text-belaya-primary font-medium flex items-center gap-2 rounded-lg border border-belaya-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer un nouvel élève
          </button>
        </div>
      )}

      {formData.type === 'pro' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cliente (optionnel)
          </label>
          <ClientSelector
            value={formData.clientId}
            onChange={(clientId) => setFormData({ ...formData, clientId })}
            placeholder="Sélectionner une cliente"
          />
          <button
            type="button"
            onClick={() => {
              console.log('[Agenda] openCreateClient modal', { component: 'ClientForm', source: 'Agenda', isModal: true });
              setShowClientForm(true);
            }}
            className="w-full mt-2 px-4 py-2 text-left bg-belaya-50 hover:bg-belaya-100 text-belaya-primary font-medium flex items-center gap-2 rounded-lg border border-belaya-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer une nouvelle cliente
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date début *
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Heure début *
          </label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date fin *
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Heure fin *
          </label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            required
          />
        </div>
      </div>

      {(formData.type === 'pro' || formData.type === 'formation') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titre (optionnel)
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            placeholder={formData.type === 'formation' ? "Titre personnalisé de la formation" : "Titre personnalisé du rendez-vous"}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
          rows={3}
          placeholder="Notes ou remarques"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Statut
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
        >
          <option value="confirmed">Confirmé</option>
          <option value="pending">En attente</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-belaya-500 text-white rounded-lg hover:bg-belaya-primary transition-colors disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : event ? 'Modifier' : 'Créer'}
        </button>
      </div>

      {showClientForm && (
        <ClientForm
          isEdit={false}
          onSubmit={handleClientCreated}
          onClose={() => {
            console.log('[Agenda] Fermeture modal ClientForm (onClose appelé)');
            setShowClientForm(false);
          }}
          source="agenda"
        />
      )}

      {showStudentForm && (
        <StudentForm
          onClose={() => {
            console.log('[Agenda] Fermeture modal StudentForm (onClose appelé)');
            setShowStudentForm(false);
          }}
          onSuccess={() => {
            console.log('[Agenda] StudentForm onSuccess appelé');
          }}
          onStudentCreated={handleStudentCreated}
          source="agenda"
        />
      )}
    </form>
  );
}
