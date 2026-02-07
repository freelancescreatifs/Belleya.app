/*
  # Ajouter le champ is_published et calcul automatique basé sur les étapes
  
  1. Nouveau champ
    - `is_published` (boolean) : true si toutes les étapes de production sont complétées
    - Calculé automatiquement via trigger
    - Source de vérité pour le statut Publié/Non publié
  
  2. Règle de calcul
    - Pour chaque content_type, vérifier si toutes les étapes pertinentes ont des dates
    - post/story/live : Script + Planification
    - carrousel : Script + Montage + Planification  
    - reel/video : Script + Tournage + Montage + Planification
    - Si toutes les étapes pertinentes sont définies → is_published = true
    - Sinon → is_published = false
  
  3. Synchronisation
    - Trigger se déclenche sur INSERT/UPDATE de content_calendar
    - Met à jour automatiquement is_published
    - Pas besoin d'action manuelle
  
  4. Migration des données existantes
    - Calculer is_published pour tous les contenus existants
*/

-- Ajouter la colonne is_published
ALTER TABLE content_calendar 
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;

-- Fonction pour déterminer si un contenu est publié
CREATE OR REPLACE FUNCTION calculate_is_published(
  p_content_type text,
  p_date_script date,
  p_date_shooting date,
  p_date_editing date,
  p_date_scheduling date
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Pour post, story, live : Script + Planification requis
  IF p_content_type IN ('post', 'story', 'live') THEN
    RETURN (p_date_script IS NOT NULL AND p_date_scheduling IS NOT NULL);
  END IF;
  
  -- Pour carrousel : Script + Montage + Planification requis
  IF p_content_type = 'carrousel' THEN
    RETURN (
      p_date_script IS NOT NULL AND 
      p_date_editing IS NOT NULL AND 
      p_date_scheduling IS NOT NULL
    );
  END IF;
  
  -- Pour reel, video : toutes les étapes requises
  IF p_content_type IN ('reel', 'video') THEN
    RETURN (
      p_date_script IS NOT NULL AND 
      p_date_shooting IS NOT NULL AND 
      p_date_editing IS NOT NULL AND 
      p_date_scheduling IS NOT NULL
    );
  END IF;
  
  -- Par défaut : toutes les étapes requises
  RETURN (
    p_date_script IS NOT NULL AND 
    p_date_shooting IS NOT NULL AND 
    p_date_editing IS NOT NULL AND 
    p_date_scheduling IS NOT NULL
  );
END;
$$;

-- Trigger pour calculer automatiquement is_published
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
    NEW.date_scheduling
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

-- Mettre à jour tous les contenus existants
UPDATE content_calendar
SET is_published = calculate_is_published(
  content_type,
  date_script,
  date_shooting,
  date_editing,
  date_scheduling
);

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_content_calendar_is_published ON content_calendar(is_published);
CREATE INDEX IF NOT EXISTS idx_content_calendar_is_published_platform ON content_calendar(is_published, platform);
