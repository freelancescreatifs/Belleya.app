import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface ToastNotificationProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export default function ToastNotification({ toast, onDismiss }: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const styles = {
    success: 'bg-belaya-50 border-belaya-200 text-belaya-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-brand-50 border-brand-200 text-brand-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };

  const iconStyles = {
    success: 'text-belaya-vivid',
    error: 'text-red-600',
    info: 'text-brand-600',
    warning: 'text-amber-600',
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${styles[toast.type]} animate-slide-in`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconStyles[toast.type]}`} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
