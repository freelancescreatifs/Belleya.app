/*
  # Fix Calculate Published Status - Make it Robust

  ## Changes
  This migration improves the calculate_published_status function to:
  1. Handle NULL publication_time correctly
  2. Handle NULL publication_date correctly
  3. Be more defensive with date/time comparisons
  4. Never fail - always return a valid result

  ## Logic
  - If all checkboxes are checked AND publication date/time has passed → 'published'
  - Otherwise → 'not_published'
*/

CREATE OR REPLACE FUNCTION calculate_published_status()
RETURNS TRIGGER AS $$
DECLARE
  pub_datetime timestamp;
  current_datetime timestamp;
BEGIN
  -- If all production steps are checked
  IF NEW.script_checked AND NEW.tournage_checked AND NEW.montage_checked AND NEW.planifie_checked THEN
    
    -- If no publication date, cannot be published
    IF NEW.publication_date IS NULL THEN
      NEW.is_published_status := 'not_published';
      RETURN NEW;
    END IF;
    
    -- Build the publication datetime
    BEGIN
      IF NEW.publication_time IS NOT NULL THEN
        -- Combine date and time
        pub_datetime := (NEW.publication_date || ' ' || NEW.publication_time)::timestamp;
      ELSE
        -- Use date at midnight
        pub_datetime := NEW.publication_date::timestamp;
      END IF;
      
      -- Get current datetime
      current_datetime := NOW();
      
      -- Compare
      IF pub_datetime <= current_datetime THEN
        NEW.is_published_status := 'published';
      ELSE
        NEW.is_published_status := 'not_published';
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- If any error in date parsing, default to not_published
      RAISE WARNING 'Error calculating published status for content %: %', NEW.id, SQLERRM;
      NEW.is_published_status := 'not_published';
    END;
    
  ELSE
    -- Not all steps are checked
    NEW.is_published_status := 'not_published';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_calculate_published_status ON content_calendar;
CREATE TRIGGER trigger_calculate_published_status
BEFORE INSERT OR UPDATE OF script_checked, tournage_checked, montage_checked, planifie_checked, publication_date, publication_time
ON content_calendar
FOR EACH ROW
EXECUTE FUNCTION calculate_published_status();

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_published_status() TO authenticated;
