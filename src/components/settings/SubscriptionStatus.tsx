import { useState, useEffect } from 'react';
import { Crown, Zap, Sparkles, Clock, ArrowRight, CheckCircle2, CreditCard, AlertTriangle } from 'lucide-react';
import { getUserCompanyId, getSubscriptionStatus, getPlanName, getPlanPrice, initiateStripeCheckout, type SubscriptionStatus as SubscriptionStatusType } from '../../lib/subscriptionHelpers';
import { supabase } from '../../lib/supabase';

export default function SubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatusType | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  async function loadSubscriptionData() {
    try {
      const companyId = await getUserCompanyId();
      if (!companyId) {
        setLoading(false);
        return;
      }

      const subscriptionStatus = await getSubscriptionStatus(companyId);
      setStatus(subscriptionStatus);

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setSubscriptionData(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!status || !subscriptionData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Mon abonnement</h3>
        <p className="text-slate-600 mb-4">Aucun abonnement actif</p>
        <button
          onClick={() => window.location.href = '/pricing'}
          className="bg-belaya-vivid text-white px-4 py-2 rounded-lg hover:bg-belaya-bright transition-colors"
        >
          Choisir une offre
        </button>
      </div>
    );
  }

  const getPlanIcon = () => {
    switch (status.planType) {
      case 'start':
        return <Sparkles className="w-6 h-6 text-belaya-bright" />;
      case 'studio':
        return <Zap className="w-6 h-6 text-amber-600" />;
      case 'empire':
        return <Crown className="w-6 h-6 text-belaya-deep" />;
      default:
        return <Sparkles className="w-6 h-6 text-slate-600" />;
    }
  };

  const getPlanColor = () => {
    switch (status.planType) {
      case 'start':
        return 'from-belaya-bright to-teal-500';
      case 'studio':
        return 'from-amber-500 to-orange-500';
      case 'empire':
        return 'from-belaya-deep to-belaya-vivid';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  const price = getPlanPrice(status.planType);
  const displayPrice = subscriptionData.monthly_price || price.current;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className={`bg-gradient-to-r ${getPlanColor()} p-6 text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getPlanIcon()}
            <h3 className="text-2xl font-bold">{getPlanName(status.planType)}</h3>
          </div>
          {subscriptionData.is_legacy_price && (
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
              Prix bloqué à vie
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold">{displayPrice}€</span>
          <span className="text-lg">/mois</span>
        </div>

        {status.isTrial && (
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg mt-4">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Essai gratuit - {status.daysRemaining} jour{status.daysRemaining > 1 ? 's' : ''} restant{status.daysRemaining > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <span className="text-slate-600">Statut</span>
            <div className="flex items-center gap-2">
              {status.isActive ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-belaya-vivid" />
                  <span className="font-medium text-belaya-bright">
                    {status.isTrial ? 'Essai gratuit actif' : 'Actif'}
                  </span>
                </>
              ) : (
                <span className="font-medium text-red-600">Expiré</span>
              )}
            </div>
          </div>

          {status.isTrial && (
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-slate-600">Fin de l'essai</span>
              <span className="font-medium text-slate-900">
                {new Date(subscriptionData.trial_end_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <span className="text-slate-600">Début d'abonnement</span>
            <span className="font-medium text-slate-900">
              {new Date(subscriptionData.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>

          {subscriptionData.payment_provider && (
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-slate-600">Moyen de paiement</span>
              <span className="font-medium text-slate-900 capitalize">
                {subscriptionData.payment_provider}
              </span>
            </div>
          )}
        </div>

        {status.isTrial && (
          <div className="mt-6 bg-emerald-50 border border-belaya-200 rounded-lg p-4">
            <p className="text-sm text-emerald-800 mb-3">
              Votre essai gratuit expire le {new Date(subscriptionData.trial_end_date).toLocaleDateString('fr-FR')}.
              Profitez de toutes les fonctionnalités sans engagement.
            </p>
            <p className="text-xs text-emerald-700">
              Après la période d'essai, l'accès sera automatiquement bloqué jusqu'à activation de l'abonnement.
            </p>
          </div>
        )}

        {status.subscriptionStatus === 'past_due' && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">Paiement en attente</p>
              <p className="text-xs text-amber-700">
                Votre dernier paiement a echoue. Veuillez mettre a jour vos informations de paiement.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {(status.isTrial || status.subscriptionStatus === 'expired' || status.subscriptionStatus === 'past_due') && (
            <button
              onClick={() => window.location.href = '/pricing'}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-belaya-deep to-belaya-bright text-white px-4 py-3 rounded-lg hover:shadow-lg transition-all font-medium"
            >
              <CreditCard className="w-4 h-4" />
              {status.isTrial ? 'Activer mon abonnement' : 'Mettre a jour le paiement'}
            </button>
          )}
          {status.subscriptionStatus === 'active' && (
            <button
              onClick={() => window.location.href = '/pricing'}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Changer d'offre
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
