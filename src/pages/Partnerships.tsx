import { useState, useEffect } from 'react';
import { Plus, Handshake, TrendingUp, Users, Percent, Clock, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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

export default function Partnerships() {
  const { user } = useAuth();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [sales, setSales] = useState<PartnershipSale[]>([]);
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
          <p className="text-gray-600 mt-1">Gérez et suivez vos partenariats stratégiques</p>
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
            <span className="text-sm font-medium text-gray-700">Revenus générés</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toFixed(2)} €</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Partenaires actifs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.activeCount}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Percent className="w-5 h-5 text-purple-600" />
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
            <span className="text-sm font-medium text-gray-700">À encaisser</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingRevenue.toFixed(2)} €</p>
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

      {partnerships.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Handshake className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun partenariat</h3>
          <p className="text-gray-600 mb-6">Commencez à créer vos premiers partenariats pour développer votre activité</p>
          <button
            onClick={handleAddPartnership}
            className="inline-flex items-center gap-2 px-4 py-2 bg-belleya-500 text-white rounded-lg hover:bg-belleya-primary transition-colors"
          >
            <Plus className="w-5 h-5" />
            Créer mon premier partenariat
          </button>
        </div>
      ) : (
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
        </div>
      )}

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
