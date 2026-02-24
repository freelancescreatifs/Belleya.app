/*
  # Auto-approve comments and fix likes/comments count triggers

  1. Changes to `content_comments`
    - Change `is_approved` default from `false` to `true` (auto-approve all comments)
    - Update all existing unapproved comments to approved
    - Update the `set_comment_provider_id` trigger to also auto-set `is_approved = true`

  2. Fix likes count trigger
    - `update_content_likes_count()` now supports both `content_calendar` and `client_results_photos`
    - Routes count updates based on `content_type` column

  3. Fix comments count trigger
    - `update_content_comments_count()` now supports both `content_calendar` and `client_results_photos`
    - Routes count updates based on `content_type` column

  4. Recalculate existing counts
    - Recalculate `likes_count` and `comments_count` for both `content_calendar` and `client_results_photos`
      based on actual data in `content_likes` and `content_comments`

  5. Security
    - No RLS changes needed (existing policies remain)
*/

-- Step 1: Change is_approved default to true (auto-approve all comments)
ALTER TABLE content_comments ALTER COLUMN is_approved SET DEFAULT true;

-- Step 2: Approve all existing unapproved comments
UPDATE content_comments SET is_approved = true WHERE is_approved = false;

-- Step 3: Update the set_comment_provider_id trigger to also set is_approved = true
CREATE OR REPLACE FUNCTION set_comment_provider_id()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  content_provider_id uuid;
BEGIN
  IF NEW.content_type = 'client_photo' THEN
    SELECT cp.user_id INTO content_provider_id
    FROM client_results_photos crp
    JOIN company_profiles cp ON crp.company_id = cp.id
    WHERE crp.id = NEW.content_id;
  ELSIF NEW.content_type = 'content_calendar' THEN
    SELECT cp.user_id INTO content_provider_id
    FROM content_calendar cc
    JOIN company_profiles cp ON cc.company_id = cp.id
    WHERE cc.id = NEW.content_id;
  ELSIF NEW.content_type = 'inspiration' THEN
    SELECT cp.user_id INTO content_provider_id
    FROM company_inspirations ci
    JOIN company_profiles cp ON ci.company_id = cp.id
    WHERE ci.id = NEW.content_id;
  END IF;

  NEW.provider_id := content_provider_id;
  NEW.is_approved := true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Fix likes count trigger to support both content_calendar and client_results_photos
CREATE OR REPLACE FUNCTION update_content_likes_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_content_type text;
  v_content_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_content_type := NEW.content_type;
    v_content_id := NEW.content_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_content_type := OLD.content_type;
    v_content_id := OLD.content_id;
  END IF;

  IF v_content_type = 'content_calendar' THEN
    UPDATE content_calendar
    SET likes_count = (
      SELECT count(*) FROM content_likes
      WHERE content_id = v_content_id AND content_type = 'content_calendar'
    )
    WHERE id = v_content_id;
  ELSIF v_content_type = 'client_photo' THEN
    UPDATE client_results_photos
    SET likes_count = (
      SELECT count(*) FROM content_likes
      WHERE content_id = v_content_id AND content_type = 'client_photo'
    )
    WHERE id = v_content_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 5: Fix comments count trigger to support both content_calendar and client_results_photos
CREATE OR REPLACE FUNCTION update_content_comments_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_content_type text;
  v_content_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_content_type := NEW.content_type;
    v_content_id := NEW.content_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_content_type := OLD.content_type;
    v_content_id := OLD.content_id;
  END IF;

  IF v_content_type = 'content_calendar' THEN
    UPDATE content_calendar
    SET comments_count = (
      SELECT count(*) FROM content_comments
      WHERE content_id = v_content_id AND content_type = 'content_calendar'
    )
    WHERE id = v_content_id;
  ELSIF v_content_type = 'client_photo' THEN
    UPDATE client_results_photos
    SET comments_count = (
      SELECT count(*) FROM content_comments
      WHERE content_id = v_content_id AND content_type = 'client_photo'
    )
    WHERE id = v_content_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 6: Recalculate existing likes_count for content_calendar
UPDATE content_calendar cc
SET likes_count = (
  SELECT count(*) FROM content_likes cl
  WHERE cl.content_id = cc.id AND cl.content_type = 'content_calendar'
);

-- Step 7: Recalculate existing comments_count for content_calendar
UPDATE content_calendar cc
SET comments_count = (
  SELECT count(*) FROM content_comments cm
  WHERE cm.content_id = cc.id AND cm.content_type = 'content_calendar'
);

-- Step 8: Recalculate existing likes_count for client_results_photos
UPDATE client_results_photos crp
SET likes_count = (
  SELECT count(*) FROM content_likes cl
  WHERE cl.content_id = crp.id AND cl.content_type = 'client_photo'
);

-- Step 9: Recalculate existing comments_count for client_results_photos
UPDATE client_results_photos crp
SET comments_count = (
  SELECT count(*) FROM content_comments cm
  WHERE cm.content_id = crp.id AND cm.content_type = 'client_photo'
);