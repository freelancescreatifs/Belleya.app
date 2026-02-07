import { AlertTriangle } from 'lucide-react';

interface ConflictWarningProps {
  conflicts: Array<{ title: string; start: string; end: string }>;
}

export default function ConflictWarning({ conflicts }: ConflictWarningProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-900 mb-1">
            Conflit détecté
          </h4>
          <p className="text-sm text-amber-800 mb-2">
            Ce créneau chevauche {conflicts.length} autre{conflicts.length > 1 ? 's' : ''} événement{conflicts.length > 1 ? 's' : ''} :
          </p>
          <ul className="space-y-1">
            {conflicts.map((conflict, index) => (
              <li key={index} className="text-sm text-amber-800">
                • {conflict.title} ({new Date(conflict.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(conflict.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
