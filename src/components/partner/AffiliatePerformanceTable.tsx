import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Loader2, Users, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AffiliateRow {
  affiliate_id: string;
  full_name: string;
  avatar_url: string | null;
  leads_count: number;
  trialing_count: number;
  active_count: number;
}

interface AffiliatePerformanceTableProps {
  currentAffiliateId?: string;
}

type ChartTab = 'leads' | 'essais' | 'abonnes';

const TABS: { key: ChartTab; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'leads', label: 'Leads', icon: Users, color: '#3B82F6' },
  { key: 'essais', label: 'Essais', icon: Clock, color: '#F59E0B' },
  { key: 'abonnes', label: 'Abonnes', icon: CheckCircle, color: '#10B981' },
];

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}

function getFirstName(name: string) {
  return name.split(' ')[0] || name;
}

export default function AffiliatePerformanceTable({ currentAffiliateId }: AffiliatePerformanceTableProps) {
  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ChartTab>('leads');

  const load = useCallback(async () => {
    try {
      const [affRes, signupsRes, crmRes] = await Promise.all([
        supabase
          .from('affiliates')
          .select('id, full_name, avatar_url')
          .eq('status', 'active')
          .is('deleted_at', null),
        supabase
          .from('affiliate_signups')
          .select('id, affiliate_id, subscription_status'),
        supabase
          .from('affiliate_crm_leads')
          .select('id, affiliate_id'),
      ]);

      const affiliates = affRes.data || [];
      const signups = signupsRes.data || [];
      const crmLeads = crmRes.data || [];

      const result: AffiliateRow[] = affiliates.map((a: any) => {
        const mySignups = signups.filter((s: any) => s.affiliate_id === a.id);
        const myCrm = crmLeads.filter((l: any) => l.affiliate_id === a.id);
        const trialing = mySignups.filter((s: any) => s.subscription_status === 'trialing' || s.subscription_status === 'trial').length;
        const active = mySignups.filter((s: any) => s.subscription_status === 'active').length;

        return {
          affiliate_id: a.id,
          full_name: a.full_name || 'Anonyme',
          avatar_url: a.avatar_url || null,
          leads_count: myCrm.length,
          trialing_count: trialing,
          active_count: active,
        };
      });

      result.sort((a, b) => b.active_count - a.active_count || b.trialing_count - a.trialing_count);
      setRows(result);
    } catch (err) {
      console.error('AffiliatePerformance error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Aucune donnee disponible</p>
      </div>
    );
  }

  const currentTab = TABS.find(t => t.key === activeTab)!;

  const getValue = (row: AffiliateRow) => {
    if (activeTab === 'leads') return row.leads_count;
    if (activeTab === 'essais') return row.trialing_count;
    return row.active_count;
  };

  const sortedRows = [...rows].sort((a, b) => getValue(b) - getValue(a));
  const displayRows = sortedRows.slice(0, 12);
  const maxVal = Math.max(...displayRows.map(r => getValue(r)), 1);

  const barWidth = 56;
  const gap = 12;
  const chartHeight = 240;
  const topPadding = 30;
  const bottomPadding = 56;
  const barArea = chartHeight - topPadding - bottomPadding;
  const totalWidth = Math.max(displayRows.length * (barWidth + gap) - gap + 40, 300);

  const gridLines = [];
  const gridStep = Math.ceil(maxVal / 4) || 1;
  for (let v = 0; v <= maxVal; v += gridStep) {
    gridLines.push(v);
  }
  if (gridLines[gridLines.length - 1] < maxVal) {
    gridLines.push(maxVal);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex border-b border-gray-100">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors relative ${
                isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: tab.color }} />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Performance des affilies</h3>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <svg width={totalWidth} height={chartHeight} className="mx-auto block">
            {gridLines.map((v) => {
              const y = topPadding + barArea - (v / maxVal) * barArea;
              return (
                <g key={`grid-${v}`}>
                  <line x1={30} y1={y} x2={totalWidth - 10} y2={y} stroke="#F3F4F6" strokeWidth={1} />
                  <text x={24} y={y + 4} textAnchor="end" className="text-[10px]" fill="#9CA3AF">{v}</text>
                </g>
              );
            })}

            {displayRows.map((row, i) => {
              const val = getValue(row);
              const x = 36 + i * (barWidth + gap);
              const barH = Math.max(2, (val / maxVal) * barArea);
              const barY = topPadding + barArea - barH;
              const isCurrent = row.affiliate_id === currentAffiliateId;
              const avatarSize = 28;

              return (
                <g key={row.affiliate_id}>
                  <rect
                    x={x + 4}
                    y={barY}
                    width={barWidth - 8}
                    height={barH}
                    rx={5}
                    fill={currentTab.color}
                    opacity={isCurrent ? 1 : 0.7}
                    className="transition-all duration-300"
                  />
                  {isCurrent && (
                    <rect
                      x={x + 4}
                      y={barY}
                      width={barWidth - 8}
                      height={barH}
                      rx={5}
                      fill="none"
                      stroke={currentTab.color}
                      strokeWidth={2}
                    />
                  )}
                  {val > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={barY - 6}
                      textAnchor="middle"
                      className="text-[11px] font-bold"
                      fill="#374151"
                    >
                      {val}
                    </text>
                  )}

                  <clipPath id={`perf-avatar-${activeTab}-${i}`}>
                    <circle cx={x + barWidth / 2} cy={chartHeight - bottomPadding + 18} r={avatarSize / 2} />
                  </clipPath>
                  <circle
                    cx={x + barWidth / 2}
                    cy={chartHeight - bottomPadding + 18}
                    r={avatarSize / 2 + 1}
                    fill={isCurrent ? currentTab.color : '#E5E7EB'}
                  />
                  {row.avatar_url ? (
                    <image
                      href={row.avatar_url}
                      x={x + barWidth / 2 - avatarSize / 2}
                      y={chartHeight - bottomPadding + 18 - avatarSize / 2}
                      width={avatarSize}
                      height={avatarSize}
                      clipPath={`url(#perf-avatar-${activeTab}-${i})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  ) : (
                    <>
                      <circle
                        cx={x + barWidth / 2}
                        cy={chartHeight - bottomPadding + 18}
                        r={avatarSize / 2}
                        fill={isCurrent ? '#EFF6FF' : '#F3F4F6'}
                      />
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight - bottomPadding + 22}
                        textAnchor="middle"
                        className="text-[9px] font-bold"
                        fill={isCurrent ? currentTab.color : '#9CA3AF'}
                      >
                        {getInitials(row.full_name)}
                      </text>
                    </>
                  )}

                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    className="text-[9px]"
                    fill={isCurrent ? currentTab.color : '#9CA3AF'}
                    fontWeight={isCurrent ? 'bold' : 'normal'}
                  >
                    {getFirstName(row.full_name).slice(0, 8)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
