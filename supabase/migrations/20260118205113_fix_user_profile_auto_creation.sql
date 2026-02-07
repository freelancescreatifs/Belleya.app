/*
  # Fix User Profile Auto-Creation
  
  ## Problem
  Users receive "Database error saving new user" when signing up because
  the RLS policy prevents profile creation during the signup process.
  
  ## Solution
  Create a trigger that automatically creates user_profiles when a new
  auth user is created, similar to the existing profiles trigger.
  
  ## Changes
  1. Create function to automatically create user_profiles entry
  2. Add trigger on auth.users INSERT
  3. Set default role to 'pro' for new signups
  
  ## Security
  - Function runs with SECURITY DEFINER to bypass RLS
  - Maintains existing RLS policies for normal operations
  - Only creates profile on new user creation
*/

-- Create or replace function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user_profiles entry for new auth user
  INSERT INTO user_profiles (user_id, role, first_name, last_name)
  VALUES (
    NEW.id,
    'pro',
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Create trigger for automatic user_profiles creation on user signup
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();
