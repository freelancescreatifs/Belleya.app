import { Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface InfoTooltipProps {
  content: string;
}

export default function InfoTooltip({ content }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' as 'top' | 'bottom' | 'left' | 'right' });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 260;
      const tooltipHeight = 80;
      const margin = 12;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;
      let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';

      const spaceAbove = buttonRect.top;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceLeft = buttonRect.left;
      const spaceRight = viewportWidth - buttonRect.right;

      if (spaceAbove >= tooltipHeight + margin) {
        placement = 'top';
        top = buttonRect.top - tooltipHeight - margin;
        left = buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2;
      } else if (spaceBelow >= tooltipHeight + margin) {
        placement = 'bottom';
        top = buttonRect.bottom + margin;
        left = buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2;
      } else if (spaceRight >= tooltipWidth + margin) {
        placement = 'right';
        top = buttonRect.top + buttonRect.height / 2 - tooltipHeight / 2;
        left = buttonRect.right + margin;
      } else if (spaceLeft >= tooltipWidth + margin) {
        placement = 'left';
        top = buttonRect.top + buttonRect.height / 2 - tooltipHeight / 2;
        left = buttonRect.left - tooltipWidth - margin;
      } else {
        placement = 'bottom';
        top = buttonRect.bottom + margin;
        left = buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2;
      }

      if (left < margin) left = margin;
      if (left + tooltipWidth > viewportWidth - margin) {
        left = viewportWidth - tooltipWidth - margin;
      }

      if (top < margin) top = margin;
      if (top + tooltipHeight > viewportHeight - margin) {
        top = viewportHeight - tooltipHeight - margin;
      }

      setPosition({ top, left, placement });
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    const handleScroll = () => {
      setIsVisible(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isVisible]);

  const getArrowStyles = () => {
    if (!buttonRef.current) return {};
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const arrowLeft = buttonCenterX - position.left;

    switch (position.placement) {
      case 'top':
        return {
          position: 'absolute' as const,
          bottom: '-4px',
          left: `${arrowLeft}px`,
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid rgb(17, 24, 39)',
        };
      case 'bottom':
        return {
          position: 'absolute' as const,
          top: '-4px',
          left: `${arrowLeft}px`,
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '6px solid rgb(17, 24, 39)',
        };
      case 'left':
        return {
          position: 'absolute' as const,
          right: '-4px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderLeft: '6px solid rgb(17, 24, 39)',
        };
      case 'right':
        return {
          position: 'absolute' as const,
          left: '-4px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: '6px solid rgb(17, 24, 39)',
        };
    }
  };

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    leaveTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
          setIsVisible(!isVisible);
        }}
        className="text-gray-400 hover:text-belleya-500 transition-colors inline-flex items-center"
        aria-label="Plus d'informations"
      >
        <Info className="w-4 h-4" />
      </button>

      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 9999,
              maxWidth: '260px',
              width: 'auto',
            }}
            className="px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-xl animate-in fade-in duration-200"
          >
            <div className="relative whitespace-normal break-words">
              {content}
              <div style={getArrowStyles()} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
