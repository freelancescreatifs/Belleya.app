import { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart3, Loader2, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Period = 'day' | 'month' | 'year';

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

      const [affRes, leadsRes, signupsRes] = await Promise.all([
        affiliateQuery,
        supabase
          .from('affiliate_crm_leads')
          .select('id, affiliate_id, created_at')
          .gte('created_at', startISO),
        supabase
          .from('affiliate_signups')
          .select('id, affiliate_id, subscription_status, created_at')
          .eq('subscription_status', 'active')
          .gte('created_at', startISO),
      ]);

      const affiliates = affRes.data || [];
      const allLeads = leadsRes.data || [];
      const allSignups = signupsRes.data || [];

      const leadsMap = new Map<string, number>();
      allLeads.forEach((l: any) => {
        leadsMap.set(l.affiliate_id, (leadsMap.get(l.affiliate_id) || 0) + 1);
      });

      const subsMap = new Map<string, number>();
      allSignups.forEach((s: any) => {
        subsMap.set(s.affiliate_id, (subsMap.get(s.affiliate_id) || 0) + 1);
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Leads vs Clients abonnes</h3>
          </div>
          <PeriodToggle periods={periods} active={period} onChange={setPeriod} />
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Aucune donnee pour cette periode</p>
        </div>
      </div>
    );
  }

  const maxVal = Math.max(...entries.flatMap(e => [e.leads_count, e.subscribers_count]), 1);

  const pairWidth = 52;
  const gap = 24;
  const avatarSize = 30;
  const chartHeight = 240;
  const topPadding = 30;
  const bottomPadding = 55;
  const leftPadding = 40;
  const barArea = chartHeight - topPadding - bottomPadding;
  const totalWidth = leftPadding + entries.length * (pairWidth + gap) - gap + 20;

  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];
  const uniqueTicks = [...new Set(yTicks)];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 text-sm">Leads vs Clients abonnes</h3>
        </div>
        <PeriodToggle periods={periods} active={period} onChange={setPeriod} />
      </div>
      <p className="text-xs text-gray-400 mb-4">{periodLabel}</p>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-xs text-gray-600">Leads ajoutes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-xs text-gray-600">Clients abonnes</span>
        </div>
      </div>

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
            const groupX = leftPadding + i * (pairWidth + gap);
            const barW = (pairWidth - 4) / 2;
            const leadsH = Math.max(3, (entry.leads_count / maxVal) * barArea);
            const subsH = Math.max(3, (entry.subscribers_count / maxVal) * barArea);
            const leadsY = topPadding + barArea - leadsH;
            const subsY = topPadding + barArea - subsH;
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={entry.affiliate_id}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={groupX}
                  y={leadsY}
                  width={barW}
                  height={leadsH}
                  rx={4}
                  fill="#3B82F6"
                  opacity={isHovered ? 1 : 0.8}
                  className="transition-opacity duration-150"
                />
                {entry.leads_count > 0 && (
                  <text
                    x={groupX + barW / 2}
                    y={leadsY - 6}
                    textAnchor="middle"
                    className="text-[10px] font-bold"
                    fill="#3B82F6"
                  >
                    {entry.leads_count}
                  </text>
                )}

                <rect
                  x={groupX + barW + 4}
                  y={subsY}
                  width={barW}
                  height={subsH}
                  rx={4}
                  fill="#10B981"
                  opacity={isHovered ? 1 : 0.8}
                  className="transition-opacity duration-150"
                />
                {entry.subscribers_count > 0 && (
                  <text
                    x={groupX + barW + 4 + barW / 2}
                    y={subsY - 6}
                    textAnchor="middle"
                    className="text-[10px] font-bold"
                    fill="#10B981"
                  >
                    {entry.subscribers_count}
                  </text>
                )}

                <clipPath id={`lvs-avatar-${i}`}>
                  <circle
                    cx={groupX + pairWidth / 2}
                    cy={chartHeight - bottomPadding + 22}
                    r={avatarSize / 2}
                  />
                </clipPath>
                <circle
                  cx={groupX + pairWidth / 2}
                  cy={chartHeight - bottomPadding + 22}
                  r={avatarSize / 2 + 1}
                  fill="#E5E7EB"
                />
                {entry.avatar_url ? (
                  <image
                    href={entry.avatar_url}
                    x={groupX + pairWidth / 2 - avatarSize / 2}
                    y={chartHeight - bottomPadding + 22 - avatarSize / 2}
                    width={avatarSize}
                    height={avatarSize}
                    clipPath={`url(#lvs-avatar-${i})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                ) : (
                  <>
                    <circle
                      cx={groupX + pairWidth / 2}
                      cy={chartHeight - bottomPadding + 22}
                      r={avatarSize / 2}
                      fill="#F3F4F6"
                    />
                    <text
                      x={groupX + pairWidth / 2}
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
                      x={groupX + pairWidth / 2 - 75}
                      y={Math.min(leadsY, subsY) - 68}
                      width={150}
                      height={56}
                      rx={8}
                      fill="#1F2937"
                      opacity={0.95}
                    />
                    <text
                      x={groupX + pairWidth / 2}
                      y={Math.min(leadsY, subsY) - 50}
                      textAnchor="middle"
                      fill="white"
                      className="text-[11px] font-semibold"
                    >
                      {entry.full_name}
                    </text>
                    <text
                      x={groupX + pairWidth / 2}
                      y={Math.min(leadsY, subsY) - 36}
                      textAnchor="middle"
                      fill="#93C5FD"
                      className="text-[10px]"
                    >
                      {entry.leads_count} lead{entry.leads_count !== 1 ? 's' : ''}
                    </text>
                    <text
                      x={groupX + pairWidth / 2}
                      y={Math.min(leadsY, subsY) - 22}
                      textAnchor="middle"
                      fill="#6EE7B7"
                      className="text-[10px]"
                    >
                      {entry.subscribers_count} abonne{entry.subscribers_count !== 1 ? 's' : ''}
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
