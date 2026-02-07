/*
  # Update Partnerships Module

  1. Changes
    - Add missing columns to partnerships table
    - Create partnership_sales table
    - Add proper indexes and constraints
    - Create trigger for default Belleya partnership
*/

-- Add missing columns to partnerships table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'company_name') THEN
    ALTER TABLE partnerships ADD COLUMN company_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'logo_url') THEN
    ALTER TABLE partnerships ADD COLUMN logo_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'partnership_type') THEN
    ALTER TABLE partnerships ADD COLUMN partnership_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'commission_rate') THEN
    ALTER TABLE partnerships ADD COLUMN commission_rate numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'compensation_mode') THEN
    ALTER TABLE partnerships ADD COLUMN compensation_mode text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'affiliate_link') THEN
    ALTER TABLE partnerships ADD COLUMN affiliate_link text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'promo_code') THEN
    ALTER TABLE partnerships ADD COLUMN promo_code text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'conditions') THEN
    ALTER TABLE partnerships ADD COLUMN conditions text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'estimated_goal') THEN
    ALTER TABLE partnerships ADD COLUMN estimated_goal numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'is_default') THEN
    ALTER TABLE partnerships ADD COLUMN is_default boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'is_client_support_involved') THEN
    ALTER TABLE partnerships ADD COLUMN is_client_support_involved boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'last_action') THEN
    ALTER TABLE partnerships ADD COLUMN last_action text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'next_action') THEN
    ALTER TABLE partnerships ADD COLUMN next_action text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partnerships' AND column_name = 'promotion_frequency') THEN
    ALTER TABLE partnerships ADD COLUMN promotion_frequency text;
  END IF;
END $$;

-- Create partnership_sales table if it doesn't exist
CREATE TABLE IF NOT EXISTS partnership_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid REFERENCES partnerships(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  sale_amount numeric NOT NULL DEFAULT 0,
  commission_earned numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on partnership_sales if not already enabled
ALTER TABLE partnership_sales ENABLE ROW LEVEL SECURITY;

-- Create policies for partnership_sales if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partnership_sales' AND policyname = 'Users can view own partnership sales') THEN
    CREATE POLICY "Users can view own partnership sales"
      ON partnership_sales FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partnership_sales' AND policyname = 'Users can create own partnership sales') THEN
    CREATE POLICY "Users can create own partnership sales"
      ON partnership_sales FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partnership_sales' AND policyname = 'Users can update own partnership sales') THEN
    CREATE POLICY "Users can update own partnership sales"
      ON partnership_sales FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partnership_sales' AND policyname = 'Users can delete own partnership sales') THEN
    CREATE POLICY "Users can delete own partnership sales"
      ON partnership_sales FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partnership_sales_partnership_id ON partnership_sales(partnership_id);
CREATE INDEX IF NOT EXISTS idx_partnership_sales_user_id ON partnership_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_partnership_sales_date ON partnership_sales(sale_date);

-- Function to create default Belleya partnership on user creation
CREATE OR REPLACE FUNCTION create_default_belleya_partnership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO partnerships (
    user_id,
    company_name,
    partnership_type,
    commission_rate,
    compensation_mode,
    status,
    start_date,
    conditions,
    is_default,
    is_client_support_involved,
    notes
  ) VALUES (
    NEW.id,
    'Belleya',
    'affiliation',
    25,
    'recurring',
    'active',
    CURRENT_DATE,
    'Programme officiel Belleya - Commission mensuelle sur chaque vente HT. 25% par défaut, 30% si impliqué dans le service client.',
    true,
    false,
    'Partenariat officiel Belleya avec commission récurrente mensuelle.'
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and recreate it
DROP TRIGGER IF EXISTS create_belleya_partnership_on_user_creation ON user_profiles;

CREATE TRIGGER create_belleya_partnership_on_user_creation
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_belleya_partnership();
