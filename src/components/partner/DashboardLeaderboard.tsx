import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, Loader as Loader2, User, Gift, Crown } from 'lucide-react';

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

export default function DashboardLeaderboard() {
  const [todayTop, setTodayTop] = useState<LeaderEntry[]>([]);
  const [monthTop, setMonthTop] = useState<LeaderEntry[]>([]);
  const [allTop, setAllTop] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const load = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [todayRes, monthRes, allRes] = await Promise.all([
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
        supabase
          .from('affiliates')
          .select('id, full_name, avatar_url, active_sub_count')
          .eq('status', 'active')
          .gt('active_sub_count', 0)
          .order('active_sub_count', { ascending: false })
          .limit(10),
      ]);

      setTodayTop(aggregateEntries(todayRes.data || []));
      setMonthTop(aggregateEntries(monthRes.data || []));

      setAllTop(
        (allRes.data || []).map((a: any) => ({
          affiliate_id: a.id,
          full_name: a.full_name || 'Anonyme',
          avatar_url: a.avatar_url || null,
          conversions: a.active_sub_count || 0,
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

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <Top3Card title="Top du jour" entries={todayTop.slice(0, 3)} />
        <Top3Card title="Top du mois" entries={monthTop.slice(0, 3)} />
      </div>

      {allTop.length > 0 && <ConversionBarChart entries={allTop} />}

      <ChallengeCard />
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

function ConversionBarChart({ entries }: { entries: LeaderEntry[] }) {
  const maxVal = Math.max(...entries.map(e => e.conversions), 1);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const barWidth = 60;
  const gap = 16;
  const avatarSize = 32;
  const chartHeight = 200;
  const topPadding = 30;
  const bottomPadding = 50;
  const barArea = chartHeight - topPadding - bottomPadding;
  const totalWidth = entries.length * (barWidth + gap) - gap + 40;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-4 h-4 text-amber-500" />
        <h4 className="font-semibold text-sm text-gray-900">Top conversions (clients abonnes)</h4>
      </div>
      <div className="overflow-x-auto pb-2">
        <svg width={totalWidth} height={chartHeight} className="mx-auto block">
          {entries.map((entry, i) => {
            const x = 20 + i * (barWidth + gap);
            const barH = Math.max(4, (entry.conversions / maxVal) * barArea);
            const barY = topPadding + barArea - barH;
            const isHovered = hoveredIdx === i;
            const colors = ['#F59E0B', '#9CA3AF', '#F97316', '#3B82F6', '#10B981', '#06B6D4', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];
            const color = colors[i % colors.length];

            return (
              <g
                key={entry.affiliate_id}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={x + 4}
                  y={barY}
                  width={barWidth - 8}
                  height={barH}
                  rx={6}
                  fill={color}
                  opacity={isHovered ? 1 : 0.8}
                  className="transition-opacity duration-150"
                />
                {entry.conversions > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={barY - 8}
                    textAnchor="middle"
                    className="text-xs font-bold"
                    fill="#374151"
                  >
                    {entry.conversions}
                  </text>
                )}

                <clipPath id={`avatar-clip-${i}`}>
                  <circle cx={x + barWidth / 2} cy={chartHeight - bottomPadding + 20} r={avatarSize / 2} />
                </clipPath>
                <circle
                  cx={x + barWidth / 2}
                  cy={chartHeight - bottomPadding + 20}
                  r={avatarSize / 2 + 1}
                  fill="#E5E7EB"
                />
                {entry.avatar_url ? (
                  <image
                    href={entry.avatar_url}
                    x={x + barWidth / 2 - avatarSize / 2}
                    y={chartHeight - bottomPadding + 20 - avatarSize / 2}
                    width={avatarSize}
                    height={avatarSize}
                    clipPath={`url(#avatar-clip-${i})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                ) : (
                  <>
                    <circle
                      cx={x + barWidth / 2}
                      cy={chartHeight - bottomPadding + 20}
                      r={avatarSize / 2}
                      fill="#F3F4F6"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight - bottomPadding + 24}
                      textAnchor="middle"
                      className="text-[10px] font-bold"
                      fill="#9CA3AF"
                    >
                      {getInitials(entry.full_name)}
                    </text>
                  </>
                )}

                {isHovered && (
                  <g>
                    <rect
                      x={x + barWidth / 2 - 60}
                      y={barY - 48}
                      width={120}
                      height={36}
                      rx={6}
                      fill="#1F2937"
                      opacity={0.95}
                    />
                    <text
                      x={x + barWidth / 2}
                      y={barY - 34}
                      textAnchor="middle"
                      fill="white"
                      className="text-[10px] font-medium"
                    >
                      {entry.full_name}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={barY - 20}
                      textAnchor="middle"
                      fill="#D1D5DB"
                      className="text-[9px]"
                    >
                      {entry.conversions} conversion{entry.conversions !== 1 ? 's' : ''}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
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
    </div>
  );
}
