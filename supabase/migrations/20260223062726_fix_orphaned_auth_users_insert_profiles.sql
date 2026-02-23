/*
  # Fix orphaned auth users - insert missing user_profiles rows

  1. Data Fix
    - Insert user_profiles rows for auth.users that have no matching user_profiles entry
    - Pulls first_name, last_name, role from auth.users raw_user_meta_data
    - Covers karamwise@gmail.com, karmballdi@gmail.com and other orphaned users
    - user_profiles has no email column; email comes from auth.users via join
*/

INSERT INTO public.user_profiles (user_id, role, first_name, last_name, created_at)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'role', 'pro'),
  COALESCE(
    au.raw_user_meta_data->>'first_name',
    NULLIF(SPLIT_PART(COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''), ' ', 1), '')
  ),
  COALESCE(
    au.raw_user_meta_data->>'last_name',
    CASE
      WHEN POSITION(' ' IN COALESCE(au.raw_user_meta_data->>'full_name', '')) > 0
        THEN SUBSTRING(au.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN au.raw_user_meta_data->>'full_name') + 1)
      WHEN POSITION(' ' IN COALESCE(au.raw_user_meta_data->>'name', '')) > 0
        THEN SUBSTRING(au.raw_user_meta_data->>'name' FROM POSITION(' ' IN au.raw_user_meta_data->>'name') + 1)
      ELSE NULL
    END
  ),
  au.created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.user_id = au.id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
