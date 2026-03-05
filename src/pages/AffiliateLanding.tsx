import {
  ArrowRight, CheckCircle, DollarSign, Link2, BarChart3,
  MessageSquare, BookOpen, Headphones, X, TrendingUp, Zap, Target,
  ChevronRight, HelpCircle, Sparkles, LogIn, LayoutDashboard, Handshake
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
        @keyframes step-line {
          from { width: 0%; }
          to { width: 100%; }
        }
        .float-blob { animation: float 6s ease-in-out infinite; }
        .float-blob-delayed { animation: float 8s ease-in-out 2s infinite; }
        .cta-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .cta-glow:hover { animation: none; box-shadow: 0 20px 60px rgba(196,53,134,0.5); }
        .shimmer-text {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
          -webkit-background-clip: text;
        }
        .step-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .step-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
        .step-connector { height: 2px; background: linear-gradient(90deg, rgb(196,53,134), rgb(232,105,174)); }
      `}</style>

      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Belaya" className="h-10 w-auto" />
          </a>
          <div className="flex items-center gap-3">
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
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-full font-medium text-sm hover:bg-gray-50 transition-all duration-300"
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

      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-belaya-50/30"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-belaya-100/30 rounded-full blur-3xl float-blob"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-belaya-50/50 rounded-full blur-3xl float-blob-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-belaya-50/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className={`inline-flex items-center gap-2 bg-belaya-50 text-belaya-deep px-4 py-2 rounded-full text-sm font-medium mb-8 border border-belaya-200 transition-all duration-700 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <Zap className="w-4 h-4" />
              Programme Partenaire Belaya
            </div>

            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight transition-all duration-700 delay-150 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Gagne un revenu mensuel{' '}
              <span className="bg-gradient-to-r from-belaya-deep to-belaya-bright bg-clip-text text-transparent">
                recurrent
              </span>{' '}
              en recommandant Belaya
            </h1>

            <p
              className={`text-lg md:text-xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed transition-all duration-700 delay-300 ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Rejoins le programme partenaire Belaya et touche{' '}
              <strong className="text-gray-900">10% de commission</strong>{' '}
              pendant toute la duree d'abonnement des clientes que tu apportes.
            </p>

            <p
              className={`text-2xl md:text-3xl font-bold text-belaya-deep mb-10 transition-all duration-700 delay-[450ms] ${
                heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Potentiel : 500 a 2 000+ EUR / mois
            </p>

            <div
              className={`transition-all duration-700 delay-[600ms] ${
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
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Pourquoi c'est une vraie opportunite
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Belaya est une plateforme dediee aux entrepreneuses beaute : nail artists, techniciennes cils,
                  estheticiennes. Marche en forte croissance avec un besoin reel.
                </p>
              </div>
            </RevealSection>

            <RevealSection delay={100}>
              <div className="bg-gradient-to-br from-gray-50 to-belaya-50/30 rounded-2xl p-6 md:p-8 border border-gray-100 mb-8">
                <p className="text-center text-gray-600 mb-2">Abonnement plateforme</p>
                <p className="text-center text-5xl font-bold text-gray-900">29 EUR<span className="text-lg text-gray-500 font-normal"> / mois</span></p>
              </div>
            </RevealSection>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: DollarSign, title: '10% sur chaque abonnement actif', desc: 'Commission recurrente tant que la cliente reste abonnee.' },
                { icon: Target, title: '2,90 EUR par mois par cliente', desc: 'Montant fixe et previsible par abonnement actif.' },
                { icon: TrendingUp, title: 'Revenu cumulatif', desc: 'Tes commissions augmentent tant que tes clientes restent abonnees.' }
              ].map((card, i) => (
                <RevealSection key={i} delay={200 + i * 100}>
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                    <div className="w-12 h-12 bg-belaya-50 rounded-xl flex items-center justify-center mb-4">
                      <card.icon className="w-6 h-6 text-belaya-deep" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-gray-600 text-sm">{card.desc}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Combien tu peux gagner
                </h2>
              </div>
            </RevealSection>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { amount: 290, subs: 100 },
                { amount: 870, subs: 300 },
                { amount: 1450, subs: 500 }
              ].map((tier, i) => (
                <RevealSection key={i} delay={100 + i * 150}>
                  <div
                    className={`rounded-2xl p-8 text-center border-2 transition-all duration-300 hover:-translate-y-2 cursor-default ${
                      i === 2
                        ? 'bg-gradient-to-br from-belaya-deep to-belaya-bright text-white border-transparent shadow-xl hover:shadow-2xl'
                        : 'bg-white border-gray-200 hover:border-belaya-200 shadow-sm hover:shadow-lg'
                    }`}
                  >
                    <p className={`text-4xl md:text-5xl font-bold mb-2 ${i === 2 ? 'text-white' : 'text-gray-900'}`}>
                      <AnimatedCounter target={tier.amount} suffix=" EUR" />
                    </p>
                    <p className={`text-lg ${i === 2 ? 'text-white/90' : 'text-gray-500'}`}>/ mois</p>
                    <div className={`w-12 h-px mx-auto my-4 ${i === 2 ? 'bg-white/30' : 'bg-gray-200'}`}></div>
                    <p className={`font-medium ${i === 2 ? 'text-white/90' : 'text-gray-600'}`}>
                      {tier.subs} abonnees actives
                    </p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Ce que tu feras au quotidien
                </h2>
              </div>
            </RevealSection>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Prospecter des entrepreneuses beaute',
                'Presenter Belaya et ses avantages',
                'Expliquer la valeur de la plateforme',
                'Accompagner jusqu\'a l\'inscription'
              ].map((task, i) => (
                <RevealSection key={i} delay={i * 100}>
                  <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-belaya-200 hover:bg-belaya-50/20 transition-all duration-300">
                    <div className="w-10 h-10 bg-belaya-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-belaya-deep" />
                    </div>
                    <p className="text-gray-800 font-medium">{task}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Tous les outils pour reussir
                </h2>
              </div>
            </RevealSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Link2, label: 'Lien d\'affiliation unique' },
                { icon: BarChart3, label: 'Dashboard personnel' },
                { icon: DollarSign, label: 'Suivi clair de tes commissions' },
                { icon: MessageSquare, label: 'Scripts de prospection' },
                { icon: BookOpen, label: 'Mini formation d\'integration' },
                { icon: Headphones, label: 'Support dedie' }
              ].map((tool, i) => (
                <RevealSection key={i} delay={i * 80}>
                  <div className="flex items-center gap-4 bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <div className="w-10 h-10 bg-belaya-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <tool.icon className="w-5 h-5 text-belaya-deep" />
                    </div>
                    <p className="text-gray-800 font-medium text-sm">{tool.label}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <RevealSection>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Pas pour tout le monde
                </h2>
                <p className="text-gray-600">On cherche des partenaires motives et serieux.</p>
              </div>
            </RevealSection>

            <div className="grid md:grid-cols-2 gap-8">
              <RevealSection delay={100}>
                <div className="bg-red-50/50 rounded-2xl p-8 border border-red-100 hover:shadow-md transition-shadow duration-300 h-full">
                  <h3 className="text-lg font-bold text-red-800 mb-6 flex items-center gap-2">
                    <X className="w-5 h-5" />
                    Ce n'est PAS pour toi si :
                  </h3>
                  <ul className="space-y-3">
                    {[
                      'tu cherches un salaire fixe',
                      'tu abandonnes vite',
                      'tu manques de discipline'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-red-700">
                        <X className="w-4 h-4 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealSection>

              <RevealSection delay={250}>
                <div className="bg-emerald-50/50 rounded-2xl p-8 border border-emerald-100 hover:shadow-md transition-shadow duration-300 h-full">
                  <h3 className="text-lg font-bold text-emerald-800 mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    C'est pour toi si :
                  </h3>
                  <ul className="space-y-3">
                    {[
                      'tu veux construire un revenu recurrent',
                      'tu es a l\'aise en DM et en prospection',
                      'tu as un mindset performance'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-emerald-700">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
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

      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <RevealSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Le processus en 4 etapes
                </h2>
              </div>
            </RevealSection>

            <StepperSection onApply={onApply} />
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white">
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
                  <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors duration-300">
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
                        <p className="text-gray-600">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-gradient-to-br from-belaya-deep to-belaya-bright text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl float-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl float-blob-delayed"></div>

        <div className="container mx-auto px-4 relative">
          <RevealSection>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white">
                Pret(e) a demarrer ?
              </h2>
              <p className="text-lg md:text-xl mb-10 text-white/90">
                Rejoins une equipe de partenaires ambitieux et commence a generer des commissions recurrentes des aujourd'hui.
              </p>
              <button
                onClick={onApply}
                className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-belaya-deep rounded-full font-bold text-lg shadow-2xl hover:shadow-[0_25px_60px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Je postule maintenant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
          </RevealSection>
        </div>
      </section>

      <footer className="py-10 bg-gray-900 text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Handshake className="w-5 h-5 text-belaya-bright" />
            <p className="text-white font-semibold text-lg">
              Devenir partenaire Belleya -- Gagne 10% a vie
            </p>
          </div>
          <p className="text-gray-400 text-sm">&copy; 2026 Belaya. Tous droits reserves.</p>
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
                visible ? 'bg-belaya-deep text-white scale-100' : 'bg-gray-200 text-gray-400 scale-75'
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`relative transition-all duration-500 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: `${200 + i * 150}ms` }}
          >
            <div className="step-card bg-white rounded-2xl p-6 border border-gray-200 shadow-sm h-full">
              <div className="text-4xl font-bold text-belaya-100 mb-4">{s.step}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-600">{s.desc}</p>
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
