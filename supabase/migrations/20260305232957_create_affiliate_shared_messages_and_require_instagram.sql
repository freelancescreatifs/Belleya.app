/*
  # Create Affiliate Shared Messages + Make Instagram Required on CRM Leads

  1. Schema Changes
    - Make `instagram` column NOT NULL on `affiliate_crm_leads`
    - Add index on `instagram` for fast duplicate lookups

  2. New Tables
    - `affiliate_shared_messages`
      - `id` (uuid, primary key)
      - `affiliate_id` (uuid, FK to affiliates)
      - `affiliate_name` (text) - cached name for display
      - `content` (text, NOT NULL) - the message content
      - `category` (text, NOT NULL) - objection category
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on `affiliate_shared_messages`
    - All authenticated affiliates can read all shared messages
    - Affiliates can only insert/update/delete their own messages

  4. Notes
    - Instagram is required because most beauty pros are contacted via Instagram
    - Shared messages create a knowledge base across all affiliates
    - Category values: pas_le_temps, deja_un_outil, pas_interesse, hesitant, autre
*/

-- Make instagram NOT NULL with default empty string handled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_crm_leads' AND column_name = 'instagram'
  ) THEN
    UPDATE affiliate_crm_leads SET instagram = '' WHERE instagram IS NULL;
    ALTER TABLE affiliate_crm_leads ALTER COLUMN instagram SET NOT NULL;
    ALTER TABLE affiliate_crm_leads ALTER COLUMN instagram SET DEFAULT '';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_affiliate_crm_leads_instagram ON affiliate_crm_leads(instagram);

-- Create shared messages table
CREATE TABLE IF NOT EXISTS affiliate_shared_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  affiliate_name text NOT NULL DEFAULT '',
  content text NOT NULL,
  category text NOT NULL DEFAULT 'autre' CHECK (category IN ('pas_le_temps', 'deja_un_outil', 'pas_interesse', 'hesitant', 'autre')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate_shared_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_affiliate_shared_messages_category ON affiliate_shared_messages(category);
CREATE INDEX IF NOT EXISTS idx_affiliate_shared_messages_affiliate_id ON affiliate_shared_messages(affiliate_id);

-- All affiliates can read all shared messages
CREATE POLICY "Affiliates can read all shared messages"
  ON affiliate_shared_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Affiliates can insert their own messages
CREATE POLICY "Affiliates can insert own shared messages"
  ON affiliate_shared_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Affiliates can update their own messages
CREATE POLICY "Affiliates can update own shared messages"
  ON affiliate_shared_messages
  FOR UPDATE
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Affiliates can delete their own messages
CREATE POLICY "Affiliates can delete own shared messages"
  ON affiliate_shared_messages
  FOR DELETE
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );
