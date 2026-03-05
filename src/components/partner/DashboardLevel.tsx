import { Award } from 'lucide-react';
import { getRank, getNextRank, getRankProgress } from '../../lib/affiliateUtils';
import type { AffiliateData } from '../../hooks/useAffiliate';

export default function DashboardLevel({ affiliate }: { affiliate: AffiliateData }) {
  const conversions = affiliate.active_referrals || 0;
  const rank = getRank(conversions);
  const nextRank = getNextRank(conversions);
  const progress = getRankProgress(conversions);
  const effectiveRate = affiliate.temporary_commission_rate
    && affiliate.temporary_rate_end_date
    && new Date(affiliate.temporary_rate_end_date) > new Date()
    ? affiliate.temporary_commission_rate
    : affiliate.base_commission_rate;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-500" />
          Ton niveau
        </h2>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${rank.color}`}>
          {rank.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-0.5">Niveau</p>
          <p className="text-lg font-bold text-gray-900">{rank.label}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-0.5">Commission</p>
          <p className="text-lg font-bold text-emerald-700">{(effectiveRate * 100).toFixed(0)}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-0.5">Abonnes actifs</p>
          <p className="text-lg font-bold text-gray-900">{affiliate.active_sub_count}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-0.5">Conversions</p>
          <p className="text-lg font-bold text-gray-900">{conversions}</p>
        </div>
      </div>

      {nextRank ? (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{conversions} conversions</span>
            <span>{nextRank.min} pour {nextRank.label} ({(nextRank.rate * 100).toFixed(0)}%)</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${rank.barColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Encore {nextRank.min - conversions} conversion{nextRank.min - conversions > 1 ? 's' : ''} pour atteindre {nextRank.label}
          </p>
        </div>
      ) : (
        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
          <p className="text-sm text-rose-700 font-medium">Rang maximum atteint - Felicitations !</p>
        </div>
      )}
    </div>
  );
}
