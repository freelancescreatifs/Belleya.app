export interface TroubleshootingInfo {
  symptoms: string[];
  causes: string[];
  fixes: string[];
}

export interface KnowledgeTopic {
  id: string;
  title: string;
  keywords: string[];
  intent: string;
  summary: string;
  steps: string[];
  uiPaths: string[];
  troubleshooting?: TroubleshootingInfo;
  relatedTopics?: string[];
  needsClarification?: boolean;
  clarificationQuestions?: string[];
}

export const knowledgeBase: KnowledgeTopic[] = [
  {
    id: 'create-appointment',
    title: 'Créer un rendez-vous',
    keywords: ['rendez-vous', 'rdv', 'créer', 'ajouter', 'nouveau', 'appointment', 'réservation'],
    intent: 'create_appointment',
    summary: 'Créez un rendez-vous depuis la page Agenda en 4 étapes simples.',
    steps: [
      'Ouvrez la page "Agenda" depuis le menu principal',
      'Cliquez sur le bouton "+ Nouveau rendez-vous" en haut à droite',
      'Sélectionnez le client dans la liste déroulante (ou créez-en un nouveau avec "+Nouveau client")',
      'Choisissez le service, la date et l\'heure',
      'Ajoutez des notes si nécessaire (allergies, demandes spéciales)',
      'Cliquez sur "Enregistrer" pour créer le rendez-vous'
    ],
    uiPaths: [
      'Menu latéral > Agenda',
      'Bouton "+ Nouveau rendez-vous" (coin supérieur droit)',
      'Formulaire > Sélection client > Service > Date/Heure > Notes > Enregistrer'
    ],
    relatedTopics: ['move-appointment', 'sync-google-calendar', 'create-client']
  },
  {
    id: 'move-appointment',
    title: 'Déplacer un rendez-vous',
    keywords: ['déplacer', 'changer', 'modifier', 'heure', 'date', 'glisser', 'drag'],
    intent: 'move_appointment',
    summary: 'Déplacez un rendez-vous par glisser-déposer ou via modification.',
    steps: [
      'Sur la page "Agenda", passez en vue "Semaine" ou "Jour"',
      'Cliquez et maintenez sur le rendez-vous à déplacer',
      'Glissez-le vers le nouveau créneau horaire',
      'Relâchez - une fenêtre de confirmation apparaît',
      'Confirmez le déplacement en cliquant "Confirmer"'
    ],
    uiPaths: [
      'Agenda > Vue Semaine/Jour',
      'Glisser-déposer le rendez-vous',
      'Modal de confirmation > Bouton "Confirmer"'
    ],
    troubleshooting: {
      symptoms: ['Le rendez-vous ne se déplace pas', 'Aucune confirmation n\'apparaît'],
      causes: ['Conflit horaire avec un autre rendez-vous', 'Vue "Mois" active (glisser-déposer désactivé)'],
      fixes: [
        'Vérifiez que vous êtes en vue "Semaine" ou "Jour"',
        'Vérifiez qu\'il n\'y a pas de rendez-vous au même créneau',
        'Utilisez le bouton "Modifier" du rendez-vous pour changer manuellement'
      ]
    },
    relatedTopics: ['create-appointment', 'delete-appointment']
  },
  {
    id: 'sync-google-calendar',
    title: 'Synchroniser avec Google Calendar',
    keywords: ['google', 'calendar', 'synchroniser', 'sync', 'calendrier', 'intégration'],
    intent: 'sync_google_calendar',
    summary: 'Connectez votre Google Calendar pour synchroniser automatiquement vos rendez-vous.',
    steps: [
      'Allez dans "Paramètres" (icône engrenage en haut à droite)',
      'Descendez jusqu\'à la section "Intégrations"',
      'Cliquez sur le bouton "Connecter Google Calendar"',
      'Une fenêtre Google s\'ouvre - choisissez votre compte Google',
      'Autorisez l\'accès à votre calendrier',
      'Sélectionnez le calendrier spécifique à synchroniser',
      'Cliquez sur "Valider" - la synchronisation démarre immédiatement'
    ],
    uiPaths: [
      'Menu > Paramètres (icône engrenage)',
      'Section "Intégrations"',
      'Bouton "Connecter Google Calendar"',
      'Fenêtre Google > Autorisation > Sélection calendrier'
    ],
    troubleshooting: {
      symptoms: ['La fenêtre Google ne s\'ouvre pas', 'Erreur "Accès refusé"'],
      causes: ['Popup bloquée par le navigateur', 'Compte Google non connecté'],
      fixes: [
        'Autorisez les popups pour ce site dans votre navigateur',
        'Vérifiez que vous êtes connecté à votre compte Google',
        'Essayez avec un autre navigateur (Chrome recommandé)'
      ]
    },
    relatedTopics: ['create-appointment', 'planity-sync']
  },
  {
    id: 'create-client',
    title: 'Ajouter un nouveau client',
    keywords: ['client', 'ajouter', 'nouveau', 'créer', 'fiche', 'contact'],
    intent: 'create_client',
    summary: 'Créez une fiche client complète avec photo, coordonnées et historique.',
    steps: [
      'Ouvrez la page "Clients" depuis le menu',
      'Cliquez sur "+ Nouveau client" en haut à droite',
      'Remplissez le prénom et le nom (obligatoires)',
      'Ajoutez le téléphone (format: 06 12 34 56 78)',
      'Ajoutez l\'email (optionnel mais recommandé)',
      'Uploadez une photo en cliquant sur l\'icône appareil photo',
      'Notez les informations importantes : allergies, préférences, dernière visite',
      'Cliquez sur "Enregistrer" pour créer la fiche'
    ],
    uiPaths: [
      'Menu > Clients',
      'Bouton "+ Nouveau client"',
      'Formulaire : Nom > Prénom > Téléphone > Email > Photo > Notes',
      'Bouton "Enregistrer"'
    ],
    relatedTopics: ['view-client-history', 'archive-client', 'client-loyalty']
  },
  {
    id: 'view-client-history',
    title: 'Voir l\'historique d\'un client',
    keywords: ['historique', 'client', 'dernière', 'visite', 'prestations', 'rdv passés'],
    intent: 'view_client_history',
    summary: 'Consultez l\'historique complet des prestations et visites d\'un client.',
    steps: [
      'Sur la page "Clients", cliquez sur la fiche du client concerné',
      'Le tiroir latéral s\'ouvre à droite',
      'Onglet "Détails" : infos personnelles et notes',
      'Onglet "Historique" : tous les rendez-vous passés par ordre chronologique',
      'Onglet "Galerie" : photos avant/après de ce client',
      'Onglet "Statistiques" : CA généré, fréquence de visite, statut fidélité'
    ],
    uiPaths: [
      'Clients > Clic sur une fiche client',
      'Tiroir latéral > Onglets : Détails / Historique / Galerie / Statistiques'
    ],
    relatedTopics: ['create-client', 'client-loyalty', 'client-gallery']
  },
  {
    id: 'publish-instagram',
    title: 'Publier un post Instagram',
    keywords: ['instagram', 'post', 'publier', 'publication', 'réseaux sociaux', 'contenu'],
    intent: 'publish_instagram',
    summary: 'Planifiez et publiez vos posts Instagram directement depuis le Studio Contenu.',
    steps: [
      'Allez sur "Studio Contenu" dans le menu',
      'Cliquez sur "+ Nouvelle publication" en haut',
      'Uploadez votre visuel (photo ou vidéo, max 10Mo)',
      'Rédigez votre caption dans le champ "Description"',
      'Sélectionnez la plateforme "Instagram" (ou plusieurs)',
      'Choisissez la date et l\'heure de publication',
      'Ajoutez des hashtags dans le champ prévu',
      'Cliquez sur "Planifier" pour programmer la publication',
      'IMPORTANT : Au moment de la publication, vous recevrez une notification pour publier manuellement'
    ],
    uiPaths: [
      'Menu > Studio Contenu',
      'Bouton "+ Nouvelle publication"',
      'Upload visuel > Caption > Plateforme > Date/Heure > Hashtags',
      'Bouton "Planifier"'
    ],
    troubleshooting: {
      symptoms: ['La photo ne s\'upload pas', 'Le bouton "Planifier" est grisé'],
      causes: ['Fichier trop lourd (>10Mo)', 'Format non supporté', 'Champs obligatoires vides'],
      fixes: [
        'Compressez votre image (utilisez TinyPNG.com ou similaire)',
        'Formats acceptés : JPG, PNG, MP4',
        'Vérifiez que vous avez bien : 1 visuel + 1 description + 1 date'
      ]
    },
    relatedTopics: ['content-ideas', 'instagram-stats', 'content-calendar']
  },
  {
    id: 'content-ideas',
    title: 'Générer des idées de contenu',
    keywords: ['idée', 'idées', 'inspiration', 'quoi', 'publier', 'générateur', 'contenu'],
    intent: 'generate_content_ideas',
    summary: 'Le générateur d\'idées IA crée des suggestions de posts adaptées à votre activité.',
    steps: [
      'Dans "Studio Contenu", cliquez sur l\'onglet "Idées"',
      'Cliquez sur le bouton "Générer des idées"',
      'Le système génère 10 idées personnalisées selon votre métier',
      'Parcourez les suggestions affichées',
      'Cliquez sur l\'icône "💾" pour sauvegarder une idée',
      'Pour transformer une idée en post : cliquez sur "Créer un post"',
      'Le formulaire se pré-remplit automatiquement avec le contenu suggéré'
    ],
    uiPaths: [
      'Studio Contenu > Onglet "Idées"',
      'Bouton "Générer des idées"',
      'Liste d\'idées > Icône "💾" pour sauvegarder',
      'Bouton "Créer un post" sur une idée'
    ],
    relatedTopics: ['publish-instagram', 'editorial-pillars', 'marronniers']
  },
  {
    id: 'add-revenue',
    title: 'Enregistrer un revenu',
    keywords: ['revenu', 'argent', 'encaissement', 'paiement', 'ca', 'finances'],
    intent: 'add_revenue',
    summary: 'Enregistrez chaque revenu après une prestation pour suivre votre CA.',
    steps: [
      'Allez sur la page "Finances"',
      'Cliquez sur "+ Nouveau revenu"',
      'Sélectionnez le client concerné',
      'Choisissez le service effectué',
      'Entrez le montant encaissé (en euros)',
      'Sélectionnez le mode de paiement : Espèces, CB, Virement, Autre',
      'Ajoutez les suppléments éventuels (gel, dépose, etc.)',
      'Ajoutez une note si nécessaire',
      'Cliquez sur "Enregistrer" - le CA est mis à jour instantanément'
    ],
    uiPaths: [
      'Menu > Finances',
      'Bouton "+ Nouveau revenu"',
      'Client > Service > Montant > Mode paiement > Suppléments',
      'Bouton "Enregistrer"'
    ],
    relatedTopics: ['calculate-taxes', 'view-ca', 'export-finances']
  },
  {
    id: 'calculate-taxes',
    title: 'Calculer mes impôts',
    keywords: ['impôt', 'impôts', 'taxe', 'charges', 'urssaf', 'calculateur', 'cotisations'],
    intent: 'calculate_taxes',
    summary: 'Le calculateur estime vos charges sociales et impôts selon votre statut.',
    steps: [
      'Dans "Finances", descendez jusqu\'à "Calculateur d\'impôts"',
      'Sélectionnez votre statut juridique : Auto-entrepreneur, SASU, EURL, etc.',
      'Entrez votre chiffre d\'affaires mensuel ou annuel',
      'Le système calcule automatiquement :',
      '  - Charges sociales URSSAF',
      '  - Impôts sur le revenu',
      '  - Revenu net après impôts',
      'Consultez le détail ligne par ligne',
      'Utilisez cette estimation pour anticiper vos prélèvements'
    ],
    uiPaths: [
      'Finances > Section "Calculateur d\'impôts"',
      'Statut juridique > CA > Calcul automatique'
    ],
    troubleshooting: {
      symptoms: ['Les montants semblent incorrects'],
      causes: ['Statut juridique mal sélectionné', 'Taux de cotisation obsolète'],
      fixes: [
        'Vérifiez que votre statut est bien à jour dans Paramètres > Profil entreprise',
        'Les taux sont indicatifs - consultez votre comptable pour confirmation'
      ]
    },
    relatedTopics: ['add-revenue', 'change-legal-status']
  },
  {
    id: 'change-legal-status',
    title: 'Changer de statut juridique',
    keywords: ['statut', 'juridique', 'changer', 'auto-entrepreneur', 'sasu', 'eurl', 'entreprise'],
    intent: 'change_legal_status',
    summary: 'Modifiez votre statut juridique dans les paramètres de votre profil entreprise.',
    steps: [
      'Allez dans "Paramètres" (icône engrenage)',
      'Section "Profil entreprise"',
      'Cliquez sur le menu déroulant "Statut juridique"',
      'Choisissez : Auto-entrepreneur, SASU, EURL, EIRL, ou Autre',
      'Si SASU/EURL : sélectionnez le régime d\'imposition (IR ou IS)',
      'Renseignez le numéro SIRET si disponible',
      'Cliquez sur "Enregistrer les modifications"',
      'Le calculateur d\'impôts s\'adapte automatiquement au nouveau statut'
    ],
    uiPaths: [
      'Paramètres > Section "Profil entreprise"',
      'Menu "Statut juridique" > Sélection > Régime fiscal',
      'Bouton "Enregistrer les modifications"'
    ],
    relatedTopics: ['calculate-taxes', 'company-profile']
  },
  {
    id: 'manage-students',
    title: 'Gérer mes élèves',
    keywords: ['élève', 'étudiant', 'apprentie', 'formation', 'stagiaire', 'apprendre'],
    intent: 'manage_students',
    summary: 'Suivez vos élèves en formation avec documents et progression.',
    steps: [
      'Ouvrez "Formation" depuis le menu',
      'Cliquez sur "+ Nouvel élève"',
      'Remplissez : nom, prénom, téléphone, email',
      'Ajoutez la date de début et fin de formation',
      'Sélectionnez le niveau : Débutant, Intermédiaire, Avancé',
      'Uploadez les documents : contrat, convention, certificat',
      'Ajoutez une photo de l\'élève (optionnel)',
      'Suivez la progression avec les étapes à cocher',
      'Marquez les étapes complétées au fur et à mesure'
    ],
    uiPaths: [
      'Menu > Formation',
      'Bouton "+ Nouvel élève"',
      'Formulaire complet > Documents > Progression'
    ],
    relatedTopics: ['upload-documents', 'student-progress']
  },
  {
    id: 'inactive-clients',
    title: 'Relancer les clients inactifs',
    keywords: ['relance', 'client', 'inactif', 'rappel', 'marketing', 'sms', 'email'],
    intent: 'reactivate_clients',
    summary: 'Identifiez et relancez automatiquement les clients qui n\'ont pas pris RDV depuis longtemps.',
    steps: [
      'Allez sur "Marketing" dans le menu',
      'Onglet "Relances clients"',
      'Consultez la liste des clients inactifs (dernière visite > 60 jours)',
      'Filtrez par durée d\'inactivité : 2, 3, 6 mois ou +',
      'Cochez les clients à relancer',
      'Cliquez sur "Envoyer une relance"',
      'Choisissez le canal : SMS ou Email',
      'Personnalisez le message proposé',
      'Cliquez sur "Envoyer" - l\'historique est conservé'
    ],
    uiPaths: [
      'Menu > Marketing > Onglet "Relances clients"',
      'Liste clients inactifs > Sélection > Canal > Message',
      'Bouton "Envoyer"'
    ],
    relatedTopics: ['client-loyalty', 'marketing-campaigns']
  },
  {
    id: 'booking-online',
    title: 'Activer les réservations en ligne',
    keywords: ['réservation', 'booking', 'ligne', 'widget', 'lien', 'client', 'réserver'],
    intent: 'enable_online_booking',
    summary: 'Partagez votre lien de réservation pour que vos clients prennent RDV en ligne.',
    steps: [
      'Allez dans "Paramètres" > Section "Réservations en ligne"',
      'Activez le module en cochant "Autoriser les réservations en ligne"',
      'Configurez vos horaires de disponibilité par jour',
      'Ajoutez vos services disponibles à la réservation',
      'Définissez le délai minimum de réservation (ex: 24h)',
      'Copiez votre lien de réservation unique : /book/votre-slug',
      'Partagez ce lien sur Instagram bio, WhatsApp, Facebook',
      'Vous recevez une notification pour chaque demande',
      'Acceptez ou refusez depuis "Notifications" ou "Agenda"'
    ],
    uiPaths: [
      'Paramètres > Réservations en ligne',
      'Activation > Horaires > Services > Lien à copier'
    ],
    troubleshooting: {
      symptoms: ['Le lien ne fonctionne pas', 'Les clients ne voient pas mes services'],
      causes: ['Module non activé', 'Aucun service disponible', 'Horaires non configurés'],
      fixes: [
        'Vérifiez que le toggle "Autoriser les réservations" est bien activé',
        'Ajoutez au moins 1 service dans "Services" et cochez "Visible en ligne"',
        'Configurez vos horaires de travail dans la section dédiée'
      ]
    },
    relatedTopics: ['accept-booking', 'set-availability']
  },
  {
    id: 'accept-booking',
    title: 'Accepter une demande de réservation',
    keywords: ['accepter', 'réservation', 'demande', 'valider', 'rdv', 'booking'],
    intent: 'accept_booking_request',
    summary: 'Validez les demandes de réservation en ligne pour les ajouter à votre agenda.',
    steps: [
      'Cliquez sur l\'icône 🔔 Notifications en haut à droite',
      'Identifiez la notification "Nouvelle demande de réservation"',
      'Cliquez sur "Voir les détails"',
      'Vérifiez les informations : client, service, date, heure',
      'Cliquez sur le bouton vert "Accepter"',
      'Le rendez-vous est ajouté automatiquement à votre agenda',
      'Le client reçoit une confirmation par email/SMS',
      'Alternative : allez dans Agenda > onglet "Demandes en attente" et acceptez de là'
    ],
    uiPaths: [
      'Icône 🔔 Notifications > Liste des demandes',
      'Détails de la réservation > Bouton "Accepter"',
      'OU : Agenda > Onglet "Demandes" > Accepter'
    ],
    relatedTopics: ['booking-online', 'create-appointment']
  },
  {
    id: 'client-gallery',
    title: 'Gérer la galerie photos client',
    keywords: ['photo', 'galerie', 'avant', 'après', 'client', 'résultat', 'image'],
    intent: 'manage_client_gallery',
    summary: 'Uploadez et gérez les photos avant/après de vos clients.',
    steps: [
      'Ouvrez la fiche d\'un client (page Clients > clic sur un client)',
      'Allez dans l\'onglet "Galerie"',
      'Cliquez sur "+ Ajouter des photos"',
      'Uploadez les images avant/après',
      'Ajoutez une date et une description (prestation effectuée)',
      'Cochez "Autoriser la publication" si le client a donné son accord',
      'Les photos apparaissent dans la galerie du client',
      'Si publication autorisée : elles sont disponibles pour vos posts Instagram'
    ],
    uiPaths: [
      'Clients > Fiche client > Onglet "Galerie"',
      'Bouton "+ Ajouter des photos" > Upload > Description',
      'Case "Autoriser la publication"'
    ],
    relatedTopics: ['view-client-history', 'publish-instagram']
  },
  {
    id: 'notifications-setup',
    title: 'Configurer les notifications',
    keywords: ['notification', 'notif', 'alerte', 'rappel', 'activer', 'recevoir'],
    intent: 'setup_notifications',
    summary: 'Activez et personnalisez vos notifications pour ne rien manquer.',
    steps: [
      'Allez dans "Paramètres" > Section "Notifications"',
      'Autorisez les notifications dans votre navigateur (popup qui apparaît)',
      'Cochez les types de notifications souhaitées :',
      '  - Nouveaux rendez-vous',
      '  - Demandes de réservation',
      '  - Rappels 24h avant RDV',
      '  - Publications à faire',
      '  - Clients inactifs',
      'Définissez l\'heure des rappels quotidiens',
      'Cliquez sur "Enregistrer les préférences"'
    ],
    uiPaths: [
      'Paramètres > Section "Notifications"',
      'Autorisation navigateur > Sélection types > Horaires',
      'Bouton "Enregistrer les préférences"'
    ],
    troubleshooting: {
      symptoms: ['Je ne reçois pas de notifications'],
      causes: ['Notifications bloquées par le navigateur', 'Pas de permission accordée'],
      fixes: [
        'Sur Chrome : Paramètres > Confidentialité > Notifications > Autoriser ce site',
        'Sur Safari iOS : Réglages > Safari > Sites web > Notifications',
        'Vérifiez que vous avez coché au moins 1 type de notification'
      ]
    },
    relatedTopics: ['accept-booking', 'create-appointment']
  },
  {
    id: 'export-data',
    title: 'Exporter mes données',
    keywords: ['export', 'exporter', 'télécharger', 'csv', 'excel', 'données', 'comptable'],
    intent: 'export_data',
    summary: 'Exportez vos finances, clients ou rendez-vous au format CSV pour votre comptable.',
    steps: [
      'Allez sur la page concernée : Finances, Clients ou Agenda',
      'Cliquez sur l\'icône "⬇️ Exporter" en haut à droite',
      'Choisissez la période : Mois en cours, Trimestre, Année, ou Personnalisée',
      'Sélectionnez le format : CSV (Excel) ou PDF',
      'Cliquez sur "Télécharger"',
      'Le fichier se télécharge dans votre dossier "Téléchargements"',
      'Envoyez ce fichier à votre comptable si nécessaire'
    ],
    uiPaths: [
      'Finances/Clients/Agenda > Icône "⬇️ Exporter"',
      'Période > Format > Télécharger'
    ],
    relatedTopics: ['calculate-taxes', 'add-revenue']
  },
  {
    id: 'mobile-app',
    title: 'Utiliser Belaya sur mobile',
    keywords: ['mobile', 'téléphone', 'smartphone', 'app', 'application', 'installer'],
    intent: 'use_mobile_app',
    summary: 'Belaya fonctionne parfaitement sur mobile et peut s\'installer comme une app.',
    steps: [
      'Ouvrez Belaya dans votre navigateur mobile (Safari ou Chrome)',
      'Sur iOS (Safari) :',
      '  - Appuyez sur le bouton "Partager" (carré avec flèche)',
      '  - Descendez et appuyez sur "Sur l\'écran d\'accueil"',
      '  - Nommez l\'app "Belaya" et appuyez sur "Ajouter"',
      'Sur Android (Chrome) :',
      '  - Appuyez sur le menu (3 points) en haut à droite',
      '  - Sélectionnez "Ajouter à l\'écran d\'accueil"',
      '  - Confirmez en appuyant sur "Ajouter"',
      'L\'icône Belaya apparaît sur votre écran d\'accueil',
      'Lancez l\'app comme n\'importe quelle autre application'
    ],
    uiPaths: [
      'Safari iOS : Partager > Sur l\'écran d\'accueil',
      'Chrome Android : Menu (⋮) > Ajouter à l\'écran d\'accueil'
    ],
    relatedTopics: ['notifications-setup']
  },
  {
    id: 'password-reset',
    title: 'Réinitialiser mon mot de passe',
    keywords: ['mot de passe', 'password', 'oublié', 'perdu', 'réinitialiser', 'connexion'],
    intent: 'reset_password',
    summary: 'Récupérez l\'accès à votre compte en réinitialisant votre mot de passe.',
    steps: [
      'Sur la page de connexion, cliquez sur "Mot de passe oublié ?"',
      'Entrez votre adresse email (celle utilisée lors de l\'inscription)',
      'Cliquez sur "Envoyer le lien"',
      'Consultez votre boîte email (vérifiez aussi les spams)',
      'Cliquez sur le lien "Réinitialiser mon mot de passe"',
      'Créez un nouveau mot de passe (min. 8 caractères)',
      'Confirmez le nouveau mot de passe',
      'Cliquez sur "Valider" - vous pouvez maintenant vous connecter'
    ],
    uiPaths: [
      'Page connexion > "Mot de passe oublié ?"',
      'Email > Lien réinitialisation > Nouveau mot de passe'
    ],
    troubleshooting: {
      symptoms: ['Je ne reçois pas l\'email de réinitialisation'],
      causes: ['Email dans les spams', 'Mauvaise adresse email', 'Délai d\'envoi'],
      fixes: [
        'Vérifiez votre dossier spam/courrier indésirable',
        'Vérifiez que vous avez saisi le bon email',
        'Attendez 5 minutes puis réessayez',
        'Si toujours rien : contactez le support WhatsApp'
      ]
    },
    relatedTopics: []
  },
  {
    id: 'instagram-stats',
    title: 'Voir mes statistiques Instagram',
    keywords: ['statistiques', 'stats', 'instagram', 'performance', 'vues', 'engagement', 'analytics'],
    intent: 'view_instagram_stats',
    summary: 'Consultez les performances de vos publications Instagram.',
    steps: [
      'Allez dans "Studio Contenu"',
      'Onglet "Publications"',
      'Les statistiques s\'affichent pour chaque post publié :',
      '  - Nombre de vues',
      '  - Likes',
      '  - Commentaires',
      '  - Partages',
      '  - Taux d\'engagement',
      'Cliquez sur un post pour voir le détail',
      'Utilisez les filtres en haut pour trier par performance'
    ],
    uiPaths: [
      'Studio Contenu > Onglet "Publications"',
      'Cartes de posts avec statistiques',
      'Filtres : Plus performants / Récents / Moins performants'
    ],
    relatedTopics: ['publish-instagram', 'content-ideas']
  },
  {
    id: 'objectives-tracking',
    title: 'Définir et suivre mes objectifs',
    keywords: ['objectif', 'goal', 'but', 'cible', 'atteindre', 'progression'],
    intent: 'track_objectives',
    summary: 'Créez des objectifs mesurables et suivez votre progression en temps réel.',
    steps: [
      'Ouvrez la page "Objectifs" depuis le menu',
      'Cliquez sur "+ Nouvel objectif"',
      'Choisissez le type : CA mensuel, Nombre de clients, Taux de fidélisation, etc.',
      'Définissez la valeur cible (ex: 5000€)',
      'Sélectionnez la période : Mensuel, Trimestriel ou Annuel',
      'Ajoutez une date de début et de fin',
      'Cliquez sur "Créer l\'objectif"',
      'Le système calcule automatiquement votre progression',
      'Consultez le tableau de bord pour voir où vous en êtes'
    ],
    uiPaths: [
      'Menu > Objectifs',
      'Bouton "+ Nouvel objectif"',
      'Type > Cible > Période > Dates',
      'Tableau de bord avec progression %'
    ],
    relatedTopics: ['add-revenue', 'view-ca']
  },
  {
    id: 'partnerships-management',
    title: 'Gérer mes partenariats',
    keywords: ['partenariat', 'collaboration', 'marque', 'sponsor', 'brand', 'deal'],
    intent: 'manage_partnerships',
    summary: 'Suivez vos collaborations avec des marques et influenceurs.',
    steps: [
      'Allez sur "Partenariats" dans le menu',
      'Cliquez sur "+ Nouveau partenariat"',
      'Renseignez la marque/entreprise partenaire',
      'Sélectionnez le type : Sponsoring, Produits offerts, Affiliation, etc.',
      'Ajoutez la rémunération ou contrepartie',
      'Définissez les livrables attendus (posts, stories, etc.)',
      'Ajoutez les dates de début et fin',
      'Uploadez le contrat si nécessaire',
      'Suivez l\'avancement et marquez les étapes complétées'
    ],
    uiPaths: [
      'Menu > Partenariats',
      'Bouton "+ Nouveau partenariat"',
      'Formulaire complet > Livrables > Suivi'
    ],
    relatedTopics: ['add-revenue', 'upload-documents']
  },
  {
    id: 'inspiration-boards',
    title: 'Créer des boards d\'inspiration',
    keywords: ['inspiration', 'board', 'pinterest', 'idée', 'moodboard', 'collection'],
    intent: 'create_inspiration_boards',
    summary: 'Organisez vos inspirations visuelles en collections thématiques.',
    steps: [
      'Allez sur "Inspiration" dans le menu',
      'Cliquez sur "+ Nouveau tableau"',
      'Nommez votre tableau (ex: "Nail art été 2024", "Poses déco")',
      'Ajoutez une description (optionnel)',
      'Cliquez sur "Créer"',
      'Dans le tableau, cliquez sur "+ Ajouter une image"',
      'Uploadez des photos ou ajoutez des URL d\'images',
      'Organisez vos images par glisser-déposer',
      'Utilisez ces inspirations pour vos futures créations'
    ],
    uiPaths: [
      'Menu > Inspiration',
      'Bouton "+ Nouveau tableau"',
      'Nom > Description > Créer',
      'Ajout d\'images > Organisation'
    ],
    relatedTopics: ['content-ideas', 'publish-instagram']
  }
];

export const quickActions = [
  { id: 'create-appointment', label: 'Créer un RDV', icon: '📅' },
  { id: 'publish-instagram', label: 'Publier un post', icon: '📱' },
  { id: 'add-revenue', label: 'Ajouter un revenu', icon: '💰' },
  { id: 'booking-online', label: 'Réservations en ligne', icon: '🔗' },
  { id: 'contact-support', label: 'Parler à un agent', icon: '💬' }
];

export const escalationKeywords = [
  'agent', 'humain', 'support', 'aide', 'personne', 'quelqu\'un',
  'whatsapp', 'téléphone', 'appeler', 'parler', 'contact', 'urgent',
  'bug', 'erreur', 'problème', 'bloqué', 'marche pas', 'fonctionne pas',
  'help', 'sos', 'au secours'
];

interface MatchResult {
  topic: KnowledgeTopic | null;
  score: number;
  needsClarification: boolean;
}

export function matchUserIntent(userInput: string): MatchResult {
  const normalizedInput = userInput.toLowerCase().trim();
  const words = normalizedInput.split(/\s+/);

  let bestMatch: KnowledgeTopic | null = null;
  let bestScore = 0;

  for (const topic of knowledgeBase) {
    let score = 0;

    for (const keyword of topic.keywords) {
      const keywordLower = keyword.toLowerCase();

      if (normalizedInput.includes(keywordLower)) {
        score += keywordLower.length;
      }

      for (const word of words) {
        if (word === keywordLower) {
          score += 10;
        } else if (word.includes(keywordLower) || keywordLower.includes(word)) {
          score += 5;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = topic;
    }
  }

  const threshold = 10;
  const needsClarification = bestScore > 0 && bestScore < threshold && bestMatch?.needsClarification === true;

  return {
    topic: bestScore >= threshold ? bestMatch : null,
    score: bestScore,
    needsClarification
  };
}

export function shouldEscalateToSupport(userInput: string): boolean {
  const normalizedInput = userInput.toLowerCase().trim();
  return escalationKeywords.some(keyword => normalizedInput.includes(keyword));
}

export function getTopicById(id: string): KnowledgeTopic | undefined {
  return knowledgeBase.find(topic => topic.id === id);
}

export function searchTopics(query: string): KnowledgeTopic[] {
  const normalizedQuery = query.toLowerCase();
  return knowledgeBase.filter(topic =>
    topic.title.toLowerCase().includes(normalizedQuery) ||
    topic.keywords.some(k => k.toLowerCase().includes(normalizedQuery))
  ).slice(0, 5);
}
