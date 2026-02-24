import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, Zap, Crown, Sparkles, Clock, LogOut, Star, AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PricingProps {
  autoPlan?: string;
  onDone?: () => void;
}

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
    description: 'Pour les independantes qui veulent structurer leur activite et arreter de tout gerer a la main.',
    features: [
      '\u2705 Organisation & Structure',
      'Gestion des objectifs',
      'Gestion des taches',
      'Agenda intelligent synchronise',
      'Reservation en ligne',
      'Jusqu\'a 50 clientes',
      'Notifications automatiques',
      'Envoi automatique du recapitulatif client',
      'Suivi des transactions',
      'Dashboard financier clair',
      '\ud83d\udcf1 Reseaux sociaux integres',
      'Gestion des reseaux sociaux',
      'Calendrier editorial',
      'Suggestions de sujets selon les evenements de l\'annee',
      'Boite a idees IA adaptee a ton metier',
      'Stockage des inspirations (toi + clientes)',
      '\ud83d\udcb0 Gestion financiere simplifiee',
      'Suivi des paiements',
      'Calculateur de rentabilite',
      'Adaptation selon ton statut',
      'Estimation automatique TVA / CFE',
      'Export & import complet des donnees',
      'Partenariat officiel Belleya',
      'Support WhatsApp 48h',
      '\ud83c\udfaf Ideal pour se structurer des le depart'
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
      '\u2728 Tout Start inclus +',
      '\ud83d\udcbc Business & Clients',
      'Clientes illimitees',
      'Gestion des acomptes',
      'Gestion eleves / formations',
      'Historique detaille client',
      'Systeme de fidelisation',
      'Gestion des stocks',
      'Gestion complete des finances',
      '\ud83d\udcc8 Croissance & Marketing',
      'Marketing automatique par email',
      'Emails anniversaires & relances',
      'Partenariat officiel Belleya',
      'Visibilite sur la plateforme sociale Belleya',
      'Outils d\'optimisation conversion',
      '\ud83d\udcb0 Finance avancee',
      'Calcul automatique charges & cotisations',
      'Exports comptables',
      'Export & import simplifie',
      'Support WhatsApp 24H',
      '\ud83c\udfaf Ideal pour augmenter ton chiffre d\'affaires'
    ]
  },
  {
    id: 'empire',
    name: 'BELLEYA EMPIRE',
    currentPrice: 59,
    futurePrice: 79,
    icon: <Crown className="w-8 h-8 text-belleya-deep" />,
    popular: false,
    description: 'Pour celles qui veulent automatiser et generer des revenus recurrents.',
    features: [
      '\u2728 Tout Studio inclus +',
      '\ud83d\ude80 Expansion & Automatisation',
      'Marketing automatise avance',
      'Campagnes multi-canaux (SMS + Email)',
      'Optimisation conversion client',
      'Rappels intelligents (anniversaires, relances)',
      '\ud83e\udd1d Revenus complementaires',
      'Partenariat officiel Belleya',
      'Gestion des Revenus d\'affiliation de vos partenaires',
      'Mise en avant premium sur la plateforme',
      'Visibilite renforcee cote client',
      '\u26a1 Support prioritaire express',
      '\ud83c\udfaf Ideal pour remplir automatiquement ton agenda et scaler'
    ]
  }
];

const VALID_PLANS = ['start', 'studio', 'empire'];

async function waitForCompanyProfile(maxRetries = 10, delayMs = 1500): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  for (let i = 0; i < maxRetries; i++) {
    const { data } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.company_id) return data.company_id;
    if (i < maxRetries - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return null;
}

export default function Pricing({ autoPlan, onDone }: PricingProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoCheckoutLoading, setAutoCheckoutLoading] = useState(false);
  const [autoCheckoutStatus, setAutoCheckoutStatus] = useState('');
  const [autoCheckoutSeconds, setAutoCheckoutSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [daysUntilIncrease] = useState(30);
  const autoCheckoutTriggered = useRef(false);
  const abortRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cancelAutoCheckout = useCallback(() => {
    abortRef.current = true;
    setAutoCheckoutLoading(false);
    setAutoCheckoutStatus('');
    setAutoCheckoutSeconds(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoCheckoutTriggered.current) return;

    let planToUse: string | null = null;

    if (autoPlan && VALID_PLANS.includes(autoPlan)) {
      planToUse = autoPlan;
    } else {
      const params = new URLSearchParams(window.location.search);
      const urlPlan = params.get('plan');
      const auto = params.get('auto');
      if (auto === 'true' && urlPlan && VALID_PLANS.includes(urlPlan)) {
        planToUse = urlPlan;
      }
    }

    if (planToUse) {
      autoCheckoutTriggered.current = true;
      setAutoCheckoutLoading(true);
      handleSelectPlan(planToUse);
    }
  }, [autoPlan]);

  useEffect(() => {
    if (autoCheckoutLoading) {
      setAutoCheckoutSeconds(0);
      timerRef.current = setInterval(() => {
        setAutoCheckoutSeconds(prev => {
          if (prev >= 30) {
            cancelAutoCheckout();
            setError('Le processus a pris trop de temps. Veuillez reessayer en cliquant sur le plan souhaite.');
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoCheckoutLoading, cancelAutoCheckout]);

  async function handleLogout() {
    await supabase.auth.signOut();
    if (onDone) {
      onDone();
    } else {
      window.location.href = '/';
    }
  }

  async function handleSelectPlan(planId: string) {
    setSelectedPlan(planId);
    setLoading(true);
    setError(null);
    abortRef.current = false;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          localStorage.setItem('pending_plan', planId);
          window.location.href = '/';
          return;
        }
      }

      if (abortRef.current) return;

      setAutoCheckoutStatus('Preparation de votre espace...');
      const companyId = await waitForCompanyProfile(10, 1500);

      if (abortRef.current) return;

      if (!companyId) {
        throw new Error('Votre profil est en cours de creation. Veuillez patienter quelques secondes puis reessayer.');
      }

      setAutoCheckoutStatus('Connexion au paiement...');

      let lastError: string | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (abortRef.current) return;

        const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
          body: { planId },
        });

        if (fnError) {
          lastError = fnError.message || 'Erreur lors de la creation de la session';

          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          throw new Error(lastError);
        }

        if (data?.retry === true) {
          lastError = data.error || 'Profil en cours de creation';
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          throw new Error(lastError);
        }

        if (data?.url) {
          window.location.href = data.url;
          return;
        }

        throw new Error('Aucune URL de paiement retournee');
      }

      throw new Error(lastError || 'Echec apres plusieurs tentatives');
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez reessayer.');
      setAutoCheckoutLoading(false);
      setAutoCheckoutStatus('');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  }

  if (autoCheckoutLoading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#efaa9a]/10 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Loader2 className="w-12 h-12 text-belleya-deep animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Redirection vers le paiement...</h2>
          <p className="text-slate-600 mb-1">
            {autoCheckoutStatus || 'Veuillez patienter, nous preparons votre abonnement.'}
          </p>
          <p className="text-sm text-slate-400 mb-6">
            {autoCheckoutSeconds}s
          </p>
          <button
            onClick={() => {
              cancelAutoCheckout();
              if (onDone) onDone();
            }}
            className="text-sm text-slate-500 hover:text-slate-700 underline transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#efaa9a]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-end mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-belleya-deep transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se deconnecter
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
            Choisis l'offre qui correspond a ton ambition
          </p>

          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-belleya-bright to-belleya-vivid text-white px-6 py-3 rounded-full font-medium shadow-lg">
            <Sparkles className="w-5 h-5" />
            14 jours gratuits - acces complet - sans engagement
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 mb-2">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  autoCheckoutTriggered.current = false;
                }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reessayer
              </button>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-lg font-bold flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
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
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-belleya-deep to-belleya-bright text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg whitespace-nowrap">
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
                    <span className="text-slate-600">/mois</span>
                    <span className="text-2xl font-semibold text-gray-400 line-through ml-1">{plan.futurePrice}</span>
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
                      ? 'bg-gradient-to-r from-belleya-deep to-belleya-bright text-white hover:shadow-xl hover:scale-105'
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
                    const isSectionTitle = feature.startsWith('\u2728') || feature.startsWith('\u2705') ||
                                          feature.startsWith('\ud83d\udcf1') || feature.startsWith('\ud83d\udcb0') ||
                                          feature.startsWith('\ud83d\udcbc') || feature.startsWith('\ud83d\udcc8') ||
                                          feature.startsWith('\ud83d\ude80') || feature.startsWith('\ud83e\udd1d') ||
                                          feature.startsWith('\u26a1') || feature.startsWith('\ud83c\udfaf');

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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Fonctionnalites</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-belleya-bright">START</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-amber-600">STUDIO</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-belleya-deep">EMPIRE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Nombre de clientes</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-900">50</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-900">Illimite</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-900">Illimite</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Agenda intelligent</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Reservation en ligne</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Reseaux sociaux & calendrier editorial</td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-5 h-5 text-belleya-vivid mx-auto" /></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-slate-600">Boite a idees IA</td>
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
                  <td className="px-6 py-4 text-sm text-slate-600">Gestion eleves / formations</td>
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
                  <td className="px-6 py-4 text-sm text-slate-600">Systeme de fidelisation</td>
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
              <div className="text-3xl font-bold text-white mb-2">Prix bloque</div>
              <p className="text-white/90">Le prix auquel vous avez souscris restera le meme, vous n'aurez pas d'augmentation future dessus</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">Support 24/48h</div>
              <p className="text-white/90">Equipe reactive sur WhatsApp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
