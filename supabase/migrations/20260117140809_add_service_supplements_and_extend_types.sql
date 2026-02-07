/*
  # Add service supplements and extend service types

  1. Service Types Extension
    - Extend service_type constraint to allow more types:
      - prestation
      - formation
      - digital_sale (vente digitale)
      - commission
      - other (autre)

  2. New Tables
    - `service_supplements`: Suppléments for services
      - id (uuid, primary key)
      - service_id (uuid, foreign key)
      - name (text) - Nom du supplément
      - duration_minutes (integer) - Durée additionnelle en minutes
      - price (decimal) - Prix du supplément
      - created_at (timestamptz)

    - `revenue_supplements`: Link between revenues and supplements used
      - id (uuid, primary key)
      - revenue_id (uuid, foreign key)
      - supplement_id (uuid, foreign key)
      - quantity (integer) - Nombre de fois appliqué
      - price_at_time (decimal) - Prix au moment de la transaction
      - created_at (timestamptz)

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users to manage their own data
*/

-- Drop existing check constraint on service_type
ALTER TABLE services
DROP CONSTRAINT IF EXISTS services_service_type_check;

-- Add new check constraint with extended types
ALTER TABLE services
ADD CONSTRAINT services_service_type_check
CHECK (service_type IN ('prestation', 'formation', 'digital_sale', 'commission', 'other'));

-- Create service_supplements table
CREATE TABLE IF NOT EXISTS service_supplements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_minutes integer DEFAULT 0,
  price decimal(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create revenue_supplements table
CREATE TABLE IF NOT EXISTS revenue_supplements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_id uuid NOT NULL REFERENCES revenues(id) ON DELETE CASCADE,
  supplement_id uuid NOT NULL REFERENCES service_supplements(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  price_at_time decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_supplements ENABLE ROW LEVEL SECURITY;

-- Policies for service_supplements
CREATE POLICY "Users can view own service supplements"
  ON service_supplements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service supplements"
  ON service_supplements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service supplements"
  ON service_supplements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own service supplements"
  ON service_supplements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for revenue_supplements
CREATE POLICY "Users can view own revenue supplements"
  ON revenue_supplements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM revenues
      WHERE revenues.id = revenue_supplements.revenue_id
      AND revenues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own revenue supplements"
  ON revenue_supplements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM revenues
      WHERE revenues.id = revenue_supplements.revenue_id
      AND revenues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own revenue supplements"
  ON revenue_supplements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM revenues
      WHERE revenues.id = revenue_supplements.revenue_id
      AND revenues.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM revenues
      WHERE revenues.id = revenue_supplements.revenue_id
      AND revenues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own revenue supplements"
  ON revenue_supplements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM revenues
      WHERE revenues.id = revenue_supplements.revenue_id
      AND revenues.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_supplements_service_id
ON service_supplements(service_id);

CREATE INDEX IF NOT EXISTS idx_service_supplements_user_id
ON service_supplements(user_id);

CREATE INDEX IF NOT EXISTS idx_revenue_supplements_revenue_id
ON revenue_supplements(revenue_id);

CREATE INDEX IF NOT EXISTS idx_revenue_supplements_supplement_id
ON revenue_supplements(supplement_id);
