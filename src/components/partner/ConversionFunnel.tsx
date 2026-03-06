import { useState, useEffect, useCallback } from 'react';
import { Info, Loader2, Users, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FunnelStep {
  label: string;
  value: number;
  color: string;
  bgLight: string;
  icon: React.ElementType;
  tooltip: string;
}

interface ConversionFunnelProps {
  crmLeadCount: number;
  trialingCount: number;
  activeCount: number;
  title?: string;
}

function Tooltip({ text }: { text: string }) {
  return (
    <div className="relative group/tip inline-flex ml-1">
      <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 bg-gray-900 text-white text-[11px] rounded-lg p-2.5 shadow-lg opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:pointer-events-auto transition-opacity z-20 leading-relaxed">
        {text}
        <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 w-2 h-2 bg-gray-900 rotate-45" />
      </div>
    </div>
  );
}

function FunnelVisual({ steps }: { steps: FunnelStep[] }) {
  const maxVal = Math.max(...steps.map(s => s.value), 1);

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const widthPct = Math.max(20, (step.value / maxVal) * 100);
        const Icon = step.icon;
        const convRate = i > 0 && steps[i - 1].value > 0
          ? Math.round((step.value / steps[i - 1].value) * 100)
          : null;

        return (
          <div key={step.label}>
            <div className="flex items-center gap-3 mb-1.5">
              <div className={`w-8 h-8 ${step.bgLight} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4`} style={{ color: step.color }} />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-medium text-gray-700">{step.label}</span>
                <Tooltip text={step.tooltip} />
              </div>
              <span className="ml-auto text-lg font-bold text-gray-900 tabular-nums">{step.value}</span>
            </div>

            <div className="ml-11 mb-1">
              <div className="h-10 bg-gray-50 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all duration-700 ease-out flex items-center px-3"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: step.color,
                    opacity: 0.85,
                  }}
                >
                  {widthPct > 30 && (
                    <span className="text-white text-sm font-bold">{step.value}</span>
                  )}
                </div>
              </div>
            </div>

            {i < steps.length - 1 && (
              <div className="ml-11 flex items-center gap-2 py-1.5">
                <div className="flex items-center">
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="none" className="text-gray-300">
                    <path d="M8 2L8 18M8 18L4 14M8 18L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {convRate !== null && convRate > 0 && (
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {convRate}% de conversion
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ConversionFunnel({ crmLeadCount, trialingCount, activeCount, title }: ConversionFunnelProps) {
  const steps: FunnelStep[] = [
    {
      label: 'Leads',
      value: crmLeadCount,
      color: '#3B82F6',
      bgLight: 'bg-blue-50',
      icon: Users,
      tooltip: 'Personnes contactees et ajoutees dans ton CRM prospects',
    },
    {
      label: 'Essais gratuits',
      value: trialingCount,
      color: '#F59E0B',
      bgLight: 'bg-amber-50',
      icon: Clock,
      tooltip: 'Personnes inscrites en essai gratuit 14 jours via ton lien',
    },
    {
      label: 'Clients abonnes',
      value: activeCount,
      color: '#10B981',
      bgLight: 'bg-emerald-50',
      icon: CheckCircle,
      tooltip: 'Personnes ayant pris un abonnement payant Belaya',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-5 text-sm">
        {title || 'Funnel de conversion'}
      </h3>
      <FunnelVisual steps={steps} />
    </div>
  );
}

export function GlobalConversionFunnel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ leads: 0, trialing: 0, active: 0 });

  const load = useCallback(async () => {
    try {
      const [crmRes, signupsRes] = await Promise.all([
        supabase.from('affiliate_crm_leads').select('id', { count: 'exact', head: true }),
        supabase.from('affiliate_signups').select('id, subscription_status'),
      ]);

      const signups = signupsRes.data || [];
      const trialing = signups.filter((s: any) => s.subscription_status === 'trialing' || s.subscription_status === 'trial').length;
      const active = signups.filter((s: any) => s.subscription_status === 'active').length;

      setData({
        leads: crmRes.count || 0,
        trialing: trialing + active,
        active,
      });
    } catch (err) {
      console.error('GlobalFunnel error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <ConversionFunnel
      crmLeadCount={data.leads}
      trialingCount={data.trialing}
      activeCount={data.active}
      title="Funnel global des affilies"
    />
  );
}
