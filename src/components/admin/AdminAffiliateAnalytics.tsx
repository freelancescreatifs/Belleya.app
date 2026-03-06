import { useState, useEffect, useCallback } from 'react';
import {
  Users, TrendingUp, DollarSign, BarChart3, Clock, AlertTriangle,
  Search, Download, ChevronDown, Loader2, Trophy, User, Filter, X,
  MessageSquare, Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import LeadsVsSubscribersChart from '../partner/LeadsVsSubscribersChart';

interface AffiliateRow {
  id: string;
  full_name: string;
  avatar_url: string | null;
  active_sub_count: number;
  total_earned: number;
  status: string;
  coach_flag: string | null;
  days_since_last_signup: number;
  ref_code: string;
}

interface CRMLead {
  id: string;
  name: string;
  instagram: string;
  status: string;
  next_follow_up: string | null;
  created_at: string;
  affiliate_id: string;
  affiliate_name: string;
  affiliate_avatar: string | null;
  admin_note: string | null;
  is_duplicate_ig: boolean;
  source: string | null;
}

interface GlobalKPIs {
  totalAffiliates: number;
  totalLeads: number;
  leads30d: number;
  leadsToRelanceToday: number;
  leadsOverdue: number;
  totalSignups: number;
  signups30d: number;
  totalSubscribed: number;
  subscribed30d: number;
  leadToSignupRate: number;
  signupToSubRate: number;
  affiliateMRR: number;
  commissionMonth: number;
  commissionTotal: number;
}

type LeadFilter = 'all' | 'today' | 'overdue' | 'duplicate' | 'hot';
type AffiliateFilter = string;

export default function AdminAffiliateAnalytics() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKPIs] = useState<GlobalKPIs>({
    totalAffiliates: 0, totalLeads: 0, leads30d: 0, leadsToRelanceToday: 0,
    leadsOverdue: 0, totalSignups: 0, signups30d: 0, totalSubscribed: 0,
    subscribed30d: 0, leadToSignupRate: 0, signupToSubRate: 0,
    affiliateMRR: 0, commissionMonth: 0, commissionTotal: 0,
  });
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; leads: number; signups: number; subscribed: number; revenue: number }[]>([]);
  const [leadFilter, setLeadFilter] = useState<LeadFilter>('all');
  const [affiliateFilter, setAffiliateFilter] = useState<AffiliateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [activeView, setActiveView] = useState<'overview' | 'crm' | 'leaderboard'>('overview');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const todayStr = now.toISOString().split('T')[0];
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [affRes, leadsRes, signupsRes, commissionsRes] = await Promise.all([
        supabase.from('affiliates').select('id, full_name, avatar_url, active_sub_count, total_earned, status, coach_flag, days_since_last_signup, ref_code').eq('status', 'active').order('active_sub_count', { ascending: false }),
        supabase.from('affiliate_crm_leads').select('id, name, instagram, status, next_follow_up, created_at, affiliate_id, admin_note, is_duplicate_ig, source'),
        supabase.from('affiliate_signups').select('id, affiliate_id, subscription_status, created_at, trial_end_date'),
        supabase.from('affiliate_commissions').select('id, affiliate_id, commission_amount, mrr, period, created_at'),
      ]);

      const allAffiliates: AffiliateRow[] = affRes.data || [];
      setAffiliates(allAffiliates);

      const affiliateMap = new Map(allAffiliates.map(a => [a.id, a]));

      const allLeads = (leadsRes.data || []).map((l: any) => {
        const aff = affiliateMap.get(l.affiliate_id);
        return {
          ...l,
          affiliate_name: aff?.full_name || 'Inconnu',
          affiliate_avatar: aff?.avatar_url || null,
        } as CRMLead;
      });
      setLeads(allLeads);

      const allSignups = signupsRes.data || [];
      const allCommissions = commissionsRes.data || [];

      const totalLeads = allLeads.length;
      const leads30d = allLeads.filter(l => new Date(l.created_at) >= thirtyDaysAgo).length;
      const leadsToRelanceToday = allLeads.filter(l => l.next_follow_up && l.next_follow_up <= todayStr && l.status !== 'pas_interesse' && l.status !== 'client').length;
      const leadsOverdue = allLeads.filter(l => {
        if (!l.next_follow_up || l.status === 'pas_interesse' || l.status === 'client') return false;
        return l.next_follow_up < todayStr;
      }).length;

      const totalSignups = allSignups.length;
      const signups30d = allSignups.filter((s: any) => new Date(s.created_at) >= thirtyDaysAgo).length;
      const totalSubscribed = allSignups.filter((s: any) => s.subscription_status === 'active').length;
      const subscribed30d = allSignups.filter((s: any) => s.subscription_status === 'active' && new Date(s.created_at) >= thirtyDaysAgo).length;

      const leadToSignupRate = totalLeads > 0 ? Math.round((totalSignups / totalLeads) * 100) : 0;
      const signupToSubRate = totalSignups > 0 ? Math.round((totalSubscribed / totalSignups) * 100) : 0;

      const affiliateMRR = allSignups
        .filter((s: any) => s.subscription_status === 'active')
        .length * 29;

      const commissionMonth = allCommissions
        .filter((c: any) => c.period === currentMonth)
        .reduce((sum: number, c: any) => sum + Number(c.commission_amount || 0), 0);

      const commissionTotal = allAffiliates.reduce((sum, a) => sum + Number(a.total_earned || 0), 0);

      setKPIs({
        totalAffiliates: allAffiliates.length,
        totalLeads, leads30d, leadsToRelanceToday, leadsOverdue,
        totalSignups, signups30d, totalSubscribed, subscribed30d,
        leadToSignupRate, signupToSubRate,
        affiliateMRR, commissionMonth, commissionTotal,
      });

      const months: typeof monthlyData = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('fr-FR', { month: 'short' });
        const monthStart = d;
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

        const mLeads = allLeads.filter(l => { const c = new Date(l.created_at); return c >= monthStart && c <= monthEnd; }).length;
        const mSignups = allSignups.filter((s: any) => { const c = new Date(s.created_at); return c >= monthStart && c <= monthEnd; }).length;
        const mSubs = allSignups.filter((s: any) => s.subscription_status === 'active' && (() => { const c = new Date(s.created_at); return c >= monthStart && c <= monthEnd; })()).length;
        const mRevenue = allCommissions
          .filter((c: any) => c.period === key)
          .reduce((sum: number, c: any) => sum + Number(c.commission_amount || 0), 0);

        months.push({ month: label, leads: mLeads, signups: mSignups, subscribed: mSubs, revenue: mRevenue });
      }
      setMonthlyData(months);

    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveNote = async (leadId: string) => {
    await supabase.from('affiliate_crm_leads').update({ admin_note: noteText }).eq('id', leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, admin_note: noteText } : l));
    setEditingNote(null);
    setNoteText('');
  };

  const handleCoachFlag = async (affiliateId: string, flag: string | null) => {
    await supabase.from('affiliates').update({ coach_flag: flag }).eq('id', affiliateId);
    setAffiliates(prev => prev.map(a => a.id === affiliateId ? { ...a, coach_flag: flag } : a));
  };

  const exportLeadsCSV = () => {
    const rows = filteredLeads.map(l => ({
      Nom: l.name,
      Instagram: l.instagram,
      Statut: l.status,
      Affilie: l.affiliate_name,
      Source: l.source || '',
      Relance: l.next_follow_up || '',
      Doublon: l.is_duplicate_ig ? 'Oui' : 'Non',
      Note: l.admin_note || '',
      Date: new Date(l.created_at).toLocaleDateString('fr-FR'),
    }));
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r as any)[h] || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_affiliation_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const filteredLeads = leads.filter(l => {
    if (affiliateFilter !== 'all' && l.affiliate_id !== affiliateFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!l.name.toLowerCase().includes(q) && !l.instagram.toLowerCase().includes(q) && !l.affiliate_name.toLowerCase().includes(q)) return false;
    }
    switch (leadFilter) {
      case 'today': return l.next_follow_up === todayStr;
      case 'overdue': return l.next_follow_up ? l.next_follow_up < todayStr && l.status !== 'pas_interesse' && l.status !== 'client' : false;
      case 'duplicate': return l.is_duplicate_ig;
      case 'hot': return false;
      default: return true;
    }
  });

  const topLeads = [...affiliates].sort((a, b) => {
    const aLeads = leads.filter(l => l.affiliate_id === a.id).length;
    const bLeads = leads.filter(l => l.affiliate_id === b.id).length;
    return bLeads - aLeads;
  }).slice(0, 10);

  const topSubscribed = [...affiliates].sort((a, b) => b.active_sub_count - a.active_sub_count).slice(0, 10);
  const topRevenue = [...affiliates].sort((a, b) => Number(b.total_earned) - Number(a.total_earned)).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200 mb-4">
        {[
          { key: 'overview' as const, label: 'Vue d\'ensemble', icon: BarChart3 },
          { key: 'crm' as const, label: 'CRM Management', icon: Users },
          { key: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
              activeView === tab.key ? 'border-belaya-deep text-belaya-deep' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeView === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <KPI label="Affilies actifs" value={kpis.totalAffiliates} icon={Users} color="text-blue-600" />
            <KPI label="Leads total" value={kpis.totalLeads} icon={Users} color="text-gray-700" />
            <KPI label="Leads (30j)" value={kpis.leads30d} icon={TrendingUp} color="text-teal-600" />
            <KPI label="Relances aujourd'hui" value={kpis.leadsToRelanceToday} icon={Clock} color="text-amber-600" />
            <KPI label="Relances en retard" value={kpis.leadsOverdue} icon={AlertTriangle} color="text-red-600" />
            <KPI label="Inscriptions total" value={kpis.totalSignups} icon={Users} color="text-blue-600" />
            <KPI label="Inscriptions (30j)" value={kpis.signups30d} icon={TrendingUp} color="text-blue-500" />
            <KPI label="Abonnes total" value={kpis.totalSubscribed} icon={DollarSign} color="text-emerald-600" />
            <KPI label="Abonnes (30j)" value={kpis.subscribed30d} icon={TrendingUp} color="text-emerald-500" />
            <KPI label="Lead → Inscrit" value={`${kpis.leadToSignupRate}%`} icon={TrendingUp} color="text-teal-600" />
            <KPI label="Inscrit → Abonne" value={`${kpis.signupToSubRate}%`} icon={TrendingUp} color="text-emerald-700" />
            <KPI label="MRR affiliation" value={`${kpis.affiliateMRR} EUR`} icon={DollarSign} color="text-emerald-700" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KPI label="Commission ce mois" value={`${kpis.commissionMonth.toFixed(0)} EUR`} icon={DollarSign} color="text-belaya-deep" />
            <KPI label="Commission totale" value={`${kpis.commissionTotal.toFixed(0)} EUR`} icon={DollarSign} color="text-gray-900" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <ChartCard title="Leads ajoutes par mois" data={monthlyData.map(m => ({ label: m.month, value: m.leads }))} color="#3B82F6" />
            <ChartCard title="Inscriptions par mois" data={monthlyData.map(m => ({ label: m.month, value: m.signups }))} color="#F59E0B" />
            <ChartCard title="Abonnes par mois" data={monthlyData.map(m => ({ label: m.month, value: m.subscribed }))} color="#10B981" />
            <ChartCard title="Commissions par mois (EUR)" data={monthlyData.map(m => ({ label: m.month, value: Math.round(m.revenue) }))} color="#059669" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Funnel global
            </h3>
            <FunnelGlobal
              steps={[
                { label: 'Leads contactes', value: kpis.totalLeads, color: '#6366F1' },
                { label: 'Inscription - Essai en cours', value: kpis.totalSignups, color: '#3B82F6' },
                { label: 'Clients abonnes', value: kpis.totalSubscribed, color: '#10B981' },
              ]}
            />
          </div>

          <LeadsVsSubscribersChart />
        </div>
      )}

      {activeView === 'crm' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher nom, Instagram, affilie..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-belaya-primary"
              />
            </div>
            <div className="relative">
              <select
                value={leadFilter}
                onChange={e => setLeadFilter(e.target.value as LeadFilter)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="all">Tous les leads</option>
                <option value="today">Relances aujourd'hui</option>
                <option value="overdue">En retard</option>
                <option value="duplicate">Doublons Instagram</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={affiliateFilter}
                onChange={e => setAffiliateFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="all">Tous les affilies</option>
                {affiliates.map(a => (
                  <option key={a.id} value={a.id}>{a.full_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button onClick={exportLeadsCSV} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>

          <div className="text-xs text-gray-500">{filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}</div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nom</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Instagram</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Affilie</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Relance</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Doublon</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Note admin</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeads.slice(0, 100).map(lead => {
                    const isOverdue = lead.next_follow_up && lead.next_follow_up < todayStr && lead.status !== 'pas_interesse' && lead.status !== 'client';
                    const isToday = lead.next_follow_up === todayStr;

                    return (
                      <tr key={lead.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50/50' : isToday ? 'bg-amber-50/50' : ''}`}>
                        <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{lead.name}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-600">@{lead.instagram.replace(/^@/, '')}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                              {lead.affiliate_avatar ? (
                                <img src={lead.affiliate_avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><User className="w-3 h-3 text-gray-400" /></div>
                              )}
                            </div>
                            <span className="text-sm text-gray-700 truncate">{lead.affiliate_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5"><LeadStatusBadge status={lead.status} /></td>
                        <td className="px-3 py-2.5 text-sm">
                          {lead.next_follow_up ? (
                            <span className={`font-medium ${isOverdue ? 'text-red-600' : isToday ? 'text-amber-600' : 'text-gray-600'}`}>
                              {new Date(lead.next_follow_up + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                              {isOverdue && ' (retard)'}
                            </span>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          {lead.is_duplicate_ig ? (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Oui</span>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          {editingNote === lead.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                className="px-2 py-1 border border-gray-200 rounded text-xs w-32"
                                autoFocus
                              />
                              <button onClick={() => handleSaveNote(lead.id)} className="text-emerald-600 hover:text-emerald-700"><Eye className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditingNote(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingNote(lead.id); setNoteText(lead.admin_note || ''); }}
                              className="text-xs text-gray-500 hover:text-gray-700 max-w-[120px] truncate block"
                              title={lead.admin_note || 'Ajouter une note'}
                            >
                              {lead.admin_note || <span className="text-gray-400 italic">+ note</span>}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredLeads.length === 0 && (
              <div className="text-center py-10 text-gray-500">Aucun lead trouve</div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Gestion des affilies</h3>
            <div className="space-y-3">
              {affiliates.map(aff => {
                const affLeadCount = leads.filter(l => l.affiliate_id === aff.id).length;
                return (
                  <div key={aff.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      {aff.avatar_url ? (
                        <img src={aff.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-gray-400" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{aff.full_name}</p>
                      <p className="text-xs text-gray-500">{affLeadCount} leads | {aff.active_sub_count} abonnes | {Number(aff.total_earned).toFixed(0)} EUR</p>
                    </div>
                    <select
                      value={aff.coach_flag || ''}
                      onChange={e => handleCoachFlag(aff.id, e.target.value || null)}
                      className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="">Aucun flag</option>
                      <option value="a_coacher">A coacher</option>
                      <option value="a_surveiller">A surveiller</option>
                    </select>
                    {aff.coach_flag && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        aff.coach_flag === 'a_coacher' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {aff.coach_flag === 'a_coacher' ? 'Coacher' : 'Surveiller'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeView === 'leaderboard' && (
        <div className="space-y-6">
          <LeaderboardSection
            title="Top leads ajoutes"
            icon={<Users className="w-5 h-5 text-blue-500" />}
            entries={topLeads.map(a => ({
              name: a.full_name,
              avatar: a.avatar_url,
              value: leads.filter(l => l.affiliate_id === a.id).length,
              suffix: ' leads',
            }))}
            color="#3B82F6"
          />
          <LeaderboardSection
            title="Top clients abonnes"
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            entries={topSubscribed.map(a => ({
              name: a.full_name,
              avatar: a.avatar_url,
              value: a.active_sub_count,
              suffix: ' abonnes',
            }))}
            color="#10B981"
          />
          <LeaderboardSection
            title="Top revenus generes"
            icon={<DollarSign className="w-5 h-5 text-amber-500" />}
            entries={topRevenue.map(a => ({
              name: a.full_name,
              avatar: a.avatar_url,
              value: Number(a.total_earned),
              suffix: ' EUR',
            }))}
            color="#F59E0B"
          />
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, data, color }: { title: string; data: { label: string; value: number }[]; color: string }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">{title}</h4>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-8">{d.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${Math.max((d.value / maxVal) * 100, 3)}%`, backgroundColor: color }}
              >
                {d.value > 0 && <span className="text-[10px] font-semibold text-white">{d.value}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelGlobal({ steps }: { steps: { label: string; value: number; color: string }[] }) {
  const maxVal = Math.max(...steps.map(s => s.value), 1);

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const pct = Math.max(10, (step.value / maxVal) * 100);
        const prevValue = i > 0 ? steps[i - 1].value : 0;
        const convRate = prevValue > 0 ? Math.round((step.value / prevValue) * 100) : 0;

        return (
          <div key={i}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{step.label}</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900">{step.value}</span>
                {i > 0 && <span className="text-xs text-gray-500">({convRate}%)</span>}
              </div>
            </div>
            <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-700 flex items-center justify-center"
                style={{ width: `${pct}%`, backgroundColor: step.color }}
              >
                <span className="text-white text-sm font-semibold">{step.value}</span>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <svg width="12" height="14" viewBox="0 0 12 14">
                  <path d="M6 2L6 12M6 12L3 9M6 12L9 9" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    nouveau: { label: 'Nouveau', cls: 'bg-blue-50 text-blue-700' },
    contacte: { label: 'Contacte', cls: 'bg-sky-50 text-sky-700' },
    interesse: { label: 'Interesse', cls: 'bg-teal-50 text-teal-700' },
    en_essai: { label: 'En essai', cls: 'bg-amber-50 text-amber-700' },
    client: { label: 'Client', cls: 'bg-emerald-50 text-emerald-700' },
    pas_interesse: { label: 'Pas interesse', cls: 'bg-gray-100 text-gray-600' },
  };
  const c = config[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.cls}`}>{c.label}</span>;
}

function LeaderboardSection({ title, icon, entries, color }: {
  title: string;
  icon: React.ReactNode;
  entries: { name: string; avatar: string | null; value: number; suffix: string }[];
  color: string;
}) {
  const maxVal = Math.max(...entries.map(e => e.value), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">Aucune donnee</p>
      ) : (
        <div className="p-5 space-y-3">
          {entries.map((entry, idx) => {
            const barPct = Math.max(5, (entry.value / maxVal) * 100);
            return (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                  {entry.avatar ? (
                    <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900 w-28 truncate">{entry.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${barPct}%`, backgroundColor: color }}
                  >
                    {entry.value > 0 && (
                      <span className="text-[10px] font-semibold text-white whitespace-nowrap">
                        {entry.value}{entry.suffix}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
