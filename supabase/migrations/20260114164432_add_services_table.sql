/*
  # Create Services (Prestations) Table

  1. New Tables
    - `services`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, required) - Nom de la prestation
      - `description` (text, optional) - Description détaillée
      - `category` (text, required) - Catégorie (ongles, cils, soins, etc.)
      - `duration` (integer, required) - Durée en minutes
      - `price` (decimal, required) - Prix en euros
      - `status` (text, default 'active') - Statut: active ou inactive
      - `recommended_frequency` (integer, optional) - Fréquence recommandée en jours
      - `has_vat` (boolean, default false) - Application de la TVA
      - `photo_url` (text, optional) - URL de la photo/visuel
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `services` table
    - Add policy for users to read their own services
    - Add policy for users to insert their own services
    - Add policy for users to update their own services
    - Add policy for users to delete their own services

  3. Indexes
    - Index on user_id for faster queries
    - Index on category for filtering
    - Index on status for filtering active/inactive services
*/

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  duration integer NOT NULL,
  price decimal(10, 2) NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  recommended_frequency integer,
  has_vat boolean DEFAULT false NOT NULL,
  photo_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own services"
  ON services FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services"
  ON services FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own services"
  ON services FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);