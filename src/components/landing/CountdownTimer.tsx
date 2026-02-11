import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const difference = endOfDay.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="relative bg-gradient-to-r from-brand-50 to-brand-100/50 rounded-2xl p-6 border-2 border-brand-100 shadow-lg">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Clock className="w-6 h-6 text-belleya-deep animate-pulse" />
        <h3 className="text-xl font-bold text-gray-900">
          Offre spéciale qui expire dans
        </h3>
      </div>

      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="flex flex-col items-center bg-white rounded-xl px-4 py-3 min-w-[80px] shadow-md">
          <span className="text-3xl font-bold text-belleya-deep">
            {formatNumber(timeLeft.hours)}
          </span>
          <span className="text-xs text-gray-600 font-medium">Heures</span>
        </div>
        <span className="text-2xl font-bold text-belleya-deep">:</span>
        <div className="flex flex-col items-center bg-white rounded-xl px-4 py-3 min-w-[80px] shadow-md">
          <span className="text-3xl font-bold text-belleya-deep">
            {formatNumber(timeLeft.minutes)}
          </span>
          <span className="text-xs text-gray-600 font-medium">Minutes</span>
        </div>
        <span className="text-2xl font-bold text-belleya-deep">:</span>
        <div className="flex flex-col items-center bg-white rounded-xl px-4 py-3 min-w-[80px] shadow-md">
          <span className="text-3xl font-bold text-belleya-deep">
            {formatNumber(timeLeft.seconds)}
          </span>
          <span className="text-xs text-gray-600 font-medium">Secondes</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-lg font-bold text-belleya-deep">
          14 jours gratuits sans CB
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Profite de toutes les fonctionnalités premium
        </p>
      </div>
    </div>
  );
}
