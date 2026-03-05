import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Users, DollarSign, Zap, Loader2 } from 'lucide-react';
import { formatEUR } from '../../lib/affiliateUtils';

interface Stats {
  totalSignups: number;
  signups30d: number;
  activeSubs: number;
  mrrGenerated: number;
  commissionMonth: number;
  commissionTotal: number;
}

export default function DashboardStats({ affiliateId }: { affiliateId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [affiliateId]);

  const loadStats = async () => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [totalRes, monthRes, commissionsRes, commissionsMonthRes] = await Promise.all([
        supabase.from('affiliate_signups').select('id', { count: 'exact', head: true }).eq('affiliate_id', affiliateId),
        supabase.from('affiliate_signups').select('id', { count: 'exact', head: true }).eq('affiliate_id', affiliateId).gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('affiliate_commissions').select('commission_amount, mrr').eq('affiliate_id', affiliateId),
        supabase.from('affiliate_commissions').select('commission_amount').eq('affiliate_id', affiliateId).eq('period', currentMonth),
      ]);

      const commTotal = (commissionsRes.data || []).reduce((s, c) => s + Number(c.commission_amount || 0), 0);
      const mrrTotal = (commissionsRes.data || []).reduce((s, c) => s + Number(c.mrr || 0), 0);
      const commMonth = (commissionsMonthRes.data || []).reduce((s, c) => s + Number(c.commission_amount || 0), 0);

      const { count: activeSubsCount } = await supabase
        .from('affiliate_signups')
        .select('id', { count: 'exact', head: true })
        .eq('affiliate_id', affiliateId)
        .eq('subscription_status', 'active');

      setStats({
        totalSignups: totalRes.count || 0,
        signups30d: monthRes.count || 0,
        activeSubs: activeSubsCount || 0,
        mrrGenerated: mrrTotal,
        commissionMonth: commMonth,
        commissionTotal: commTotal,
      });
    } catch (err) {
      console.error('Stats load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'Conversions totales', value: stats.totalSignups, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Conversions 30j', value: stats.signups30d, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Abos actifs', value: stats.activeSubs, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'MRR genere', value: formatEUR(stats.mrrGenerated), icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Commission ce mois', value: formatEUR(stats.commissionMonth), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Commission totale', value: formatEUR(stats.commissionTotal), icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-0.5">{card.label}</p>
          <p className="text-lg font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
