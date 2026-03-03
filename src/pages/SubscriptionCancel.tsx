import { XCircle, ArrowLeft } from 'lucide-react';

export default function SubscriptionCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-orange-500" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            Paiement annule
          </h1>

          <p className="text-slate-600 mb-8">
            Le processus de paiement a ete annule. Aucun montant n'a ete debite.
            Vous pouvez reessayer a tout moment.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => { window.location.href = '/pricing'; }}
              className="w-full bg-gradient-to-r from-belaya-deep to-belaya-bright text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Revoir les offres
            </button>

            <button
              onClick={() => { window.location.href = '/'; }}
              className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
