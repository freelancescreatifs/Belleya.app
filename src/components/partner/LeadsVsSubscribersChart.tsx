import { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart3, Loader2, Users, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Period = 'day' | 'month' | 'year';
type ActiveTab = 'leads' | 'subscribers';

interface AffiliateEntry {
  affiliate_id: string;
  full_name: string;
  avatar_url: string | null;
  leads_count: number;
  subscribers_count: number;
}

interface LeadsVsSubscribersChartProps {
  scopeAffiliateId?: string;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}

function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start: Date;

  switch (period) {
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
  }

  return { start, end };
}

export default function LeadsVsSubscribersChart({ scopeAffiliateId }: LeadsVsSubscribersChartProps) {
  const [period, setPeriod] = useState<Period>('month');
  const [activeTab, setActiveTab] = useState<ActiveTab>('leads');
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<AffiliateEntry[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { start } = getPeriodRange(period);
      const startISO = start.toISOString();

      let affiliateQuery = supabase
        .from('affiliates')
        .select('id, full_name, avatar_url')
        .eq('status', 'active')
        .is('deleted_at', null);

      if (scopeAffiliateId) {
        affiliateQuery = affiliateQuery.eq('id', scopeAffiliateId);
      }

      const [affRes, allSignupsRes] = await Promise.all([
        affiliateQuery,
        supabase
          .from('affiliate_signups')
          .select('id, affiliate_id, subscription_status, created_at')
          .gte('created_at', startISO),
      ]);

      const affiliates = affRes.data || [];
      const allSignups = allSignupsRes.data || [];

      const leadsMap = new Map<string, number>();
      const subsMap = new Map<string, number>();
      allSignups.forEach((s: any) => {
        leadsMap.set(s.affiliate_id, (leadsMap.get(s.affiliate_id) || 0) + 1);
        if (s.subscription_status === 'active') {
          subsMap.set(s.affiliate_id, (subsMap.get(s.affiliate_id) || 0) + 1);
        }
      });

      const result: AffiliateEntry[] = affiliates
        .map((a: any) => ({
          affiliate_id: a.id,
          full_name: a.full_name || 'Anonyme',
          avatar_url: a.avatar_url || null,
          leads_count: leadsMap.get(a.id) || 0,
          subscribers_count: subsMap.get(a.id) || 0,
        }))
        .filter((e: AffiliateEntry) => e.leads_count > 0 || e.subscribers_count > 0)
        .sort((a: AffiliateEntry, b: AffiliateEntry) => (b.leads_count + b.subscribers_count) - (a.leads_count + a.subscribers_count))
        .slice(0, 12);

      setEntries(result);
    } catch (err) {
      console.error('LeadsVsSubscribers load error:', err);
    } finally {
      setLoading(false);
    }
  }, [period, scopeAffiliateId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const periods: { key: Period; label: string }[] = [
    { key: 'day', label: 'Jour' },
    { key: 'month', label: 'Mois' },
    { key: 'year', label: 'Annee' },
  ];

  const periodLabel = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'day': return now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      case 'month': return now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      case 'year': return String(now.getFullYear());
    }
  }, [period]);

  const tabConfig = {
    leads: { label: 'Leads ajoutes', icon: Users, color: '#3B82F6', tailwind: 'blue' },
    subscribers: { label: 'Clients abonnes', icon: UserCheck, color: '#10B981', tailwind: 'emerald' },
  };

  const currentTab = tabConfig[activeTab];

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (activeTab === 'leads') return b.leads_count - a.leads_count;
      return b.subscribers_count - a.subscribers_count;
    });
  }, [entries, activeTab]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-5 pb-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Performance des affilies</h3>
          </div>
          <PeriodToggle periods={periods} active={period} onChange={setPeriod} />
        </div>
        <p className="text-xs text-gray-400 mb-4">{periodLabel}</p>
      </div>

      <div className="flex border-b border-gray-200">
        {(Object.keys(tabConfig) as ActiveTab[]).map(key => {
          const cfg = tabConfig[key];
          const Icon = cfg.icon;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                isActive
                  ? key === 'leads'
                    ? 'border-blue-500 text-blue-700 bg-blue-50/50'
                    : 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cfg.label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                isActive
                  ? key === 'leads' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {entries.reduce((s, e) => s + (key === 'leads' ? e.leads_count : e.subscribers_count), 0)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Aucune donnee pour cette periode</p>
          </div>
        ) : (
          <BarChartSVG
            entries={sortedEntries}
            activeTab={activeTab}
            barColor={currentTab.color}
            hoveredIdx={hoveredIdx}
            setHoveredIdx={setHoveredIdx}
          />
        )}
      </div>
    </div>
  );
}

function BarChartSVG({ entries, activeTab, barColor, hoveredIdx, setHoveredIdx }: {
  entries: AffiliateEntry[];
  activeTab: ActiveTab;
  barColor: string;
  hoveredIdx: number | null;
  setHoveredIdx: (idx: number | null) => void;
}) {
  const getValue = (e: AffiliateEntry) => activeTab === 'leads' ? e.leads_count : e.subscribers_count;
  const maxVal = Math.max(...entries.map(getValue), 1);

  const barWidth = 36;
  const gap = 32;
  const avatarSize = 30;
  const chartHeight = 240;
  const topPadding = 30;
  const bottomPadding = 55;
  const leftPadding = 40;
  const barArea = chartHeight - topPadding - bottomPadding;
  const totalWidth = leftPadding + entries.length * (barWidth + gap) - gap + 20;

  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];
  const uniqueTicks = [...new Set(yTicks)];

  return (
    <div className="overflow-x-auto pb-2">
      <svg width={totalWidth} height={chartHeight} className="block">
        {uniqueTicks.map(tick => {
          const y = topPadding + barArea - (tick / maxVal) * barArea;
          return (
            <g key={tick}>
              <line
                x1={leftPadding - 5}
                y1={y}
                x2={totalWidth}
                y2={y}
                stroke="#F3F4F6"
                strokeWidth={1}
              />
              <text
                x={leftPadding - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px]"
                fill="#9CA3AF"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {entries.map((entry, i) => {
          const x = leftPadding + i * (barWidth + gap);
          const val = getValue(entry);
          const barH = Math.max(3, (val / maxVal) * barArea);
          const barY = topPadding + barArea - barH;
          const isHovered = hoveredIdx === i;
          const centerX = x + barWidth / 2;

          return (
            <g
              key={entry.affiliate_id}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={barY}
                width={barWidth}
                height={barH}
                rx={6}
                fill={barColor}
                opacity={isHovered ? 1 : 0.75}
                className="transition-opacity duration-150"
              />
              {val > 0 && (
                <text
                  x={centerX}
                  y={barY - 7}
                  textAnchor="middle"
                  className="text-[11px] font-bold"
                  fill={barColor}
                >
                  {val}
                </text>
              )}

              <clipPath id={`lvs-avatar-${i}`}>
                <circle
                  cx={centerX}
                  cy={chartHeight - bottomPadding + 22}
                  r={avatarSize / 2}
                />
              </clipPath>
              <circle
                cx={centerX}
                cy={chartHeight - bottomPadding + 22}
                r={avatarSize / 2 + 1}
                fill={isHovered ? barColor : '#E5E7EB'}
                opacity={isHovered ? 0.3 : 1}
                className="transition-all duration-150"
              />
              {entry.avatar_url ? (
                <image
                  href={entry.avatar_url}
                  x={centerX - avatarSize / 2}
                  y={chartHeight - bottomPadding + 22 - avatarSize / 2}
                  width={avatarSize}
                  height={avatarSize}
                  clipPath={`url(#lvs-avatar-${i})`}
                  preserveAspectRatio="xMidYMid slice"
                />
              ) : (
                <>
                  <circle
                    cx={centerX}
                    cy={chartHeight - bottomPadding + 22}
                    r={avatarSize / 2}
                    fill="#F3F4F6"
                  />
                  <text
                    x={centerX}
                    y={chartHeight - bottomPadding + 26}
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
                    x={centerX - 70}
                    y={barY - 56}
                    width={140}
                    height={42}
                    rx={8}
                    fill="#1F2937"
                    opacity={0.95}
                  />
                  <text
                    x={centerX}
                    y={barY - 38}
                    textAnchor="middle"
                    fill="white"
                    className="text-[11px] font-semibold"
                  >
                    {entry.full_name}
                  </text>
                  <text
                    x={centerX}
                    y={barY - 23}
                    textAnchor="middle"
                    fill={activeTab === 'leads' ? '#93C5FD' : '#6EE7B7'}
                    className="text-[10px]"
                  >
                    {val} {activeTab === 'leads' ? 'lead' : 'abonne'}{val !== 1 ? 's' : ''}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PeriodToggle({ periods, active, onChange }: {
  periods: { key: Period; label: string }[];
  active: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5">
      {periods.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            active === p.key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
