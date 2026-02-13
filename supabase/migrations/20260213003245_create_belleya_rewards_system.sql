/*
  # Create Belleya Rewards System

  1. New Tables
    - `belleya_rewards_submissions`
      - Stores all mission submissions (follow/comment and video review)
      - Tracks status (pending, approved, rejected)
      - Contains proof images, comments, videos
    - `landing_reviews`
      - Stores approved reviews for display on landing page
      - Contains display info (name, job, avatar, video, quote)

  2. Changes
    - Add `free_months_balance` to `company_profiles`

  3. Security
    - Enable RLS on all tables
    - Providers can create and view their own submissions
    - Only admins can approve/reject and manage landing reviews
    - Landing reviews are public (read-only)
*/

-- Add free months balance to company profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'free_months_balance'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN free_months_balance int DEFAULT 0;
  END IF;
END $$;

-- Create belleya_rewards_submissions table
CREATE TABLE IF NOT EXISTS belleya_rewards_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,
  mission_type text NOT NULL CHECK (mission_type IN ('follow_comment', 'video_review')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Mission #1 fields
  instagram_handle text,
  proof_image_url text,
  comment_text text,
  comment_post_url text,

  -- Mission #2 fields
  video_url text,
  video_storage_url text,
  consent_commercial boolean DEFAULT false,

  -- Admin fields
  admin_note text,
  reviewed_at timestamptz,
  reviewed_by uuid,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create landing_reviews table
CREATE TABLE IF NOT EXISTS landing_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES belleya_rewards_submissions(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE NOT NULL,

  display_name text NOT NULL,
  job_title text,
  avatar_url text,
  video_url text NOT NULL,
  quote text,

  is_published boolean DEFAULT true,
  display_order int DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_provider ON belleya_rewards_submissions(provider_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON belleya_rewards_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_mission_type ON belleya_rewards_submissions(mission_type);
CREATE INDEX IF NOT EXISTS idx_landing_reviews_published ON landing_reviews(is_published, display_order);

-- Enable RLS
ALTER TABLE belleya_rewards_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for belleya_rewards_submissions

-- Providers can view their own submissions
CREATE POLICY "Providers can view own submissions"
  ON belleya_rewards_submissions FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- Providers can create submissions
CREATE POLICY "Providers can create submissions"
  ON belleya_rewards_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    provider_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON belleya_rewards_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins can update submissions (approve/reject)
CREATE POLICY "Admins can update submissions"
  ON belleya_rewards_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for landing_reviews

-- Public can view published reviews
CREATE POLICY "Public can view published reviews"
  ON landing_reviews FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
  ON landing_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins can create reviews
CREATE POLICY "Admins can create reviews"
  ON landing_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins can update reviews
CREATE POLICY "Admins can update reviews"
  ON landing_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
  ON landing_reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Function to automatically create landing review when mission #2 is approved
CREATE OR REPLACE FUNCTION auto_create_landing_review()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_company company_profiles%ROWTYPE;
BEGIN
  -- Only proceed if status changed to approved and it's a video review
  IF NEW.status = 'approved' AND NEW.mission_type = 'video_review'
     AND (OLD.status IS NULL OR OLD.status != 'approved') THEN

    -- Get provider info
    SELECT * INTO v_company FROM company_profiles WHERE id = NEW.provider_id;

    -- Create landing review
    INSERT INTO landing_reviews (
      submission_id,
      provider_id,
      display_name,
      job_title,
      avatar_url,
      video_url,
      quote,
      is_published
    ) VALUES (
      NEW.id,
      NEW.provider_id,
      COALESCE(v_company.company_name, 'Provider'),
      v_company.profession,
      v_company.logo_url,
      COALESCE(NEW.video_storage_url, NEW.video_url),
      NEW.comment_text,
      true
    )
    ON CONFLICT (submission_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for auto landing review
DROP TRIGGER IF EXISTS trigger_auto_landing_review ON belleya_rewards_submissions;
CREATE TRIGGER trigger_auto_landing_review
  AFTER INSERT OR UPDATE ON belleya_rewards_submissions
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_landing_review();

-- Function to credit free months when mission is approved
CREATE OR REPLACE FUNCTION credit_free_months()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only proceed if status changed to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Add 1 free month to the provider
    UPDATE company_profiles
    SET free_months_balance = COALESCE(free_months_balance, 0) + 1
    WHERE id = NEW.provider_id;

    -- Create notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      is_read
    )
    SELECT
      cp.user_id,
      'reward_approved',
      'Récompense validée',
      CASE
        WHEN NEW.mission_type = 'follow_comment'
        THEN 'Félicitations ! Votre mission Follow + Commentaire a été validée. +1 mois gratuit ajouté à votre compte.'
        ELSE 'Félicitations ! Votre avis vidéo a été validé. +1 mois gratuit ajouté à votre compte.'
      END,
      NEW.id,
      false
    FROM company_profiles cp
    WHERE cp.id = NEW.provider_id;

  -- Handle rejection notification
  ELSIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      is_read
    )
    SELECT
      cp.user_id,
      'reward_rejected',
      'Mission refusée',
      'Votre demande a été refusée.' ||
      CASE WHEN NEW.admin_note IS NOT NULL
        THEN ' Raison : ' || NEW.admin_note
        ELSE ''
      END,
      NEW.id,
      false
    FROM company_profiles cp
    WHERE cp.id = NEW.provider_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for crediting free months
DROP TRIGGER IF EXISTS trigger_credit_free_months ON belleya_rewards_submissions;
CREATE TRIGGER trigger_credit_free_months
  AFTER INSERT OR UPDATE ON belleya_rewards_submissions
  FOR EACH ROW
  EXECUTE FUNCTION credit_free_months();

-- Add unique constraint to prevent duplicate landing reviews per submission
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'landing_reviews_submission_id_key'
  ) THEN
    ALTER TABLE landing_reviews ADD CONSTRAINT landing_reviews_submission_id_key UNIQUE (submission_id);
  END IF;
END $$;