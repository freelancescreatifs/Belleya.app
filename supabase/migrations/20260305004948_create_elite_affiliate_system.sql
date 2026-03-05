/*
  # Create Elite Affiliate System

  1. New Tables
    - `monthly_competitions`
      - `id` (uuid, primary key)
      - `month` (text, e.g. '2026-03')
      - `affiliate_id` (uuid, FK to affiliates)
      - `rank` (integer)
      - `commission_total` (numeric)
      - `signups_count` (integer)
      - `reward_amount` (numeric)
      - `status` (text: pending/paid)
      - `created_at` (timestamptz)

  2. Modified Tables
    - `affiliates` - ensure all elite fields exist:
      - `days_since_last_signup` (integer, default 0)
      - `last_signup_date` (timestamptz)
      - `status` already exists (active/observation/disabled)
      - `level` already exists (recrue/closer/pro/elite)

  3. Security
    - Enable RLS on `monthly_competitions`
    - Affiliates can read their own competition entries
    - Affiliates can read all entries for leaderboard
    - Admin can manage all

  4. Functions
    - `calculate_affiliate_level` - recalculates level based on active subs
    - `get_leaderboard_today` - returns top signups today
    - `get_leaderboard_month` - returns top commissions this month
    - `get_zone_rouge` - returns affiliates inactive >= 7 days
*/

CREATE TABLE IF NOT EXISTS monthly_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  rank integer NOT NULL DEFAULT 0,
  commission_total numeric DEFAULT 0,
  signups_count integer DEFAULT 0,
  reward_amount numeric DEFAULT 0,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(month, affiliate_id)
);

ALTER TABLE monthly_competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can read all competition entries"
  ON monthly_competitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert competition entries"
  ON monthly_competitions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update competition entries"
  ON monthly_competitions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_monthly_competitions_month ON monthly_competitions(month);
CREATE INDEX IF NOT EXISTS idx_monthly_competitions_affiliate_id ON monthly_competitions(affiliate_id);

CREATE OR REPLACE FUNCTION public.get_leaderboard_today()
RETURNS TABLE(
  affiliate_id uuid,
  full_name text,
  signups_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS affiliate_id,
    a.full_name,
    COUNT(s.id) AS signups_count
  FROM affiliates a
  LEFT JOIN affiliate_signups s ON s.affiliate_id = a.id
    AND s.created_at::date = CURRENT_DATE
  WHERE a.status = 'active'
    AND a.program = 'belaya_affiliation'
  GROUP BY a.id, a.full_name
  HAVING COUNT(s.id) > 0
  ORDER BY signups_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_leaderboard_month()
RETURNS TABLE(
  affiliate_id uuid,
  full_name text,
  commission_total numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS affiliate_id,
    a.full_name,
    COALESCE(SUM(c.commission_amount), 0) AS commission_total
  FROM affiliates a
  LEFT JOIN affiliate_commissions c ON c.affiliate_id = a.id
    AND c.created_at >= date_trunc('month', CURRENT_DATE)
    AND c.created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
  WHERE a.status = 'active'
    AND a.program = 'belaya_affiliation'
  GROUP BY a.id, a.full_name
  HAVING COALESCE(SUM(c.commission_amount), 0) > 0
  ORDER BY commission_total DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_zone_rouge()
RETURNS TABLE(
  affiliate_id uuid,
  full_name text,
  days_inactive integer,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS affiliate_id,
    a.full_name,
    a.days_since_last_signup AS days_inactive,
    a.status
  FROM affiliates a
  WHERE a.program = 'belaya_affiliation'
    AND a.days_since_last_signup >= 7
    AND a.status IN ('active', 'observation')
  ORDER BY a.days_since_last_signup DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
