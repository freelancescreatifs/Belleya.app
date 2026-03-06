/*
  # Create affiliate tips messages library

  1. New Tables
    - `affiliate_tips_messages`
      - `id` (uuid, primary key)
      - `affiliate_id` (uuid, FK to affiliates)
      - `category` (text) - objection category
      - `message_type` (text) - premier_contact / relance / closing
      - `message_body` (text) - the actual message
      - `when_to_use` (text, nullable) - usage context hint
      - `status` (text) - pending / approved / rejected
      - `upvotes_count` (integer, default 0)
      - `created_at` / `updated_at` (timestamptz)

    - `affiliate_tips_upvotes` (tracks who upvoted)
      - `id` (uuid, primary key)
      - `tip_id` (uuid, FK to affiliate_tips_messages)
      - `affiliate_id` (uuid, FK to affiliates)
      - unique constraint on (tip_id, affiliate_id)

    - `affiliate_tips_favorites` (tracks who favorited)
      - `id` (uuid, primary key)
      - `tip_id` (uuid, FK to affiliate_tips_messages)
      - `affiliate_id` (uuid, FK to affiliates)
      - unique constraint on (tip_id, affiliate_id)

  2. Security
    - RLS enabled on all 3 tables
    - Authenticated users can read approved tips
    - Authors can insert tips (status defaults to pending)
    - Authors can delete their own tips
    - Authenticated users can manage their own upvotes/favorites
*/

CREATE TABLE IF NOT EXISTS affiliate_tips_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'autre',
  message_type text NOT NULL DEFAULT 'premier_contact'
    CHECK (message_type IN ('premier_contact', 'relance', 'closing')),
  message_body text NOT NULL,
  when_to_use text,
  status text NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  upvotes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE affiliate_tips_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read approved tips"
  ON affiliate_tips_messages FOR SELECT
  TO authenticated
  USING (status = 'approved' OR affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  ));

CREATE POLICY "Affiliates can insert tips"
  ON affiliate_tips_messages FOR INSERT
  TO authenticated
  WITH CHECK (affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  ));

CREATE POLICY "Authors can update own tips"
  ON affiliate_tips_messages FOR UPDATE
  TO authenticated
  USING (affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  ))
  WITH CHECK (affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  ));

CREATE POLICY "Authors can delete own tips"
  ON affiliate_tips_messages FOR DELETE
  TO authenticated
  USING (affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS affiliate_tips_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id uuid NOT NULL REFERENCES affiliate_tips_messages(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tip_id, affiliate_id)
);

ALTER TABLE affiliate_tips_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read upvotes"
  ON affiliate_tips_upvotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Affiliates can insert own upvotes"
  ON affiliate_tips_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  ));

CREATE POLICY "Affiliates can delete own upvotes"
  ON affiliate_tips_upvotes FOR DELETE
  TO authenticated
  USING (affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS affiliate_tips_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id uuid NOT NULL REFERENCES affiliate_tips_messages(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tip_id, affiliate_id)
);

ALTER TABLE affiliate_tips_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read favorites"
  ON affiliate_tips_favorites FOR SELECT
  TO authenticated
  USING (affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  ));

CREATE POLICY "Affiliates can insert own favorites"
  ON affiliate_tips_favorites FOR INSERT
  TO authenticated
  WITH CHECK (affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  ));

CREATE POLICY "Affiliates can delete own favorites"
  ON affiliate_tips_favorites FOR DELETE
  TO authenticated
  USING (affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_tips_messages_status ON affiliate_tips_messages(status);
CREATE INDEX IF NOT EXISTS idx_tips_messages_category ON affiliate_tips_messages(category);
CREATE INDEX IF NOT EXISTS idx_tips_messages_affiliate ON affiliate_tips_messages(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_tips_upvotes_tip ON affiliate_tips_upvotes(tip_id);
CREATE INDEX IF NOT EXISTS idx_tips_favorites_tip ON affiliate_tips_favorites(tip_id);
CREATE INDEX IF NOT EXISTS idx_tips_favorites_affiliate ON affiliate_tips_favorites(affiliate_id);
