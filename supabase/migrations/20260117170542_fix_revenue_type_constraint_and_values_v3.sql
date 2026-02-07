/*
  # Fix revenue_type constraint and normalize values (v3)

  1. Problem
    - Current constraint allows: 'service', 'formation', 'digital_sale', 'commission', 'other'
    - Some existing data has incompatible values
    - Desired values: 'prestation', 'formation', 'vente_digitale', 'commission', 'autre'

  2. Strategy
    - Drop constraints first
    - Migrate all data in both revenues and services tables
    - Create new constraints with correct values

  3. New allowed values (snake_case, stable)
    - prestation
    - formation
    - vente_digitale
    - commission
    - autre
*/

-- Step 1: Drop old constraints first (to allow data migration)
ALTER TABLE revenues
DROP CONSTRAINT IF EXISTS revenues_revenue_type_check;

ALTER TABLE services
DROP CONSTRAINT IF EXISTS services_service_type_check;

-- Step 2: Migrate revenues table data to normalized values
UPDATE revenues
SET revenue_type = 'prestation'
WHERE revenue_type = 'service';

UPDATE revenues
SET revenue_type = 'vente_digitale'
WHERE revenue_type = 'digital_sale';

UPDATE revenues
SET revenue_type = 'autre'
WHERE revenue_type = 'other';

-- Step 3: Migrate services table data to normalized values
UPDATE services
SET service_type = 'prestation'
WHERE service_type = 'service';

UPDATE services
SET service_type = 'vente_digitale'
WHERE service_type = 'digital_sale';

UPDATE services
SET service_type = 'autre'
WHERE service_type = 'other';

-- Step 4: Create new constraints with normalized values
ALTER TABLE revenues
ADD CONSTRAINT revenues_revenue_type_check
CHECK (revenue_type IN ('prestation', 'formation', 'vente_digitale', 'commission', 'autre'));

ALTER TABLE services
ADD CONSTRAINT services_service_type_check
CHECK (service_type IN ('prestation', 'formation', 'vente_digitale', 'commission', 'autre'));