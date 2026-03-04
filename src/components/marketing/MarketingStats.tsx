import { TrendingUp, Clock, Cake, DollarSign, Users } from 'lucide-react';
import InfoTooltip from '../shared/InfoTooltip';

interface MarketingStatsProps {
  clientsToRemind: number;
  clientsLate: number;
  upcomingBirthdays: number;
  returnRate: number;
  potentialRevenue: number;
}

export default function MarketingStats({
  clientsToRemind,
  clientsLate,
  upcomingBirthdays,
  returnRate,
  potentialRevenue
}: MarketingStatsProps) {
  const stats = [
    {
      label: 'Clientes à relancer',
      value: clientsToRemind,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      tooltip: 'Clientes dont la date de retour estimée est atteinte ou imminente, calculée à partir du dernier rendez-vous + la fréquence recommandée de la prestation.'
    },
    {
      label: 'En retard de RDV',
      value: clientsLate,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      tooltip: 'Clientes qui ont dépassé leur date de retour recommandée. La date de retour est calculée à partir de : dernier rendez-vous + fréquence recommandée de la prestation.'
    },
    {
      label: 'Anniversaires 30j',
      value: upcomingBirthdays,
      icon: Cake,
      color: 'text-belaya-primary',
      bgColor: 'bg-belaya-50',
      tooltip: 'Clientes dont l\'anniversaire est dans les 30 prochains jours (le calcul se fait sur le jour et le mois, l\'année est ignorée).'
    },
    {
      label: 'Taux de retour',
      value: `${returnRate}%`,
      icon: TrendingUp,
      color: 'text-belaya-bright',
      bgColor: 'bg-green-50',
      tooltip: 'Estimation basée sur le ratio de clientes actives vs inactives. Une cliente est considérée active si elle n\'est pas en retard de plus de 90 jours.'
    },
    {
      label: 'CA potentiel',
      value: `${potentialRevenue.toFixed(0)} €`,
      icon: DollarSign,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      tooltip: 'Estimation du chiffre d\'affaires récupérable si les clientes relancées reviennent. Calcul : clientes relançables × panier moyen.'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <InfoTooltip content={stat.tooltip} />
            </div>
            <div className={`${stat.bgColor} p-3 rounded-lg`}>
              <stat.icon className={`${stat.color} w-6 h-6`} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
