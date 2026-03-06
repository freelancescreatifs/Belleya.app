import { useState, useMemo } from 'react';
import {
  Users, Clock, CheckCircle, TrendingUp, DollarSign, Zap, CalendarDays, Info
} from 'lucide-react';

interface AffiliateLead {
  id: string;
  first_name: string | null;
  computed_status: 'trialing' | 'active' | 'expired' | 'canceled';
  days_left: number;
  mrr: number;
  commission: number;
  created_at: string;
  subscription_start_date: string | null;
}

interface AffiliateCommission {
  id: string;
  period: string;
  commission_amount: number;
  mrr: number;
  status: string;
  created_at: string;
}

type Period = 'day' | 'month' | 'year';

interface DashboardStatsProps {
  leads: AffiliateLead[];
  commissions: AffiliateCommission[];
  commissionRate: number;
  totalEarned: number;
}

function isInPeriod(dateStr: string, period: Period): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  switch (period) {
    case 'day':
      return d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
    case 'month':
      return d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
    case 'year':
      return d.getFullYear() === now.getFullYear();
  }
}

function Tooltip({ text }: { text: string }) {
  return (
    <div className="relative group/tip inline-flex ml-1">
      <Info className="w-3 h-3 text-gray-400 cursor-help" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 bg-gray-900 text-white text-[10px] rounded-lg p-2 shadow-lg opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:pointer-events-auto transition-opacity z-20 leading-relaxed">
        {text}
        <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 w-2 h-2 bg-gray-900 rotate-45" />
      </div>
    </div>
  );
}

export default function DashboardStats({ leads, commissions, commissionRate, totalEarned }: DashboardStatsProps) {
  const [period, setPeriod] = useState<Period>('month');

  const stats = useMemo(() => {
    const filteredLeads = leads.filter(l => isInPeriod(l.created_at, period));
    const totalSignups = filteredLeads.length;
    const trialing = filteredLeads.filter(l => l.computed_status === 'trialing').length;
    const paidConversions = filteredLeads.filter(l => l.computed_status === 'active').length;
    const conversionRate = totalSignups > 0 ? Math.round((paidConversions / totalSignups) * 100) : 0;
    const mrr = filteredLeads
      .filter(l => l.computed_status === 'active')
      .reduce((sum, l) => sum + Number(l.mrr || 0), 0);
    const estimatedCommission = mrr * (commissionRate / 100);

    return { totalSignups, trialing, paidConversions, conversionRate, mrr, estimatedCommission };
  }, [leads, period, commissionRate]);

  const periods: { key: Period; label: string }[] = [
    { key: 'day', label: 'Jour' },
    { key: 'month', label: 'Mois' },
    { key: 'year', label: 'Annee' },
  ];

  const kpis = [
    { icon: Users, label: 'Essais gratuits', value: String(stats.totalSignups), color: 'text-blue-600', bg: 'bg-blue-50', tooltip: 'Personnes inscrites en essai gratuit via ton lien' },
    { icon: Clock, label: 'Essais en cours', value: String(stats.trialing), color: 'text-amber-600', bg: 'bg-amber-50', tooltip: 'Personnes actuellement en periode d\'essai' },
    { icon: CheckCircle, label: 'Clients abonnes', value: String(stats.paidConversions), color: 'text-emerald-600', bg: 'bg-emerald-50', tooltip: 'Personnes ayant pris un abonnement payant actif' },
    { icon: TrendingUp, label: 'Taux de conversion', value: `${stats.conversionRate}%`, color: 'text-teal-600', bg: 'bg-teal-50', tooltip: 'Pourcentage d\'inscrits devenus clients payants' },
    { icon: DollarSign, label: 'MRR genere', value: `${stats.mrr.toFixed(0)} EUR`, color: 'text-emerald-700', bg: 'bg-emerald-50', tooltip: 'Revenus mensuels recurrents generes par tes filleuls' },
    { icon: Zap, label: 'Commission estimee', value: `${stats.estimatedCommission.toFixed(2)} EUR`, color: 'text-blue-700', bg: 'bg-blue-50', tooltip: 'Ta commission estimee sur le MRR genere' },
    { icon: DollarSign, label: 'Total gagne', value: `${totalEarned.toFixed(2)} EUR`, color: 'text-gray-900', bg: 'bg-gray-100', tooltip: 'Total de toutes tes commissions recues' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Performance</h3>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === p.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`w-3.5 h-3.5 ${kpi.color}`} />
              </div>
              {kpi.tooltip && <Tooltip text={kpi.tooltip} />}
            </div>
            <p className="text-[11px] text-gray-500 mb-0.5 leading-tight">{kpi.label}</p>
            <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
