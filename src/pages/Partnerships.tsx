import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Users, Percent, Clock, Star, UserCheck, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useIsAdmin } from '../hooks/useIsAdmin';
import PartnershipCard from '../components/partnerships/PartnershipCard';
import PartnershipDetailDrawer from '../components/partnerships/PartnershipDetailDrawer';
import PartnershipFormModal from '../components/partnerships/PartnershipFormModal';
import BelleyaRewardsCard from '../components/partnerships/BelleyaRewardsCard';

interface Partnership {
  id: string;
  company_name: string;
  logo_url: string | null;
  partnership_type: 'affiliation' | 'recommandation' | 'sponsoring' | 'formation';
  commission_rate: number;
  compensation_mode: 'percentage' | 'fixed' | 'recurring';
  affiliate_link: string | null;
  promo_code: string | null;
  status: 'active' | 'pending' | 'completed';
  start_date: string | null;
  end_date: string | null;
  conditions: string | null;
  estimated_goal: number;
  is_default: boolean;
  is_client_support_involved: boolean;
  last_action: string | null;
  next_action: string | null;
  promotion_frequency: string | null;
  notes: string | null;
}

interface PartnershipSale {
  id: string;
  partnership_id: string;
  sale_date: string;
  sale_amount: number;
  commission_earned: number;
  payment_status: 'pending' | 'paid';
}

interface ApprovedAffiliate {
  id: string;
  full_name: string;
  email: string;
  ref_code: string;
  level: string;
  status: string;
  active_sub_count: number;
  base_commission_rate: number;
  created_at: string;
}

const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  recrue: { label: 'Recrue', color: 'bg-gray-100 text-gray-700' },
  closer: { label: 'Closer', color: 'bg-blue-100 text-blue-700' },
  pro: { label: 'Pro', color: 'bg-amber-100 text-amber-700' },
  elite: { label: 'Elite', color: 'bg-rose-100 text-rose-700' },
};

export default function Partnerships() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [sales, setSales] = useState<PartnershipSale[]>([]);
  const [approvedAffiliates, setApprovedAffiliates] = useState<ApprovedAffiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<Partnership | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) loadAffiliates();
  }, [isAdmin]);

  const loadAffiliates = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, full_name, email, ref_code, level, status, active_sub_count, base_commission_rate, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading affiliates:', error);
        return;
      }

      setApprovedAffiliates(data || []);
    } catch (err) {
      console.error('Error loading affiliates:', err);
    }
  };

  const loadData = async () => {
    if (!user) return;

    try {
      const [partnershipsResult, salesResult] = await Promise.all([
        supabase
          .from('partnerships')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('partnership_sales')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (partnershipsResult.error) throw partnershipsResult.error;
      if (salesResult.error) throw salesResult.error;

      const partnershipsData = partnershipsResult.data || [];

      const hasBelleya = partnershipsData.some(p => p.is_default && p.company_name === 'Belleya');

      if (!hasBelleya) {
        const { error: insertError } = await supabase
          .from('partnerships')
          .insert({
            user_id: user.id,
            company_name: 'Belleya',
            partnership_type: 'affiliation',
            commission_rate: 25,
            compensation_mode: 'recurring',
            status: 'active',
            start_date: new Date().toISOString().split('T')[0],
            conditions: 'Programme officiel Belleya - Commission mensuelle sur chaque vente HT. 25% par défaut, 30% si impliqué dans le service client.',
            is_default: true,
            is_client_support_involved: false,
            notes: 'Partenariat officiel Belleya avec commission récurrente mensuelle.'
          });

        if (insertError) {
          console.error('Error creating Belleya partnership:', insertError);
        } else {
          const { data: refreshedData } = await supabase
            .from('partnerships')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

          setPartnerships(refreshedData || []);
          setSales(salesResult.data || []);
          setLoading(false);
          return;
        }
      }

      setPartnerships(partnershipsData);
      setSales(salesResult.data || []);
    } catch (error) {
      console.error('Error loading partnerships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartnershipClick = (partnership: Partnership) => {
    setSelectedPartnership(partnership);
    setShowDetailDrawer(true);
  };

  const handleAddPartnership = () => {
    setEditingPartnership(null);
    setShowFormModal(true);
  };

  const handleEditPartnership = (partnership: Partnership) => {
    setEditingPartnership(partnership);
    setShowFormModal(true);
  };

  const calculateStats = () => {
    const activePartnerships = partnerships.filter(p => p.status === 'active');

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.commission_earned, 0);

    const pendingRevenue = sales
      .filter(s => s.payment_status === 'pending')
      .reduce((sum, sale) => sum + sale.commission_earned, 0);

    const avgCommission = activePartnerships.length > 0
      ? activePartnerships.reduce((sum, p) => sum + p.commission_rate, 0) / activePartnerships.length
      : 0;

    const partnershipRevenues = partnerships.map(p => {
      const partnershipSales = sales.filter(s => s.partnership_id === p.id);
      const revenue = partnershipSales.reduce((sum, s) => sum + s.commission_earned, 0);
      return { partnership: p, revenue };
    });

    const topPartnership = partnershipRevenues.sort((a, b) => b.revenue - a.revenue)[0];

    return {
      totalRevenue,
      activeCount: activePartnerships.length,
      avgCommission,
      pendingRevenue,
      topPartnership: topPartnership?.partnership.company_name || '-'
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E51E8F]"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partenariats</h1>
          <p className="text-gray-600 mt-1">Gerez et suivez vos partenariats strategiques</p>
        </div>
        <button
          onClick={handleAddPartnership}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-400 text-white rounded-lg hover:from-rose-600 hover:to-pink-500 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Nouveau partenariat
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-belleya-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-belleya-bright" />
            </div>
            <span className="text-sm font-medium text-gray-700">Revenus generes</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toFixed(2)} EUR</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Partenaires actifs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeCount + approvedAffiliates.length}</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Percent className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Commission moyenne</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.avgCommission.toFixed(1)} %</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">A encaisser</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingRevenue.toFixed(2)} EUR</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border border-belleya-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Star className="w-5 h-5 text-belleya-primary" />
            </div>
            <span className="text-sm font-medium text-gray-700">Plus rentable</span>
          </div>
          <p className="text-lg font-bold text-gray-900 truncate">{stats.topPartnership}</p>
        </div>
      </div>

      {isAdmin && approvedAffiliates.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#efaa9a]/20 to-[#d9629b]/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-[#d9629b]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Affilies approuves</h3>
                <p className="text-sm text-gray-500">{approvedAffiliates.length} partenaire{approvedAffiliates.length > 1 ? 's' : ''} actif{approvedAffiliates.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <a
              href="/partenaire"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-[#d9629b] hover:underline"
            >
              Programme partenaire
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Niveau</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Abonnes</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Commission</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {approvedAffiliates.map(aff => {
                  const levelInfo = LEVEL_LABELS[aff.level] || LEVEL_LABELS.recrue;
                  return (
                    <tr key={aff.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#efaa9a] to-[#d9629b] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(aff.full_name || 'P').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{aff.full_name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 hidden sm:table-cell">{aff.email || '-'}</td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{aff.ref_code}</code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${levelInfo.color}`}>
                          {levelInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium hidden md:table-cell">{aff.active_sub_count || 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 hidden md:table-cell">{((aff.base_commission_rate || 0.10) * 100).toFixed(0)}%</td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {new Date(aff.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BelleyaRewardsCard />

        {partnerships.map((partnership) => (
          <PartnershipCard
            key={partnership.id}
            partnership={partnership}
            sales={sales.filter(s => s.partnership_id === partnership.id)}
            onClick={() => handlePartnershipClick(partnership)}
            onEdit={() => handleEditPartnership(partnership)}
          />
        ))}

        {partnerships.length === 0 && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center flex flex-col items-center justify-center hover:border-belleya-300 hover:bg-gray-50 transition-all cursor-pointer group"
            onClick={handleAddPartnership}
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-belleya-50 transition-colors">
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-belleya-500 transition-colors" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Ajouter un partenariat</h3>
            <p className="text-sm text-gray-600">Creez votre premier partenariat</p>
          </div>
        )}
      </div>

      {showDetailDrawer && selectedPartnership && (
        <PartnershipDetailDrawer
          partnership={selectedPartnership}
          sales={sales.filter(s => s.partnership_id === selectedPartnership.id)}
          onClose={() => {
            setShowDetailDrawer(false);
            setSelectedPartnership(null);
          }}
          onUpdate={loadData}
        />
      )}

      {showFormModal && (
        <PartnershipFormModal
          partnership={editingPartnership}
          onClose={() => {
            setShowFormModal(false);
            setEditingPartnership(null);
          }}
          onSave={loadData}
        />
      )}
      </div>
    </div>
  );
}
