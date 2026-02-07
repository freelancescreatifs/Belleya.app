/*
  # Création du système de stockage de médias pour le contenu

  1. Storage Bucket
    - `content-media` : stockage des images et vidéos
    - Accès public pour les fichiers
    - Taille max 50MB par fichier

  2. Nouveaux champs
    - `media_urls` : tableau JSON contenant les URLs des médias (images ou vidéo)
    - `media_type` : type de média (image, video, carousel)

  3. Sécurité
    - RLS sur le bucket pour que les utilisateurs ne puissent uploader/supprimer que leurs propres fichiers
    - Lecture publique pour permettre l'affichage

  4. Notes importantes
    - Les médias sont stockés dans le bucket Supabase
    - Les URLs sont sauvegardées dans la table content_calendar
*/

-- Créer le bucket pour les médias de contenu
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-media',
  'content-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux utilisateurs authentifiés d'uploader leurs fichiers
CREATE POLICY "Users can upload their own content media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'content-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour permettre aux utilisateurs de supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own content media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'content-media' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Politique pour permettre à tout le monde de voir les médias (lecture publique)
CREATE POLICY "Anyone can view content media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'content-media');

-- Ajouter le champ media_urls pour stocker les URLs des médias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN media_urls jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Ajouter le champ media_type pour identifier le type de contenu média
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_calendar' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE content_calendar ADD COLUMN media_type text;
  END IF;
END $$;
