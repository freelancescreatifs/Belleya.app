import { useState, useEffect, useCallback } from 'react';
import { Search, Users, Loader2, Award, ChevronRight, CreditCard as Edit2, AlertTriangle, Filter, Trophy, ArrowUpDown, UserX, Mail, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../shared/ToastContainer';
import AffiliateDetailDrawer from './AffiliateDetailDrawer';

interface AffiliateData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  ref_code: string;
  commission_rate: number;
  bonus_amount: number;
  bonus_note: string | null;
  level: string;
  status: string;
  is_active: boolean;
  active_referrals: number;
  active_sub_count: number;
  total_earned: number;
  created_at: string;
  approved_at: string | null;
  last_signup_date: string | null;
  last_activity_date: string | null;
  last_sign_in_at: string | null;
  days_since_last_signup: number;
  signups_count: number;
  commissions_total: number;
  commissions_month: number;
  mrr_generated: number;
  signups_30d: number;
  phone?: string | null;
  instagram_url?: string | null;
}

interface LeaderboardEntry {
  affiliate_id: string;
  full_name: string;
  signups_count: number;
  commission_total: number;
  mrr_generated: number;
}

interface ZoneRougeEntry {
  affiliate_id: string;
  full_name: string;
  email: string;
  days_inactive: number;
  last_signup: string;
  level: string;
  commission_rate: number;
}

const RANK_THRESHOLDS = [
  { min: 0, max: 9, label: 'Recrue', color: 'bg-gray-100 text-gray-700', barColor: 'bg-gray-400' },
  { min: 10, max: 49, label: 'Closer', color: 'bg-blue-100 text-blue-700', barColor: 'bg-blue-500' },
  { min: 50, max: 149, label: 'Pro', color: 'bg-amber-100 text-amber-700', barColor: 'bg-amber-500' },
  { min: 150, max: Infinity, label: 'Elite', color: 'bg-rose-100 text-rose-700', barColor: 'bg-rose-500' },
];

function getRank(conversions: number) {
  return RANK_THRESHOLDS.find(r => conversions >= r.min && conversions <= r.max) || RANK_THRESHOLDS[0];
}

type SubTab = 'table' | 'zone_rouge' | 'leaderboard';
type StatusFilter = 'all' | 'active' | 'observation' | 'paused' | 'disabled';
type RankFilter = 'all' | 'recrue' | 'closer' | 'pro' | 'elite';
type PerformanceFilter = 'all' | 'top' | 'zone_rouge' | 'zero' | 'high_commission';

export default function AffiliatePartnersTab() {
  const { toasts, showToast, dismissToast } = useToast();
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ commission_rate: 0, bonus_amount: 0 });
  const [saving, setSaving] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>('table');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [rankFilter, setRankFilter] = useState<RankFilter>('all');
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [leaderboardAll, setLeaderboardAll] = useState<LeaderboardEntry[]>([]);
  const [leaderboardMonth, setLeaderboardMonth] = useState<LeaderboardEntry[]>([]);
  const [zoneRouge, setZoneRouge] = useState<ZoneRougeEntry[]>([]);

  const loadAffiliates = useCallback(async () => {
    setLoading(true);
    try {
      const { data: affiliateRows, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('program', 'belaya_affiliation')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const enriched: AffiliateData[] = await Promise.all(
        (affiliateRows || []).map(async (aff) => {
          const [signupsRes, signups30dRes, commissionsRes, commissionsMonthRes, authRes, appRes] = await Promise.all([
            supabase
              .from('affiliate_signups')
              .select('id', { count: 'exact', head: true })
              .eq('affiliate_id', aff.id),
            supabase
              .from('affiliate_signups')
              .select('id', { count: 'exact', head: true })
              .eq('affiliate_id', aff.id)
              .gte('created_at', thirtyDaysAgo.toISOString()),
            supabase
              .from('affiliate_commissions')
              .select('commission_amount, mrr')
              .eq('affiliate_id', aff.id),
            supabase
              .from('affiliate_commissions')
              .select('commission_amount')
              .eq('affiliate_id', aff.id)
              .eq('period', currentMonth),
            supabase
              .from('admin_users_view')
              .select('last_sign_in_at')
              .eq('user_id', aff.user_id)
              .maybeSingle(),
            supabase
              .from('affiliate_applications')
              .select('phone, instagram_url')
              .eq('user_id', aff.user_id)
              .maybeSingle(),
          ]);

          const signups_count = signupsRes.count || 0;
          const signups_30d = signups30dRes.count || 0;
          const commissions_total = (commissionsRes.data || []).reduce(
            (sum, c) => sum + Number(c.commission_amount || 0), 0
          );
          const mrr_generated = (commissionsRes.data || []).reduce(
            (sum, c) => sum + Number(c.mrr || 0), 0
          );
          const commissions_month = (commissionsMonthRes.data || []).reduce(
            (sum, c) => sum + Number(c.commission_amount || 0), 0
          );

          return {
            ...aff,
            commission_rate: Number(aff.commission_rate || 0.10),
            bonus_amount: Number(aff.bonus_amount || 0),
            total_earned: Number(aff.total_earned || 0),
            active_referrals: aff.active_referrals || 0,
            active_sub_count: aff.active_sub_count || 0,
            days_since_last_signup: aff.days_since_last_signup || 0,
            signups_count,
            signups_30d,
            commissions_total,
            commissions_month,
            mrr_generated,
            last_sign_in_at: authRes.data?.last_sign_in_at || null,
            phone: appRes.data?.phone || null,
            instagram_url: appRes.data?.instagram_url || null,
          };
        })
      );

      setAffiliates(enriched);

      const sortedByConversions = [...enriched]
        .filter(a => a.status === 'active')
        .sort((a, b) => b.signups_count - a.signups_count)
        .slice(0, 10);

      setLeaderboardAll(sortedByConversions.map(a => ({
        affiliate_id: a.id,
        full_name: a.full_name || '---',
        signups_count: a.signups_count,
        commission_total: a.commissions_total,
        mrr_generated: a.mrr_generated,
      })));

      const sortedByMonth = [...enriched]
        .filter(a => a.status === 'active')
        .sort((a, b) => b.signups_30d - a.signups_30d)
        .slice(0, 10);

      setLeaderboardMonth(sortedByMonth.map(a => ({
        affiliate_id: a.id,
        full_name: a.full_name || '---',
        signups_count: a.signups_30d,
        commission_total: a.commissions_month,
        mrr_generated: a.mrr_generated,
      })));

      const inactive = enriched
        .filter(a => {
          if (a.status !== 'active') return false;
          if (!a.last_signup_date) return a.signups_count === 0;
          const daysSince = Math.floor((now.getTime() - new Date(a.last_signup_date).getTime()) / (1000 * 60 * 60 * 24));
          return daysSince >= 7;
        })
        .map(a => {
          const daysSince = a.last_signup_date
            ? Math.floor((now.getTime() - new Date(a.last_signup_date).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          return {
            affiliate_id: a.id,
            full_name: a.full_name || '---',
            email: a.email || '---',
            days_inactive: daysSince,
            last_signup: a.last_signup_date || '',
            level: getRank(a.signups_count).label,
            commission_rate: a.commission_rate,
          };
        })
        .sort((a, b) => b.days_inactive - a.days_inactive);

      setZoneRouge(inactive);
    } catch (err) {
      console.error('Error loading affiliates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAffiliates();
  }, [loadAffiliates]);

  const handleSaveEdit = async (affiliateId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({
          commission_rate: editValues.commission_rate,
          bonus_amount: editValues.bonus_amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', affiliateId);

      if (error) throw error;

      setAffiliates(prev => prev.map(a => {
        if (a.id !== affiliateId) return a;
        return { ...a, commission_rate: editValues.commission_rate, bonus_amount: editValues.bonus_amount };
      }));
      setEditingId(null);
      showToast('success', 'Modifications enregistrees');
    } catch (err: any) {
      showToast('error', err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableAffiliate = async (affiliateId: string) => {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: 'disabled', is_active: false, updated_at: new Date().toISOString() })
        .eq('id', affiliateId);
      if (error) throw error;
      setAffiliates(prev => prev.map(a => a.id === affiliateId ? { ...a, status: 'disabled', is_active: false } : a));
      setZoneRouge(prev => prev.filter(z => z.affiliate_id !== affiliateId));
      showToast('success', 'Affilie desactive');
    } catch (err: any) {
      showToast('error', err.message || 'Erreur');
    }
  };

  const startEditing = (aff: AffiliateData) => {
    setEditingId(aff.id);
    setEditValues({ commission_rate: aff.commission_rate, bonus_amount: aff.bonus_amount });
  };

  const filtered = affiliates.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (rankFilter !== 'all') {
      const rank = getRank(a.signups_count).label.toLowerCase();
      if (rank !== rankFilter) return false;
    }
    if (performanceFilter === 'top') {
      if (a.signups_count < 10) return false;
    } else if (performanceFilter === 'zone_rouge') {
      const now = new Date();
      const daysSince = a.last_signup_date
        ? Math.floor((now.getTime() - new Date(a.last_signup_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      if (daysSince < 7) return false;
    } else if (performanceFilter === 'zero') {
      if (a.signups_count > 0) return false;
    } else if (performanceFilter === 'high_commission') {
      if (a.commissions_total < 100) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        (a.full_name || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        a.ref_code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeAffiliates = affiliates.filter(a => a.status === 'active');

  const exportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Nom', 'Email', 'Conversions', 'Abonnements actifs', 'MRR', 'Commission mois', 'Commission totale', 'Commission %', 'Rang', 'Statut'];
    const rows = filtered.map(a => [
      a.full_name || '',
      a.email || '',
      a.signups_count,
      a.active_sub_count,
      a.mrr_generated.toFixed(2),
      a.commissions_month.toFixed(2),
      a.commissions_total.toFixed(2),
      (a.commission_rate * 100).toFixed(0) + '%',
      getRank(a.signups_count).label,
      a.status,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `affilies_belaya_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setSubTab('table')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            subTab === 'table' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1.5" />
          Affilies ({filtered.length})
        </button>
        <button
          onClick={() => setSubTab('zone_rouge')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            subTab === 'zone_rouge' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4 inline mr-1.5" />
          Zone rouge ({zoneRouge.length})
        </button>
        <button
          onClick={() => setSubTab('leaderboard')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            subTab === 'leaderboard' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-1.5" />
          Classement
        </button>
      </div>

      {subTab === 'table' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, email ou code..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                showFilters ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {(statusFilter !== 'all' || rankFilter !== 'all' || performanceFilter !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-brand-500" />
              )}
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">Tous</option>
                  <option value="active">Active</option>
                  <option value="observation">Observation</option>
                  <option value="paused">Paused</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rang</label>
                <select
                  value={rankFilter}
                  onChange={(e) => setRankFilter(e.target.value as RankFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">Tous</option>
                  <option value="recrue">Recrue</option>
                  <option value="closer">Closer</option>
                  <option value="pro">Pro</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Performance</label>
                <select
                  value={performanceFilter}
                  onChange={(e) => setPerformanceFilter(e.target.value as PerformanceFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">Tous</option>
                  <option value="top">Top performers (10+)</option>
                  <option value="zone_rouge">Zone rouge (7j+)</option>
                  <option value="zero">Aucun client converti</option>
                  <option value="high_commission">Commission &gt; 100 EUR</option>
                </select>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucun affilie trouve</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nom</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Depuis</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Dernier login</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Convertis</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Abos actifs</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">MRR</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Com. mois</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Com. totale</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">%</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Bonus</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rang</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Statut</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((aff) => {
                      const rank = getRank(aff.signups_count);
                      const isEditing = editingId === aff.id;

                      return (
                        <tr key={aff.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {aff.full_name || '---'}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{aff.email || '---'}</td>
                          <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {aff.approved_at
                              ? new Date(aff.approved_at).toLocaleDateString('fr-FR')
                              : new Date(aff.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                            {aff.last_sign_in_at ? new Date(aff.last_sign_in_at).toLocaleDateString('fr-FR') : '---'}
                          </td>
                          <td className="px-3 py-3 text-sm font-semibold text-gray-900">{aff.signups_count}</td>
                          <td className="px-3 py-3 text-sm text-gray-900">{aff.active_sub_count}</td>
                          <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{aff.mrr_generated.toFixed(0)} EUR</td>
                          <td className="px-3 py-3 text-sm font-medium text-emerald-700 whitespace-nowrap">{aff.commissions_month.toFixed(0)} EUR</td>
                          <td className="px-3 py-3 text-sm font-semibold text-emerald-700 whitespace-nowrap">{aff.commissions_total.toFixed(0)} EUR</td>
                          <td className="px-3 py-3 text-sm">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={editValues.commission_rate}
                                onChange={(e) => setEditValues(v => ({ ...v, commission_rate: parseFloat(e.target.value) || 0 }))}
                                className="w-16 px-1.5 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-brand-500"
                              />
                            ) : (
                              <span className="text-gray-900">{(aff.commission_rate * 100).toFixed(0)}%</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            {isEditing ? (
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={editValues.bonus_amount}
                                onChange={(e) => setEditValues(v => ({ ...v, bonus_amount: parseFloat(e.target.value) || 0 }))}
                                className="w-16 px-1.5 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-brand-500"
                              />
                            ) : (
                              <span className="text-gray-600">
                                {aff.bonus_amount > 0 ? `${aff.bonus_amount} EUR` : '---'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rank.color}`}>
                              {rank.label}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              aff.status === 'active' ? 'bg-green-100 text-green-700' :
                              aff.status === 'observation' ? 'bg-amber-100 text-amber-700' :
                              aff.status === 'disabled' ? 'bg-red-100 text-red-700' :
                              aff.status === 'paused' ? 'bg-gray-200 text-gray-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {aff.status}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(aff.id)}
                                    disabled={saving}
                                    className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    {saving ? '...' : 'OK'}
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200"
                                  >
                                    X
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditing(aff)}
                                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Modifier"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setSelectedAffiliate(aff)}
                                    className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                    title="Voir la fiche"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'zone_rouge' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Zone rouge - Affilies inactifs</h3>
            </div>
            <p className="text-sm text-red-700">
              Affilies sans conversion depuis 7 jours ou plus. Action recommandee pour reactiver.
            </p>
          </div>

          {zoneRouge.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucun affilie inactif. Tous les affilies sont performants.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50 border-b border-red-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-red-800 uppercase">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-red-800 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-red-800 uppercase">Jours inactif</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-red-800 uppercase">Derniere conversion</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-red-800 uppercase">Rang</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-red-800 uppercase">Commission %</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-red-800 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {zoneRouge.map((z) => (
                      <tr key={z.affiliate_id} className="hover:bg-red-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{z.full_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{z.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            z.days_inactive >= 30 ? 'bg-red-200 text-red-800' :
                            z.days_inactive >= 14 ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {z.days_inactive >= 999 ? 'Jamais' : `${z.days_inactive}j`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {z.last_signup ? new Date(z.last_signup).toLocaleDateString('fr-FR') : 'Jamais'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{z.level}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{(z.commission_rate * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                window.open(`mailto:${z.email}?subject=Votre partenariat Belaya`, '_blank');
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Contacter"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                const aff = affiliates.find(a => a.id === z.affiliate_id);
                                if (aff) startEditing(aff);
                                setSubTab('table');
                              }}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Modifier commission"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDisableAffiliate(z.affiliate_id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Desactiver"
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">Classement conversions (total)</h3>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {leaderboardAll.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">Aucune donnee</p>
                ) : (
                  leaderboardAll.map((entry, idx) => (
                    <div key={entry.affiliate_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-gray-200 text-gray-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{entry.full_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">{entry.signups_count} conv.</p>
                        <p className="text-xs text-gray-500">{entry.mrr_generated.toFixed(0)} EUR MRR</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700 shrink-0">
                        {entry.commission_total.toFixed(0)} EUR
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-4 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Top affilies du mois (30j)</h3>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {leaderboardMonth.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">Aucune donnee</p>
                ) : (
                  leaderboardMonth.map((entry, idx) => (
                    <div key={entry.affiliate_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-blue-100 text-blue-700' :
                        idx === 1 ? 'bg-gray-200 text-gray-700' :
                        idx === 2 ? 'bg-cyan-100 text-cyan-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{entry.full_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">{entry.signups_count} conv.</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700 shrink-0">
                        {entry.commission_total.toFixed(0)} EUR
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedAffiliate && (
        <AffiliateDetailDrawer
          affiliate={selectedAffiliate}
          onClose={() => setSelectedAffiliate(null)}
          onSave={(updated) => {
            setAffiliates(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
            setSelectedAffiliate(prev => prev ? { ...prev, ...updated } : null);
          }}
          showToast={showToast}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

