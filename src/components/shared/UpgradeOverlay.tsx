import { Lock, Sparkles } from 'lucide-react';
import { getPlanName, type PlanTier } from '../../lib/subscriptionHelpers';

interface UpgradeOverlayProps {
  requiredPlan: PlanTier;
  onUpgrade?: () => void;
  children: React.ReactNode;
}

export default function UpgradeOverlay({ requiredPlan, onUpgrade, children }: UpgradeOverlayProps) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = '/pricing';
    }
  };

  return (
    <div className="relative">
      <div className="pointer-events-none select-none" style={{ filter: 'blur(6px)' }}>
        {children}
      </div>

      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 bg-gradient-to-br from-belaya-100 to-belaya-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-belaya-deep" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Fonctionnalite premium
          </h3>

          <p className="text-sm text-gray-600 mb-5">
            Disponible a partir de l'offre{' '}
            <span className="font-semibold text-belaya-deep">
              {requiredPlan ? getPlanName(requiredPlan) : 'Studio'}
            </span>
          </p>

          <button
            onClick={handleUpgrade}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-belaya-deep to-belaya-bright text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 pointer-events-auto"
          >
            <Sparkles className="w-5 h-5" />
            Passer a l'offre superieure
          </button>
        </div>
      </div>
    </div>
  );
}
