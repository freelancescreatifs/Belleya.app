/*
  # Add booking slug to company profiles

  1. Changes
    - Add `booking_slug` column to `company_profiles` table
      - Type: text
      - Unique constraint to ensure no duplicate URLs
      - Automatically generated from company_name
    
  2. Security
    - No RLS changes needed (inherits from existing table)
    
  3. Notes
    - This enables clean, professional booking URLs like: https://belleya.app/book/studio-nails-paris
    - The slug is SEO-friendly (lowercase, no accents, hyphens instead of spaces)
*/

-- Add booking_slug column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'booking_slug'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN booking_slug text UNIQUE;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_profiles_booking_slug ON company_profiles(booking_slug);

-- Create function to generate slug from company name
CREATE OR REPLACE FUNCTION generate_booking_slug(company_name_param text, user_id_param uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Convert company name to slug format
  base_slug := lower(trim(company_name_param));
  base_slug := regexp_replace(base_slug, '[àáâãäå]', 'a', 'g');
  base_slug := regexp_replace(base_slug, '[èéêë]', 'e', 'g');
  base_slug := regexp_replace(base_slug, '[ìíîï]', 'i', 'g');
  base_slug := regexp_replace(base_slug, '[òóôõö]', 'o', 'g');
  base_slug := regexp_replace(base_slug, '[ùúûü]', 'u', 'g');
  base_slug := regexp_replace(base_slug, '[ç]', 'c', 'g');
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- If empty after cleaning, use default
  IF base_slug = '' THEN
    base_slug := 'salon';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (
    SELECT 1 FROM company_profiles 
    WHERE booking_slug = final_slug 
    AND (user_id_param IS NULL OR user_id != user_id_param)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Generate slugs for existing records
UPDATE company_profiles
SET booking_slug = generate_booking_slug(company_name, user_id)
WHERE booking_slug IS NULL AND company_name IS NOT NULL AND company_name != '';
