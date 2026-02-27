import { AlertTriangle, XCircle } from 'lucide-react';

interface StatusBannerProps {
  affiliateStatus: string;
  daysSinceLastSignup: number;
}

export default function StatusBanner({ affiliateStatus, daysSinceLastSignup }: StatusBannerProps) {
  if (affiliateStatus === 'disabled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
        <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-red-800">Compte desactive pour inactivite</p>
          <p className="text-xs text-red-600 mt-0.5">
            Tu n'as pas genere d'inscription depuis plus de 30 jours.
            Contacte le support pour reactiver ton compte.
          </p>
        </div>
      </div>
    );
  }

  if (affiliateStatus === 'observation' || daysSinceLastSignup >= 14) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-800">
            {daysSinceLastSignup} jours sans inscription
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            Passe a l'action ! Tu risques d'etre desactive apres 30 jours d'inactivite.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
