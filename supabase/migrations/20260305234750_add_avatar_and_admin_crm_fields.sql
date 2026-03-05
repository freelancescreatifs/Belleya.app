/*
  # Add avatar to affiliates + admin CRM fields

  1. Modified Tables
    - `affiliates`
      - `avatar_url` (text, nullable) - profile photo URL for leaderboard display
    - `affiliate_crm_leads`
      - `admin_note` (text, nullable) - internal admin notes on a lead
      - `is_duplicate_ig` (boolean, default false) - whether Instagram is flagged as duplicate
      - `source` (text, nullable) - lead source (IG, DM, WhatsApp, etc.)

  2. Modified Tables
    - `affiliates`
      - `coach_flag` (text, nullable) - admin flag: 'a_coacher', 'a_surveiller', or null

  3. Storage
    - Create `affiliate-avatars` bucket for profile photos

  4. Security
    - Storage policies for authenticated users to upload/read avatars
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN avatar_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliates' AND column_name = 'coach_flag'
  ) THEN
    ALTER TABLE affiliates ADD COLUMN coach_flag text CHECK (coach_flag IN ('a_coacher', 'a_surveiller'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_crm_leads' AND column_name = 'admin_note'
  ) THEN
    ALTER TABLE affiliate_crm_leads ADD COLUMN admin_note text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_crm_leads' AND column_name = 'is_duplicate_ig'
  ) THEN
    ALTER TABLE affiliate_crm_leads ADD COLUMN is_duplicate_ig boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_crm_leads' AND column_name = 'source'
  ) THEN
    ALTER TABLE affiliate_crm_leads ADD COLUMN source text;
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('affiliate-avatars', 'affiliate-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read affiliate avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'affiliate-avatars');

CREATE POLICY "Authenticated users can upload affiliate avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'affiliate-avatars');

CREATE POLICY "Authenticated users can update their affiliate avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'affiliate-avatars');

CREATE POLICY "Authenticated users can delete their affiliate avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'affiliate-avatars');
