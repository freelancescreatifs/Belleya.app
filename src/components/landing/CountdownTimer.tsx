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
    <div className="flex items-center justify-center gap-3 md:gap-4 text-sm md:text-base">
      <Clock className="w-4 h-4 md:w-5 md:h-5 text-belaya-deep animate-pulse flex-shrink-0" />
      <span className="text-gray-700 font-medium">
        Offre limitée : <span className="font-bold text-belaya-deep">14 jours gratuits</span>
      </span>
      <span className="hidden sm:inline text-gray-400">|</span>
      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 shadow-sm">
          <span className="text-lg md:text-xl font-bold text-belaya-deep">
            {formatNumber(timeLeft.hours)}
          </span>
          <span className="text-xs text-gray-500">h</span>
        </div>
        <span className="text-belaya-medium font-bold">:</span>
        <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 shadow-sm">
          <span className="text-lg md:text-xl font-bold text-belaya-deep">
            {formatNumber(timeLeft.minutes)}
          </span>
          <span className="text-xs text-gray-500">m</span>
        </div>
        <span className="text-belaya-medium font-bold">:</span>
        <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 shadow-sm">
          <span className="text-lg md:text-xl font-bold text-belaya-deep">
            {formatNumber(timeLeft.seconds)}
          </span>
          <span className="text-xs text-gray-500">s</span>
        </div>
      </div>
    </div>
  );
}
