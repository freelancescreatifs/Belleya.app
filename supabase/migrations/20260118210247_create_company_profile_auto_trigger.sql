/*
  # Auto-create Company Profile on User Signup
  
  ## Problem
  - Users receive 500 error during signup because company_profiles is not auto-created
  - company_profiles has NOT NULL columns without defaults that block manual creation
  - GET request to company_profiles returns 400 because the row doesn't exist
  
  ## Solution
  Create a trigger that automatically creates a company_profiles entry when a new
  professional user is created, with sensible default values.
  
  ## Changes
  1. Create function to auto-create company_profiles for professional users
  2. Add trigger on auth.users INSERT
  3. Use SECURITY DEFINER to bypass RLS restrictions
  4. Handle all errors gracefully to never block user signup
  
  ## Security
  - Function runs with SECURITY DEFINER to bypass RLS during auto-creation
  - Only creates company_profile for users with role='pro' in metadata
  - Uses exception handling to prevent signup failures
*/

-- Create function to handle company profile auto-creation
CREATE OR REPLACE FUNCTION handle_new_company_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  -- Get role from user metadata
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'pro');
  
  -- Only create company_profile for professional users
  IF v_role = 'pro' THEN
    BEGIN
      -- Create company profile with default values
      INSERT INTO company_profiles (
        user_id,
        company_name,
        activity_type,
        creation_date,
        country,
        legal_status,
        vat_mode,
        acre,
        versement_liberatoire
      )
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Mon Entreprise'),
        'onglerie',
        CURRENT_DATE,
        'France',
        'micro_entreprise',
        'franchise_base_tva',
        false,
        false
      )
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't block user creation
        RAISE WARNING 'Failed to create company_profile for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_company_profile ON auth.users;

-- Create trigger for automatic company_profiles creation
CREATE TRIGGER on_auth_user_created_company_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_company_profile();
