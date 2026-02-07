import { Pencil, Users, Trash2, Instagram, Info, FolderKanban } from 'lucide-react';
import TaskTimer from './TaskTimer';
import SubprojectBadge from './SubprojectBadge';
import { getStepIcon, getStepColor, getStepLabel } from '../../lib/productionStepsHelpers';

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  collaborator_id: string | null;
  project_id: string | null;
  subproject_id: string | null;
  overdue: boolean;
  completed: boolean;
  created_at: string;
  last_completed_date: string | null;
  tags: string | null;
  production_step: string | null;
  collaborator?: {
    name: string;
  };
  project?: {
    name: string;
  };
}

interface TimelineViewProps {
  tasksWithTime: Task[];
  tasksWithoutTime: Task[];
  onStatusChange: (id: string, status: string) => void;
  getPriorityIcon: (priority: string) => string | null;
  getStatusBadge: (status: string) => { label: string; color: string };
  onStatusBadgeClick: (taskId: string, currentStatus: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TimelineView({
  tasksWithTime,
  tasksWithoutTime,
  onStatusChange,
  getPriorityIcon,
  getStatusBadge,
  onStatusBadgeClick,
  onEdit,
  onDelete,
}: TimelineViewProps) {
  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      very_high: { label: 'URGENT', color: 'bg-red-100 text-red-700 border border-red-300' },
      high: { label: 'Haute', color: 'bg-orange-100 text-orange-700 border border-orange-300' },
      medium: { label: 'Moyenne', color: 'bg-blue-100 text-blue-700 border border-blue-300' },
      low: { label: 'Basse', color: 'bg-gray-100 text-gray-700 border border-gray-300' },
    };
    return badges[priority] || badges.medium;
  };

  const calculateDuration = (startTime: string | null, endTime: string | null): { minutes: number; display: string } | null => {
    if (!startTime || !endTime) return null;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

    if (durationMinutes <= 0) return null;

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const display = hours > 0 ? `${hours}h${minutes > 0 ? minutes : ''}` : `${minutes}min`;

    return { minutes: durationMinutes, display };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {tasksWithTime.length > 0 && (
        <div className="space-y-3">
          {tasksWithTime.map((task) => {
            const duration = calculateDuration(task.start_time, task.end_time);
            const priorityBadge = getPriorityBadge(task.priority);

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 overflow-hidden"
              >
                <div className="flex items-stretch">
                  <div className="bg-gradient-to-b from-rose-50 to-pink-50 px-6 py-4 flex flex-col items-center justify-center border-r border-gray-200 min-w-[120px]">
                    <div className="text-2xl font-bold text-gray-900">
                      {task.start_time ? formatTime(task.start_time) : '--:--'}
                    </div>
                    {task.end_time && (
                      <div className="text-xs text-gray-500 mt-1">
                        → {formatTime(task.end_time)}
                      </div>
                    )}
                    {duration && (
                      <div className="text-xs text-belleya-primary font-semibold mt-2 bg-white px-2 py-1 rounded-full">
                        {duration.display}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-4 relative">
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(task.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                          <span className="text-xl">{getPriorityIcon(task.priority)}</span>
                        </div>
                        {task.category && (
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                            {task.category === 'admin' && 'Administratif'}
                            {task.category === 'stock' && 'Stock'}
                            {task.category === 'content' && 'Contenu'}
                            {task.category === 'other' && 'Autre'}
                          </div>
                        )}
                        {(task.project || task.subproject_id) && (
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            {task.project && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                                <FolderKanban className="w-3 h-3" />
                                <span className="font-medium">{task.project.name}</span>
                              </div>
                            )}
                            {task.subproject_id && (
                              <SubprojectBadge subprojectId={task.subproject_id} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {task.tags === 'Réseaux sociaux' && (
                        <span className="bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-300 px-2 py-1 rounded-full font-medium flex items-center gap-1 text-xs">
                          <Instagram className="w-3 h-3" />
                          Réseaux sociaux
                        </span>
                      )}
                      {task.production_step && (() => {
                        const Icon = getStepIcon(task.production_step);
                        return (
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStepColor(task.production_step)} bg-gray-50 border border-gray-200`}>
                            <Icon className="w-3 h-3" />
                            <span>{getStepLabel(task.production_step)}</span>
                            <div className="group relative">
                              <Info className="w-3 h-3 text-gray-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                  Tâche générée automatiquement pour ce contenu
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      {task.priority === 'very_high' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${priorityBadge.color}`}>
                          {priorityBadge.label}
                        </span>
                      )}
                      <button
                        onClick={() => onStatusBadgeClick(task.id, task.status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 ${getStatusBadge(task.status).color}`}
                      >
                        {getStatusBadge(task.status).label}
                      </button>
                      {task.collaborator && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          {task.collaborator.name}
                        </div>
                      )}
                    </div>

                    {duration && duration.minutes > 0 && (
                      <TaskTimer
                        taskId={task.id}
                        plannedDuration={duration.minutes}
                        taskTitle={task.title}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tasksWithoutTime.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-300"></div>
            Sans horaire
            <div className="h-px flex-1 bg-gray-300"></div>
          </h3>
          <div className="space-y-3">
            {tasksWithoutTime.map((task) => {
              const priorityBadge = getPriorityBadge(task.priority);

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 p-4 relative"
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <button
                      onClick={() => onEdit(task)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(task.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-start gap-3 mb-2 pr-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900">{task.title}</h3>
                        <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                      </div>
                      {task.category && (
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                          {task.category === 'admin' && 'Administratif'}
                          {task.category === 'stock' && 'Stock'}
                          {task.category === 'content' && 'Contenu'}
                          {task.category === 'other' && 'Autre'}
                        </div>
                      )}
                      {(task.project || task.subproject_id) && (
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          {task.project && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                              <FolderKanban className="w-3 h-3" />
                              <span className="font-medium">{task.project.name}</span>
                            </div>
                          )}
                          {task.subproject_id && (
                            <SubprojectBadge subprojectId={task.subproject_id} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {task.tags === 'Réseaux sociaux' && (
                      <span className="bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-300 px-2 py-1 rounded-full font-medium flex items-center gap-1 text-xs">
                        <Instagram className="w-3 h-3" />
                        Réseaux sociaux
                      </span>
                    )}
                    {task.production_step && (() => {
                      const Icon = getStepIcon(task.production_step);
                      return (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStepColor(task.production_step)} bg-gray-50 border border-gray-200`}>
                          <Icon className="w-3 h-3" />
                          <span>{getStepLabel(task.production_step)}</span>
                          <div className="group relative">
                            <Info className="w-3 h-3 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                              <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                Tâche générée automatiquement pour ce contenu
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    {task.priority === 'very_high' && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${priorityBadge.color}`}>
                        {priorityBadge.label}
                      </span>
                    )}
                    <button
                      onClick={() => onStatusBadgeClick(task.id, task.status)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 ${getStatusBadge(task.status).color}`}
                    >
                      {getStatusBadge(task.status).label}
                    </button>
                    {task.collaborator && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        {task.collaborator.name}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
