import { useState, useEffect, useCallback } from 'react';
import { Search, Users, Loader as Loader2, DollarSign, TrendingUp, Award, ChevronRight, CreditCard as Edit2, TriangleAlert as AlertTriangle, ListFilter as Filter, Trophy, Clock, ArrowUpDown, UserX, Mail, Zap, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../shared/ToastContainer';
import AffiliateDetailDrawer from './AffiliateDetailDrawer';
import { getRank, daysSince } from '../../lib/affiliateUtils';

export interface EnrichedAffiliate {
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

type SubTab = 'table' | 'zone_rouge' | 'leaderboard';
type StatusFilter = 'all' | 'active' | 'observation' | 'paused' | 'disabled';
type RankFilter = 'all' | 'recrue' | 'closer' | 'pro' | 'elite';
type PerfFilter = 'all' | 'top' | 'zone_rouge' | 'zero' | 'high_commission';

export default function AffiliatePartnersTab() {
  const { toasts, showToast, dismissToast } = useToast();
  const [affiliates, setAffiliates] = useState<EnrichedAffiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<EnrichedAffiliate | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ commission_rate: 0, bonus_amount: 0 });
  const [saving, setSaving] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>('table');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [rankFilter, setRankFilter] = useState<RankFilter>('all');
  const [perfFilter, setPerfFilter] = useState<PerfFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const loadAffiliates = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('program', 'belaya_affiliation')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const enriched: EnrichedAffiliate[] = await Promise.all(
        (rows || []).map(async (aff) => {
          const [sAll, s30, cAll, cMonth, auth, app] = await Promise.all([
            supabase.from('affiliate_signups').select('id', { count: 'exact', head: true }).eq('affiliate_id', aff.id),
            supabase.from('affiliate_signups').select('id', { count: 'exact', head: true }).eq('affiliate_id', aff.id).gte('created_at', thirtyDaysAgo.toISOString()),
            supabase.from('affiliate_commissions').select('commission_amount, mrr').eq('affiliate_id', aff.id),
            supabase.from('affiliate_commissions').select('commission_amount').eq('affiliate_id', aff.id).eq('period', currentMonth),
            supabase.from('admin_users_view').select('last_sign_in_at').eq('user_id', aff.user_id).maybeSingle(),
            supabase.from('affiliate_applications').select('phone, instagram_url').eq('user_id', aff.user_id).maybeSingle(),
          ]);
          const commTotal = (cAll.data || []).reduce((s, c) => s + Number(c.commission_amount || 0), 0);
          const mrrTotal = (cAll.data || []).reduce((s, c) => s + Number(c.mrr || 0), 0);
          const commMonth = (cMonth.data || []).reduce((s, c) => s + Number(c.commission_amount || 0), 0);
          return {
            ...aff,
            commission_rate: Number(aff.commission_rate || 0.10),
            bonus_amount: Number(aff.bonus_amount || 0),
            total_earned: Number(aff.total_earned || 0),
            active_referrals: aff.active_referrals || 0,
            active_sub_count: aff.active_sub_count || 0,
            days_since_last_signup: aff.days_since_last_signup || 0,
            signups_count: sAll.count || 0,
            signups_30d: s30.count || 0,
            commissions_total: commTotal,
            commissions_month: commMonth,
            mrr_generated: mrrTotal,
            last_sign_in_at: auth.data?.last_sign_in_at || null,
            phone: app.data?.phone || null,
            instagram_url: app.data?.instagram_url || null,
          };
        })
      );
      setAffiliates(enriched);
    } catch (err) {
      console.error('Error loading affiliates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAffiliates(); }, [loadAffiliates]);

  const handleSaveEdit = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('affiliates').update({ commission_rate: editValues.commission_rate, bonus_amount: editValues.bonus_amount, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      setAffiliates(prev => prev.map(a => a.id !== id ? a : { ...a, ...editValues }));
      setEditingId(null);
      showToast('success', 'Modifications enregistrees');
    } catch (err: any) {
      showToast('error', err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async (id: string) => {
    try {
      const { error } = await supabase.from('affiliates').update({ status: 'disabled', is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      setAffiliates(prev => prev.map(a => a.id === id ? { ...a, status: 'disabled', is_active: false } : a));
      showToast('success', 'Affilie desactive');
    } catch (err: any) {
      showToast('error', err.message || 'Erreur');
    }
  };

  const startEditing = (a: EnrichedAffiliate) => {
    setEditingId(a.id);
    setEditValues({ commission_rate: a.commission_rate, bonus_amount: a.bonus_amount });
  };

  const filtered = affiliates.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (rankFilter !== 'all' && getRank(a.signups_count).label.toLowerCase() !== rankFilter) return false;
    if (perfFilter === 'top' && a.signups_count < 10) return false;
    if (perfFilter === 'zone_rouge' && daysSince(a.last_signup_date) < 7) return false;
    if (perfFilter === 'zero' && a.signups_count > 0) return false;
    if (perfFilter === 'high_commission' && a.commissions_total < 100) return false;
    if (search) {
      const q = search.toLowerCase();
      return (a.full_name || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q) || a.ref_code.toLowerCase().includes(q);
    }
    return true;
  });

  const zoneRouge = affiliates
    .filter(a => a.status === 'active' && ((!a.last_signup_date && a.signups_count === 0) || daysSince(a.last_signup_date) >= 7))
    .sort((a, b) => daysSince(b.last_signup_date) - daysSince(a.last_signup_date));

  const leaderAll = [...affiliates].filter(a => a.status === 'active').sort((a, b) => b.signups_count - a.signups_count).slice(0, 10);
  const leaderMonth = [...affiliates].filter(a => a.status === 'active').sort((a, b) => b.signups_30d - a.signups_30d).slice(0, 10);

  const activeAffs = affiliates.filter(a => a.status === 'active');
  const totalConversions = affiliates.reduce((s, a) => s + a.signups_count, 0);
  const totalSubs = affiliates.reduce((s, a) => s + a.active_sub_count, 0);
  const totalMRR = affiliates.reduce((s, a) => s + a.mrr_generated, 0);
  const commMonth = affiliates.reduce((s, a) => s + a.commissions_month, 0);
  const commAll = affiliates.reduce((s, a) => s + a.commissions_total, 0);

  const exportCSV = () => {
    if (!filtered.length) return;
    const h = ['Nom','Email','Conversions','Abos actifs','MRR','Com mois','Com totale','%','Rang','Statut'];
    const r = filtered.map(a => [a.full_name||'', a.email||'', a.signups_count, a.active_sub_count, a.mrr_generated.toFixed(2), a.commissions_month.toFixed(2), a.commissions_total.toFixed(2), (a.commission_rate*100).toFixed(0)+'%', getRank(a.signups_count).label, a.status]);
    const csv = [h.join(','), ...r.map(x => x.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `affilies_belaya_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <KPI icon={Users} label="Affilies actifs" value={activeAffs.length} c="rose" />
        <KPI icon={TrendingUp} label="Clients convertis" value={totalConversions} c="emerald" />
        <KPI icon={Zap} label="Abos actifs" value={totalSubs} c="blue" />
        <KPI icon={DollarSign} label="MRR genere" value={`${totalMRR.toFixed(0)} EUR`} c="teal" />
        <KPI icon={DollarSign} label="Com. mois" value={`${commMonth.toFixed(0)} EUR`} c="amber" />
        <KPI icon={DollarSign} label="Com. totale" value={`${commAll.toFixed(0)} EUR`} c="green" />
        <KPI icon={Clock} label="A payer" value={`${commMonth.toFixed(0)} EUR`} c="orange" />
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {([['table', 'Affilies', Users, 'brand'], ['zone_rouge', `Zone rouge (${zoneRouge.length})`, AlertTriangle, 'red'], ['leaderboard', 'Classement', Trophy, 'amber']] as const).map(([key, label, Icon, color]) => (
          <button key={key} onClick={() => setSubTab(key)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${subTab === key ? `border-${color}-500 text-${color}-600` : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4 inline mr-1.5" />{label}
          </button>
        ))}
      </div>

      {subTab === 'table' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm font-medium ${showFilters ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              <Filter className="w-4 h-4" />Filtres
              {(statusFilter !== 'all' || rankFilter !== 'all' || perfFilter !== 'all') && <span className="w-2 h-2 rounded-full bg-brand-500" />}
            </button>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"><Download className="w-4 h-4" />Export</button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="all">Tous</option><option value="active">Active</option><option value="observation">Observation</option><option value="paused">Paused</option><option value="disabled">Disabled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rang</label>
                <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value as RankFilter)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="all">Tous</option><option value="recrue">Recrue</option><option value="closer">Closer</option><option value="pro">Pro</option><option value="elite">Elite</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Performance</label>
                <select value={perfFilter} onChange={(e) => setPerfFilter(e.target.value as PerfFilter)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="all">Tous</option><option value="top">Top performers</option><option value="zone_rouge">Zone rouge</option><option value="zero">Aucun client</option><option value="high_commission">Commission &gt; 100 EUR</option>
                </select>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-12"><Users className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600">Aucun affilie trouve</p></div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Nom','Email','Depuis','Login','Conv.','Abos','MRR','Com. mois','Com. totale','%','Bonus','Rang','Statut','Actions'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((a) => {
                      const rank = getRank(a.signups_count);
                      const isEd = editingId === a.id;
                      return (
                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{a.full_name || '---'}</td>
                          <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{a.email || '---'}</td>
                          <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">{new Date(a.approved_at || a.created_at).toLocaleDateString('fr-FR')}</td>
                          <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">{a.last_sign_in_at ? new Date(a.last_sign_in_at).toLocaleDateString('fr-FR') : '---'}</td>
                          <td className="px-3 py-3 text-sm font-semibold text-gray-900">{a.signups_count}</td>
                          <td className="px-3 py-3 text-sm text-gray-900">{a.active_sub_count}</td>
                          <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">{a.mrr_generated.toFixed(0)} EUR</td>
                          <td className="px-3 py-3 text-sm font-medium text-emerald-700 whitespace-nowrap">{a.commissions_month.toFixed(0)} EUR</td>
                          <td className="px-3 py-3 text-sm font-semibold text-emerald-700 whitespace-nowrap">{a.commissions_total.toFixed(0)} EUR</td>
                          <td className="px-3 py-3 text-sm">
                            {isEd ? <input type="number" step="0.01" min="0" max="1" value={editValues.commission_rate} onChange={(e) => setEditValues(v => ({ ...v, commission_rate: parseFloat(e.target.value) || 0 }))} className="w-16 px-1.5 py-1 border border-gray-300 rounded text-xs" /> : <span>{(a.commission_rate * 100).toFixed(0)}%</span>}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            {isEd ? <input type="number" step="1" min="0" value={editValues.bonus_amount} onChange={(e) => setEditValues(v => ({ ...v, bonus_amount: parseFloat(e.target.value) || 0 }))} className="w-16 px-1.5 py-1 border border-gray-300 rounded text-xs" /> : <span className="text-gray-600">{a.bonus_amount > 0 ? `${a.bonus_amount} EUR` : '---'}</span>}
                          </td>
                          <td className="px-3 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rank.color}`}>{rank.label}</span></td>
                          <td className="px-3 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'active' ? 'bg-green-100 text-green-700' : a.status === 'observation' ? 'bg-amber-100 text-amber-700' : a.status === 'disabled' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>{a.status}</span></td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              {isEd ? (
                                <><button onClick={() => handleSaveEdit(a.id)} disabled={saving} className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 disabled:opacity-50">{saving ? '...' : 'OK'}</button><button onClick={() => setEditingId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">X</button></>
                              ) : (
                                <><button onClick={() => startEditing(a)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Modifier"><Edit2 className="w-3.5 h-3.5" /></button><button onClick={() => setSelectedAffiliate(a)} className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg" title="Fiche"><ChevronRight className="w-3.5 h-3.5" /></button></>
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
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-600" /><h3 className="font-semibold text-red-900">Zone rouge - Affilies inactifs</h3></div>
            <p className="text-sm text-red-700">Affilies sans conversion depuis 7 jours ou plus.</p>
          </div>
          {zoneRouge.length === 0 ? (
            <div className="text-center py-12"><Award className="w-12 h-12 text-green-400 mx-auto mb-3" /><p className="text-gray-600">Aucun affilie inactif</p></div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden"><div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-red-50 border-b border-red-100"><tr>
                  {['Nom','Email','Jours inactif','Derniere conv.','Rang','Com. %','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-red-800 uppercase">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {zoneRouge.map((z) => {
                    const days = daysSince(z.last_signup_date);
                    return (
                      <tr key={z.id} className="hover:bg-red-50/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{z.full_name || '---'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{z.email || '---'}</td>
                        <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${days >= 30 ? 'bg-red-200 text-red-800' : days >= 14 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{days >= 999 ? 'Jamais' : `${days}j`}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-600">{z.last_signup_date ? new Date(z.last_signup_date).toLocaleDateString('fr-FR') : 'Jamais'}</td>
                        <td className="px-4 py-3 text-sm">{getRank(z.signups_count).label}</td>
                        <td className="px-4 py-3 text-sm">{(z.commission_rate * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => window.open(`mailto:${z.email}?subject=Votre partenariat Belaya`, '_blank')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Contacter"><Mail className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { startEditing(z as any); setSubTab('table'); }} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Modifier"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDisable(z.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Desactiver"><UserX className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div></div>
          )}
        </div>
      )}

      {subTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b border-amber-100"><div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-600" /><h3 className="font-semibold text-gray-900">Classement total</h3></div></div>
            <div className="divide-y divide-gray-100">
              {leaderAll.length === 0 ? <p className="text-sm text-gray-500 text-center py-6">Aucune donnee</p> :
                leaderAll.map((e, i) => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>{i+1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-900 truncate">{e.full_name || '---'}</span>
                    <span className="text-sm font-bold text-gray-900 shrink-0">{e.signups_count} conv.</span>
                    <span className="text-sm font-semibold text-emerald-700 shrink-0">{e.commissions_total.toFixed(0)} EUR</span>
                  </div>
                ))
              }
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-4 border-b border-blue-100"><div className="flex items-center gap-2"><ArrowUpDown className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-gray-900">Top du mois (30j)</h3></div></div>
            <div className="divide-y divide-gray-100">
              {leaderMonth.length === 0 ? <p className="text-sm text-gray-500 text-center py-6">Aucune donnee</p> :
                leaderMonth.map((e, i) => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-blue-100 text-blue-700' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-500'}`}>{i+1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-900 truncate">{e.full_name || '---'}</span>
                    <span className="text-sm font-bold text-gray-900 shrink-0">{e.signups_30d} conv.</span>
                    <span className="text-sm font-semibold text-emerald-700 shrink-0">{e.commissions_month.toFixed(0)} EUR</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {selectedAffiliate && <AffiliateDetailDrawer affiliate={selectedAffiliate} onClose={() => setSelectedAffiliate(null)} onSave={(u) => { setAffiliates(prev => prev.map(a => a.id === u.id ? { ...a, ...u } : a)); setSelectedAffiliate(prev => prev ? { ...prev, ...u } : null); }} showToast={showToast} />}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function KPI({ icon: Icon, label, value, c }: { icon: any; label: string; value: string | number; c: string }) {
  const colors: Record<string, string> = { rose: 'from-rose-50 to-pink-50 border-rose-200', emerald: 'from-emerald-50 to-teal-50 border-emerald-200', blue: 'from-blue-50 to-cyan-50 border-blue-200', teal: 'from-teal-50 to-cyan-50 border-teal-200', amber: 'from-amber-50 to-orange-50 border-amber-200', green: 'from-green-50 to-emerald-50 border-green-200', orange: 'from-orange-50 to-amber-50 border-orange-200' };
  const iconColors: Record<string, string> = { rose: 'text-rose-600', emerald: 'text-emerald-600', blue: 'text-blue-600', teal: 'text-teal-600', amber: 'text-amber-600', green: 'text-green-600', orange: 'text-orange-600' };
  return (
    <div className={`bg-gradient-to-br ${colors[c] || colors.rose} rounded-xl p-4 border`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0"><Icon className={`w-4 h-4 ${iconColors[c] || iconColors.rose}`} /></div>
        <span className="text-xs font-medium text-gray-600 leading-tight">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
