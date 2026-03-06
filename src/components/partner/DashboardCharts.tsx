import { useState, useMemo } from 'react';
import { Users, TrendingUp, DollarSign } from 'lucide-react';

interface AffiliateLead {
  id: string;
  first_name: string | null;
  computed_status: 'trialing' | 'active' | 'expired' | 'canceled';
  days_left: number;
  mrr: number;
  commission: number;
  created_at: string;
  subscription_start_date: string | null;
}

interface DashboardChartsProps {
  leads: AffiliateLead[];
  commissionRate: number;
}

type ChartTab = 'signups' | 'subscribers' | 'revenue';

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec',
];

function buildMonthlyData(leads: AffiliateLead[]) {
  const now = new Date();
  const months: { key: string; label: string; signups: number; conversions: number; revenue: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      key,
      label: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      signups: 0,
      conversions: 0,
      revenue: 0,
    });
  }

  leads.forEach((lead) => {
    const created = new Date(lead.created_at);
    const createdKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
    const month = months.find((m) => m.key === createdKey);
    if (month) {
      month.signups++;
    }

    if (lead.computed_status === 'active' && lead.subscription_start_date) {
      const sub = new Date(lead.subscription_start_date);
      const subKey = `${sub.getFullYear()}-${String(sub.getMonth() + 1).padStart(2, '0')}`;
      const subMonth = months.find((m) => m.key === subKey);
      if (subMonth) {
        subMonth.conversions++;
        subMonth.revenue += Number(lead.mrr || 0);
      }
    }
  });

  return months;
}

function BarChart({ data, color, suffix = '' }: {
  data: { label: string; value: number }[];
  color: string;
  suffix?: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.floor(240 / data.length);
  const chartWidth = barWidth * data.length + 40;
  const chartHeight = 180;
  const barArea = chartHeight - 44;

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} className="mx-auto" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {data.map((d, i) => {
          const barH = Math.max(2, (d.value / maxVal) * (barArea - 10));
          const x = 30 + i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const y = barArea - barH;

          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={barH} rx={5} fill={color} opacity={0.85} className="transition-all duration-500" />
              {d.value > 0 && (
                <text x={x + w / 2} y={y - 6} textAnchor="middle" className="text-[11px] font-bold" fill="#374151">
                  {d.value}{suffix}
                </text>
              )}
              <text x={x + w / 2} y={chartHeight - 6} textAnchor="middle" className="text-[10px]" fill="#9CA3AF">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const TABS: { key: ChartTab; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'signups', label: 'Inscriptions', icon: Users, color: '#3B82F6' },
  { key: 'subscribers', label: 'Abonnes', icon: TrendingUp, color: '#10B981' },
  { key: 'revenue', label: 'Revenus', icon: DollarSign, color: '#059669' },
];

export default function DashboardCharts({ leads, commissionRate }: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>('signups');
  const monthlyData = useMemo(() => buildMonthlyData(leads), [leads]);

  if (leads.length === 0) return null;

  const signupsData = monthlyData.map((m) => ({ label: m.label, value: m.signups }));
  const conversionsData = monthlyData.map((m) => ({ label: m.label, value: m.conversions }));
  const revenueData = monthlyData.map((m) => ({ label: m.label, value: Math.round(m.revenue) }));

  const total = activeTab === 'signups'
    ? signupsData.reduce((s, d) => s + d.value, 0)
    : activeTab === 'subscribers'
    ? conversionsData.reduce((s, d) => s + d.value, 0)
    : revenueData.reduce((s, d) => s + d.value, 0);

  const currentTab = TABS.find(t => t.key === activeTab)!;

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
                isActive
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: tab.color }} />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-sm">
            {activeTab === 'signups' && 'Inscriptions par mois'}
            {activeTab === 'subscribers' && 'Clients abonnes par mois'}
            {activeTab === 'revenue' && 'Revenus generes par mois'}
          </h3>
          <span className="text-sm font-bold" style={{ color: currentTab.color }}>
            Total: {total}{activeTab === 'revenue' ? ' EUR' : ''}
          </span>
        </div>

        {activeTab === 'signups' && <BarChart data={signupsData} color="#3B82F6" />}
        {activeTab === 'subscribers' && <BarChart data={conversionsData} color="#10B981" />}
        {activeTab === 'revenue' && <BarChart data={revenueData} color="#059669" suffix=" EUR" />}
      </div>
    </div>
  );
}
