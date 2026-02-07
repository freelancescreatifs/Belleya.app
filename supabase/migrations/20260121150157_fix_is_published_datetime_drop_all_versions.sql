/*
  # Corriger calculate_is_published pour utiliser date + heure (pas seulement date)

  1. Problème actuel
    - calculate_is_published utilise seulement `publication_date <= CURRENT_DATE`
    - Cela ignore complètement `publication_time`
    - Un post avec publication_date = aujourd'hui et publication_time = 16:00
      sera marqué "publié" même si l'heure actuelle est 15:00

  2. Règle correcte (selon le prompt utilisateur)
    - Un post est "Publié" si : `publication_date + publication_time <= now()`
    - Un post est "Non publié" si : `publication_date + publication_time > now()`
    - now() = date + heure actuelle (pas juste la date)

  3. Solution
    - Supprimer TOUTES les anciennes versions de calculate_is_published
    - Créer une nouvelle avec p_publication_time (text)
    - Construire un timestamp à partir de publication_date + publication_time
    - Comparer avec now() (date + heure actuelle)

  4. Exemples de tests
    - Maintenant = 21 jan 2026 15:00
    - Post A : publication_date = 21 jan 2026, publication_time = 14:00 → Publié ✅
    - Post B : publication_date = 21 jan 2026, publication_time = 16:00 → Non publié ✅
    - Post C : publication_date = 20 jan 2026, publication_time = NULL → Publié ✅ (date passée)
    - Post D : publication_date = 22 jan 2026, publication_time = 10:00 → Non publié ✅ (date future)
*/

-- Supprimer TOUTES les anciennes versions de la fonction
DROP FUNCTION IF EXISTS calculate_is_published(text, date, date, date, date);
DROP FUNCTION IF EXISTS calculate_is_published(text, date, date, date, date, date);

-- Créer la nouvelle version avec publication_time
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
  v_all_steps_completed boolean := false;
  v_publish_datetime timestamp;
  v_now timestamp := now();
  v_time_str text;
BEGIN
  -- Vérifier si toutes les étapes pertinentes sont complétées
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

  -- Si les étapes ne sont pas toutes complétées, pas publié
  IF NOT v_all_steps_completed THEN
    RETURN false;
  END IF;

  -- Construire le timestamp de publication (date + heure)
  -- Si publication_time est NULL ou vide, utiliser '00:00'
  v_time_str := COALESCE(NULLIF(p_publication_time, ''), '00:00');
  
  -- Ajouter :00 si l'heure est au format HH:MM sans les secondes
  IF LENGTH(v_time_str) = 5 THEN
    v_time_str := v_time_str || ':00';
  END IF;

  v_publish_datetime := (p_publication_date::text || ' ' || v_time_str)::timestamp;

  -- Publié = toutes les étapes complétées ET date+heure atteinte
  RETURN (v_publish_datetime <= v_now);
END;
$$;

-- Mettre à jour le trigger pour passer publication_time
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

-- Recalculer is_published pour tous les contenus existants avec la nouvelle logique
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

-- Commentaire pour expliquer le comportement
COMMENT ON FUNCTION calculate_is_published IS 
'Calcule si un contenu est publié en se basant sur :
1. Toutes les étapes de production pertinentes sont complétées (selon le type de contenu)
2. La date+heure de publication (publication_date + publication_time) est atteinte ou passée
3. Comparaison avec now() qui inclut date ET heure actuelle
Note: publication_time est de type text au format HH:MM ou HH:MM:SS';
