import { Users, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';

interface KPICardsProps {
  activeSubs: number;
  mrr: number;
  currentCommission: number;
  totalSignups: number;
}

export default function KPICards({ activeSubs, mrr, currentCommission, totalSignups }: KPICardsProps) {
  const cards = [
    {
      label: 'Abonnes actifs',
      value: activeSubs.toString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'MRR genere',
      value: `${mrr.toFixed(2)} EUR`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Commission du mois',
      value: `${currentCommission.toFixed(2)} EUR`,
      icon: TrendingUp,
      color: 'text-[#d9629b]',
      bg: 'bg-pink-50',
    },
    {
      label: 'Inscriptions totales',
      value: totalSignups.toString(),
      icon: BarChart3,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((kpi, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
          <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
        </div>
      ))}
    </div>
  );
}
