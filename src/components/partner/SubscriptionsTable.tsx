interface SubscriptionRow {
  id: string;
  first_name: string;
  city: string;
  created_at: string;
  status: string;
}

interface SubscriptionsTableProps {
  subscriptions: SubscriptionRow[];
}

export default function SubscriptionsTable({ subscriptions }: SubscriptionsTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">Mes inscriptions</h3>
        <p className="text-sm text-gray-500">Filleul(e)s referees par ton lien</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Prenom</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Ville</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                  Aucune inscription pour le moment
                </td>
              </tr>
            ) : (
              subscriptions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{s.first_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{s.city}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(s.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <SubStatusBadge status={s.status} />
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

function SubStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    trialing: 'bg-blue-100 text-blue-700',
    canceled: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    active: 'Actif',
    trialing: 'Essai',
    canceled: 'Annule',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}
