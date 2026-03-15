import { useEffect, useState } from 'react';
import { Settings, X, ArrowRight, CheckCircle, CreditCard, Calendar, User } from 'lucide-react';

interface WelcomeVideoModalProps {
  onGoToSettings: () => void;
  onDismiss: () => void;
}

const steps = [
  {
    icon: User,
    label: 'Votre profil pro',
    description: 'Nom, photo, statut juridique',
    color: 'bg-rose-100 text-rose-600',
  },
  {
    icon: CreditCard,
    label: 'Vos paiements',
    description: 'Stripe ou PayPal pour encaisser',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Calendar,
    label: 'Votre agenda',
    description: 'Horaires et prise de RDV en ligne',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Settings,
    label: 'Vos services',
    description: 'Prestations, tarifs, suppléments',
    color: 'bg-sky-100 text-sky-600',
  },
];

export default function WelcomeVideoModal({ onGoToSettings, onDismiss }: WelcomeVideoModalProps) {
  const [visible, setVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center px-4 transition-all duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: 'rgba(15,10,20,0.72)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${
          visible ? 'translate-y-0 scale-100' : 'translate-y-6 scale-95'
        }`}
      >
        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-rose-400 px-8 pt-8 pb-10">
          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Logo area */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow">
              <img src="/belaya_logo.png" alt="Belaya" className="w-7 h-7 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <span className="text-white font-bold text-lg tracking-wide">Belaya</span>
          </div>

          <h2 className="text-white text-2xl font-bold leading-tight mb-2">
            Bienvenue sur Belaya !
          </h2>
          <p className="text-rose-100 text-sm leading-relaxed">
            Pour que votre business tourne a plein regime, commencez par configurer votre espace en 4 etapes simples.
          </p>

          {/* Decorative circles */}
          <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-2 -right-16 w-20 h-20 rounded-full bg-white/5" />
        </div>

        {/* Animated steps illustration */}
        <div className="px-8 py-6 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Les etapes cles du parametrage
          </p>
          <div className="grid grid-cols-2 gap-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = activeStep === i;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${
                    isActive
                      ? 'border-rose-300 bg-rose-50 shadow-sm scale-[1.02]'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${step.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate transition-colors ${isActive ? 'text-rose-700' : 'text-gray-800'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-400 leading-tight mt-0.5">{step.description}</p>
                  </div>
                  {isActive && (
                    <CheckCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-4 px-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeStep === i ? 'w-6 bg-rose-500' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* CTAs */}
        <div className="px-8 pb-8 pt-5 flex flex-col gap-3">
          <button
            onClick={onGoToSettings}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-rose-200 transition-all duration-200 active:scale-95"
          >
            <Settings className="w-5 h-5" />
            Aller aux parametres
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
          <button
            onClick={onDismiss}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Passer pour l'instant
          </button>
        </div>
      </div>
    </div>
  );
}
