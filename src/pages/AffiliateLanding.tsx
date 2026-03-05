import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, TrendingUp, DollarSign, ChevronRight, Shield, Zap, BarChart3, Award } from 'lucide-react';

function useScrollFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function FadeInSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollFadeIn();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

export default function AffiliateLanding() {
  const navigate = useNavigate();

  const tiers = [
    { name: 'Recrue', range: '0 - 9', rate: '10%', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    { name: 'Closer', range: '10 - 49', rate: '12%', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { name: 'Pro', range: '50 - 149', rate: '15%', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { name: 'Elite', range: '150+', rate: '15%', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  ];

  const features = [
    { icon: DollarSign, title: 'Commissions recurrentes', desc: 'Gagne une commission chaque mois sur les abonnements actifs de tes filleules.' },
    { icon: TrendingUp, title: 'Progression automatique', desc: 'Ton taux de commission augmente automatiquement avec tes conversions.' },
    { icon: BarChart3, title: 'Dashboard complet', desc: 'Suis tes conversions, commissions et classement en temps reel.' },
    { icon: Shield, title: 'Lien unique', desc: 'Un lien de parrainage personnel pour suivre toutes tes conversions.' },
    { icon: Award, title: 'Leaderboard', desc: 'Classe-toi parmi les meilleurs affilies et monte en rang.' },
    { icon: Zap, title: 'Paiements rapides', desc: 'Commissions calculees et payees chaque mois sans delai.' },
  ];

  const testimonials = [
    { name: 'Sarah M.', role: 'Estheticienne', text: 'En 3 mois j\'ai pu generer un complement de revenu regulier grace a Belaya.' },
    { name: 'Nadia K.', role: 'Prothesiste ongulaire', text: 'Le programme est transparent et le dashboard me permet de tout suivre facilement.' },
    { name: 'Julie R.', role: 'Coiffeuse', text: 'Les commissions recurrentes c\'est un vrai avantage. Je recommande a toutes mes collegues.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Belaya</h1>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Espace partenaire
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-rose-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-100/80 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Programme d'affiliation Belaya
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Deviens partenaire Belaya et genere un{' '}
            <span className="bg-gradient-to-r from-brand-500 to-rose-500 bg-clip-text text-transparent">
              revenu mensuel recurrent
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Programme d'affiliation pour la plateforme des entrepreneuses beaute.
            Recommande Belaya et gagne des commissions chaque mois.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="group flex items-center gap-2 px-8 py-3.5 bg-brand-500 text-white rounded-xl font-semibold text-lg hover:bg-brand-600 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand-500/25 animate-glow"
            >
              Rejoindre le programme
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-6 py-3.5 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      </section>

      <FadeInSection>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Niveaux et commissions</h3>
            <p className="text-gray-500">Plus tu convertis, plus ta commission augmente</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border-2 p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${tier.color}`}
              >
                <h4 className="text-xl font-bold mb-2">{tier.name}</h4>
                <p className="text-3xl font-bold mb-1">{tier.rate}</p>
                <p className="text-sm opacity-70">{tier.range} conversions</p>
              </div>
            ))}
          </div>
        </section>
      </FadeInSection>

      <FadeInSection>
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Pourquoi devenir partenaire ?</h3>
              <p className="text-gray-500">Tout ce dont tu as besoin pour reussir</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-brand-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeInSection>

      <FadeInSection>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Ce qu'en disent nos partenaires</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeInSection>

      <FadeInSection>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-rose-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)]" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center text-white">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">Prete a generer des revenus ?</h3>
            <p className="text-brand-100 mb-8">
              Rejoins le programme d'affiliation Belaya et commence a gagner des commissions des aujourd'hui.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-brand-600 rounded-xl font-semibold hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              Commencer maintenant
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </FadeInSection>

      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400">Belaya - Programme d'affiliation</p>
        </div>
      </footer>
    </div>
  );
}
