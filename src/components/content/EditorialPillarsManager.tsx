import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, X, BookOpen, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface EditorialPillar {
  id: string;
  pillar_name: string;
  color: string;
  is_active: boolean;
}

interface EditorialPillarsManagerProps {
  professionType: string;
  onPillarsChanged?: () => void;
}

const PRESET_COLORS = [
  '#EC4899', // Pink
  '#F59E0B', // Orange
  '#10B981', // Green
  '#E11D48', // Rose
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#F97316', // Deep Orange
  '#06B6D4', // Cyan
  '#BE123C', // Deep Rose
];

export default function EditorialPillarsManager({ professionType, onPillarsChanged }: EditorialPillarsManagerProps) {
  const { user } = useAuth();
  const [pillars, setPillars] = useState<EditorialPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPillar, setEditingPillar] = useState<EditorialPillar | null>(null);
  const [formData, setFormData] = useState({
    pillar_name: '',
    color: PRESET_COLORS[0]
  });

  useEffect(() => {
    if (user && professionType) {
      loadPillars();
    }
  }, [user, professionType]);

  async function loadPillars() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('editorial_pillars')
        .select('*')
        .eq('user_id', user.id)
        .eq('profession_type', professionType)
        .eq('is_active', true)
        .order('created_at');

      if (error) throw error;

      if (!data || data.length === 0) {
        await initializeDefaultPillars();
      } else {
        setPillars(data);
      }
    } catch (error) {
      console.error('Error loading pillars:', error);
    } finally {
      setLoading(false);
    }
  }

  async function initializeDefaultPillars() {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('create_default_editorial_pillars', {
        p_user_id: user.id,
        p_profession_type: professionType
      });

      if (error) throw error;
      await loadPillars();
    } catch (error) {
      console.error('Error initializing pillars:', error);
    }
  }

  function resetForm() {
    setFormData({
      pillar_name: '',
      color: PRESET_COLORS[0]
    });
    setEditingPillar(null);
  }

  function handleEdit(pillar: EditorialPillar) {
    setEditingPillar(pillar);
    setFormData({
      pillar_name: pillar.pillar_name,
      color: pillar.color
    });
    setShowAddModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingPillar) {
        const { error } = await supabase
          .from('editorial_pillars')
          .update({
            pillar_name: formData.pillar_name,
            color: formData.color
          })
          .eq('id', editingPillar.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('editorial_pillars')
          .insert([{
            user_id: user.id,
            profession_type: professionType,
            pillar_name: formData.pillar_name,
            color: formData.color,
            is_active: true
          }]);

        if (error) throw error;
      }

      setShowAddModal(false);
      resetForm();
      await loadPillars();

      if (onPillarsChanged) {
        onPillarsChanged();
      }
    } catch (error) {
      console.error('Error saving pillar:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce pilier éditorial ?')) return;

    try {
      const { error } = await supabase
        .from('editorial_pillars')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await loadPillars();

      if (onPillarsChanged) {
        onPillarsChanged();
      }
    } catch (error) {
      console.error('Error deleting pillar:', error);
      alert('Erreur lors de la suppression');
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Piliers éditoriaux</h3>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un pilier
        </button>
      </div>

      {pillars.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucun pilier éditorial défini</p>
          <p className="text-sm text-gray-500 mt-1">Ajoutez vos premiers piliers pour structurer vos contenus</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className="group relative p-3 border-2 rounded-xl hover:shadow-md transition-all"
              style={{ borderColor: pillar.color }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pillar.color }}
                  />
                  <span className="font-medium text-gray-900 text-sm truncate">{pillar.pillar_name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(pillar)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(pillar.id)}
                    className="p-1 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPillar ? 'Modifier le pilier' : 'Nouveau pilier éditorial'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du pilier *
                </label>
                <input
                  type="text"
                  value={formData.pillar_name}
                  onChange={(e) => setFormData({ ...formData, pillar_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Techniques & tenue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-full h-10 rounded-lg transition-all ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-gray-900' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formData.color === color && (
                        <Check className="w-5 h-5 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all"
                >
                  {editingPillar ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
