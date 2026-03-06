/*
  # Add affiliate_type column to affiliates table

  1. Modified Tables
    - `affiliates`
      - `affiliate_type` (text, default 'sales') - Type of affiliate: 'sales' for commercial prospection, 'community' for audience/influence-based

  2. Description
    - Adds a new column to distinguish between two types of affiliates:
      - 'sales' (Affilie Commercial) - prospects directly, uses CRM and pipeline
      - 'community' (Affilie Communaute) - shares link with audience, no direct prospection
    - Default is 'sales' to preserve behavior for existing affiliates
    - Adds a CHECK constraint to enforce valid values
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'affiliate_type'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN affiliate_type text NOT NULL DEFAULT 'sales';
    ALTER TABLE affiliates ADD CONSTRAINT affiliates_affiliate_type_check
      CHECK (affiliate_type IN ('sales', 'community'));
  END IF;
END $$;
