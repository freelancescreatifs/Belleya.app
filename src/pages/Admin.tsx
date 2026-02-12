import { useState, useEffect } from 'react';
import { Users, UserPlus, Activity, Euro, TrendingUp, Percent, Star, Clock, Handshake, Download, Search, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface KPIStats {
  totalUsers: number;
  newUsers30d: number;
  activeUsers30d: number;
  monthlyRevenue: number;
  avgCommission: number;
  topPartnership: string | null;
  pendingRevenue: number;
}

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
}

interface PartnershipData {
  id: string;
  company_name: string;
  partnership_type: string;
  commission_rate: number;
  status: string;
  user_email: string;
  monthly_revenue: number;
  is_default: boolean;
}

export default function Admin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<KPIStats>({
    totalUsers: 0,
    newUsers30d: 0,
    activeUsers30d: 0,
    monthlyRevenue: 0,
    avgCommission: 0,
    topPartnership: null,
    pendingRevenue: 0
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [partnerships, setPartnerships] = useState<PartnershipData[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'partnerships'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.role === 'admin');
      }
    } catch (error) {
      console.error('Error:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [usersResult, partnershipsResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, email, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('partnerships')
          .select('id, company_name, partnership_type, commission_rate, status, user_id, is_default')
          .order('created_at', { ascending: false })
      ]);

      if (usersResult.data) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const totalUsers = usersResult.data.length;
        const newUsers30d = usersResult.data.filter(u => new Date(u.created_at) >= thirtyDaysAgo).length;

        setStats(prev => ({
          ...prev,
          totalUsers,
          newUsers30d,
          activeUsers30d: totalUsers
        }));

        const usersWithRoles = await Promise.all(
          usersResult.data.map(async (u) => {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', u.id)
              .maybeSingle();

            return {
              id: u.id,
              email: u.email || 'N/A',
              created_at: u.created_at,
              last_sign_in_at: null,
              role: roleData?.role || 'user'
            };
          })
        );

        setUsers(usersWithRoles);
      }

      if (partnershipsResult.data) {
        const { data: salesData } = await supabase
          .from('partnership_sales')
          .select('partnership_id, commission_earned, payment_status, sale_date');

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlySales = salesData?.filter(s => new Date(s.sale_date) >= firstDayOfMonth) || [];
        const monthlyRevenue = monthlySales.reduce((sum, s) => sum + s.commission_earned, 0);
        const pendingRevenue = monthlySales
          .filter(s => s.payment_status === 'pending')
          .reduce((sum, s) => sum + s.commission_earned, 0);

        const partnershipRevenues = partnershipsResult.data.map(p => {
          const partnershipMonthlySales = monthlySales.filter(s => s.partnership_id === p.id);
          const revenue = partnershipMonthlySales.reduce((sum, s) => sum + s.commission_earned, 0);
          return { ...p, revenue };
        });

        const topPartnership = partnershipRevenues.sort((a, b) => b.revenue - a.revenue)[0];
        const avgCommission = partnershipsResult.data.length > 0
          ? partnershipsResult.data.reduce((sum, p) => sum + p.commission_rate, 0) / partnershipsResult.data.length
          : 0;

        setStats(prev => ({
          ...prev,
          monthlyRevenue,
          avgCommission,
          topPartnership: topPartnership?.company_name || null,
          pendingRevenue
        }));

        const partnershipsWithUserData = await Promise.all(
          partnershipsResult.data.map(async (p) => {
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('email')
              .eq('id', p.user_id)
              .single();

            const partnershipMonthlySales = monthlySales.filter(s => s.partnership_id === p.id);
            const monthlyRevenue = partnershipMonthlySales.reduce((sum, s) => sum + s.commission_earned, 0);

            return {
              ...p,
              user_email: userData?.email || 'N/A',
              monthly_revenue: monthlyRevenue
            };
          })
        );

        setPartnerships(partnershipsWithUserData);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h1>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Cette section est réservée aux administrateurs.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPartnerships = partnerships.filter(p =>
    p.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mrr = stats.monthlyRevenue;
  const arr = mrr * 12;
  const arpa = stats.totalUsers > 0 ? mrr / stats.totalUsers : 0;

  return (
    <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
        </div>
        <p className="text-gray-600">Tableau de bord et gestion de la plateforme</p>
      </div>

      <div className="flex gap-2 sm:gap-4 mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'dashboard'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'users'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Utilisateurs
        </button>
        <button
          onClick={() => setActiveTab('partnerships')}
          className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'partnerships'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Partenariats
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">KPI Utilisateurs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Utilisateurs total</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-belleya-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <UserPlus className="w-6 h-6 text-belleya-bright" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Nouveaux (30j)</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.newUsers30d}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-brand-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Utilisateurs actifs</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.activeUsers30d}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">KPI Revenus & Abonnements</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-belleya-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Euro className="w-6 h-6 text-belleya-bright" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">MRR</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{mrr.toFixed(2)} €</p>
                <p className="text-xs text-gray-600 mt-1">Revenus mensuels récurrents</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">ARR</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{arr.toFixed(2)} €</p>
                <p className="text-xs text-gray-600 mt-1">MRR × 12</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Euro className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">ARPA</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{arpa.toFixed(2)} €</p>
                <p className="text-xs text-gray-600 mt-1">Revenu moyen / utilisateur</p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <AlertTriangle className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Churn mensuel</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">—</p>
                <p className="text-xs text-gray-600 mt-1">À activer</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">KPI Partenariats</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-belleya-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Handshake className="w-6 h-6 text-belleya-bright" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Revenus du mois</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.monthlyRevenue.toFixed(2)} €</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-brand-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Percent className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Commission moyenne</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.avgCommission.toFixed(1)} %</p>
              </div>

              <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl p-6 border border-brand-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Star className="w-6 h-6 text-brand-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Top partenariat</span>
                </div>
                <p className="text-xl font-bold text-gray-900 truncate">{stats.topPartnership || '—'}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">À encaisser</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingRevenue.toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par email ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <button
              onClick={() => exportToCSV(users, 'users')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date inscription</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Dernier login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-brand-100 text-brand-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'partnerships' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par entreprise ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <button
              onClick={() => exportToCSV(partnerships, 'partnerships')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Entreprise</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Utilisateur</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Revenus mois</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPartnerships.map((partnership) => (
                    <tr key={partnership.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{partnership.company_name}</span>
                          {partnership.is_default && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-800">
                              Programme officiel
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{partnership.user_email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{partnership.partnership_type}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{partnership.commission_rate}%</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          partnership.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : partnership.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {partnership.status === 'active' ? 'Actif' : partnership.status === 'pending' ? 'En attente' : 'Terminé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-belleya-bright">
                        {partnership.monthly_revenue.toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPartnerships.length === 0 && (
              <div className="text-center py-12">
                <Handshake className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucun partenariat trouvé</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
