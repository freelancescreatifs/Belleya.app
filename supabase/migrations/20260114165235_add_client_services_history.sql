/*
  # Create Client Services History Table

  1. New Tables
    - `client_services`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `client_id` (uuid, foreign key to clients)
      - `service_id` (uuid, foreign key to services, nullable)
      - `service_name` (text) - Nom de la prestation (pour historique si service supprimé)
      - `service_category` (text) - Catégorie de la prestation
      - `price` (decimal) - Prix payé
      - `duration` (integer) - Durée en minutes
      - `performed_at` (timestamptz) - Date de la prestation
      - `notes` (text, optional) - Notes sur la prestation
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `client_services` table
    - Add policy for users to read their own client services
    - Add policy for users to insert their own client services
    - Add policy for users to update their own client services
    - Add policy for users to delete their own client services

  3. Indexes
    - Index on user_id for faster queries
    - Index on client_id for filtering by client
    - Index on service_id for filtering by service
    - Index on performed_at for date-based queries
*/

CREATE TABLE IF NOT EXISTS client_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  service_category text NOT NULL,
  price decimal(10, 2) NOT NULL,
  duration integer NOT NULL,
  performed_at timestamptz DEFAULT now() NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE client_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own client services"
  ON client_services FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client services"
  ON client_services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client services"
  ON client_services FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own client services"
  ON client_services FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_client_services_user_id ON client_services(user_id);
CREATE INDEX IF NOT EXISTS idx_client_services_client_id ON client_services(client_id);
CREATE INDEX IF NOT EXISTS idx_client_services_service_id ON client_services(service_id);
CREATE INDEX IF NOT EXISTS idx_client_services_performed_at ON client_services(performed_at);