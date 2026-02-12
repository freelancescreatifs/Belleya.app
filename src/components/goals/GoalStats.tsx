import { TrendingUp, Target, Play, Pause, CheckCircle2 } from 'lucide-react';

interface Goal {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'achieved';
  created_at: string;
  updated_at?: string;
}

interface GoalStatsProps {
  goals: Goal[];
}

export default function GoalStats({ goals }: GoalStatsProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const achievedThisYear = goals.filter(g => {
    if (g.status !== 'achieved') return false;
    const goalDate = new Date(g.updated_at || g.created_at);
    return goalDate.getFullYear() === currentYear;
  }).length;

  const achievedThisMonth = goals.filter(g => {
    if (g.status !== 'achieved') return false;
    const goalDate = new Date(g.updated_at || g.created_at);
    return goalDate.getFullYear() === currentYear && goalDate.getMonth() === currentMonth;
  }).length;

  const inProgress = goals.filter(g => g.status === 'in_progress').length;
  const onHold = goals.filter(g => g.status === 'on_hold').length;
  const totalGoals = goals.length;
  const achievedTotal = goals.filter(g => g.status === 'achieved').length;
  const completionRate = totalGoals > 0 ? Math.round((achievedTotal / totalGoals) * 100) : 0;

  const stats = [
    {
      label: 'Atteints cette année',
      value: achievedThisYear,
      icon: CheckCircle2,
      color: 'from-belleya-bright to-belleya-deep',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      label: 'Atteints ce mois-ci',
      value: achievedThisMonth,
      icon: Target,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'En cours',
      value: inProgress,
      icon: Play,
      color: 'from-orange-500 to-amber-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
    {
      label: 'Suspendus',
      value: onHold,
      icon: Pause,
      color: 'from-gray-500 to-slate-600',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`${stat.bgColor} rounded-2xl p-5 border border-gray-200 hover:shadow-lg transition-all`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className={`text-sm font-medium ${stat.textColor}`}>{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
