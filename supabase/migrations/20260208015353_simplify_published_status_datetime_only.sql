/*
  # Règle automatique "Planifié" vs "Publié" selon date/heure

  1. Nouvelle logique simplifiée
    - Si publication_date + publication_time <= now() → is_published = true
    - Si publication_date + publication_time > now() → is_published = false
    - La date/heure est TOUJOURS prioritaire (étapes de production ignorées)

  2. Comportement
    - Un post planifié hier ou plus tôt → automatiquement "Publié"
    - Un post planifié demain ou plus tard → reste "Non publié"
    - La comparaison inclut date ET heure (pas seulement le jour)
    - Utilise le fuseau horaire du serveur

  3. Exemples
    - Maintenant = 08 fév 2026 15:00
    - Post A : 07 fév 2026 14:00 → Publié ✅
    - Post B : 08 fév 2026 14:00 → Publié ✅ (heure passée aujourd'hui)
    - Post C : 08 fév 2026 16:00 → Non publié ✅ (heure future aujourd'hui)
    - Post D : 09 fév 2026 10:00 → Non publié ✅ (demain)
    - Post E : NULL ou sans heure → Publié si date passée ✅

  4. Trigger automatique
    - Se déclenche à chaque INSERT/UPDATE
    - Recalcule automatiquement is_published
    - Pas d'action manuelle nécessaire
*/

-- Modifier la fonction pour une logique basée uniquement sur date+heure
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
  v_publish_datetime timestamp;
  v_now timestamp := now();
  v_time_str text;
BEGIN
  -- Si pas de date de publication, considérer comme non publié
  IF p_publication_date IS NULL THEN
    RETURN false;
  END IF;

  -- Construire le timestamp de publication (date + heure)
  -- Si publication_time est NULL ou vide, utiliser '00:00' (minuit)
  v_time_str := COALESCE(NULLIF(p_publication_time, ''), '00:00');

  -- Ajouter :00 si l'heure est au format HH:MM sans les secondes
  IF LENGTH(v_time_str) = 5 THEN
    v_time_str := v_time_str || ':00';
  END IF;

  -- Construire le timestamp complet
  v_publish_datetime := (p_publication_date::text || ' ' || v_time_str)::timestamp;

  -- Règle simple : publié si date+heure atteinte ou passée
  RETURN (v_publish_datetime <= v_now);
END;
$$;

-- Le trigger existe déjà, il va automatiquement utiliser la nouvelle fonction
-- Pas besoin de le recréer

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

-- Mettre à jour le commentaire de la fonction
COMMENT ON FUNCTION calculate_is_published IS
'Calcule automatiquement si un contenu est publié basé UNIQUEMENT sur date+heure :
- Si publication_date + publication_time <= maintenant → Publié
- Si publication_date + publication_time > maintenant → Non publié
- La comparaison utilise now() qui inclut date ET heure actuelle
- Les étapes de production sont ignorées pour ce calcul
- Note: publication_time est de type text au format HH:MM ou HH:MM:SS';
