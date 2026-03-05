import { useState, useEffect, useCallback } from 'react';
import {
  Link2, Copy, CheckCircle, Clock, XCircle, Users, DollarSign,
  TrendingUp, ArrowLeft, Loader2, BarChart3, LogOut, Lock,
  Award, AlertTriangle, Flame, Trophy, Crown, Shield, ChevronUp,
  Zap, LogIn, Eye, EyeOff
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
  days_since_last_signup: number;
  last_signup_date: string | null;
  created_at: string;
  bonus_amount: number;
  bonus_note: string | null;
  is_special: boolean;
  disable_tiers: boolean;
  disable_leaderboard: boolean;
  special_commission_rate: number | null;
}

interface AffiliateSignup {
  id: string;
  first_name: string | null;
  city: string | null;
  subscription_status: string;
  attributed_at: string;
  created_at: string;
  trial_start_date: string | null;
  trial_end_date: string | null;
  subscription_start_date: string | null;
  monthly_amount: number;
  user_id: string;
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

interface LeaderboardEntry {
  affiliate_id: string;
  full_name: string;
  signups_count?: number;
  commission_total?: number;
}

interface ZoneRougeEntry {
  affiliate_id: string;
  full_name: string;
  days_inactive: number;
  status: string;
}

interface Competition {
  id: string;
  month: string;
  rank: number;
  commission_total: number;
  reward_amount: number;
  status: string;
}

interface PartnerDashboardProps {
  onBack: () => void;
  onApply: () => void;
}

const RANK_CONFIG = [
  { min: 0, max: 9, label: 'Recrue', rate: 10, icon: Shield, color: 'from-gray-500 to-gray-600', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  { min: 10, max: 49, label: 'Closer', rate: 12, icon: Zap, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { min: 50, max: 149, label: 'Pro', rate: 15, icon: Award, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  { min: 150, max: Infinity, label: 'Elite', rate: 15, icon: Crown, color: 'from-rose-500 to-rose-600', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
];

function getRankConfig(activeSubs: number) {
  return RANK_CONFIG.find(r => activeSubs >= r.min && activeSubs <= r.max) || RANK_CONFIG[0];
}

function getNextRank(activeSubs: number) {
  const idx = RANK_CONFIG.findIndex(r => activeSubs >= r.min && activeSubs <= r.max);
  if (idx < RANK_CONFIG.length - 1) return RANK_CONFIG[idx + 1];
  return null;
}

function getRankProgress(activeSubs: number) {
  const rank = getRankConfig(activeSubs);
  const next = getNextRank(activeSubs);
  if (!next) return 100;
  const range = rank.max - rank.min + 1;
  const progress = activeSubs - rank.min;
  return Math.min(100, Math.round((progress / range) * 100));
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
  const [activeTab, setActiveTab] = useState<'overview' | 'signups' | 'commissions' | 'leaderboard'>('overview');
  const [leaderboardToday, setLeaderboardToday] = useState<LeaderboardEntry[]>([]);
  const [leaderboardMonth, setLeaderboardMonth] = useState<LeaderboardEntry[]>([]);
  const [zoneRouge, setZoneRouge] = useState<ZoneRougeEntry[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  const loadData = useCallback(async (userId: string) => {
    setLoading(true);

    try {
      const { data: appData } = await supabase
        .from('affiliate_applications')
        .select('status')
        .eq('user_id', userId)
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
          .eq('user_id', userId)
          .maybeSingle();

        if (affiliateData) {
          const parsedAffiliate: Affiliate = {
            ...affiliateData,
            commission_rate: Number(affiliateData.commission_rate || 0.10),
            base_commission_rate: Number(affiliateData.base_commission_rate || 0.10),
            total_earned: Number(affiliateData.total_earned || 0),
            bonus_amount: Number(affiliateData.bonus_amount || 0),
            active_sub_count: affiliateData.active_sub_count || 0,
            days_since_last_signup: affiliateData.days_since_last_signup || 0,
            is_special: affiliateData.is_special || false,
            disable_tiers: affiliateData.disable_tiers || false,
            disable_leaderboard: affiliateData.disable_leaderboard || false,
            special_commission_rate: affiliateData.special_commission_rate ? Number(affiliateData.special_commission_rate) : null,
          };
          setAffiliate(parsedAffiliate);

          supabase.rpc('sync_affiliate_signup_statuses').catch(() => {});

          const [signupsRes, commissionsRes, todayRes, monthRes, zoneRes, compRes] = await Promise.all([
            supabase
              .from('affiliate_signups')
              .select('*')
              .eq('affiliate_id', affiliateData.id)
              .order('created_at', { ascending: false })
              .limit(100),
            supabase
              .from('affiliate_commissions')
              .select('*')
              .eq('affiliate_id', affiliateData.id)
              .order('created_at', { ascending: false })
              .limit(50),
            supabase.rpc('get_leaderboard_today'),
            supabase.rpc('get_leaderboard_month'),
            supabase.rpc('get_zone_rouge').catch(() => ({ data: [] })),
            supabase
              .from('monthly_competitions')
              .select('*')
              .eq('affiliate_id', affiliateData.id)
              .order('month', { ascending: false })
              .limit(12),
          ]);

          setSignups(signupsRes.data || []);
          setCommissions(commissionsRes.data || []);
          setLeaderboardToday(todayRes.data || []);
          setLeaderboardMonth(monthRes.data || []);
          setZoneRouge(zoneRes.data || []);
          setCompetitions(compRes.data || []);
        }
      }
    } catch (err) {
      console.error('Error loading affiliate data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadData(user.id);
    }
  }, [user?.id, loadData]);

  useEffect(() => {
    if (!affiliate) return;
    const interval = setInterval(() => {
      Promise.all([
        supabase.rpc('get_leaderboard_today'),
        supabase.rpc('get_leaderboard_month'),
      ]).then(([todayRes, monthRes]) => {
        setLeaderboardToday(todayRes.data || []);
        setLeaderboardMonth(monthRes.data || []);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [affiliate]);

  const copyLink = () => {
    if (!affiliate) return;
    const link = `https://belaya.app/${affiliate.ref_code}`;
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
      <PartnerAuthForm onBack={onBack} />
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
        <DashboardHeader onBack={onBack} onLogout={handleLogout} />
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Demande envoyee</h2>
            <p className="text-gray-600 mb-6">Ta candidature est en cours de validation par l'equipe Belaya.</p>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-200">
              <Clock className="w-4 h-4" />
              En attente
            </span>
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500">L'acces sera active apres validation.</p>
              <div className="mt-6 space-y-3">
                {['Lien affilie', 'Statistiques', 'Commissions', 'Leaderboard'].map((item) => (
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
        <DashboardHeader onBack={onBack} onLogout={handleLogout} />
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Candidature non retenue</h2>
            <p className="text-gray-600">Ta demande n'a pas ete acceptee. Contacte-nous pour plus d'informations.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!affiliate) return null;

  const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
  const affiliateLink = `https://belaya.app/${affiliate.ref_code}`;
  const commissionRate = Number(affiliate.commission_rate || affiliate.base_commission_rate || 0.10) * 100;
  const rank = getRankConfig(affiliate.active_sub_count);
  const nextRank = getNextRank(affiliate.active_sub_count);
  const progress = getRankProgress(affiliate.active_sub_count);
  const RankIcon = rank.icon;

  const now = new Date();

  const enrichedSignups = signups.map(s => {
    const trialEnd = s.trial_end_date ? new Date(s.trial_end_date) : new Date(new Date(s.created_at).getTime() + 14 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const status = s.subscription_status || '';
    let computedStatus: 'trialing' | 'active' | 'expired' | 'canceled' = 'trialing';
    if (status === 'active') computedStatus = 'active';
    else if (status === 'canceled') computedStatus = 'canceled';
    else if (status === 'expired' || (daysLeft <= 0 && status !== 'active')) computedStatus = 'expired';
    else computedStatus = 'trialing';
    return { ...s, computedStatus, daysLeft, trialEnd };
  });

  const statusOrder = { trialing: 0, active: 1, expired: 2, canceled: 3 };
  enrichedSignups.sort((a, b) => {
    const orderDiff = statusOrder[a.computedStatus] - statusOrder[b.computedStatus];
    if (orderDiff !== 0) return orderDiff;
    if (a.computedStatus === 'trialing') return a.daysLeft - b.daysLeft;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const activeSignups = enrichedSignups.filter(s => s.computedStatus === 'active').length;
  const trialingSignups = enrichedSignups.filter(s => s.computedStatus === 'trialing').length;
  const expiredSignups = enrichedSignups.filter(s => s.computedStatus === 'expired').length;
  const totalInscriptions = enrichedSignups.length;

  const activeMRR = enrichedSignups
    .filter(s => s.computedStatus === 'active')
    .reduce((sum, s) => sum + Number(s.monthly_amount || 29), 0);

  const currentMonthCommission = commissions
    .filter(c => {
      const d = new Date(c.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

  const estimatedCommission = currentMonthCommission > 0
    ? currentMonthCommission
    : activeMRR * Number(affiliate.commission_rate || affiliate.base_commission_rate || 0.10);

  const lastConversionLabel = affiliate.last_signup_date
    ? new Date(affiliate.last_signup_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : 'Aucune';

  const isObservation = affiliate.status === 'observation';
  const isDisabled = affiliate.status === 'disabled';
  const isInZoneRouge = affiliate.days_since_last_signup >= 7;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onBack={onBack} onLogout={handleLogout} affiliate={affiliate} rank={rank} />

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {isDisabled && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-800 mb-1">Compte desactive pour inactivite</h3>
              <p className="text-sm text-red-700">
                Ton compte affilie a ete suspendu car tu n'as pas genere d'inscription depuis plus de 30 jours.
                Les commissions ne sont plus generees. Contacte l'equipe pour reactivation.
              </p>
            </div>
          </div>
        )}

        {isObservation && !isDisabled && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-800 mb-1">14 jours sans inscription</h3>
              <p className="text-sm text-amber-700">
                Ton compte est en observation. Sans nouvelle inscription dans les 16 prochains jours,
                ton acces sera desactive. Passe a l'action !
              </p>
            </div>
          </div>
        )}

        {affiliate.disable_tiers ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Commission : {commissionRate}%</h2>
                <p className="text-sm text-gray-500">Compte special - taux fixe</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${rank.color} flex items-center justify-center shadow-lg`}>
                <RankIcon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{rank.label}</h2>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rank.bg} ${rank.text}`}>
                    {commissionRate}%
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {affiliate.active_sub_count} abonnements actifs
                </p>
              </div>
            </div>
            {nextRank ? (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>{affiliate.active_sub_count} / {nextRank.min}</span>
                  <span className="flex items-center gap-1">
                    <ChevronUp className="w-3 h-3" />
                    {nextRank.label} ({nextRank.rate}%)
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${rank.color} transition-all duration-700`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Encore {nextRank.min - affiliate.active_sub_count} abonnements pour passer {nextRank.label}
                </p>
              </div>
            ) : (
              <p className="text-sm text-rose-600 font-medium">Rang maximum atteint</p>
            )}
          </div>
        )}

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
            Code: <span className="font-mono font-semibold text-white">{affiliate.ref_code}</span>
          </p>
        </div>

        {isInZoneRouge && !isDisabled && !isObservation && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-red-800 mb-1">Zone rouge : {affiliate.days_since_last_signup} jours sans conversion</h3>
              <p className="text-sm text-red-700">
                Partage ton lien pour sortir de la zone rouge. Sans inscription dans les prochains jours, ton compte passera en observation.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard icon={Users} label="Inscriptions totales" value={String(totalInscriptions)} color="text-blue-600" />
            <KPICard icon={Clock} label="Essais en cours" value={String(trialingSignups)} color="text-amber-600" />
            <KPICard icon={CheckCircle} label="Conversions payantes" value={String(activeSignups)} color="text-emerald-600" />
            <KPICard icon={TrendingUp} label="Taux de conversion" value={totalInscriptions > 0 ? `${Math.round((activeSignups / totalInscriptions) * 100)}%` : '0%'} color="text-teal-600" />
            <KPICard icon={DollarSign} label="MRR genere" value={`${activeMRR.toFixed(0)} EUR`} color="text-emerald-700" />
            <KPICard icon={DollarSign} label="Commission estimee" value={`${estimatedCommission.toFixed(2)} EUR`} color="text-belaya-deep" />
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {[
            { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
            ...(!affiliate.disable_leaderboard ? [{ key: 'leaderboard', label: 'Leaderboard', icon: Trophy }] : []),
            { key: 'signups', label: 'Inscriptions', icon: Users },
            { key: 'commissions', label: 'Commissions', icon: DollarSign },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
                {!affiliate.disable_tiers && <InfoRow label="Niveau" value={rank.label} />}
                <InfoRow label="Taux de commission" value={`${commissionRate}%${affiliate.is_special ? ' (fixe)' : ''}`} />
                <InfoRow label="Membre depuis" value={affiliate.created_at ? new Date(affiliate.created_at).toLocaleDateString('fr-FR') : '-'} />
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    affiliate.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                    affiliate.status === 'observation' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {affiliate.status === 'active' ? 'Actif' :
                     affiliate.status === 'observation' ? 'Observation' : 'Desactive'}
                  </span>
                </div>
                {affiliate.bonus_amount > 0 && (
                  <InfoRow label="Bonus" value={`${affiliate.bonus_amount} EUR${affiliate.bonus_note ? ` (${affiliate.bonus_note})` : ''}`} />
                )}
              </div>
            </div>

            {competitions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Challenges mensuels
                </h3>
                <div className="space-y-3">
                  {competitions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          c.rank === 1 ? 'bg-amber-100 text-amber-700' :
                          c.rank === 2 ? 'bg-gray-200 text-gray-700' :
                          c.rank === 3 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          #{c.rank}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.month}</p>
                          <p className="text-xs text-gray-500">
                            Commission: {Number(c.commission_total).toFixed(2)} EUR
                          </p>
                        </div>
                      </div>
                      {c.reward_amount > 0 && (
                        <span className="text-sm font-bold text-emerald-700">
                          +{Number(c.reward_amount).toFixed(0)} EUR
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <LeaderboardCard
                title="Top du jour"
                icon={Flame}
                entries={leaderboardToday}
                metric="signups"
                currentAffiliateId={affiliate.id}
              />
              <LeaderboardCard
                title="Top du mois"
                icon={Trophy}
                entries={leaderboardMonth}
                metric="commissions"
                currentAffiliateId={affiliate.id}
              />
            </div>

            {(zoneRouge.length > 0 || isInZoneRouge) && (
              <div className="bg-white rounded-xl border-2 border-red-200 p-6">
                <h3 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Zone Rouge
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Affilies sans inscription depuis plus de 7 jours
                </p>
                {zoneRouge.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun affilie en zone rouge</p>
                ) : (
                  <div className="space-y-2">
                    {zoneRouge.map((z) => (
                      <div
                        key={z.affiliate_id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          z.affiliate_id === affiliate.id ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <Flame className="w-4 h-4 text-red-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {z.full_name || 'Anonyme'}
                            {z.affiliate_id === affiliate.id && (
                              <span className="ml-2 text-xs text-red-600 font-bold">(Toi)</span>
                            )}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-red-600">
                          {z.days_inactive}j sans inscription
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Challenge mensuel - Top 3
              </h3>
              <p className="text-sm text-gray-600 mb-4">Chaque mois, les 3 meilleurs affilies sont recompenses :</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { rank: 1, reward: 300, emoji: '' },
                  { rank: 2, reward: 150, emoji: '' },
                  { rank: 3, reward: 75, emoji: '' },
                ].map((tier) => (
                  <div key={tier.rank} className="bg-white rounded-lg p-4 text-center border border-amber-100">
                    <p className="text-2xl mb-1">{tier.rank === 1 ? '1er' : tier.rank === 2 ? '2e' : '3e'}</p>
                    <p className="text-xl font-bold text-gray-900">{tier.reward} EUR</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'signups' && (
          <div className="bg-white rounded-xl border border-gray-200">
            {enrichedSignups.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucune inscription pour le moment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Prenom</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Jours restants</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan choisi</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">MRR genere</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Commission</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date inscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedSignups.map((s) => {
                      const monthlyAmt = Number(s.monthly_amount || 0);
                      const signupMRR = s.computedStatus === 'active' ? (monthlyAmt > 0 ? monthlyAmt : 29) : 0;
                      const signupCommission = signupMRR * Number(affiliate.commission_rate || affiliate.base_commission_rate || 0.10);
                      const planLabel = s.computedStatus === 'active' ? (monthlyAmt >= 49 ? 'Elite' : monthlyAmt >= 39 ? 'Pro' : 'Start') : null;

                      return (
                        <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {s.first_name || 'Utilisateur'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusTag status={s.computedStatus} daysLeft={s.daysLeft} />
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {s.computedStatus === 'trialing' ? (
                              <span className={`font-semibold ${s.daysLeft <= 2 ? 'text-orange-600' : s.daysLeft <= 5 ? 'text-amber-600' : 'text-gray-700'}`}>
                                J-{Math.max(0, s.daysLeft)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {planLabel ? (
                              <span className="font-medium text-gray-900">{planLabel}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {signupMRR > 0 ? (
                              <span className="font-medium text-emerald-700">{signupMRR.toFixed(0)} EUR</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {signupCommission > 0 ? (
                              <span className="font-medium text-belaya-deep">{signupCommission.toFixed(2)} EUR</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(s.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                        </tr>
                      );
                    })}
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

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Regles officielles</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />Commission uniquement si abonnement actif</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />Annulation = arret des commissions futures</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />Remboursement = commission annulee</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />Les chiffres du dashboard font foi</li>
          </ul>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function DashboardHeader({ onBack, onLogout, affiliate, rank }: {
  onBack: () => void;
  onLogout: () => void;
  affiliate?: Affiliate | null;
  rank?: typeof RANK_CONFIG[number];
}) {
  return (
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
          {affiliate && rank && !affiliate.disable_tiers && (
            <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${rank.bg} ${rank.text} ${rank.border} border`}>
              {rank.label}
            </span>
          )}
          <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}

function KPICard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className={`text-2xl font-bold ${color || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

function PartnerAuthForm({ onBack }: { onBack: () => void }) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        if (!form.firstName.trim() || !form.lastName.trim()) {
          throw new Error('Le prenom et le nom sont requis');
        }
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              role: 'pro',
              first_name: form.firstName.trim(),
              last_name: form.lastName.trim()
            }
          }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setAuthError(err.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : err.message || 'Erreur d\'authentification');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-belaya-50/20 to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block mb-4">
            <img src="/logo.png" alt="Belaya" className="h-14 w-auto mx-auto" />
          </a>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Espace Partenaire</h1>
          <p className="text-gray-500 text-sm">Connecte-toi pour acceder a ton dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-belaya-deep to-belaya-bright text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-belaya-deep to-belaya-bright text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Creer un compte
            </button>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prenom</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-all"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="ton@email.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-belaya-primary focus:border-belaya-primary transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-belaya-deep to-belaya-bright text-white rounded-xl font-semibold transition-all hover:shadow-lg disabled:opacity-50"
            >
              {authLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {authMode === 'signup' ? 'Creer mon compte' : 'Se connecter'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-belaya-deep transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour a la page partenaire
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusTag({ status, daysLeft }: { status: 'trialing' | 'active' | 'expired' | 'canceled'; daysLeft: number }) {
  switch (status) {
    case 'trialing':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" />
          Essai (J-{Math.max(0, daysLeft)})
        </span>
      );
    case 'active':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3 h-3" />
          Abonnee
        </span>
      );
    case 'expired':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3 h-3" />
          N'a pas pris
        </span>
      );
    case 'canceled':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
          <XCircle className="w-3 h-3" />
          Annulee
        </span>
      );
  }
}

function LeaderboardCard({ title, icon: Icon, entries, metric, currentAffiliateId }: {
  title: string;
  icon: React.ElementType;
  entries: LeaderboardEntry[];
  metric: 'signups' | 'commissions';
  currentAffiliateId: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-amber-500" />
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Pas encore de donnees</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const isMe = entry.affiliate_id === currentAffiliateId;
            const val = metric === 'signups'
              ? `${entry.signups_count || 0} inscriptions`
              : `${Number(entry.commission_total || 0).toFixed(2)} EUR`;

            return (
              <div
                key={entry.affiliate_id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isMe ? 'bg-belaya-50 border border-belaya-200' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-gray-200 text-gray-700' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {entry.full_name || 'Anonyme'}
                    {isMe && <span className="ml-1 text-xs text-belaya-deep font-bold">(Toi)</span>}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{val}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
