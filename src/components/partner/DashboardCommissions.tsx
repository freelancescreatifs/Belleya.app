import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, Loader as Loader2 } from 'lucide-react';

export default function DashboardCommissions({ affiliateId }: { affiliateId: string }) {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommissions();
  }, [affiliateId]);

  const loadCommissions = async () => {
    try {
      const { data } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false })
        .limit(20);
      setCommissions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-gray-900 text-sm">Historique commissions</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : commissions.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Aucune commission enregistree</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {commissions.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900">{c.period}</p>
                <p className="text-xs text-gray-500">
                  MRR: {Number(c.mrr || 0).toFixed(2)} EUR | {(Number(c.commission_rate) * 100).toFixed(0)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-700">
                  {Number(c.commission_amount).toFixed(2)} EUR
                </p>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  c.status === 'paid' ? 'bg-green-100 text-green-700' :
                  c.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                  c.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {c.status === 'paid' ? 'Paye' :
                   c.status === 'approved' ? 'Approuve' :
                   c.status === 'pending' ? 'En attente' : c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
