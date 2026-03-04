import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface EducationalCardProps {
  title: string;
  content: string;
  icon?: ReactNode;
  linkText?: string;
  linkUrl?: string;
  className?: string;
}

export default function EducationalCard({
  title,
  content,
  icon,
  linkText,
  linkUrl,
  className = '',
}: EducationalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-200 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && <div className="text-blue-600 mt-0.5">{icon}</div>}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-2 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
              {linkText && linkUrl && (
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {linkText}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
