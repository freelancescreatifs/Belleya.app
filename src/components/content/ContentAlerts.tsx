import { X, AlertCircle, Lightbulb, Calendar } from 'lucide-react';

interface Alert {
  id: string;
  alert_type: 'marronnier' | 'tip' | 'reminder';
  title: string;
  message: string;
  related_date: string | null;
  status: 'active' | 'dismissed';
}

interface ContentAlertsProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
}

export default function ContentAlerts({ alerts, onDismiss }: ContentAlertsProps) {
  function getAlertIcon(type: string) {
    switch (type) {
      case 'marronnier':
        return <Calendar className="w-5 h-5" />;
      case 'tip':
        return <Lightbulb className="w-5 h-5" />;
      case 'reminder':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  }

  function getAlertColors(type: string) {
    switch (type) {
      case 'marronnier':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'tip':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'reminder':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  }

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 p-4 rounded-xl border ${getAlertColors(alert.alert_type)}`}
        >
          <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.alert_type)}</div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{alert.title}</h3>
            <p className="text-sm opacity-90">{alert.message}</p>
            {alert.related_date && (
              <p className="text-xs mt-2 opacity-75">
                Date: {new Date(alert.related_date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            )}
          </div>
          <button
            onClick={() => onDismiss(alert.id)}
            className="flex-shrink-0 p-1 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
