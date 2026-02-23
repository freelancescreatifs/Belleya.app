import { useState } from 'react';
import { Check, Zap, Crown, Sparkles, Clock, LogOut, Star, AlertCircle } from 'lucide-react';
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
    icon: <Sparkles className="w-8 h-8 text-belleya-bright" />,
    popular: false,
    description: 'Pour les indépendantes qui veulent structurer leur activité et arrêter de tout gérer à la main.',
    features: [
      '✅ Organisation & Structure',
      'Gestion des objectifs',
      'Gestion des tâches',
      'Agenda intelligent synchronisé',
      'Réservation en ligne',
      'Jusqu\'à 50 clientes',
      'Notifications automatiques',
      'Envoi automatique du récapitulatif client',
      'Suivi des transactions',
      'Dashboard financier clair',
      '📱 Réseaux sociaux intégrés',
      'Gestion des réseaux sociaux',
      'Calendrier éditorial',
      'Suggestions de sujets selon les événements de l\'année',
      'Boîte à idées IA adaptée à ton métier',
      'Stockage des inspirations (toi + clientes)',
      '💰 Gestion financière simplifiée',
      'Suivi des paiements',
      'Calculateur de rentabilité',
      'Adaptation selon ton statut',
      'Estimation automatique TVA / CFE',
      'Export & import complet des données',
      'Partenariat officiel Belleya',
      'Support WhatsApp 48h',
      '🎯 Idéal pour se structurer dès le départ'
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
      '💼 Business & Clients',
      'Clientes illimitées',
      'Gestion des acomptes',
      'Gestion élèves / formations',
      'Historique détaillé client',
      'Système de fidélisation',
      'Gestion des stocks',
      'Gestion complète des finances',
      '📈 Croissance & Marketing',
      'Marketing automatique par email',
      'Emails anniversaires & relances',
      'Partenariat officiel Belleya',
      'Visibilité sur la plateforme sociale Belleya',
      'Outils d\'optimisation conversion',
      '💰 Finance avancée',
      'Calcul automatique charges & cotisations',
      'Exports comptables',
      'Export & import simplifié',
      'Support WhatsApp 24H',
      '🎯 Idéal pour augmenter ton chiffre d\'affaires'
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
      '🚀 Expansion & Automatisation',
      'Marketing automatisé avancé',
      'Campagnes multi-canaux (SMS + Email)',
      'Optimisation conversion client',
      'Rappels intelligents (anniversaires, relances)',
      '🤝 Revenus complémentaires',
      'Partenariat officiel Belleya',
      'Gestion des Revenus d\'affiliation de vos partenaires',
      'Mise en avant premium sur la plateforme',
      'Visibilité renforcée côté client',
      '⚡ Support prioritaire express',
      '🎯 Idéal pour remplir automatiquement ton agenda et scaler'
    ]
  }
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysUntilIncrease] = useState(30);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  async function handleSelectPlan(planId: string) {
    setSelectedPlan(planId);
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/';
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
        body: { planId },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Erreur lors de la creation de la session');
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Aucune URL de paiement retournee');
      }
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#efaa9a]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Bouton déconnexion */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-belleya-deep transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            Augmentation dans {daysUntilIncrease} jours
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Les Offres Belleya
          </h1>

          <p className="text-xl text-slate-600 mb-6">
            Choisis l'offre qui correspond à ton ambition
          </p>

          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-belleya-bright to-belleya-vivid text-white px-6 py-3 rounded-full font-medium shadow-lg">
            <Sparkles className="w-5 h-5" />
            14 jours gratuits - accès complet - sans engagement
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-lg font-bold">&times;</button>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 mb-12 mt-8">
          {plans.map((plan) => {
            const isEmpire = plan.id === 'empire';
            return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl shadow-xl transition-all duration-300 hover:shadow-2xl flex flex-col ${
                plan.popular ? 'border-2 border-amber-400 md:transform md:scale-105 mt-6' :
                isEmpire ? 'border-2 border-belleya-deep mt-6' : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg whitespace-nowrap">
                  <Star className="w-4 h-4" />
                  Le plus choisi
                </div>
              )}
              {isEmpire && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-belleya-deep to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg whitespace-nowrap">
                  <Crown className="w-4 h-4" />
                  Premium
                </div>
              )}

              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  {plan.icon}
                  <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold text-slate-900">{plan.currentPrice}</span>
                    <span className="text-slate-600">€/mois</span>
                    <span className="text-2xl font-semibold text-gray-400 line-through ml-1">{plan.futurePrice}€</span>
                  </div>
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
                      : isEmpire
                      ? 'bg-gradient-to-r from-belleya-deep to-purple-600 text-white hover:shadow-xl hover:scale-105'
                      : 'bg-gradient-to-r from-belleya-deep to-belleya-bright text-white hover:shadow-xl hover:scale-105'
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
                  {plan.features.map((feature, index) => {
                    const isSectionTitle = feature.startsWith('✨') || feature.startsWith('✅') ||
                                          feature.startsWith('📱') || feature.startsWith('💰') ||
                                          feature.startsWith('💼') || feature.startsWith('📈') ||
                                          feature.startsWith('🚀') || feature.startsWith('🤝') ||
                                          feature.startsWith('⚡') || feature.startsWith('🎯');

                    return (
                      <div
                        key={index}
                        className={`flex items-start gap-3 ${
                          isSectionTitle ? 'pt-4 border-t border-slate-200 font-semibold text-slate-900' : ''
                        }`}
                      >
                        {!isSectionTitle && (
                          <Check className="w-5 h-5 text-belleya-vivid flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${isSectionTitle ? 'text-slate-900' : 'text-slate-600'}`}>
                          {feature}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )})}
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
          <div className="bg-gradient-to-r from-belleya-deep to-belleya-bright p-6 text-white">
            <h3 className="text-2xl font-bold text-center">Tableau comparatif</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Fonctionnalités</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-belleya-bright">START</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-amber-600">STUDIO</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-purple-600">EMPIRE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Nombre de clientes</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-900">50</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-900">Illimité</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-900">Illimité</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Agenda intelligent</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Réservation en ligne</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Réseaux sociaux & calendrier éditorial</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Boîte à idées IA</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Gestion des acomptes</td>
                  <td className="px-6 py-4 text-center text-slate-400">-</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Gestion élèves / formations</td>
                  <td className="px-6 py-4 text-center text-slate-400">-</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Marketing automatique</td>
                  <td className="px-6 py-4 text-center text-slate-400">-</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Système de fidélisation</td>
                  <td className="px-6 py-4 text-center text-slate-400">-</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Campagnes SMS + Email</td>
                  <td className="px-6 py-4 text-center text-slate-400">-</td>
                  <td className="px-6 py-4 text-center text-slate-400">-</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Partenariat officiel Belleya</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Gestion des Revenus d'affiliation de vos partenaires</td>
                  <td className="px-6 py-4 text-center text-slate-400">-</td>
                  <td className="px-6 py-4 text-center text-slate-400">-</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Support</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-900">48h</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-900">24h</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-900">Prioritaire</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gradient-to-r from-belleya-deep to-belleya-bright rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Pourquoi Belleya ?</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-white mb-2">14 jours</div>
              <p className="text-white/90">D'essai gratuit sans engagement</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">Prix bloqué</div>
              <p className="text-white/90">Le prix auquel vous avez souscris restera le même, vous n'aurez pas d'augmentation future dessus</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">Support 24/48h</div>
              <p className="text-white/90">Équipe réactive sur WhatsApp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
