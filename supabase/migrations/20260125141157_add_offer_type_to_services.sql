/*
  # Add offer type to services
  
  1. Changes
    - Add `offer_type` column to services table to specify if the offer is a percentage or fixed amount
    - Values: 'percentage', 'fixed', or null if no offer
  
  2. Notes
    - The existing `special_offer` text column will now store the offer value (e.g., "20" for 20% or 20€)
    - This allows services to have individual promotional offers
*/

-- Add offer_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'offer_type'
  ) THEN
    ALTER TABLE services 
    ADD COLUMN offer_type text CHECK (offer_type IN ('percentage', 'fixed'));
  END IF;
END $$;