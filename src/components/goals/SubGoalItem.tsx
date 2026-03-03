import { useState } from 'react';
import { Pencil, Trash2, Calendar, Check } from 'lucide-react';

interface SubGoal {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  checked: boolean;
  parent_goal_id: string;
}

interface SubGoalItemProps {
  subgoal: SubGoal;
  onToggle: (id: string, checked: boolean) => void;
  onEdit: (subgoal: SubGoal) => void;
  onDelete: (id: string) => void;
}

export default function SubGoalItem({ subgoal, onToggle, onEdit, onDelete }: SubGoalItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Voulez-vous vraiment supprimer ce sous-objectif ?')) {
      onDelete(subgoal.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(subgoal);
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
        subgoal.checked ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => onToggle(subgoal.id, !subgoal.checked)}
        className={`flex-shrink-0 w-5 h-5 border-2 rounded transition-all ${
          subgoal.checked
            ? 'bg-belaya-vivid border-belaya-500'
            : 'border-gray-300 hover:border-belaya-400'
        } flex items-center justify-center`}
      >
        {subgoal.checked && <Check className="w-3.5 h-3.5 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium transition-all ${
            subgoal.checked
              ? 'line-through text-gray-500'
              : 'text-gray-900'
          }`}
        >
          {subgoal.title}
        </p>
        {(subgoal.start_date || subgoal.end_date) && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <Calendar className="w-3 h-3" />
            <span>
              {subgoal.start_date && subgoal.end_date ? (
                <>
                  du {new Date(subgoal.start_date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                  })} au {new Date(subgoal.end_date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </>
              ) : subgoal.start_date ? (
                new Date(subgoal.start_date).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              ) : (
                new Date(subgoal.end_date!).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              )}
            </span>
          </div>
        )}
      </div>

      {isHovered && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleEdit}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Modifier"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
