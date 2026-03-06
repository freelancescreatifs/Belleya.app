import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Info, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AffiliateRow {
  affiliate_id: string;
  full_name: string;
  avatar_url: string | null;
  leads_count: number;
  trialing_count: number;
  active_count: number;
  conversion_rate: number;
  mrr: number;
}

interface AffiliatePerformanceTableProps {
  currentAffiliateId?: string;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}

function Tooltip({ text }: { text: string }) {
  return (
    <div className="relative group/tip inline-flex ml-0.5">
      <Info className="w-3 h-3 text-gray-400 cursor-help" />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-900 text-white text-[10px] rounded-lg p-2 shadow-lg opacity-0 pointer-events-none group-hover/tip:opacity-100 group-hover/tip:pointer-events-auto transition-opacity z-20 leading-relaxed">
        {text}
        <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1 w-2 h-2 bg-gray-900 rotate-45" />
      </div>
    </div>
  );
}

export default function AffiliatePerformanceTable({ currentAffiliateId }: AffiliatePerformanceTableProps) {
  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(true);

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
          .select('id, affiliate_id, subscription_status, monthly_amount'),
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
        const totalSignups = mySignups.length;
        const conversionRate = totalSignups > 0 ? Math.round((active / totalSignups) * 100) : 0;
        const mrr = mySignups
          .filter((s: any) => s.subscription_status === 'active')
          .reduce((sum: number, s: any) => sum + (Number(s.monthly_amount) || 29), 0);

        return {
          affiliate_id: a.id,
          full_name: a.full_name || 'Anonyme',
          avatar_url: a.avatar_url || null,
          leads_count: myCrm.length,
          trialing_count: trialing,
          active_count: active,
          conversion_rate: conversionRate,
          mrr,
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <TrendingUp className="w-4.5 h-4.5 text-blue-500" />
        <h3 className="font-semibold text-gray-900 text-sm">Performance des affilies</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase">#</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase">Affilie</th>
              <th className="text-center px-3 py-2.5">
                <div className="flex items-center justify-center gap-0.5 text-[11px] font-semibold text-gray-500 uppercase">
                  Leads <Tooltip text="Personnes contactees dans le CRM" />
                </div>
              </th>
              <th className="text-center px-3 py-2.5">
                <div className="flex items-center justify-center gap-0.5 text-[11px] font-semibold text-gray-500 uppercase">
                  Essais <Tooltip text="Inscrits en essai gratuit" />
                </div>
              </th>
              <th className="text-center px-3 py-2.5">
                <div className="flex items-center justify-center gap-0.5 text-[11px] font-semibold text-gray-500 uppercase">
                  Abonnes <Tooltip text="Clients avec abonnement payant actif" />
                </div>
              </th>
              <th className="text-center px-3 py-2.5 text-[11px] font-semibold text-gray-500 uppercase">Taux conv.</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase">MRR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isCurrent = row.affiliate_id === currentAffiliateId;
              return (
                <tr
                  key={row.affiliate_id}
                  className={`border-b border-gray-50 transition-colors ${
                    isCurrent ? 'bg-blue-50/60 ring-1 ring-inset ring-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                        {row.avatar_url ? (
                          <img src={row.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500">{getInitials(row.full_name)}</span>
                        )}
                      </div>
                      <span className={`text-sm font-medium truncate ${isCurrent ? 'text-blue-800' : 'text-gray-900'}`}>
                        {row.full_name}
                        {isCurrent && <span className="ml-1.5 text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">(toi)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-semibold text-blue-600">{row.leads_count}</td>
                  <td className="px-3 py-3 text-center text-sm font-semibold text-amber-600">{row.trialing_count}</td>
                  <td className="px-3 py-3 text-center text-sm font-semibold text-emerald-600">{row.active_count}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`text-sm font-medium ${row.conversion_rate >= 30 ? 'text-emerald-600' : row.conversion_rate >= 15 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {row.conversion_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {row.mrr > 0 ? `${row.mrr.toFixed(0)} EUR` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
