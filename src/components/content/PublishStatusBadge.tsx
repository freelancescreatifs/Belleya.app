import { CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';

interface PublishStatusBadgeProps {
  status?: string | null;
  compact?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  success: {
    label: 'Publie',
    icon: CheckCircle,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  pending: {
    label: 'En cours',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  scheduled: {
    label: 'Programme',
    icon: Send,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  error: {
    label: 'Erreur',
    icon: AlertCircle,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

export default function PublishStatusBadge({ status, compact = false }: PublishStatusBadgeProps) {
  if (!status || !STATUS_CONFIG[status]) return null;

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  if (compact) {
    return (
      <span title={`Publication: ${config.label}`}>
        <Icon className={`w-3.5 h-3.5 ${
          status === 'success' ? 'text-emerald-500' :
          status === 'pending' ? 'text-amber-500' :
          status === 'scheduled' ? 'text-blue-500' :
          'text-red-500'
        }`} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
