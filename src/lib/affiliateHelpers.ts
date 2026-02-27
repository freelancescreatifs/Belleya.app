import { supabase } from './supabase';

export interface AffiliateData {
  id: string;
  ref_code: string;
  level: string;
  base_commission_rate: number;
  temporary_commission_rate: number | null;
  temporary_rate_end_date: string | null;
  active_sub_count: number;
  status: string;
  last_signup_date: string | null;
  last_activity_date: string | null;
  days_since_last_signup: number;
  full_name: string | null;
  email: string | null;
  total_earned: number;
  is_active: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  value: number;
  isCurrentUser: boolean;
}

export interface ZoneRougeEntry {
  name: string;
  daysSinceLastSignup: number;
  status: string;
}

export const LEVEL_CONFIG = {
  recrue: { label: 'Recrue', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', rate: 10, min: 0, max: 10, icon: 'target' },
  closer: { label: 'Closer', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', rate: 12, min: 10, max: 50, icon: 'zap' },
  pro: { label: 'Pro', color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', rate: 15, min: 50, max: 150, icon: 'award' },
  elite: { label: 'Elite', color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200', rate: 15, min: 150, max: 999, icon: 'crown' },
} as const;

export type AffiliateLevel = keyof typeof LEVEL_CONFIG;

export function getEffectiveCommissionRate(affiliate: AffiliateData | null): number {
  if (!affiliate) return 0.10;
  if (
    affiliate.temporary_commission_rate &&
    affiliate.temporary_rate_end_date &&
    new Date(affiliate.temporary_rate_end_date) > new Date()
  ) {
    return affiliate.temporary_commission_rate;
  }
  return affiliate.base_commission_rate || 0.10;
}

export function calculateLevel(activeSubCount: number): AffiliateLevel {
  if (activeSubCount >= 150) return 'elite';
  if (activeSubCount >= 50) return 'pro';
  if (activeSubCount >= 10) return 'closer';
  return 'recrue';
}

export function getNextLevel(current: AffiliateLevel): AffiliateLevel | null {
  const order: AffiliateLevel[] = ['recrue', 'closer', 'pro', 'elite'];
  const idx = order.indexOf(current);
  if (idx < order.length - 1) return order[idx + 1];
  return null;
}

export function getLevelProgress(activeSubCount: number, level: AffiliateLevel): number {
  const config = LEVEL_CONFIG[level];
  const next = getNextLevel(level);
  if (!next) return 100;
  const nextConfig = LEVEL_CONFIG[next];
  const range = nextConfig.min - config.min;
  const progress = activeSubCount - config.min;
  return Math.min(Math.max((progress / range) * 100, 0), 100);
}

export async function loadAffiliateData(userId: string) {
  const { data: appData } = await supabase
    .from('affiliate_applications')
    .select('id, status, created_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!appData || appData.status !== 'approved') {
    return { application: appData, affiliate: null };
  }

  const { data: affData } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return { application: appData, affiliate: affData as AffiliateData | null };
}

export async function loadLeaderboards(currentAffiliateId: string | null) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: allAffiliates } = await supabase
    .from('affiliates')
    .select('id, user_id, active_sub_count, last_signup_date, days_since_last_signup, status')
    .eq('is_active', true);

  if (!allAffiliates || allAffiliates.length === 0) {
    return { daily: [], monthly: [], zoneRouge: [] };
  }

  const userIds = allAffiliates.map(a => a.user_id);
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, first_name')
    .in('user_id', userIds);

  const profileMap = new Map((profiles || []).map(p => [p.user_id, p.first_name || 'Partenaire']));

  const dailySorted = [...allAffiliates]
    .sort((a, b) => (b.active_sub_count || 0) - (a.active_sub_count || 0))
    .slice(0, 10);

  const daily: LeaderboardEntry[] = dailySorted.map((a, i) => ({
    rank: i + 1,
    name: profileMap.get(a.user_id) || 'Partenaire',
    value: a.active_sub_count || 0,
    isCurrentUser: a.id === currentAffiliateId,
  }));

  const { data: monthlyComms } = await supabase
    .from('affiliate_commissions')
    .select('affiliate_id, commission_amount')
    .eq('period', currentMonth);

  const commByAffiliate = new Map<string, number>();
  (monthlyComms || []).forEach(c => {
    commByAffiliate.set(
      c.affiliate_id,
      (commByAffiliate.get(c.affiliate_id) || 0) + Number(c.commission_amount)
    );
  });

  const monthlySorted = allAffiliates
    .map(a => ({
      id: a.id,
      user_id: a.user_id,
      commission: commByAffiliate.get(a.id) || 0,
    }))
    .sort((a, b) => b.commission - a.commission)
    .slice(0, 10);

  const monthly: LeaderboardEntry[] = monthlySorted.map((a, i) => ({
    rank: i + 1,
    name: profileMap.get(a.user_id) || 'Partenaire',
    value: a.commission,
    isCurrentUser: a.id === currentAffiliateId,
  }));

  const zoneRouge: ZoneRougeEntry[] = allAffiliates
    .filter(a => {
      if (!a.last_signup_date) return true;
      const days = Math.floor((Date.now() - new Date(a.last_signup_date).getTime()) / (1000 * 60 * 60 * 24));
      return days >= 7;
    })
    .map(a => {
      const days = a.last_signup_date
        ? Math.floor((Date.now() - new Date(a.last_signup_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      return {
        name: profileMap.get(a.user_id) || 'Partenaire',
        daysSinceLastSignup: days,
        status: a.status,
      };
    })
    .sort((a, b) => b.daysSinceLastSignup - a.daysSinceLastSignup);

  return { daily, monthly, zoneRouge };
}
