import { useEffect, useState } from 'react';
import { Plus, X, Clock, PlayCircle, PauseCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import GoalCard from '../components/goals/GoalCard';
import GoalStats from '../components/goals/GoalStats';
import GoalSuggestions from '../components/goals/GoalSuggestions';

interface SubGoal {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  checked: boolean;
  parent_goal_id: string;
}

interface Goal {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'achieved';
  created_at: string;
  subgoals: SubGoal[];
}

type TabStatus = 'not_started' | 'in_progress' | 'on_hold' | 'achieved';

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>('in_progress');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showSubgoalModal, setShowSubgoalModal] = useState(false);
  const [selectedGoalForSubgoal, setSelectedGoalForSubgoal] = useState<string | null>(null);
  const [showEditSubgoalModal, setShowEditSubgoalModal] = useState(false);
  const [editingSubgoal, setEditingSubgoal] = useState<SubGoal | null>(null);

  const [formData, setFormData] = useState({
    type: 'content',
    title: '',
    description: '',
  });

  const [subgoalFormData, setSubgoalFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadGoals();
  }, [user]);

  const recalculateParentStatus = async (parentGoalId: string) => {
    const { data: parentGoalData, error: parentError } = await supabase
      .from('goals')
      .select('status')
      .eq('id', parentGoalId)
      .single();

    if (parentError) throw parentError;

    if (parentGoalData.status !== 'on_hold') {
      const { data: allSubgoals, error: subgoalsError } = await supabase
        .from('goals')
        .select('id, checked')
        .eq('parent_goal_id', parentGoalId);

      if (subgoalsError) throw subgoalsError;

      const totalSubgoals = allSubgoals.length;
      const checkedSubgoals = allSubgoals.filter((sg) => sg.checked).length;

      let newStatus: 'not_started' | 'in_progress' | 'on_hold' | 'achieved';

      if (totalSubgoals === 0) {
        newStatus = 'not_started';
      } else if (checkedSubgoals === totalSubgoals) {
        newStatus = 'achieved';
      } else if (checkedSubgoals > 0) {
        newStatus = 'in_progress';
      } else {
        newStatus = 'not_started';
      }

      const { error: statusError } = await supabase
        .from('goals')
        .update({ status: newStatus })
        .eq('id', parentGoalId);

      if (statusError) throw statusError;
    }
  };

  const loadGoals = async () => {
    if (!user) return;

    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .is('parent_goal_id', null)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      const { data: subgoalsData, error: subgoalsError } = await supabase
        .from('goals')
        .select('*')
        .not('parent_goal_id', 'is', null);

      if (subgoalsError) throw subgoalsError;

      const goalsWithSubgoals = (goalsData || []).map((goal) => {
        const subgoals = (subgoalsData || [])
          .filter((sg) => sg.parent_goal_id === goal.id)
          .map((sg) => ({
            id: sg.id,
            title: sg.title,
            start_date: sg.start_date,
            end_date: sg.end_date,
            checked: sg.checked || false,
            parent_goal_id: sg.parent_goal_id!,
          }));

        return {
          ...goal,
          status: goal.status as TabStatus,
          subgoals,
        };
      });

      setGoals(goalsWithSubgoals);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      user_id: user!.id,
      type: formData.type,
      title: formData.title,
      description: formData.description || null,
      status: 'not_started',
      parent_goal_id: null,
      checked: false,
    };

    console.log('[Goals] payload insert', payload);

    try {
      const { data, error } = await supabase.from('goals').insert(payload).select();

      console.log('[Goals] db result', { data, error });

      if (error) {
        alert(`Erreur DB: ${error.code || 'unknown'}\n${error.message}`);
        throw error;
      }

      setShowAddModal(false);
      setFormData({
        type: 'content',
        title: '',
        description: '',
      });
      loadGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    const payload = {
      type: formData.type,
      title: formData.title,
      description: formData.description || null,
    };

    console.log('[Goals] payload update', payload, 'id:', editingGoal.id);

    try {
      const { data, error } = await supabase
        .from('goals')
        .update(payload)
        .eq('id', editingGoal.id)
        .select();

      console.log('[Goals] db result', { data, error });

      if (error) {
        alert(`Erreur DB: ${error.code || 'unknown'}\n${error.message}`);
        throw error;
      }

      setShowEditModal(false);
      setEditingGoal(null);
      setFormData({
        type: 'content',
        title: '',
        description: '',
      });
      loadGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const openEditGoalModal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      type: goal.type,
      title: goal.title,
      description: goal.description || '',
    });
    setShowEditModal(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase.from('goals').delete().eq('id', goalId);
      if (error) throw error;
      loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleAddSubgoal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subgoalFormData.title.trim()) {
      alert('Le titre est obligatoire');
      return;
    }

    if (!subgoalFormData.start_date) {
      alert('La date de début est obligatoire');
      return;
    }

    if (!subgoalFormData.end_date) {
      alert('La date de fin est obligatoire');
      return;
    }

    if (new Date(subgoalFormData.end_date) < new Date(subgoalFormData.start_date)) {
      alert('La date de fin doit être postérieure ou égale à la date de début');
      return;
    }

    const payload = {
      user_id: user!.id,
      type: 'content',
      title: subgoalFormData.title,
      description: null,
      start_date: subgoalFormData.start_date,
      end_date: subgoalFormData.end_date,
      status: 'not_started',
      checked: false,
      parent_goal_id: selectedGoalForSubgoal,
    };

    console.log('[Goals] payload insert (sub-goal)', payload);

    try {
      const { data, error } = await supabase.from('goals').insert(payload).select();

      console.log('[Goals] db result (sub-goal)', { data, error });

      if (error) {
        alert(`Erreur DB: ${error.code || 'unknown'}\n${error.message}`);
        throw error;
      }

      if (selectedGoalForSubgoal) {
        await recalculateParentStatus(selectedGoalForSubgoal);
      }

      setShowSubgoalModal(false);
      setSelectedGoalForSubgoal(null);
      setSubgoalFormData({
        title: '',
        start_date: '',
        end_date: '',
      });
      await loadGoals();
    } catch (error) {
      console.error('Error adding subgoal:', error);
    }
  };

  const handleEditSubgoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubgoal) return;

    if (!subgoalFormData.start_date || !subgoalFormData.end_date) {
      alert('Les dates de début et de fin sont obligatoires');
      return;
    }

    if (new Date(subgoalFormData.end_date) < new Date(subgoalFormData.start_date)) {
      alert('La date de fin doit être postérieure ou égale à la date de début');
      return;
    }

    const payload = {
      title: subgoalFormData.title,
      start_date: subgoalFormData.start_date,
      end_date: subgoalFormData.end_date,
    };

    console.log('[Goals] payload update (sub-goal)', payload, 'id:', editingSubgoal.id);

    try {
      const { data, error } = await supabase
        .from('goals')
        .update(payload)
        .eq('id', editingSubgoal.id)
        .select();

      console.log('[Goals] db result (sub-goal)', { data, error });

      if (error) {
        alert(`Erreur DB: ${error.code || 'unknown'}\n${error.message}`);
        throw error;
      }

      setShowEditSubgoalModal(false);
      setEditingSubgoal(null);
      setSubgoalFormData({
        title: '',
        start_date: '',
        end_date: '',
      });
      loadGoals();
    } catch (error) {
      console.error('Error updating subgoal:', error);
    }
  };

  const openEditSubgoalModal = (subgoal: SubGoal) => {
    setEditingSubgoal(subgoal);
    setSubgoalFormData({
      title: subgoal.title,
      start_date: subgoal.start_date || '',
      end_date: subgoal.end_date || '',
    });
    setShowEditSubgoalModal(true);
  };

  const handleDeleteSubgoal = async (subgoalId: string) => {
    try {
      const subgoal = goals
        .flatMap((g) => g.subgoals)
        .find((sg) => sg.id === subgoalId);

      const { error } = await supabase.from('goals').delete().eq('id', subgoalId);
      if (error) throw error;

      if (subgoal && subgoal.parent_goal_id) {
        await recalculateParentStatus(subgoal.parent_goal_id);
      }

      loadGoals();
    } catch (error) {
      console.error('Error deleting subgoal:', error);
    }
  };

  const handleToggleSubgoal = async (subgoalId: string, checked: boolean) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ checked })
        .eq('id', subgoalId);

      if (error) throw error;

      const subgoal = goals
        .flatMap((g) => g.subgoals)
        .find((sg) => sg.id === subgoalId);

      if (subgoal && subgoal.parent_goal_id) {
        await recalculateParentStatus(subgoal.parent_goal_id);
      }

      loadGoals();
    } catch (error) {
      console.error('Error toggling subgoal:', error);
    }
  };



  const filteredGoals = goals.filter((goal) => {
    const matchesStatus = goal.status === activeTab;
    const matchesCategory = categoryFilter === 'all' || goal.type === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const categoryFilters = [
    { id: 'all', label: 'Tous' },
    { id: 'content', label: 'Contenu' },
    { id: 'business', label: 'Business' },
    { id: 'loyalty', label: 'Fidélisation' },
    { id: 'financial', label: 'Finance' },
    { id: 'personal', label: 'Personnel' },
    { id: 'clients', label: 'Clientèle' },
  ];

  const tabs = [
    { id: 'not_started' as TabStatus, label: 'Pas commencé', icon: Clock, color: 'text-gray-600' },
    { id: 'in_progress' as TabStatus, label: 'En cours', icon: PlayCircle, color: 'text-blue-600' },
    { id: 'on_hold' as TabStatus, label: 'Suspendu', icon: PauseCircle, color: 'text-orange-600' },
    { id: 'achieved' as TabStatus, label: 'Atteint', icon: CheckCircle2, color: 'text-belaya-bright' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  const handleAddGoalFromSuggestion = async (
    title: string,
    type: string,
    subgoals: Array<{ title: string; start_date?: string; end_date?: string }>
  ) => {
    try {
      const goalPayload = {
        user_id: user!.id,
        type,
        title,
        description: null,
        status: 'not_started',
        parent_goal_id: null,
        checked: false,
      };

      const { data: newGoal, error: goalError } = await supabase
        .from('goals')
        .insert(goalPayload)
        .select()
        .single();

      if (goalError) throw goalError;

      if (subgoals && subgoals.length > 0) {
        const subgoalsPayload = subgoals.map((sg) => ({
          user_id: user!.id,
          type,
          title: sg.title,
          description: null,
          status: 'not_started',
          parent_goal_id: newGoal.id,
          checked: false,
          start_date: sg.start_date || null,
          end_date: sg.end_date || null,
        }));

        const { error: subgoalsError } = await supabase
          .from('goals')
          .insert(subgoalsPayload);

        if (subgoalsError) throw subgoalsError;
      }

      loadGoals();
    } catch (error) {
      console.error('Error adding goal from suggestion:', error);
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Mes objectifs</h1>
          <p className="text-sm sm:text-base text-gray-600">Définissez et suivez vos objectifs professionnels</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-belaya-primary to-[#f06bb4] text-white rounded-lg hover:from-belaya-deep hover:to-belaya-primary transition-all shadow-lg hover:shadow-xl w-full sm:w-auto text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden xs:inline">Nouvel objectif</span>
          <span className="xs:hidden">Nouveau</span>
        </button>
      </div>

      <GoalStats goals={goals} />

      <GoalSuggestions
        category={categoryFilter}
        onAddGoal={handleAddGoalFromSuggestion}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {categoryFilters.map((filter) => {
          const isActive = categoryFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setCategoryFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-brand-100 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = goals.filter((g) => {
            const matchesStatus = g.status === tab.id;
            const matchesCategory = categoryFilter === 'all' || g.type === categoryFilter;
            return matchesStatus && matchesCategory;
          }).length;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 ${
                isActive
                  ? `${tab.color} border-current`
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? 'bg-current bg-opacity-10' : 'bg-gray-100'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={openEditGoalModal}
            onDelete={handleDeleteGoal}
            onAddSubgoal={(goalId) => {
              setSelectedGoalForSubgoal(goalId);
              setShowSubgoalModal(true);
            }}
            onToggleSubgoal={handleToggleSubgoal}
            onEditSubgoal={openEditSubgoalModal}
            onDeleteSubgoal={handleDeleteSubgoal}
            onUpdate={loadGoals}
          />
        ))}
      </div>

      {filteredGoals.length === 0 && (
        <div className="text-center py-12">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 ${tabs.find(t => t.id === activeTab)?.color} bg-opacity-10`}>
            {(() => {
              const Icon = tabs.find(t => t.id === activeTab)!.icon;
              return <Icon className={`w-10 h-10 ${tabs.find(t => t.id === activeTab)?.color}`} />;
            })()}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun objectif {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}
          </h3>
          <p className="text-gray-600">
            {activeTab === 'not_started' && 'Créez un nouvel objectif pour commencer'}
            {activeTab === 'in_progress' && 'Vos objectifs en cours apparaîtront ici'}
            {activeTab === 'on_hold' && 'Les objectifs suspendus apparaîtront ici'}
            {activeTab === 'achieved' && 'Vos objectifs atteints apparaîtront ici'}
          </p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Nouvel objectif</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  required
                >
                  <option value="content">Contenu</option>
                  <option value="business">Business</option>
                  <option value="loyalty">Fidélisation</option>
                  <option value="financial">Financier</option>
                  <option value="clients">Clientèle</option>
                  <option value="personal">Personnel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de l'objectif
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  placeholder="Ex: Créer 40 posts Instagram"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnelle)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-brand-700 hover:to-brand-100 transition-all"
                >
                  Créer l'objectif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Modifier l'objectif</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingGoal(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  required
                >
                  <option value="content">Contenu</option>
                  <option value="business">Business</option>
                  <option value="loyalty">Fidélisation</option>
                  <option value="financial">Financier</option>
                  <option value="clients">Clientèle</option>
                  <option value="personal">Personnel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de l'objectif
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
                  Description (optionnelle)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingGoal(null);
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

      {showSubgoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Nouveau sous-objectif</h2>
              <button
                type="button"
                onClick={() => {
                  setShowSubgoalModal(false);
                  setSelectedGoalForSubgoal(null);
                  setSubgoalFormData({
                    title: '',
                    start_date: '',
                    end_date: '',
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddSubgoal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du sous-objectif *
                </label>
                <input
                  type="text"
                  value={subgoalFormData.title}
                  onChange={(e) =>
                    setSubgoalFormData({ ...subgoalFormData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  placeholder="Ex: Créer 5 posts semaine 1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    value={subgoalFormData.start_date}
                    onChange={(e) =>
                      setSubgoalFormData({ ...subgoalFormData, start_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    value={subgoalFormData.end_date}
                    onChange={(e) =>
                      setSubgoalFormData({ ...subgoalFormData, end_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubgoalModal(false);
                    setSelectedGoalForSubgoal(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-100 text-white rounded-lg hover:from-brand-700 hover:to-brand-100 transition-all"
                >
                  Créer le sous-objectif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditSubgoalModal && editingSubgoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Modifier le sous-objectif</h2>
              <button
                onClick={() => {
                  setShowEditSubgoalModal(false);
                  setEditingSubgoal(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubgoal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du sous-objectif *
                </label>
                <input
                  type="text"
                  value={subgoalFormData.title}
                  onChange={(e) =>
                    setSubgoalFormData({ ...subgoalFormData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    value={subgoalFormData.start_date}
                    onChange={(e) =>
                      setSubgoalFormData({ ...subgoalFormData, start_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    value={subgoalFormData.end_date}
                    onChange={(e) =>
                      setSubgoalFormData({ ...subgoalFormData, end_date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditSubgoalModal(false);
                    setEditingSubgoal(null);
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
    </div>
  );
}
