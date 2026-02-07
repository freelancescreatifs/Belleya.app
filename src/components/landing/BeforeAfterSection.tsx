import { X, Check, ArrowRight, TrendingUp } from 'lucide-react';

export default function BeforeAfterSection() {
  const beforeItems = [
    "Rendez-vous dispersés dans 3 agendas différents",
    "Messages de clientes perdus dans WhatsApp/Instagram",
    "Aucune idée de votre CA réel du mois",
    "Inspirations égarées, demandes oubliées",
    "Stress constant de rater quelque chose",
    "Décisions prises à l'instinct, sans données",
    "Fatigue mentale permanente"
  ];

  const afterItems = [
    "Tout au même endroit : agenda, clientes, finances",
    "Vision claire de votre activité en un coup d'œil",
    "Chiffres compréhensibles, décisions éclairées",
    "Inspirations sauvegardées, historique client complet",
    "Sérénité : vous contrôlez tout",
    "Temps gagné pour votre cœur de métier",
    "Légèreté mentale enfin retrouvée"
  ];

  return (
    <section className="relative py-12 md:py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-brand-50/30 via-white to-brand-50/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(217,98,155,0.08),rgba(255,255,255,0))]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(239,170,154,0.08),rgba(255,255,255,0))]"></div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-[#efaa9a]/20 to-[#d9629b]/20 rounded-full blur-3xl animate-[morph_8s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-gradient-to-br from-[#d9629b]/15 to-[#efaa9a]/15 rounded-full blur-3xl animate-[morph_10s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-gradient-to-br from-[#efaa9a]/10 to-[#d9629b]/10 rounded-full blur-3xl animate-[morph_12s_ease-in-out_infinite]" style={{ animationDelay: '4s' }}></div>

        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#efaa9a] rounded-full animate-[float_6s_ease-in-out_infinite] opacity-40"></div>
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-[#d9629b] rounded-full animate-[float_8s_ease-in-out_infinite] opacity-30" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-2.5 h-2.5 bg-[#efaa9a] rounded-full animate-[float_7s_ease-in-out_infinite] opacity-25" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-[#d9629b] rounded-full animate-[float_5s_ease-in-out_infinite] opacity-35" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 w-2 h-2 bg-[#efaa9a] rounded-full animate-[float_9s_ease-in-out_infinite] opacity-20" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#711341] to-[#5a0f33] flex items-center justify-center shadow-lg animate-[wobble_3s_ease-in-out_infinite]">
              <X className="w-6 h-6 text-white" />
            </div>
            <ArrowRight className="w-8 h-8 text-[#d9629b] animate-[pulse_2s_ease-in-out_infinite]" />
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#efaa9a] to-[#d9629b] flex items-center justify-center shadow-lg animate-[wobble_3s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }}>
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-[#efaa9a] via-[#d9629b] to-[#efaa9a] bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] leading-tight">
            Votre vie professionnelle :<br className="hidden sm:block" /><span className="sm:hidden"> </span>AVANT / APRÈS Belleya
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Passez du chaos à la sérénité en quelques clics
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(217,98,155,0.2)]">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="bg-gradient-to-br from-[#711341] via-[#8b1a50] to-[#711341] p-5 md:p-8 lg:p-10 flex flex-col min-h-[500px] md:min-h-[600px] lg:min-h-[700px] relative overflow-hidden animate-[gradientShift_6s_ease-in-out_infinite]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)]"></div>
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-[morph_10s_ease-in-out_infinite]"></div>

              <div className="mb-4 md:mb-6 relative z-10">
                <div className="inline-block px-2.5 md:px-3 py-1 md:py-1.5 bg-white/10 backdrop-blur-sm rounded-full mb-2 md:mb-3 border border-white/20">
                  <span className="text-xs md:text-sm font-semibold text-white uppercase tracking-wide">Avant</span>
                </div>
                <h3 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-1 md:mb-2 leading-tight">
                  Le chaos quotidien
                </h3>
              </div>

              <div className="space-y-2.5 md:space-y-3 lg:space-y-4 flex-1 relative z-10">
                {beforeItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 md:gap-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="mt-0.5 md:mt-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/30">
                      <X className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                    </div>
                    <p className="text-xs md:text-sm lg:text-base text-white/90 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 md:mt-6 p-3 md:p-4 lg:p-6 bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white/20 relative z-10">
                <p className="text-xs md:text-sm lg:text-base text-white/90 italic leading-relaxed">
                  "Je travaille tout le temps mais je ne sais même pas si je gagne vraiment ma vie..."
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-brand-50 via-pink-50 to-rose-100 p-5 md:p-8 lg:p-10 flex flex-col min-h-[500px] md:min-h-[600px] lg:min-h-[700px] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(239,170,154,0.2),transparent)]"></div>
              <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-[#efaa9a]/10 to-[#d9629b]/10 rounded-full blur-3xl animate-[morph_10s_ease-in-out_infinite]"></div>

              <div className="mb-4 md:mb-6 relative z-10">
                <div className="inline-block px-2.5 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-[#efaa9a]/30 to-[#d9629b]/30 backdrop-blur-sm rounded-full mb-2 md:mb-3 border border-[#d9629b]/20 shadow-[0_0_20px_rgba(217,98,155,0.3)]">
                  <span className="text-xs md:text-sm font-semibold bg-gradient-to-r from-[#efaa9a] to-[#d9629b] bg-clip-text text-transparent uppercase tracking-wide">Après</span>
                </div>
                <h3 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-[#efaa9a] to-[#d9629b] bg-clip-text text-transparent mb-1 md:mb-2 leading-tight animate-[shimmer_3s_linear_infinite] bg-[length:200%_auto]">
                  La sérénité retrouvée
                </h3>
              </div>

              <div className="space-y-2.5 md:space-y-3 lg:space-y-4 flex-1 relative z-10">
                {afterItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 md:gap-3 opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards] group"
                    style={{ animationDelay: `${i * 0.1 + 0.3}s` }}
                  >
                    <div className="mt-0.5 md:mt-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-[#efaa9a] to-[#d9629b] flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(217,98,155,0.3)] group-hover:shadow-[0_0_20px_rgba(217,98,155,0.5)] transition-all duration-300 group-hover:scale-110 animate-[pulse_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.2}s` }}>
                      <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                    </div>
                    <p className="text-xs md:text-sm lg:text-base text-gray-700 leading-relaxed group-hover:text-[#d9629b] transition-colors duration-300">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 md:mt-6 p-3 md:p-4 lg:p-6 bg-gradient-to-br from-[#efaa9a]/20 to-[#d9629b]/20 backdrop-blur-sm rounded-xl md:rounded-2xl border border-[#d9629b]/30 shadow-lg relative z-10">
                <p className="text-xs md:text-sm lg:text-base text-gray-800 italic font-medium leading-relaxed">
                  "Enfin je pilote mon business au lieu de le subir. Je sais exactement où je vais."
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 md:mt-12 lg:mt-16 max-w-3xl mx-auto px-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-100/30 via-pink-100/30 to-rose-100/30 rounded-2xl md:rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#efaa9a]/10 via-[#d9629b]/10 to-[#efaa9a]/10 rounded-2xl md:rounded-3xl blur-xl animate-[morph_8s_ease-in-out_infinite]"></div>

            <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl p-5 md:p-8 lg:p-10 border border-belleya-200/50 shadow-[0_8px_40px_rgba(239,170,154,0.12)] group-hover:shadow-[0_12px_60px_rgba(217,98,155,0.2)] transition-all duration-500">
              <div className="relative inline-block mb-3 md:mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-[#efaa9a] to-[#d9629b] rounded-xl md:rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#efaa9a] to-[#d9629b] rounded-xl md:rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
                </div>
              </div>

              <p className="text-base md:text-lg lg:text-xl xl:text-2xl text-gray-700 leading-relaxed mb-2">
                <span className="font-bold bg-gradient-to-r from-[#efaa9a] via-[#d9629b] to-[#efaa9a] bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">Belleya</span> n'est pas un simple logiciel.
              </p>
              <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 leading-relaxed">
                C'est votre alliée pour reprendre le contrôle et retrouver votre sérénité.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.2;
          }
          33% {
            transform: translateY(-20px) translateX(10px) scale(1.2);
            opacity: 0.4;
          }
          66% {
            transform: translateY(-10px) translateX(-10px) scale(0.8);
            opacity: 0.3;
          }
        }

        @keyframes morph {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          25% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
            transform: translate(10px, -10px) rotate(90deg) scale(1.1);
          }
          50% {
            border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%;
            transform: translate(-10px, 10px) rotate(180deg) scale(0.9);
          }
          75% {
            border-radius: 70% 30% 40% 60% / 40% 70% 60% 30%;
            transform: translate(10px, 10px) rotate(270deg) scale(1.05);
          }
        }

        @keyframes wobble {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(-5deg) scale(1.05);
          }
          50% {
            transform: rotate(5deg) scale(0.95);
          }
          75% {
            transform: rotate(-3deg) scale(1.02);
          }
        }

        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
            filter: hue-rotate(0deg);
          }
          50% {
            background-position: 100% 50%;
            filter: hue-rotate(5deg);
          }
        }
      `}</style>
    </section>
  );
}
