import { useState, useEffect } from 'react';
import { Mail, TrendingUp, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import MarketingStats from '../components/marketing/MarketingStats';
import ClientReminderList from '../components/marketing/ClientReminderList';
import SendReminderModal from '../components/marketing/SendReminderModal';
import MarketingHistory from '../components/marketing/MarketingHistory';
import MarketingDebug from '../components/marketing/MarketingDebug';
import {
  ClientReminder,
  ClientWithLastEvent,
  processClientForReminders,
  calculatePotentialRevenue,
  generateDebugInfo,
  MarketingDebugInfo
} from '../lib/marketingHelpers';

export default function Marketing() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [reminders, setReminders] = useState<ClientReminder[]>([]);
  const [debugInfo, setDebugInfo] = useState<MarketingDebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reminders' | 'history'>('reminders');

  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedClients, setSelectedClients] = useState<ClientReminder[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<'sms' | 'email'>('sms');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, birth_date')
        .eq('user_id', user!.id)
        .eq('is_archived', false)
        .order('first_name');

      if (clientsError) {
        console.error('[Marketing] Error loading clients:', clientsError);
        throw clientsError;
      }

      const allClients = clientsData || [];
      console.log('[Marketing] Total clients loaded:', allClients.length);

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          client_id,
          start_at,
          status,
          service:services(
            id,
            name,
            price,
            recommended_frequency
          )
        `)
        .eq('user_id', user!.id)
        .eq('type', 'client')
        .in('status', ['confirmed', 'pending'])
        .order('start_at', { ascending: false });

      if (eventsError) {
        console.error('[Marketing] Error loading events:', eventsError);
        throw eventsError;
      }

      console.log('[Marketing] Total events loaded:', eventsData?.length || 0);

      const clientsWithEvents: ClientWithLastEvent[] = allClients.map(client => {
        const clientEvents = eventsData?.filter(e => e.client_id === client.id) || [];

        const totalEvents = clientEvents.length;
        const totalSpent = clientEvents.reduce((sum, e) => {
          return sum + (e.service?.price || 0);
        }, 0);

        const lastEvent = clientEvents.length > 0 ? {
          start_at: clientEvents[0].start_at,
          status: clientEvents[0].status,
          service: clientEvents[0].service ? {
            name: clientEvents[0].service.name,
            price: clientEvents[0].service.price,
            recommended_frequency: clientEvents[0].service.recommended_frequency
          } : null
        } : null;

        return {
          id: client.id,
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
          phone: client.phone,
          birth_date: client.birth_date,
          last_event: lastEvent,
          total_events: totalEvents,
          total_spent: totalSpent
        };
      });

      setClients(clientsWithEvents);

      console.log('[Marketing] Clients with events processed:', clientsWithEvents.length);
      console.log('[Marketing] Sample client:', clientsWithEvents[0]);

      const clientReminders: ClientReminder[] = [];

      for (const client of clientsWithEvents) {
        const reminder = processClientForReminders(client);
        if (reminder) {
          clientReminders.push(reminder);
          console.log('[Marketing] Client added to reminders:', {
            name: `${client.first_name} ${client.last_name}`,
            last_appointment: reminder.last_appointment_date,
            frequency_days: reminder.recommended_frequency_days,
            service: reminder.service_name,
            days_late: reminder.days_late,
            days_until_birthday: reminder.days_until_birthday,
            type: reminder.reminder_type
          });
        }
      }

      const sortedReminders = clientReminders.sort((a, b) => {
        const priorityOrder = { birthday: 0, strong: 1, standard: 2, inactive: 3, gentle: 4 };
        return priorityOrder[a.reminder_type] - priorityOrder[b.reminder_type];
      });

      setReminders(sortedReminders);

      const debug = generateDebugInfo(clientsWithEvents, sortedReminders);
      setDebugInfo(debug);

      console.log('[Marketing] Debug info:', debug);
      console.log('[Marketing] Total reminders:', sortedReminders.length);
    } catch (err) {
      console.error('[Marketing] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = (clients: ClientReminder[], channel: 'sms' | 'email') => {
    setSelectedClients(clients);
    setSelectedChannel(channel);
    setShowSendModal(true);
  };

  const calculateStats = () => {
    const clientsToRemindThisWeek = reminders.filter(r => {
      if (r.reminder_type === 'birthday' && r.days_until_birthday !== null) {
        return r.days_until_birthday <= 7;
      }
      return r.days_late > 0 && r.days_late <= 7;
    }).length;

    const clientsLate = reminders.filter(r => r.days_late > 0).length;

    const upcomingBirthdays = reminders.filter(
      r => r.days_until_birthday !== null && r.days_until_birthday <= 30
    ).length;

    const totalActiveClients = clients.filter(c => c.last_appointment_date).length;
    const inactiveClients = reminders.filter(r => r.reminder_type === 'inactive').length;

    const returnRate = totalActiveClients > 0
      ? Math.round(((totalActiveClients - inactiveClients) / totalActiveClients) * 100)
      : 0;

    const potentialRevenue = calculatePotentialRevenue(reminders);

    return {
      clientsToRemindThisWeek,
      clientsLate,
      upcomingBirthdays,
      returnRate,
      potentialRevenue
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <div className="text-center text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Marketing & Relances</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          Relancez vos clientes intelligemment et remplissez votre planning
        </p>
      </div>

      <MarketingStats
        clientsToRemind={stats.clientsToRemindThisWeek}
        clientsLate={stats.clientsLate}
        upcomingBirthdays={stats.upcomingBirthdays}
        returnRate={stats.returnRate}
        potentialRevenue={stats.potentialRevenue}
      />

      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'reminders'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden xs:inline">Relances ({reminders.length})</span>
              <span className="xs:hidden">({reminders.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Historique
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'reminders' ? (
        <>
          {debugInfo && <MarketingDebug debugInfo={debugInfo} />}

          {reminders.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune relance à faire
              </h3>
              <p className="text-gray-600">
                {clients.length === 0
                  ? 'Commencez par ajouter des clientes dans l\'onglet Clients.'
                  : 'Toutes vos clientes sont à jour ! Revenez bientôt.'}
              </p>
            </div>
          ) : (
            <ClientReminderList
              clients={reminders}
              onSendReminders={handleSendReminders}
            />
          )}
        </>
      ) : (
        <MarketingHistory userId={user!.id} />
      )}

      {showSendModal && (
        <SendReminderModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          clients={selectedClients}
          channel={selectedChannel}
          userId={user!.id}
        />
      )}
    </div>
  );
}
