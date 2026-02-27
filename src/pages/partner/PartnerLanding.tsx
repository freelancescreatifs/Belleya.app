import { useState } from 'react';
import {
  ArrowRight,
  TrendingUp,
  BarChart3,
  Link as LinkIcon,
  MessageSquare,
  BookOpen,
  Headphones,
  Target,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Zap,
  Award,
  CheckCircle,
  XCircle,
  ArrowLeft,
  LogIn,
} from 'lucide-react';

const faqItems = [
  {
    q: 'Est-ce un emploi salarie ?',
    a: 'Non, c\'est un partenariat commissionne independant. Tu es libre de travailler a ton rythme, sans lien de subordination.',
  },
  {
    q: 'Quand suis-je paye(e) ?',
    a: 'Chaque mois, en fonction des abonnements actifs generes par tes filleules. Les commissions sont calculees automatiquement.',
  },
  {
    q: 'Les commissions sont-elles limitees ?',
    a: 'Tu touches 10% tant que les clientes que tu as apportees restent abonnees. C\'est un revenu recurrent et cumulatif.',
  },
  {
    q: 'Y a-t-il un plafond ?',
    a: 'Aucun plafond. Plus tu apportes de clientes actives, plus tes commissions augmentent. Le potentiel est illimite.',
  },
];

const earningsExamples = [
  { subs: 100, amount: '290' },
  { subs: 300, amount: '870' },
  { subs: 500, amount: '1 450' },
];

const benefits = [
  { icon: LinkIcon, text: 'Lien d\'affiliation unique' },
  { icon: BarChart3, text: 'Dashboard personnel' },
  { icon: DollarSign, text: 'Suivi clair de tes commissions' },
  { icon: MessageSquare, text: 'Scripts de prospection' },
  { icon: BookOpen, text: 'Mini formation d\'integration' },
  { icon: Headphones, text: 'Support dedie' },
];

const steps = [
  { num: '01', title: 'Tu postules', desc: 'Remplis le formulaire de candidature en 2 minutes.' },
  { num: '02', title: 'On valide ton profil', desc: 'Notre equipe examine ta candidature sous 48h.' },
  { num: '03', title: 'Tu recois ton lien', desc: 'Ton lien d\'affiliation unique est active.' },
  { num: '04', title: 'Tu generes des commissions', desc: 'Chaque abonnement actif te rapporte 10% / mois.' },
];

export default function PartnerLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const goToApply = () => {
    window.location.href = '/partenaire/postuler';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <img src="/logo.png" alt="Belleya" className="h-8 w-auto" />
          </a>
          <a
            href="/partenaire/connexion"
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#efaa9a] text-[rgb(113,19,65)] hover:bg-[#efaa9a]/10 transition-colors text-sm font-medium"
          >
            <LogIn className="w-4 h-4" />
            Connexion partenaires
          </a>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#FFFDF8' }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(239,170,154,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(217,98,155,0.08),transparent_60%)]" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#efaa9a]/20 to-[#d9629b]/20 mb-8">
              <Award className="w-4 h-4 text-[#d9629b]" />
              <span className="text-sm font-semibold text-[rgb(113,19,65)]">Programme Partenaire Belleya</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-[#efaa9a] via-[#d9629b] to-[#efaa9a] bg-[length:200%_auto] bg-clip-text text-transparent animate-[shimmer_3s_linear_infinite]">
                Gagne un revenu mensuel recurrent
              </span>
              <br />
              <span style={{ color: 'rgb(113, 19, 65)' }}>
                en recommandant Belleya.
              </span>
            </h1>
            <p className="text-base md:text-xl text-gray-600 leading-relaxed mb-4 max-w-2xl mx-auto">
              Rejoins le programme partenaire Belleya et touche <strong className="text-[rgb(113,19,65)]">10% de commission</strong> pendant
              toute la duree d'abonnement des clientes que tu apportes.
            </p>
            <p className="text-lg md:text-2xl font-bold mb-10" style={{ color: 'rgb(113, 19, 65)' }}>
              Potentiel : 500&#8364; a 2&nbsp;000&#8364;+ / mois
            </p>
            <button
              onClick={goToApply}
              title="Rejoindre le programme d'affiliation Belleya"
              className="group relative inline-flex items-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-[#efaa9a] via-[#d9629b] to-[#efaa9a] bg-[length:200%_auto] text-white font-bold text-base md:text-lg rounded-full shadow-[0_10px_40px_rgba(217,98,155,0.3)] hover:shadow-[0_15px_50px_rgba(217,98,155,0.4)] transition-all hover:scale-105 animate-[shimmer_3s_linear_infinite] overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative">Je postule maintenant</span>
              <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Opportunity */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#efaa9a]/20 to-[#d9629b]/20 mb-6">
              <TrendingUp className="w-4 h-4 text-[#d9629b]" />
              <span className="text-sm font-semibold text-[rgb(113,19,65)]">Opportunite reelle</span>
            </div>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-6" style={{ color: 'rgb(113, 19, 65)' }}>
              Pourquoi c'est une vraie opportunite
            </h2>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              Belleya est une plateforme dediee aux entrepreneuses beaute
              (nail artists, techniciennes cils, estheticiennes...).
              Marche en forte croissance. Besoin reel. Abonnement recurrent a 29&#8364; / mois.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Zap, title: '10% sur chaque abonnement actif', desc: 'Commission recurrente tant que la cliente reste abonnee.' },
              { icon: DollarSign, title: '2,90\u20AC par mois par cliente', desc: 'Un montant fixe et previsible par abonnement actif.' },
              { icon: TrendingUp, title: 'Revenu cumulatif', desc: 'Tes commissions augmentent tant que tes clientes restent abonnees.' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-belleya-100/50 hover:border-belleya-200/80 transition-all duration-500 hover:shadow-[0_10px_40px_rgba(239,170,154,0.15)] hover:-translate-y-1"
                style={{ animation: `fadeInUp 0.6s ease-out ${i * 0.1}s both` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#efaa9a]/20 to-[#d9629b]/20 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-[#d9629b]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings examples */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white via-[#efaa9a]/5 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#efaa9a]/20 to-[#d9629b]/20 mb-6">
              <BarChart3 className="w-4 h-4 text-[#d9629b]" />
              <span className="text-sm font-semibold text-[rgb(113,19,65)]">Exemples concrets</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold" style={{ color: 'rgb(113, 19, 65)' }}>
              Combien tu peux gagner
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {earningsExamples.map((ex, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 text-center border border-gray-100 hover:-translate-y-1"
                style={{ animation: `fadeInUp 0.6s ease-out ${i * 0.15}s both` }}
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#efaa9a] via-[#d9629b] to-[#efaa9a] bg-clip-text text-transparent mb-2">
                  {ex.amount}&#8364;
                </div>
                <p className="text-gray-500 text-sm">par mois</p>
                <div className="w-12 h-px bg-gradient-to-r from-[#efaa9a] to-[#d9629b] mx-auto my-4" />
                <p className="text-gray-700 font-medium">{ex.subs} abonnees actives</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#efaa9a]/20 to-[#d9629b]/20 mb-6">
              <Target className="w-4 h-4 text-[#d9629b]" />
              <span className="text-sm font-semibold text-[rgb(113,19,65)]">Ta mission</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-8" style={{ color: 'rgb(113, 19, 65)' }}>
              Ce que tu feras au quotidien
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              'Prospecter des entrepreneuses beaute',
              'Presenter Belleya et ses avantages',
              'Expliquer la valeur de la plateforme',
              'Accompagner jusqu\'a l\'inscription',
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white rounded-xl p-5 border border-belleya-100/50 hover:border-belleya-200 transition-all hover:shadow-md"
                style={{ animation: `fadeInUp 0.6s ease-out ${i * 0.1}s both` }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#efaa9a] to-[#d9629b] flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-800 font-medium text-sm md:text-base">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-[#efaa9a]/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#efaa9a]/20 to-[#d9629b]/20 mb-6">
              <Zap className="w-4 h-4 text-[#d9629b]" />
              <span className="text-sm font-semibold text-[rgb(113,19,65)]">Ce que tu recois</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold" style={{ color: 'rgb(113, 19, 65)' }}>
              Tous les outils pour reussir
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-belleya-100/50 hover:border-belleya-200/80 transition-all duration-500 hover:shadow-[0_10px_40px_rgba(239,170,154,0.15)] hover:-translate-y-1"
                style={{ animation: `fadeInUp 0.6s ease-out ${i * 0.08}s both` }}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#efaa9a]/20 to-[#d9629b]/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <b.icon className="w-5 h-5 text-[#d9629b]" />
                </div>
                <p className="text-gray-800 font-medium">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Not for everyone */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl font-bold" style={{ color: 'rgb(113, 19, 65)' }}>
                Pas pour tout le monde
              </h2>
              <p className="text-gray-600 mt-4">On cherche des partenaires motives et serieux.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-red-50 rounded-2xl p-6 md:p-8 border border-red-100">
                <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Ce n'est PAS pour toi si...
                </h3>
                <ul className="space-y-3">
                  {['Tu cherches un salaire fixe', 'Tu abandonnes vite', 'Tu manques de discipline'].map((t, i) => (
                    <li key={i} className="flex items-center gap-3 text-red-600 text-sm">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-6 md:p-8 border border-emerald-100">
                <h3 className="text-lg font-bold text-emerald-700 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  C'est pour toi si...
                </h3>
                <ul className="space-y-3">
                  {[
                    'Tu veux construire un revenu recurrent',
                    'Tu es a l\'aise en DM et en prospection',
                    'Tu as un mindset performance',
                  ].map((t, i) => (
                    <li key={i} className="flex items-center gap-3 text-emerald-600 text-sm">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white via-[#efaa9a]/5 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold" style={{ color: 'rgb(113, 19, 65)' }}>
              Le processus en 4 etapes
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <div
                key={i}
                className="relative bg-white rounded-2xl p-6 border border-belleya-100/50 hover:border-belleya-200 transition-all hover:shadow-lg hover:-translate-y-1"
                style={{ animation: `fadeInUp 0.6s ease-out ${i * 0.12}s both` }}
              >
                <span className="text-4xl font-black bg-gradient-to-r from-[#efaa9a] to-[#d9629b] bg-clip-text text-transparent">
                  {s.num}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-3 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-12" style={{ color: 'rgb(113, 19, 65)' }}>
              Questions frequentes
            </h2>
            <div className="space-y-3">
              {faqItems.map((faq, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 hover:border-belleya-200 transition-colors overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-semibold text-gray-900 text-sm md:text-base pr-4">{faq.q}</span>
                    {openFaq === i ? (
                      <ChevronUp className="w-5 h-5 text-[#d9629b] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 -mt-1">
                      <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-[#efaa9a] to-[#d9629b] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-6">
            Pret(e) a demarrer ?
          </h2>
          <p className="text-white/80 text-base md:text-lg mb-10 max-w-xl mx-auto">
            Rejoins une equipe de partenaires ambitieux et commence a generer des commissions recurrentes des aujourd'hui.
          </p>
          <button
            onClick={goToApply}
            title="Rejoindre le programme d'affiliation Belleya"
            className="group relative inline-flex items-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-white text-[rgb(113,19,65)] rounded-full font-bold text-base md:text-xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105 overflow-hidden"
          >
            <span className="relative">Je postule maintenant</span>
            <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <img src="/logo.png" alt="Belleya" className="h-10 w-auto mx-auto mb-4" />
          <p className="text-gray-500 text-sm">
            &copy; 2026 Belleya. Tous droits reserves.
          </p>
        </div>
      </footer>
    </div>
  );
}
