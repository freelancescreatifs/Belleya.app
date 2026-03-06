import { Clock, AlertTriangle, CheckCircle, MessageSquare, Phone } from 'lucide-react';

interface AffiliateLead {
  id: string;
  first_name: string | null;
  computed_status: 'trialing' | 'active' | 'expired' | 'canceled';
  days_left: number;
  trial_end_date: string | null;
  created_at: string;
}

interface ContactEssaiGratuitProps {
  leads: AffiliateLead[];
}

function UrgencyBadge({ daysLeft }: { daysLeft: number }) {
  if (daysLeft <= 1) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        URGENT
      </span>
    );
  }
  if (daysLeft <= 3) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
        <Clock className="w-3 h-3" />
        J-{daysLeft}
      </span>
    );
  }
  if (daysLeft <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" />
        J-{daysLeft}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-200">
      <CheckCircle className="w-3 h-3" />
      J-{daysLeft}
    </span>
  );
}

const CONTACT_SCRIPTS = [
  {
    timing: 'J-10 a J-7',
    icon: MessageSquare,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    message: '"Hello ! Tu as eu le temps de tester Belaya ? N\'hesite pas si tu as des questions, je suis la pour t\'aider !"',
  },
  {
    timing: 'J-3',
    icon: MessageSquare,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    message: '"Tu as teste quoi pour l\'instant ? L\'agenda, les fiches clientes ? Je peux te montrer les fonctions les plus utiles."',
  },
  {
    timing: 'J-2',
    icon: Phone,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    message: '"Ton essai se termine bientot. Qu\'est-ce que tu en as pense ? Je peux t\'aider si tu as des questions."',
  },
  {
    timing: 'J-1',
    icon: AlertTriangle,
    color: 'bg-red-50 border-red-200 text-red-700',
    message: '"Ton essai se termine demain ! Ca serait dommage de ne pas profiter de tout ce que tu as commence a mettre en place."',
  },
];

export default function ContactEssaiGratuit({ leads }: ContactEssaiGratuitProps) {
  const trialLeads = leads
    .filter(l => l.computed_status === 'trialing')
    .sort((a, b) => a.days_left - b.days_left);

  const urgent = trialLeads.filter(l => l.days_left <= 3);
  const upcoming = trialLeads.filter(l => l.days_left > 3 && l.days_left <= 7);
  const comfortable = trialLeads.filter(l => l.days_left > 7);

  return (
    <div className="space-y-6">
      {trialLeads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun essai gratuit en cours</p>
          <p className="text-xs text-gray-400 mt-2">Les personnes en essai gratuit via ton lien apparaitront ici</p>
        </div>
      ) : (
        <>
          {urgent.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-800 text-sm">
                  {urgent.length} essai{urgent.length > 1 ? 's' : ''} a contacter en urgence
                </h3>
              </div>
              <p className="text-xs text-red-700 mb-3">
                Ces personnes terminent leur essai dans les 3 prochains jours. Contacte-les maintenant !
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Essais gratuits en cours</h3>
              <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                {trialLeads.length} personne{trialLeads.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {trialLeads.map(lead => (
                <div key={lead.id} className={`px-5 py-3.5 flex items-center gap-4 ${lead.days_left <= 3 ? 'bg-red-50/30' : 'hover:bg-gray-50'} transition-colors`}>
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-700">
                      {(lead.first_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{lead.first_name || 'Utilisateur'}</p>
                    <p className="text-xs text-gray-500">
                      Inscrit le {new Date(lead.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      {lead.trial_end_date && (
                        <> - Fin le {new Date(lead.trial_end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</>
                      )}
                    </p>
                  </div>
                  <UrgencyBadge daysLeft={lead.days_left} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Scripts de relance par etape</h3>
            <div className="space-y-3">
              {CONTACT_SCRIPTS.map((script, i) => {
                const Icon = script.icon;
                return (
                  <div key={i} className={`${script.color} border rounded-xl p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">{script.timing}</span>
                    </div>
                    <p className="text-sm italic leading-relaxed">{script.message}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{urgent.length}</p>
              <p className="text-xs text-red-600 mt-1">Urgents (J-3 ou moins)</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{upcoming.length}</p>
              <p className="text-xs text-amber-600 mt-1">A relancer (J-4 a J-7)</p>
            </div>
            <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{comfortable.length}</p>
              <p className="text-xs text-green-600 mt-1">Confortables (J-8+)</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
