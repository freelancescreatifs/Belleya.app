import { useEffect, useState } from 'react';
import { Plus, Users, Eye, EyeOff, ChevronLeft, ChevronRight, Pencil, X, Trash2, Calendar, Clock, AlertCircle, FolderKanban, Image, Instagram, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BelayaLoader from '../components/shared/BelayaLoader';
import { normalizeTime } from '../lib/timeHelpers';
import TimelineView from '../components/tasks/TimelineView';
import ProjectCard from '../components/tasks/ProjectCard';
import ProjectSelector from '../components/tasks/ProjectSelector';
import SubprojectSelector from '../components/tasks/SubprojectSelector';
import SubprojectBadge from '../components/tasks/SubprojectBadge';
import { getStepIcon, getStepColor, getStepLabel, getStepEmoji } from '../lib/productionStepsHelpers';

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

interface Collaborator {
  id: string;
  name: string;
}

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAYS_SHORT = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getWeekDays = (monday: Date): Date[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
};

const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

export default function Tasks() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activeTab, setActiveTab] = useState<'status' | 'date' | 'projects'>('status');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'todo' | 'in_progress' | 'on_hold' | 'completed'>('in_progress');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedSubprojectIds, setSelectedSubprojectIds] = useState<string[]>([]);
  const [availableSubprojects, setAvailableSubprojects] = useState<Array<{ id: string; name: string; color: string; project_id: string }>>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'year'>('year');
  const [timeFilterReferenceDate, setTimeFilterReferenceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAddTaskForColumn, setShowAddTaskForColumn] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMonthYearSelector, setShowMonthYearSelector] = useState(false);
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [prefilledRecurringGroup, setPrefilledRecurringGroup] = useState<{ category: string; recurrence_pattern: string } | null>(null);
  const [completedProjectNotification, setCompletedProjectNotification] = useState<{ name: string; show: boolean }>({ name: '', show: false });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_recurring: false,
    recurrence_pattern: '',
    collaborator_id: '',
    project_id: '',
    subproject_id: '',
  });

  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    photo_url: '',
    status: 'in_progress' as 'todo' | 'in_progress' | 'on_hold' | 'completed',
  });

  const [uploadingProjectImage, setUploadingProjectImage] = useState(false);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);

  const [projectTasks, setProjectTasks] = useState<Array<{
    id: string;
    title: string;
    start_date: string;
    start_time: string;
  }>>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');

  const [newCollaborator, setNewCollaborator] = useState({ name: '', email: '' });

  useEffect(() => {
    loadTasks();
    loadProjects();
    loadCollaborators();

    if (!user) return;

    const tasksChannel = supabase
      .channel('tasks-changes')
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

    const projectsChannel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(projectsChannel);
    };
  }, [user]);

  useEffect(() => {
    if (selectedProjectIds.length > 0) {
      loadSubprojects();
    } else {
      setAvailableSubprojects([]);
      setSelectedSubprojectIds([]);
    }
  }, [selectedProjectIds]);

  const loadSubprojects = async () => {
    if (selectedProjectIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('subprojects')
        .select('id, name, color, project_id')
        .in('project_id', selectedProjectIds);

      if (error) throw error;
      setAvailableSubprojects(data || []);
    } catch (error) {
      console.error('Error loading subprojects:', error);
    }
  };

  const loadTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, collaborator:collaborators(name), project:projects(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const tasksToReset: string[] = [];

      const tasksWithOverdue = (data || []).map((task) => {
        const isOverdue =
          task.end_date &&
          !task.completed &&
          task.status !== 'completed' &&
          new Date(task.end_date) < new Date();

        if (
          task.is_recurring &&
          task.recurrence_pattern === 'daily' &&
          task.completed &&
          task.last_completed_date &&
          task.last_completed_date !== today
        ) {
          tasksToReset.push(task.id);
          return { ...task, overdue: isOverdue, completed: false, status: 'todo' };
        }

        return { ...task, overdue: isOverdue };
      });

      if (tasksToReset.length > 0) {
        await supabase
          .from('tasks')
          .update({ completed: false, status: 'todo', last_completed_date: null })
          .in('id', tasksToReset);
      }

      setTasks(tasksWithOverdue);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadCollaborators = async () => {
    if (!user) return;

    try {
      const { data, error} = await supabase
        .from('collaborators')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      setCollaborators(data || []);
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      user_id: user!.id,
      company_id: profile?.company_id,
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      priority: formData.priority,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      start_time: normalizeTime(formData.start_time),
      end_time: normalizeTime(formData.end_time),
      status: 'todo',
      is_recurring: formData.is_recurring,
      recurrence_pattern: formData.recurrence_pattern || null,
      collaborator_id: formData.collaborator_id || null,
      project_id: formData.project_id || null,
      subproject_id: formData.subproject_id || null,
      completed: false,
    };

    console.log('[TaskForm] submit', {
      title: formData.title,
      priority: formData.priority,
      payload
    });

    try {
      const { error } = await supabase.from('tasks').insert(payload);

      if (error) {
        console.error('[TaskForm] Error creating task:', error.code, error.message, error.details);
        alert(`Erreur lors de la création de la tâche: ${error.message}`);
        throw error;
      }

      console.log('[TaskForm] Task created successfully');
      setShowAddModal(false);
      setPrefilledRecurringGroup(null);

      const projectId = formData.project_id;

      setFormData({
        title: '',
        description: '',
        category: 'other',
        priority: 'medium',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        is_recurring: false,
        recurrence_pattern: '',
        collaborator_id: '',
        project_id: '',
        subproject_id: '',
      });

      await loadTasks();

      if (projectId) {
        await loadProjects();
        setTimeout(async () => {
          await checkAndUpdateProjectCompletion(projectId);
        }, 100);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const payload = {
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      priority: formData.priority,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      start_time: normalizeTime(formData.start_time),
      end_time: normalizeTime(formData.end_time),
      is_recurring: formData.is_recurring,
      recurrence_pattern: formData.recurrence_pattern || null,
      collaborator_id: formData.collaborator_id || null,
      project_id: formData.project_id || null,
      subproject_id: formData.subproject_id || null,
    };

    console.log('[TaskForm] update', {
      taskId: editingTask.id,
      priority: formData.priority,
      payload
    });

    try {
      const { error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', editingTask.id);

      if (error) {
        console.error('[TaskForm] Error updating task:', error.code, error.message, error.details);
        alert(`Erreur lors de la modification de la tâche: ${error.message}`);
        throw error;
      }

      console.log('[TaskForm] Task updated successfully');

      const oldProjectId = editingTask.project_id;
      const newProjectId = formData.project_id;

      setShowEditModal(false);
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        category: 'other',
        priority: 'medium',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        is_recurring: false,
        recurrence_pattern: '',
        collaborator_id: '',
        project_id: '',
        subproject_id: '',
      });

      await loadTasks();

      if (oldProjectId || newProjectId) {
        await loadProjects();
        setTimeout(async () => {
          if (oldProjectId) {
            await checkAndUpdateProjectCompletion(oldProjectId);
          }
          if (newProjectId && newProjectId !== oldProjectId) {
            await checkAndUpdateProjectCompletion(newProjectId);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      category: task.category || 'other',
      priority: task.priority,
      start_date: task.start_date || '',
      end_date: task.end_date || '',
      start_time: task.start_time || '',
      end_time: task.end_time || '',
      is_recurring: task.is_recurring,
      recurrence_pattern: task.recurrence_pattern || '',
      collaborator_id: task.collaborator_id || '',
      project_id: task.project_id || '',
      subproject_id: task.subproject_id || '',
    });
    setShowEditModal(true);
  };

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('collaborators').insert({
        user_id: user!.id,
        name: newCollaborator.name,
        email: newCollaborator.email || null,
      });

      if (error) throw error;

      setNewCollaborator({ name: '', email: '' });
      loadCollaborators();
    } catch (error) {
      console.error('Error adding collaborator:', error);
    }
  };

  const handleDeleteCollaborator = async (id: string) => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCollaborators();
    } catch (error) {
      console.error('Error deleting collaborator:', error);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user!.id,
          name: projectFormData.name,
          description: projectFormData.description || null,
          photo_url: projectImagePreview || null,
          status: projectFormData.status,
          status_source: 'auto',
        })
        .select()
        .single();

      if (projectError) throw projectError;

      if (projectTasks.length > 0 && newProject) {
        const tasksToInsert = projectTasks.map(task => ({
          user_id: user!.id,
          company_id: profile?.company_id,
          title: task.title,
          description: null,
          category: 'other',
          priority: 'medium',
          start_date: task.start_date || null,
          start_time: normalizeTime(task.start_time),
          end_date: null,
          end_time: null,
          status: 'todo',
          is_recurring: false,
          recurrence_pattern: null,
          collaborator_id: null,
          project_id: newProject.id,
          overdue: false,
          completed: false,
        }));

        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(tasksToInsert);

        if (tasksError) {
          console.error('Error creating tasks:', tasksError);
        }
      }

      setProjectFormData({ name: '', description: '', photo_url: '', status: 'in_progress' });
      setProjectImagePreview(null);
      setProjectTasks([]);
      setNewTaskTitle('');
      setNewTaskDate('');
      setNewTaskTime('');
      setShowAddProjectModal(false);
      loadProjects();
      loadTasks();
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploadingProjectImage(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/project-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      setProjectImagePreview(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingProjectImage(false);
    }
  };

  const handleUpdateProjectStatus = async (
    projectId: string,
    newStatus: 'todo' | 'in_progress' | 'on_hold' | 'completed',
    statusSource: 'manual' | 'auto' = 'manual'
  ) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: newStatus,
          status_source: statusSource,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;
      loadProjects();
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Les tâches associées ne seront pas supprimées.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      loadProjects();
      setShowProjectDetailModal(false);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const getProjectProgress = (projectId: string): { completed: number; total: number; percentage: number } => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  const getComputedProjectStatus = (projectId: string): 'todo' | 'in_progress' | 'on_hold' | 'completed' => {
    const project = projects.find(p => p.id === projectId);

    if (project?.status === 'on_hold') {
      return 'on_hold';
    }

    const progress = getProjectProgress(projectId);
    const doneTasks = progress.completed;
    const totalTasks = progress.total;

    let computedStatus: 'todo' | 'in_progress' | 'completed';

    if (totalTasks === 0) {
      computedStatus = 'todo';
    } else if (totalTasks === 1) {
      computedStatus = doneTasks === 1 ? 'completed' : 'todo';
    } else {
      if (doneTasks === 0) {
        computedStatus = 'todo';
      } else if (doneTasks < totalTasks) {
        computedStatus = 'in_progress';
      } else {
        computedStatus = 'completed';
      }
    }

    console.log('[ProjectStatus]', {
      projectId,
      projectName: project?.name,
      totalTasks,
      doneTasks,
      percentage: progress.percentage,
      computedStatus,
      storedStatus: project?.status,
      statusSource: project?.status_source,
      tasksSample: tasks
        .filter(t => t.project_id === projectId)
        .slice(0, 3)
        .map(t => ({ id: t.id, title: t.title, completed: t.completed }))
    });

    return computedStatus;
  };

  const handleProjectCompleted = (projectName: string) => {
    console.log('[ProjectCompleted] 🎉 Showing completion notification for:', projectName);
    setCompletedProjectNotification({ name: projectName, show: true });
    setTimeout(() => {
      setCompletedProjectNotification({ name: '', show: false });
    }, 5000);
  };

  const checkAndUpdateProjectCompletion = async (
    projectId: string,
    showNotification: boolean = false
  ) => {
    const currentProject = projects.find(p => p.id === projectId);

    if (!currentProject) return;

    if (currentProject.status === 'on_hold') return;

    // Ne modifier automatiquement que si le statut a été défini en mode automatique
    if (currentProject.status_source === 'manual') {
      console.log('[UpdateProjectStatus] Skipping auto-update - status was set manually');
      return;
    }

    const progress = getProjectProgress(projectId);
    const doneTasks = progress.completed;
    const totalTasks = progress.total;

    console.log('[UpdateProjectStatus]', {
      projectId,
      projectName: currentProject.name,
      totalTasks,
      doneTasks,
      currentStatus: currentProject.status,
      statusSource: currentProject.status_source,
      showNotification
    });

    if (totalTasks === 0) return;

    let newStatus: 'todo' | 'in_progress' | 'completed';

    if (totalTasks === 1) {
      newStatus = doneTasks === 1 ? 'completed' : 'todo';
    } else {
      if (doneTasks === 0) {
        newStatus = 'todo';
      } else if (doneTasks < totalTasks) {
        newStatus = 'in_progress';
      } else {
        newStatus = 'completed';
      }
    }

    if (currentProject.status !== newStatus) {
      console.log('[UpdateProjectStatus] Updating status from', currentProject.status, 'to', newStatus);
      await handleUpdateProjectStatus(projectId, newStatus, 'auto');
      await loadProjects();

      if (newStatus === 'completed' && showNotification) {
        handleProjectCompleted(currentProject.name);
      }
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      console.log('[TaskToggle] START', { taskId, completed, hasProject: !!task?.project_id });

      let tasksToUpdate: string[] = [taskId];

      if (!completed) {
        const { data: productionTask } = await supabase
          .from('production_tasks')
          .select('content_id, production_step')
          .eq('task_id', taskId)
          .maybeSingle();

        if (productionTask) {
          const stepOrder = ['script', 'shooting', 'editing', 'scheduling'];
          const currentStepIndex = stepOrder.indexOf(productionTask.production_step);

          if (currentStepIndex !== -1) {
            const followingSteps = stepOrder.slice(currentStepIndex + 1);

            for (const step of followingSteps) {
              const { data: followingTask } = await supabase
                .from('production_tasks')
                .select('task_id')
                .eq('content_id', productionTask.content_id)
                .eq('production_step', step)
                .maybeSingle();

              if (followingTask?.task_id) {
                tasksToUpdate.push(followingTask.task_id);
              }
            }
          }
        }
      }

      // Check project status BEFORE the toggle
      let wasProjectAlreadyCompleted = false;
      if (task?.project_id) {
        const currentProject = projects.find(p => p.id === task.project_id);
        wasProjectAlreadyCompleted = currentProject?.status === 'completed';
        console.log('[TaskToggle] Project status BEFORE:', { projectId: task.project_id, status: currentProject?.status, wasProjectAlreadyCompleted });
      }

      setTasks(prevTasks =>
        prevTasks.map(t =>
          tasksToUpdate.includes(t.id)
            ? { ...t, completed: completed, status: completed ? 'completed' : 'todo' }
            : t
        )
      );

      const { error } = await supabase
        .from('tasks')
        .update({
          completed,
          status: completed ? 'completed' : 'todo',
          completed_at: completed ? new Date().toISOString() : null,
        })
        .in('id', tasksToUpdate);

      if (error) {
        await loadTasks();
        throw error;
      }

      // If task has a project, update project status to 'auto' to allow automatic updates
      if (task?.project_id) {
        // Reset status_source to 'auto' so the system can manage the project status based on tasks
        const currentProject = projects.find(p => p.id === task.project_id);
        if (currentProject && currentProject.status_source === 'manual') {
          await supabase
            .from('projects')
            .update({
              status_source: 'auto',
              updated_at: new Date().toISOString(),
            })
            .eq('id', task.project_id);
        }

        // If completing a task and project wasn't already completed, check for auto-completion
        if (completed && !wasProjectAlreadyCompleted) {
          // Fetch fresh data from database to check if ALL tasks are now completed
          const { data: projectTasks } = await supabase
            .from('tasks')
            .select('completed')
            .eq('project_id', task.project_id)
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

          if (projectTasks) {
            const allCompleted = projectTasks.every(t => t.completed);

            if (allCompleted) {
              console.log('[TaskToggle] All tasks completed! Showing notification for project:', task.project_id);

              // Get project info
              const { data: projectData } = await supabase
                .from('projects')
                .select('name')
                .eq('id', task.project_id)
                .maybeSingle();

              // Update project status to completed
              await supabase
                .from('projects')
                .update({
                  status: 'completed',
                  status_source: 'auto',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', task.project_id);

              // Show notification
              if (projectData) {
                handleProjectCompleted(projectData.name);
              }
            }
          }
        }
      }

      // Reload everything
      await loadTasks();
      await loadProjects();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      console.log('[UpdateTaskStatus] START', { taskId, newStatus, hasProject: !!task?.project_id });

      // Check project status BEFORE the update
      let wasProjectAlreadyCompleted = false;
      if (task?.project_id) {
        const currentProject = projects.find(p => p.id === task.project_id);
        wasProjectAlreadyCompleted = currentProject?.status === 'completed';
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed: newStatus === 'completed',
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', taskId);

      if (error) throw error;

      // If task has a project, update project status_source to 'auto' to allow automatic updates
      if (task?.project_id) {
        // Reset status_source to 'auto' so the system can manage the project status based on tasks
        const currentProject = projects.find(p => p.id === task.project_id);
        if (currentProject && currentProject.status_source === 'manual') {
          await supabase
            .from('projects')
            .update({
              status_source: 'auto',
              updated_at: new Date().toISOString(),
            })
            .eq('id', task.project_id);
        }

        // If completing a task and project wasn't already completed, check for auto-completion
        if (newStatus === 'completed' && !wasProjectAlreadyCompleted) {
          // Fetch fresh data from database to check if ALL tasks are now completed
          const { data: projectTasks } = await supabase
            .from('tasks')
            .select('completed')
            .eq('project_id', task.project_id)
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

          if (projectTasks) {
            const allCompleted = projectTasks.every(t => t.completed);

            if (allCompleted) {
              console.log('[UpdateTaskStatus] All tasks completed! Showing notification for project:', task.project_id);

              // Get project info
              const { data: projectData } = await supabase
                .from('projects')
                .select('name')
                .eq('id', task.project_id)
                .maybeSingle();

              // Update project status to completed
              await supabase
                .from('projects')
                .update({
                  status: 'completed',
                  status_source: 'auto',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', task.project_id);

              // Show notification
              if (projectData) {
                handleProjectCompleted(projectData.name);
              }
            }
          }
        } else {
          // For any other status change, check if project needs status update
          await checkAndUpdateProjectCompletion(task.project_id);
        }
      }

      await loadTasks();
      await loadProjects();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus: string) => {
    if (draggedTask) {
      updateTaskStatus(draggedTask.id, newStatus);
      setDraggedTask(null);
    }
  };

  const cycleStatus = (currentStatus: string): string => {
    const statusCycle = ['todo', 'in_progress', 'on_hold', 'completed'];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    return statusCycle[nextIndex];
  };

  const handleStatusBadgeClick = (taskId: string, currentStatus: string) => {
    const newStatus = cycleStatus(currentStatus);
    updateTaskStatus(taskId, newStatus);
  };

  const toggleRecurringTask = async (taskId: string, currentStatus: boolean) => {
    const today = new Date().toISOString().split('T')[0];

    const updateData = {
      completed: !currentStatus,
      last_completed_date: !currentStatus ? today : null,
      completed_at: !currentStatus ? new Date().toISOString() : null
    };

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              ...updateData
            }
          : task
      )
    );

    try {
      console.log('[Task Update] Payload:', updateData);
      console.log('[Task Update] Task ID:', taskId);

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select();

      if (error) {
        console.error('[Task Update] Failed with detailed error:');
        console.error('  - Status:', error.code);
        console.error('  - Message:', error.message);
        console.error('  - Details:', error.details);
        console.error('  - Hint:', error.hint);
        console.error('  - Payload sent:', JSON.stringify(updateData, null, 2));
        throw error;
      }

      console.log('[Task Update] Success:', data);
    } catch (error: any) {
      console.error('[Task Update] Exception caught:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      });
      loadTasks();
    }
  };

  const handleQuickAddTask = async (status: string) => {
    if (!quickTaskTitle.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          title: quickTaskTitle.trim(),
          status: status,
          priority: 'medium',
          completed: status === 'completed'
        }]);

      if (error) throw error;

      setQuickTaskTitle('');
      setShowAddTaskForColumn(null);
      await loadTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    try {
      const task = tasks.find(t => t.id === taskId);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      await loadTasks();

      if (task?.project_id) {
        await loadProjects();
        setTimeout(async () => {
          await checkAndUpdateProjectCompletion(task.project_id!);
        }, 100);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDeleteRecurringGroup = async (category: string, frequency: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer tout le groupe récurrent et toutes ses tâches ?')) return;

    try {
      const groupTasks = recurringTasks.filter(
        t => t.category === category && t.recurrence_pattern === frequency
      );

      const taskIds = groupTasks.map(t => t.id);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', taskIds);

      if (error) throw error;
      loadTasks();
    } catch (error) {
      console.error('Error deleting recurring group:', error);
    }
  };

  const openAddTaskForRecurringGroup = (category: string, recurrence_pattern: string) => {
    setPrefilledRecurringGroup({ category, recurrence_pattern });
    setFormData({
      title: '',
      description: '',
      category,
      priority: 'medium',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      is_recurring: true,
      recurrence_pattern,
      collaborator_id: '',
      project_id: '',
    });
    setShowAddModal(true);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'very_high':
        return '🔥';
      case 'high':
        return '🥵';
      case 'medium':
        return '😌';
      case 'low':
        return '🥶';
      default:
        return '😌';
    }
  };

  const getPriorityWeight = (priority: string): number => {
    switch (priority) {
      case 'very_high':
        return 4;
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 2;
    }
  };

  const sortTasksByPriority = (tasksToSort: Task[]): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      if (priorityDiff !== 0) return priorityDiff;

      const dateA = a.start_date || a.end_date;
      const dateB = b.start_date || b.end_date;

      if (dateA && dateB) {
        const dateDiff = new Date(dateA).getTime() - new Date(dateB).getTime();
        if (dateDiff !== 0) return dateDiff;

        const timeA = a.start_time || '00:00';
        const timeB = b.start_time || '00:00';
        return timeA.localeCompare(timeB);
      }
      if (dateA) return -1;
      if (dateB) return 1;
      return 0;
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      admin: 'from-blue-400 to-cyan-500',
      content: 'from-rose-400 to-brand-50',
      stock: 'from-orange-400 to-amber-500',
      other: 'from-gray-400 to-slate-500',
    };
    return colors[category] || colors.other;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      todo: { label: 'À faire', color: 'bg-slate-100 text-slate-700 border border-slate-300' },
      in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700 border border-blue-300' },
      on_hold: { label: 'Suspendu', color: 'bg-amber-100 text-amber-700 border border-amber-300' },
      completed: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 border border-belaya-300' },
    };
    return badges[status] || badges.todo;
  };

  const isTaskOnDate = (task: Task, targetDate: Date): boolean => {
    if (task.is_recurring) return false;

    const targetDateStr = targetDate.toISOString().split('T')[0];
    const startDateStr = task.start_date ? task.start_date.split('T')[0] : null;
    const endDateStr = task.end_date ? task.end_date.split('T')[0] : null;

    if (startDateStr && endDateStr) {
      return targetDateStr >= startDateStr && targetDateStr <= endDateStr;
    } else if (startDateStr) {
      return targetDateStr === startDateStr;
    } else if (endDateStr) {
      return targetDateStr === endDateStr;
    }
    return false;
  };

  const getTasksForDay = (targetDate: Date) => {
    const filtered = tasks.filter(task => isTaskOnDate(task, targetDate));

    const withTime = filtered.filter(t => t.start_time);
    const withoutTime = filtered.filter(t => !t.start_time);

    const sortedWithTime = withTime.sort((a, b) => {
      const timeA = a.start_time || '00:00';
      const timeB = b.start_time || '00:00';
      return timeA.localeCompare(timeB);
    });

    return { withTime: sortedWithTime, withoutTime: sortTasksByPriority(withoutTime) };
  };

  const getTaskIconsForDay = (targetDate: Date): { category: string; priority: string }[] => {
    const dayTasks = tasks.filter(task => isTaskOnDate(task, targetDate));
    return dayTasks.map(task => ({
      category: task.category || 'other',
      priority: task.priority
    }));
  };

  const nonRecurringTasks = tasks.filter(t => !t.is_recurring);
  const activeTasks = showCompletedTasks
    ? nonRecurringTasks
    : nonRecurringTasks.filter(t => !t.completed && t.status !== 'completed');

  const getTaskReferenceDate = (task: Task): Date | null => {
    if (task.end_date) {
      return new Date(task.end_date);
    }
    if (task.start_date) {
      return new Date(task.start_date);
    }
    if (task.created_at) {
      return new Date(task.created_at);
    }
    return null;
  };

  const getTimeFilteredTasks = () => {
    if (activeTab !== 'status') return activeTasks;

    const referenceDate = new Date(timeFilterReferenceDate);
    referenceDate.setHours(0, 0, 0, 0);

    return activeTasks.filter(task => {
      if (selectedProjectIds.length > 0 && (!task.project_id || !selectedProjectIds.includes(task.project_id))) {
        return false;
      }

      if (selectedSubprojectIds.length > 0 && (!task.subproject_id || !selectedSubprojectIds.includes(task.subproject_id))) {
        return false;
      }

      const taskDate = getTaskReferenceDate(task);

      if (!taskDate) return false;

      taskDate.setHours(0, 0, 0, 0);

      switch (timeFilter) {
        case 'day':
          return taskDate.toDateString() === referenceDate.toDateString();
        case 'week':
          const weekStart = new Date(referenceDate);
          const dayOfWeek = referenceDate.getDay();
          const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          weekStart.setDate(referenceDate.getDate() + diff);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return taskDate >= weekStart && taskDate <= weekEnd;
        case 'year':
          return taskDate.getFullYear() === referenceDate.getFullYear();
        default:
          return true;
      }
    });
  };

  const timeFilteredTasks = getTimeFilteredTasks();

  const navigateTimeFilter = (direction: 'prev' | 'next') => {
    const newDate = new Date(timeFilterReferenceDate);

    switch (timeFilter) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }

    setTimeFilterReferenceDate(newDate);
  };

  const getTimeFilterLabel = () => {
    const date = timeFilterReferenceDate;

    switch (timeFilter) {
      case 'day':
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      case 'week': {
        const weekStart = new Date(date);
        const dayOfWeek = date.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        weekStart.setDate(date.getDate() + diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      }
      case 'year':
        return date.getFullYear().toString();
      default:
        return '';
    }
  };

  const recurringTasks = tasks.filter(t => t.is_recurring);

  const getRecurringTasksByStatus = (status: string) => {
    const allGroups = recurringTasks.reduce((acc, task) => {
      const frequency = task.recurrence_pattern || 'daily';
      const category = task.category || 'other';
      const key = `${frequency}-${category}`;
      if (!acc[key]) {
        acc[key] = {
          frequency,
          category,
          tasks: []
        };
      }
      acc[key].tasks.push(task);
      return acc;
    }, {} as Record<string, { frequency: string; category: string; tasks: Task[] }>);

    const filteredGroups: Record<string, { frequency: string; category: string; tasks: Task[] }> = {};

    Object.entries(allGroups).forEach(([key, group]) => {
      const allCompleted = group.tasks.every(task => task.completed);
      const hasAnyTask = group.tasks.length > 0;

      if (!hasAnyTask) return;

      if (status === 'completed') {
        if (allCompleted) {
          filteredGroups[key] = group;
        }
      } else {
        if (!allCompleted) {
          const hasTaskWithStatus = group.tasks.some(task => task.status === status);
          if (hasTaskWithStatus) {
            filteredGroups[key] = group;
          }
        }
      }
    });

    return filteredGroups;
  };

  const kanbanColumns = [
    { id: 'todo', label: 'À faire', color: 'bg-gray-100' },
    { id: 'in_progress', label: 'En cours', color: 'bg-blue-100' },
    { id: 'on_hold', label: 'Suspendu', color: 'bg-orange-100' },
    { id: 'completed', label: 'Fait', color: 'bg-green-100' },
  ];

  if (loading) {
    return <BelayaLoader variant="section" />;
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gestion des tâches</h1>
          <p className="text-sm sm:text-base text-gray-600">Organisez et suivez toutes vos tâches</p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setShowCollaboratorsModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            <Users className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="hidden sm:inline">Collaborateurs</span>
            <span className="sm:hidden">Collab.</span>
          </button>
          <button
            onClick={() => {
              setPrefilledRecurringGroup(null);
              setFormData({
                title: '',
                description: '',
                category: 'other',
                priority: 'medium',
                start_date: '',
                end_date: '',
                start_time: '',
                end_time: '',
                is_recurring: false,
                recurrence_pattern: '',
                collaborator_id: '',
                project_id: '',
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-brand-700 hover:to-brand-100 transition-all shadow-lg text-sm sm:text-base"
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="hidden sm:inline">Nouvelle tâche</span>
            <span className="sm:hidden">Nouvelle</span>
          </button>
        </div>
      </div>

      <div className="mb-6 w-full max-w-full overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-x-visible scrollbar-hide">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
            activeTab === 'status'
              ? 'bg-belaya-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="hidden sm:inline">Vue par statuts</span>
          <span className="sm:hidden">Statuts</span>
        </button>
        <button
          onClick={() => setActiveTab('date')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
            activeTab === 'date'
              ? 'bg-belaya-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="hidden sm:inline">Vue par date</span>
          <span className="sm:hidden">Date</span>
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap ${
            activeTab === 'projects'
              ? 'bg-belaya-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span className="hidden sm:inline">Par projet</span>
          <span className="sm:hidden">Projets</span>
        </button>
        </div>
      </div>

      {activeTab === 'status' && (
        <>
          <div className="mb-4 bg-white rounded-xl p-4 border border-gray-200">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrer par projet
                </label>
                <div className="flex flex-wrap gap-2">
                  {projects.map(project => {
                    const isSelected = selectedProjectIds.includes(project.id);
                    return (
                      <button
                        key={project.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedProjectIds(selectedProjectIds.filter(id => id !== project.id));
                          } else {
                            setSelectedProjectIds([...selectedProjectIds, project.id]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-belaya-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {project.name}
                      </button>
                    );
                  })}
                  {selectedProjectIds.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedProjectIds([]);
                        setSelectedSubprojectIds([]);
                      }}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {availableSubprojects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrer par sous-projet
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSubprojects.map(subproject => {
                      const isSelected = selectedSubprojectIds.includes(subproject.id);
                      return (
                        <button
                          key={subproject.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSubprojectIds(selectedSubprojectIds.filter(id => id !== subproject.id));
                            } else {
                              setSelectedSubprojectIds([...selectedSubprojectIds, subproject.id]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? 'text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          style={isSelected ? { backgroundColor: subproject.color } : {}}
                        >
                          {subproject.name}
                        </button>
                      );
                    })}
                    {selectedSubprojectIds.length > 0 && (
                      <button
                        onClick={() => setSelectedSubprojectIds([])}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTimeFilter('day');
                      setTimeFilterReferenceDate(new Date());
                    }}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      timeFilter === 'day'
                        ? 'bg-belaya-500 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Jour
                  </button>
                  <button
                    onClick={() => {
                      setTimeFilter('week');
                      setTimeFilterReferenceDate(new Date());
                    }}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      timeFilter === 'week'
                        ? 'bg-belaya-500 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Semaine
                  </button>
                  <button
                    onClick={() => {
                      setTimeFilter('year');
                      setTimeFilterReferenceDate(new Date());
                    }}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                      timeFilter === 'year'
                        ? 'bg-belaya-500 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Année
                  </button>
                </div>
                <button
                  onClick={() => setTimeFilterReferenceDate(new Date())}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  Aujourd'hui
                </button>
              </div>
              <button
                onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {showCompletedTasks ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showCompletedTasks ? 'Masquer' : 'Voir'} les tâches terminées
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
              <button
                onClick={() => navigateTimeFilter('prev')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 min-w-[200px] text-center">
                  {getTimeFilterLabel()}
                </span>
              </div>

              <button
                onClick={() => navigateTimeFilter('next')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className={`grid gap-6 transition-all duration-500 ${
            !showCompletedTasks
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}>
            {kanbanColumns.map((column) => {
              const columnTasks = sortTasksByPriority(
                timeFilteredTasks.filter((task) => task.status === column.id)
              );

              if (column.id === 'completed' && !showCompletedTasks) {
                return null;
              }

              return (
                <div
                  key={column.id}
                  className={`${column.color} rounded-2xl p-4 min-h-[200px] transition-all duration-500 ${
                    draggedTask ? 'ring-2 ring-rose-300' : ''
                  } ${!showCompletedTasks ? 'scale-[0.98]' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                >
                  <h3 className={`font-semibold text-gray-900 mb-4 transition-all ${
                    !showCompletedTasks ? 'text-base' : 'text-lg'
                  }`}>{column.label}</h3>
                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={updateTaskStatus}
                        getPriorityIcon={getPriorityIcon}
                        onEdit={openEditModal}
                        onDelete={handleDeleteTask}
                        onDragStart={handleDragStart}
                        draggable={true}
                        compactMode={!showCompletedTasks}
                      />
                    ))}

                    {Object.entries(getRecurringTasksByStatus(column.id)).map(([key, group]) => (
                      <RecurringCategoryCard
                        key={key}
                        category={group.category}
                        frequency={group.frequency}
                        tasks={group.tasks}
                        onToggleTask={toggleRecurringTask}
                        onStatusChange={updateTaskStatus}
                        getCategoryColor={getCategoryColor}
                        onEdit={openEditModal}
                        onDelete={handleDeleteTask}
                        onDeleteGroup={handleDeleteRecurringGroup}
                        onAddTask={openAddTaskForRecurringGroup}
                        compactMode={!showCompletedTasks}
                      />
                    ))}
                  </div>

                  {showAddTaskForColumn === column.id ? (
                    <div className="mt-3 bg-white rounded-lg p-3 shadow-sm">
                      <input
                        type="text"
                        value={quickTaskTitle}
                        onChange={(e) => setQuickTaskTitle(e.target.value)}
                        placeholder="Titre de la tâche..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && quickTaskTitle.trim()) {
                            handleQuickAddTask(column.id);
                          } else if (e.key === 'Escape') {
                            setShowAddTaskForColumn(null);
                            setQuickTaskTitle('');
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleQuickAddTask(column.id)}
                          className="flex-1 bg-belaya-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-belaya-primary transition-colors"
                        >
                          Ajouter
                        </button>
                        <button
                          onClick={() => {
                            setShowAddTaskForColumn(null);
                            setQuickTaskTitle('');
                          }}
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddTaskForColumn(column.id)}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/50 hover:bg-white text-gray-600 rounded-lg transition-all text-sm border-2 border-dashed border-gray-300 hover:border-belaya-400"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une tâche
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'date' && (
        <>
          <div className="mb-6 flex items-center justify-center gap-4">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(selectedDate.getDate() - 1);
                setSelectedDate(newDate);
                setCurrentMonday(getMonday(newDate));
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>

            <button
              onClick={() => {
                setTempMonth(selectedDate.getMonth());
                setTempYear(selectedDate.getFullYear());
                setShowMonthYearSelector(true);
              }}
              className="flex items-center gap-2 px-6 py-3 hover:bg-gray-50 rounded-xl transition-colors group"
            >
              <Calendar className="w-5 h-5 text-gray-500 group-hover:text-belaya-500" />
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedDate.getDate()} {formatMonthYear(selectedDate)}
              </h2>
            </button>

            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(selectedDate.getDate() + 1);
                setSelectedDate(newDate);
                setCurrentMonday(getMonday(newDate));
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-4">
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays(currentMonday).map((day, index) => {
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isToday = day.toDateString() === new Date().toDateString();
                const dayIcons = getTaskIconsForDay(day);

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-white text-gray-900'
                        : 'text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-xs font-medium mb-1">{DAYS_SHORT[index]}</span>
                    <span className={`text-2xl font-bold mb-2 ${
                      isToday && !isSelected ? 'text-belaya-400' : ''
                    }`}>
                      {day.getDate()}
                    </span>
                    <div className="flex gap-1 flex-wrap justify-center min-h-[24px]">
                      {dayIcons.slice(0, 3).map((icon, iconIndex) => {
                        const iconColor = icon.category === 'admin' ? 'bg-blue-400' :
                                        icon.category === 'stock' ? 'bg-orange-400' :
                                        icon.category === 'content' ? 'bg-belaya-500' :
                                        'bg-gray-400';
                        return (
                          <div
                            key={iconIndex}
                            className={`w-2 h-2 rounded-full ${iconColor}`}
                          />
                        );
                      })}
                      {dayIcons.length > 3 && (
                        <span className="text-[10px] text-gray-400 ml-1">
                          +{dayIcons.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <TimelineView
            tasksWithTime={getTasksForDay(selectedDate).withTime}
            tasksWithoutTime={getTasksForDay(selectedDate).withoutTime}
            onStatusChange={updateTaskStatus}
            getPriorityIcon={getPriorityIcon}
            getStatusBadge={getStatusBadge}
            onStatusBadgeClick={handleStatusBadgeClick}
            onEdit={openEditModal}
            onDelete={handleDeleteTask}
          />

          {getTasksForDay(selectedDate).withTime.length === 0 &&
           getTasksForDay(selectedDate).withoutTime.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Aucune tâche prévue pour le {selectedDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === 'projects' && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setProjectStatusFilter('todo')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  projectStatusFilter === 'todo'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📝 À faire
              </button>
              <button
                onClick={() => setProjectStatusFilter('in_progress')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  projectStatusFilter === 'in_progress'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔄 En cours
              </button>
              <button
                onClick={() => setProjectStatusFilter('on_hold')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  projectStatusFilter === 'on_hold'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⏸️ En suspend
              </button>
              <button
                onClick={() => setProjectStatusFilter('completed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  projectStatusFilter === 'completed'
                    ? 'bg-belaya-vivid text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✅ Terminé
              </button>
            </div>
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-brand-700 hover:to-brand-100 transition-all"
            >
              <Plus className="w-5 h-5" />
              Nouveau projet
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects
              .filter(project => getComputedProjectStatus(project.id) === projectStatusFilter)
              .map(project => {
                const progress = getProjectProgress(project.id);
                const projectTasks = tasks.filter(task => task.project_id === project.id);
                const computedStatus = getComputedProjectStatus(project.id);
                return (
                  <ProjectCard
                    key={project.id}
                    project={{ ...project, status: computedStatus }}
                    tasks={projectTasks}
                    progress={progress}
                    userId={user!.id}
                    companyId={profile?.company_id || null}
                    onDelete={() => loadProjects()}
                    onUpdate={loadProjects}
                    onAddTask={(projectId) => {
                      setFormData({
                        ...formData,
                        project_id: projectId,
                      });
                      setShowAddModal(true);
                    }}
                    onTaskToggle={handleTaskToggle}
                    onTaskEdit={openEditModal}
                    onTaskDelete={handleDeleteTask}
                    getPriorityIcon={getPriorityIcon}
                  />
                );
              })}
          </div>

          {projects.filter(project => getComputedProjectStatus(project.id) === projectStatusFilter).length === 0 && (
            <div className="text-center py-12">
              <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun projet dans cette catégorie</p>
            </div>
          )}
        </>
      )}

      {showMonthYearSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Navigation rapide</h2>
                <button
                  onClick={() => setShowMonthYearSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mois
                </label>
                <select
                  value={tempMonth}
                  onChange={(e) => setTempMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-lg"
                >
                  <option value={0}>Janvier</option>
                  <option value={1}>Février</option>
                  <option value={2}>Mars</option>
                  <option value={3}>Avril</option>
                  <option value={4}>Mai</option>
                  <option value={5}>Juin</option>
                  <option value={6}>Juillet</option>
                  <option value={7}>Août</option>
                  <option value={8}>Septembre</option>
                  <option value={9}>Octobre</option>
                  <option value={10}>Novembre</option>
                  <option value={11}>Décembre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année
                </label>
                <select
                  value={tempYear}
                  onChange={(e) => setTempYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-lg"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  const newDate = new Date(tempYear, tempMonth, 1);
                  setSelectedDate(newDate);
                  setCurrentMonday(getMonday(newDate));
                  setShowMonthYearSelector(false);
                }}
                className="w-full bg-belaya-500 text-white px-6 py-3 rounded-lg hover:bg-belaya-primary transition-colors font-medium"
              >
                Aller à cette date
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Nouveau projet</h2>
              <button
                onClick={() => setShowAddProjectModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du projet *
                </label>
                <input
                  type="text"
                  value={projectFormData.name}
                  onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut du projet *
                </label>
                <select
                  value={projectFormData.status}
                  onChange={(e) => setProjectFormData({ ...projectFormData, status: e.target.value as 'todo' | 'in_progress' | 'on_hold' | 'completed' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  required
                >
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="on_hold">En pause</option>
                  <option value="completed">Terminé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image du projet
                </label>
                {projectImagePreview ? (
                  <div className="relative">
                    <img
                      src={projectImagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setProjectImagePreview(null)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-belaya-500 transition-colors bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Image className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        {uploadingProjectImage ? 'Upload en cours...' : 'Cliquez pour ajouter une image'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProjectImageUpload}
                      disabled={uploadingProjectImage}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Tâches du projet (optionnel)
                  </label>
                  <span className="text-xs text-gray-500">
                    {projectTasks.length} tâche{projectTasks.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3 mb-3">
                  {projectTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg group">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {(task.start_date || task.start_time) && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                            {task.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.start_date).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                            {task.start_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.start_time}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setProjectTasks(projectTasks.filter(t => t.id !== task.id))}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Titre de la tâche"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-sm"
                    />
                    <input
                      type="time"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (newTaskTitle.trim()) {
                        setProjectTasks([
                          ...projectTasks,
                          {
                            id: crypto.randomUUID(),
                            title: newTaskTitle,
                            start_date: newTaskDate,
                            start_time: newTaskTime,
                          },
                        ]);
                        setNewTaskTitle('');
                        setNewTaskDate('');
                        setNewTaskTime('');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter cette tâche
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProjectModal(false);
                    setProjectTasks([]);
                    setNewTaskTitle('');
                    setNewTaskDate('');
                    setNewTaskTime('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-brand-700 hover:to-brand-100 transition-all"
                >
                  Créer le projet{projectTasks.length > 0 && ` (${projectTasks.length} tâche${projectTasks.length > 1 ? 's' : ''})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Nouvelle tâche</h2>
            </div>

            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la tâche
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projet
                </label>
                <ProjectSelector
                  value={formData.project_id}
                  onChange={(projectId) => setFormData({ ...formData, project_id: projectId, subproject_id: '' })}
                  projects={projects}
                  onProjectCreated={loadProjects}
                  userId={user!.id}
                />
              </div>

              {formData.project_id && (
                <SubprojectSelector
                  projectId={formData.project_id}
                  value={formData.subproject_id}
                  onChange={(subprojectId) => setFormData({ ...formData, subproject_id: subprojectId || '' })}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                >
                  <option value="admin">Administratif</option>
                  <option value="stock">Stock</option>
                  <option value="content">Contenu</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.is_recurring}
                  onChange={(e) =>
                    setFormData({ ...formData, is_recurring: e.target.checked })
                  }
                  className="w-4 h-4 text-belaya-primary border-gray-300 rounded focus:ring-belaya-primary"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                  Tâche récurrente
                </label>
              </div>

              {formData.is_recurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Récurrence
                  </label>
                  <select
                    value={formData.recurrence_pattern}
                    onChange={(e) =>
                      setFormData({ ...formData, recurrence_pattern: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  >
                    <option value="">Sélectionner</option>
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuelle</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                >
                  <option value="low">🥶 Basse</option>
                  <option value="medium">😌 Moyenne</option>
                  <option value="high">🥵 Haute</option>
                  <option value="very_high">🔥 Urgente</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de commencement
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attribuer à
                </label>
                <select
                  value={formData.collaborator_id}
                  onChange={(e) => setFormData({ ...formData, collaborator_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                >
                  <option value="">Moi-même</option>
                  {collaborators.map((collab) => (
                    <option key={collab.id} value={collab.id}>
                      {collab.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setPrefilledRecurringGroup(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-brand-700 hover:to-brand-100 transition-all"
                >
                  Créer la tâche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Modifier la tâche</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la tâche
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projet
                </label>
                <ProjectSelector
                  value={formData.project_id}
                  onChange={(projectId) => setFormData({ ...formData, project_id: projectId, subproject_id: '' })}
                  projects={projects}
                  onProjectCreated={loadProjects}
                  userId={user!.id}
                />
              </div>

              {formData.project_id && (
                <SubprojectSelector
                  projectId={formData.project_id}
                  value={formData.subproject_id}
                  onChange={(subprojectId) => setFormData({ ...formData, subproject_id: subprojectId || '' })}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                >
                  <option value="admin">Administratif</option>
                  <option value="stock">Stock</option>
                  <option value="content">Contenu</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring-edit"
                  checked={formData.is_recurring}
                  onChange={(e) =>
                    setFormData({ ...formData, is_recurring: e.target.checked })
                  }
                  className="w-4 h-4 text-belaya-primary border-gray-300 rounded focus:ring-belaya-primary"
                />
                <label htmlFor="recurring-edit" className="text-sm font-medium text-gray-700">
                  Tâche récurrente
                </label>
              </div>

              {formData.is_recurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Récurrence
                  </label>
                  <select
                    value={formData.recurrence_pattern}
                    onChange={(e) =>
                      setFormData({ ...formData, recurrence_pattern: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  >
                    <option value="">Sélectionner</option>
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuelle</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                >
                  <option value="low">🥶 Basse</option>
                  <option value="medium">😌 Moyenne</option>
                  <option value="high">🥵 Haute</option>
                  <option value="very_high">🔥 Urgente</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de commencement
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attribuer à
                </label>
                <select
                  value={formData.collaborator_id}
                  onChange={(e) => setFormData({ ...formData, collaborator_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                >
                  <option value="">Moi-même</option>
                  {collaborators.map((collab) => (
                    <option key={collab.id} value={collab.id}>
                      {collab.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-brand-700 hover:to-brand-100 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCollaboratorsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Gestion des collaborateurs</h2>
            </div>

            <div className="p-6">
              <form onSubmit={handleAddCollaborator} className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={newCollaborator.name}
                      onChange={(e) =>
                        setNewCollaborator({ ...newCollaborator, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newCollaborator.email}
                      onChange={(e) =>
                        setNewCollaborator({ ...newCollaborator, email: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-brand-700 hover:to-brand-100 transition-all"
                >
                  Ajouter un collaborateur
                </button>
              </form>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Collaborateurs ({collaborators.length})
                </h3>
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-900">{collab.name}</span>
                    <button
                      onClick={() => handleDeleteCollaborator(collab.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowCollaboratorsModal(false)}
                className="w-full mt-6 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {completedProjectNotification.show && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-green-400 to-green-600 text-white px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-4 border-4 border-white">
            <div className="text-5xl">🎉</div>
            <div>
              <div className="font-bold text-xl mb-1">Bravo ! Projet terminé</div>
              <div className="text-green-100 text-sm">{completedProjectNotification.name}</div>
            </div>
            <div className="bg-white text-belaya-bright px-4 py-2 rounded-full font-bold text-sm">
              Terminé
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  onStatusChange,
  getPriorityIcon,
  onEdit,
  onDelete,
  showStatusBadge = false,
  getStatusBadge,
  onStatusBadgeClick,
  draggable = false,
  onDragStart,
  compactMode = false,
}: {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  getPriorityIcon: (priority: string) => string | null;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  showStatusBadge?: boolean;
  getStatusBadge?: (status: string) => { label: string; color: string };
  onStatusBadgeClick?: (taskId: string, currentStatus: string) => void;
  draggable?: boolean;
  onDragStart?: (task: Task) => void;
  compactMode?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 relative cursor-grab active:cursor-grabbing ${
        compactMode ? 'p-3' : 'p-4'
      } ${task.priority === 'very_high' ? 'border-2 border-red-400 shadow-red-100' : ''}`}
      draggable={draggable}
      onDragStart={() => onDragStart && onDragStart(task)}
    >
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {onEdit && (
          <button
            onClick={() => onEdit(task)}
            className={`p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ${
              compactMode ? '' : ''
            }`}
          >
            <Pencil className={compactMode ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className={`p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${
              compactMode ? '' : ''
            }`}
          >
            <Trash2 className={compactMode ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>
        )}
      </div>
      <div className={`flex items-start justify-between pr-8 ${compactMode ? 'mb-1.5' : 'mb-2'}`}>
        <div className="flex-1">
          <div className={`flex items-center gap-2 ${compactMode ? 'mb-0.5' : 'mb-1'}`}>
            <h4 className={`font-medium text-gray-900 transition-all ${
              compactMode ? 'text-sm' : 'text-base'
            }`}>
              {task.production_step && <span className="mr-1">{getStepEmoji(task.production_step)}</span>}
              {task.title}
            </h4>
            <span className={compactMode ? 'text-base' : 'text-lg'}>{getPriorityIcon(task.priority)}</span>
          </div>
          {task.description && !task.is_recurring && (
            <p className={`text-gray-600 line-clamp-2 transition-all ${
              compactMode ? 'text-xs mb-1.5' : 'text-sm mb-2'
            }`}>
              {task.description}
            </p>
          )}
        </div>
      </div>

      <div className={`flex items-center justify-between flex-wrap gap-2 transition-all ${
        compactMode ? 'text-[10px] mb-2' : 'text-xs mb-3'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">
            {task.start_date && task.end_date
              ? `${new Date(task.start_date).toLocaleDateString('fr-FR')} → ${new Date(task.end_date).toLocaleDateString('fr-FR')}`
              : task.start_date
              ? new Date(task.start_date).toLocaleDateString('fr-FR')
              : task.end_date
              ? new Date(task.end_date).toLocaleDateString('fr-FR')
              : 'Pas de date'}
          </span>
          {task.production_step && (() => {
            const Icon = getStepIcon(task.production_step);
            return (
              <div className={`flex items-center gap-1 ${getStepColor(task.production_step)}`}>
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{getStepLabel(task.production_step)}</span>
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
        </div>
        <div className="flex items-center gap-2">
          {task.tags === 'Réseaux sociaux' && (
            <span className="bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-300 px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <Instagram className="w-3 h-3" />
              Réseaux sociaux
            </span>
          )}
          {task.priority === 'very_high' && (
            <span className="bg-red-100 text-red-700 border border-red-300 px-2 py-1 rounded-full font-bold">
              URGENT
            </span>
          )}
          {showStatusBadge && getStatusBadge && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusBadgeClick && onStatusBadgeClick(task.id, task.status);
              }}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 hover:shadow-md ${getStatusBadge(task.status).color}`}
            >
              {getStatusBadge(task.status).label}
            </button>
          )}
          {task.overdue && (
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">
              Retard
            </span>
          )}
        </div>
      </div>

      {task.collaborator && (
        <div className={`text-gray-500 flex items-center gap-1 transition-all ${
          compactMode ? 'mb-2 text-[10px]' : 'mb-3 text-xs'
        }`}>
          <Users className={compactMode ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          {task.collaborator.name}
        </div>
      )}

      {(task.project || task.subproject_id) && (
        <div className={`flex items-center gap-2 flex-wrap transition-all ${
          compactMode ? 'mb-2' : 'mb-3'
        }`}>
          {task.project && (
            <div className={`flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg ${
              compactMode ? 'text-[10px]' : 'text-xs'
            }`}>
              <FolderKanban className={compactMode ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
              <span className="font-medium">{task.project.name}</span>
            </div>
          )}
          {task.subproject_id && (
            <SubprojectBadge subprojectId={task.subproject_id} />
          )}
        </div>
      )}

      <div className="flex gap-2">
        {task.status === 'todo' && (
          <button
            onClick={() => onStatusChange(task.id, 'in_progress')}
            className={`flex-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all ${
              compactMode ? 'text-[10px] px-2 py-1.5' : 'text-xs px-3 py-2'
            }`}
          >
            Commencer
          </button>
        )}
        {task.status === 'in_progress' && (
          <>
            <button
              onClick={() => onStatusChange(task.id, 'on_hold')}
              className={`flex-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all ${
                compactMode ? 'text-[10px] px-2 py-1.5' : 'text-xs px-3 py-2'
              }`}
            >
              Suspendre
            </button>
            <button
              onClick={() => onStatusChange(task.id, 'completed')}
              className={`flex-1 bg-belaya-vivid text-white rounded-lg hover:bg-belaya-bright transition-all ${
                compactMode ? 'text-[10px] px-2 py-1.5' : 'text-xs px-3 py-2'
              }`}
            >
              Terminer
            </button>
          </>
        )}
        {task.status === 'on_hold' && (
          <>
            <button
              onClick={() => onStatusChange(task.id, 'todo')}
              className={`flex-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all ${
                compactMode ? 'text-[10px] px-2 py-1.5' : 'text-xs px-3 py-2'
              }`}
            >
              À faire
            </button>
            <button
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className={`flex-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all ${
                compactMode ? 'text-[10px] px-2 py-1.5' : 'text-xs px-3 py-2'
              }`}
            >
              Reprendre
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function RecurringCategoryCard({
  category,
  frequency,
  tasks,
  onToggleTask,
  onStatusChange,
  getCategoryColor,
  onEdit,
  onDelete,
  onDeleteGroup,
  onAddTask,
  compactMode = false,
}: {
  category: string;
  frequency?: string;
  tasks: Task[];
  onToggleTask: (taskId: string, currentStatus: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  getCategoryColor: (category: string) => string;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onDeleteGroup?: (category: string, frequency: string) => void;
  onAddTask?: (category: string, recurrence_pattern: string) => void;
  compactMode?: boolean;
}) {
  const categoryLabels: Record<string, string> = {
    admin: 'Administratif',
    content: 'Contenu',
    stock: 'Stock',
    other: 'Autre',
  };

  const frequencyLabels: Record<string, string> = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className={`bg-gradient-to-r ${getCategoryColor(category)} rounded-xl shadow-md transition-all duration-500 ${compactMode ? 'p-4' : 'p-5'}`}>
      <div className={`flex items-center justify-between ${compactMode ? 'mb-3' : 'mb-4'}`}>
        <div className="flex items-center gap-3 flex-1">
          <h4 className={`font-bold text-white transition-all ${compactMode ? 'text-base' : 'text-lg'}`}>
            {categoryLabels[category] || category}
          </h4>
          {frequency && (
            <span className={`bg-white bg-opacity-50 px-3 py-1 rounded-full font-semibold uppercase tracking-wide transition-all ${
              compactMode ? 'text-[10px]' : 'text-xs'
            }`}>
              {frequencyLabels[frequency] || frequency}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onDeleteGroup && frequency && (
            <button
              onClick={() => onDeleteGroup(category, frequency)}
              className="bg-white bg-opacity-30 hover:bg-opacity-50 p-2 rounded-lg transition-all"
              title="Supprimer tout le groupe"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          )}
          <span className={`bg-white bg-opacity-40 rounded-full font-bold text-white transition-all duration-300 ${
            compactMode ? 'text-base px-3 py-1' : 'text-lg px-4 py-1.5'
          }`}>
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className={`w-full bg-white bg-opacity-30 rounded-full transition-all ${
        compactMode ? 'h-2.5 mb-4' : 'h-3 mb-5'
      }`}>
        <div
          className="bg-white h-full rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className={`space-y-2.5 bg-white bg-opacity-20 rounded-lg transition-all ${
        compactMode ? 'p-3' : 'p-4'
      }`}>
        {tasks.map((task) => (
          <div key={task.id} className="relative">
            <label className={`flex items-center justify-between cursor-pointer group transition-all ${
              compactMode ? 'py-1.5' : 'py-2'
            }`}>
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggleTask(task.id, task.completed)}
                  className={`text-belaya-primary border-2 border-white rounded focus:ring-2 focus:ring-belaya-primary cursor-pointer transition-all ${
                    compactMode ? 'w-4 h-4' : 'w-5 h-5'
                  }`}
                />
                <div className="flex-1">
                  <p className={`font-semibold transition-all ${
                    compactMode ? 'text-sm' : 'text-base'
                  } ${task.completed ? 'line-through opacity-70' : ''}`}>
                    {task.production_step && <span className="mr-1">{getStepEmoji(task.production_step)}</span>}
                    {task.title}
                  </p>
                  {task.collaborator && (
                    <div className={`flex items-center gap-1 opacity-80 transition-all ${
                      compactMode ? 'text-[10px] mt-0.5' : 'text-xs mt-1'
                    }`}>
                      <Users className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                      {task.collaborator.name}
                    </div>
                  )}
                  {(task.project || task.subproject_id) && (
                    <div className={`flex items-center gap-2 flex-wrap transition-all ${
                      compactMode ? 'mt-0.5' : 'mt-1'
                    }`}>
                      {task.project && (
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 bg-white bg-opacity-30 rounded ${
                          compactMode ? 'text-[10px]' : 'text-xs'
                        }`}>
                          <FolderKanban className={compactMode ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
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
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onEdit(task);
                    }}
                    className={`hover:bg-white hover:bg-opacity-30 rounded transition-colors ${
                      compactMode ? 'p-1' : 'p-1.5'
                    }`}
                  >
                    <Pencil className={compactMode ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(task.id);
                    }}
                    className={`hover:bg-white hover:bg-opacity-30 rounded transition-colors ${
                      compactMode ? 'p-1' : 'p-1.5'
                    }`}
                  >
                    <Trash2 className={compactMode ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                  </button>
                )}
              </div>
            </label>
          </div>
        ))}

        {onAddTask && frequency && (
          <button
            onClick={() => onAddTask(category, frequency)}
            className={`w-full flex items-center justify-center gap-2 text-white bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all mt-3 ${
              compactMode ? 'py-2 text-xs' : 'py-2.5 text-sm'
            }`}
          >
            <Plus className={compactMode ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            <span>Ajouter une tâche</span>
          </button>
        )}
      </div>
    </div>
  );
}
