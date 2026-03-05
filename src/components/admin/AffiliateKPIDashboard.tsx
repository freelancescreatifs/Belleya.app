import { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Zap, Clock, Loader2, Percent } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AffiliateKPIs {
  activeAffiliates: number;
  totalConversions: number;
  activeSubscriptions: number;
  mrrGenerated: number;
  commissionsMonth: number;
  commissionsTotal: number;
  pendingPayment: number;
  avgCommissionRate: number;
}

export default function AffiliateKPIDashboard() {
  const [kpis, setKpis] = useState<AffiliateKPIs>({
    activeAffiliates: 0,
    totalConversions: 0,
    activeSubscriptions: 0,
    mrrGenerated: 0,
    commissionsMonth: 0,
    commissionsTotal: 0,
    pendingPayment: 0,
    avgCommissionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const { data: affiliateRows } = await supabase
        .from('affiliates')
        .select('id, status, is_active, active_referrals, active_sub_count, total_earned, commission_rate')
        .eq('program', 'belaya_affiliation');

      const affiliates = affiliateRows || [];
      const activeAffiliates = affiliates.filter(a => a.status === 'active').length;
      const activeSubscriptions = affiliates.reduce((s, a) => s + (a.active_sub_count || 0), 0);

      const activeRates = affiliates.filter(a => a.status === 'active').map(a => Number(a.commission_rate || 0.10));
      const avgCommissionRate = activeRates.length > 0
        ? activeRates.reduce((s, r) => s + r, 0) / activeRates.length
        : 0;

      const affiliateIds = affiliates.map(a => a.id);

      let totalConversions = 0;
      if (affiliateIds.length > 0) {
        const { count } = await supabase
          .from('affiliate_signups')
          .select('id', { count: 'exact', head: true })
          .in('affiliate_id', affiliateIds);
        totalConversions = count || 0;
      }

      let commissionsTotal = 0;
      let commissionsMonth = 0;
      let mrrGenerated = 0;
      let pendingPayment = 0;

      if (affiliateIds.length > 0) {
        const { data: allCommissions } = await supabase
          .from('affiliate_commissions')
          .select('commission_amount, mrr, period, status')
          .in('affiliate_id', affiliateIds);

        const commissions = allCommissions || [];

        commissionsTotal = commissions.reduce(
          (sum, c) => sum + Number(c.commission_amount || 0), 0
        );

        commissionsMonth = commissions
          .filter(c => c.period === currentMonth)
          .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

        mrrGenerated = commissions.reduce(
          (sum, c) => sum + Number(c.mrr || 0), 0
        );

        pendingPayment = commissions
          .filter(c => c.period === currentMonth && c.status !== 'paid')
          .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
      }

      setKpis({
        activeAffiliates,
        totalConversions,
        activeSubscriptions,
        mrrGenerated,
        commissionsMonth,
        commissionsTotal,
        pendingPayment,
        avgCommissionRate,
      });
    } catch (err) {
      console.error('Error loading affiliate KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-900">KPI Affilies Belaya</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PrimaryKPICard
          icon={Users}
          label="Affilies actifs"
          value={String(kpis.activeAffiliates)}
          gradient="from-rose-50 to-pink-50"
          border="border-rose-200"
          iconColor="text-rose-600"
          iconBg="bg-rose-100"
        />
        <PrimaryKPICard
          icon={TrendingUp}
          label="Clients convertis"
          value={String(kpis.totalConversions)}
          gradient="from-emerald-50 to-teal-50"
          border="border-emerald-200"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100"
        />
        <PrimaryKPICard
          icon={Zap}
          label="Abos actifs apportes"
          value={String(kpis.activeSubscriptions)}
          gradient="from-blue-50 to-cyan-50"
          border="border-blue-200"
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <PrimaryKPICard
          icon={DollarSign}
          label="MRR genere"
          value={`${kpis.mrrGenerated.toFixed(0)} EUR`}
          gradient="from-teal-50 to-cyan-50"
          border="border-teal-200"
          iconColor="text-teal-600"
          iconBg="bg-teal-100"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SecondaryKPICard
          icon={DollarSign}
          label="Commission du mois"
          value={`${kpis.commissionsMonth.toFixed(0)} EUR`}
          iconColor="text-amber-600"
        />
        <SecondaryKPICard
          icon={DollarSign}
          label="Commission totale"
          value={`${kpis.commissionsTotal.toFixed(0)} EUR`}
          iconColor="text-green-600"
        />
        <SecondaryKPICard
          icon={Clock}
          label="A payer ce mois"
          value={`${kpis.pendingPayment.toFixed(0)} EUR`}
          iconColor="text-orange-600"
        />
        <SecondaryKPICard
          icon={Percent}
          label="Commission moy."
          value={`${(kpis.avgCommissionRate * 100).toFixed(0)}%`}
          iconColor="text-gray-600"
        />
      </div>
    </div>
  );
}

function PrimaryKPICard({ icon: Icon, label, value, gradient, border, iconColor, iconBg }: {
  icon: React.ElementType;
  label: string;
  value: string;
  gradient: string;
  border: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-5 border ${border}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function SecondaryKPICard({ icon: Icon, label, value, iconColor }: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
