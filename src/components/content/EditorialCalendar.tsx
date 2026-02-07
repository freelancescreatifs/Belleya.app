import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Calendar, Lightbulb, FileEdit, CalendarCheck, CheckCircle, Video, Image as ImageIcon, Layers, BookOpen, Hash, Instagram, Linkedin, Facebook, Youtube, Twitter, Camera, Scissors } from 'lucide-react';
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
import {
  getProductionSteps,
  getNextProductionStep,
  getProgressPercent
} from '../../lib/productionStepsHelpers';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: string;
  platform: string;
  publication_date: string;
  publication_time?: string;
  status: 'idea' | 'script' | 'shooting' | 'editing' | 'scheduled' | 'published';
  image_url: string;
  feed_order: number;
  caption?: string;
  content_structure?: string;
  media_urls?: string[];
  media_type?: string;
  editorial_pillar?: string;
  objective?: 'attirer' | 'éduquer' | 'convertir' | 'fidéliser';
  is_published?: boolean;
  date_script?: string;
  date_shooting?: string;
  date_editing?: string;
  date_scheduling?: string;
}

interface EditorialPillar {
  id: string;
  pillar_name: string;
  color: string;
}

interface EditorialCalendarProps {
  contents: ContentItem[];
  onContentCreated: (content: ContentItem) => void;
  onContentUpdated: () => void;
  onContentEdit: (options: { mode: 'create' | 'edit'; contentId?: string; prefillData?: Partial<ContentItem> }) => void;
}

type CalendarView = 'day' | 'week' | 'month';

function formatDateToLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function EditorialCalendar({ contents, onContentCreated, onContentUpdated, onContentEdit }: EditorialCalendarProps) {
  const { user } = useAuth();
  const [view, setView] = useState<CalendarView>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [pillars, setPillars] = useState<EditorialPillar[]>([]);
  const [professionType, setProfessionType] = useState('');
  const [expandedContents, setExpandedContents] = useState<Set<string>>(new Set());
  const [productionTasksMap, setProductionTasksMap] = useState<Map<string, Map<string, boolean>>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (user) {
      loadProfessionAndPillars();
      loadProductionTasks();
    }
  }, [user]);

  useEffect(() => {
    if (user && contents.length > 0) {
      loadProductionTasks();
    }
  }, [contents]);

  async function loadProfessionAndPillars() {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('company_profiles')
        .select('primary_profession')
        .eq('user_id', user.id)
        .maybeSingle();

      const profession = profileData?.primary_profession || 'nail_artist';
      setProfessionType(profession);

      const { data: pillarsData } = await supabase
        .from('editorial_pillars')
        .select('*')
        .eq('user_id', user.id)
        .eq('profession_type', profession)
        .eq('is_active', true)
        .order('created_at');

      if (pillarsData && pillarsData.length > 0) {
        setPillars(pillarsData);
      } else {
        await supabase.rpc('create_default_editorial_pillars', {
          p_user_id: user.id,
          p_profession_type: profession
        });
        const { data: newPillarsData } = await supabase
          .from('editorial_pillars')
          .select('*')
          .eq('user_id', user.id)
          .eq('profession_type', profession)
          .eq('is_active', true)
          .order('created_at');
        if (newPillarsData) {
          setPillars(newPillarsData);
        }
      }
    } catch (error) {
      console.error('Error loading profession/pillars:', error);
    }
  }

  async function loadProductionTasks() {
    if (!user || contents.length === 0) return;

    try {
      const contentIds = contents.map(c => c.id);

      const { data: productionTasks, error } = await supabase
        .from('production_tasks')
        .select('content_id, production_step, task_id')
        .in('content_id', contentIds);

      if (error) {
        console.error('Error loading production tasks:', error);
        return;
      }

      if (!productionTasks || productionTasks.length === 0) {
        setProductionTasksMap(new Map());
        return;
      }

      const taskIds = productionTasks.map(pt => pt.task_id);

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, completed')
        .in('id', taskIds);

      if (tasksError) {
        console.error('Error loading tasks:', tasksError);
        return;
      }

      const tasksById = new Map(tasks?.map(t => [t.id, t.completed]) || []);

      const tasksMap = new Map<string, Map<string, boolean>>();

      for (const pt of productionTasks) {
        if (!tasksMap.has(pt.content_id)) {
          tasksMap.set(pt.content_id, new Map());
        }
        const contentTasksMap = tasksMap.get(pt.content_id)!;
        const stepKey = `date_${pt.production_step}`;
        contentTasksMap.set(stepKey, tasksById.get(pt.task_id) || false);
      }

      setProductionTasksMap(tasksMap);
    } catch (error) {
      console.error('Error loading production tasks:', error);
    }
  }

  async function toggleProductionStep(contentId: string, stepKey: string, currentCompleted: boolean) {
    if (!user) return;

    const stepMapping: Record<string, string> = {
      'date_script': 'script',
      'date_shooting': 'shooting',
      'date_editing': 'editing',
      'date_scheduling': 'scheduling'
    };

    const productionStepName = stepMapping[stepKey];
    if (!productionStepName) return;

    const newCompleted = !currentCompleted;

    setProductionTasksMap(prev => {
      const newMap = new Map(prev);
      const contentTasks = newMap.get(contentId) || new Map();
      const updatedContentTasks = new Map(contentTasks);
      updatedContentTasks.set(stepKey, newCompleted);
      newMap.set(contentId, updatedContentTasks);
      return newMap;
    });

    try {
      const { data, error } = await supabase
        .rpc('cascade_production_steps', {
          p_content_id: contentId,
          p_step: productionStepName,
          p_checked: newCompleted
        });

      if (error) throw error;

      setTimeout(async () => {
        await loadProductionTasks();
        onContentUpdated();
      }, 300);
    } catch (error) {
      console.error('Error toggling production step:', error);
      await loadProductionTasks();
    }
  }


  async function handleTogglePublished(content: ContentItem, newPublishedStatus: boolean) {
    try {
      if (newPublishedStatus) {
        await supabase.rpc('cascade_production_steps', {
          p_content_id: content.id,
          p_step: 'published',
          p_checked: true
        });
      } else {
        await supabase.rpc('cascade_production_steps', {
          p_content_id: content.id,
          p_step: 'scheduling',
          p_checked: false
        });
      }

      setTimeout(async () => {
        await loadProductionTasks();
        onContentUpdated();
      }, 300);
    } catch (error) {
      console.error('Error toggling published status:', error);
      await loadProductionTasks();
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4" />;
      case 'scheduled':
        return <CalendarCheck className="w-4 h-4" />;
      case 'script':
        return <FileEdit className="w-4 h-4" />;
      case 'shooting':
        return <Camera className="w-4 h-4" />;
      case 'editing':
        return <Scissors className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'published':
        return 'Posté';
      case 'scheduled':
        return 'Programmé';
      case 'script':
        return 'Écriture';
      case 'shooting':
        return 'Tournage';
      case 'editing':
        return 'Montage';
      default:
        return 'Idée';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'script':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'shooting':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'editing':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'reel':
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'carrousel':
        return <Layers className="w-4 h-4" />;
      case 'story':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <ImageIcon className="w-4 h-4" />;
    }
  }

  function handleEdit(content: ContentItem) {
    onContentEdit({ mode: 'edit', contentId: content.id });
  }

  function handleCreate(date?: string) {
    onContentEdit({
      mode: 'create',
      prefillData: date ? { publication_date: date, publication_time: '12:00' } : undefined
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce contenu ?')) return;

    try {
      const { error } = await supabase
        .from('content_calendar')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onContentUpdated();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Erreur lors de la suppression');
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

  function getMonthDates() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - (startDate.getDay() || 7) + 1);

    const dates = [];
    const currentIteration = new Date(startDate);

    while (currentIteration <= lastDay || currentIteration.getDay() !== 1) {
      dates.push(new Date(currentIteration));
      currentIteration.setDate(currentIteration.getDate() + 1);
    }

    return dates;
  }

  function getContentsForDate(date: Date) {
    const dateStr = formatDateToLocal(date);
    return contents.filter(c => c.publication_date === dateStr);
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || !user) return;

    const contentId = active.id as string;
    const newDateStr = over.id as string;

    if (!newDateStr || newDateStr === active.data.current?.date) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newDate = new Date(newDateStr + 'T00:00:00');

    if (newDate < today) {
      alert('Impossible de déplacer un contenu vers une date passée. Le contenu deviendrait "publié" et disparaîtrait du calendrier.');
      return;
    }

    try {
      const content = contents.find(c => c.id === contentId);
      if (!content) return;

      const { error } = await supabase
        .from('content_calendar')
        .update({
          publication_date: newDateStr
        })
        .eq('id', contentId);

      if (error) throw error;

      onContentUpdated();
    } catch (error) {
      console.error('Error updating content date:', error);
      alert('Erreur lors du déplacement');
    }
  }

  function getPlatformIcon(platform: string) {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-3 h-3" />;
      case 'linkedin':
        return <Linkedin className="w-3 h-3" />;
      case 'facebook':
        return <Facebook className="w-3 h-3" />;
      case 'youtube':
        return <Youtube className="w-3 h-3" />;
      case 'twitter':
        return <Twitter className="w-3 h-3" />;
      default:
        return <ImageIcon className="w-3 h-3" />;
    }
  }

  function getPlatformColor(platform: string) {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'bg-belleya-100 text-belleya-deep border-belleya-100';
      case 'linkedin':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'facebook':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'youtube':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'twitter':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'tiktok':
        return 'bg-gray-900 text-white border-gray-700';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }


  function getProductionStepsWithRealStatus(content: ContentItem) {
    const allSteps = getProductionSteps(content);
    const contentTasks = productionTasksMap.get(content.id);

    if (!contentTasks) return allSteps;

    return allSteps.map(step => ({
      ...step,
      isCompleted: contentTasks.get(step.key) || false
    }));
  }

  function renderDayView() {
    const dayContents = getContentsForDate(currentDate);

    const toggleExpanded = (contentId: string) => {
      setExpandedContents(prev => {
        const newSet = new Set(prev);
        if (newSet.has(contentId)) {
          newSet.delete(contentId);
        } else {
          newSet.add(contentId);
        }
        return newSet;
      });
    };

    const calculateNextStepInfo = (content: ContentItem, nextStep: any) => {
      if (!nextStep) return null;

      const publicationDate = content.publication_date ? new Date(content.publication_date) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let isOverdue = false;
      let daysInfo = '';

      if (nextStep.stepDate) {
        const stepDate = new Date(nextStep.stepDate);
        stepDate.setHours(0, 0, 0, 0);

        if (publicationDate) {
          publicationDate.setHours(0, 0, 0, 0);

          if (stepDate > publicationDate) {
            isOverdue = true;
            daysInfo = 'Retard (après publication)';
          } else if (today > publicationDate) {
            isOverdue = true;
            const daysDiff = Math.ceil((today.getTime() - publicationDate.getTime()) / (1000 * 60 * 60 * 24));
            daysInfo = `Retard de ${daysDiff}j`;
          } else {
            const daysDiff = Math.ceil((publicationDate.getTime() - stepDate.getTime()) / (1000 * 60 * 60 * 24));
            if (stepDate.getTime() === today.getTime()) {
              daysInfo = "Aujourd'hui";
            } else if (stepDate < today) {
              const daysDiff = Math.ceil((today.getTime() - stepDate.getTime()) / (1000 * 60 * 60 * 24));
              daysInfo = `Retard de ${daysDiff}j`;
              isOverdue = true;
            } else {
              daysInfo = `Dans ${Math.ceil((stepDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))}j`;
            }
          }
        } else {
          if (stepDate < today) {
            isOverdue = true;
            const daysDiff = Math.ceil((today.getTime() - stepDate.getTime()) / (1000 * 60 * 60 * 24));
            daysInfo = `Retard de ${daysDiff}j`;
          } else if (stepDate.getTime() === today.getTime()) {
            daysInfo = "Aujourd'hui";
          } else {
            const daysDiff = Math.ceil((stepDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            daysInfo = `Dans ${daysDiff}j`;
          }
        }
      } else if (publicationDate) {
        publicationDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil((publicationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < 0) {
          isOverdue = true;
          daysInfo = `Retard de ${Math.abs(daysDiff)}j`;
        } else if (daysDiff === 0) {
          daysInfo = "Aujourd'hui";
        } else {
          daysInfo = `J-${daysDiff}`;
        }
      }

      return {
        label: nextStep.label,
        daysInfo,
        isOverdue
      };
    };

    return (
      <div className="space-y-3">
        <div className="text-center py-4 bg-gradient-to-r from-orange-50 to-belleya-50 rounded-xl">
          <h3 className="text-lg font-bold text-gray-900">
            {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
        </div>

        {dayContents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Aucun contenu prévu ce jour</p>
            <button
              onClick={() => handleCreate(formatDateToLocal(currentDate))}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-belleya-primary text-white rounded-lg hover:from-orange-600 hover:to-belleya-primary transition-all"
            >
              Créer une publication
            </button>
          </div>
        ) : (
          dayContents.map((content) => {
            const allSteps = getProductionStepsWithRealStatus(content);
            const nextStep = allSteps.find(s => !s.isCompleted);
            const completedSteps = allSteps.filter(s => s.isCompleted).length;
            const totalSteps = allSteps.length;
            const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
            const isExpanded = expandedContents.has(content.id);

            const nextStepInfo = nextStep ? calculateNextStepInfo(content, nextStep) : undefined;

            return (
              <div key={content.id} className="space-y-2">
                <ContentCard
                  content={content}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  getStatusIcon={getStatusIcon}
                  getStatusLabel={getStatusLabel}
                  getStatusColor={getStatusColor}
                  getTypeIcon={getTypeIcon}
                  progressPercent={progressPercent}
                  completedSteps={completedSteps}
                  totalSteps={totalSteps}
                  nextStepInfo={nextStepInfo}
                  onToggleExpand={allSteps.length > 0 ? () => toggleExpanded(content.id) : undefined}
                  onTogglePublished={handleTogglePublished}
                />

                {isExpanded && allSteps.length > 0 && (
                  <div className="ml-4 mt-2">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Toutes les étapes de production
                      </h4>
                      <div className="space-y-2">
                        {allSteps.map((step, idx) => {
                          const stepDate = step.stepDate ? new Date(step.stepDate).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : null;

                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-2 px-2 py-2 rounded border transition-all ${
                                step.isCompleted
                                  ? 'bg-green-50 border-green-200 opacity-60'
                                  : step.isOverdue
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={step.isCompleted}
                                onChange={() => toggleProductionStep(content.id, step.key, step.isCompleted)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              />
                              <div className="flex-shrink-0">
                                {step.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-medium ${step.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                    {step.label}
                                  </span>
                                  {step.isOverdue && !step.isCompleted && (
                                    <span className="text-[10px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                      Retard
                                    </span>
                                  )}
                                </div>
                                {stepDate && (
                                  <span className="text-[10px] text-gray-500">
                                    {stepDate}
                                  </span>
                                )}
                              </div>
                              {!step.isCompleted && step.stepDate && (
                                <span className="text-[10px] font-medium text-gray-600">
                                  {step.isToday ? "Aujourd'hui" : step.isOverdue ? `${Math.abs(step.diffDays)}j de retard` : `Dans ${step.diffDays}j`}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
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
        <div className="space-y-4">
          {weekDates.map((date, index) => {
            const dayContents = getContentsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const dateStr = formatDateToLocal(date);

            return (
              <DroppableWeekDay
                key={index}
                dateStr={dateStr}
                isToday={isToday}
                onDoubleClick={handleCreate}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">
                      {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h4>
                    {isToday && (
                      <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">Aujourd'hui</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{dayContents.length} contenu(s)</span>
                    <button
                      onClick={() => handleCreate(dateStr)}
                      className="p-2 bg-gradient-to-r from-orange-500 to-belleya-primary text-white rounded-lg hover:from-orange-600 hover:to-belleya-primary transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {dayContents.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Aucun contenu prévu</p>
                ) : (
                  <div className="space-y-2">
                    {dayContents.map((content) => (
                      <DraggableWeekContent
                        key={content.id}
                        content={content}
                        dateStr={dateStr}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        getStatusIcon={getStatusIcon}
                        getStatusLabel={getStatusLabel}
                        getStatusColor={getStatusColor}
                        getTypeIcon={getTypeIcon}
                        getPlatformIcon={getPlatformIcon}
                        getPlatformColor={getPlatformColor}
                      />
                    ))}
                  </div>
                )}
              </DroppableWeekDay>
            );
          })}
        </div>
      </DndContext>
    );
  }

  function renderMonthView() {
    const monthDates = getMonthDates();
    const weeks = [];

    for (let i = 0; i < monthDates.length; i += 7) {
      weeks.push(monthDates.slice(i, i + 7));
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(event) => setActiveDragId(event.active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-semibold text-gray-700 bg-gray-50">
                {day}
              </div>
            ))}
          </div>

          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
              {week.map((date, dayIndex) => {
                const dayContents = getContentsForDate(date);
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                const dateStr = formatDateToLocal(date);

                return (
                  <DroppableDay
                    key={dayIndex}
                    date={date}
                    dateStr={dateStr}
                    isCurrentMonth={isCurrentMonth}
                    isToday={isToday}
                    onDoubleClick={handleCreate}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-orange-600' : !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>

                    <div className="space-y-1">
                      {dayContents.slice(0, 3).map((content) => (
                        <DraggableContent
                          key={content.id}
                          content={content}
                          dateStr={dateStr}
                          onEdit={handleEdit}
                          getStatusIcon={getStatusIcon}
                          getStatusColor={getStatusColor}
                          getPlatformIcon={getPlatformIcon}
                          getPlatformColor={getPlatformColor}
                          pillars={pillars}
                        />
                      ))}
                      {dayContents.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayContents.length - 3} autre(s)
                        </div>
                      )}
                    </div>
                  </DroppableDay>
                );
              })}
            </div>
          ))}
        </div>
      </DndContext>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Calendrier éditorial</h2>
          <p className="text-sm text-gray-600 mt-1">Planifiez et organisez vos publications</p>
        </div>
        <button
          onClick={() => handleCreate()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-belleya-primary text-white rounded-xl hover:from-orange-600 hover:to-belleya-primary transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouveau contenu
        </button>
      </div>

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
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
    </div>
  );
}

function DroppableDay({
  date,
  dateStr,
  isCurrentMonth,
  isToday,
  onDoubleClick,
  children
}: {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  onDoubleClick?: (dateStr: string) => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  });

  return (
    <div
      ref={setNodeRef}
      onDoubleClick={() => onDoubleClick?.(dateStr)}
      className={`min-h-[100px] p-2 border-r border-gray-200 last:border-r-0 transition-colors cursor-pointer ${
        !isCurrentMonth ? 'bg-gray-50' : ''
      } ${isToday ? 'bg-orange-50' : ''} ${isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''}`}
    >
      {children}
    </div>
  );
}

function DraggableContent({
  content,
  dateStr,
  onEdit,
  getStatusIcon,
  getStatusColor,
  getPlatformIcon,
  getPlatformColor,
  pillars
}: {
  content: ContentItem;
  dateStr: string;
  onEdit: (content: ContentItem) => void;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  getPlatformIcon: (platform: string) => JSX.Element;
  getPlatformColor: (platform: string) => string;
  pillars: EditorialPillar[];
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: content.id,
    data: {
      date: dateStr,
      content
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  function getPillarColor(pillarName: string) {
    const pillar = pillars.find(p => p.pillar_name === pillarName);
    return pillar?.color || '#3B82F6';
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) {
          onEdit(content);
        }
      }}
      className="group cursor-move p-1.5 rounded hover:bg-white transition-colors border border-gray-200 hover:shadow-md"
    >
      <div className="flex items-start gap-1 flex-col">
        <div className="flex items-center gap-1 w-full">
          <span className={`p-0.5 rounded flex-shrink-0 ${
            content.is_published ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            {content.is_published ? <CheckCircle className="w-3 h-3 text-green-700" /> : <Calendar className="w-3 h-3 text-gray-700" />}
          </span>
          <span className={`px-1 py-0.5 rounded text-xs flex items-center gap-0.5 flex-shrink-0 border ${getPlatformColor(content.platform)}`}>
            {getPlatformIcon(content.platform)}
          </span>
          {content.editorial_pillar && (
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getPillarColor(content.editorial_pillar) }}
              title={content.editorial_pillar}
            />
          )}
        </div>
        <span className="text-xs truncate w-full" title={content.enriched_title || content.title}>
          {content.enriched_title || content.title}
        </span>
      </div>
    </div>
  );
}

function DroppableWeekDay({
  dateStr,
  isToday,
  onDoubleClick,
  children
}: {
  dateStr: string;
  isToday: boolean;
  onDoubleClick?: (dateStr: string) => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  });

  return (
    <div
      ref={setNodeRef}
      onDoubleClick={() => onDoubleClick?.(dateStr)}
      className={`border rounded-xl p-4 transition-colors cursor-pointer ${
        isToday ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200'
      } ${isOver ? 'bg-blue-50 border-blue-300' : ''}`}
    >
      {children}
    </div>
  );
}

function DraggableWeekContent({
  content,
  dateStr,
  onEdit,
  onDelete,
  getStatusIcon,
  getStatusLabel,
  getStatusColor,
  getTypeIcon,
  getPlatformIcon,
  getPlatformColor
}: {
  content: ContentItem;
  dateStr: string;
  onEdit: (content: ContentItem) => void;
  onDelete: (id: string) => void;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusLabel: (status: string) => string;
  getStatusColor: (status: string) => string;
  getTypeIcon: (type: string) => JSX.Element;
  getPlatformIcon: (platform: string) => JSX.Element;
  getPlatformColor: (platform: string) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: content.id,
    data: {
      date: dateStr,
      content
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 bg-white border border-gray-200 rounded-xl hover:border-orange-300 transition-colors cursor-move"
    >
      <div className="flex items-start gap-3">
        {content.image_url && (
          <img
            src={content.image_url}
            alt={content.enriched_title || content.title}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {content.enriched_title || content.title}
                {content.publication_time && (
                  <span className="ml-2 text-xs text-gray-500">à {content.publication_time}</span>
                )}
              </h3>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(content);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <Edit2 className="w-3 h-3 text-gray-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(content.id);
                }}
                className="p-1 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
              content.is_published
                ? 'bg-green-50 text-green-700 border-green-300'
                : 'bg-gray-50 text-gray-700 border-gray-300'
            }`}>
              {content.is_published ? <CheckCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
              {content.is_published ? 'Publié' : 'Non publié'}
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
              {getTypeIcon(content.content_type)}
              {content.content_type}
            </span>
            <span className={`px-1 py-1 rounded text-xs flex items-center gap-0.5 border ${getPlatformColor(content.platform)}`}>
              {getPlatformIcon(content.platform)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentCard({
  content,
  onEdit,
  onDelete,
  getStatusIcon,
  getStatusLabel,
  getStatusColor,
  getTypeIcon,
  compact = false,
  progressPercent,
  completedSteps,
  totalSteps,
  nextStepInfo,
  onToggleExpand,
  onTogglePublished
}: {
  content: ContentItem;
  onEdit: (content: ContentItem) => void;
  onDelete: (id: string) => void;
  getStatusIcon: (status: string) => JSX.Element;
  getStatusLabel: (status: string) => string;
  getStatusColor: (status: string) => string;
  getTypeIcon: (type: string) => JSX.Element;
  compact?: boolean;
  progressPercent?: number;
  completedSteps?: number;
  totalSteps?: number;
  nextStepInfo?: {
    label: string;
    daysInfo: string;
    isOverdue: boolean;
  };
  onToggleExpand?: () => void;
  onTogglePublished?: (content: ContentItem, newStatus: boolean) => void;
}) {
  const showProgress = typeof progressPercent === 'number' && !!totalSteps && totalSteps > 0;

  const getMediaUrl = () => {
    if (content.image_url) return content.image_url;
    if (content.media_urls) {
      const urls = typeof content.media_urls === 'string' ? JSON.parse(content.media_urls) : content.media_urls;
      return urls.length > 0 ? urls[0] : null;
    }
    return null;
  };

  const mediaUrl = getMediaUrl();

  return (
    <div className={`p-4 border border-gray-200 rounded-xl hover:border-orange-300 transition-colors ${compact ? 'bg-white' : 'bg-white'}`}>
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-start gap-3 flex-1">
          {mediaUrl && (
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              <img
                src={mediaUrl}
                alt={content.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base">
              {content.title.toUpperCase()}
              {content.publication_time && (
                <span className="ml-2 text-sm font-normal text-gray-500">à {content.publication_time}</span>
              )}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(content)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => onDelete(content.id)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        {onTogglePublished ? (
          <button
            onClick={() => onTogglePublished(content, !content.is_published)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              content.is_published
                ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
            title={content.is_published ? 'Cliquer pour passer en Non publié' : 'Cliquer pour marquer comme Publié'}
          >
            {content.is_published ? <CheckCircle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
            {content.is_published ? 'Publié' : 'Non publié'}
          </button>
        ) : (
          <span className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
            content.is_published
              ? 'bg-green-50 text-green-700 border-green-300'
              : 'bg-gray-50 text-gray-700 border-gray-300'
          }`}>
            {content.is_published ? <CheckCircle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
            {content.is_published ? 'Publié' : 'Non publié'}
          </span>
        )}
        <span className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
          {getTypeIcon(content.content_type)}
          {content.content_type}
        </span>
        {content.platforms && content.platforms.length > 0 ? (
          <span className="px-2.5 py-1.5 bg-gray-100 text-gray-800 rounded-lg text-xs font-medium">
            {content.platforms.join(',')}
          </span>
        ) : (
          <span className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
            content.platform === 'instagram' ? 'bg-belleya-100 text-belleya-deep' : 'bg-gray-100 text-gray-800'
          }`}>
            {content.platform}
          </span>
        )}
      </div>

      {showProgress ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  nextStepInfo?.isOverdue ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-700 flex-shrink-0">
              {completedSteps}/{totalSteps}
            </span>
          </div>

          {nextStepInfo && (
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">Prochaine étape :</span>
                <span className={`font-bold ${nextStepInfo.isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
                  {nextStepInfo.label}
                </span>
                <span>•</span>
                <span className={`font-bold ${nextStepInfo.isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                  {nextStepInfo.daysInfo}
                </span>
              </div>
            </div>
          )}

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Voir plus
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
