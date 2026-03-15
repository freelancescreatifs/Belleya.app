import {
  ArrowRight, CheckCircle, DollarSign, Link2, BarChart3,
  MessageSquare, BookOpen, Headphones, X, TrendingUp, Zap, Target,
  ChevronRight, HelpCircle, Sparkles, LogIn, LayoutDashboard, Handshake,
  Star, Award, Shield, ExternalLink, Euro
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AffiliateLandingProps {
  onApply: () => void;
  onDashboard?: () => void;
}

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function RevealSection({ children, className = '', delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1200;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target]);

  return <span ref={ref}>{count.toLocaleString('fr-FR')}{suffix}</span>;
}

export default function AffiliateLanding({ onApply, onDashboard }: AffiliateLandingProps) {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const faqs = [
    {
      q: 'Est-ce un emploi salarie ?',
      a: 'Non. C\'est un programme partenaire independant. Tu es libre de gerer ton activite comme tu le souhaites, sans contrainte d\'horaires ni de lieu.'
    },
    {
      q: 'Quand suis-je paye(e) ?',
      a: 'Paiement mensuel sur les abonnements actifs de tes filleules. Tant qu\'elles restent abonnees, tu touches ta commission.'
    },
    {
      q: 'Sur quel plan suis-je commissionne(e) ?',
      a: 'Sur tous les plans actifs : Belaya Start (29€/mois), Belaya Studio (39€/mois) et Belaya Empire (59€/mois). Une cliente sur le plan Empire te rapporte 5,90€ chaque mois, sans refaire la vente. Nous te recommendons de cibler le plan Empire pour maximiser tes revenus.'
    },
    {
      q: 'Si une cliente upgrade son plan, je gagne plus ?',
      a: 'Oui. Si ta filleule passe du plan Start (29€) au plan Empire (59€), ta commission mensuelle double automatiquement. Les upgrades jouent en ta faveur.'
    },
    {
      q: 'Les commissions sont-elles limitees ?',
      a: 'Non. Il n\'y a aucune limite au nombre de clientes que tu peux apporter ni au montant de commissions que tu peux generer.'
    },
    {
      q: 'Y a-t-il un plafond ?',
      a: 'Non. Tes commissions sont proportionnelles au nombre d\'abonnements actifs que tu generes. Plus tu en apportes, plus tu gagnes.'
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 10px 40px rgba(196,53,134,0.3); }
          50% { box-shadow: 0 15px 60px rgba(196,53,134,0.5); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes price-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .float-blob { animation: float 6s ease-in-out infinite; }
        .float-blob-delayed { animation: float 8s ease-in-out 2s infinite; }
        .cta-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .cta-glow:hover { animation: none; box-shadow: 0 20px 60px rgba(196,53,134,0.5); }
        .price-pulse { animation: price-pulse 3s ease-in-out infinite; }
        .feature-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px rgba(0,0,0,0.06);
        }
        .step-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .step-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }
        .plan-card {
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .plan-card:hover {
          transform: translateY(-6px);
        }
      `}</style>

      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/belaya_logo.png" alt="Belaya" className="h-10 w-auto" />
            <span className="hidden sm:inline-block text-xs font-medium text-belaya-deep bg-belaya-50 px-2.5 py-1 rounded-full border border-belaya-100">
              Partenaire
            </span>
          </a>
          <div className="flex items-center gap-2.5">
            {user && onDashboard ? (
              <button
                onClick={onDashboard}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full font-semibold text-sm hover:bg-gray-800 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <LayoutDashboard className="w-4 h-4" />
                Mon Dashboard
              </button>
            ) : (
              <button
                onClick={onDashboard || onApply}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 rounded-full font-medium text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
              >
                <LogIn className="w-4 h-4" />
                Connexion
              </button>
            )}
            <button
              onClick={onApply}
              className="px-6 py-2.5 bg-gradient-to-r from-belaya-deep to-belaya-bright text-white rounded-full font-semibold text-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Je postule
            </button>
          </div>
        </div>
      </header>

      {/* HERO -- 59€ anchor strategy */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fdf2f8] via-white to-[#fce4ec]/20"></div>
        <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-gradient-to-br from-belaya-100/40 to-belaya-50/20 rounded-full blur-3xl float-blob"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-belaya-50/40 to-transparent rounded-full blur-3xl float-blob-delayed"></div>
        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-belaya-300 rounded-full opacity-40 float-blob"></div>
        <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-belaya-200 rounded-full opacity-30 float-blob-delayed"></div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className={`inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm text-belaya-deep px-5 py-2.5 rounded-full text-sm font-medium mb-10 border border-belaya-100 shadow-sm transition-all duration-700 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Programme Partenaire Belaya
            </div>

            <h1
              className={`text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 mb-6 leading-[1.15] tracking-tight transition-all duration-700 delay-150 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Chaque abonnement Belaya vaut{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-belaya-deep via-belaya-bright to-belaya-deep bg-clip-text text-transparent bg-[length:200%_auto] price-pulse">
                  59€/mois
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-belaya-deep to-belaya-bright rounded-full"></span>
              </span>
              {' '}— tu en touches une part, pour toujours.
            </h1>

            <p
              className={`text-lg md:text-xl text-gray-500 mb-4 max-w-2xl mx-auto leading-relaxed font-light transition-all duration-700 delay-300 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Recommande Belaya aux entrepreneuses beaute et touche{' '}
              <strong className="text-gray-800 font-semibold">10% de commission recurrente</strong>{' '}
              pendant toute la duree de leur abonnement.
            </p>

            {/* Concrete math line */}
            <div
              className={`inline-flex items-center gap-3 bg-white border border-belaya-100 rounded-2xl px-6 py-4 mb-10 shadow-sm transition-all duration-700 delay-[400ms] ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-semibold text-gray-700">1 cliente</span>
                <span>=</span>
                <span className="font-bold text-belaya-deep">5,90€/mois</span>
              </div>
              <div className="w-px h-4 bg-gray-200"></div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-semibold text-gray-700">50 clientes</span>
                <span>=</span>
                <span className="font-bold text-belaya-deep">295€/mois</span>
              </div>
              <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                <span className="font-semibold text-gray-700">200 clientes</span>
                <span>=</span>
                <span className="font-bold text-belaya-deep">1 180€/mois</span>
              </div>
            </div>

            <p
              className={`text-2xl md:text-3xl font-bold text-belaya-deep mb-12 transition-all duration-700 delay-[500ms] ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Potentiel : 500 a 2 000€+ / mois
            </p>

            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-[600ms] ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <button
                onClick={onApply}
                className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-belaya-deep to-belaya-bright text-white rounded-full font-bold text-lg cta-glow transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                Je postule maintenant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              <span className="text-sm text-gray-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Gratuit, sans engagement
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR -- corrected with 59€ anchor */}
      <section className="py-6 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6 md:gap-14 text-center flex-wrap">
            {[
              { val: '59€', label: 'plan Empire / mois' },
              { val: '5,90€', label: 'commission par abonnee Empire' },
              { val: '10%', label: 'commission recurrente' },
              { val: '0€', label: 'investissement initial' },
            ].map((s, i) => (
              <div key={i} className="py-3">
                <p className="text-xl md:text-2xl font-bold text-gray-900">{s.val}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CE QUE TU VENDS -- new product anchor section */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <RevealSection>
              <div className="text-center mb-14">
                <span className="text-sm font-medium text-belaya-deep bg-belaya-50 px-4 py-1.5 rounded-full border border-belaya-100 inline-block mb-5">
                  Le produit
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Ce que tu vends
                </h2>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto font-light">
                  Belaya est le logiciel tout-en-un des entrepreneuses beaute. CRM, agenda, finances, contenu IA — une seule app, un seul abonnement.
                </p>
              </div>
            </RevealSection>

            <div className="grid md:grid-cols-3 gap-5 mb-10">
              {[
                {
                  name: 'Belaya Start',
                  price: '29€',
                  badge: null,
                  commission: '2,90€',
                  description: 'Ideal pour les debutantes ou les freelances qui demarrent leur activite beaute.',
                  features: ['Agenda & reservations', 'CRM client de base', 'Suivi financier'],
                  accent: 'border-gray-200',
                  badgeBg: '',
                  priceColor: 'text-gray-900',
                  commissionColor: 'bg-gray-50 border-gray-100 text-gray-600',
                },
                {
                  name: 'Belaya Studio',
                  price: '39€',
                  badge: 'Le plus choisi',
                  commission: '3,90€',
                  description: 'Pour les techniciennes en croissance qui veulent professionnaliser leur gestion.',
                  features: ['Tout Start +', 'Galerie avant/apres', 'Marketing & relances'],
                  accent: 'border-belaya-200',
                  badgeBg: 'bg-belaya-50 text-belaya-deep',
                  priceColor: 'text-belaya-deep',
                  commissionColor: 'bg-belaya-50 border-belaya-100 text-belaya-deep',
                },
                {
                  name: 'Belaya Empire',
                  price: '59€',
                  badge: 'Max commission',
                  commission: '5,90€',
                  description: 'Pour les pros ambitieuses qui veulent tout : contenu IA, objectifs, partenariats.',
                  features: ['Tout Studio +', 'IA Contenu & idees', 'Formations & objectifs'],
                  accent: 'border-[#711341]',
                  badgeBg: 'bg-gradient-to-r from-belaya-deep to-belaya-bright text-white',
                  priceColor: 'text-belaya-deep',
                  commissionColor: 'bg-gradient-to-r from-belaya-deep to-belaya-bright text-white border-transparent',
                },
              ].map((plan, i) => (
                <RevealSection key={i} delay={100 + i * 120}>
                  <div className={`plan-card bg-white rounded-2xl border-2 ${plan.accent} p-7 h-full flex flex-col shadow-sm ${i === 2 ? 'shadow-md ring-1 ring-belaya-100' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{plan.name}</p>
                        <p className={`text-4xl font-extrabold ${plan.priceColor}`}>{plan.price}<span className="text-base font-normal text-gray-400">/mois</span></p>
                      </div>
                      {plan.badge && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${plan.badgeBg}`}>
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-5 leading-relaxed flex-1">{plan.description}</p>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f, fi) => (
                        <li key={fi} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${plan.commissionColor}`}>
                      <span className="text-xs font-medium opacity-80">Ta commission / mois</span>
                      <span className="text-lg font-extrabold">{plan.commission}</span>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>

            <RevealSection delay={400}>
              <div className="text-center">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 border-2 border-belaya-deep text-belaya-deep rounded-full font-semibold text-sm hover:bg-belaya-deep hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 group"
                >
                  <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                  Voir le site Belaya.app
                </a>
                <p className="text-xs text-gray-400 mt-2">Explore le produit que tu vas recommander</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* OPPORTUNITY */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <RevealSection>
              <div className="text-center mb-16">
                <span className="text-sm font-medium text-belaya-deep bg-belaya-50 px-4 py-1.5 rounded-full border border-belaya-100 inline-block mb-5">
                  Opportunite
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Pourquoi c'est une vraie opportunite
                </h2>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto font-light">
                  Belaya est la plateforme des entrepreneuses beaute : nail artists, techniciennes cils,
                  estheticiennes. Un marche en pleine croissance.
                </p>
              </div>
            </RevealSection>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Euro,
                  title: '59€/mois = 5,90€ pour toi',
                  desc: 'Le plan Empire te rapporte 5,90€ par mois par cliente. Sans relance. Sans re-vendre. En automatique.',
                  accent: 'from-belaya-deep to-belaya-bright'
                },
                {
                  icon: TrendingUp,
                  title: 'Revenu cumulatif illimite',
                  desc: 'Chaque mois ou ta filleule reste abonnee, tu gagnes. Pas de one-shot : ton portefeuille grossit dans le temps.',
                  accent: 'from-emerald-500 to-teal-500'
                },
                {
                  icon: Target,
                  title: 'Marche sous-exploite',
                  desc: 'Des milliers de nail artists, techniciennes cils et estheticiennes en France — et la majorite n\'ont aucun outil de gestion. Tu arrives avec la solution.',
                  accent: 'from-rose-500 to-pink-500'
                }
              ].map((card, i) => (
                <RevealSection key={i} delay={150 + i * 100}>
                  <div className="feature-card bg-white rounded-2xl p-7 border border-gray-100 shadow-sm h-full relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.accent} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                    <div className="w-12 h-12 bg-gradient-to-br from-belaya-50 to-belaya-100/50 rounded-xl flex items-center justify-center mb-5">
                      <card.icon className="w-6 h-6 text-belaya-deep" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SIMULATION */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <RevealSection>
              <div className="text-center mb-4">
                <span className="text-sm font-medium text-belaya-deep bg-belaya-50 px-4 py-1.5 rounded-full border border-belaya-100 inline-block mb-5">
                  Simulation
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Combien tu peux gagner
                </h2>
                <p className="text-gray-500 font-light text-sm">Base : plan Empire a 59€/mois — commission 10%</p>
              </div>
            </RevealSection>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {[
                {
                  amount: 177,
                  subs: 30,
                  label: 'Starter',
                  math: '30 x 59€ x 10%',
                  note: 'Quelques heures de prospection par semaine'
                },
                {
                  amount: 590,
                  subs: 100,
                  label: 'Pro',
                  math: '100 x 59€ x 10%',
                  note: 'Un revenu complementaire serieux'
                },
                {
                  amount: 1770,
                  subs: 300,
                  label: 'Elite',
                  math: '300 x 59€ x 10%',
                  note: 'L\'equivalence d\'un salaire'
                }
              ].map((tier, i) => (
                <RevealSection key={i} delay={100 + i * 150}>
                  <div
                    className={`relative rounded-2xl p-8 text-center transition-all duration-400 ${
                      i === 1
                        ? 'bg-gradient-to-br from-belaya-deep via-belaya-bright to-belaya-deep text-white shadow-2xl hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(196,53,134,0.3)]'
                        : 'bg-white border border-gray-100 shadow-sm hover:-translate-y-2 hover:shadow-lg hover:border-belaya-100'
                    }`}
                  >
                    {i === 1 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-belaya-deep text-xs font-bold px-4 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        OBJECTIF CIBLE
                      </div>
                    )}
                    <p className={`text-xs font-medium uppercase tracking-widest mb-4 ${i === 1 ? 'text-white/70' : 'text-gray-400'}`}>
                      {tier.label}
                    </p>
                    <p className={`text-4xl md:text-5xl font-extrabold mb-1 ${i === 1 ? 'text-white' : 'text-gray-900'}`}>
                      <AnimatedCounter target={tier.amount} suffix="€" />
                    </p>
                    <p className={`text-sm ${i === 1 ? 'text-white/80' : 'text-gray-400'}`}>/ mois</p>
                    <div className={`w-10 h-px mx-auto my-4 ${i === 1 ? 'bg-white/20' : 'bg-gray-100'}`}></div>
                    <p className={`font-medium text-sm mb-2 ${i === 1 ? 'text-white/90' : 'text-gray-600'}`}>
                      {tier.subs} abonnees actives
                    </p>
                    <p className={`text-xs font-mono px-3 py-1.5 rounded-lg inline-block ${i === 1 ? 'bg-white/10 text-white/70' : 'bg-gray-50 text-gray-400'}`}>
                      {tier.math}
                    </p>
                    <p className={`text-xs mt-3 italic ${i === 1 ? 'text-white/60' : 'text-gray-400'}`}>
                      {tier.note}
                    </p>
                  </div>
                </RevealSection>
              ))}
            </div>

            <RevealSection delay={500}>
              <div className="mt-8 bg-white rounded-2xl border border-belaya-100 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 bg-belaya-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-belaya-deep" />
                </div>
                <p className="text-sm text-gray-600">
                  <strong className="text-gray-900">Note :</strong> Les simulations ci-dessus sont basees sur le plan Empire (59€/mois). Si tes filleules choisissent le plan Start (29€) ou Studio (39€), les commissions s'ajustent proportionnellement. Les upgrades augmentent ta commission automatiquement.
                </p>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* MISSIONS */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <RevealSection>
              <div className="text-center mb-16">
                <span className="text-sm font-medium text-belaya-deep bg-belaya-50 px-4 py-1.5 rounded-full border border-belaya-100 inline-block mb-5">
                  Missions
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Ce que tu feras au quotidien
                </h2>
              </div>
            </RevealSection>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { text: 'Prospecter des entrepreneuses beaute', icon: Target },
                { text: 'Presenter Belaya et ses plans (29€ a 59€)', icon: Sparkles },
                { text: 'Expliquer la valeur de la plateforme', icon: MessageSquare },
                { text: 'Accompagner jusqu\'a l\'inscription', icon: CheckCircle }
              ].map((task, i) => (
                <RevealSection key={i} delay={i * 100}>
                  <div className="flex items-center gap-4 bg-gradient-to-r from-gray-50 to-white rounded-xl p-5 border border-gray-100 hover:border-belaya-200 hover:from-belaya-50/30 hover:to-white transition-all duration-300 group">
                    <div className="w-10 h-10 bg-belaya-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-belaya-200 transition-colors duration-300">
                      <task.icon className="w-5 h-5 text-belaya-deep" />
                    </div>
                    <p className="text-gray-800 font-medium">{task.text}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TOOLKIT */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <RevealSection>
              <div className="text-center mb-16">
                <span className="text-sm font-medium text-belaya-deep bg-belaya-50 px-4 py-1.5 rounded-full border border-belaya-100 inline-block mb-5">
                  Toolkit
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Tous les outils pour reussir
                </h2>
              </div>
            </RevealSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Link2, label: 'Lien d\'affiliation unique', desc: 'Un lien personnalise a partager' },
                { icon: BarChart3, label: 'Dashboard en temps reel', desc: 'Suis tes stats live' },
                { icon: DollarSign, label: 'Suivi des commissions', desc: 'Transparence totale' },
                { icon: MessageSquare, label: 'Scripts de prospection', desc: 'Messages prets a l\'emploi' },
                { icon: BookOpen, label: 'Formation d\'integration', desc: 'Demarre du bon pied' },
                { icon: Headphones, label: 'Support dedie', desc: 'Une equipe a tes cotes' }
              ].map((tool, i) => (
                <RevealSection key={i} delay={i * 80}>
                  <div className="feature-card flex items-start gap-4 bg-white rounded-xl p-5 border border-gray-100 shadow-sm h-full">
                    <div className="w-10 h-10 bg-gradient-to-br from-belaya-50 to-belaya-100/50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <tool.icon className="w-5 h-5 text-belaya-deep" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold text-sm mb-0.5">{tool.label}</p>
                      <p className="text-gray-400 text-xs">{tool.desc}</p>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LEVELS */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <RevealSection>
              <div className="text-center mb-16">
                <span className="text-sm font-medium text-belaya-deep bg-belaya-50 px-4 py-1.5 rounded-full border border-belaya-100 inline-block mb-5">
                  Niveaux
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Evolue, gagne plus
                </h2>
                <p className="text-gray-500 font-light max-w-xl mx-auto">
                  Plus tu apportes d'abonnees, plus ton taux de commission augmente.
                </p>
              </div>
            </RevealSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { level: 'Recrue', range: '0-9', rate: '10%', example: '5,90€/sub', icon: Shield, color: 'gray' },
                { level: 'Closer', range: '10-49', rate: '12%', example: '7,08€/sub', icon: Zap, color: 'blue' },
                { level: 'Pro', range: '50-149', rate: '15%', example: '8,85€/sub', icon: Award, color: 'amber' },
                { level: 'Elite', range: '150+', rate: '15%+', example: '8,85€+/sub', icon: Star, color: 'rose' },
              ].map((tier, i) => {
                const bgMap: Record<string, string> = {
                  gray: 'from-gray-50 to-gray-100/50 border-gray-200',
                  blue: 'from-blue-50 to-cyan-50 border-blue-200',
                  amber: 'from-amber-50 to-orange-50 border-amber-200',
                  rose: 'from-belaya-50 to-pink-50 border-belaya-200',
                };
                const iconBgMap: Record<string, string> = {
                  gray: 'bg-gray-200 text-gray-600',
                  blue: 'bg-blue-100 text-blue-600',
                  amber: 'bg-amber-100 text-amber-600',
                  rose: 'bg-belaya-100 text-belaya-deep',
                };
                return (
                  <RevealSection key={i} delay={i * 100}>
                    <div className={`feature-card bg-gradient-to-br ${bgMap[tier.color]} rounded-2xl p-6 border text-center h-full`}>
                      <div className={`w-12 h-12 ${iconBgMap[tier.color]} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                        <tier.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-1">{tier.level}</h3>
                      <p className="text-xs text-gray-400 mb-3">{tier.range} abonnees</p>
                      <p className="text-2xl font-extrabold text-gray-900 mb-1">{tier.rate}</p>
                      <p className="text-xs text-gray-500 font-mono">{tier.example}</p>
                    </div>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FOR WHO */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <RevealSection>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Pas pour tout le monde
                </h2>
                <p className="text-gray-500 font-light">On cherche des partenaires motives et serieux.</p>
              </div>
            </RevealSection>

            <div className="grid md:grid-cols-2 gap-6">
              <RevealSection delay={100}>
                <div className="bg-white rounded-2xl p-8 border border-red-100 hover:shadow-md transition-all duration-300 h-full">
                  <h3 className="text-base font-bold text-red-700 mb-6 flex items-center gap-2">
                    <X className="w-5 h-5" />
                    Ce n'est PAS pour toi si :
                  </h3>
                  <ul className="space-y-3.5">
                    {[
                      'Tu cherches un salaire fixe',
                      'Tu abandonnes vite',
                      'Tu manques de discipline'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-red-600 text-sm">
                        <div className="w-6 h-6 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <X className="w-3 h-3" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealSection>

              <RevealSection delay={250}>
                <div className="bg-white rounded-2xl p-8 border border-emerald-100 hover:shadow-md transition-all duration-300 h-full">
                  <h3 className="text-base font-bold text-emerald-700 mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    C'est pour toi si :
                  </h3>
                  <ul className="space-y-3.5">
                    {[
                      'Tu veux construire un revenu recurrent',
                      'Tu es a l\'aise en DM et prospection',
                      'Tu as un mindset performance'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-emerald-600 text-sm">
                        <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealSection>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <RevealSection>
              <div className="text-center mb-16">
                <span className="text-sm font-medium text-belaya-deep bg-belaya-50 px-4 py-1.5 rounded-full border border-belaya-100 inline-block mb-5">
                  Processus
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  En 4 etapes simples
                </h2>
              </div>
            </RevealSection>

            <StepperSection onApply={onApply} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <RevealSection>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Questions frequentes
                </h2>
              </div>
            </RevealSection>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <RevealSection key={i} delay={i * 80}>
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-all duration-300 shadow-sm">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                      <HelpCircle className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-45 text-belaya-deep' : ''}`} />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openFaq === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-5 pb-5">
                        <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-belaya-deep via-belaya-bright to-belaya-deep"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl float-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl float-blob-delayed"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05)_0%,transparent_50%)]"></div>

        <div className="container mx-auto px-4 relative">
          <RevealSection>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-white leading-tight">
                Pret(e) a demarrer ?
              </h2>
              <p className="text-lg md:text-xl mb-6 text-white/80 font-light max-w-xl mx-auto">
                Rejoins une equipe de partenaires ambitieux et commence a generer des commissions recurrentes.
              </p>

              {/* Final math reminder */}
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-3 mb-10">
                <p className="text-white/90 text-sm">
                  Une cliente sur le plan Empire = <strong className="text-white">5,90€/mois</strong> — chaque mois, sans refaire la vente.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={onApply}
                  className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-belaya-deep rounded-full font-bold text-lg shadow-2xl hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Je postule maintenant
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
                <span className="text-white/60 text-sm flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  Gratuit, sans engagement
                </span>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      <footer className="py-10 bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <Handshake className="w-5 h-5 text-belaya-bright" />
            <p className="text-white font-semibold text-lg">
              Deviens partenaire Belaya
            </p>
          </div>
          <p className="text-gray-500 text-sm">&copy; 2026 Belaya. Tous droits reserves.</p>
        </div>
      </footer>
    </div>
  );
}

function StepperSection({ onApply }: { onApply: () => void }) {
  const { ref, visible } = useScrollReveal(0.2);

  const steps = [
    { step: '01', title: 'Tu postules', desc: 'Remplis le formulaire de candidature en 2 minutes.' },
    { step: '02', title: 'On valide ton profil', desc: 'Notre equipe examine ta candidature sous 48h.' },
    { step: '03', title: 'Tu recois ton lien', desc: 'Ton lien d\'affiliation unique est active.' },
    { step: '04', title: 'Tu generes des commissions', desc: 'Chaque abonnement actif te rapporte 10% / mois.' }
  ];

  return (
    <div ref={ref}>
      <div className="hidden lg:flex items-center justify-between mb-8 px-12">
        {steps.map((_, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                visible ? 'bg-gradient-to-br from-belaya-deep to-belaya-bright text-white scale-100 shadow-md' : 'bg-gray-200 text-gray-400 scale-75'
              }`}
              style={{ transitionDelay: `${i * 200}ms` }}
            >
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-belaya-deep to-belaya-bright rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: visible ? '100%' : '0%',
                    transitionDelay: `${300 + i * 250}ms`
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`relative transition-all duration-500 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: `${200 + i * 150}ms` }}
          >
            <div className="step-card bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-full">
              <div className="text-4xl font-extrabold text-belaya-100/80 mb-4">{s.step}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
            {i < 3 && (
              <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                <ChevronRight className={`w-6 h-6 transition-all duration-500 ${
                  visible ? 'text-belaya-400 translate-x-0 opacity-100' : 'text-gray-300 -translate-x-2 opacity-0'
                }`} style={{ transitionDelay: `${400 + i * 200}ms` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
