/*
  # Convertir le champ platform en array pour multi-sélection

  1. Modifications
    - Créer une nouvelle colonne `platforms` de type `text[]`
    - Migrer les données de `platform` (string avec virgules) vers `platforms` (array)
    - Supprimer l'ancienne colonne `platform`
    - Renommer `platforms` en `platform` pour compatibilité
    
  2. Avantages
    - Requêtes plus performantes avec opérateurs array (@>, &&, etc.)
    - Filtrage natif par plateforme
    - Pas de parsing de strings côté application
    - Support natif PostgreSQL pour les arrays
    
  3. Migration des données
    - Les posts avec une plateforme : "instagram" → ["instagram"]
    - Les posts multi-plateformes : "instagram,tiktok" → ["instagram", "tiktok"]
    - Les posts sans plateforme : null ou '' → []
*/

-- Étape 0: Désactiver tous les triggers personnalisés (pas les triggers système)
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'content_calendar'::regclass
    AND tgisinternal = false
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON content_calendar', trigger_rec.tgname);
  END LOOP;
END $$;

-- Étape 1: Créer la nouvelle colonne platforms en array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_calendar' AND column_name = 'platforms'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN platforms text[] DEFAULT '{}';
  END IF;
END $$;

-- Étape 2: Migrer les données existantes
-- Convertir les valeurs séparées par virgules en array
UPDATE content_calendar
SET platforms = CASE 
  WHEN platform IS NULL OR platform = '' THEN '{}'::text[]
  WHEN platform LIKE '%,%' THEN string_to_array(platform, ',')
  ELSE ARRAY[platform]::text[]
END;

-- Étape 3: Supprimer l'ancienne colonne platform
ALTER TABLE content_calendar DROP COLUMN IF EXISTS platform;

-- Étape 4: Renommer platforms en platform pour compatibilité
ALTER TABLE content_calendar RENAME COLUMN platforms TO platform;

-- Étape 5: Ajouter une contrainte pour s'assurer que le tableau n'est jamais NULL
ALTER TABLE content_calendar 
ALTER COLUMN platform SET DEFAULT '{}',
ALTER COLUMN platform SET NOT NULL;

-- Étape 6: Créer un index GIN pour des recherches rapides sur les plateformes
CREATE INDEX IF NOT EXISTS idx_content_calendar_platform_gin 
ON content_calendar USING GIN (platform);

-- Étape 7: Ajouter une contrainte pour valider les valeurs des plateformes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'content_calendar_platform_values_check'
  ) THEN
    ALTER TABLE content_calendar
    ADD CONSTRAINT content_calendar_platform_values_check
    CHECK (
      platform <@ ARRAY['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'twitter', 'pinterest']::text[]
    );
  END IF;
END $$;

-- Étape 8: Recréer les triggers nécessaires (version corrigée)
CREATE OR REPLACE FUNCTION notify_followers_new_content()
RETURNS TRIGGER AS $$
DECLARE
  follower_user_id uuid;
  table_exists boolean;
BEGIN
  -- Vérifier si la table client_favorites existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'client_favorites'
  ) INTO table_exists;
  
  -- Seulement si la table existe
  IF table_exists THEN
    FOR follower_user_id IN
      SELECT DISTINCT c.user_id
      FROM client_favorites cf
      JOIN clients c ON c.id = cf.client_id
      WHERE cf.provider_id = NEW.company_id
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        created_at
      ) VALUES (
        follower_user_id,
        'new_content',
        'Nouveau contenu publié',
        'Un prestataire que vous suivez a publié du nouveau contenu',
        '/client/provider/' || NEW.company_id,
        now()
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
CREATE TRIGGER on_content_calendar_insert_notify_followers
  AFTER INSERT ON content_calendar
  FOR EACH ROW
  WHEN (NEW.is_published = true)
  EXECUTE FUNCTION notify_followers_new_content();
