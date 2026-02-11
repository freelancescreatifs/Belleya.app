import {
  Sparkles, Calendar, Globe, Users, Image, Scissors, TrendingUp,
  Target, Package, BarChart, CheckCircle, Heart, Star, Zap, Shield,
  Clock, Lock, MessageCircle, ArrowRight, MessageSquare, Brain, DollarSign,
  BarChart3, AlertCircle, Search, Flame, Eye
} from 'lucide-react';
import AnimatedKeywords from '../components/landing/AnimatedKeywords';
import BeforeAfterSection from '../components/landing/BeforeAfterSection';
import CountdownTimer from '../components/landing/CountdownTimer';
import TestimonialsSlider from '../components/landing/TestimonialsSlider';
import ComparisonSection from '../components/landing/ComparisonSection';

interface LandingProps {
  onSelectRole: (role: 'client' | 'pro') => void;
}

export default function Landing({ onSelectRole }: LandingProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full bg-gradient-to-r from-brand-50 to-brand-100/50 border-b border-brand-100">
        <div className="container mx-auto px-4 py-3">
          <CountdownTimer />
        </div>
      </div>

      <header className="w-full">
        <img
          src="/installation_du_widget_(5)_copie.png"
          alt="Belleya - Beauty is my priority"
          className="w-full h-auto object-cover"
        />
      </header>

      <AnimatedKeywords />

      <div className="relative overflow-hidden min-h-[80vh] flex items-center" style={{ background: '#FFFDF8' }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZGUyZTQiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCAzLjk5OC00SDQwYzIuMjEgMCA0IDEuNzkgNCAzLjk5OFY0MGMwIDIuMjEtMS43OSA0LTMuOTk4IDRINDBjLTIuMjEgMC00LTEuNzktNC0zLjk5OFYzNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>

        <div className="container mx-auto px-4 py-8 md:py-12 relative w-full">
          <div className="text-center max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
              <button
                onClick={() => onSelectRole('client')}
                className="group relative bg-white rounded-2xl md:rounded-3xl shadow-xl hover:shadow-2xl transition-all p-6 md:p-8 text-center border-2 border-transparent hover:border-[#efaa9a] transform hover:-translate-y-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#efaa9a]/10 to-[#d9629b]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="relative">
                  <div className="w-full h-44 md:h-56 mx-auto mb-3 md:mb-4 group-hover:scale-105 transition-transform overflow-hidden rounded-2xl md:rounded-3xl shadow-lg">
                    <img
                      src="/4f818305-0d16-45fa-a026-0e08a8ca914a-1.png"
                      alt="Cliente Belleya"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3" style={{ color: 'rgb(113, 19, 65)' }}>
                    Je suis cliente
                  </h2>

                  <p className="text-sm md:text-lg text-gray-600 mb-4 md:mb-6 leading-relaxed">
                    Trouve ta pro idéale et réserve en quelques clics
                  </p>

                  <ul className="space-y-2 text-left max-w-sm mx-auto mb-4 md:mb-6">
                    <li className="flex items-center gap-2 md:gap-3 text-gray-700 text-sm md:text-base">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[#d9629b] flex-shrink-0" />
                      <span>Réservation en ligne 24/7</span>
                    </li>
                    <li className="flex items-center gap-2 md:gap-3 text-gray-700 text-sm md:text-base">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[#d9629b] flex-shrink-0" />
                      <span>Tous tes RDV au même endroit</span>
                    </li>
                    <li className="flex items-center gap-2 md:gap-3 text-gray-700 text-sm md:text-base">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[#d9629b] flex-shrink-0" />
                      <span>Tes pros préférées en favoris</span>
                    </li>
                  </ul>

                  <div className="inline-flex items-center gap-2 text-[rgb(113,19,65)] font-semibold text-base md:text-lg group-hover:gap-3 transition-all">
                    Accéder à mon espace
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => onSelectRole('pro')}
                className="group relative bg-white rounded-2xl md:rounded-3xl shadow-xl hover:shadow-2xl transition-all p-6 md:p-8 text-center border-2 border-[#efaa9a] hover:border-[#d9629b] transform hover:-translate-y-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#efaa9a]/20 to-[#d9629b]/20 opacity-50 group-hover:opacity-70 transition-opacity"></div>

                <div className="absolute -top-2 md:-top-3 -right-2 md:-right-3 bg-gradient-to-r from-[#efaa9a] to-[#d9629b] text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-lg">
                  14 jours gratuits
                </div>

                <div className="relative">
                  <div className="w-full h-44 md:h-56 mx-auto mb-3 md:mb-4 group-hover:scale-105 transition-transform overflow-hidden rounded-2xl md:rounded-3xl shadow-lg">
                    <img
                      src="/prestataire.jpeg"
                      alt="Professionnelle Belleya"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3" style={{ color: 'rgb(113, 19, 65)' }}>
                    Je suis pro
                  </h2>

                  <p className="text-sm md:text-lg text-gray-600 mb-4 md:mb-6 leading-relaxed">
                    Ton business beauté au même endroit. Simple, clair, serein.
                  </p>

                  <ul className="space-y-2 text-left max-w-sm mx-auto mb-4 md:mb-6">
                    <li className="flex items-center gap-2 md:gap-3 text-gray-700 text-sm md:text-base">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[rgb(113,19,65)] flex-shrink-0" />
                      <span>Ton agenda + réservations 24/7</span>
                    </li>
                    <li className="flex items-center gap-2 md:gap-3 text-gray-700 text-sm md:text-base">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[rgb(113,19,65)] flex-shrink-0" />
                      <span>Tes clientes + historique complet</span>
                    </li>
                    <li className="flex items-center gap-2 md:gap-3 text-gray-700 text-sm md:text-base">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[rgb(113,19,65)] flex-shrink-0" />
                      <span>Tes finances + objectifs enfin clairs</span>
                    </li>
                  </ul>

                  <div className="inline-flex items-center gap-2 text-[rgb(113,19,65)] font-semibold text-base md:text-lg group-hover:gap-3 transition-all">
                    Démarrer gratuitement
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            </div>

            <p className="text-gray-500 text-xs md:text-sm mt-8 md:mt-12">
              En utilisant Belleya, vous acceptez nos conditions d'utilisation
            </p>
          </div>
        </div>
      </div>

      <section className="relative py-20 md:py-32 bg-gradient-to-b from-white via-rose-50/30 to-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(239,170,154,0.1),rgba(255,255,255,0))]"></div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 md:mb-20">
              <div className="inline-block mb-4 md:mb-6">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#efaa9a] via-[#d9629b] to-[#efaa9a] bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                  Ta réalité aujourd'hui
                </h2>
              </div>
              <p className="text-base md:text-xl text-gray-500 max-w-2xl mx-auto px-4">
                Tu adores ton métier... mais la gestion te bouffe la tête.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-16 md:mb-20">
              {[
                { icon: MessageSquare, title: "Messages éparpillés", desc: "WhatsApp, Insta, SMS... Tu cherches qui a réservé quoi pendant 10 minutes." },
                { icon: Brain, title: "Tête surchargée", desc: "Tout est dans ta tête. Et ta tête déborde." },
                { icon: Target, title: "Objectifs flous", desc: "Tu bosses beaucoup. Mais tu sais pas vraiment où t'en es." },
                { icon: DollarSign, title: "Finances floues", desc: "Combien tu gagnes vraiment ? Tes charges ? Tu préfères pas regarder." },
                { icon: BarChart3, title: "Contenu chaotique", desc: "Des idées plein la tête, mais zéro organisation pour poster." },
                { icon: Search, title: "Inspirations perdues", desc: "Cette photo super inspirante... elle était où déjà ?" }
              ].map((item, i) => (
                <div
                  key={i}
                  className="group relative bg-white/60 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-belleya-100/50 hover:border-belleya-200 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(239,170,154,0.12)] hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${i * 0.1}s both`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-[#efaa9a]/20 to-[#d9629b]/20 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="w-5 h-5 md:w-6 md:h-6 text-[#d9629b]" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1.5 md:mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mb-16 md:mb-20">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-100/50 via-pink-100/50 to-rose-100/50 rounded-2xl md:rounded-3xl blur-2xl"></div>
              <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl md:rounded-3xl p-6 md:p-12 lg:p-16 border border-belleya-200/50 shadow-[0_8px_30px_rgb(239,170,154,0.15)]">
                <div className="max-w-3xl mx-auto text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 mb-6 md:mb-8 shadow-lg">
                    <Flame className="w-6 h-6 md:w-8 md:h-8 text-[#d9629b]" />
                  </div>

                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
                    Le vrai problème ?
                  </h3>

                  <p className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#efaa9a] via-[#d9629b] to-[#711341] bg-clip-text text-transparent mb-6 md:mb-8">
                    Tu subis ton activité au lieu de la piloter.
                  </p>

                  <div className="inline-block px-6 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-full border border-belleya-200/50">
                    <p className="text-base md:text-lg font-bold text-gray-900">
                      Ce n'est pas normal de travailler comme ça.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#efaa9a]/10 via-[#d9629b]/10 to-[#711341]/10 rounded-2xl md:rounded-3xl blur-3xl"></div>

              <div className="relative bg-gradient-to-br from-white via-rose-50/50 to-white backdrop-blur-xl rounded-2xl md:rounded-3xl p-6 md:p-12 lg:p-16 border-2 border-transparent shadow-[0_0_0_1px_rgba(239,170,154,0.3),0_8px_30px_rgba(217,98,155,0.15)]"
                style={{
                  backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, rgba(239,170,154,0.4), rgba(217,98,155,0.4), rgba(239,170,154,0.4))',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  animation: 'borderShimmer 3s linear infinite'
                }}
              >
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-6 md:p-8 mb-8 md:mb-10 shadow-lg border border-belleya-100/50">
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-6 md:mb-8 text-gray-900">
                      Tu es une <span className="bg-gradient-to-r from-[#efaa9a] to-[#d9629b] bg-clip-text text-transparent">vraie pro</span>.
                      <br />
                      Tu mérites un <span className="bg-gradient-to-r from-[#efaa9a] to-[#d9629b] bg-clip-text text-transparent">vrai système</span>.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                      {[
                        { icon: Sparkles, text: 'Clarté' },
                        { icon: Target, text: 'Contrôle' },
                        { icon: Eye, text: 'Visibilité' },
                        { icon: Heart, text: 'Sérénité' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-belleya-50/50 transition-colors">
                          <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-[#efaa9a] to-[#d9629b] rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                            <item.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                          </div>
                          <span className="text-base md:text-lg font-medium text-gray-800">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-[#efaa9a] via-[#d9629b] to-[#711341] bg-clip-text text-transparent">
                      Tu mérites Belleya.
                    </p>
                    <button
                      onClick={() => onSelectRole('pro')}
                      className="group relative inline-flex items-center gap-2 md:gap-3 px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-[#efaa9a] via-[#d9629b] to-[#efaa9a] bg-[length:200%_auto] text-white font-bold text-base md:text-lg rounded-full shadow-[0_10px_40px_rgba(217,98,155,0.3)] hover:shadow-[0_15px_50px_rgba(217,98,155,0.4)] transition-all hover:scale-105 animate-[shimmer_3s_linear_infinite]"
                    >
                      <span className="relative z-10">Découvrir Belleya</span>
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 rounded-full transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes shimmer {
            0% {
              background-position: 200% center;
            }
            100% {
              background-position: -200% center;
            }
          }

          @keyframes borderShimmer {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
        `}</style>
      </section>

      <BeforeAfterSection />

      <section className="relative py-20 md:py-32 bg-gradient-to-b from-white via-rose-50/20 to-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,170,154,0.08),rgba(255,255,255,0))]"></div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-block mb-4 md:mb-6">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#efaa9a] via-[#d9629b] to-[#efaa9a] bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] px-4">
                Tout ton business au même endroit
              </h2>
            </div>
            <p className="text-base md:text-xl text-gray-500 px-4">
              Adapté à ton métier. Grandit avec toi.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
            {[
              {
                icon: BarChart,
                title: "Vois où t'en es, vraiment",
                subtitle: "Dashboard intelligent",
                description: "CA du jour, RDV de la semaine, tâches prioritaires. Tout d'un coup d'œil."
              },
              {
                icon: TrendingUp,
                title: "Comprends tes finances",
                subtitle: "Pilotage financier",
                description: "CA, charges, bénéfice réel. Seuils fiscaux adaptés à ton statut. Enfin clair."
              },
              {
                icon: Users,
                title: "Connais vraiment tes clientes",
                subtitle: "Fiches clientes complètes",
                description: "Historique, préférences, photos, notes. Champs adaptés à ton métier."
              },
              {
                icon: Calendar,
                title: "Ton temps organisé",
                subtitle: "Agenda unifié",
                description: "RDV, tâches, contenu social : tout au même endroit. Synchro Google & Planity."
              },
              {
                icon: Target,
                title: "Garde le cap",
                subtitle: "Objectifs & suivi",
                description: "Fixe tes objectifs mensuels et suis ta progression en temps réel."
              },
              {
                icon: Image,
                title: "Garde tes inspirations",
                subtitle: "Galerie organisée",
                description: "Collecte les inspirations clientes. Photos avant/après liées automatiquement."
              },
              {
                icon: Globe,
                title: "Réserve en ligne 24/7",
                subtitle: "Ta page Belleya unique",
                description: "Tes clientes réservent H24. Tu valides quand tu veux."
              },
              {
                icon: Package,
                title: "Jamais à court",
                subtitle: "Gestion de stock",
                description: "Suis tes fournitures, reçois des alertes. Toujours prête."
              },
              {
                icon: Sparkles,
                title: "Publie sans réfléchir",
                subtitle: "Calendrier éditorial IA",
                description: "Planifie tes posts Insta, génère des idées. Zéro panne d'inspiration."
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white/70 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 md:p-8 border border-belleya-100/50 hover:border-belleya-200/80 transition-all duration-500 hover:shadow-[0_10px_40px_rgba(239,170,154,0.15)] hover:-translate-y-1"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${i * 0.08}s both`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50/30 via-transparent to-pink-50/30 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#efaa9a]/10 to-[#d9629b]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>

                <div className="relative">
                  <div className="relative w-11 h-11 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-[#efaa9a]/30 to-[#d9629b]/30 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#efaa9a] to-[#d9629b] rounded-lg md:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <feature.icon className="w-5 h-5 md:w-7 md:h-7 text-[#d9629b] group-hover:text-white transition-colors duration-500 relative z-10" />
                  </div>

                  <div className="mb-3 md:mb-4">
                    <h3 className="text-base md:text-xl font-bold text-gray-900 mb-1 leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-xs md:text-sm font-semibold bg-gradient-to-r from-[#efaa9a] to-[#d9629b] bg-clip-text text-transparent">
                      {feature.subtitle}
                    </p>
                  </div>

                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>

                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#efaa9a] via-[#d9629b] to-[#efaa9a] bg-[length:200%_auto] rounded-b-xl md:rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[shimmer_3s_linear_infinite]"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ComparisonSection />

      <section className="py-20 md:py-32 bg-[#efaa9a]/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 px-4" style={{ color: 'rgb(113, 19, 65)' }}>
              Conçu pour toi, pro de la beauté
            </h2>
            <p className="text-base md:text-xl text-gray-600 px-4">
              Quel que soit ton univers, Belleya s'adapte
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {[
              "Prothésistes ongulaires",
              "Nail artists",
              "Esthéticiennes",
              "Techs cils & sourcils",
              "Maquilleuses professionnelles",
              "Indépendantes & salons"
            ].map((profession, i) => (
              <div
                key={i}
                className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md hover:shadow-lg transition-all flex items-center gap-3 md:gap-4"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md">
                  <img
                    src="/3f444bf0-6b58-4ab1-bc0e-8e22de6bb900.png"
                    alt="Prothésiste ongulaire"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-gray-800 font-medium text-sm md:text-base">{profession}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 px-4" style={{ color: 'rgb(113, 19, 65)' }}>
              Pas un énième logiciel compliqué
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Heart,
                title: "Adapté à ton métier",
                description: "Ongles, cils, soins... Les champs changent selon ton activité."
              },
              {
                icon: TrendingUp,
                title: "Grandit avec toi",
                description: "Auto-entrepreneur ou salon : Belleya s'adapte."
              },
              {
                icon: Users,
                title: "Pensé simple",
                description: "Zéro jargon. Juste ce dont tu as besoin."
              }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#efaa9a] to-[#d9629b] rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg">
                  <item.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-4">{item.title}</h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-[#efaa9a]/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4 px-4">
              Des tarifs clairs et adaptés
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                name: "Starter",
                price: "19",
                popular: false,
                features: [
                  "Agenda + tâches",
                  "Jusqu'à 50 clientes",
                  "Réservation en ligne",
                  "Gestion RDV basique",
                  "Notifs automatiques",
                  "Dashboard simple",
                  "Support email 48h"
                ]
              },
              {
                name: "Pro",
                price: "39",
                popular: true,
                features: [
                  "Tout Starter inclus",
                  "Clientes illimitées",
                  "Finances + TVA",
                  "Objectifs & suivi",
                  "Galerie photos",
                  "Historique détaillé",
                  "Champs métier perso",
                  "Gestion stock",
                  "Calendrier éditorial IA",
                  "Marketing auto",
                  "Exports Excel/PDF",
                  "Support 24h"
                ]
              },
              {
                name: "Premium",
                price: "69",
                popular: false,
                features: [
                  "Tout Pro inclus",
                  "Analytics avancées",
                  "Synchro Google",
                  "Synchro Planity",
                  "Multi-calendriers",
                  "Export comptable",
                  "Rappels SMS auto",
                  "API & intégrations",
                  "Formation perso 1h",
                  "Conseils business",
                  "Support dédié 12h"
                ]
              },
              {
                name: "Salon",
                price: "99",
                popular: false,
                features: [
                  "Tout Premium inclus",
                  "Multi-users illimités",
                  "Gestion équipe",
                  "Planning collaboratif",
                  "Dashboard salon",
                  "Commissions & salaires",
                  "Stats par praticien",
                  "Formation équipe",
                  "Account manager",
                  "Support 4h"
                ]
              }
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col ${
                  plan.popular ? 'border-2 border-[#d9629b] md:transform md:scale-105' : 'border border-[#efaa9a]/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#efaa9a] to-[#d9629b] text-white px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-medium flex items-center gap-1 shadow-lg">
                    <Star className="w-3 h-3 md:w-4 md:h-4" />
                    Le + populaire
                  </div>
                )}

                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5 md:mb-2">{plan.name}</h3>
                  <div className="mb-4 md:mb-6">
                    <span className="text-3xl md:text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-sm md:text-base text-gray-600 ml-1 md:ml-2">€/mois</span>
                  </div>
                </div>

                <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-700 text-xs md:text-sm">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[#d9629b] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onSelectRole('pro')}
                  className={`w-full py-2.5 md:py-3 rounded-full font-medium text-sm md:text-base transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#efaa9a] to-[#d9629b] text-white hover:shadow-lg hover:scale-105'
                      : 'bg-[#efaa9a]/10 text-[rgb(113,19,65)] hover:bg-[#efaa9a]/20'
                  }`}
                >
                  Essayer gratuit
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-600 mt-8 md:mt-12 text-sm md:text-lg px-4">
            14 jours gratuits, sans CB
          </p>
        </div>
      </section>

      <TestimonialsSlider />

      <section className="py-20 md:py-32 bg-[#efaa9a]/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4 px-4">
              Simple, sécurisé, sans engagement
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Zap,
                title: "Zéro prise de tête",
                description: "Si tu sais utiliser Insta, tu sais utiliser Belleya."
              },
              {
                icon: Shield,
                title: "Données sécurisées",
                description: "Hébergement européen, conformité RGPD."
              },
              {
                icon: MessageCircle,
                title: "Support humain",
                description: "Une question ? On te répond vraiment."
              },
              {
                icon: Lock,
                title: "Annulation libre",
                description: "Sans engagement. Sans surprise."
              }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#efaa9a] to-[#d9629b] rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm md:text-base">{item.title}</h3>
                <p className="text-gray-600 text-xs md:text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-gradient-to-br from-[#efaa9a] to-[#d9629b] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center px-4">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-white">
              Prête à reprendre le contrôle ?
            </h2>
            <p className="text-base md:text-xl lg:text-2xl mb-8 md:mb-10 opacity-95">
              Rejoins les pros beauté qui pilotent leur activité avec Belleya.
            </p>

            <button
              onClick={() => onSelectRole('pro')}
              className="group px-8 md:px-10 py-4 md:py-5 bg-white text-[rgb(113,19,65)] rounded-full font-bold text-base md:text-xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105 inline-flex items-center gap-2 md:gap-3"
            >
              Démarrer gratuitement
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-xs md:text-sm mt-4 md:mt-6 opacity-90">
              14 jours gratuits • Sans CB • Annulation libre
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Belleya"
                className="h-12 w-auto"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm md:text-base text-gray-600">
              <a href="#" className="hover:text-[rgb(113,19,65)] transition-colors">Fonctionnalités</a>
              <a href="#" className="hover:text-[rgb(113,19,65)] transition-colors">Tarifs</a>
              <a href="#" className="hover:text-[rgb(113,19,65)] transition-colors">Contact</a>
              <button
                onClick={() => onSelectRole('client')}
                className="hover:text-[rgb(113,19,65)] transition-colors flex items-center gap-1"
              >
                <Users className="w-4 h-4" />
                Espace Cliente
              </button>
              <a href="#" className="hover:text-[rgb(113,19,65)] transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-[rgb(113,19,65)] transition-colors">CGV</a>
            </div>

            <p className="text-gray-500 text-sm">
              © 2026 Belleya. Tous droits réservés.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
