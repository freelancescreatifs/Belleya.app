/*
  # Add Inspiration Groups (Pinterest-like Structure)

  1. Changes
    - Create `inspiration_groups` table for organizing photos in folders/boards
    - Update `company_inspirations` to link to groups
    - Add `link_url` field for optional links
    - Add `group_order` for custom sorting
    - Remove unused `client_id` field

  2. Structure
    - Groups act like Pinterest boards
    - Each group belongs to one of 3 categories: social_media, salon, service
    - Photos are organized within groups
    - Groups can be reordered

  3. Security
    - Enable RLS on inspiration_groups
    - Add policies for authenticated users to manage their groups
*/

-- Create inspiration_groups table
CREATE TABLE IF NOT EXISTS inspiration_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('social_media', 'salon', 'service')),
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inspiration_groups_company_id ON inspiration_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_groups_category ON inspiration_groups(category);
CREATE INDEX IF NOT EXISTS idx_inspiration_groups_order ON inspiration_groups(company_id, display_order);

-- Enable RLS
ALTER TABLE inspiration_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company inspiration groups"
  ON inspiration_groups FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert inspiration groups for their company"
  ON inspiration_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company inspiration groups"
  ON inspiration_groups FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company inspiration groups"
  ON inspiration_groups FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Update company_inspirations table structure
DO $$
BEGIN
  -- Add group_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_inspirations' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE company_inspirations ADD COLUMN group_id uuid REFERENCES inspiration_groups(id) ON DELETE CASCADE;
  END IF;

  -- Add link_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_inspirations' AND column_name = 'link_url'
  ) THEN
    ALTER TABLE company_inspirations ADD COLUMN link_url text;
  END IF;

  -- Add photo_order if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_inspirations' AND column_name = 'photo_order'
  ) THEN
    ALTER TABLE company_inspirations ADD COLUMN photo_order integer DEFAULT 0;
  END IF;

  -- Add updated_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_inspirations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE company_inspirations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Drop client_id if exists (not needed per specs)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_inspirations' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE company_inspirations DROP COLUMN client_id;
  END IF;
END $$;

-- Create index for group_id
CREATE INDEX IF NOT EXISTS idx_company_inspirations_group_id ON company_inspirations(group_id);
CREATE INDEX IF NOT EXISTS idx_company_inspirations_photo_order ON company_inspirations(group_id, photo_order);
