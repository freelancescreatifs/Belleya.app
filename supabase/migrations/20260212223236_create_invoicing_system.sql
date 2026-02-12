/*
  # Create Invoicing System for Provider Receipts

  1. New Tables
    - `invoices` (client_receipts)
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key to user_profiles)
      - `client_id` (uuid, foreign key to clients)
      - `appointment_id` (uuid, nullable, foreign key to events)
      - `title` (text)
      - `notes` (text, nullable)
      - `subtotal` (numeric)
      - `discount_total` (numeric, default 0)
      - `total` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `invoice_items`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key to invoices)
      - `service_id` (uuid, nullable, foreign key to services)
      - `label` (text, service name snapshot)
      - `price` (numeric)
      - `quantity` (int, default 1)
      - `duration_minutes` (int, nullable)
      - `discount` (numeric, default 0)
      - `line_total` (numeric, computed: price * quantity - discount)
      - `created_at` (timestamptz)

    - `invoice_sends`
      - `id` (uuid, primary key)
      - `invoice_id` (uuid, foreign key to invoices)
      - `provider_id` (uuid, foreign key to user_profiles)
      - `client_id` (uuid, foreign key to clients)
      - `channel` (enum: 'email', 'sms')
      - `payload` (jsonb, message sent)
      - `status` (enum: 'sent', 'failed')
      - `error_message` (text, nullable)
      - `sent_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Providers can manage their own invoices
    - Clients can view their own invoices (read-only)

  3. Indexes
    - Performance indexes on foreign keys and lookup columns
*/

-- Create channel enum
DO $$ BEGIN
  CREATE TYPE invoice_channel AS ENUM ('email', 'sms');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create status enum
DO $$ BEGIN
  CREATE TYPE invoice_send_status AS ENUM ('sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES events(id) ON DELETE SET NULL,
  title text NOT NULL,
  notes text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_total numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  label text NOT NULL,
  price numeric(10,2) NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  duration_minutes int,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  line_total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create invoice_sends table
CREATE TABLE IF NOT EXISTS invoice_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel invoice_channel NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status invoice_send_status NOT NULL DEFAULT 'sent',
  error_message text,
  sent_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_provider_id ON invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_appointment_id ON invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_service_id ON invoice_items(service_id);

CREATE INDEX IF NOT EXISTS idx_invoice_sends_invoice_id ON invoice_sends(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_sends_provider_id ON invoice_sends(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoice_sends_client_id ON invoice_sends(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_sends_sent_at ON invoice_sends(sent_at DESC);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
-- Providers can manage their own invoices
CREATE POLICY "Providers can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

CREATE POLICY "Providers can create own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (provider_id = auth.uid());

-- Clients can view their own invoices
CREATE POLICY "Clients can view their invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for invoice_items
-- Providers can manage items of their own invoices
CREATE POLICY "Providers can view own invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE provider_id = auth.uid()
    )
  );

CREATE POLICY "Providers can create own invoice items"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE provider_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update own invoice items"
  ON invoice_items FOR UPDATE
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE provider_id = auth.uid()
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE provider_id = auth.uid()
    )
  );

CREATE POLICY "Providers can delete own invoice items"
  ON invoice_items FOR DELETE
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE provider_id = auth.uid()
    )
  );

-- Clients can view items of their own invoices
CREATE POLICY "Clients can view their invoice items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE client_id IN (
        SELECT id FROM clients WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for invoice_sends
-- Providers can manage their own sends
CREATE POLICY "Providers can view own invoice sends"
  ON invoice_sends FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

CREATE POLICY "Providers can create own invoice sends"
  ON invoice_sends FOR INSERT
  TO authenticated
  WITH CHECK (provider_id = auth.uid());

-- Clients can view sends for their invoices
CREATE POLICY "Clients can view their invoice sends"
  ON invoice_sends FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Function to auto-update invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET
    subtotal = (
      SELECT COALESCE(SUM(line_total), 0)
      FROM invoice_items
      WHERE invoice_id = NEW.invoice_id
    ),
    total = (
      SELECT COALESCE(SUM(line_total), 0) - COALESCE(discount_total, 0)
      FROM invoice_items
      WHERE invoice_id = NEW.invoice_id
    ),
    updated_at = now()
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update invoice totals when items change
DROP TRIGGER IF EXISTS trigger_calculate_invoice_totals ON invoice_items;
CREATE TRIGGER trigger_calculate_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_totals();

-- Function to calculate line total
CREATE OR REPLACE FUNCTION calculate_line_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.line_total := (NEW.price * NEW.quantity) - COALESCE(NEW.discount, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate line total before insert/update
DROP TRIGGER IF EXISTS trigger_calculate_line_total ON invoice_items;
CREATE TRIGGER trigger_calculate_line_total
  BEFORE INSERT OR UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_line_total();
