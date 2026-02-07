# Test d'Accès à l'Espace Client

## Préparation

### 1. Lancer l'Application

```bash
npm run dev
```

Ouvrir `http://localhost:5173` dans le navigateur.

---

## Test 1 : Création de Compte Client

### Étapes

1. ✅ Aller sur la page d'accueil (vous devez être déconnecté)
2. ✅ Vous voyez deux boutons :
   - "Je suis cliente"
   - "Je suis pro"
3. ✅ Cliquer sur **"Je suis cliente"**
4. ✅ Page d'authentification avec fond dégradé rose
5. ✅ Cliquer sur **"Créer un compte"** (en bas)
6. ✅ Remplir le formulaire :
   - **Email** : `cliente@test.fr`
   - **Mot de passe** : `test123`
   - **Prénom** : `Marie`
   - **Nom** : `Dupont`
7. ✅ Cliquer sur **"Créer mon compte"**

### Résultat Attendu

- ✅ Compte créé avec succès
- ✅ Connexion automatique
- ✅ Redirection vers l'espace client

### Si Erreur

**Erreur : "User already registered"**
→ Le compte existe déjà, utilisez **"Se connecter"** au lieu de **"Créer un compte"**

**Erreur : "Invalid email or password"**
→ Vérifiez que le mot de passe fait au moins 6 caractères

---

## Test 2 : Vérification de l'Interface Client

Une fois connecté, vous devriez voir :

### ✅ Navigation en Bas de l'Écran

5 onglets visibles :
- 🏠 **Accueil** (rose si actif, gris sinon)
- 🗺️ **Carte**
- 📅 **RDV**
- ❤️ **Favoris**
- 👤 **Profil**

### ✅ Page Accueil (par défaut)

**En-tête rose** :
- Logo BelleYa
- Message "Bonjour Marie !"

**Contenu** :
- Carte blanche "Prochain rendez-vous"
  - Si aucun RDV : Message "Aucun rendez-vous à venir"
  - Bouton "Explorer la carte"
- Section "Suggestions près de chez vous"
  - Message "Fonctionnalité en construction..."

---

## Test 3 : Navigation entre les Pages

### Page RDV (📅)

1. ✅ Cliquer sur l'onglet **"RDV"** en bas
2. ✅ Vérifier l'affichage :
   - Titre "Mes rendez-vous"
   - Deux onglets : **"À venir"** | **"Passés"**
   - Si aucun RDV : Message "Aucun rendez-vous"

### Page Carte (🗺️)

1. ✅ Cliquer sur l'onglet **"Carte"**
2. ✅ Vérifier l'affichage :
   - Barre de recherche
   - Message "Carte interactive - Fonctionnalité en cours de développement"
   - Liste des fonctionnalités à venir

### Page Favoris (❤️)

1. ✅ Cliquer sur l'onglet **"Favoris"**
2. ✅ Vérifier l'affichage :
   - Icône cœur rose
   - Message "Aucune praticienne favorite"

### Page Profil (👤)

1. ✅ Cliquer sur l'onglet **"Profil"**
2. ✅ Vérifier l'affichage :
   - **En-tête rose** avec avatar circulaire
   - Nom : "Marie Dupont"
   - Badge : "Cliente BelleYa"
   - **Section "Informations personnelles"** :
     - Email : `cliente@test.fr`
   - **Section "Paramètres"** :
     - Modifier mon profil
     - Notifications
     - Confidentialité
   - **Bouton rouge "Déconnexion"**

---

## Test 4 : Déconnexion

1. ✅ Aller sur la page **Profil**
2. ✅ Cliquer sur **"Déconnexion"**
3. ✅ Vérifier la redirection vers la page d'accueil
4. ✅ Vérifier que vous êtes bien déconnecté (boutons "Je suis cliente" / "Je suis pro" visibles)

---

## Test 5 : Reconnexion

1. ✅ Cliquer sur **"Je suis cliente"**
2. ✅ Cliquer sur **"Se connecter"** (en bas, si vous êtes sur "Créer un compte")
3. ✅ Remplir :
   - Email : `cliente@test.fr`
   - Mot de passe : `test123`
4. ✅ Cliquer sur **"Se connecter"**
5. ✅ Vérifier que vous êtes bien reconnecté dans l'espace client

---

## Test 6 : Réservation Publique (Optionnel)

Pour tester la réservation publique en tant que cliente :

### Prérequis

1. Avoir un **compte Pro** avec :
   - Un **slug de réservation** configuré
   - Des **horaires d'ouverture** définis
   - Au moins **un service actif**

### Étapes

1. ✅ Copier l'URL de réservation : `http://localhost:5173/book/[votre-slug]`
2. ✅ Ouvrir cette URL dans un **nouvel onglet** (ou en navigation privée)
3. ✅ **Se connecter en tant que cliente** (si pas déjà connecté)
4. ✅ Sélectionner un **service**
5. ✅ Choisir une **date**
6. ✅ Choisir une **heure**
7. ✅ Confirmer les informations (pré-remplies si connectée)
8. ✅ Valider la réservation

### Résultat

- ✅ Message de confirmation
- ✅ Retour à l'espace client
- ✅ Dans l'onglet **RDV**, la réservation apparaît dans **"À venir"**
- ✅ Statut : **"En attente"** (jaune)

---

## Checklist de Vérification Visuelle

### Design Mobile-First

- ✅ Navigation en bas de l'écran (Bottom Navigation)
- ✅ Grandes zones tactiles
- ✅ Textes lisibles
- ✅ Espacements confortables

### Couleurs

- ✅ Rose primaire (#F43F5E)
- ✅ Rose secondaire (#EC4899)
- ✅ Fond dégradé rose clair
- ✅ Textes gris foncé lisibles

### Animations

- ✅ Transitions fluides entre les pages
- ✅ Hover states sur les boutons
- ✅ Effet de chargement (skeleton)

### Typographie

- ✅ Titres en Bold
- ✅ Texte secondaire en gris
- ✅ Tailles adaptées au mobile

---

## Problèmes Connus et Solutions

### Problème : "Chargement du profil..." infini

**Cause** : Le profil utilisateur n'a pas été créé automatiquement

**Solution** :
1. Vérifier que les triggers de création de profil sont actifs dans Supabase
2. Vérifier les migrations :
   - `20260118205432_improve_user_profile_auto_creation_with_role.sql`
   - `20260118212217_fix_signup_triggers_rls_bypass.sql`

### Problème : "Ce compte est un compte professionnel"

**Cause** : Vous essayez de vous connecter avec un compte pro dans l'espace client

**Solution** :
1. Cliquer sur "Retour"
2. Cliquer sur "Je suis pro"
3. Se connecter avec le compte pro

### Problème : Aucune réservation n'apparaît

**Cause** : Aucune réservation n'a été créée pour cette cliente

**Solution** :
1. Créer une réservation via la page publique d'un pro
2. Vérifier que la réservation est bien liée à votre `user_id`

---

## Données de Test Recommandées

### Compte Cliente

```
Email: cliente@test.fr
Mot de passe: test123
Prénom: Marie
Nom: Dupont
Rôle: client
```

### Compte Pro (pour tester les réservations)

```
Email: pro@test.fr
Mot de passe: test123
Prénom: Sophie
Nom: Martin
Rôle: pro
```

---

## Commandes Utiles

### Vérifier les migrations appliquées

Aller dans **Supabase Dashboard** > **SQL Editor** et exécuter :

```sql
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

### Vérifier les profils utilisateurs

```sql
SELECT user_id, role, first_name, last_name, created_at
FROM user_profiles
WHERE role = 'client';
```

### Vérifier les réservations

```sql
SELECT b.id, b.appointment_date, b.status,
       u.email as client_email,
       s.name as service_name
FROM bookings b
JOIN auth.users u ON b.client_id = u.id
JOIN services s ON b.service_id = s.id
ORDER BY b.created_at DESC;
```

---

## Support

Si vous rencontrez un problème non listé ici :

1. ✅ Vérifier la console du navigateur (F12) pour les erreurs
2. ✅ Vérifier que toutes les migrations sont appliquées
3. ✅ Vérifier que les RLS policies sont actives
4. ✅ Redémarrer le serveur de développement

---

**Date de test :** ___________
**Testeur :** ___________
**Résultat :** ⬜ Réussi / ⬜ Échoué

---

**Version :** 1.0
**Date :** 2026-01-21
