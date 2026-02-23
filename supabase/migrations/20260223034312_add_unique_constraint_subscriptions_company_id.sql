/*
  # Add unique constraint on subscriptions.company_id

  1. Changes
    - Add UNIQUE constraint on `subscriptions.company_id` to prevent duplicate subscription rows per company
    - This is required for the admin panel's upsert logic to work correctly when changing plans

  2. Safety
    - Uses IF NOT EXISTS pattern via DO block
    - No data loss - only adds a constraint
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.subscriptions'::regclass
    AND conname = 'subscriptions_company_id_unique'
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_company_id_unique UNIQUE (company_id);
  END IF;
END $$;
