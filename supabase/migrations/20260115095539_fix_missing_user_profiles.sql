/*
  # Fix Missing User Profiles
  
  ## Description
  This migration fixes the issue where users created before the user_profiles table
  was introduced don't have entries in user_profiles, causing them to be stuck on
  the loading screen.
  
  ## Changes
  1. Create user_profiles entries for all users in profiles table who don't have one
  2. Set their role to 'pro' by default (since they were using the pro features)
  3. Migrate their name information from profiles to user_profiles
  
  ## Safety
  - Uses INSERT ... ON CONFLICT DO NOTHING to avoid duplicates
  - Only affects users who exist in profiles but not in user_profiles
*/

-- Insert missing user_profiles for existing users
INSERT INTO user_profiles (user_id, role, first_name, last_name)
SELECT 
  p.id,
  'pro' as role,
  SPLIT_PART(p.full_name, ' ', 1) as first_name,
  NULLIF(TRIM(SUBSTRING(p.full_name FROM POSITION(' ' IN p.full_name))), '') as last_name
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;
