/*
  # Create custom service categories table

  1. New Tables
    - `service_categories`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users) - the provider who owns this category
      - `name` (text) - category display name
      - `display_order` (integer, default 0) - ordering
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `service_categories` table
    - Providers can CRUD their own categories
    - Public can read categories (needed for public profiles)

  3. Seed data
    - Migrate existing categories from services table into service_categories
    - This ensures no data loss for existing providers

  4. Notes
    - Replaces hardcoded category lists in frontend
    - Categories are per-provider (each provider has their own set)
    - The services.category column remains as free text for backward compatibility
*/

CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_categories_user_name
  ON service_categories (user_id, name);

CREATE INDEX IF NOT EXISTS idx_service_categories_user_id
  ON service_categories (user_id);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can read own categories"
  ON service_categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert own categories"
  ON service_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can update own categories"
  ON service_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can delete own categories"
  ON service_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read categories for public profiles"
  ON service_categories FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM company_profiles cp
      WHERE cp.user_id = service_categories.user_id
      AND cp.booking_slug IS NOT NULL
    )
  );

INSERT INTO service_categories (user_id, name, display_order)
SELECT DISTINCT s.user_id, s.category, ROW_NUMBER() OVER (PARTITION BY s.user_id ORDER BY MIN(s.created_at))
FROM services s
WHERE s.category IS NOT NULL AND s.category != ''
GROUP BY s.user_id, s.category
ON CONFLICT (user_id, name) DO NOTHING;
