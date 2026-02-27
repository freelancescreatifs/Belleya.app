interface CommissionRow {
  id: string;
  period: string;
  mrr: number;
  commission_amount: number;
  status: string;
}

interface CommissionsTableProps {
  commissions: CommissionRow[];
  commissionRate: number;
}

export default function CommissionsTable({ commissions, commissionRate }: CommissionsTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">Mes commissions</h3>
        <p className="text-sm text-gray-500">
          Historique des commissions mensuelles (taux: {(commissionRate * 100).toFixed(0)}%)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Mois</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">MRR</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Commission</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                  Aucune commission pour le moment
                </td>
              </tr>
            ) : (
              commissions.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{c.period}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.mrr.toFixed(2)} EUR</td>
                  <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{c.commission_amount.toFixed(2)} EUR</td>
                  <td className="px-6 py-4">
                    <CommStatusBadge status={c.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CommStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    paid: 'bg-emerald-100 text-emerald-700',
  };
  const labels: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuve',
    paid: 'Paye',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}
