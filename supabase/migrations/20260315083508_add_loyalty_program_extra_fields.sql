/*
  # Add Extra Loyalty Program Fields to company_profiles

  ## Summary
  Extends the loyalty program configuration stored in company_profiles with three new fields
  that give professionals more control over how their loyalty card looks and behaves.

  ## New Columns (all on company_profiles)
  - `loyalty_program_name` (text, nullable): Custom name for the program e.g. "Club VIP Belleya"
  - `loyalty_card_accent_color` (text, nullable): Hex color used as card accent when no background image is set
  - `loyalty_reset_on_redeem` (boolean, DEFAULT false): When true, the visit counter resets to 0 after a reward is redeemed; when false, the reward badge stays unlocked

  ## Notes
  - All three columns are nullable / have defaults so no data migration is needed
  - No new tables, no RLS changes (inherits existing company_profiles RLS)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'loyalty_program_name'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN loyalty_program_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'loyalty_card_accent_color'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN loyalty_card_accent_color text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'loyalty_reset_on_redeem'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN loyalty_reset_on_redeem boolean DEFAULT false;
  END IF;
END $$;
