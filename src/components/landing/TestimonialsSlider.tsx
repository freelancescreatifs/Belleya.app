import { Instagram, Star } from 'lucide-react';

const testimonials = [
  {
    name: "Sophie Martin",
    profession: "Prothésiste ongulaire",
    instagram: "@sophie_nailart",
    image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
    text: "Belaya a transformé ma gestion quotidienne. Plus de stress, tout est organisé et mes clientes adorent réserver en ligne.",
    rating: 5
  },
  {
    name: "Camille Dubois",
    profession: "Esthéticienne",
    instagram: "@camille_beauty",
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
    text: "Enfin un outil qui comprend vraiment mes besoins. Le suivi client est incroyable et j'ai gagné 5h par semaine.",
    rating: 5
  },
  {
    name: "Emma Rousseau",
    profession: "Tech cils & sourcils",
    instagram: "@emma_lashes",
    image: "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
    text: "Je recommande à 100%. Interface intuitive, calendrier éditorial génial, et le support est ultra réactif.",
    rating: 5
  },
  {
    name: "Léa Bernard",
    profession: "Nail artist",
    instagram: "@lea_nails",
    image: "https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
    text: "Mes finances sont enfin claires, mes objectifs suivis, et mes clientes fidélisées. Belaya c'est le game changer.",
    rating: 5
  },
  {
    name: "Julie Petit",
    profession: "Maquilleuse pro",
    instagram: "@julie_makeup",
    image: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
    text: "La galerie inspiration et le CRM client sont parfaits. Je gagne un temps fou et mes réservations ont explosé.",
    rating: 5
  },
  {
    name: "Chloé Laurent",
    profession: "Esthéticienne",
    instagram: "@chloe_skincare",
    image: "https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
    text: "Simple, efficace, et pensé pour nous. J'ai enfin une vision claire de mon business. Merci Belaya.",
    rating: 5
  }
];

export default function TestimonialsSlider() {
  return (
    <div className="w-full overflow-hidden py-12 bg-gradient-to-b from-white to-rose-50/30">
      <div className="mb-12 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-belaya-powder via-belaya-bright to-belaya-deep bg-clip-text text-transparent">
          Elles ont testé, elles adorent
        </h2>
        <p className="text-lg text-gray-600">
          Rejoins des centaines de pros beauté qui pilotent leur activité avec sérénité
        </p>
      </div>

      <div className="relative">
        <div className="flex gap-6 animate-scroll-right mb-6">
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <div
              key={`right-${index}`}
              className="flex-shrink-0 w-[400px] bg-white rounded-2xl p-6 shadow-lg border border-brand-100/50 hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-100 shadow-md">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.profession}</p>
                  <a
                    href={`https://instagram.com/${testimonial.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-belaya-bright hover:text-belaya-deep transition-colors"
                  >
                    <Instagram className="w-3 h-3" />
                    {testimonial.instagram}
                  </a>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-belaya-vivid text-belaya-vivid" />
                ))}
              </div>

              <p className="text-gray-700 text-sm leading-relaxed">
                {testimonial.text}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-6 animate-scroll-left">
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <div
              key={`left-${index}`}
              className="flex-shrink-0 w-[400px] bg-white rounded-2xl p-6 shadow-lg border border-brand-100/50 hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-100 shadow-md">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.profession}</p>
                  <a
                    href={`https://instagram.com/${testimonial.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-belaya-bright hover:text-belaya-deep transition-colors"
                  >
                    <Instagram className="w-3 h-3" />
                    {testimonial.instagram}
                  </a>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-belaya-vivid text-belaya-vivid" />
                ))}
              </div>

              <p className="text-gray-700 text-sm leading-relaxed">
                {testimonial.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scroll-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scroll-left {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }

        .animate-scroll-right {
          animation: scroll-right 22s linear infinite;
        }

        .animate-scroll-left {
          animation: scroll-left 22s linear infinite;
        }

        .animate-scroll-right:hover,
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
