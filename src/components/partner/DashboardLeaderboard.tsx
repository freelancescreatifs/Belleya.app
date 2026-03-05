import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, TrendingUp, Loader2 } from 'lucide-react';
import { formatEUR } from '../../lib/affiliateUtils';

interface LeaderEntry {
  affiliate_id: string;
  full_name: string;
  count: number;
  amount: number;
}

export default function DashboardLeaderboard() {
  const [todayBoard, setTodayBoard] = useState<LeaderEntry[]>([]);
  const [monthBoard, setMonthBoard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const load = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [signupsToday, commissionsMonth] = await Promise.all([
        supabase
          .from('affiliate_signups')
          .select('affiliate_id, affiliates(full_name)')
          .gte('created_at', todayStart),
        supabase
          .from('affiliate_commissions')
          .select('affiliate_id, commission_amount, affiliates(full_name)')
          .eq('period', currentMonth),
      ]);

      const todayMap = new Map<string, { name: string; count: number }>();
      (signupsToday.data || []).forEach((s: any) => {
        const existing = todayMap.get(s.affiliate_id);
        const name = s.affiliates?.full_name || 'Anonyme';
        if (existing) {
          existing.count++;
        } else {
          todayMap.set(s.affiliate_id, { name, count: 1 });
        }
      });

      setTodayBoard(
        Array.from(todayMap.entries())
          .map(([id, val]) => ({ affiliate_id: id, full_name: val.name, count: val.count, amount: 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      );

      const monthMap = new Map<string, { name: string; amount: number }>();
      (commissionsMonth.data || []).forEach((c: any) => {
        const existing = monthMap.get(c.affiliate_id);
        const name = c.affiliates?.full_name || 'Anonyme';
        const amt = Number(c.commission_amount || 0);
        if (existing) {
          existing.amount += amt;
        } else {
          monthMap.set(c.affiliate_id, { name, amount: amt });
        }
      });

      setMonthBoard(
        Array.from(monthMap.entries())
          .map(([id, val]) => ({ affiliate_id: id, full_name: val.name, count: 0, amount: val.amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10)
      );
    } catch (err) {
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <LeaderboardCard
        title="Top inscriptions du jour"
        icon={<Trophy className="w-5 h-5 text-amber-600" />}
        entries={todayBoard}
        valueLabel="inscriptions"
        renderValue={(e) => `${e.count} inscr.`}
        emptyText="Aucune inscription aujourd'hui"
        headerBg="bg-gradient-to-r from-amber-50 to-orange-50"
      />
      <LeaderboardCard
        title="Top commissions du mois"
        icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        entries={monthBoard}
        valueLabel="commission"
        renderValue={(e) => formatEUR(e.amount)}
        emptyText="Aucune commission ce mois"
        headerBg="bg-gradient-to-r from-emerald-50 to-teal-50"
      />
    </div>
  );
}

function LeaderboardCard({
  title, icon, entries, renderValue, emptyText, headerBg,
}: {
  title: string;
  icon: React.ReactNode;
  entries: LeaderEntry[];
  valueLabel: string;
  renderValue: (e: LeaderEntry) => string;
  emptyText: string;
  headerBg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className={`${headerBg} px-5 py-4 border-b border-gray-100`}>
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">{emptyText}</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {entries.map((entry, idx) => (
            <div key={entry.affiliate_id} className="flex items-center gap-3 px-5 py-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                idx === 0 ? 'bg-amber-100 text-amber-700' :
                idx === 1 ? 'bg-gray-200 text-gray-700' :
                idx === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {idx + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-900 truncate">{entry.full_name}</span>
              <span className="text-sm font-semibold text-gray-700 shrink-0">{renderValue(entry)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
