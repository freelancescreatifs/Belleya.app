import { ReactNode } from 'react';
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface AlertCardProps {
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  onDismiss?: () => void;
  onLearnMore?: () => void;
}

export default function AlertCard({
  title,
  message,
  priority = 'medium',
  dueDate,
  onDismiss,
  onLearnMore,
}: AlertCardProps) {
  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-900',
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          button: 'bg-red-600 hover:bg-red-700',
        };
      case 'medium':
        return {
          bg: 'bg-amber-50 border-amber-200',
          text: 'text-amber-900',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          button: 'bg-amber-600 hover:bg-amber-700',
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-900',
          icon: <Info className="w-5 h-5 text-blue-500" />,
          button: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const styles = getPriorityStyles();

  return (
    <div className={`rounded-xl p-4 border ${styles.bg} relative`}>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-start gap-3 pr-8">
        {styles.icon}
        <div className="flex-1">
          <h3 className={`font-semibold text-sm mb-1 ${styles.text}`}>{title}</h3>
          <p className="text-sm text-gray-700 mb-3">{message}</p>

          {dueDate && (
            <p className="text-xs text-gray-600 mb-3">
              Échéance : {new Date(dueDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}

          {onLearnMore && (
            <button
              onClick={onLearnMore}
              className={`text-xs font-medium text-white px-3 py-1.5 rounded-lg transition-colors ${styles.button}`}
            >
              Comprendre
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
