/*
  # Add unique constraint on calendar_integrations (user_id, provider)

  1. Changes
    - Adds a unique constraint on `calendar_integrations` for `(user_id, provider)` to support upsert operations
    - This ensures each user can only have one integration per provider (e.g., one Google Calendar connection)

  2. Important Notes
    - Uses IF NOT EXISTS to prevent errors if constraint already exists
    - No data is modified or deleted
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'calendar_integrations_user_provider_unique'
  ) THEN
    ALTER TABLE calendar_integrations
    ADD CONSTRAINT calendar_integrations_user_provider_unique
    UNIQUE (user_id, provider);
  END IF;
END $$;
