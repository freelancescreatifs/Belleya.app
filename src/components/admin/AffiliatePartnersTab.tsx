import { useState, useEffect } from 'react';
import { Search, Users, Loader2, DollarSign, TrendingUp, Award, ChevronRight, CreditCard as Edit2, X, ExternalLink, Calendar, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../shared/ToastContainer';

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
  last_activity_date: string | null;
  last_sign_in_at: string | null;
  signups_count: number;
  commissions_total: number;
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

function getNextRank(conversions: number) {
  const currentIdx = RANK_THRESHOLDS.findIndex(r => conversions >= r.min && conversions <= r.max);
  if (currentIdx < RANK_THRESHOLDS.length - 1) {
    return RANK_THRESHOLDS[currentIdx + 1];
  }
  return null;
}

function getRankProgress(conversions: number) {
  const rank = getRank(conversions);
  const next = getNextRank(conversions);
  if (!next) return 100;
  const rangeSize = rank.max - rank.min + 1;
  const progress = conversions - rank.min;
  return Math.min(100, Math.round((progress / rangeSize) * 100));
}

export default function AffiliatePartnersTab() {
  const { toasts, showToast, dismissToast } = useToast();
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ commission_rate: 0, bonus_amount: 0, bonus_note: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    setLoading(true);
    try {
      const { data: affiliateRows, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('program', 'belaya_affiliation')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched: AffiliateData[] = await Promise.all(
        (affiliateRows || []).map(async (aff) => {
          const [signupsRes, commissionsRes, authRes] = await Promise.all([
            supabase
              .from('affiliate_signups')
              .select('id', { count: 'exact', head: true })
              .eq('affiliate_id', aff.id),
            supabase
              .from('affiliate_commissions')
              .select('commission_amount')
              .eq('affiliate_id', aff.id),
            supabase
              .from('admin_users_view')
              .select('last_sign_in_at')
              .eq('user_id', aff.user_id)
              .maybeSingle()
          ]);

          const signups_count = signupsRes.count || 0;
          const commissions_total = (commissionsRes.data || []).reduce(
            (sum, c) => sum + Number(c.commission_amount || 0), 0
          );

          return {
            ...aff,
            commission_rate: Number(aff.commission_rate || 0.10),
            bonus_amount: Number(aff.bonus_amount || 0),
            total_earned: Number(aff.total_earned || 0),
            active_referrals: aff.active_referrals || 0,
            active_sub_count: aff.active_sub_count || 0,
            signups_count,
            commissions_total,
            last_sign_in_at: authRes.data?.last_sign_in_at || null,
          };
        })
      );

      setAffiliates(enriched);
    } catch (err) {
      console.error('Error loading affiliates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (affiliateId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({
          commission_rate: editValues.commission_rate,
          bonus_amount: editValues.bonus_amount,
          bonus_note: editValues.bonus_note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', affiliateId);

      if (error) throw error;

      setAffiliates(prev => prev.map(a => {
        if (a.id !== affiliateId) return a;
        return {
          ...a,
          commission_rate: editValues.commission_rate,
          bonus_amount: editValues.bonus_amount,
          bonus_note: editValues.bonus_note || null,
        };
      }));

      if (selectedAffiliate?.id === affiliateId) {
        setSelectedAffiliate(prev => prev ? {
          ...prev,
          commission_rate: editValues.commission_rate,
          bonus_amount: editValues.bonus_amount,
          bonus_note: editValues.bonus_note || null,
        } : null);
      }

      setEditingId(null);
      showToast('success', 'Modifications enregistrees');
    } catch (err: any) {
      showToast('error', err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (aff: AffiliateData) => {
    setEditingId(aff.id);
    setEditValues({
      commission_rate: aff.commission_rate,
      bonus_amount: aff.bonus_amount,
      bonus_note: aff.bonus_note || '',
    });
  };

  const filtered = affiliates.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      a.ref_code.toLowerCase().includes(q)
    );
  });

  const totalConversions = affiliates.reduce((s, a) => s + a.signups_count, 0);
  const totalCommissions = affiliates.reduce((s, a) => s + a.commissions_total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-5 border border-rose-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Affilies actifs</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{affiliates.length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total conversions</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalConversions}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Commissions versees</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalCommissions.toFixed(2)} EUR</p>
        </div>
      </div>

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
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucun partenaire Belaya trouve</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Depuis</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Converti</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Remuneration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Bonus</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Rang</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Dernier login</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((aff) => {
                  const rank = getRank(aff.signups_count);
                  const isEditing = editingId === aff.id;

                  return (
                    <tr key={aff.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {aff.full_name || '---'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{aff.email || '---'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {aff.approved_at
                          ? new Date(aff.approved_at).toLocaleDateString('fr-FR')
                          : new Date(aff.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{aff.signups_count}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-700">
                        {aff.commissions_total.toFixed(2)} EUR
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={editValues.commission_rate}
                            onChange={(e) => setEditValues(v => ({ ...v, commission_rate: parseFloat(e.target.value) || 0 }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-brand-500"
                          />
                        ) : (
                          <span className="text-gray-900">{(aff.commission_rate * 100).toFixed(0)}%</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={editValues.bonus_amount}
                            onChange={(e) => setEditValues(v => ({ ...v, bonus_amount: parseFloat(e.target.value) || 0 }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-brand-500"
                          />
                        ) : (
                          <span className="text-gray-600">
                            {aff.bonus_amount > 0 ? `${aff.bonus_amount} EUR` : '---'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rank.color}`}>
                          {rank.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {aff.last_sign_in_at
                          ? new Date(aff.last_sign_in_at).toLocaleDateString('fr-FR')
                          : '---'}
                      </td>
                      <td className="px-4 py-3">
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
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelectedAffiliate(aff)}
                                className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                title="Voir le detail"
                              >
                                <ChevronRight className="w-4 h-4" />
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

function AffiliateDetailDrawer({
  affiliate,
  onClose,
  onSave,
  showToast,
}: {
  affiliate: AffiliateData;
  onClose: () => void;
  onSave: (updated: Partial<AffiliateData> & { id: string }) => void;
  showToast: (type: string, msg: string) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    commission_rate: affiliate.commission_rate,
    bonus_amount: affiliate.bonus_amount,
    bonus_note: affiliate.bonus_note || '',
  });
  const [saving, setSaving] = useState(false);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(true);

  const rank = getRank(affiliate.signups_count);
  const nextRank = getNextRank(affiliate.signups_count);
  const progress = getRankProgress(affiliate.signups_count);

  useEffect(() => {
    loadCommissions();
  }, [affiliate.id]);

  const loadCommissions = async () => {
    setLoadingCommissions(true);
    try {
      const { data } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setCommissions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCommissions(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({
          commission_rate: form.commission_rate,
          bonus_amount: form.bonus_amount,
          bonus_note: form.bonus_note || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', affiliate.id);

      if (error) throw error;

      onSave({
        id: affiliate.id,
        commission_rate: form.commission_rate,
        bonus_amount: form.bonus_amount,
        bonus_note: form.bonus_note || null,
      });
      setEditMode(false);
      showToast('success', 'Modifications enregistrees');
    } catch (err: any) {
      showToast('error', err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-900">Fiche Partenaire</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-rose-600">
                {(affiliate.full_name || 'A')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xl font-bold text-gray-900 truncate">{affiliate.full_name || '---'}</h4>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {affiliate.email || '---'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Code : {affiliate.ref_code}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rang actuel</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${rank.color}`}>
                <Award className="w-4 h-4" />
                {rank.label}
              </span>
            </div>
            {nextRank && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{affiliate.signups_count} conversions</span>
                  <span>{nextRank.min} pour {nextRank.label}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${rank.barColor}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            {!nextRank && (
              <p className="text-xs text-rose-600 font-medium">Rang maximum atteint</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Conversions</p>
              <p className="text-xl font-bold text-gray-900">{affiliate.signups_count}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Abonnements actifs</p>
              <p className="text-xl font-bold text-gray-900">{affiliate.active_sub_count}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Commission totale</p>
              <p className="text-xl font-bold text-emerald-700">{affiliate.commissions_total.toFixed(2)} EUR</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">MRR attribue</p>
              <p className="text-xl font-bold text-gray-900">
                {(affiliate.active_sub_count * 29).toFixed(2)} EUR
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-semibold text-gray-900">Parametres</h5>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Modifier
                </button>
              )}
            </div>

            {editMode ? (
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">% Commission</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={form.commission_rate}
                    onChange={(e) => setForm(f => ({ ...f, commission_rate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Ex: 0.10 = 10%, 0.15 = 15%</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bonus (EUR)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.bonus_amount}
                    onChange={(e) => setForm(f => ({ ...f, bonus_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Note bonus</label>
                  <input
                    type="text"
                    value={form.bonus_note}
                    onChange={(e) => setForm(f => ({ ...f, bonus_note: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                    placeholder="Ex: Bonus parrainage Q1"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-3 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Commission</p>
                  <p className="font-semibold text-gray-900">{(affiliate.commission_rate * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Bonus</p>
                  <p className="font-semibold text-gray-900">
                    {affiliate.bonus_amount > 0 ? `${affiliate.bonus_amount} EUR` : '---'}
                  </p>
                </div>
                {affiliate.bonus_note && (
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs">Note</p>
                    <p className="text-gray-700">{affiliate.bonus_note}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Inscription</span>
              <span className="text-gray-900">{new Date(affiliate.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
            {affiliate.approved_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Approuve le</span>
                <span className="text-gray-900">{new Date(affiliate.approved_at).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
            {affiliate.last_sign_in_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Derniere connexion</span>
                <span className="text-gray-900">{new Date(affiliate.last_sign_in_at).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
          </div>

          <div>
            <h5 className="font-semibold text-gray-900 mb-3">Historique commissions</h5>
            {loadingCommissions ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : commissions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucune commission enregistree</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {commissions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.period}</p>
                      <p className="text-xs text-gray-500">
                        {c.subscription_plan || '---'} | {(Number(c.commission_rate) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-700">
                        {Number(c.commission_amount).toFixed(2)} EUR
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        c.status === 'paid' ? 'bg-green-100 text-green-700' :
                        c.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {c.status === 'paid' ? 'Paye' : c.status === 'pending' ? 'En attente' : c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
