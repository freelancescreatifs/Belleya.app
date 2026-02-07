/*
  # Add service type to services table

  ## Description
  This migration adds a service_type column to the services table to distinguish
  between regular services (prestations) and training services (formations).
  This enables proper categorization and filtering of services for different use cases.

  ## Changes
  1. Add service_type column to services table
     - Type: text with check constraint
     - Values: 'prestation' or 'formation'
     - Default: 'prestation' (for existing records)
     - Not null after backfill

  2. Backfill existing services
     - Set all existing services to 'prestation' by default

  ## New Field
  - `service_type` (text, not null) - Type of service
    - 'prestation': Regular customer service (nails, lashes, etc.)
    - 'formation': Training service for students

  ## Impact
  - Existing services remain unchanged (marked as 'prestation')
  - New services can be created as either type
  - Enables filtering services by type for student training selection

  ## Safety
  - Uses conditional checks to avoid errors if field already exists
  - Backfills existing records before setting NOT NULL constraint
  - Adds check constraint for data integrity
*/

-- Add service_type column to services table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE services
    ADD COLUMN service_type text;
  END IF;
END $$;

-- Backfill existing services with 'prestation' as default
UPDATE services
SET service_type = 'prestation'
WHERE service_type IS NULL;

-- Make service_type NOT NULL after backfill
ALTER TABLE services
ALTER COLUMN service_type SET NOT NULL;

-- Add default value for new records
ALTER TABLE services
ALTER COLUMN service_type SET DEFAULT 'prestation';

-- Add check constraint to ensure only valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'services_service_type_check'
  ) THEN
    ALTER TABLE services
    ADD CONSTRAINT services_service_type_check
    CHECK (service_type IN ('prestation', 'formation'));
  END IF;
END $$;

-- Create index for faster filtering by service type
CREATE INDEX IF NOT EXISTS idx_services_service_type
ON services(service_type);