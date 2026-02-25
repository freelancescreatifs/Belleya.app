import { useEffect, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CalendarView as ViewType, FilterType, CalendarItem, Event, CalendarTask, SocialMediaContent } from '../types/agenda';
import CalendarView from '../components/agenda/CalendarView';
import ViewToggle from '../components/agenda/ViewToggle';
import FilterToggle from '../components/agenda/FilterToggle';
import ColorLegend from '../components/agenda/ColorLegend';
import EventDrawer from '../components/agenda/EventDrawer';
import TaskDrawer from '../components/agenda/TaskDrawer';
import SocialMediaDrawer from '../components/agenda/SocialMediaDrawer';
import EventForm from '../components/agenda/EventForm';
import TaskForm from '../components/agenda/TaskForm';
import GoogleCalendarButton from '../components/agenda/GoogleCalendarButton';
import ConfirmDragModal from '../components/agenda/ConfirmDragModal';
import ContentFormModal from '../components/content/ContentFormModal';
import { formatMonthYear } from '../lib/calendarHelpers';

export default function Agenda() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewType>('month');
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(() => {
    const saved = localStorage.getItem('agenda-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return new Set<FilterType>(parsed);
      } catch {
        return new Set<FilterType>(['events', 'tasks', 'social_media']);
      }
    }
    return new Set<FilterType>(['events', 'tasks', 'social_media']);
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [socialMediaContents, setSocialMediaContents] = useState<SocialMediaContent[]>([]);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showContentForm, setShowContentForm] = useState(false);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [dragConfirmation, setDragConfirmation] = useState<{
    item: CalendarItem;
    newStart: Date;
    newEnd: Date;
    mode: 'move' | 'resize';
  } | null>(null);

  useEffect(() => {
    loadData();

    if (!user) return;

    const tasksChannel = supabase
      .channel('agenda-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    const eventsChannel = supabase
      .channel('agenda-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    const contentChannel = supabase
      .channel('agenda-content-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_calendar',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadSocialMediaContents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(contentChannel);
    };
  }, [user]);

  useEffect(() => {
    buildCalendarItems();
  }, [events, tasks, socialMediaContents, activeFilters]);

  useEffect(() => {
    localStorage.setItem('agenda-filters', JSON.stringify(Array.from(activeFilters)));
  }, [activeFilters]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        loadEvents(),
        loadStudentFormations(),
        loadTasks(),
        loadSocialMediaContents(),
        checkGoogleConnection()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        client:clients(id, first_name, last_name, is_fidele, is_vip),
        student:students(id, first_name, last_name),
        service:services(id, name)
      `)
      .eq('user_id', user.id)
      .order('start_at');

    if (error) {
      console.error('Error loading events:', error);
      return;
    }

    if (data) {
      const eventsWithDetails = data.map(event => {
        let badge_type = event.badge_type;
        let displayTitle = event.title;

        if (event.student) {
          badge_type = 'student';
          const studentName = `${event.student.first_name} ${event.student.last_name}`.trim();
          const serviceName = event.service?.name || event.title;
          displayTitle = `🎓 ${serviceName} — ${studentName}`;
        } else if (event.client) {
          const clientName = `${event.client.first_name} ${event.client.last_name}`.trim();
          const serviceName = event.service?.name || event.title;

          if (event.client.is_vip) {
            badge_type = 'vip';
            displayTitle = `💎 ${serviceName} — ${clientName}`;
          } else if (event.client.is_fidele) {
            badge_type = 'fidele';
            displayTitle = `⭐ ${serviceName} — ${clientName}`;
          } else {
            displayTitle = `${serviceName} — ${clientName}`;
          }
        }

        return {
          ...event,
          title: displayTitle,
          badge_type,
          client: event.client ? {
            ...event.client,
            name: `${event.client.first_name} ${event.client.last_name}`.trim()
          } : null,
          student: event.student ? {
            ...event.student,
            name: `${event.student.first_name} ${event.student.last_name}`.trim()
          } : null
        };
      });
      setEvents(eventsWithDetails as Event[]);
    }
  };

  const loadStudentFormations = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.company_id) return;

    const { data: students, error } = await supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        training_start_date,
        training_end_date,
        formation_id,
        service:services!students_formation_id_fkey(id, name)
      `)
      .eq('company_id', profile.company_id)
      .not('training_start_date', 'is', null)
      .not('training_end_date', 'is', null);

    if (error) {
      console.error('Error loading student formations:', error);
      return;
    }

    if (students) {
      const formationEvents = students.map(student => {
        const studentName = `${student.first_name} ${student.last_name}`.trim();
        const serviceName = student.service?.name || 'Formation';

        const startDate = new Date(student.training_start_date);
        startDate.setHours(9, 0, 0, 0);

        const endDate = new Date(student.training_end_date);
        endDate.setHours(18, 0, 0, 0);

        return {
          id: `formation-${student.id}`,
          user_id: user.id,
          type: 'formation' as const,
          title: `🎓 ${serviceName} — ${studentName}`,
          start_at: startDate.toISOString(),
          end_at: endDate.toISOString(),
          student_id: student.id,
          service_id: student.formation_id,
          status: 'confirmed' as const,
          badge_type: 'student' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          student: {
            id: student.id,
            name: studentName
          },
          service: student.service ? {
            id: student.service.id,
            name: student.service.name
          } : undefined
        };
      });

      setEvents(prev => [...prev, ...formationEvents as Event[]]);
    }
  };

  const loadTasks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .or('scheduled_at.not.is.null,start_date.not.is.null')
      .order('scheduled_at', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error loading tasks:', error);
      return;
    }

    if (data) {
      setTasks(data as CalendarTask[]);
    }
  };

  const loadSocialMediaContents = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('content_calendar')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['script', 'shooting', 'editing', 'scheduled', 'published'])
      .not('publication_date', 'is', null)
      .order('publication_date', { ascending: true });

    if (error) {
      console.error('Error loading social media contents:', error);
      return;
    }

    if (data) {
      setSocialMediaContents(data as SocialMediaContent[]);
    }
  };

  const checkGoogleConnection = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('calendar_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .eq('is_active', true)
      .maybeSingle();

    setIsGoogleConnected(!!data);
  };

  const buildCalendarItems = () => {
    const items: CalendarItem[] = [];

    if (import.meta.env.DEV) {
      const eventsByType = events.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('[Agenda] Events by type:', eventsByType);
      console.log('[Agenda] Active filters:', Array.from(activeFilters));
    }

    if (activeFilters.has('events')) {
      const filteredEvents = events.filter(e => e.type !== 'formation');
      if (import.meta.env.DEV) {
        console.log(`[Agenda] Showing ${filteredEvents.length} rendez-vous (excluded ${events.filter(e => e.type === 'formation').length} formations)`);
      }

      filteredEvents.forEach((event) => {
        let color = 'bg-rose-500';
        if (event.type === 'pro') {
          color = 'bg-blue-500';
        }

        items.push({
          id: event.id,
          type: 'event',
          title: event.title,
          start: new Date(event.start_at),
          end: new Date(event.end_at),
          color,
          data: event,
        });
      });
    }

    if (activeFilters.has('tasks')) {
      if (import.meta.env.DEV) {
        console.log(`[Agenda] Showing ${tasks.length} tasks`);
      }

      tasks.forEach((task: any) => {
        let start: Date;
        let end: Date;

        if (task.scheduled_at) {
          start = new Date(task.scheduled_at);
          end = new Date(start.getTime() + (task.duration_minutes || 30) * 60000);
        } else if (task.start_date) {
          start = new Date(task.start_date);
          if (task.start_time) {
            const [hours, minutes] = task.start_time.split(':');
            start.setHours(parseInt(hours), parseInt(minutes));
          } else {
            start.setHours(9, 0);
          }

          if (task.end_date) {
            end = new Date(task.end_date);
            if (task.end_time) {
              const [hours, minutes] = task.end_time.split(':');
              end.setHours(parseInt(hours), parseInt(minutes));
            } else {
              end.setHours(18, 0);
            }
          } else {
            end = new Date(start.getTime() + (task.duration_minutes || 30) * 60000);
          }
        } else {
          return;
        }

        items.push({
          id: task.id,
          type: 'task',
          title: task.title,
          start,
          end,
          color: 'bg-amber-500',
          data: task,
        });
      });
    }

    if (activeFilters.has('social_media')) {
      if (import.meta.env.DEV) {
        console.log(`[Agenda] Showing ${socialMediaContents.length} social media posts`);
      }

      socialMediaContents.forEach((content) => {
        const start = new Date(content.publication_date);
        if (content.publication_time) {
          const [hours, minutes] = content.publication_time.split(':');
          start.setHours(parseInt(hours), parseInt(minutes));
        } else {
          start.setHours(12, 0);
        }

        const end = new Date(start.getTime() + 30 * 60000);

        items.push({
          id: content.id,
          type: 'social_media',
          title: content.enriched_title || content.title,
          start,
          end,
          color: 'bg-belleya-500',
          data: content,
        });
      });
    }

    if (import.meta.env.DEV) {
      const itemsByType = items.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('[Agenda] Final calendar items by type:', itemsByType);
      console.log('[Agenda] Total items:', items.length);
    }

    setCalendarItems(items);
  };

  const handleItemClick = (item: CalendarItem) => {
    setSelectedItem(item);
  };

  const handleDayClick = (date: Date) => {
    const isMobile = window.innerWidth < 768;

    if (isMobile && (view === 'week' || view === 'month')) {
      setCurrentDate(date);
      setView('day');
    } else {
      setSelectedDate(date);
      setShowEventForm(true);
    }
  };

  const handleTimeSlotDoubleClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventForm(true);
  };

  const handleEventUpdate = async (updatedEvent: Event) => {
    await loadEvents();
    setSelectedItem(null);
  };

  const handleEventDelete = async (eventId: string) => {
    await loadEvents();
    setSelectedItem(null);
  };

  const handleEventCreate = async (newEvent: Event) => {
    await loadEvents();
    setShowEventForm(false);
    setSelectedDate(null);
  };

  const handleTaskUpdate = async (updatedTask: CalendarTask) => {
    await loadTasks();
    setSelectedItem(null);
  };

  const handleTaskCreate = async (newTask: CalendarTask) => {
    await loadTasks();
    setShowTaskForm(false);
    setSelectedDate(null);
  };

  const handleTaskDelete = async (taskId: string) => {
    await loadTasks();
    setSelectedItem(null);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }

    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleGoogleSync = async () => {
    alert('Synchronisation avec Google Calendar...');
  };

  const handleDragComplete = (item: CalendarItem, newStart: Date, newEnd: Date, mode: 'move' | 'resize') => {
    setDragConfirmation({ item, newStart, newEnd, mode });
  };

  const confirmDrag = async () => {
    if (!dragConfirmation) return;

    const { item, newStart, newEnd, mode } = dragConfirmation;

    if (mode === 'move') {
      await handleEventDrop(item.id, newStart, newEnd);
    } else {
      await handleEventResize(item.id, newStart, newEnd);
    }

    setDragConfirmation(null);
  };

  const cancelDrag = () => {
    setDragConfirmation(null);
  };

  const handleEventDrop = async (itemId: string, newStart: Date, newEnd: Date) => {
    const originalEvents = [...events];
    const originalTasks = [...tasks];
    const originalContents = [...socialMediaContents];

    const item = calendarItems.find(i => i.id === itemId);
    if (!item) return;

    if (item.type === 'social_media') {
      const newDate = newStart.toISOString().split('T')[0];
      const newTime = `${String(newStart.getHours()).padStart(2, '0')}:${String(newStart.getMinutes()).padStart(2, '0')}`;

      setSocialMediaContents(prevContents => prevContents.map(content =>
        content.id === itemId
          ? { ...content, publication_date: newDate, publication_time: newTime }
          : content
      ));

      supabase
        .from('content_calendar')
        .update({
          publication_date: newDate,
          publication_time: newTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating content:', error);
            setSocialMediaContents(originalContents);
            alert(`Erreur: ${error.message}`);
          }
        });
    } else if (item.type === 'task') {
      const durationMinutes = Math.round((newEnd.getTime() - newStart.getTime()) / 60000);

      setTasks(prevTasks => prevTasks.map(task =>
        task.id === itemId
          ? { ...task, scheduled_at: newStart.toISOString(), duration_minutes: durationMinutes }
          : task
      ));

      supabase
        .from('tasks')
        .update({
          scheduled_at: newStart.toISOString(),
          duration_minutes: durationMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating task:', error);
            setTasks(originalTasks);
            alert(`Erreur: ${error.message}`);
          }
        });
    } else {
      setEvents(prevEvents => prevEvents.map(event =>
        event.id === itemId
          ? { ...event, start_at: newStart.toISOString(), end_at: newEnd.toISOString() }
          : event
      ));

      if (itemId.startsWith('formation-')) {
        const studentId = itemId.replace('formation-', '');
        const startDate = newStart.toISOString().split('T')[0];
        const endDate = newEnd.toISOString().split('T')[0];

        supabase
          .from('students')
          .update({
            training_start_date: startDate,
            training_end_date: endDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', studentId)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating student:', error);
              setEvents(originalEvents);
              alert(`Erreur: ${error.message}`);
            }
          });
      } else {
        supabase
          .from('events')
          .update({
            start_at: newStart.toISOString(),
            end_at: newEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating event:', error);
              setEvents(originalEvents);
              alert(`Erreur: ${error.message}`);
            }
          });
      }
    }
  };

  const handleEventResize = async (itemId: string, newStart: Date, newEnd: Date) => {
    const originalEvents = [...events];
    const originalTasks = [...tasks];
    const originalContents = [...socialMediaContents];

    const item = calendarItems.find(i => i.id === itemId);
    if (!item) return;

    if (item.type === 'social_media') {
      const newDate = newStart.toISOString().split('T')[0];
      const newTime = `${String(newStart.getHours()).padStart(2, '0')}:${String(newStart.getMinutes()).padStart(2, '0')}`;

      setSocialMediaContents(prevContents => prevContents.map(content =>
        content.id === itemId
          ? { ...content, publication_date: newDate, publication_time: newTime }
          : content
      ));

      supabase
        .from('content_calendar')
        .update({
          publication_date: newDate,
          publication_time: newTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating content:', error);
            setSocialMediaContents(originalContents);
            alert(`Erreur: ${error.message}`);
          }
        });
    } else if (item.type === 'task') {
      const durationMinutes = Math.round((newEnd.getTime() - newStart.getTime()) / 60000);

      setTasks(prevTasks => prevTasks.map(task =>
        task.id === itemId
          ? { ...task, scheduled_at: newStart.toISOString(), duration_minutes: durationMinutes }
          : task
      ));

      supabase
        .from('tasks')
        .update({
          scheduled_at: newStart.toISOString(),
          duration_minutes: durationMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating task:', error);
            setTasks(originalTasks);
            alert(`Erreur: ${error.message}`);
          }
        });
    } else {
      setEvents(prevEvents => prevEvents.map(event =>
        event.id === itemId
          ? { ...event, start_at: newStart.toISOString(), end_at: newEnd.toISOString() }
          : event
      ));

      if (itemId.startsWith('formation-')) {
        const studentId = itemId.replace('formation-', '');
        const startDate = newStart.toISOString().split('T')[0];
        const endDate = newEnd.toISOString().split('T')[0];

        supabase
          .from('students')
          .update({
            training_start_date: startDate,
            training_end_date: endDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', studentId)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating student:', error);
              setEvents(originalEvents);
              alert(`Erreur: ${error.message}`);
            }
          });
      } else {
        supabase
          .from('events')
          .update({
            start_at: newStart.toISOString(),
            end_at: newEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId)
          .then(({ error }) => {
            if (error) {
              console.error('Error updating event:', error);
              setEvents(originalEvents);
              alert(`Erreur: ${error.message}`);
            }
          });
      }
    }
  };

  const getDateLabel = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else if (view === 'week') {
      const weekStart = new Date(currentDate);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - (day === 0 ? 6 : day - 1);
      weekStart.setDate(diff);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      return `${weekStart.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      })} - ${weekEnd.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`;
    } else {
      return formatMonthYear(currentDate);
    }
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Agenda</h1>
            <p className="text-sm sm:text-base text-gray-600">Gérez vos rendez-vous et tâches</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <GoogleCalendarButton onSync={handleGoogleSync} isConnected={isGoogleConnected} />
            <button
              onClick={() => {
                setSelectedDate(new Date());
                setShowTaskForm(true);
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-white rounded-lg hover:from-amber-600 hover:to-amber-500 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Nouvelle tâche</span>
              <span className="xs:hidden">Tâche</span>
            </button>
            <button
              onClick={() => {
                setSelectedDate(new Date());
                setShowEventForm(true);
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-belleya-primary to-[#f06bb4] text-white rounded-lg hover:from-belleya-deep hover:to-belleya-primary transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Nouveau rendez-vous</span>
              <span className="xs:hidden">RDV</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="w-full">
            <FilterToggle activeFilters={activeFilters} onChange={setActiveFilters} />
          </div>

          <div className="w-full space-y-2">
            <ViewToggle view={view} onChange={setView} />
            <div className="flex justify-center">
              <button
                onClick={handleToday}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
              >
                Aujourd'hui
              </button>
            </div>
          </div>

          <div className="hidden sm:block">
            <ColorLegend />
          </div>
        </div>
      </div>

      <div className="mb-4 sm:mb-6 bg-white rounded-lg border border-gray-200 p-3 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => handleNavigate('prev')}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <button
              onClick={() => handleNavigate('next')}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>

          <h2 className="text-sm sm:text-lg font-semibold text-gray-900 capitalize text-center flex-1">{getDateLabel()}</h2>
        </div>
      </div>

      <CalendarView
        view={view}
        currentDate={currentDate}
        items={calendarItems}
        onItemClick={handleItemClick}
        onDayClick={handleDayClick}
        onTimeSlotDoubleClick={handleTimeSlotDoubleClick}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        onDragComplete={handleDragComplete}
      />

      {selectedItem && selectedItem.type === 'event' && (
        <EventDrawer
          event={selectedItem.data as Event}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleEventUpdate}
          onDelete={handleEventDelete}
          existingEvents={calendarItems}
        />
      )}

      {selectedItem && selectedItem.type === 'task' && (
        <TaskDrawer
          task={selectedItem.data as CalendarTask}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}

      {selectedItem && selectedItem.type === 'social_media' && (
        <SocialMediaDrawer
          content={selectedItem.data as SocialMediaContent}
          onClose={() => setSelectedItem(null)}
          onEdit={(contentId) => {
            setEditingContentId(contentId);
            setShowContentForm(true);
            setSelectedItem(null);
          }}
          onRefresh={loadSocialMediaContents}
        />
      )}

      {dragConfirmation && (
        <ConfirmDragModal
          item={dragConfirmation.item}
          newStart={dragConfirmation.newStart}
          newEnd={dragConfirmation.newEnd}
          mode={dragConfirmation.mode}
          onConfirm={confirmDrag}
          onCancel={cancelDrag}
        />
      )}

      {showEventForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => {
            setShowEventForm(false);
            setSelectedDate(null);
          }}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Nouveau rendez-vous</h2>
                <button
                  onClick={() => {
                    setShowEventForm(false);
                    setSelectedDate(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5 text-gray-500 rotate-45" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <EventForm
                  initialDate={selectedDate || undefined}
                  onSave={handleEventCreate}
                  onCancel={() => {
                    setShowEventForm(false);
                    setSelectedDate(null);
                  }}
                  existingEvents={calendarItems}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showTaskForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => {
            setShowTaskForm(false);
            setSelectedDate(null);
          }}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Nouvelle tâche</h2>
                <button
                  onClick={() => {
                    setShowTaskForm(false);
                    setSelectedDate(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5 text-gray-500 rotate-45" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <TaskForm
                  initialDate={selectedDate || undefined}
                  onSave={handleTaskCreate}
                  onCancel={() => {
                    setShowTaskForm(false);
                    setSelectedDate(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showContentForm && (
        <ContentFormModal
          mode="edit"
          contentId={editingContentId || undefined}
          onClose={() => {
            setShowContentForm(false);
            setEditingContentId(null);
          }}
          onSuccess={() => {
            loadSocialMediaContents();
            setShowContentForm(false);
            setEditingContentId(null);
          }}
        />
      )}
    </div>
  );
}
