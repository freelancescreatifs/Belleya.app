import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const TIPS = [
  "Un ongle bien preparé est un ongle qui dure plus longtemps.",
  "Pensez à hydrater vos cuticules chaque jour pour un resultat impeccable.",
  "80% des clientes reviennent grâce à un service personnalisé.",
  "L'exfoliation douce améliore la tenue du vernis de 40%.",
  "Relancez vos clientes inactives : elles n'attendent que ça !",
  "Le soin des mains booste la satisfaction client de 25%.",
  "Organisez votre agenda du lendemain chaque soir pour gagner du temps.",
  "La vitamine E est l'alliée n°1 des ongles fragiles.",
  "Un message de rappel réduit les no-shows de 60%.",
  "Massez la base de l'ongle pour stimuler la croissance naturelle.",
  "Fixez 3 objectifs par semaine pour avancer régulièrement.",
  "L'huile de jojoba nourrit les cuticules sans les graisser.",
  "Prenez des photos avant/après : c'est votre meilleure pub !",
  "Un gommage doux avant la pose améliore l'adhérence du gel.",
  "Fidélisez vos clientes : c'est 5x moins cher que d'en trouver de nouvelles.",
  "Le temps de séchage idéal sous lampe LED est de 30 à 60 secondes.",
  "Bloquez du temps chaque semaine pour votre comptabilité.",
  "Les ongles poussent plus vite en été grâce à la chaleur.",
  "Un bon éclairage professionnel change tout pour vos prestations.",
  "Proposez des formules fidélité pour encourager les retours réguliers.",
];

interface BelayaLoaderProps {
  variant?: 'full' | 'section' | 'inline';
  message?: string;
  showTimer?: boolean;
  timerDuration?: number;
  showTips?: boolean;
  className?: string;
}

export default function BelayaLoader({
  variant = 'section',
  message,
  showTimer = false,
  timerDuration = 10,
  showTips = false,
  className = '',
}: BelayaLoaderProps) {
  const [countdown, setCountdown] = useState(timerDuration);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [tipVisible, setTipVisible] = useState(true);

  useEffect(() => {
    if (!showTimer) return;
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [showTimer, countdown]);

  useEffect(() => {
    if (!showTips) return;
    const interval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex(prev => (prev + 1) % TIPS.length);
        setTipVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, [showTips]);

  if (variant === 'inline') {
    return (
      <div className={`flex items-center justify-center gap-2 py-6 ${className}`}>
        <div className="belaya-dots flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-belaya-bright animate-belaya-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-belaya-medium animate-belaya-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-belaya-deep animate-belaya-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        {message && <span className="text-sm text-gray-500">{message}</span>}
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
        <div className="relative w-16 h-16 mb-5">
          <img
            src="/belaya_logo.png"
            alt="Belaya"
            className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover animate-belaya-pulse"
          />
          <svg className="absolute inset-0 w-16 h-16 animate-belaya-ring" viewBox="0 0 64 64">
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke="url(#belaya-ring-gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="120 56"
            />
            <defs>
              <linearGradient id="belaya-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eea09e" />
                <stop offset="50%" stopColor="#db58a2" />
                <stop offset="100%" stopColor="#c43586" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <p className="text-sm text-gray-500 font-medium">
          {message || 'Chargement...'}
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-belaya-50 flex flex-col items-center justify-center px-6 ${className}`}>
      <div className="flex flex-col items-center max-w-sm w-full">
        <div className="relative w-24 h-24 mb-6">
          <img
            src="/belaya_logo.png"
            alt="Belaya"
            className="w-14 h-14 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full object-cover animate-belaya-pulse"
          />
          <svg className="absolute inset-0 w-24 h-24 animate-belaya-ring" viewBox="0 0 96 96">
            <circle
              cx="48" cy="48" r="42"
              fill="none"
              stroke="url(#belaya-ring-gradient-full)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="180 84"
            />
            <defs>
              <linearGradient id="belaya-ring-gradient-full" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eea09e" />
                <stop offset="50%" stopColor="#db58a2" />
                <stop offset="100%" stopColor="#c43586" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <p className="text-base text-gray-600 font-medium mb-2">
          {message || 'Préparation de vos données...'}
        </p>

        {showTimer && countdown > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="13" fill="none" stroke="#f3e8f4" strokeWidth="2.5" />
                <circle
                  cx="16" cy="16" r="13" fill="none"
                  stroke="url(#timer-gradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${(countdown / timerDuration) * 81.68} 81.68`}
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#db58a2" />
                    <stop offset="100%" stopColor="#eea09e" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-belaya-deep">
                {countdown}
              </span>
            </div>
            <span className="text-xs text-gray-400">secondes</span>
          </div>
        )}

        {showTips && (
          <div className="mt-4 w-full bg-white/80 backdrop-blur-sm rounded-xl border border-belaya-100 p-4 min-h-[80px] flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-belaya-bright flex-shrink-0 mt-0.5" />
            <p
              className={`text-xs text-gray-500 leading-relaxed transition-all duration-300 ${
                tipVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
              }`}
            >
              {TIPS[tipIndex]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
