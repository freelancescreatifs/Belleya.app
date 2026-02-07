/*
  # Create Marketing & Relances Module
  
  ## Tables Created
  
  1. marketing_templates
     - id (uuid, primary key)
     - user_id (uuid, references user_profiles)
     - name (text) - Nom du template
     - type (text) - 'sms' ou 'email'
     - category (text) - Type de relance: 'gentle', 'standard', 'strong', 'birthday', 'loyalty', 'inactive'
     - subject (text, nullable) - Pour emails uniquement
     - content (text) - Contenu du message avec variables {{prenom}}, {{offre}}, {{date}}
     - discount_percentage (integer, nullable) - % de remise proposée
     - is_default (boolean) - Template par défaut système
     - is_active (boolean) - Template actif
     - created_at (timestamptz)
     - updated_at (timestamptz)
  
  2. marketing_campaigns
     - id (uuid, primary key)
     - user_id (uuid, references user_profiles)
     - name (text) - Nom de la campagne
     - template_id (uuid, references marketing_templates)
     - target_type (text) - Type de ciblage: 'frequency', 'birthday', 'loyalty', 'inactive'
     - status (text) - 'draft', 'sent', 'scheduled'
     - scheduled_date (timestamptz, nullable)
     - sent_date (timestamptz, nullable)
     - client_count (integer) - Nombre de clientes ciblées
     - created_at (timestamptz)
     - updated_at (timestamptz)
  
  3. marketing_sends
     - id (uuid, primary key)
     - user_id (uuid, references user_profiles)
     - campaign_id (uuid, references marketing_campaigns, nullable)
     - template_id (uuid, references marketing_templates)
     - client_id (uuid, references clients)
     - channel (text) - 'sms' ou 'email'
     - subject (text, nullable)
     - content (text) - Message personnalisé envoyé
     - status (text) - 'pending', 'sent', 'delivered', 'failed', 'clicked'
     - sent_at (timestamptz, nullable)
     - delivered_at (timestamptz, nullable)
     - clicked_at (timestamptz, nullable)
     - error_message (text, nullable)
     - created_at (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users to manage their own data
*/

-- ============================================================================
-- 1. Create marketing_templates table
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketing_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('sms', 'email')),
  category text NOT NULL CHECK (category IN ('gentle', 'standard', 'strong', 'birthday', 'loyalty', 'inactive')),
  subject text,
  content text NOT NULL,
  discount_percentage integer CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON marketing_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can insert own templates"
  ON marketing_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON marketing_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON marketing_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. Create marketing_campaigns table
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  template_id uuid REFERENCES marketing_templates(id) ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN ('frequency', 'birthday', 'loyalty', 'inactive')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'scheduled')),
  scheduled_date timestamptz,
  sent_date timestamptz,
  client_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON marketing_campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns"
  ON marketing_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON marketing_campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON marketing_campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Create marketing_sends table
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketing_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  template_id uuid REFERENCES marketing_templates(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('sms', 'email')),
  subject text,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'clicked')),
  sent_at timestamptz,
  delivered_at timestamptz,
  clicked_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sends"
  ON marketing_sends FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sends"
  ON marketing_sends FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sends"
  ON marketing_sends FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sends"
  ON marketing_sends FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_marketing_templates_user_id ON marketing_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_templates_category ON marketing_templates(category);
CREATE INDEX IF NOT EXISTS idx_marketing_templates_is_default ON marketing_templates(is_default);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_user_id ON marketing_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_marketing_sends_user_id ON marketing_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_sends_client_id ON marketing_sends(client_id);
CREATE INDEX IF NOT EXISTS idx_marketing_sends_campaign_id ON marketing_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_sends_status ON marketing_sends(status);

-- ============================================================================
-- 5. Insert default templates
-- ============================================================================

INSERT INTO marketing_templates (user_id, name, type, category, content, discount_percentage, is_default, is_active)
VALUES
  -- SMS Templates
  (NULL, 'Relance Douce SMS', 'sms', 'gentle', 'Coucou {{prenom}} ✨ Ça fait un moment qu''on ne s''est pas vues, si tu veux je te garde une place cette semaine 💅', 0, true, true),
  (NULL, 'Relance Standard SMS', 'sms', 'standard', 'Hello {{prenom}} 🌸 Ta dernière pose date un peu, dis-moi si tu veux que je te réserve un créneau 😊', 10, true, true),
  (NULL, 'Relance Forte SMS', 'sms', 'strong', 'Hey {{prenom}} 💖 J''ai des dispos cette semaine, si tu veux refaire ta pose avant que le planning soit complet ✨', 15, true, true),
  (NULL, 'Anniversaire SMS', 'sms', 'birthday', 'Joyeux anniversaire {{prenom}} 🎂 Pour fêter ça, je t''offre {{offre}} valable jusqu''au {{date}} 🎁', 20, true, true),
  (NULL, 'Cliente Fidèle SMS', 'sms', 'loyalty', 'Hello {{prenom}} 💖 Tu es une cliente en or ! Pour te remercier, profite de {{offre}} sur ton prochain RDV ✨', 15, true, true),
  (NULL, 'Cliente Inactive SMS', 'sms', 'inactive', 'Coucou {{prenom}} 🌸 Ça fait longtemps ! J''ai gardé ta place au chaud, dispo cette semaine si ça te dit 💅', 15, true, true),
  
  -- Email Templates
  (NULL, 'Relance Douce Email', 'email', 'gentle', 
   E'Coucou {{prenom}},\n\nJ''espère que tu vas bien ! 🌸\n\nJe me suis dit que ça faisait un moment qu''on ne s''était pas vues, et j''ai quelques créneaux de libres cette semaine.\n\nSi tu veux prendre rendez-vous, n''hésite pas à me faire signe !\n\nÀ très vite 💖', 
   0, true, true),
  
  (NULL, 'Anniversaire Email', 'email', 'birthday',
   E'Joyeux anniversaire {{prenom}} ! 🎂\n\nPour ton anniversaire, j''avais envie de te faire plaisir 🎁\n\nJe t''offre {{offre}} valable jusqu''au {{date}}.\n\nProfites-en pour prendre soin de toi ✨\n\nÀ très vite 💖',
   20, true, true);

-- Définir les subjects pour les emails
UPDATE marketing_templates 
SET subject = '✨ On se voit bientôt ?'
WHERE name = 'Relance Douce Email';

UPDATE marketing_templates 
SET subject = '🎂 Une petite surprise pour ton anniversaire'
WHERE name = 'Anniversaire Email';
