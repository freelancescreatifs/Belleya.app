/*
  # Ajouter conseil sur le changement de statut juridique

  1. Modifications
    - Ajoute un nouveau contenu éducatif "Changement de statut juridique"
    - Placé après le contenu CFE dans la catégorie 'impots'
    - Contient 3 sous-sections accessibles via onglets :
      * Seuils de CA annuel
      * Quand envisager un changement
      * Astuce pour consulter un expert

  2. Sécurité
    - Utilise les policies existantes pour educational_content (publiquement lisible pour les utilisateurs authentifiés)
*/

-- Insérer le nouveau contenu éducatif pour le changement de statut juridique
INSERT INTO educational_content (title, content, category, legal_statuses, icon) VALUES
  (
    'Changement de statut juridique',
    E'**Seuils**\n\nSeuils de CA annuel :\n• Prestations de services: 77 700 € (franchise TVA: 36 800 €)\n• Activités commerciales: 188 700 € (franchise TVA: 91 900 €)\n\n**Changement**\n\nSi votre CA approche ou dépasse ces seuils, vous pourriez envisager :\n• SASU/EURL: Meilleure protection sociale et possibilité de déduire plus de charges\n• SARL: Si vous souhaitez vous associer\n\n**Astuce**\n\nConsultez un expert-comptable ou conseiller juridique avant tout changement de statut pour évaluer l''impact fiscal et social.',
    'impots',
    ARRAY['auto_entreprise'],
    'Lightbulb'
  )
ON CONFLICT DO NOTHING;
