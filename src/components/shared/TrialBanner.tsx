import { useState, useEffect } from 'react';
import { Clock, Sparkles, X } from 'lucide-react';
import { getUserCompanyId, getSubscriptionStatus, type SubscriptionStatus } from '../../lib/subscriptionHelpers';

export default function TrialBanner() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  async function loadSubscriptionStatus() {
    try {
      const companyId = await getUserCompanyId();
      if (!companyId) {
        setLoading(false);
        return;
      }

      const subscriptionStatus = await getSubscriptionStatus(companyId);
      setStatus(subscriptionStatus);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !status || dismissed) return null;

  if (status.subscriptionStatus === 'active') return null;

  if (status.isTrial && status.daysRemaining > 0) {
    return (
      <div className="bg-gradient-to-r from-belleya-bright to-belleya-vivid text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">
                Essai gratuit - {status.daysRemaining} jour{status.daysRemaining > 1 ? 's' : ''} restant{status.daysRemaining > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-belleya-100">
                Profite de toutes les fonctionnalités sans engagement
              </p>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/pricing'}
            className="bg-white text-belleya-bright px-4 py-2 rounded-lg font-medium hover:bg-belleya-50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Choisir mon offre
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (status.subscriptionStatus === 'expired' || !status.isActive) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">
                Votre essai gratuit est terminé
              </p>
              <p className="text-sm text-red-100">
                Choisissez une offre pour continuer à utiliser Belleya
              </p>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/pricing'}
            className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Voir les offres
          </button>
        </div>
      </div>
    );
  }

  return null;
}
