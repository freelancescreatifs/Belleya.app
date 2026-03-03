import { useState, useEffect } from 'react';
import { Plus, X, Check, Trash2, Pencil, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Subproject {
  id: string;
  name: string;
  description: string | null;
  color: string;
  tag_prefix: string | null;
  project_id: string;
}

interface SubprojectManagerProps {
  projectId: string;
  userId: string;
  companyId: string | null;
  onSubprojectChange?: () => void;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export default function SubprojectManager({
  projectId,
  userId,
  companyId,
  onSubprojectChange,
}: SubprojectManagerProps) {
  const [subprojects, setSubprojects] = useState<Subproject[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: DEFAULT_COLORS[0],
  });

  useEffect(() => {
    loadSubprojects();
  }, [projectId]);

  async function loadSubprojects() {
    try {
      const { data, error } = await supabase
        .from('subprojects')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSubprojects(data || []);
    } catch (error) {
      console.error('Error loading subprojects:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Le nom du sous-projet est obligatoire');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('subprojects')
          .update({
            name: formData.name,
            color: formData.color,
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subprojects')
          .insert({
            user_id: userId,
            company_id: companyId,
            project_id: projectId,
            name: formData.name,
            color: formData.color,
          });

        if (error) throw error;
      }

      setFormData({
        name: '',
        color: DEFAULT_COLORS[0],
      });
      setShowAddForm(false);
      setEditingId(null);
      loadSubprojects();
      onSubprojectChange?.();
    } catch (error) {
      console.error('Error saving subproject:', error);
      alert('Erreur lors de la sauvegarde du sous-projet');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer ce sous-projet ? Les tâches associées ne seront pas supprimées.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subprojects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadSubprojects();
      onSubprojectChange?.();
    } catch (error) {
      console.error('Error deleting subproject:', error);
      alert('Erreur lors de la suppression du sous-projet');
    }
  }

  function handleEdit(subproject: Subproject) {
    setFormData({
      name: subproject.name,
      color: subproject.color,
    });
    setEditingId(subproject.id);
    setShowAddForm(true);
  }

  function handleCancel() {
    setFormData({
      name: '',
      color: DEFAULT_COLORS[0],
    });
    setShowAddForm(false);
    setEditingId(null);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-belaya-500" />
          Sous-projets
        </h3>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du sous-projet *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
              placeholder="Ex: Design, Développement, Marketing..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Couleur
            </label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all"
            >
              <Check className="w-4 h-4" />
              {editingId ? 'Mettre à jour' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {subprojects.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            Aucun sous-projet. Créez-en un pour mieux organiser vos tâches.
          </p>
        ) : (
          subprojects.map((subproject) => (
            <div
              key={subproject.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: subproject.color }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {subproject.name}
                </h4>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(subproject)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(subproject.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
