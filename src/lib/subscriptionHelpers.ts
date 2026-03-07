import { supabase } from './supabase';

export interface SubscriptionStatus {
  isTrial: boolean;
  isActive: boolean;
  daysRemaining: number;
  planType: string;
  subscriptionStatus: string;
  monthlyPrice?: number;
  isLegacyPrice?: boolean;
}

export async function getSubscriptionStatus(companyId: string): Promise<SubscriptionStatus | null> {
  try {
    const { data, error } = await supabase.rpc('get_subscription_status', {
      p_company_id: companyId
    });

    if (error) throw error;

    if (data && data.length > 0) {
      const status = data[0];
      return {
        isTrial: status.is_trial,
        isActive: status.is_active,
        daysRemaining: status.days_remaining,
        planType: status.plan_type,
        subscriptionStatus: status.subscription_status
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return null;
  }
}

export async function checkSubscriptionAccess(companyId: string): Promise<{
  hasAccess: boolean;
  reason?: string;
  daysRemaining?: number;
}> {
  const status = await getSubscriptionStatus(companyId);

  if (!status) {
    return { hasAccess: false, reason: 'no_subscription' };
  }

  if (status.subscriptionStatus === 'trial' && status.daysRemaining > 0) {
    return { hasAccess: true, daysRemaining: status.daysRemaining };
  }

  if (status.subscriptionStatus === 'active') {
    return { hasAccess: true };
  }

  if (status.subscriptionStatus === 'past_due') {
    return { hasAccess: true, reason: 'past_due' };
  }

  if (status.subscriptionStatus === 'expired') {
    return { hasAccess: false, reason: 'expired' };
  }

  return { hasAccess: false, reason: 'unknown' };
}

export async function getUserCompanyId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle();

    return profile?.company_id || null;
  } catch (error) {
    console.error('Error fetching company ID:', error);
    return null;
  }
}

export async function expireTrialSubscriptions(): Promise<void> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({ subscription_status: 'expired' })
      .eq('subscription_status', 'trial')
      .lt('trial_end_date', new Date().toISOString());

    if (error) throw error;
  } catch (error) {
    console.error('Error expiring trials:', error);
  }
}

export function getPlanFeatures(planType: string): string[] {
  const features: Record<string, string[]> = {
    start: [
      'Jusqu\'à 50 clientes',
      'Agenda intelligent',
      'Réservation en ligne',
      'Dashboard financier',
      'Réseaux sociaux intégrés',
      'Support 48h'
    ],
    studio: [
      'Tout Start +',
      'Clientes illimitées',
      'Marketing automatique',
      'Gestion formations',
      'Exports comptables',
      'Support 24h'
    ],
    empire: [
      'Tout Studio +',
      'Automatisation avancée',
      'Revenus d\'affiliation',
      'Support prioritaire',
      'Visibilité premium'
    ],
    vip: [
      'Tout Empire +',
      'Accès VIP complet',
      'Support dédié',
      'Fonctionnalités exclusives'
    ]
  };

  return features[planType] || [];
}

export function getPlanPrice(planType: string): { current: number; future: number } {
  const prices: Record<string, { current: number; future: number }> = {
    start: { current: 29, future: 39 },
    studio: { current: 39, future: 49 },
    empire: { current: 59, future: 79 },
    vip: { current: 0, future: 0 }
  };

  return prices[planType] || { current: 0, future: 0 };
}

export type PlanTier = 'start' | 'studio' | 'empire' | 'vip' | 'trial' | null;

const featuresByPlan: Record<string, string[]> = {
  start: [
    'dashboard', 'agenda', 'clients', 'services', 'finances',
    'tasks', 'goals', 'content', 'public-profile', 'inspiration',
  ],
  studio: [
    'dashboard', 'agenda', 'clients', 'services', 'finances',
    'tasks', 'goals', 'content', 'public-profile', 'inspiration',
    'training', 'stock', 'marketing', 'partnerships', 'profitability',
  ],
  empire: [
    'dashboard', 'agenda', 'clients', 'services', 'finances',
    'tasks', 'goals', 'content', 'public-profile', 'inspiration',
    'training', 'stock', 'marketing', 'partnerships', 'profitability',
  ],
  vip: [
    'dashboard', 'agenda', 'clients', 'services', 'finances',
    'tasks', 'goals', 'content', 'public-profile', 'inspiration',
    'training', 'stock', 'marketing', 'partnerships', 'profitability',
  ],
};

export function getAccessibleFeatures(planType: PlanTier, isTrial: boolean): string[] {
  if (isTrial) {
    return featuresByPlan['empire'];
  }
  if (!planType || !featuresByPlan[planType]) {
    return featuresByPlan['start'];
  }
  return featuresByPlan[planType];
}

export function isFeatureAccessible(featureId: string, planType: PlanTier, isTrial: boolean): boolean {
  const features = getAccessibleFeatures(planType, isTrial);
  return features.includes(featureId);
}

export function getRequiredPlanForFeature(featureId: string): PlanTier {
  if (featuresByPlan['start'].includes(featureId)) return 'start';
  if (featuresByPlan['studio'].includes(featureId)) return 'studio';
  return 'empire';
}

export function getPlanName(planType: string): string {
  const names: Record<string, string> = {
    start: 'Belaya Start',
    studio: 'Belaya Studio',
    empire: 'Belaya Empire',
    vip: 'Belaya VIP'
  };

  return names[planType] || planType;
}

export async function initiateStripeCheckout(planId: string): Promise<{ url?: string; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'not_authenticated' };
    }

    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { planId },
    });

    if (error) {
      return { error: error.message || 'Erreur lors de la creation de la session' };
    }

    if (data?.url) {
      return { url: data.url };
    }

    return { error: 'Aucune URL de paiement retournee' };
  } catch (err: any) {
    return { error: err.message || 'Une erreur est survenue' };
  }
}
