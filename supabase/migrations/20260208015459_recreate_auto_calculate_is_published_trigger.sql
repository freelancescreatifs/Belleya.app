/*
  # Recréer le trigger auto_calculate_is_published
  
  Le trigger avait été supprimé. Il est nécessaire pour que is_published
  soit calculé automatiquement à chaque INSERT/UPDATE.
*/

-- Recréer la fonction trigger
CREATE OR REPLACE FUNCTION auto_calculate_is_published()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_published := calculate_is_published(
    NEW.content_type,
    NEW.date_script,
    NEW.date_shooting,
    NEW.date_editing,
    NEW.date_scheduling,
    NEW.publication_date,
    NEW.publication_time
  );

  RETURN NEW;
END;
$$;

-- Créer le trigger sur INSERT et UPDATE
DROP TRIGGER IF EXISTS trigger_auto_calculate_is_published ON content_calendar;
CREATE TRIGGER trigger_auto_calculate_is_published
  BEFORE INSERT OR UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_is_published();
