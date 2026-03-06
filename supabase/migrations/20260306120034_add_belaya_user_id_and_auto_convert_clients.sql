/*
  # Add belaya_user_id to clients + auto-conversion on signup

  1. Schema Changes
    - Add `belaya_user_id` column to `clients` table (nullable uuid, references auth.users)
    - This links a provider-added client record to a registered Belaya user account

  2. Auto-linking
    - Backfill existing matches: when a client email matches a registered user with role='client'
    - Create trigger on user_profiles INSERT: when a new client signs up, find matching clients records by email and set belaya_user_id

  3. Security
    - No RLS changes needed, column is managed by triggers/admin only
*/

-- 1. Add belaya_user_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'belaya_user_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN belaya_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Backfill existing matches
UPDATE clients c
SET belaya_user_id = au.id
FROM auth.users au
INNER JOIN user_profiles up ON up.user_id = au.id
WHERE up.role = 'client'
  AND c.email IS NOT NULL
  AND LOWER(TRIM(c.email)) = LOWER(TRIM(au.email))
  AND c.belaya_user_id IS NULL;

-- 3. Create function to auto-link clients on signup
CREATE OR REPLACE FUNCTION auto_link_client_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
BEGIN
  IF NEW.role != 'client' THEN
    RETURN NEW;
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  IF v_user_email IS NOT NULL THEN
    UPDATE clients
    SET belaya_user_id = NEW.user_id,
        updated_at = now()
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_user_email))
      AND belaya_user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Create trigger
DROP TRIGGER IF EXISTS trg_auto_link_client_on_signup ON user_profiles;
CREATE TRIGGER trg_auto_link_client_on_signup
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_client_on_signup();

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_clients_belaya_user_id ON clients(belaya_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email_lower ON clients(LOWER(email));
