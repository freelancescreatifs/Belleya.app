import { AlertTriangle, Flame } from 'lucide-react';
import { ZoneRougeEntry } from '../../lib/affiliateHelpers';

interface ZoneRougeCardProps {
  entries: ZoneRougeEntry[];
}

export default function ZoneRougeCard({ entries }: ZoneRougeCardProps) {
  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
      <div className="p-6 border-b border-red-100 bg-red-50/50">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-bold text-red-800">Zone Rouge</h3>
        </div>
        <p className="text-sm text-red-600 mt-1">
          Partenaires sans inscription depuis +7 jours
        </p>
      </div>
      <div className="divide-y divide-red-50">
        {entries.slice(0, 10).map((e, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-6 py-3 hover:bg-red-50/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-4 h-4 ${
                e.daysSinceLastSignup >= 30 ? 'text-red-600' :
                e.daysSinceLastSignup >= 14 ? 'text-orange-500' :
                'text-amber-500'
              }`} />
              <span className="text-sm font-medium text-gray-900">{e.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                e.daysSinceLastSignup >= 30
                  ? 'bg-red-100 text-red-700'
                  : e.daysSinceLastSignup >= 14
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {e.daysSinceLastSignup}j sans inscription
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
