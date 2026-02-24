import { useState, useEffect } from 'react';
import { Users, UserPlus, Activity, Euro, TrendingUp, Percent, Star, Clock, Handshake, Download, Search, Shield, AlertTriangle, Edit2, Trash2, Crown, X, ChevronLeft, ChevronRight, CreditCard, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/shared/ToastContainer';
import RewardsValidation from '../components/admin/RewardsValidation';

type PeriodFilter = 'day' | 'month' | 'year';

interface KPIStats {
  totalUsers: number;
  newUsers30d: number;
  activeUsers30d: number;
  monthlyRevenue: number;
  avgCommission: number;
  topPartnership: string | null;
  pendingRevenue: number;
  startUsers: number;
  studioUsers: number;
  empireUsers: number;
  vipUsers: number;
  depositRevenue: number;
  trialUsers: number;
  totalClients: number;
}

interface MonthlyStats {
  month: string;
  newUsers: number;
  revenue: number;
}

interface UserData {
  id: string;
  user_id: string;
  company_id: string | null;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
  first_name: string | null;
  last_name: string | null;
  profession: string | null;
  plan_type: string | null;
  subscription_status: string | null;
  trial_end_date: string | null;
  days_remaining: number | null;
}

interface PartnershipData {
  id: string;
  company_name: string;
  partnership_type: string;
  commission_rate: number;
  status: string;
  user_email: string;
  user_name: string;
  monthly_revenue: number;
  is_default: boolean;
}

export default function Admin() {
  const { user } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<KPIStats>({
    totalUsers: 0,
    newUsers30d: 0,
    activeUsers30d: 0,
    monthlyRevenue: 0,
    avgCommission: 0,
    topPartnership: null,
    pendingRevenue: 0,
    startUsers: 0,
    studioUsers: 0,
    empireUsers: 0,
    vipUsers: 0,
    depositRevenue: 0,
    trialUsers: 0,
    totalClients: 0
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [partnerships, setPartnerships] = useState<PartnershipData[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'clients' | 'partnerships' | 'rewards'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClientName, setEditingClientName] = useState({ firstName: '', lastName: '' });
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'pro' as 'pro' | 'client' });
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [updatingSubscription, setUpdatingSubscription] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
      loadMonthlyStats();
    }
  }, [isAdmin, periodFilter, selectedDate]);

  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (periodFilter === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (periodFilter === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else if (periodFilter === 'year') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const getDisplayDate = () => {
    if (periodFilter === 'day') {
      return selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (periodFilter === 'month') {
      return selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    return selectedDate.getFullYear().toString();
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (periodFilter === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (periodFilter === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Utilisation de la fonction RPC sécurisée côté backend
      const { data, error } = await supabase.rpc('is_admin');

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
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
        supabase.rpc('get_all_users_admin'),
        supabase
          .from('partnerships')
          .select('id, company_name, partnership_type, commission_rate, status, user_id, is_default')
          .order('created_at', { ascending: false })
      ]);

      if (usersResult.data) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const totalUsers = usersResult.data.length;
        const newUsers30d = usersResult.data.filter((u: any) => new Date(u.created_at) >= thirtyDaysAgo).length;

        const usersWithDetails = await Promise.all(
          usersResult.data.map(async (u: any) => {
            const [companyData, subscriptionData] = await Promise.all([
              u.company_id
                ? supabase
                    .from('company_profiles')
                    .select('primary_profession')
                    .eq('id', u.company_id)
                    .maybeSingle()
                : Promise.resolve({ data: null }),
              u.company_id
                ? supabase
                    .from('subscriptions')
                    .select('plan_type, subscription_status, trial_end_date')
                    .eq('company_id', u.company_id)
                    .maybeSingle()
                : Promise.resolve({ data: null })
            ]);

            const daysRemaining = subscriptionData.data?.trial_end_date
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(subscriptionData.data.trial_end_date).getTime() - now.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : null;

            return {
              id: u.id,
              user_id: u.user_id,
              company_id: u.company_id,
              email: u.email || 'N/A',
              created_at: u.auth_created_at || u.created_at,
              last_sign_in_at: u.last_sign_in_at || null,
              role: u.role || 'pro',
              first_name: u.first_name || null,
              last_name: u.last_name || null,
              profession: companyData.data?.primary_profession || null,
              plan_type: subscriptionData.data?.plan_type || null,
              subscription_status: subscriptionData.data?.subscription_status || null,
              trial_end_date: subscriptionData.data?.trial_end_date || null,
              days_remaining: daysRemaining
            };
          })
        );

        setUsers(usersWithDetails);

        // Calculer les statistiques par plan
        const startUsers = usersWithDetails.filter(u => u.plan_type === 'start').length;
        const studioUsers = usersWithDetails.filter(u => u.plan_type === 'studio').length;
        const empireUsers = usersWithDetails.filter(u => u.plan_type === 'empire').length;
        const vipUsers = usersWithDetails.filter(u => u.plan_type === 'vip').length;
        const trialUsers = usersWithDetails.filter(u => u.subscription_status === 'trial').length;
        const totalClients = usersWithDetails.filter(u => u.role === 'client').length;

        setStats(prev => ({
          ...prev,
          totalUsers,
          newUsers30d,
          activeUsers30d: totalUsers,
          startUsers,
          studioUsers,
          empireUsers,
          vipUsers,
          trialUsers,
          totalClients
        }));
      }

      // Calculer les revenus d'acomptes pour la période sélectionnée
      // Pour l'instant à 0 car pas de système de commission sur les acomptes
      const { start, end } = getDateRange();
      const depositRevenue = 0;

      if (partnershipsResult.data) {
        const { data: salesData } = await supabase
          .from('partnership_sales')
          .select('partnership_id, commission_earned, payment_status, sale_date')
          .gte('sale_date', start.split('T')[0])
          .lte('sale_date', end.split('T')[0]);

        const periodSales = salesData || [];
        const monthlyRevenue = periodSales.reduce((sum, s) => sum + s.commission_earned, 0);
        const pendingRevenue = periodSales
          .filter(s => s.payment_status === 'pending')
          .reduce((sum, s) => sum + s.commission_earned, 0);

        const partnershipRevenues = partnershipsResult.data.map(p => {
          const partnershipPeriodSales = periodSales.filter(s => s.partnership_id === p.id);
          const revenue = partnershipPeriodSales.reduce((sum, s) => sum + s.commission_earned, 0);
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
          pendingRevenue,
          depositRevenue
        }));

        const emailLookup: Record<string, string> = {};
        if (usersResult.data) {
          usersResult.data.forEach((u: any) => {
            if (u.user_id && u.email) {
              emailLookup[u.user_id] = u.email;
            }
          });
        }

        const partnershipsWithUserData = await Promise.all(
          partnershipsResult.data.map(async (p) => {
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('user_id, first_name, last_name')
              .eq('user_id', p.user_id)
              .maybeSingle();

            const userEmail = emailLookup[p.user_id] || 'N/A';

            const userName = userData?.first_name && userData?.last_name
              ? `${userData.first_name} ${userData.last_name}`
              : userData?.first_name || userData?.last_name || 'N/A';

            const partnershipPeriodSales = periodSales.filter(s => s.partnership_id === p.id);
            const monthlyRevenue = partnershipPeriodSales.reduce((sum, s) => sum + s.commission_earned, 0);

            return {
              ...p,
              user_email: userEmail,
              user_name: userName,
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

  const loadMonthlyStats = async () => {
    try {
      const currentYear = selectedDate.getFullYear();
      const stats: MonthlyStats[] = [];

      for (let month = 0; month < 12; month++) {
        const startDate = new Date(currentYear, month, 1);
        const endDate = new Date(currentYear, month + 1, 0);

        // Nouveaux utilisateurs
        const { data: newUsersData } = await supabase
          .from('user_profiles')
          .select('id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        // Revenus de Belleya = commissions partenariats + abonnements
        // 1. Commissions sur les partenariats
        const { data: partnershipRevenue } = await supabase
          .from('partnership_sales')
          .select('commission_earned')
          .gte('sale_date', startDate.toISOString().split('T')[0])
          .lte('sale_date', endDate.toISOString().split('T')[0]);

        const partnershipTotal = partnershipRevenue?.reduce((sum, r) => sum + r.commission_earned, 0) || 0;

        // 2. Revenus des abonnements (à implémenter selon votre système de paiement)
        // Pour l'instant on compte juste les partenariats
        const totalRevenue = partnershipTotal;

        stats.push({
          month: startDate.toLocaleDateString('fr-FR', { month: 'short' }),
          newUsers: newUsersData?.length || 0,
          revenue: totalRevenue
        });
      }

      setMonthlyStats(stats);
    } catch (error) {
      console.error('Error loading monthly stats:', error);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;

    const targetId = userToDelete.id;
    const targetUserId = userToDelete.user_id;

    setDeletingUserId(targetId);

    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: targetUserId
      });

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== targetId));
      setDeletingUserId(null);
      setUserToDelete(null);
      showToast('success', 'Utilisateur supprimé avec succès');
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      setDeletingUserId(null);
      setUserToDelete(null);
      showToast('error', 'Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleEditClientInfo = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: editingClientName.firstName,
          last_name: editingClientName.lastName,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      showToast('success', 'Informations client mises à jour avec succès');
      setShowEditModal(false);
      setEditingUser(null);
      setEditingClientName({ firstName: '', lastName: '' });
      setTimeout(() => loadData(), 100);
    } catch (error) {
      console.error('Error updating client info:', error);
      showToast('error', 'Erreur lors de la mise à jour');
    }
  };

  const handleInlineSubscriptionChange = async (targetUser: UserData, newPlanType: string) => {
    if (!user) return;

    if (!targetUser.company_id) {
      showToast('error', 'Utilisateur sans profil entreprise');
      return;
    }

    setUpdatingSubscription(targetUser.id);

    try {
      if (newPlanType === '') {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            subscription_status: 'cancelled',
            modified_by_admin_id: user.id,
            admin_note: 'Abonnement annulé par admin',
            updated_at: new Date().toISOString()
          })
          .eq('company_id', targetUser.company_id);

        if (error) throw error;
        showToast('success', 'Abonnement annulé');
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            company_id: targetUser.company_id,
            plan_type: newPlanType,
            subscription_status: 'active',
            payment_provider: 'admin',
            modified_by_admin_id: user.id,
            admin_note: `Plan modifié par admin : ${newPlanType}`,
            updated_at: new Date().toISOString()
          }, { onConflict: 'company_id' });

        if (error) throw error;
        showToast('success', `Plan changé en ${newPlanType}`);
      }

      setUsers(prev => prev.map(u => {
        if (u.id !== targetUser.id) return u;
        return {
          ...u,
          plan_type: newPlanType === '' ? null : newPlanType,
          subscription_status: newPlanType === '' ? 'cancelled' : 'active'
        };
      }));
    } catch (error) {
      console.error('Error updating subscription:', error);
      showToast('error', 'Erreur lors de la modification');
    } finally {
      setUpdatingSubscription(null);
    }
  };

  const handleAddUser = async () => {
    if (!newUserForm.email || !newUserForm.password) {
      showToast('error', 'Email et mot de passe requis');
      return;
    }
    if (newUserForm.password.length < 6) {
      showToast('error', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setAddingUser(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`;
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error('Session expired');

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: newUserForm.email,
          password: newUserForm.password,
          role: newUserForm.role,
          firstName: newUserForm.firstName || null,
          lastName: newUserForm.lastName || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la création');

      setShowAddUserModal(false);
      setNewUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'pro' });

      if (newUserForm.role === 'pro' && !result.user?.company_id) {
        showToast('error', 'Utilisateur créé mais profil entreprise manquant. Rechargez la page.');
      } else {
        showToast('success', 'Utilisateur créé avec succès');
      }
      setTimeout(() => loadData(), 500);
    } catch (error: any) {
      console.error('Error creating user:', error);
      const msg = error.message || '';
      if (msg.includes('already been registered') || msg.includes('already exists')) {
        showToast('error', 'Cet email est déjà utilisé par un autre compte');
      } else {
        showToast('error', msg || 'Erreur lors de la création');
      }
    } finally {
      setAddingUser(false);
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubscription =
      subscriptionFilter === 'all' ||
      (subscriptionFilter === 'trial' ? u.subscription_status === 'trial' : u.plan_type === subscriptionFilter);

    return matchesSearch && matchesSubscription;
  });

  const filteredClients = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.first_name && u.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.last_name && u.last_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return u.role === 'client' && matchesSearch;
  });

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
          onClick={() => setActiveTab('clients')}
          className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'clients'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Clients
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
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'rewards'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Gift className="w-4 h-4 inline mr-1" />
          Avis & Récompenses
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setPeriodFilter('day')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  periodFilter === 'day'
                    ? 'bg-[#E51E8F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Jour
              </button>
              <button
                onClick={() => setPeriodFilter('month')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  periodFilter === 'month'
                    ? 'bg-[#E51E8F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setPeriodFilter('year')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  periodFilter === 'year'
                    ? 'bg-[#E51E8F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Année
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
              <button
                onClick={() => handleDateChange('prev')}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
              </button>
              <span className="text-xs sm:text-sm font-medium text-gray-900 min-w-[120px] sm:min-w-[150px] text-center">
                {getDisplayDate()}
              </span>
              <button
                onClick={() => handleDateChange('next')}
                disabled={selectedDate >= new Date()}
                className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">KPI Abonnements</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Star className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Start</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.startUsers}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-brand-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Studio</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.studioUsers}</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Crown className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Empire</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.empireUsers}</p>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Crown className="w-6 h-6 text-rose-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">VIP</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.vipUsers}</p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Clock className="w-6 h-6 text-teal-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">En essai</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.trialUsers}</p>
                <p className="text-xs text-gray-600 mt-1">Période d'essai</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">KPI Utilisateurs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Users className="w-6 h-6 text-pink-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Clients</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">KPI Revenus & Abonnements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Acomptes</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.depositRevenue.toFixed(2)} €</p>
                <p className="text-xs text-gray-600 mt-1">Revenus des acomptes</p>
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

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique des nouveaux utilisateurs */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Nouveaux abonnés par mois</h3>
              <div className="space-y-3">
                {monthlyStats.map((stat) => {
                  const maxUsers = Math.max(...monthlyStats.map(s => s.newUsers), 1);
                  const widthPercentage = (stat.newUsers / maxUsers) * 100;

                  return (
                    <div key={stat.month} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 w-12">{stat.month}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(widthPercentage, 5)}%` }}
                        >
                          <span className="text-xs font-semibold text-white">{stat.newUsers}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Graphique des revenus */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenus par mois</h3>
              <div className="space-y-3">
                {monthlyStats.map((stat) => {
                  const maxRevenue = Math.max(...monthlyStats.map(s => s.revenue), 1);
                  const widthPercentage = (stat.revenue / maxRevenue) * 100;

                  return (
                    <div key={stat.month} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 w-12">{stat.month}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(widthPercentage, 5)}%` }}
                        >
                          <span className="text-xs font-semibold text-white">{stat.revenue.toFixed(0)}€</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
            <select
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white text-gray-700"
            >
              <option value="all">Tous les abonnements</option>
              <option value="trial">En période d'essai</option>
              <option value="start">Start</option>
              <option value="studio">Studio</option>
              <option value="empire">Empire</option>
              <option value="vip">VIP</option>
            </select>
            <button
              onClick={() => exportToCSV(users, 'users')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Ajouter
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Métier</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Abonnement</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Jours restants</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rôle</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date inscription</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Dernier login</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-900">{user.email}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {user.first_name || user.last_name
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {user.profession ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                            {user.profession === 'nail_artist' ? 'Nail Artist' :
                             user.profession === 'hair_stylist' ? 'Coiffeuse' :
                             user.profession === 'esthetician' ? 'Esthéticienne' :
                             user.profession === 'makeup_artist' ? 'Maquilleuse' :
                             user.profession === 'lash_tech' ? 'Lash Tech' :
                             user.profession === 'brow_artist' ? 'Brow Artist' :
                             user.profession}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="relative group">
                          <select
                            value={user.subscription_status === 'cancelled' ? '' : (user.plan_type || '')}
                            onChange={(e) => handleInlineSubscriptionChange(user, e.target.value)}
                            disabled={!user.company_id || updatingSubscription === user.id}
                            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">---</option>
                            <option value="start">Start</option>
                            <option value="studio">Studio</option>
                            <option value="empire">Empire</option>
                            <option value="vip">VIP</option>
                          </select>
                          {!user.company_id && (
                            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10">
                              <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                Pas de profil entreprise
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {user.subscription_status ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.subscription_status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : user.subscription_status === 'trial'
                              ? 'bg-blue-100 text-blue-800'
                              : user.subscription_status === 'expired'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.subscription_status === 'active' ? 'Actif' :
                             user.subscription_status === 'trial' ? 'Essai' :
                             user.subscription_status === 'expired' ? 'Expiré' :
                             user.subscription_status}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {user.days_remaining !== null && user.subscription_status === 'trial' ? (
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              user.days_remaining <= 3 ? 'bg-red-100 text-red-700' :
                              user.days_remaining <= 7 ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {user.days_remaining} {user.days_remaining === 1 ? 'jour' : 'jours'}
                            </span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-brand-100 text-brand-800'
                            : user.role === 'pro'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setUserToDelete(user)}
                          disabled={deletingUserId === user.id}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Supprimer l'utilisateur"
                        >
                          <span className="flex items-center justify-center w-4 h-4">
                            {deletingUserId === user.id ? (
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 inline-block" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </span>
                        </button>
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

      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par email ou nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <button
              onClick={() => exportToCSV(filteredClients, 'clients')}
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
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date inscription</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Dernier login</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-900">{client.email}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {client.first_name || client.last_name
                          ? `${client.first_name || ''} ${client.last_name || ''}`.trim()
                          : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(client.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {client.last_sign_in_at ? new Date(client.last_sign_in_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(client);
                              setEditingClientName({
                                firstName: client.first_name || '',
                                lastName: client.last_name || ''
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier le client"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setUserToDelete(client)}
                            disabled={deletingUserId === client.id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Supprimer le client"
                          >
                            <span className="flex items-center justify-center w-4 h-4">
                              {deletingUserId === client.id ? (
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 inline-block" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucun client trouvé</p>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom utilisateur</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
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
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{partnership.user_name}</td>
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

      {activeTab === 'rewards' && (
        <RewardsValidation />
      )}

      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Modifier le client</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setEditingClientName({ firstName: '', lastName: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-1">Utilisateur</p>
              <p className="font-medium text-gray-900">{editingUser.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input
                  type="text"
                  value={editingClientName.firstName}
                  onChange={(e) => setEditingClientName({ ...editingClientName, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Prénom du client"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={editingClientName.lastName}
                  onChange={(e) => setEditingClientName({ ...editingClientName, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Nom du client"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditClientInfo}
                className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  setEditingClientName({ firstName: '', lastName: '' });
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Nouvel utilisateur</h3>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'pro' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    placeholder="Nom"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  placeholder="Minimum 6 caractères"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as 'pro' | 'client' })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
                >
                  <option value="pro">Pro</option>
                  <option value="client">Client</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddUser}
                disabled={addingUser}
                className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="w-4 h-4 flex items-center justify-center">
                  {addingUser ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block"></span>
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                </span>
                <span>{addingUser ? 'Création...' : 'Créer'}</span>
              </button>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'pro' });
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer cet utilisateur ?</h3>
              <p className="text-sm text-gray-600 mb-1">Cette action est irréversible.</p>
              <p className="text-sm font-medium text-gray-900 mb-6 break-all">{userToDelete.email}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDeleteUser}
                disabled={deletingUserId === userToDelete.id}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="flex items-center justify-center w-4 h-4">
                  {deletingUserId === userToDelete.id ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </span>
                Supprimer
              </button>
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
