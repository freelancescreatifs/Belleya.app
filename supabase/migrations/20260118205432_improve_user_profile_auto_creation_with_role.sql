/*
  # Improve User Profile Auto-Creation with Role
  
  ## Problem
  The current trigger creates profiles with a hardcoded 'pro' role,
  then relies on a separate UPDATE to set the correct role, which
  can fail due to timing or RLS issues.
  
  ## Solution
  Update the trigger to read the role from user metadata, so the
  correct role is set immediately when the profile is created.
  
  ## Changes
  1. Update trigger function to read role from raw_user_meta_data
  2. Default to 'pro' if no role is specified
  
  ## Security
  - Function runs with SECURITY DEFINER to bypass RLS
  - Maintains existing RLS policies
*/

-- Update function to handle new user profile creation with role from metadata
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, role, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'pro'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = COALESCE(EXCLUDED.role, user_profiles.role),
    first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
