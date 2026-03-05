import { useMemo } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react';

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

function BarChart({ data, dataKey, color, suffix = '' }: {
  data: { label: string; value: number }[];
  dataKey: string;
  color: string;
  suffix?: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.floor(240 / data.length);
  const chartWidth = barWidth * data.length + 40;
  const chartHeight = 160;
  const barArea = chartHeight - 40;

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
              <rect
                x={x}
                y={y}
                width={w}
                height={barH}
                rx={4}
                className={`transition-all duration-500`}
                fill={color}
                opacity={0.85}
              />
              {d.value > 0 && (
                <text
                  x={x + w / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="text-[11px] font-semibold"
                  fill="#374151"
                >
                  {d.value}{suffix}
                </text>
              )}
              <text
                x={x + w / 2}
                y={chartHeight - 6}
                textAnchor="middle"
                className="text-[10px]"
                fill="#9CA3AF"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function FunnelChart({ steps }: { steps: { label: string; value: number; color: string }[] }) {
  const maxVal = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const pct = Math.max(8, (step.value / maxVal) * 100);
        return (
          <div key={i}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{step.label}</span>
              <span className="font-bold text-gray-900">{step.value}</span>
            </div>
            <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-700 flex items-center justify-center"
                style={{ width: `${pct}%`, backgroundColor: step.color }}
              >
                {pct > 20 && (
                  <span className="text-white text-xs font-semibold">
                    {step.value}
                  </span>
                )}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-0.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2L6 10M6 10L3 7M6 10L9 7" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardCharts({ leads, commissionRate }: DashboardChartsProps) {
  const monthlyData = useMemo(() => buildMonthlyData(leads), [leads]);

  const signupsData = monthlyData.map((m) => ({ label: m.label, value: m.signups }));
  const conversionsData = monthlyData.map((m) => ({ label: m.label, value: m.conversions }));
  const revenueData = monthlyData.map((m) => ({ label: m.label, value: Math.round(m.revenue) }));

  const totalSignups = leads.length;
  const totalTrialing = leads.filter((l) => l.computed_status === 'trialing').length;
  const totalActive = leads.filter((l) => l.computed_status === 'active').length;

  const funnelSteps = [
    { label: 'Inscriptions', value: totalSignups, color: '#3B82F6' },
    { label: 'Essais', value: totalTrialing + totalActive, color: '#F59E0B' },
    { label: 'Clients abonnes', value: totalActive, color: '#10B981' },
  ];

  if (leads.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Inscriptions par mois</h3>
          </div>
          <BarChart data={signupsData} dataKey="signups" color="#3B82F6" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-gray-900">Clients abonnes par mois</h3>
          </div>
          <BarChart data={conversionsData} dataKey="conversions" color="#10B981" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Revenus generes</h3>
          </div>
          <BarChart data={revenueData} dataKey="revenue" color="#059669" suffix=" EUR" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Funnel de conversion</h3>
          </div>
          <FunnelChart steps={funnelSteps} />
          {totalSignups > 0 && (
            <p className="text-xs text-gray-400 mt-4 text-center">
              Taux de conversion : {Math.round((totalActive / totalSignups) * 100)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
