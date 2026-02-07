import { useState, useEffect, useRef } from 'react';
import { Target, Plus, Pencil, Trash2, Sparkles, Megaphone, Briefcase, Heart, DollarSign, Users, User, ChevronDown, ChevronUp, Pause, Play } from 'lucide-react';
import SubGoalItem from './SubGoalItem';
import { supabase } from '../../lib/supabase';

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
  subgoals: SubGoal[];
}

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onAddSubgoal: (goalId: string) => void;
  onToggleSubgoal: (subgoalId: string, checked: boolean) => void;
  onEditSubgoal: (subgoal: SubGoal) => void;
  onDeleteSubgoal: (id: string) => void;
  onUpdate: () => void;
}

export default function GoalCard({
  goal,
  onEdit,
  onDelete,
  onAddSubgoal,
  onToggleSubgoal,
  onEditSubgoal,
  onDeleteSubgoal,
  onUpdate,
}: GoalCardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSubgoals, setShowSubgoals] = useState(false);
  const previousStatus = useRef(goal.status);

  const totalSubgoals = goal.subgoals?.length || 0;
  const checkedSubgoals = goal.subgoals?.filter((sg) => sg.checked).length || 0;
  const progress = totalSubgoals > 0 ? (checkedSubgoals / totalSubgoals) * 100 : 0;
  const isCompleted = goal.status === 'achieved' && totalSubgoals > 0;

  useEffect(() => {
    if (previousStatus.current !== 'achieved' && goal.status === 'achieved' && totalSubgoals > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    previousStatus.current = goal.status;
  }, [goal.status, totalSubgoals]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      content: 'from-purple-400 to-brand-100',
      business: 'from-blue-400 to-cyan-600',
      loyalty: 'from-amber-400 to-orange-600',
      financial: 'from-green-400 to-emerald-600',
      clients: 'from-blue-400 to-cyan-600',
      personal: 'from-orange-400 to-red-600',
    };
    return colors[type] || 'from-gray-400 to-gray-600';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      content: 'Contenu',
      business: 'Business',
      loyalty: 'Fidélisation',
      financial: 'Financier',
      clients: 'Clientèle',
      personal: 'Personnel',
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, typeof Target> = {
      content: Megaphone,
      business: Briefcase,
      loyalty: Heart,
      financial: DollarSign,
      clients: Users,
      personal: User,
    };
    return icons[type] || Target;
  };

  const handleDelete = () => {
    if (confirm(`Voulez-vous vraiment supprimer l'objectif "${goal.title}" ?`)) {
      onDelete(goal.id);
    }
  };

  const handleToggleSuspend = async () => {
    try {
      if (goal.status === 'on_hold') {
        const checkedCount = goal.subgoals.filter(sg => sg.checked).length;
        const total = goal.subgoals.length;

        let autoStatus: Goal['status'] = 'not_started';
        if (total > 0) {
          if (checkedCount === total) {
            autoStatus = 'achieved';
          } else if (checkedCount > 0) {
            autoStatus = 'in_progress';
          }
        }

        const { error } = await supabase
          .from('goals')
          .update({ status: autoStatus })
          .eq('id', goal.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('goals')
          .update({ status: 'on_hold' })
          .eq('id', goal.id);

        if (error) throw error;
      }

      onUpdate();
    } catch (error) {
      console.error('Error toggling goal suspend:', error);
      alert('Erreur lors de la modification du statut');
    }
  };

  const handleToggleSubgoal = (subgoalId: string, checked: boolean) => {
    onToggleSubgoal(subgoalId, checked);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all relative overflow-hidden">
      {isCompleted && showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="confetti-animation">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'][i % 5],
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(
              goal.type
            )} rounded-xl flex items-center justify-center flex-shrink-0`}
          >
            {(() => {
              const Icon = getTypeIcon(goal.type);
              return <Icon className="w-6 h-6 text-white" />;
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{goal.title}</h3>
            <p className="text-sm text-gray-500">{getTypeLabel(goal.type)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSuspend}
            className={`p-2 rounded-lg transition-colors ${
              goal.status === 'on_hold'
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
            }`}
            title={goal.status === 'on_hold' ? 'Reprendre' : 'Mettre en suspend'}
          >
            {goal.status === 'on_hold' ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onEdit(goal)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {goal.description && (
        <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Progression</span>
          <span className="font-semibold text-gray-900">
            {checkedSubgoals} / {totalSubgoals} sous-objectifs
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getTypeColor(goal.type)} transition-all duration-500`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">{progress.toFixed(0)}% complété</span>
        </div>
      </div>

      {isCompleted && (
        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg animate-bounce-subtle">
          <div className="flex items-center gap-2 text-green-700">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="font-semibold">Bravo ! Objectif atteint</span>
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      )}

      {!isCompleted && totalSubgoals > 0 && (
        <div className="mb-4">
          {progress >= 75 && progress < 100 && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-700">
                Plus qu'un sous-objectif ! Vous y êtes presque 💪
              </p>
            </div>
          )}
          {progress >= 50 && progress < 75 && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-700">
                Excellent travail ! Continuez sur cette lancée 🚀
              </p>
            </div>
          )}
          {progress > 0 && progress < 50 && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-medium text-purple-700">
                Bon départ ! Chaque étape compte 🌟
              </p>
            </div>
          )}
        </div>
      )}

      {goal.subgoals && goal.subgoals.length > 0 && (
        <>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowSubgoals(!showSubgoals)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 hover:text-belleya-primary transition-colors mb-3"
            >
              <span>Sous-objectifs ({totalSubgoals})</span>
              {showSubgoals ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showSubgoals && (
              <div className="space-y-2">
                {goal.subgoals.map((subgoal) => (
                  <SubGoalItem
                    key={subgoal.id}
                    subgoal={subgoal}
                    onToggle={handleToggleSubgoal}
                    onEdit={onEditSubgoal}
                    onDelete={onDeleteSubgoal}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <button
        onClick={() => onAddSubgoal(goal.id)}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-belleya-primary hover:text-belleya-deep hover:bg-belleya-50 rounded-lg transition-colors font-medium"
      >
        <Plus className="w-4 h-4" />
        Ajouter un sous-objectif
      </button>

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100%) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400%) rotate(720deg);
            opacity: 0;
          }
        }

        .confetti {
          position: absolute;
          width: 8px;
          height: 8px;
          top: -10px;
          animation: confetti-fall 2s ease-in-out forwards;
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
