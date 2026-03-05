import { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Zap, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AffiliateKPIs {
  activeAffiliates: number;
  totalConversions: number;
  activeSubscriptions: number;
  mrrGenerated: number;
  commissionsMonth: number;
  commissionsTotal: number;
  pendingPayment: number;
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
        .select('id, status, is_active, active_referrals, active_sub_count, total_earned')
        .eq('program', 'belaya_affiliation');

      const affiliates = affiliateRows || [];
      const activeAffiliates = affiliates.filter(a => a.status === 'active').length;
      const activeSubscriptions = affiliates.reduce((s, a) => s + (a.active_sub_count || 0), 0);

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

  const cards = [
    { icon: Users, label: 'Affiliés actifs', value: kpis.activeAffiliates, color: 'rose' },
    { icon: TrendingUp, label: 'Clients convertis', value: kpis.totalConversions, color: 'emerald' },
    { icon: Zap, label: 'Abos actifs apportés', value: kpis.activeSubscriptions, color: 'blue' },
    { icon: DollarSign, label: 'MRR généré', value: `${kpis.mrrGenerated.toFixed(0)} €`, color: 'teal' },
    { icon: DollarSign, label: 'Commission du mois', value: `${kpis.commissionsMonth.toFixed(0)} €`, color: 'amber' },
    { icon: DollarSign, label: 'Commission totale', value: `${kpis.commissionsTotal.toFixed(0)} €`, color: 'green' },
    { icon: Clock, label: 'À payer ce mois', value: `${kpis.pendingPayment.toFixed(0)} €`, color: 'orange' },
  ];

  const colorMap: Record<string, string> = {
    rose: 'from-rose-50 to-pink-50 border-rose-200',
    emerald: 'from-emerald-50 to-teal-50 border-emerald-200',
    blue: 'from-blue-50 to-cyan-50 border-blue-200',
    teal: 'from-teal-50 to-cyan-50 border-teal-200',
    amber: 'from-amber-50 to-orange-50 border-amber-200',
    green: 'from-green-50 to-emerald-50 border-green-200',
    orange: 'from-orange-50 to-amber-50 border-orange-200',
  };

  const iconColorMap: Record<string, string> = {
    rose: 'text-rose-600',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    teal: 'text-teal-600',
    amber: 'text-amber-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">KPI Affiliés Belaya</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-gradient-to-br ${colorMap[card.color]} rounded-xl p-4 border`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <Icon className={`w-4 h-4 ${iconColorMap[card.color]}`} />
                </div>
                <span className="text-xs font-medium text-gray-600 leading-tight">{card.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
