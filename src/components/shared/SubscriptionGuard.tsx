import { useState, useEffect, ReactNode } from 'react';
import { Clock, Sparkles, Lock } from 'lucide-react';
import { getUserCompanyId, checkSubscriptionAccess } from '../../lib/subscriptionHelpers';
import BelayaLoader from './BelayaLoader';

interface SubscriptionGuardProps {
  children: ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const companyId = await getUserCompanyId();

      if (!companyId) {
        window.location.href = '/pricing';
        return;
      }

      const access = await checkSubscriptionAccess(companyId);

      if (access.hasAccess) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
        setReason(access.reason || 'unknown');
      }
    } catch (error) {
      console.error('Error checking subscription access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <BelayaLoader variant="full" message="Vérification de votre abonnement..." />;
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {reason === 'expired' ? 'Essai gratuit terminé' : 'Abonnement requis'}
          </h2>

          <p className="text-slate-600 mb-6">
            {reason === 'expired'
              ? 'Votre période d\'essai de 14 jours est terminée. Choisissez une offre pour continuer à utiliser Belaya.'
              : 'Vous devez avoir un abonnement actif pour accéder à cette fonctionnalité.'}
          </p>

          <button
            onClick={() => window.location.href = '/pricing'}
            className="w-full bg-gradient-to-r from-belaya-bright to-teal-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Voir les offres
          </button>

          <p className="text-sm text-slate-500 mt-4">
            <Clock className="w-4 h-4 inline mr-1" />
            14 jours gratuits - Sans engagement
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
