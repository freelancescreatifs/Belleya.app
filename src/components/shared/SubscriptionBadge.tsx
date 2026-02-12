import { Crown, Star } from 'lucide-react';

interface SubscriptionBadgeProps {
  planType: 'start' | 'studio' | 'empire' | 'vip' | null;
  className?: string;
}

export default function SubscriptionBadge({ planType, className = '' }: SubscriptionBadgeProps) {
  if (!planType) return null;

  const configs = {
    start: {
      icon: Star,
      label: 'Start',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    },
    studio: {
      icon: Star,
      label: 'Studio',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      iconColor: 'text-purple-600'
    },
    empire: {
      icon: Crown,
      label: 'Empire',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-800',
      iconColor: 'text-amber-600'
    },
    vip: {
      icon: Crown,
      label: 'VIP',
      bgColor: 'bg-rose-100',
      textColor: 'text-rose-800',
      iconColor: 'text-rose-600'
    }
  };

  const config = configs[planType];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${config.bgColor} ${className}`}>
      <Icon className={`w-4 h-4 ${config.iconColor}`} />
      <span className={`text-sm font-semibold ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
}
