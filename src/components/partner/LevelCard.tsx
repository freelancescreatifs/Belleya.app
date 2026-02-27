import { Target, Zap, Award, Crown, ChevronRight } from 'lucide-react';
import {
  AffiliateData,
  LEVEL_CONFIG,
  AffiliateLevel,
  getNextLevel,
  getLevelProgress,
  getEffectiveCommissionRate,
} from '../../lib/affiliateHelpers';

const LEVEL_ICONS = {
  target: Target,
  zap: Zap,
  award: Award,
  crown: Crown,
};

interface LevelCardProps {
  affiliate: AffiliateData;
}

export default function LevelCard({ affiliate }: LevelCardProps) {
  const level = (affiliate.level || 'recrue') as AffiliateLevel;
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.recrue;
  const nextLevel = getNextLevel(level);
  const nextConfig = nextLevel ? LEVEL_CONFIG[nextLevel] : null;
  const progress = getLevelProgress(affiliate.active_sub_count || 0, level);
  const commissionRate = getEffectiveCommissionRate(affiliate);
  const IconComponent = LEVEL_ICONS[config.icon as keyof typeof LEVEL_ICONS] || Target;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${config.border} p-6 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <IconComponent className="w-full h-full" />
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
              <IconComponent className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Ton niveau</h3>
              <p className={`text-xl font-bold ${config.color}`}>{config.label}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Commission</p>
          <p className={`text-2xl font-bold ${config.color}`}>{(commissionRate * 100).toFixed(0)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">Abonnes actifs</p>
          <p className="text-lg font-bold text-gray-900">{affiliate.active_sub_count || 0}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">Total gagne</p>
          <p className="text-lg font-bold text-emerald-600">{Number(affiliate.total_earned || 0).toFixed(2)} EUR</p>
        </div>
      </div>

      {nextConfig && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">
              Progression vers {nextConfig.label}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>{affiliate.active_sub_count || 0}</span>
              <ChevronRight className="w-3 h-3" />
              <span>{nextConfig.min} abonnes</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full ${config.bg.replace('100', '400')} rounded-full transition-all duration-700 ease-out`}
              style={{
                width: `${progress}%`,
                background: level === 'recrue' ? '#9ca3af' : level === 'closer' ? '#3b82f6' : level === 'pro' ? '#f59e0b' : '#e11d48',
              }}
            />
          </div>
          <p className="text-right text-xs text-gray-400 mt-1">{progress.toFixed(0)}%</p>
        </div>
      )}

      {!nextConfig && (
        <div className="text-center py-2">
          <p className="text-sm font-semibold text-rose-600">Niveau maximum atteint</p>
        </div>
      )}
    </div>
  );
}
