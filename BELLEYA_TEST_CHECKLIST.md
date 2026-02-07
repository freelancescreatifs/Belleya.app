# Checklist de Tests Post-Migration - Belleya

Cette checklist permet de valider que la migration vers Belleya s'est correctement déroulée et que toutes les fonctionnalités sont opérationnelles.

---

## ⚙️ Pré-requis

Avant de commencer les tests :

- [ ] Le schéma Belleya est déployé (`belleya_schema_complete.sql` exécuté)
- [ ] Les buckets Storage sont créés
- [ ] Les policies Storage sont appliquées (`belleya_storage_policies.sql` exécuté)
- [ ] Les variables d'environnement sont configurées
- [ ] L'application est déployée et accessible

---

## 🔐 Phase 1 : Authentification

### Test 1.1 : Inscription d'un utilisateur PRO

**Objectif :** Vérifier que l'inscription fonctionne sans erreur 500.

**Étapes :**
1. Aller sur la page d'inscription (mode PRO)
2. Remplir le formulaire :
   - Prénom : `Test`
   - Nom : `Belleya`
   - Email : `test-pro@belleya.com`
   - Mot de passe : `TestBelleya2024!`
3. Soumettre le formulaire

**Résultats attendus :**
- [ ] Pas d'erreur 500
- [ ] Redirection vers le dashboard
- [ ] Message de bienvenue affiché
- [ ] Console navigateur : logs `[SignUp] User created successfully`
- [ ] Console navigateur : logs `[LoadProfile] Profile loaded successfully`

**Vérification DB :**
```sql
-- Vérifier que le user existe
SELECT id, email, created_at FROM auth.users WHERE email = 'test-pro@belleya.com';

-- Vérifier que user_profiles existe
SELECT * FROM user_profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-pro@belleya.com');

-- Vérifier que company_profiles existe
SELECT * FROM company_profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-pro@belleya.com');
```

**Résultats DB attendus :**
- [ ] 1 ligne dans `auth.users`
- [ ] 1 ligne dans `user_profiles` avec `role = 'pro'`
- [ ] 1 ligne dans `company_profiles` avec valeurs par défaut

---

### Test 1.2 : Connexion utilisateur PRO

**Objectif :** Vérifier que la connexion fonctionne.

**Étapes :**
1. Se déconnecter
2. Aller sur la page de connexion (mode PRO)
3. Se connecter avec `test-pro@belleya.com` / `TestBelleya2024!`

**Résultats attendus :**
- [ ] Connexion réussie
- [ ] Redirection vers le dashboard
- [ ] Session active
- [ ] Profil chargé correctement

---

### Test 1.3 : Inscription d'un utilisateur CLIENT

**Objectif :** Vérifier que les clients peuvent s'inscrire.

**Étapes :**
1. Aller sur la page d'inscription (mode CLIENT)
2. Remplir le formulaire :
   - Prénom : `Client`
   - Nom : `Test`
   - Email : `client-test@belleya.com`
   - Mot de passe : `ClientTest2024!`
3. Soumettre

**Résultats attendus :**
- [ ] Inscription réussie
- [ ] `user_profiles.role = 'client'`
- [ ] Pas de ligne dans `company_profiles` (seulement pour pro)

---

## 🏢 Phase 2 : Profil Entreprise (PRO uniquement)

### Test 2.1 : Modification du profil entreprise

**Connecté en tant que :** `test-pro@belleya.com`

**Étapes :**
1. Aller dans **Paramètres**
2. Modifier les informations :
   - Nom entreprise : `Belleya Beauty Studio`
   - Type d'activité : `Onglerie`
   - Statut légal : `Micro-entreprise`
   - Date de création : `01/01/2024`
3. Enregistrer

**Résultats attendus :**
- [ ] Sauvegarde réussie
- [ ] Message de confirmation
- [ ] Données correctement enregistrées en DB

**Vérification DB :**
```sql
SELECT company_name, activity_type, legal_status
FROM company_profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-pro@belleya.com');
```

---

### Test 2.2 : Slug de réservation unique

**Étapes :**
1. Dans Paramètres, définir un slug : `belleya-studio`
2. Enregistrer
3. Vérifier que l'URL de réservation s'affiche : `https://belleya.com/booking/belleya-studio`

**Résultats attendus :**
- [ ] Slug enregistré
- [ ] URL correcte

---

## 👥 Phase 3 : Gestion des Clients

### Test 3.1 : Créer un client

**Étapes :**
1. Aller dans **Clients**
2. Cliquer sur **Ajouter un client**
3. Remplir :
   - Prénom : `Marie`
   - Nom : `Dupont`
   - Email : `marie.dupont@example.com`
   - Téléphone : `06 12 34 56 78`
4. Enregistrer

**Résultats attendus :**
- [ ] Client créé
- [ ] Apparaît dans la liste
- [ ] Badge "Nouveau" affiché

---

### Test 3.2 : Upload photo client

**Étapes :**
1. Ouvrir le client créé
2. Cliquer sur "Ajouter une photo"
3. Uploader une image (< 5MB)

**Résultats attendus :**
- [ ] Upload réussi
- [ ] Photo affichée dans le profil
- [ ] URL stockée dans `clients.photo_url`

**Vérification Storage :**
```sql
SELECT name, bucket_id FROM storage.objects WHERE bucket_id = 'service-photos' LIMIT 5;
```

---

### Test 3.3 : Historique des prestations

**Étapes :**
1. Ouvrir le client
2. Onglet **Prestations**
3. Ajouter une prestation passée :
   - Service : `Pose complète`
   - Date : `15/01/2024`
   - Prix : `45€`
4. Enregistrer

**Résultats attendus :**
- [ ] Prestation enregistrée
- [ ] Affichée dans l'historique
- [ ] Ligne créée dans `client_services_history`

---

## 📅 Phase 4 : Agenda

### Test 4.1 : Créer un événement

**Étapes :**
1. Aller dans **Agenda**
2. Cliquer sur un créneau (ex: Lundi 10h)
3. Créer un événement :
   - Type : `Client (prestation)`
   - Client : `Marie Dupont`
   - Service : `Pose complète`
   - Durée : `1h30`
4. Enregistrer

**Résultats attendus :**
- [ ] Événement créé
- [ ] Visible dans le calendrier
- [ ] Couleur adaptée au type

---

### Test 4.2 : Drag & Drop d'événement

**Étapes :**
1. Cliquer sur l'événement créé
2. Le glisser vers un autre créneau (ex: Mardi 14h)
3. Confirmer le déplacement

**Résultats attendus :**
- [ ] Événement déplacé
- [ ] Dates mises à jour en DB
- [ ] Pas d'erreur de conflit

---

### Test 4.3 : Tâche dans l'agenda

**Étapes :**
1. Créer une tâche :
   - Titre : `Commander vernis`
   - Date : Demain
   - Priorité : Haute
2. Enregistrer

**Résultats attendus :**
- [ ] Tâche visible dans l'agenda
- [ ] Couleur différente des événements

---

## 💰 Phase 5 : Finances

### Test 5.1 : Enregistrer une recette

**Étapes :**
1. Aller dans **Finances**
2. Onglet **Recettes**
3. Ajouter une recette :
   - Client : `Marie Dupont`
   - Service : `Pose complète`
   - Montant : `45€`
   - Date : Aujourd'hui
   - Mode de paiement : `Espèces`
4. Enregistrer

**Résultats attendus :**
- [ ] Recette enregistrée
- [ ] Apparaît dans le tableau
- [ ] Total mis à jour

---

### Test 5.2 : Enregistrer une dépense

**Étapes :**
1. Onglet **Dépenses**
2. Ajouter une dépense :
   - Catégorie : `Matériel`
   - Description : `Vernis`
   - Montant : `12€`
   - Date : Aujourd'hui
3. Enregistrer

**Résultats attendus :**
- [ ] Dépense enregistrée
- [ ] Total dépenses mis à jour

---

## 🎓 Phase 6 : Formation (si applicable)

### Test 6.1 : Créer un élève

**Étapes :**
1. Aller dans **Formation**
2. Ajouter un élève :
   - Prénom : `Sophie`
   - Nom : `Martin`
   - Email : `sophie.martin@example.com`
   - Formation : `CAP Esthétique`
   - Date début : `01/02/2024`
3. Enregistrer

**Résultats attendus :**
- [ ] Élève créé
- [ ] Visible dans la liste

---

### Test 6.2 : Upload document privé

**Étapes :**
1. Ouvrir l'élève
2. Onglet **Documents**
3. Uploader un PDF (contrat, convention)

**Résultats attendus :**
- [ ] Upload réussi
- [ ] Document stocké dans bucket `student-documents` (privé)
- [ ] Accessible uniquement par le créateur

**Vérification RLS :**
Tenter d'accéder au document avec un autre compte → doit échouer.

---

## 📱 Phase 7 : Contenu & Réseaux Sociaux

### Test 7.1 : Créer un post Instagram

**Étapes :**
1. Aller dans **Contenu**
2. Onglet **Calendrier éditorial**
3. Créer un post :
   - Titre : `Nouvelle collection printemps`
   - Type : `Post`
   - Plateforme : `Instagram`
   - Date publication : Demain
4. Enregistrer

**Résultats attendus :**
- [ ] Post créé
- [ ] Visible dans le calendrier

---

### Test 7.2 : Upload média

**Étapes :**
1. Dans le post créé, cliquer sur **Ajouter média**
2. Uploader une image (< 50MB)

**Résultats attendus :**
- [ ] Upload réussi dans bucket `content-media`
- [ ] Aperçu visible
- [ ] URL stockée dans `content_calendar.media_urls`

---

## 🎯 Phase 8 : Objectifs & Tâches

### Test 8.1 : Créer un objectif

**Étapes :**
1. Aller dans **Objectifs**
2. Créer un objectif :
   - Titre : `Atteindre 50 clients`
   - Type : `Acquisition`
   - Date fin : `31/12/2024`
3. Enregistrer

**Résultats attendus :**
- [ ] Objectif créé
- [ ] Progression 0%

---

### Test 8.2 : Créer un projet

**Étapes :**
1. Aller dans **Tâches**
2. Onglet **Projets**
3. Créer un projet :
   - Nom : `Refonte site web`
   - Statut : `En cours`
4. Enregistrer

**Résultats attendus :**
- [ ] Projet créé
- [ ] Visible dans la liste

---

### Test 8.3 : Ajouter une tâche au projet

**Étapes :**
1. Dans le projet, ajouter une tâche :
   - Titre : `Choisir template`
   - Priorité : Moyenne
   - Date : Demain
2. Enregistrer

**Résultats attendus :**
- [ ] Tâche créée
- [ ] Liée au projet

---

## 🛡️ Phase 9 : Sécurité RLS

### Test 9.1 : Isolation des données

**Objectif :** Vérifier qu'un utilisateur ne peut pas voir les données d'un autre.

**Étapes :**
1. Créer un 2ème compte pro : `pro2@belleya.com`
2. Se connecter avec ce compte
3. Aller dans **Clients**

**Résultats attendus :**
- [ ] Liste vide (pas de clients du premier utilisateur)
- [ ] Pas d'erreur 403

**Étapes avancées :**
4. Essayer d'accéder directement à un client du user 1 via URL
5. Vérifier que l'accès est refusé

---

### Test 9.2 : Storage privé

**Étapes :**
1. Avec `pro2@belleya.com`, essayer d'accéder à un document de `test-pro@belleya.com`

**Résultat attendu :**
- [ ] Accès refusé (403 ou 404)

---

## 🌐 Phase 10 : Réservation publique

### Test 10.1 : Page de réservation publique

**Étapes :**
1. Se déconnecter
2. Accéder à l'URL : `https://belleya.com/booking/belleya-studio`
3. Sélectionner un service
4. Choisir un créneau
5. Soumettre la demande

**Résultats attendus :**
- [ ] Page accessible sans connexion
- [ ] Formulaire fonctionnel
- [ ] Demande créée dans `booking_requests`
- [ ] PRO reçoit notification

---

## ✅ Phase 11 : Validation finale

### Checklist globale

- [ ] Aucune action sur Belleya n'affecte ClientPulse
- [ ] Aucune erreur 500 durant les tests
- [ ] Aucune erreur 400 sur company_profiles
- [ ] Tous les triggers fonctionnent
- [ ] Storage uploads fonctionnent
- [ ] RLS bloque correctement les accès non autorisés
- [ ] Performance acceptable (pages chargent en < 2s)

### Logs à vérifier

Dans la console navigateur :
- [ ] Message de démarrage affiche "Belleya"
- [ ] Aucune erreur réseau
- [ ] Pas d'erreur CORS

---

## 🐛 Problèmes connus et solutions

### Erreur : "Missing Supabase environment variables"
**Solution :** Vérifier `.env` et redémarrer le serveur de dev

### Erreur 500 au signup
**Solution :** Vérifier que les triggers `handle_new_user`, `handle_new_user_profile`, et `handle_new_company_profile` existent

### Upload échoue
**Solution :** Vérifier que les buckets existent et que les policies sont appliquées

### Données d'un autre user visibles
**Solution :** Vérifier les policies RLS, s'assurer que `auth.uid()` est utilisé

---

## 📊 Rapport de tests

Une fois tous les tests effectués, compiler un rapport :

```
MIGRATION BELLEYA - RAPPORT DE TESTS
Date : [DATE]
Testeur : [NOM]

✅ Authentification : [X/3] tests passés
✅ Profil entreprise : [X/2] tests passés
✅ Clients : [X/3] tests passés
✅ Agenda : [X/3] tests passés
✅ Finances : [X/2] tests passés
✅ Formation : [X/2] tests passés
✅ Contenu : [X/2] tests passés
✅ Objectifs : [X/3] tests passés
✅ Sécurité : [X/2] tests passés
✅ Réservation : [X/1] tests passés

Total : [X/23] tests réussis
```

---

**Migration validée :** [ ] OUI / [ ] NON

**Prêt pour production :** [ ] OUI / [ ] NON
