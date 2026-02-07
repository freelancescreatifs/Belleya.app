import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileText, Video, Scissors, Subtitles, CheckCircle, Send, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import InfoTooltip from '../shared/InfoTooltip';

interface ProductionEvent {
  id: string;
  title: string;
  date: string;
  stage: 'script' | 'shooting' | 'editing' | 'subtitles' | 'validation' | 'scheduling';
  status: string;
  platform: string;
  contentId: string;
}

interface ProductionCalendarProps {
  onContentEdit?: (contentId: string) => void;
}

type CalendarView = 'day' | 'week' | 'month';

const STAGE_CONFIG = {
  script: { label: 'Script', icon: FileText, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  shooting: { label: 'Tournage', icon: Video, color: 'bg-red-100 text-red-700 border-red-300' },
  editing: { label: 'Montage', icon: Scissors, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  subtitles: { label: 'Sous-titres', icon: Subtitles, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  validation: { label: 'Validation', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-300' },
  scheduling: { label: 'Planifié', icon: Send, color: 'bg-orange-100 text-orange-700 border-orange-300' },
};

export default function ProductionCalendar({ onContentEdit }: ProductionCalendarProps) {
  const { user } = useAuth();
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<ProductionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilters, setStageFilters] = useState<string[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 100,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    if (user) {
      loadProductionEvents();
    }
  }, [user, currentDate, view]);

  async function loadProductionEvents() {
    if (!user) return;

    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      if (view === 'day') {
        startDate = new Date(currentDate);
        endDate = new Date(currentDate);
      } else if (view === 'week') {
        startDate = new Date(currentDate);
        startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
      } else {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      }

      const { data, error } = await supabase
        .from('content_calendar')
        .select('id, title, status, platform, date_script, date_shooting, date_editing, date_scheduling')
        .eq('user_id', user.id)
        .or(`date_script.gte.${startDate.toISOString().split('T')[0]},date_shooting.gte.${startDate.toISOString().split('T')[0]},date_editing.gte.${startDate.toISOString().split('T')[0]},date_scheduling.gte.${startDate.toISOString().split('T')[0]}`)
        .or(`date_script.lte.${endDate.toISOString().split('T')[0]},date_shooting.lte.${endDate.toISOString().split('T')[0]},date_editing.lte.${endDate.toISOString().split('T')[0]},date_scheduling.lte.${endDate.toISOString().split('T')[0]}`);

      if (error) throw error;

      const productionEvents: ProductionEvent[] = [];
      data?.forEach(content => {
        if (content.date_script) {
          productionEvents.push({
            id: `${content.id}-script`,
            title: content.title,
            date: content.date_script,
            stage: 'script',
            status: content.status,
            platform: content.platform,
            contentId: content.id,
          });
        }
        if (content.date_shooting) {
          productionEvents.push({
            id: `${content.id}-shooting`,
            title: content.title,
            date: content.date_shooting,
            stage: 'shooting',
            status: content.status,
            platform: content.platform,
            contentId: content.id,
          });
        }
        if (content.date_editing) {
          productionEvents.push({
            id: `${content.id}-editing`,
            title: content.title,
            date: content.date_editing,
            stage: 'editing',
            status: content.status,
            platform: content.platform,
            contentId: content.id,
          });
        }
        if (content.date_scheduling) {
          productionEvents.push({
            id: `${content.id}-scheduling`,
            title: content.title,
            date: content.date_scheduling,
            stage: 'scheduling',
            status: content.status,
            platform: content.platform,
            contentId: content.id,
          });
        }
      });

      setEvents(productionEvents);
    } catch (error) {
      console.error('Error loading production events:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleStageFilter(stage: string) {
    setStageFilters(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  }

  const filteredEvents = events.filter(event => {
    const stageMatch = stageFilters.length === 0 || stageFilters.includes(event.stage);
    return stageMatch;
  });

  function getEventsForDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0];
    return filteredEvents.filter(event => event.date === dateStr);
  }

  function isOverdue(event: ProductionEvent) {
    const today = new Date().toISOString().split('T')[0];
    return event.date < today && event.status !== 'published';
  }

  function navigateDate(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate);

    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }

    setCurrentDate(newDate);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || !user) return;

    const eventId = active.id as string;
    const lastDashIndex = eventId.lastIndexOf('-');
    const contentId = eventId.substring(0, lastDashIndex);
    const stageKey = eventId.substring(lastDashIndex + 1);
    const newDateStr = over.id as string;

    if (!newDateStr || newDateStr === active.data.current?.date) return;

    try {
      const fieldName = `date_${stageKey}`;

      const { error } = await supabase
        .from('content_calendar')
        .update({
          [fieldName]: newDateStr
        })
        .eq('id', contentId);

      if (error) throw error;

      loadProductionEvents();
    } catch (error) {
      console.error('Error updating production date:', error);
      alert('Erreur lors du déplacement');
    }
  }

  function getWeekDates() {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }

  function getDaysInMonth() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }

  function renderDayView() {
    const dayEvents = getEventsForDate(currentDate);
    const dateStr = currentDate.toISOString().split('T')[0];

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => setActiveDragId(event.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-3">
          <div className="text-center py-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
            <h3 className="text-lg font-bold text-gray-900">
              {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
          </div>

          <DroppableDay dateStr={dateStr} isToday={true}>
            {dayEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aucune étape de production prévue ce jour</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <DraggableEvent
                    key={event.id}
                    event={event}
                    dateStr={dateStr}
                    isOverdue={isOverdue(event)}
                    onClick={() => onContentEdit && onContentEdit(event.contentId)}
                  />
                ))}
              </div>
            )}
          </DroppableDay>
        </div>
      </DndContext>
    );
  }

  function renderWeekView() {
    const weekDates = getWeekDates();

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => setActiveDragId(event.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {weekDates.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const dateStr = date.toISOString().split('T')[0];

              return (
                <div key={index} className="bg-white">
                  <div className={`p-3 border-b border-gray-200 min-h-[110px] flex items-center justify-center ${isToday ? 'bg-orange-50' : 'bg-gray-50'}`}>
                    <div className="text-center">
                      <div className="text-xs font-semibold text-gray-600 uppercase mb-1">
                        {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-bold ${isToday ? 'text-orange-600' : 'text-gray-900'}`}>
                        {date.getDate()}
                      </div>
                      <div className="h-5 flex items-center justify-center mt-1">
                        {isToday && (
                          <span className="inline-block px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                            Aujourd'hui
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {dayEvents.length} étape{dayEvents.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <DroppableWeekColumn dateStr={dateStr} isToday={isToday}>
                    {dayEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xs text-gray-400 italic">Aucune étape</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <DraggableEventWeek
                            key={event.id}
                            event={event}
                            dateStr={dateStr}
                            isOverdue={isOverdue(event)}
                            onClick={() => onContentEdit && onContentEdit(event.contentId)}
                          />
                        ))}
                      </div>
                    )}
                  </DroppableWeekColumn>
                </div>
              );
            })}
          </div>
        </div>
      </DndContext>
    );
  }

  function renderMonthView() {
    const days = getDaysInMonth();
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => setActiveDragId(event.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {dayNames.map(day => (
              <div key={day} className="bg-gray-50 p-3 text-center">
                <span className="text-sm font-semibold text-gray-700">{day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="bg-white min-h-[120px]" />;
              }

              const dayEvents = getEventsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const dateStr = date.toISOString().split('T')[0];

              return (
                <DroppableDay key={dateStr} dateStr={dateStr} isToday={isToday}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-semibold ${isToday ? 'bg-orange-500 text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {dayEvents.map(event => {
                      const config = STAGE_CONFIG[event.stage];
                      const Icon = config.icon;
                      const overdue = isOverdue(event);

                      return (
                        <DraggableEventCompact
                          key={event.id}
                          event={event}
                          dateStr={dateStr}
                          config={config}
                          Icon={Icon}
                          isOverdue={overdue}
                          onClick={() => onContentEdit && onContentEdit(event.contentId)}
                        />
                      );
                    })}
                  </div>
                </DroppableDay>
              );
            })}
          </div>
        </div>
      </DndContext>
    );
  }

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-orange-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Calendrier de Production</h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Étapes:</span>
          </div>
          {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
            const Icon = config.icon;
            return (
              <div key={stage} className="flex items-center gap-1">
                <button
                  onClick={() => toggleStageFilter(stage)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    stageFilters.includes(stage)
                      ? config.color + ' ring-2 ring-offset-1'
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </button>
                {stage === 'scheduling' && (
                  <InfoTooltip content="Planification : C'est le moment d'ajouter le post sur les réseaux sociaux et de le programmer (date / heure / plateformes)." />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'day'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Jour
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'week'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mois
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>
            <span className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {view === 'day' && currentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {view === 'week' && `Semaine du ${getWeekDates()[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
              {view === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </span>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {view === 'day' && renderDayView()}
        {view === 'week' && renderWeekView()}
        {view === 'month' && renderMonthView()}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      )}
    </div>
  );
}

function DroppableDay({
  dateStr,
  isToday,
  children
}: {
  dateStr: string;
  isToday: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white p-2 min-h-[120px] border rounded-xl transition-all ${
        isToday ? 'ring-2 ring-orange-400 ring-inset bg-orange-50/20' : ''
      } ${isOver ? 'bg-blue-50 ring-2 ring-blue-400' : ''}`}
    >
      {children}
    </div>
  );
}

function DraggableEvent({
  event,
  dateStr,
  isOverdue,
  onClick
}: {
  event: ProductionEvent;
  dateStr: string;
  isOverdue: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: {
      date: dateStr,
      event
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.8 : 1,
    transition: isDragging ? 'none' : 'transform 200ms ease',
    zIndex: isDragging ? 50 : 1,
  } : undefined;

  const config = STAGE_CONFIG[event.stage];
  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all cursor-move hover:shadow-md ${
        isDragging ? 'shadow-2xl ring-2 ring-orange-400' : ''
      } ${
        isOverdue ? 'bg-red-50 border-red-300 text-red-700' : config.color
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm block truncate">{event.title}</span>
          <span className="text-xs opacity-75">{config.label}</span>
        </div>
      </div>
      {isOverdue && (
        <div className="text-[10px] mt-1 font-semibold">En retard</div>
      )}
    </div>
  );
}

function DraggableEventCompact({
  event,
  dateStr,
  config,
  Icon,
  isOverdue,
  onClick
}: {
  event: ProductionEvent;
  dateStr: string;
  config: any;
  Icon: any;
  isOverdue: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: {
      date: dateStr,
      event
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.8 : 1,
    transition: isDragging ? 'none' : 'transform 200ms ease',
    zIndex: isDragging ? 50 : 1,
  } : undefined;

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`w-full text-left p-1.5 rounded text-xs border transition-all cursor-move hover:shadow-sm ${
        isDragging ? 'shadow-lg ring-2 ring-orange-400' : ''
      } ${
        isOverdue ? 'bg-red-50 border-red-300 text-red-700' : config.color
      }`}
    >
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3 flex-shrink-0" />
        <span className="truncate font-medium">{event.title}</span>
      </div>
      {isOverdue && (
        <div className="text-[10px] mt-0.5 font-semibold">En retard</div>
      )}
    </button>
  );
}

function DroppableWeekColumn({
  dateStr,
  isToday,
  children
}: {
  dateStr: string;
  isToday: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-2 min-h-[400px] transition-all ${
        isOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : ''
      }`}
    >
      {children}
    </div>
  );
}

function DraggableEventWeek({
  event,
  dateStr,
  isOverdue,
  onClick
}: {
  event: ProductionEvent;
  dateStr: string;
  isOverdue: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: {
      date: dateStr,
      event
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.8 : 1,
    transition: isDragging ? 'none' : 'transform 200ms ease',
    zIndex: isDragging ? 50 : 1,
  } : undefined;

  const config = STAGE_CONFIG[event.stage];
  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`w-full text-left p-2 rounded-lg border transition-all cursor-move hover:shadow-md ${
        isDragging ? 'shadow-2xl ring-2 ring-orange-400' : ''
      } ${
        isOverdue ? 'bg-red-50 border-red-300 text-red-700' : config.color
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-[10px] font-semibold uppercase">{config.label}</span>
      </div>
      <div className="text-xs font-medium line-clamp-2 leading-tight">
        {event.title}
      </div>
      {isOverdue && (
        <div className="text-[10px] mt-1 font-semibold">En retard</div>
      )}
    </div>
  );
}
