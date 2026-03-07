import { useState, useEffect } from 'react';
import { X, Award, Mail, Phone, Copy, Check, ExternalLink, Loader2, Pencil, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  affiliate_type?: string;
  avatar_url?: string | null;
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
  const idx = RANK_THRESHOLDS.findIndex(r => conversions >= r.min && conversions <= r.max);
  return idx < RANK_THRESHOLDS.length - 1 ? RANK_THRESHOLDS[idx + 1] : null;
}

function getRankProgress(conversions: number) {
  const rank = getRank(conversions);
  const next = getNextRank(conversions);
  if (!next) return 100;
  const rangeSize = rank.max - rank.min + 1;
  return Math.min(100, Math.round(((conversions - rank.min) / rangeSize) * 100));
}

interface Props {
  affiliate: AffiliateData;
  onClose: () => void;
  onSave: (updated: Partial<AffiliateData> & { id: string }) => void;
  showToast: (type: string, msg: string) => void;
}

export default function AffiliateDetailDrawer({ affiliate, onClose, onSave, showToast }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    commission_rate: affiliate.commission_rate,
    bonus_amount: affiliate.bonus_amount,
    bonus_note: affiliate.bonus_note || '',
    status: affiliate.status,
    affiliate_type: affiliate.affiliate_type || 'sales',
  });
  const [saving, setSaving] = useState(false);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(true);
  const [copied, setCopied] = useState(false);

  const rank = getRank(affiliate.signups_count);
  const nextRank = getNextRank(affiliate.signups_count);
  const progress = getRankProgress(affiliate.signups_count);
  const affiliateLink = `https://belaya.app/${affiliate.ref_code}`;

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
        .limit(30);
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
          status: form.status,
          affiliate_type: form.affiliate_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', affiliate.id);

      if (error) throw error;

      onSave({
        id: affiliate.id,
        commission_rate: form.commission_rate,
        bonus_amount: form.bonus_amount,
        bonus_note: form.bonus_note || null,
        status: form.status,
        affiliate_type: form.affiliate_type,
      });
      setEditMode(false);
      showToast('success', 'Modifications enregistrees');
    } catch (err: any) {
      showToast('error', err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-900">Fiche Affilie</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center shrink-0 border-2 border-gray-200">
              {affiliate.avatar_url ? (
                <img src={affiliate.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-rose-600">
                  {(affiliate.full_name || 'A')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xl font-bold text-gray-900 truncate">{affiliate.full_name || '---'}</h4>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {affiliate.email || '---'}
              </p>
              {affiliate.phone && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {affiliate.phone}
                </p>
              )}
              {affiliate.instagram_url && (
                <a
                  href={affiliate.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 flex items-center gap-1 mt-0.5 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  Instagram
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
              affiliate.status === 'active' ? 'bg-green-100 text-green-700' :
              affiliate.status === 'observation' ? 'bg-amber-100 text-amber-700' :
              affiliate.status === 'disabled' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {affiliate.status}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Lien affilie</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 truncate">
                {affiliateLink}
              </code>
              <button
                onClick={handleCopyLink}
                className={`p-2 rounded-lg transition-colors shrink-0 ${
                  copied ? 'bg-green-100 text-green-600' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
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
            {nextRank ? (
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
            ) : (
              <p className="text-xs text-rose-600 font-medium">Rang maximum atteint</p>
            )}
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-3">Performance</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Conversions totales</p>
                <p className="text-xl font-bold text-gray-900">{affiliate.signups_count}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Conversions 30j</p>
                <p className="text-xl font-bold text-gray-900">{affiliate.signups_30d}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Abonnements actifs</p>
                <p className="text-xl font-bold text-gray-900">{affiliate.active_sub_count}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">MRR genere</p>
                <p className="text-xl font-bold text-gray-900">{affiliate.mrr_generated.toFixed(2)} EUR</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Commission ce mois</p>
                <p className="text-xl font-bold text-emerald-700">{affiliate.commissions_month.toFixed(2)} EUR</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Commission totale</p>
                <p className="text-xl font-bold text-emerald-700">{affiliate.commissions_total.toFixed(2)} EUR</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold text-gray-900">Parametres</h5>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
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
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="observation">Observation</option>
                    <option value="paused">Paused</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type d'affilie</label>
                  <select
                    value={form.affiliate_type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setForm(f => ({
                        ...f,
                        affiliate_type: newType,
                        commission_rate: newType === 'community' && f.commission_rate === 0.10 ? 0.15 : f.commission_rate,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="sales">Affilie Commercial</option>
                    <option value="community">Affilie Communaute</option>
                  </select>
                  {form.affiliate_type === 'community' && (
                    <p className="text-xs text-sky-600 mt-0.5">Commission fixe a {(form.commission_rate * 100).toFixed(0)}% (modifiable ci-dessus)</p>
                  )}
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
                <div>
                  <p className="text-gray-500 text-xs">Type</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    affiliate.affiliate_type === 'community'
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {affiliate.affiliate_type === 'community' ? 'Communaute' : 'Commercial'}
                  </span>
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

          <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
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
            {affiliate.last_signup_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">Derniere conversion</span>
                <span className="text-gray-900">{new Date(affiliate.last_signup_date).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
          </div>

          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-3">Historique commissions</h5>
            {loadingCommissions ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : commissions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Aucune commission enregistree</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {commissions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.period}</p>
                      <p className="text-xs text-gray-500">
                        MRR: {Number(c.mrr || 0).toFixed(2)} EUR | {(Number(c.commission_rate) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-700">
                        {Number(c.commission_amount).toFixed(2)} EUR
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        c.status === 'paid' ? 'bg-green-100 text-green-700' :
                        c.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        c.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {c.status === 'paid' ? 'Paye' :
                         c.status === 'approved' ? 'Approuve' :
                         c.status === 'pending' ? 'En attente' : c.status}
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
