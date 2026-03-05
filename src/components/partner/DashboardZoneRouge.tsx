import { TriangleAlert as AlertTriangle } from 'lucide-react';
import { daysSince } from '../../lib/affiliateUtils';
import type { AffiliateData } from '../../hooks/useAffiliate';

export default function DashboardZoneRouge({ affiliate }: { affiliate: AffiliateData }) {
  const days = daysSince(affiliate.last_signup_date);

  if (days < 7 || affiliate.status === 'disabled') return null;

  return (
    <div className={`rounded-xl border p-5 space-y-3 ${
      days >= 30 ? 'bg-red-50 border-red-200' :
      days >= 14 ? 'bg-orange-50 border-orange-200' :
      'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className={`w-5 h-5 ${
          days >= 30 ? 'text-red-600' :
          days >= 14 ? 'text-orange-600' :
          'text-amber-600'
        }`} />
        <h3 className={`font-semibold text-sm ${
          days >= 30 ? 'text-red-900' :
          days >= 14 ? 'text-orange-900' :
          'text-amber-900'
        }`}>
          Zone rouge - {days >= 999 ? 'Aucune inscription' : `${days} jours sans inscription`}
        </h3>
      </div>
      <p className={`text-sm ${
        days >= 30 ? 'text-red-700' :
        days >= 14 ? 'text-orange-700' :
        'text-amber-700'
      }`}>
        {days >= 30
          ? 'Attention : ton compte risque la desactivation. Partage ton lien pour generer de nouvelles inscriptions.'
          : days >= 14
          ? 'Tu es en observation. Passe a l\'action pour conserver ton statut actif.'
          : 'Plus de 7 jours sans nouvelle inscription. Continue a partager ton lien !'}
      </p>
    </div>
  );
}
