import { useState, useEffect } from 'react';

const keywords = [
  'Tâches',
  'Projets',
  'Réseaux sociaux',
  'Stocks',
  'Revenus',
  'Dépenses',
  'Objectifs',
  'Inspirations',
  'Clientes',
  'Marketing',
  'Affiliations'
];

export default function AnimatedKeywords() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % keywords.length);
        setIsVisible(true);
      }, 250);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="text-center px-4 py-12"
      style={{
        background: 'linear-gradient(to bottom, #FFE8D7, #FFFDF8)'
      }}
    >
      <div className="max-w-5xl mx-auto">
        <h1
          className="text-2xl md:text-4xl lg:text-5xl font-bold mb-6"
          style={{ color: '#711341' }}
        >
          TOUT TON BUSINESS AU MÊME ENDROIT
        </h1>

        <div className="flex items-center justify-center text-2xl md:text-4xl lg:text-5xl font-bold">
          <div className="relative h-12 md:h-16 flex items-center">
            <span
              className={`inline-block transition-all duration-250 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
              }`}
              style={{ color: '#D8639B' }}
            >
              {keywords[currentIndex]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
