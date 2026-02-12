import { useState, useEffect } from 'react';
import { Check, Zap, Crown, Sparkles, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PricingPlan {
  id: string;
  name: string;
  currentPrice: number;
  futurePrice: number;
  icon: React.ReactNode;
  popular: boolean;
  description: string;
  features: string[];
}

const plans: PricingPlan[] = [
  {
    id: 'start',
    name: 'BELLEYA START',
    currentPrice: 29,
    futurePrice: 39,
    icon: <Sparkles className="w-8 h-8 text-emerald-600" />,
    popular: false,
    description: 'Pour les indépendantes qui veulent structurer leur activité et arrêter de tout gérer à la main.',
    features: [
      'Gestion des objectifs',
      'Gestion des tâches',
      'Agenda intelligent synchronisé',
      'Réservation en ligne',
      'Jusqu\'à 50 clientes',
      'Notifications automatiques',
      'Envoi automatique du récapitulatif client',
      'Suivi des transactions',
      'Dashboard financier clair',
      'Partenariats Belleya',
      'Gestion des réseaux sociaux',
      'Calendrier éditorial',
      'Suggestions de sujets selon les événements',
      'Boîte à idées IA adaptée à ton métier',
      'Stockage des inspirations',
      'Suivi des paiements',
      'Calculateur de rentabilité',
      'Adaptation selon ton statut',
      'Estimation automatique TVA / CFE',
      'Export & import complet des données',
      'Support WhatsApp 48h'
    ]
  },
  {
    id: 'studio',
    name: 'BELLEYA STUDIO',
    currentPrice: 39,
    futurePrice: 49,
    icon: <Zap className="w-8 h-8 text-amber-600" />,
    popular: true,
    description: 'Pour les professionnelles qui veulent scaler intelligemment.',
    features: [
      '✨ Tout Start inclus +',
      'Clientes illimitées',
      'Gestion des acomptes',
      'Gestion élèves / formations',
      'Historique détaillé client',
      'Système de fidélisation',
      'Gestion des stocks',
      'Gestion complète des finances',
      'Marketing automatique par email',
      'Emails anniversaires & relances',
      'Visibilité sur la plateforme sociale Belleya',
      'Outils d\'optimisation conversion',
      'Calcul automatique charges & cotisations',
      'Exports comptables',
      'Export & import simplifié',
      'Support WhatsApp 24H'
    ]
  },
  {
    id: 'empire',
    name: 'BELLEYA EMPIRE',
    currentPrice: 59,
    futurePrice: 79,
    icon: <Crown className="w-8 h-8 text-purple-600" />,
    popular: false,
    description: 'Pour celles qui veulent automatiser et générer des revenus récurrents.',
    features: [
      '✨ Tout Studio inclus +',
      'Marketing automatisé avancé',
      'Campagnes multi-canaux (SMS + Email)',
      'Optimisation conversion client',
      'Rappels intelligents',
      'Partenariat officiel Belleya',
      'Revenus récurrents via affiliation',
      'Mise en avant premium sur la plateforme',
      'Visibilité renforcée côté client',
      'Support prioritaire express'
    ]
  }
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [daysUntilIncrease] = useState(30);

  useEffect(() => {
    checkExistingSubscription();
  }, []);

  async function checkExistingSubscription() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profile?.company_id) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subscription && (subscription.subscription_status === 'trial' || subscription.subscription_status === 'active')) {
        window.location.href = '/';
      }
    }
  }

  async function handleSelectPlan(planId: string) {
    setSelectedPlan(planId);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (profile?.company_id) {
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingSubscription) {
          const plan = plans.find(p => p.id === planId);
          if (!plan) return;

          const { error } = await supabase
            .from('subscriptions')
            .update({
              plan_type: planId,
              monthly_price: plan.currentPrice,
              is_legacy_price: true
            })
            .eq('id', existingSubscription.id);

          if (error) throw error;
        } else {
          const plan = plans.find(p => p.id === planId);
          if (!plan) return;

          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 14);

          const { error } = await supabase
            .from('subscriptions')
            .insert({
              company_id: profile.company_id,
              plan_type: planId,
              subscription_status: 'trial',
              trial_start_date: new Date().toISOString(),
              trial_end_date: trialEndDate.toISOString(),
              monthly_price: plan.currentPrice,
              is_legacy_price: true
            });

          if (error) throw error;
        }

        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error creating trial:', error);
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            Augmentation dans {daysUntilIncrease} jours
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Les Offres Belleya
          </h1>

          <p className="text-xl text-slate-600 mb-6">
            Choisis l'offre qui correspond à ton ambition
          </p>

          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-full font-medium shadow-lg">
            <Sparkles className="w-5 h-5" />
            14 jours gratuits - accès complet - sans engagement
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                plan.popular ? 'ring-4 ring-amber-400' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-bl-2xl font-medium text-sm">
                  Le + populaire
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  {plan.icon}
                  <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-slate-900">{plan.currentPrice}€</span>
                    <span className="text-slate-600">/mois</span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Bientôt {plan.futurePrice}€ - Prix bloqué à vie pour les premières inscrites
                  </p>
                </div>

                <p className="text-slate-600 mb-6 min-h-[60px]">
                  {plan.description}
                </p>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading && selectedPlan === plan.id}
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-xl hover:scale-105'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading && selectedPlan === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Activation...
                    </span>
                  ) : (
                    'Commencer gratuitement'
                  )}
                </button>

                <div className="mt-8 space-y-3">
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 ${
                        feature.startsWith('✨') ? 'pt-4 border-t border-slate-200 font-semibold text-slate-900' : ''
                      }`}
                    >
                      {!feature.startsWith('✨') && (
                        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${feature.startsWith('✨') ? 'text-slate-900' : 'text-slate-600'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Pourquoi Belleya ?</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">14 jours</div>
              <p className="text-slate-300">D'essai gratuit sans engagement</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-400 mb-2">Prix bloqué</div>
              <p className="text-slate-300">À vie pour les premières inscrites</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">Support 24/48h</div>
              <p className="text-slate-300">Équipe réactive sur WhatsApp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
