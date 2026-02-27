import { useState } from 'react';
import { Target } from 'lucide-react';

interface MonthlyGoalCardProps {
  totalSignups: number;
}

export default function MonthlyGoalCard({ totalSignups }: MonthlyGoalCardProps) {
  const [goal, setGoal] = useState(10);
  const progress = Math.min((totalSignups / goal) * 100, 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#d9629b]" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Objectif mensuel</h3>
            <p className="text-sm text-gray-500">{totalSignups} / {goal} inscriptions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGoal(Math.max(1, goal - 5))}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
            -
          </button>
          <span className="text-sm font-bold text-gray-900 w-8 text-center">{goal}</span>
          <button
            onClick={() => setGoal(goal + 5)}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
            +
          </button>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#efaa9a] to-[#d9629b] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          {progress >= 100 ? 'Objectif atteint !' : `${(goal - totalSignups)} inscriptions restantes`}
        </p>
        <p className="text-xs text-gray-500 font-semibold">{progress.toFixed(0)}%</p>
      </div>
    </div>
  );
}
