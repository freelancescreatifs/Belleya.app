import { TrendingUp, Calendar, AlertCircle, CheckCircle, Clock, Edit, Sparkles } from 'lucide-react';

interface Partnership {
  id: string;
  company_name: string;
  logo_url: string | null;
  partnership_type: 'affiliation' | 'recommandation' | 'sponsoring' | 'formation';
  commission_rate: number;
  compensation_mode: 'percentage' | 'fixed' | 'recurring';
  status: 'active' | 'pending' | 'completed';
  start_date: string | null;
  end_date: string | null;
  is_default: boolean;
  is_client_support_involved: boolean;
}

interface PartnershipSale {
  sale_amount: number;
  commission_earned: number;
  payment_status: 'pending' | 'paid';
}

interface PartnershipCardProps {
  partnership: Partnership;
  sales: PartnershipSale[];
  onClick: () => void;
  onEdit: () => void;
}

const partnershipTypeLabels = {
  affiliation: 'Affiliation',
  recommandation: 'Recommandation',
  sponsoring: 'Sponsoring',
  formation: 'Formation'
};

const compensationModeLabels = {
  percentage: '% sur vente',
  fixed: 'Montant fixe',
  recurring: 'Récurrent'
};

const statusConfig = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-700 border-belaya-200', icon: CheckCircle },
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  completed: { label: 'Terminé', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle }
};

export default function PartnershipCard({ partnership, sales, onClick, onEdit }: PartnershipCardProps) {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.commission_earned, 0);
  const totalSales = sales.length;
  const pendingRevenue = sales
    .filter(s => s.payment_status === 'pending')
    .reduce((sum, sale) => sum + sale.commission_earned, 0);

  const status = statusConfig[partnership.status];
  const StatusIcon = status.icon;

  const effectiveCommissionRate = partnership.is_default && partnership.is_client_support_involved
    ? 30
    : partnership.commission_rate;

  const getRentabilityStatus = () => {
    if (totalRevenue >= 1000) return { label: 'Rentable', color: 'text-belaya-bright', icon: '🟢' };
    if (totalRevenue >= 300) return { label: 'Moyen', color: 'text-amber-600', icon: '🟡' };
    return { label: 'Peu rentable', color: 'text-red-600', icon: '🔴' };
  };

  const rentability = getRentabilityStatus();

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border-2 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        partnership.is_default ? 'border-belaya-300 bg-gradient-to-br from-rose-50/50 to-pink-50/50' : 'border-gray-200 hover:border-belaya-300'
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="absolute top-4 left-4 p-2 bg-white rounded-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50 z-10"
      >
        <Edit className="w-4 h-4 text-gray-600" />
      </button>

      <div className="flex items-start gap-4 mb-4">
        {partnership.is_default ? (
          <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center border border-belaya-200 flex-shrink-0">
            <span className="text-2xl font-bold text-belaya-primary">B</span>
          </div>
        ) : partnership.logo_url ? (
          <img
            src={partnership.logo_url}
            alt={partnership.company_name}
            className="w-16 h-16 rounded-xl object-cover border border-gray-200 flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center border border-belaya-200 flex-shrink-0">
            <span className="text-2xl font-bold text-belaya-primary">
              {partnership.company_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xl font-bold text-gray-900">{partnership.company_name}</h3>
            {partnership.is_default && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                <Sparkles className="w-3 h-3" />
                Officiel
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{partnershipTypeLabels[partnership.partnership_type]}</p>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-2 ${status.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <span className="text-sm text-gray-600">
            {partnership.is_default ? 'Récompense' : 'Commission'}
          </span>
          <span className="text-sm font-semibold text-gray-900">{effectiveCommissionRate} %</span>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <span className="text-sm text-gray-600">Mode</span>
          <span className="text-sm font-medium text-gray-900">
            {compensationModeLabels[partnership.compensation_mode]}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <span className="text-sm text-gray-600">Ventes générées</span>
          <span className="text-sm font-semibold text-gray-900">{totalSales}</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-belaya-200 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-belaya-bright" />
          <span className="text-xs font-medium text-gray-700">Revenus générés</span>
        </div>
        <p className="text-xl font-bold text-gray-900">{totalRevenue.toFixed(2)} €</p>
        {pendingRevenue > 0 && (
          <p className="text-xs text-amber-700 mt-1">
            {pendingRevenue.toFixed(2)} € à encaisser
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-lg">{rentability.icon}</span>
          <span className={`text-sm font-semibold ${rentability.color}`}>{rentability.label}</span>
        </div>

        {partnership.start_date && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {new Date(partnership.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  );
}
