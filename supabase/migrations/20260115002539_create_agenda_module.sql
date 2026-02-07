/*
  # Module Agenda - Calendrier et Rendez-vous

  1. Nouvelles Tables
    - **events**
      - id (uuid, primary key)
      - user_id (uuid, référence auth.users)
      - type (text) - 'client' | 'personal' | 'google' | 'planity'
      - title (text) - Titre de l'événement
      - start_at (timestamptz) - Date/heure début
      - end_at (timestamptz) - Date/heure fin
      - client_id (uuid, optionnel) - Référence client
      - service_id (uuid, optionnel) - Référence service
      - location (text, optionnel) - Lieu
      - notes (text, optionnel) - Notes
      - status (text) - 'confirmed' | 'pending' | 'cancelled'
      - source_id (text, optionnel) - ID externe (Google/Planity)
      - source_data (jsonb, optionnel) - Données brutes source
      - created_at, updated_at (timestamptz)

    - **calendar_integrations**
      - id (uuid, primary key)
      - user_id (uuid, référence auth.users)
      - provider (text) - 'google' | 'planity'
      - provider_account_id (text) - ID compte externe
      - access_token_encrypted (text) - Token chiffré
      - refresh_token_encrypted (text) - Refresh token chiffré
      - token_expires_at (timestamptz) - Expiration token
      - is_active (boolean) - Actif ou non
      - sync_enabled (boolean) - Sync activée
      - last_sync_at (timestamptz) - Dernière sync
      - settings (jsonb) - Paramètres spécifiques
      - created_at, updated_at (timestamptz)

  2. Modifications Table tasks
    - Ajout de scheduled_at (timestamptz) - Date/heure planifiée
    - Ajout de duration_minutes (integer) - Durée en minutes
    - Ajout de show_in_calendar (boolean) - Afficher dans agenda

  3. Sécurité
    - RLS activé sur toutes les tables
    - Policies restrictives par utilisateur
    - Tokens chiffrés (note: chiffrement applicatif recommandé)
*/

-- Table: events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('client', 'personal', 'google', 'planity')),
  title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  location text,
  notes text,
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  source_id text,
  source_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_at > start_at)
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour améliorer les performances des requêtes de calendrier
CREATE INDEX IF NOT EXISTS idx_events_user_start ON events(user_id, start_at);
CREATE INDEX IF NOT EXISTS idx_events_user_type ON events(user_id, type);
CREATE INDEX IF NOT EXISTS idx_events_date_range ON events(start_at, end_at);

-- Table: calendar_integrations
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('google', 'planity')),
  provider_account_id text NOT NULL,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  is_active boolean DEFAULT true,
  sync_enabled boolean DEFAULT true,
  last_sync_at timestamptz,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider, provider_account_id)
);

ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar integrations"
  ON calendar_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar integrations"
  ON calendar_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar integrations"
  ON calendar_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar integrations"
  ON calendar_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Modifications de la table tasks (si elle n'a pas déjà ces colonnes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN scheduled_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE tasks ADD COLUMN duration_minutes integer DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'show_in_calendar'
  ) THEN
    ALTER TABLE tasks ADD COLUMN show_in_calendar boolean DEFAULT true;
  END IF;
END $$;

-- Index pour les tâches planifiées
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(user_id, scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_integrations_updated_at ON calendar_integrations;
CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
