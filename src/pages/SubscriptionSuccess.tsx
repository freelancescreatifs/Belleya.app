import { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function SubscriptionSuccess() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            Abonnement active !
          </h1>

          <p className="text-slate-600 mb-8">
            Merci pour votre confiance. Votre abonnement Belaya.app est maintenant actif.
            Profitez de toutes les fonctionnalites !
          </p>

          <button
            onClick={() => { window.location.href = '/'; }}
            className="w-full bg-gradient-to-r from-belaya-deep to-belaya-bright text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Aller au tableau de bord
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-sm text-slate-400 mt-4">
            Redirection automatique dans {countdown}s...
          </p>
        </div>
      </div>
    </div>
  );
}
