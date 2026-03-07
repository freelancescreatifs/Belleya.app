import { useState } from 'react';
import { X, Check, Calendar, Pencil, Trash2 } from 'lucide-react';
import { CalendarTask } from '../../types/agenda';
import { supabase } from '../../lib/supabase';
import { formatDate, formatTime } from '../../lib/calendarHelpers';
import { getStepLabel, getStepColor, stepBgColorMap } from '../../lib/productionStepsHelpers';
import TaskForm from './TaskForm';

interface TaskDrawerProps {
  task: CalendarTask;
  onClose: () => void;
  onUpdate: (task: CalendarTask) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskDrawer({ task, onClose, onUpdate, onDelete }: TaskDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newScheduledAt, setNewScheduledAt] = useState(
    task.scheduled_at ? new Date(task.scheduled_at).toISOString().slice(0, 16) : ''
  );

  const handleMarkDone = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;

      if (task.production_step && task.tags) {
        const contentMatch = typeof task.tags === 'string' ? task.tags.match(/content:([0-9a-f-]+)/) : null;
        if (contentMatch) {
          const contentId = contentMatch[1];
          const checkboxMap: Record<string, string> = {
            script: 'script_checked',
            shooting: 'tournage_checked',
            editing: 'montage_checked',
            scheduling: 'planifie_checked',
          };
          const checkboxColumn = checkboxMap[task.production_step];
          if (checkboxColumn) {
            await supabase
              .from('content_calendar')
              .update({ [checkboxColumn]: true })
              .eq('id', contentId);
          }
        }
      }

      if (data) {
        onUpdate({ ...task, completed: true });
        onClose();
      }
    } catch (error) {
      console.error('Error marking task done:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!newScheduledAt) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ scheduled_at: new Date(newScheduledAt).toISOString() })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onUpdate({ ...task, scheduled_at: data.scheduled_at });
        setIsRescheduling(false);
      }
    } catch (error) {
      console.error('Error rescheduling task:', error);
      alert('Erreur lors de la replanification');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Voulez-vous vraiment supprimer cette tâche ?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;
      if (onDelete) onDelete(task.id);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (updatedTask: CalendarTask) => {
    onUpdate(updatedTask);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Détails de la tâche</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isEditing ? (
              <TaskForm
                task={task}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{task.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Tache
                    </span>
                    {task.production_step && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStepColor(task.production_step)} bg-gray-100`}>
                        {getStepLabel(task.production_step)}
                      </span>
                    )}
                  </div>
                </div>

              {task.description && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Description</div>
                  <div className="text-gray-900 whitespace-pre-wrap">{task.description}</div>
                </div>
              )}

              {task.category_tag && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Catégorie</div>
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {task.category_tag}
                  </span>
                </div>
              )}

              {task.scheduled_at && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-gray-600">Planifiée pour</div>
                    <div className="font-medium text-gray-900">
                      {formatDate(new Date(task.scheduled_at))}
                    </div>
                    <div className="text-gray-600">
                      {formatTime(new Date(task.scheduled_at))}
                      {task.duration_minutes && ` (${task.duration_minutes} min)`}
                    </div>
                  </div>
                </div>
              )}

                {isRescheduling ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouvelle date et heure
                    </label>
                    <input
                      type="datetime-local"
                      value={newScheduledAt}
                      onChange={(e) => setNewScheduledAt(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setIsRescheduling(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleReschedule}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        Confirmer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-6 border-t">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </button>
                      {!task.completed && (
                        <button
                          onClick={handleMarkDone}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-belaya-vivid text-white rounded-lg hover:bg-belaya-bright transition-colors disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          Terminer
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
