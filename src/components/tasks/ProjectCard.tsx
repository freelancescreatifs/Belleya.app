import { useState, useRef, useEffect } from 'react';
import { Trash2, Pencil, ChevronDown, ChevronUp, Plus, Check, X, Upload, Image as ImageIcon, Pause, Play, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SubprojectManager from './SubprojectManager';
import SubprojectBadge from './SubprojectBadge';

interface Subproject {
  id: string;
  name: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  status: 'todo' | 'in_progress' | 'on_hold' | 'completed';
  status_source: 'manual' | 'auto';
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  completed: boolean;
  priority: string;
  start_date?: string | null;
  end_date?: string | null;
  subproject_id?: string | null;
}

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  progress: { completed: number; total: number; percentage: number };
  userId: string;
  companyId: string | null;
  onDelete: (projectId: string) => void;
  onUpdate: () => void;
  onAddTask: (projectId: string) => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  getPriorityIcon: (priority: string) => string;
}

export default function ProjectCard({
  project,
  tasks,
  progress,
  userId,
  companyId,
  onDelete,
  onUpdate,
  onAddTask,
  onTaskToggle,
  onTaskEdit,
  onTaskDelete,
  getPriorityIcon,
}: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editForm, setEditForm] = useState({
    name: project.name,
    description: project.description || '',
    status: project.status,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(project.photo_url);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subprojects, setSubprojects] = useState<Subproject[]>([]);
  const [selectedSubprojectFilter, setSelectedSubprojectFilter] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded) {
      loadSubprojects();
    }
  }, [isExpanded, project.id]);

  async function loadSubprojects() {
    try {
      const { data, error } = await supabase
        .from('subprojects')
        .select('id, name, color')
        .eq('project_id', project.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setSubprojects(data || []);
    } catch (error) {
      console.error('Error loading subprojects:', error);
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Voulez-vous vraiment supprimer le projet "${project.name}" ?`)) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) throw error;
      onDelete(project.id);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Erreur lors de la suppression du projet');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
    });
    setImagePreview(project.photo_url);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5 MB');
      return;
    }

    try {
      setUploadingImage(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${project.id}-${Date.now()}.${fileExt}`;

      if (project.photo_url) {
        const oldPath = project.photo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('project-images').remove([`${userId}/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      setImagePreview(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!editForm.name.trim()) {
      alert('Le nom du projet est obligatoire');
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: editForm.name,
          description: editForm.description || null,
          photo_url: imagePreview,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Erreur lors de la mise à jour du projet');
    }
  };

  const handleToggleSuspend = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const newStatus = project.status === 'on_hold' ? 'in_progress' : 'on_hold';
      const newStatusSource = project.status === 'on_hold' ? 'auto' : 'manual';

      const { error } = await supabase
        .from('projects')
        .update({
          status: newStatus,
          status_source: newStatusSource,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;

      onUpdate();
    } catch (error) {
      console.error('Error toggling project suspend:', error);
      alert('Erreur lors de la modification du statut');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'todo':
        return { label: 'À faire', color: 'bg-gray-500' };
      case 'in_progress':
        return { label: 'En cours', color: 'bg-blue-500' };
      case 'on_hold':
        return { label: 'En suspend', color: 'bg-orange-500' };
      case 'completed':
        return { label: 'Terminé', color: 'bg-belaya-vivid' };
      default:
        return { label: status, color: 'bg-gray-500' };
    }
  };

  const statusBadge = getStatusBadge(isEditing ? editForm.status : project.status);

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden">
      {(imagePreview || isEditing) && (
        <div className="h-40 overflow-hidden relative group">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt={project.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          {isEditing && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={uploadingImage}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                <Upload className="w-4 h-4" />
                {uploadingImage ? 'Upload...' : 'Changer l\'image'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 mr-3">
            {isEditing ? (
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-xl font-bold text-gray-900 border-b-2 border-belaya-500 focus:outline-none"
                placeholder="Nom du projet"
              />
            ) : (
              <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                {project.name}
              </h3>
            )}
          </div>
          {!isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleSuspend}
                className={`p-2 rounded-lg transition-colors ${
                  project.status === 'on_hold'
                    ? 'text-belaya-bright hover:text-green-700 hover:bg-green-50'
                    : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                }`}
                title={project.status === 'on_hold' ? 'Reprendre' : 'Mettre en suspend'}
              >
                {project.status === 'on_hold' ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleEdit}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Modifier"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3 mb-4">
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent resize-none"
              rows={3}
              placeholder="Description du projet (optionnel)"
            />
            {!imagePreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={uploadingImage}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-belaya-500 hover:text-belaya-500 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {uploadingImage ? 'Upload en cours...' : 'Ajouter une image'}
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all"
              >
                <Check className="w-4 h-4" />
                Enregistrer
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold text-white ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            </div>

            {project.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description}
              </p>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {progress.completed} / {progress.total} tâches
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {progress.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Masquer les tâches
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Voir les tâches ({tasks.length})
                  </>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTask(project.id);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Tâche
              </button>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                <SubprojectManager
                  projectId={project.id}
                  userId={userId}
                  companyId={companyId}
                  onSubprojectChange={() => {
                    loadSubprojects();
                    onUpdate();
                  }}
                />

                {subprojects.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pb-2">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Filter className="w-4 h-4" />
                      <span className="font-medium">Filtrer:</span>
                    </div>
                    <button
                      onClick={() => setSelectedSubprojectFilter(null)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedSubprojectFilter === null
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tous
                    </button>
                    {subprojects.map((subproject) => (
                      <button
                        key={subproject.id}
                        onClick={() => setSelectedSubprojectFilter(subproject.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          selectedSubprojectFilter === subproject.id
                            ? 'text-white'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: selectedSubprojectFilter === subproject.id
                            ? subproject.color
                            : `${subproject.color}20`,
                          color: selectedSubprojectFilter === subproject.id
                            ? 'white'
                            : subproject.color,
                        }}
                      >
                        {subproject.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {(() => {
                    const filteredTasks = selectedSubprojectFilter
                      ? tasks.filter((task) => task.subproject_id === selectedSubprojectFilter)
                      : tasks;

                    return filteredTasks.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">
                        {selectedSubprojectFilter
                          ? 'Aucune tâche pour ce sous-projet'
                          : 'Aucune tâche pour ce projet'}
                      </p>
                    ) : (
                      filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors relative group"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskToggle(task.id, !task.completed);
                        }}
                        className={`flex-shrink-0 w-5 h-5 border-2 rounded transition-all ${
                          task.completed
                            ? 'bg-belaya-vivid border-belaya-500'
                            : 'border-gray-300 hover:border-belaya-400'
                        } flex items-center justify-center`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-medium transition-all ${
                            task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </p>
                          {task.subproject_id && (
                            <SubprojectBadge subprojectId={task.subproject_id} />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskEdit(task);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskDelete(task.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                      ))
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
              <span>
                Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
