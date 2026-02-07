/*
  # Add Service Offers and Review Enhancements

  ## Overview
  Add offer functionality to services and enhance reviews with photos and categories

  ## Changes
  1. Add `special_offer` field to services table
     - `special_offer` (text) - Description of the special offer (e.g., "-20% sur babyboomer")
  
  2. Add fields to provider_reviews table
     - `photo_url` (text) - Photo attached to the review
     - `service_category` (text) - Category of service reviewed

  ## Purpose
  - Offers are attached to specific services (visible on profile and client home)
  - Reviews can include photos and specify which service category was reviewed
*/

-- Add special_offer to services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'special_offer'
  ) THEN
    ALTER TABLE services ADD COLUMN special_offer text;
  END IF;
END $$;

-- Add photo_url to provider_reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'provider_reviews' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE provider_reviews ADD COLUMN photo_url text;
  END IF;
END $$;

-- Add service_category to provider_reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'provider_reviews' AND column_name = 'service_category'
  ) THEN
    ALTER TABLE provider_reviews ADD COLUMN service_category text;
  END IF;
END $$;
