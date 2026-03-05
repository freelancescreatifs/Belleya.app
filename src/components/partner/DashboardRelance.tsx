import { AlertTriangle, Clock, Lightbulb, Target } from 'lucide-react';

interface AffiliateLead {
  id: string;
  first_name: string | null;
  computed_status: 'trialing' | 'active' | 'expired' | 'canceled';
  days_left: number;
  created_at: string;
}

interface DashboardRelanceProps {
  leads: AffiliateLead[];
}

const TIPS = [
  {
    title: 'Contacte avant la fin de l\'essai',
    body: 'Le moment ideal est J-3, J-2 et J-1. C\'est la que le taux de conversion est le plus eleve.',
  },
  {
    title: 'Pose les bonnes questions',
    body: 'Demande-leur s\'ils ont teste la plateforme, s\'ils ont des questions, et ce qui les bloque.',
  },
  {
    title: 'Mets en avant les benefices',
    body: 'Gagner du temps, attirer plus de clientes et centraliser leur activite au meme endroit.',
  },
];

export default function DashboardRelance({ leads }: DashboardRelanceProps) {
  const urgentLeads = leads
    .filter((l) => l.computed_status === 'trialing' && l.days_left <= 2)
    .sort((a, b) => a.days_left - b.days_left);

  const relanceLeads = leads
    .filter((l) => l.computed_status === 'trialing')
    .sort((a, b) => a.days_left - b.days_left);

  if (relanceLeads.length === 0 && urgentLeads.length === 0) return null;

  return (
    <div className="space-y-6">
      {urgentLeads.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-orange-800 mb-1">
                {urgentLeads.length} essai{urgentLeads.length > 1 ? 's' : ''} finissant dans 48h
              </h3>
              <p className="text-sm text-orange-700">
                Contacte-les maintenant pour maximiser tes conversions.
              </p>
            </div>
          </div>
        </div>
      )}

      {relanceLeads.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 pt-5 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Essais a relancer</h3>
              <span className="ml-auto text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                {relanceLeads.length}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase">Prenom</th>
                  <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase">Jours restants</th>
                  <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase">Inscription</th>
                </tr>
              </thead>
              <tbody>
                {relanceLeads.map((lead) => (
                  <tr key={lead.id} className={`border-b border-gray-50 ${lead.days_left <= 2 ? 'bg-orange-50/50' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {lead.first_name || 'Utilisateur'}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Essai
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`font-bold text-sm ${
                        lead.days_left <= 1 ? 'text-red-600' :
                        lead.days_left <= 2 ? 'text-orange-600' :
                        lead.days_left <= 5 ? 'text-amber-600' :
                        'text-gray-700'
                      }`}>
                        J-{Math.max(0, lead.days_left)}
                        {lead.days_left <= 2 && ' !!'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Conseils pour convertir tes essais</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {TIPS.map((tip, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <h4 className="text-sm font-semibold text-gray-900">{tip.title}</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{tip.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
