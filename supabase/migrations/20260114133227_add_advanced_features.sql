/*
  # Add Advanced Features for BelleYa

  ## Overview
  This migration adds tables and enhancements to support advanced features:
  - Collaborators management
  - Advanced tasks with recurring tasks
  - Prestations (services) management
  - Loyalty system
  - Appointments tracking
  - Email marketing and reminders

  ## New Tables

  ### 1. collaborators
  Team members who can be assigned tasks
  - id (uuid)
  - user_id (uuid) - salon owner
  - name (text)
  - email (text)
  - role (text)
  - active (boolean)

  ### 2. prestations
  Services offered by the salon
  - id (uuid)
  - user_id (uuid)
  - name (text)
  - description (text)
  - duration_minutes (integer)
  - price (numeric)
  - refill_interval_days (integer) - recommended interval for refill
  - category (text)

  ### 3. client_loyalty
  Track client loyalty and rewards
  - id (uuid)
  - user_id (uuid)
  - client_id (uuid)
  - points (integer)
  - total_visits (integer)
  - last_visit_date (date)
  - next_appointment_date (date)
  - cancelled_count (integer)

  ### 4. appointments
  Client appointments tracking
  - id (uuid)
  - user_id (uuid)
  - client_id (uuid)
  - prestation_id (uuid)
  - scheduled_date (timestamptz)
  - status (text) - scheduled/completed/cancelled/no_show
  - notes (text)
  - reminder_sent (boolean)

  ### 5. email_templates
  Marketing email templates
  - id (uuid)
  - user_id (uuid)
  - name (text)
  - subject (text)
  - content (text)
  - template_type (text) - reminder/refill/repose/marketing
  - active (boolean)

  ### 6. hygiene_protocols
  Hygiene protocols per prestation
  - id (uuid)
  - user_id (uuid)
  - prestation_id (uuid)
  - protocol_name (text)
  - before_checklist (jsonb)
  - after_checklist (jsonb)
  - alerts (jsonb)

  ## Updates to Existing Tables

  ### tasks table
  Add new columns for advanced features
  - collaborator_id (uuid)
  - urgency (text) - very_urgent/urgent/medium/low
  - is_recurring (boolean)
  - recurrence_pattern (text) - daily/weekly/monthly
  - status (text) - todo/in_progress/on_hold/completed
  - overdue (boolean)

  ### content_ideas table
  Add new columns for advanced content management
  - content_type (text) - video/carousel/post/story
  - pillar (text) - editorial pillar
  - caption (text)
  - cover_url (text)
  - scheduled_datetime (timestamptz)

  ### inspiration table
  Add category field for better organization
  - category (text) - nails/hair/lashes/makeup/other

  ### goals table
  Add parent_goal_id for sub-goals
  - parent_goal_id (uuid)
  - progress_percentage (numeric)
  - has_deadline (boolean)

  ## Security
  - RLS enabled on all new tables
  - Policies ensure users can only access their own data
*/

-- Collaborators table
CREATE TABLE IF NOT EXISTS collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  role text DEFAULT 'collaborator',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collaborators"
  ON collaborators FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collaborators"
  ON collaborators FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collaborators"
  ON collaborators FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collaborators"
  ON collaborators FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Prestations table
CREATE TABLE IF NOT EXISTS prestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  duration_minutes integer DEFAULT 60,
  price numeric DEFAULT 0,
  refill_interval_days integer DEFAULT 21,
  category text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prestations"
  ON prestations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prestations"
  ON prestations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prestations"
  ON prestations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prestations"
  ON prestations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Client loyalty table
CREATE TABLE IF NOT EXISTS client_loyalty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  points integer DEFAULT 0,
  total_visits integer DEFAULT 0,
  last_visit_date date,
  next_appointment_date date,
  cancelled_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, client_id)
);

ALTER TABLE client_loyalty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own client loyalty"
  ON client_loyalty FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client loyalty"
  ON client_loyalty FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client loyalty"
  ON client_loyalty FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own client loyalty"
  ON client_loyalty FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  prestation_id uuid REFERENCES prestations(id) ON DELETE SET NULL,
  scheduled_date timestamptz NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text,
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  template_type text CHECK (template_type IN ('reminder', 'refill', 'repose', 'marketing', 'custom')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email templates"
  ON email_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Hygiene protocols table
CREATE TABLE IF NOT EXISTS hygiene_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prestation_id uuid REFERENCES prestations(id) ON DELETE CASCADE,
  protocol_name text NOT NULL,
  before_checklist jsonb DEFAULT '[]'::jsonb,
  after_checklist jsonb DEFAULT '[]'::jsonb,
  alerts jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hygiene_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hygiene protocols"
  ON hygiene_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hygiene protocols"
  ON hygiene_protocols FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hygiene protocols"
  ON hygiene_protocols FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hygiene protocols"
  ON hygiene_protocols FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add columns to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'collaborator_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN collaborator_id uuid REFERENCES collaborators(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'urgency'
  ) THEN
    ALTER TABLE tasks ADD COLUMN urgency text DEFAULT 'medium' CHECK (urgency IN ('very_urgent', 'urgent', 'medium', 'low'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE tasks ADD COLUMN is_recurring boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'recurrence_pattern'
  ) THEN
    ALTER TABLE tasks ADD COLUMN recurrence_pattern text CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'status'
  ) THEN
    ALTER TABLE tasks ADD COLUMN status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'on_hold', 'completed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'overdue'
  ) THEN
    ALTER TABLE tasks ADD COLUMN overdue boolean DEFAULT false;
  END IF;
END $$;

-- Add columns to content_ideas table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN content_type text CHECK (content_type IN ('video', 'carousel', 'post', 'story'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'pillar'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN pillar text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'caption'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN caption text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN cover_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_ideas' AND column_name = 'scheduled_datetime'
  ) THEN
    ALTER TABLE content_ideas ADD COLUMN scheduled_datetime timestamptz;
  END IF;
END $$;

-- Add columns to inspiration table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspiration' AND column_name = 'category'
  ) THEN
    ALTER TABLE inspiration ADD COLUMN category text DEFAULT 'nails' CHECK (category IN ('nails', 'hair', 'lashes', 'makeup', 'other'));
  END IF;
END $$;

-- Add columns to goals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'parent_goal_id'
  ) THEN
    ALTER TABLE goals ADD COLUMN parent_goal_id uuid REFERENCES goals(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'progress_percentage'
  ) THEN
    ALTER TABLE goals ADD COLUMN progress_percentage numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'has_deadline'
  ) THEN
    ALTER TABLE goals ADD COLUMN has_deadline boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_prestations_user_id ON prestations(user_id);
CREATE INDEX IF NOT EXISTS idx_client_loyalty_user_id ON client_loyalty(user_id);
CREATE INDEX IF NOT EXISTS idx_client_loyalty_client_id ON client_loyalty(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_protocols_user_id ON hygiene_protocols(user_id);
CREATE INDEX IF NOT EXISTS idx_hygiene_protocols_prestation_id ON hygiene_protocols(prestation_id);