import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, TrendingUp, Users, Loader as Loader2, User } from 'lucide-react';
import { formatEUR } from '../../lib/affiliateUtils';

interface LeaderEntry {
  affiliate_id: string;
  full_name: string;
  avatar_url: string | null;
  count: number;
  amount: number;
}

export default function DashboardLeaderboard() {
  const [todayBoard, setTodayBoard] = useState<LeaderEntry[]>([]);
  const [monthBoard, setMonthBoard] = useState<LeaderEntry[]>([]);
  const [subsBoard, setSubsBoard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'signups' | 'commissions'>('leads');
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const load = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [signupsToday, commissionsMonth, allAffiliates] = await Promise.all([
        supabase
          .from('affiliate_signups')
          .select('affiliate_id, affiliates(full_name, avatar_url)')
          .gte('created_at', todayStart),
        supabase
          .from('affiliate_commissions')
          .select('affiliate_id, commission_amount, affiliates(full_name, avatar_url)')
          .eq('period', currentMonth),
        supabase
          .from('affiliates')
          .select('id, full_name, avatar_url, active_sub_count')
          .eq('status', 'active')
          .order('active_sub_count', { ascending: false })
          .limit(10),
      ]);

      const todayMap = new Map<string, { name: string; avatar: string | null; count: number }>();
      (signupsToday.data || []).forEach((s: any) => {
        const existing = todayMap.get(s.affiliate_id);
        const name = s.affiliates?.full_name || 'Anonyme';
        const avatar = s.affiliates?.avatar_url || null;
        if (existing) {
          existing.count++;
        } else {
          todayMap.set(s.affiliate_id, { name, avatar, count: 1 });
        }
      });

      setTodayBoard(
        Array.from(todayMap.entries())
          .map(([id, val]) => ({ affiliate_id: id, full_name: val.name, avatar_url: val.avatar, count: val.count, amount: 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      );

      const monthMap = new Map<string, { name: string; avatar: string | null; amount: number }>();
      (commissionsMonth.data || []).forEach((c: any) => {
        const existing = monthMap.get(c.affiliate_id);
        const name = c.affiliates?.full_name || 'Anonyme';
        const avatar = c.affiliates?.avatar_url || null;
        const amt = Number(c.commission_amount || 0);
        if (existing) {
          existing.amount += amt;
        } else {
          monthMap.set(c.affiliate_id, { name, avatar, amount: amt });
        }
      });

      setMonthBoard(
        Array.from(monthMap.entries())
          .map(([id, val]) => ({ affiliate_id: id, full_name: val.name, avatar_url: val.avatar, count: 0, amount: val.amount }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10)
      );

      setSubsBoard(
        (allAffiliates.data || []).map((a: any) => ({
          affiliate_id: a.id,
          full_name: a.full_name || 'Anonyme',
          avatar_url: a.avatar_url || null,
          count: a.active_sub_count || 0,
          amount: 0,
        }))
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

  const tabs = [
    { key: 'leads' as const, label: 'Leads ajoutes', icon: Users },
    { key: 'signups' as const, label: 'Clients abonnes', icon: TrendingUp },
    { key: 'commissions' as const, label: 'Commissions', icon: Trophy },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-100 px-4 py-3 flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key ? 'bg-belaya-50 text-belaya-deep' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'leads' && (
        <HorizontalBarBoard
          entries={subsBoard}
          getValue={e => e.count}
          formatValue={e => `${e.count} abonnes`}
          emptyText="Aucune donnee"
          color="#3B82F6"
        />
      )}
      {activeTab === 'signups' && (
        <HorizontalBarBoard
          entries={todayBoard}
          getValue={e => e.count}
          formatValue={e => `${e.count} inscr.`}
          emptyText="Aucune inscription aujourd'hui"
          color="#10B981"
        />
      )}
      {activeTab === 'commissions' && (
        <HorizontalBarBoard
          entries={monthBoard}
          getValue={e => e.amount}
          formatValue={e => formatEUR(e.amount)}
          emptyText="Aucune commission ce mois"
          color="#F59E0B"
        />
      )}
    </div>
  );
}

function HorizontalBarBoard({
  entries, getValue, formatValue, emptyText, color,
}: {
  entries: LeaderEntry[];
  getValue: (e: LeaderEntry) => number;
  formatValue: (e: LeaderEntry) => string;
  emptyText: string;
  color: string;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">{emptyText}</p>;
  }

  const maxVal = Math.max(...entries.map(getValue), 1);

  return (
    <div className="p-4 space-y-3">
      {entries.map((entry, idx) => {
        const val = getValue(entry);
        const barPct = Math.max(5, (val / maxVal) * 100);

        return (
          <div key={entry.affiliate_id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 relative">
              {entry.avatar_url ? (
                <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              )}
              {idx < 3 && (
                <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${
                  idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'
                }`}>
                  {idx + 1}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900 w-24 truncate">{entry.full_name}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${barPct}%`, backgroundColor: color }}
              >
                {val > 0 && (
                  <span className="text-[10px] font-semibold text-white whitespace-nowrap">
                    {formatValue(entry)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
