/*
  # Create Affiliate CRM Leads Table

  1. New Tables
    - `affiliate_crm_leads`
      - `id` (uuid, primary key)
      - `affiliate_id` (uuid, FK to affiliates)
      - `name` (text) - prospect name
      - `city` (text) - prospect city
      - `instagram` (text) - Instagram handle
      - `phone` (text) - phone number
      - `status` (text) - lead status (nouveau, contacte, interesse, en_essai, abonne, pas_interesse)
      - `first_contact_date` (date) - first contact date
      - `next_follow_up` (date) - next follow-up date
      - `notes` (text) - free text notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `affiliate_crm_leads`
    - Affiliates can only CRUD their own leads

  3. Notes
    - Instagram field is NOT unique to avoid blocking affiliates
    - Status values are enforced via CHECK constraint
*/

CREATE TABLE IF NOT EXISTS affiliate_crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  city text DEFAULT '',
  instagram text DEFAULT '',
  phone text DEFAULT '',
  status text NOT NULL DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'contacte', 'interesse', 'en_essai', 'abonne', 'pas_interesse')),
  first_contact_date date DEFAULT CURRENT_DATE,
  next_follow_up date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate_crm_leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_affiliate_crm_leads_affiliate_id ON affiliate_crm_leads(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_crm_leads_status ON affiliate_crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_crm_leads_next_follow_up ON affiliate_crm_leads(next_follow_up);

CREATE POLICY "Affiliates can view own CRM leads"
  ON affiliate_crm_leads
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can insert own CRM leads"
  ON affiliate_crm_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can update own CRM leads"
  ON affiliate_crm_leads
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

CREATE POLICY "Affiliates can delete own CRM leads"
  ON affiliate_crm_leads
  FOR DELETE
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_affiliate_crm_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_affiliate_crm_leads_updated_at
  BEFORE UPDATE ON affiliate_crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_crm_leads_updated_at();
