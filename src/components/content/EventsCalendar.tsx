import { useState, useEffect } from 'react';
import { Calendar, Lightbulb, Sparkles, Plus, X, Bell, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';

interface Event {
  id: string;
  date: string;
  title: string;
  theme: string;
  industry: string[];
  suggestions: { title: string; type: string }[];
  is_global: boolean;
}

interface EventsCalendarProps {
  onContentAdded?: () => void;
}

export default function EventsCalendar({ onContentAdded }: EventsCalendarProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, selectedMonth]);

  async function loadEvents() {
    if (!user) return;

    setLoading(true);
    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);

      const { data, error } = await supabase
        .from('marronniers')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 14;
  });

  function getDaysUntil(date: string): number {
    const eventDate = new Date(date);
    const today = new Date();
    return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  async function handleAddToCalendar(event: Event, suggestion: { title: string; type: string }, index: number) {
    if (!user) return;

    const uniqueId = `${event.id}-${index}`;
    setAddingId(uniqueId);

    try {
      const { data: companyData } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const { error } = await supabase
        .from('content_calendar')
        .insert([{
          user_id: user.id,
          company_id: companyData?.id || null,
          title: suggestion.title,
          description: `Contenu pour ${event.title}`,
          content_type: suggestion.type,
          platform: ['instagram'],
          publication_date: event.date,
          publication_time: '12:00',
          status: 'script',
          notes: `Événement: ${event.title}\nThème: ${event.theme}\nDate événement: ${event.date}`,
          feed_order: 0
        }]);

      if (error) throw error;

      showToast('success', `"${suggestion.title}" ajouté au calendrier !`);

      if (onContentAdded) {
        onContentAdded();
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      showToast('error', 'Erreur lors de l\'ajout au calendrier');
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Événements à prévoir</h2>
              <p className="text-sm text-gray-600">Dates importantes et temps forts</p>
            </div>
          </div>
        </div>

        {upcomingEvents.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Événements dans les 14 prochains jours</h3>
            </div>
            <div className="space-y-2">
              {upcomingEvents.map(event => {
                const daysUntil = getDaysUntil(event.date);
                return (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {new Date(event.date).getDate()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {monthNames[new Date(event.date).getMonth()].substring(0, 3)}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">{event.theme}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      daysUntil === 0
                        ? 'bg-red-100 text-red-800'
                        : daysUntil <= 3
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {daysUntil === 0 ? "Aujourd'hui" : daysUntil === 1 ? 'Demain' : `Dans ${daysUntil}j`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index + 1}>
                {month} {selectedYear}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucun événement ce mois-ci</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const eventDate = new Date(event.date);
              const formattedDate = eventDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              });

              return (
                <div
                  key={event.id}
                  className="p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{event.title}</h3>
                        <p className="text-sm text-gray-600">{formattedDate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-gray-900">Thème : {event.theme}</span>
                    </div>
                  </div>

                  {event.suggestions && event.suggestions.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-purple-600" />
                        <h4 className="text-sm font-semibold text-gray-900">Idées de contenu</h4>
                      </div>
                      <div className="space-y-2">
                        {event.suggestions.map((suggestion, index) => {
                          const uniqueId = `${event.id}-${index}`;
                          const isAdding = addingId === uniqueId;
                          return (
                            <div key={index} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg">
                              <div className="flex items-center gap-2 flex-1">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                                <span className="text-sm text-gray-700">{suggestion.title}</span>
                                <span className="px-2 py-0.5 bg-blue-100 rounded-full text-xs text-blue-700 flex-shrink-0">
                                  {suggestion.type}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAddToCalendar(event, suggestion, index)}
                                disabled={isAdding}
                                className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all text-xs font-medium flex-shrink-0 disabled:opacity-50"
                              >
                                {isAdding ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Plus className="w-3 h-3" />
                                )}
                                {isAdding ? '...' : 'Ajouter'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
