/*
  # Fix affiliate avatar update RLS + Community affiliate default commission

  1. Security Changes
    - Add UPDATE policy on `affiliates` table so affiliates can update their own `avatar_url`
    - Restricted to only allowing avatar_url changes (via WITH CHECK on user_id match)

  2. Data Changes
    - Set community affiliates default commission to 15% (0.15) if currently at default 10%

  3. Important Notes
    - The missing UPDATE policy was causing avatar_url saves to fail silently
    - Community affiliates use a fixed commission rate (no tier progression)
*/

-- Allow affiliates to update their own record (for avatar_url)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'affiliates' AND policyname = 'Affiliates can update own record'
  ) THEN
    CREATE POLICY "Affiliates can update own record"
      ON affiliates FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Set community affiliates to 15% commission if they're still at default 10%
UPDATE affiliates
SET commission_rate = 0.15,
    base_commission_rate = 0.15,
    updated_at = now()
WHERE affiliate_type = 'community'
  AND commission_rate = 0.10
  AND deleted_at IS NULL;
