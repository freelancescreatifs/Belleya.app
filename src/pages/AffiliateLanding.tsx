import {
  ArrowRight, CheckCircle, DollarSign, Link2, BarChart3,
  MessageSquare, BookOpen, Headphones, X, TrendingUp, Zap, Target,
  ChevronRight, HelpCircle, Sparkles, LogIn, LayoutDashboard, Handshake,
  Star, Award, Shield
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
      a: 'Non. C\'est un programme partenaire independant. Tu es libre de gerer ton activite comme tu le souhaites.'
    },
    {
      q: 'Quand suis-je paye(e) ?',
      a: 'Paiement mensuel sur les abonnements actifs de tes filleules.'
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
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          20% { transform: translate(1%, 0%); }
          30% { transform: translate(0%, 1%); }
          40% { transform: translate(-1%, 1%); }
          50% { transform: translate(1%, -1%); }
        }
        .float-blob { animation: float 6s ease-in-out infinite; }
        .float-blob-delayed { animation: float 8s ease-in-out 2s infinite; }
        .cta-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .cta-glow:hover { animation: none; box-shadow: 0 20px 60px rgba(196,53,134,0.5); }
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
      `}</style>

      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Belaya" className="h-10 w-auto" />
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
              className={`text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 mb-8 leading-[1.15] tracking-tight transition-all duration-700 delay-150 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Gagne un revenu mensuel{' '}
              <span className="bg-gradient-to-r from-belaya-deep via-belaya-bright to-belaya-deep bg-clip-text text-transparent bg-[length:200%_auto]">
                recurrent
              </span>{' '}
              en recommandant Belaya
            </h1>

            <p
              className={`text-lg md:text-xl text-gray-500 mb-5 max-w-2xl mx-auto leading-relaxed font-light transition-all duration-700 delay-300 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Rejoins le programme partenaire Belaya et touche{' '}
              <strong className="text-gray-800 font-semibold">10% de commission</strong>{' '}
              pendant toute la duree d'abonnement des clientes que tu apportes.
            </p>

            <p
              className={`text-2xl md:text-3xl font-bold text-belaya-deep mb-12 transition-all duration-700 delay-[450ms] ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Potentiel : 500 a 2 000+ EUR / mois
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

      <section className="py-6 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8 md:gap-16 text-center flex-wrap">
            {[
              { val: '10%', label: 'commission recurrente' },
              { val: '29 EUR', label: '/ mois par abonnee' },
              { val: '0 EUR', label: 'investissement initial' },
              { val: '48h', label: 'delai de validation' },
            ].map((s, i) => (
              <div key={i} className="py-3">
                <p className="text-xl md:text-2xl font-bold text-gray-900">{s.val}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                { icon: DollarSign, title: '10% sur chaque abonnement', desc: 'Commission recurrente tant que la cliente reste abonnee. Pas de one-shot.', accent: 'from-rose-500 to-pink-500' },
                { icon: Target, title: '2,90 EUR / mois / cliente', desc: 'Montant fixe et previsible par abonnement actif genere.', accent: 'from-belaya-deep to-belaya-bright' },
                { icon: TrendingUp, title: 'Revenu cumulatif', desc: 'Tes commissions augmentent chaque mois si tes clientes restent.', accent: 'from-emerald-500 to-teal-500' }
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

      <section className="py-24 md:py-32 bg-[#fafafa]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <RevealSection>
              <div className="text-center mb-16">
                <span className="text-sm font-medium text-belaya-deep bg-belaya-50 px-4 py-1.5 rounded-full border border-belaya-100 inline-block mb-5">
                  Simulation
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Combien tu peux gagner
                </h2>
              </div>
            </RevealSection>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { amount: 290, subs: 100, label: 'Starter' },
                { amount: 870, subs: 300, label: 'Pro' },
                { amount: 1450, subs: 500, label: 'Elite' }
              ].map((tier, i) => (
                <RevealSection key={i} delay={100 + i * 150}>
                  <div
                    className={`relative rounded-2xl p-8 text-center transition-all duration-400 ${
                      i === 2
                        ? 'bg-gradient-to-br from-belaya-deep via-belaya-bright to-belaya-deep text-white shadow-2xl hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(196,53,134,0.3)]'
                        : 'bg-white border border-gray-100 shadow-sm hover:-translate-y-2 hover:shadow-lg hover:border-belaya-100'
                    }`}
                  >
                    {i === 2 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-belaya-deep text-xs font-bold px-4 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        POPULAIRE
                      </div>
                    )}
                    <p className={`text-xs font-medium uppercase tracking-widest mb-4 ${i === 2 ? 'text-white/70' : 'text-gray-400'}`}>
                      {tier.label}
                    </p>
                    <p className={`text-4xl md:text-5xl font-extrabold mb-1 ${i === 2 ? 'text-white' : 'text-gray-900'}`}>
                      <AnimatedCounter target={tier.amount} suffix=" EUR" />
                    </p>
                    <p className={`text-sm ${i === 2 ? 'text-white/80' : 'text-gray-400'}`}>/ mois</p>
                    <div className={`w-10 h-px mx-auto my-5 ${i === 2 ? 'bg-white/20' : 'bg-gray-100'}`}></div>
                    <p className={`font-medium text-sm ${i === 2 ? 'text-white/90' : 'text-gray-600'}`}>
                      {tier.subs} abonnees actives
                    </p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

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
                { text: 'Presenter Belaya et ses avantages', icon: Sparkles },
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
                { level: 'Recrue', range: '0-9', rate: '10%', icon: Shield, color: 'gray' },
                { level: 'Closer', range: '10-49', rate: '12%', icon: Zap, color: 'blue' },
                { level: 'Pro', range: '50-149', rate: '15%', icon: Award, color: 'amber' },
                { level: 'Elite', range: '150+', rate: '15%+', icon: Star, color: 'rose' },
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
                      <p className="text-2xl font-extrabold text-gray-900">{tier.rate}</p>
                    </div>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </div>
      </section>

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
                        openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
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

      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-belaya-deep via-belaya-bright to-belaya-deep"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl float-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl float-blob-delayed"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05)_0%,transparent_50%)]"></div>

        <div className="container mx-auto px-4 relative">
          <RevealSection>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 text-white leading-tight">
                Pret(e) a demarrer ?
              </h2>
              <p className="text-lg md:text-xl mb-12 text-white/80 font-light max-w-xl mx-auto">
                Rejoins une equipe de partenaires ambitieux et commence a generer des commissions recurrentes.
              </p>
              <button
                onClick={onApply}
                className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-belaya-deep rounded-full font-bold text-lg shadow-2xl hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Je postule maintenant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
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
