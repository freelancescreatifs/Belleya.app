import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AffiliateData {
  id: string;
  user_id: string;
  ref_code: string;
  level: string;
  base_commission_rate: number;
  temporary_commission_rate: number | null;
  temporary_rate_end_date: string | null;
  active_sub_count: number;
  last_signup_date: string | null;
  status: string;
  full_name: string | null;
  email: string | null;
  total_earned: number;
  commission_rate: number;
  active_referrals: number;
  is_active: boolean;
  days_since_last_signup: number;
  program: string;
  bonus_amount: number;
  bonus_note: string | null;
  created_at: string;
  approved_at: string | null;
  last_activity_date: string | null;
}

export function useAffiliate(userId: string | undefined) {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', userId)
        .eq('program', 'belaya_affiliation')
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setAffiliate({
          ...data,
          base_commission_rate: Number(data.base_commission_rate || 0.10),
          commission_rate: Number(data.commission_rate || 0.10),
          total_earned: Number(data.total_earned || 0),
          bonus_amount: Number(data.bonus_amount || 0),
          active_sub_count: data.active_sub_count || 0,
          active_referrals: data.active_referrals || 0,
          days_since_last_signup: data.days_since_last_signup || 0,
        });
      } else {
        setAffiliate(null);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      setAffiliate(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { affiliate, loading, error, reload: load };
}
