/*
  # Règle "Publié/Non publié" avec priorité production

  1. Nouvelle logique
    - Si AUCUNE étape de production n'est définie (toutes NULL)
      → Statut basé uniquement sur date+heure : publishAt <= now()
    
    - Si AU MOINS UNE étape de production est définie
      → Production devient prioritaire :
        - Si toutes les étapes pertinentes sont complétées → vérifier date+heure
        - Sinon → Non publié (même si date passée)

  2. Exemples
    - Post sans production (dates NULL) + publishAt passée → Publié ✅
    - Post sans production + publishAt future → Non publié ✅
    - Post avec production incomplète + publishAt passée → Non publié ✅
    - Post avec production complète + publishAt passée → Publié ✅
    - Post avec production complète + publishAt future → Non publié ✅

  3. Détection de production active
    Un contenu a une "production active" si au moins une des dates suivantes est définie :
    - date_script
    - date_shooting
    - date_editing
    - date_scheduling
*/

-- Modifier calculate_is_published pour gérer "pas de production"
CREATE OR REPLACE FUNCTION calculate_is_published(
  p_content_type text,
  p_date_script date,
  p_date_shooting date,
  p_date_editing date,
  p_date_scheduling date,
  p_publication_date date,
  p_publication_time text DEFAULT '00:00'
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_production boolean := false;
  v_all_steps_completed boolean := false;
  v_publish_datetime timestamp;
  v_now timestamp := now();
  v_time_str text;
BEGIN
  -- Détecter si le contenu a une production active
  -- (au moins une date de production définie)
  v_has_production := (
    p_date_script IS NOT NULL OR
    p_date_shooting IS NOT NULL OR
    p_date_editing IS NOT NULL OR
    p_date_scheduling IS NOT NULL
  );

  -- CAS 1 : Aucune production définie
  -- → Statut basé uniquement sur date+heure de publication
  IF NOT v_has_production THEN
    v_time_str := COALESCE(NULLIF(p_publication_time, ''), '00:00');
    IF LENGTH(v_time_str) = 5 THEN
      v_time_str := v_time_str || ':00';
    END IF;
    v_publish_datetime := (p_publication_date::text || ' ' || v_time_str)::timestamp;
    RETURN (v_publish_datetime <= v_now);
  END IF;

  -- CAS 2 : Production active
  -- → Vérifier si toutes les étapes pertinentes sont complétées
  CASE p_content_type
    WHEN 'post', 'story', 'live' THEN
      v_all_steps_completed := (p_date_script IS NOT NULL AND p_date_scheduling IS NOT NULL);
    WHEN 'carrousel' THEN
      v_all_steps_completed := (
        p_date_script IS NOT NULL AND
        p_date_editing IS NOT NULL AND
        p_date_scheduling IS NOT NULL
      );
    WHEN 'reel', 'video' THEN
      v_all_steps_completed := (
        p_date_script IS NOT NULL AND
        p_date_shooting IS NOT NULL AND
        p_date_editing IS NOT NULL AND
        p_date_scheduling IS NOT NULL
      );
    ELSE
      v_all_steps_completed := (
        p_date_script IS NOT NULL AND
        p_date_shooting IS NOT NULL AND
        p_date_editing IS NOT NULL AND
        p_date_scheduling IS NOT NULL
      );
  END CASE;

  -- Si production incomplète → Non publié (priorité production)
  IF NOT v_all_steps_completed THEN
    RETURN false;
  END IF;

  -- Si production complète → vérifier date+heure
  v_time_str := COALESCE(NULLIF(p_publication_time, ''), '00:00');
  IF LENGTH(v_time_str) = 5 THEN
    v_time_str := v_time_str || ':00';
  END IF;
  v_publish_datetime := (p_publication_date::text || ' ' || v_time_str)::timestamp;

  RETURN (v_publish_datetime <= v_now);
END;
$$;

-- Recalculer is_published pour tous les contenus
UPDATE content_calendar
SET is_published = calculate_is_published(
  content_type,
  date_script,
  date_shooting,
  date_editing,
  date_scheduling,
  publication_date,
  publication_time
);

-- Commentaire mis à jour
COMMENT ON FUNCTION calculate_is_published IS 
'Calcule si un contenu est publié selon les règles :
1. Si AUCUNE production définie → basé sur date+heure uniquement
2. Si production active → priorité production :
   - Production incomplète → Non publié (même si date passée)
   - Production complète → basé sur date+heure
3. Comparaison avec now() inclut date ET heure actuelle';
