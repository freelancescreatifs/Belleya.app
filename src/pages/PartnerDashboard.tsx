import { useState, useEffect } from 'react';
import {
  Link2, Copy, CheckCircle, Clock, XCircle, Users, DollarSign,
  TrendingUp, ArrowLeft, Loader2, BarChart3, LogOut, Lock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/shared/ToastContainer';

interface Affiliate {
  id: string;
  ref_code: string;
  commission_rate: number;
  base_commission_rate: number;
  active_sub_count: number;
  total_earned: number;
  active_referrals: number;
  status: string;
  level: string;
  created_at: string;
}

interface AffiliateSignup {
  id: string;
  first_name: string | null;
  city: string | null;
  subscription_status: string;
  attributed_at: string;
  created_at: string;
}

interface AffiliateCommission {
  id: string;
  period: string;
  commission_amount: number;
  mrr: number;
  status: string;
  created_at: string;
  subscription_plan: string | null;
}

interface PartnerDashboardProps {
  onBack: () => void;
  onApply: () => void;
}

export default function PartnerDashboard({ onBack, onApply }: PartnerDashboardProps) {
  const { user, signOut } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [signups, setSignups] = useState<AffiliateSignup[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'signups' | 'commissions'>('overview');

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: appData } = await supabase
        .from('affiliate_applications')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!appData) {
        setApplicationStatus('none');
        setLoading(false);
        return;
      }

      setApplicationStatus(appData.status as 'pending' | 'approved' | 'rejected');

      if (appData.status === 'approved') {
        const { data: affiliateData } = await supabase
          .from('affiliates')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (affiliateData) {
          setAffiliate(affiliateData);

          const [signupsRes, commissionsRes] = await Promise.all([
            supabase
              .from('affiliate_signups')
              .select('*')
              .eq('affiliate_id', affiliateData.id)
              .order('created_at', { ascending: false })
              .limit(50),
            supabase
              .from('affiliate_commissions')
              .select('*')
              .eq('affiliate_id', affiliateData.id)
              .order('created_at', { ascending: false })
              .limit(50)
          ]);

          setSignups(signupsRes.data || []);
          setCommissions(commissionsRes.data || []);
        }
      }
    } catch (err) {
      console.error('Error loading affiliate data:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!affiliate) return;
    const link = `${window.location.origin}/?ref=${affiliate.ref_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    showToast('success', 'Lien copie dans le presse-papiers !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await signOut();
    onBack();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
          <p className="text-gray-600 mb-4">Connecte-toi pour acceder a ton dashboard partenaire.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-belaya-deep text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-belaya-deep" />
      </div>
    );
  }

  if (applicationStatus === 'none') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-belaya-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-belaya-deep" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Pas encore partenaire</h2>
          <p className="text-gray-600 mb-6">Tu n'as pas encore soumis de candidature au programme d'affiliation.</p>
          <button
            onClick={onApply}
            className="px-8 py-3 bg-gradient-to-r from-belaya-deep to-belaya-bright text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Postuler maintenant
          </button>
        </div>
      </div>
    );
  }

  if (applicationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">Dashboard Partenaire</h1>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 max-w-lg">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Demande envoyee</h2>
            <p className="text-gray-600 mb-6">
              Ta candidature est en cours de validation par l'equipe Belaya.
            </p>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-200">
              <Clock className="w-4 h-4" />
              En attente
            </span>
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                L'acces au dashboard affilie sera active apres validation.
              </p>
              <div className="mt-6 space-y-3">
                {['Lien affilie', 'Statistiques', 'Commissions', 'Inscriptions'].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-gray-400 text-sm">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span>{item}</span>
                    <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded">Bloque</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (applicationStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">Dashboard Partenaire</h1>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12 max-w-lg">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Candidature non retenue</h2>
            <p className="text-gray-600">
              Ta demande n'a pas ete acceptee pour le moment. Tu peux nous contacter pour plus d'informations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
  const activeSignups = signups.filter(s => s.subscription_status === 'active').length;
  const affiliateLink = `${window.location.origin}/?ref=${affiliate?.ref_code || ''}`;
  const commissionRate = Number(affiliate?.commission_rate || affiliate?.base_commission_rate || 0.10) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Dashboard Partenaire</h1>
              <p className="text-sm text-gray-500">Programme d'affiliation Belaya</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              Actif
            </span>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="bg-gradient-to-r from-belaya-deep to-belaya-bright rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Ton lien d'affiliation</h2>
          </div>
          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <input
              readOnly
              value={affiliateLink}
              className="flex-1 bg-transparent text-white placeholder-white/60 text-sm outline-none min-w-0"
            />
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2 bg-white text-belaya-deep rounded-lg font-medium text-sm hover:shadow-lg transition-all flex-shrink-0"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copie !' : 'Copier'}
            </button>
          </div>
          <p className="text-white/70 text-xs mt-2">
            Code: <span className="font-mono font-semibold text-white">{affiliate?.ref_code}</span>
            {' '} | Commission: <span className="font-semibold text-white">{commissionRate}%</span>
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <Users className="w-4 h-4" />
              Inscriptions
            </div>
            <p className="text-2xl font-bold text-gray-900">{signups.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <CheckCircle className="w-4 h-4" />
              Actives
            </div>
            <p className="text-2xl font-bold text-emerald-600">{activeSignups}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              Commissions totales
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalCommissions.toFixed(2)} EUR</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              MRR estime
            </div>
            <p className="text-2xl font-bold text-belaya-deep">{(activeSignups * 2.9).toFixed(2)} EUR</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {[
            { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
            { key: 'signups', label: 'Inscriptions', icon: Users },
            { key: 'commissions', label: 'Commissions', icon: DollarSign }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-belaya-deep text-belaya-deep'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Informations du compte</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Niveau</p>
                  <p className="font-medium text-gray-900 capitalize">{affiliate?.level || 'Recrue'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Taux de commission</p>
                  <p className="font-medium text-gray-900">{commissionRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Membre depuis</p>
                  <p className="font-medium text-gray-900">
                    {affiliate?.created_at ? new Date(affiliate.created_at).toLocaleDateString('fr-FR') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Actif
                  </span>
                </div>
              </div>
            </div>

            {signups.length === 0 && commissions.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-14 h-14 bg-belaya-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-belaya-deep" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pret a demarrer !</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Partage ton lien d'affiliation pour commencer a generer des inscriptions et des commissions.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'signups' && (
          <div className="bg-white rounded-xl border border-gray-200">
            {signups.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune inscription pour le moment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nom</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ville</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signups.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900">{s.first_name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.city || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.subscription_status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {s.subscription_status === 'active' ? 'Actif' : s.subscription_status || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(s.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="bg-white rounded-xl border border-gray-200">
            {commissions.length === 0 ? (
              <div className="p-8 text-center">
                <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune commission pour le moment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Periode</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">MRR</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Commission</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900">{c.period || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.subscription_plan || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{Number(c.mrr || 0).toFixed(2)} EUR</td>
                        <td className="px-4 py-3 text-sm font-semibold text-belaya-deep">
                          {Number(c.commission_amount || 0).toFixed(2)} EUR
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : c.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {c.status === 'paid' ? 'Paye' : c.status === 'pending' ? 'En attente' : c.status || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

