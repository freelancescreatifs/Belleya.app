import { Trophy } from 'lucide-react';
import { LeaderboardEntry } from '../../lib/affiliateHelpers';

interface LeaderboardCardProps {
  title: string;
  subtitle: string;
  entries: LeaderboardEntry[];
  unit: string;
}

export default function LeaderboardCard({ title, subtitle, entries, unit }: LeaderboardCardProps) {
  const medalColors = ['text-amber-500', 'text-gray-400', 'text-amber-700'];
  const medalBgs = ['bg-amber-50', 'bg-gray-50', 'bg-amber-50/50'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className="divide-y divide-gray-50">
        {entries.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">
            Pas encore de donnees
          </div>
        ) : (
          entries.map(e => (
            <div
              key={e.rank}
              className={`flex items-center justify-between px-6 py-3 transition-colors ${
                e.isCurrentUser
                  ? 'bg-pink-50/60 border-l-2 border-[#d9629b]'
                  : e.rank <= 3
                  ? `${medalBgs[e.rank - 1]} hover:bg-gray-50/80`
                  : 'hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {e.rank <= 3 ? (
                  <div className={`w-8 h-8 rounded-full ${medalBgs[e.rank - 1]} flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${medalColors[e.rank - 1]}`}>
                      {e.rank === 1 ? '1er' : e.rank === 2 ? '2e' : '3e'}
                    </span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-400">{e.rank}</span>
                  </div>
                )}
                <span className={`text-sm font-medium ${e.isCurrentUser ? 'text-[#d9629b] font-bold' : 'text-gray-900'}`}>
                  {e.name} {e.isCurrentUser && '(toi)'}
                </span>
              </div>
              <span className={`text-sm font-semibold ${e.isCurrentUser ? 'text-[#d9629b]' : 'text-gray-700'}`}>
                {typeof e.value === 'number' && unit === 'EUR'
                  ? `${e.value.toFixed(2)} ${unit}`
                  : `${e.value} ${unit}`
                }
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
