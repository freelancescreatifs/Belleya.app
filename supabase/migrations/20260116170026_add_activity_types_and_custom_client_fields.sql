/*
  # Ajout des types d'activité multiples et champs clients personnalisables

  ## Modifications

  1. **company_profiles**
    - Ajout de `activity_types` (text[]) pour permettre plusieurs types d'activité
    - Migration des données existantes de activity_type vers activity_types

  2. **Nouvelle table: custom_client_fields**
    - `id` (uuid, primary key)
    - `user_id` (uuid, référence à auth.users)
    - `company_id` (uuid, référence à company_profiles)
    - `field_name` (text) - nom du champ (ex: "Type de peau")
    - `field_type` (text) - type de champ (text, select, number, date)
    - `field_options` (text[]) - options pour les selects
    - `is_required` (boolean) - champ obligatoire ou non
    - `display_order` (integer) - ordre d'affichage
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  3. **Nouvelle table: client_custom_data**
    - `id` (uuid, primary key)
    - `client_id` (uuid, référence à clients)
    - `field_id` (uuid, référence à custom_client_fields)
    - `field_value` (text) - valeur du champ
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  ## Sécurité
    - RLS activé sur toutes les tables
    - Les utilisateurs peuvent uniquement gérer leurs propres champs personnalisés
*/

-- Ajouter activity_types à company_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'activity_types'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN activity_types text[] DEFAULT '{}';
    
    -- Migrer les données existantes
    UPDATE company_profiles 
    SET activity_types = ARRAY[activity_type]
    WHERE activity_type IS NOT NULL AND activity_type != '';
  END IF;
END $$;

-- Table pour les champs personnalisés
CREATE TABLE IF NOT EXISTS custom_client_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  field_options text[] DEFAULT '{}',
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE custom_client_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own custom fields"
  ON custom_client_fields FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom fields"
  ON custom_client_fields FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom fields"
  ON custom_client_fields FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom fields"
  ON custom_client_fields FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table pour stocker les valeurs des champs personnalisés
CREATE TABLE IF NOT EXISTS client_custom_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  field_id uuid REFERENCES custom_client_fields(id) ON DELETE CASCADE NOT NULL,
  field_value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, field_id)
);

ALTER TABLE client_custom_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read client custom data for their clients"
  ON client_custom_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_custom_data.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert client custom data for their clients"
  ON client_custom_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_custom_data.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update client custom data for their clients"
  ON client_custom_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_custom_data.client_id
      AND clients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_custom_data.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete client custom data for their clients"
  ON client_custom_data FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_custom_data.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_custom_client_fields_user_id ON custom_client_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_client_fields_company_id ON custom_client_fields(company_id);
CREATE INDEX IF NOT EXISTS idx_client_custom_data_client_id ON client_custom_data(client_id);
CREATE INDEX IF NOT EXISTS idx_client_custom_data_field_id ON client_custom_data(field_id);
