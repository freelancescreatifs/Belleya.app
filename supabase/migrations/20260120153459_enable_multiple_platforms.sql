/*
  # Permettre la sélection multiple de plateformes

  1. Modifications
    - Supprimer la contrainte CHECK sur le champ platform
    - Le champ platform stockera désormais plusieurs plateformes séparées par des virgules
    - Exemple: "instagram,tiktok,facebook"

  2. Notes
    - Les contenus existants avec une seule plateforme restent compatibles
    - Le frontend gérera la conversion entre array et string
*/

-- Supprimer la contrainte CHECK existante
ALTER TABLE content_calendar DROP CONSTRAINT IF EXISTS content_calendar_platform_check;
