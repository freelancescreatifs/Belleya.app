import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface ProjectSelectorProps {
  value: string;
  onChange: (projectId: string) => void;
  projects: Project[];
  onProjectCreated: () => void;
  userId: string;
}

export default function ProjectSelector({
  value,
  onChange,
  projects,
  onProjectCreated,
  userId,
}: ProjectSelectorProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      alert('Le nom du projet est obligatoire');
      return;
    }

    try {
      setCreating(true);
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: newProjectName.trim(),
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) throw error;

      onChange(data.id);
      setNewProjectName('');
      setShowCreateForm(false);
      onProjectCreated();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Erreur lors de la création du projet');
    } finally {
      setCreating(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {!showCreateForm ? (
        <>
          <div className="relative">
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent appearance-none"
            >
              <option value="">Aucun projet</option>
              <optgroup label="Projets en cours">
                {projects
                  .filter(p => p.status === 'in_progress')
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Autres projets">
                {projects
                  .filter(p => p.status !== 'in_progress')
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-belaya-500 hover:text-belaya-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer un nouveau projet
          </button>
        </>
      ) : (
        <div className="border-2 border-belaya-500 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">
              Nouveau projet
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewProjectName('');
              }}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateProject();
              }
            }}
            placeholder="Nom du projet"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateProject}
              disabled={creating || !newProjectName.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Création...' : 'Créer et sélectionner'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewProjectName('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
