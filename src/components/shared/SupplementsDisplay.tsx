import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Supplement {
  id?: string;
  name: string;
  price: number;
  duration_minutes?: number;
}

interface SupplementsDisplayProps {
  supplements: Supplement[];
  serviceType?: 'prestation' | 'formation' | 'autre';
  inline?: boolean;
  variant?: 'default' | 'compact';
}

export default function SupplementsDisplay({ supplements, serviceType = 'prestation', inline = false, variant = 'default' }: SupplementsDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!supplements || supplements.length === 0) {
    return null;
  }

  const formatSupplement = (supp: Supplement) => {
    const showDuration = serviceType === 'prestation' && supp.duration_minutes && supp.duration_minutes > 0;
    if (showDuration) {
      return `${supp.name} (+${supp.price}€ • ${supp.duration_minutes} min)`;
    }
    return `${supp.name} (+${supp.price}€)`;
  };

  if (variant === 'compact') {
    return (
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="text-xs bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
        >
          {supplements.length} supplément{supplements.length > 1 ? 's' : ''}
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div
            ref={popoverRef}
            className="absolute z-50 mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[240px] max-w-[320px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              {supplements.map((supp, idx) => (
                <div key={supp.id || idx} className="text-xs text-gray-700 px-2 py-1.5 bg-gray-50 rounded border border-gray-100">
                  {formatSupplement(supp)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (supplements.length === 1) {
    return (
      <span className={inline ? 'text-xs text-gray-600' : 'text-xs bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded'}>
        {formatSupplement(supplements[0])}
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-xs bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
      >
        + {supplements.length} supplément{supplements.length > 1 ? 's' : ''}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute z-50 mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[240px] max-w-[320px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-1.5">
            {supplements.map((supp, idx) => (
              <div key={supp.id || idx} className="text-xs text-gray-700 px-2 py-1.5 bg-gray-50 rounded border border-gray-100">
                {formatSupplement(supp)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
