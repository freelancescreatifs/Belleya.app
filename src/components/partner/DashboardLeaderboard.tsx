import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, Loader as Loader2, Gift } from 'lucide-react';

interface LeaderEntry {
  affiliate_id: string;
  full_name: string;
  avatar_url: string | null;
  conversions: number;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}

function AvatarCircle({ url, name, size = 'md' }: { url: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-base',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center`}>
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-gray-500">{getInitials(name)}</span>
      )}
    </div>
  );
}

function aggregateEntries(data: any[]): LeaderEntry[] {
  const map = new Map<string, LeaderEntry>();
  data.forEach((s: any) => {
    const existing = map.get(s.affiliate_id);
    if (existing) {
      existing.conversions++;
    } else {
      map.set(s.affiliate_id, {
        affiliate_id: s.affiliate_id,
        full_name: s.affiliates?.full_name || 'Anonyme',
        avatar_url: s.affiliates?.avatar_url || null,
        conversions: 1,
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.conversions - a.conversions);
}

function Top3Card({ title, entries }: { title: string; entries: LeaderEntry[] }) {
  const medals = [
    { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', label: '1er' },
    { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-400', label: '2e' },
    { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-400', label: '3e' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
      </div>
      <div className="p-4">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Pas encore de donnees</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => {
              const medal = medals[i];
              return (
                <div key={entry.affiliate_id} className={`flex items-center gap-3 ${medal.bg} ${medal.border} border rounded-xl p-3`}>
                  <div className="relative">
                    <AvatarCircle url={entry.avatar_url} name={entry.full_name} size="md" />
                    <div className={`absolute -top-1 -right-1 w-5 h-5 ${medal.badge} rounded-full flex items-center justify-center`}>
                      <span className="text-[9px] font-bold text-white">{medal.label}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{entry.full_name}</p>
                    <p className="text-xs text-gray-500">{entry.conversions} conversion{entry.conversions !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ChallengeCard() {
  const prizes = [
    { rank: '1er', amount: '300 EUR', color: 'from-amber-400 to-amber-500', shadow: 'shadow-amber-200' },
    { rank: '2e', amount: '150 EUR', color: 'from-gray-300 to-gray-400', shadow: 'shadow-gray-200' },
    { rank: '3e', amount: '75 EUR', color: 'from-orange-300 to-orange-400', shadow: 'shadow-orange-200' },
  ];

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-5 h-5 text-amber-600" />
        <h4 className="font-bold text-gray-900">Challenge mensuel -- Top 3</h4>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Chaque mois, les 3 meilleurs affilies sont recompenses :
      </p>
      <div className="grid grid-cols-3 gap-3">
        {prizes.map(prize => (
          <div key={prize.rank} className={`bg-white rounded-xl p-4 text-center border border-gray-100 ${prize.shadow} shadow-sm`}>
            <div className={`w-10 h-10 mx-auto rounded-full bg-gradient-to-br ${prize.color} flex items-center justify-center mb-2`}>
              <span className="text-white font-bold text-sm">{prize.rank}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{prize.amount}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        Le classement est base uniquement sur le nombre de clients abonnes convertis.
      </p>
    </div>
  );
}

export default function DashboardLeaderboard({ section }: { section?: 'tops' | 'challenge' | 'all' }) {
  const [todayTop, setTodayTop] = useState<LeaderEntry[]>([]);
  const [monthTop, setMonthTop] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const load = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [todayRes, monthRes] = await Promise.all([
        supabase
          .from('affiliate_signups')
          .select('affiliate_id, affiliates(full_name, avatar_url)')
          .gte('created_at', todayStart)
          .eq('subscription_status', 'active'),
        supabase
          .from('affiliate_signups')
          .select('affiliate_id, affiliates(full_name, avatar_url)')
          .gte('created_at', monthStart)
          .eq('subscription_status', 'active'),
      ]);

      setTodayTop(aggregateEntries(todayRes.data || []));
      setMonthTop(aggregateEntries(monthRes.data || []));
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

  const renderSection = section || 'all';

  if (renderSection === 'tops') {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        <Top3Card title="Top du jour" entries={todayTop.slice(0, 3)} />
        <Top3Card title="Top du mois" entries={monthTop.slice(0, 3)} />
      </div>
    );
  }

  if (renderSection === 'challenge') {
    return <ChallengeCard />;
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Top3Card title="Top du jour" entries={todayTop.slice(0, 3)} />
        <Top3Card title="Top du mois" entries={monthTop.slice(0, 3)} />
      </div>
      <ChallengeCard />
    </div>
  );
}
