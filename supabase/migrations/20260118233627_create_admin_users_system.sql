/*
  # Admin Users Management System

  1. New Tables
    - `users_admin`
      - `user_id` (uuid, primary key, FK to auth.users)
      - `email` (text, synced from auth.users)
      - `created_at` (timestamptz)
      - `last_sign_in_at` (timestamptz)
      - `plan` (enum: free, normal, premium, elite)
      - `status` (enum: active, suspended)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on users_admin
    - Admins can read/update all users
    - Users can read their own profile

  3. Triggers
    - Auto-sync new users from auth.users
    - Update email and last_sign_in on auth changes
    - Cascade delete when auth user is deleted

  4. Functions
    - Sync function for auth.users
*/

-- Create plan enum
DO $$ BEGIN
  CREATE TYPE user_plan AS ENUM ('free', 'normal', 'premium', 'elite');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create status enum
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create users_admin table
CREATE TABLE IF NOT EXISTS users_admin (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz,
  plan user_plan DEFAULT 'free',
  status user_status DEFAULT 'active',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users_admin ENABLE ROW LEVEL SECURITY;

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_users_admin_email ON users_admin(email);
CREATE INDEX IF NOT EXISTS idx_users_admin_plan ON users_admin(plan);
CREATE INDEX IF NOT EXISTS idx_users_admin_status ON users_admin(status);
CREATE INDEX IF NOT EXISTS idx_users_admin_created_at ON users_admin(created_at);

-- RLS Policies (using existing is_admin function from admin_roles_system)
CREATE POLICY "Admins can view all users"
  ON users_admin FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own profile"
  ON users_admin FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all users"
  ON users_admin FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can insert users"
  ON users_admin FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete users"
  ON users_admin FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Function to sync auth.users to users_admin
CREATE OR REPLACE FUNCTION sync_auth_user_to_admin()
RETURNS trigger AS $$
BEGIN
  -- On INSERT: create new entry in users_admin
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.users_admin (
      user_id,
      email,
      created_at,
      last_sign_in_at,
      plan,
      status
    )
    VALUES (
      NEW.id,
      NEW.email,
      NEW.created_at,
      NEW.last_sign_in_at,
      'free',
      'active'
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
  END IF;

  -- On UPDATE: sync email and last_sign_in_at
  IF (TG_OP = 'UPDATE') THEN
    UPDATE public.users_admin
    SET
      email = NEW.email,
      last_sign_in_at = NEW.last_sign_in_at,
      updated_at = now()
    WHERE user_id = NEW.id;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_sync_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_sync_admin
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_auth_user_to_admin();

-- Sync existing users from auth.users to users_admin
INSERT INTO users_admin (user_id, email, created_at, last_sign_in_at, plan, status)
SELECT
  id,
  email,
  created_at,
  last_sign_in_at,
  'free'::user_plan,
  'active'::user_status
FROM auth.users
ON CONFLICT (user_id) DO UPDATE
SET
  email = EXCLUDED.email,
  last_sign_in_at = EXCLUDED.last_sign_in_at;