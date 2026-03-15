/*
  # Add Loyalty Program Settings to Company Profiles

  ## Summary
  Adds configurable loyalty program settings to the company_profiles table
  so that professionals can customize their client loyalty program.

  ## New Columns on company_profiles
  - `loyalty_enabled` (boolean, default true) — Toggle the loyalty program on/off
  - `loyalty_visits_required` (integer, default 10) — Number of appointments required to unlock a reward
  - `loyalty_reward_description` (text, nullable) — Description of the reward (e.g. "Soin offert", "Réduction 20%")
  - `loyalty_card_background_url` (text, nullable) — URL of the custom background image for the loyalty card

  ## Notes
  - All columns use safe IF NOT EXISTS checks
  - No RLS changes needed — company_profiles already has appropriate policies
  - Existing rows will automatically inherit default values
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'loyalty_enabled'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN loyalty_enabled boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'loyalty_visits_required'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN loyalty_visits_required integer DEFAULT 10;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'loyalty_reward_description'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN loyalty_reward_description text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'loyalty_card_background_url'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN loyalty_card_background_url text;
  END IF;
END $$;
