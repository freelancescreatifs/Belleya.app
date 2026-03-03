import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserCompanyId,
  getSubscriptionStatus,
  isFeatureAccessible,
  getRequiredPlanForFeature,
  type SubscriptionStatus,
  type PlanTier,
} from '../lib/subscriptionHelpers';

interface UseSubscriptionResult {
  loading: boolean;
  status: SubscriptionStatus | null;
  planType: PlanTier;
  isTrial: boolean;
  isActive: boolean;
  daysRemaining: number;
  canAccess: (featureId: string) => boolean;
  getRequiredPlan: (featureId: string) => PlanTier;
}

export function useSubscription(): UseSubscriptionResult {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const companyId = await getUserCompanyId();
        if (!companyId || cancelled) {
          setLoading(false);
          return;
        }

        const sub = await getSubscriptionStatus(companyId);
        if (!cancelled) {
          setStatus(sub);
        }
      } catch (err) {
        console.error('Error loading subscription:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const isTrial = status?.isTrial === true && (status?.daysRemaining ?? 0) > 0;
  const isActive = status?.isActive === true || isTrial;
  const planType: PlanTier = isTrial ? 'empire' : (status?.planType as PlanTier) || null;
  const daysRemaining = status?.daysRemaining ?? 0;

  const canAccess = (featureId: string): boolean => {
    if (!isActive) return false;
    return isFeatureAccessible(featureId, planType, isTrial);
  };

  const getRequiredPlan = (featureId: string): PlanTier => {
    return getRequiredPlanForFeature(featureId);
  };

  return {
    loading,
    status,
    planType,
    isTrial,
    isActive,
    daysRemaining,
    canAccess,
    getRequiredPlan,
  };
}
