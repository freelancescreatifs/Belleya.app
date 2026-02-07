/*
  # Enhance Notifications System

  ## Overview
  Add missing columns and features to the existing notifications table

  ## Changes
  1. Add company_id column
  2. Add entity_type and entity_id columns (replacing booking_id)
  3. Add is_acted column
  4. Create indexes for performance
  5. Update RLS policies if needed
*/

-- Add company_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add entity_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN entity_type text;
  END IF;
END $$;

-- Add entity_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN entity_id uuid;
  END IF;
END $$;

-- Add is_acted column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'is_acted'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_acted boolean DEFAULT false;
  END IF;
END $$;

-- Migrate booking_id to entity_type/entity_id
UPDATE notifications
SET 
  entity_type = 'events',
  entity_id = booking_id
WHERE booking_id IS NOT NULL AND entity_id IS NULL;

-- Update company_id from user_profiles
UPDATE notifications n
SET company_id = up.company_id
FROM user_profiles up
WHERE n.user_id = up.id AND n.company_id IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);

-- Drop the constraint if it exists to avoid errors
DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS valid_notification_type;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
