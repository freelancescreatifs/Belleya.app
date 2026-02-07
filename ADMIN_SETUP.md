# Configuration de l'accès Admin

## Vue d'ensemble

Un système d'administration sécurisé a été mis en place avec:
- Authentification par rôles en base de données
- Protection RLS (Row Level Security)
- Onglet Admin visible uniquement pour les administrateurs
- Dashboard KPI complet avec métriques SaaS
- Gestion des utilisateurs et partenariats
- Exports CSV

## Comment devenir administrateur

### Étape 1: Trouver votre User ID

Connectez-vous à votre compte Supabase et exécutez cette requête SQL pour trouver votre user_id:

```sql
SELECT id, email FROM auth.users WHERE email = 'votre.email@example.com';
```

### Étape 2: S'assigner le rôle admin

Une fois que vous avez votre user_id, exécutez cette requête pour vous donner les droits admin:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('VOTRE_USER_ID_ICI', 'admin')
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin';
```

Exemple:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin')
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin';
```

### Étape 3: Vérifier l'accès

1. Déconnectez-vous de l'application
2. Reconnectez-vous
3. L'onglet "Administration" devrait maintenant apparaître dans le menu latéral (en bas, juste au-dessus de "Paramètres")

## Fonctionnalités de l'espace Admin

### Dashboard KPI

**Utilisateurs:**
- Utilisateurs total
- Nouveaux utilisateurs (30 derniers jours)
- Utilisateurs actifs

**Revenus & Abonnements:**
- MRR (Monthly Recurring Revenue) en €
- ARR (Annual Recurring Revenue) en €
- ARPA (Average Revenue Per Account) en €
- Churn mensuel (à activer)

**Partenariats:**
- Revenus du mois en €
- Commission moyenne en %
- Top partenariat
- Montant à encaisser en €

### Gestion des utilisateurs

- Liste complète avec recherche
- Colonnes: email, rôle, date d'inscription, dernier login
- Export CSV

### Gestion des partenariats

- Liste complète avec recherche
- Colonnes: entreprise, utilisateur, type, commission, statut, revenus mensuels
- Badge "Programme officiel" pour Belleya
- Export CSV

## Sécurité

### Protection RLS

Toutes les données admin sont protégées par Row Level Security:
- Seuls les utilisateurs avec `role = 'admin'` peuvent accéder aux données
- Les fonctions SQL utilisent `SECURITY DEFINER` pour vérifier les permissions
- L'accès direct à la page `/admin` affiche un message "Accès refusé" pour les non-admins

### Vérification côté serveur

Le rôle est vérifié dans la base de données, pas dans le frontend:
- Impossible de contourner en modifiant le code JavaScript
- Toutes les requêtes vérifient le rôle via `is_admin()` et `is_current_user_admin()`

## Ajouter d'autres administrateurs

Pour ajouter un autre administrateur, exécutez:

```sql
-- Trouver l'utilisateur
SELECT id, email FROM auth.users WHERE email = 'nouvel.admin@example.com';

-- Assigner le rôle admin
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_DU_NOUVEL_ADMIN', 'admin')
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin';
```

## Retirer les droits admin

Pour retirer les droits admin à un utilisateur:

```sql
UPDATE user_roles
SET role = 'user'
WHERE user_id = 'USER_ID_A_RETIRER';
```

## Support

Si vous ne voyez pas l'onglet Admin après avoir suivi ces étapes:
1. Vérifiez que la requête SQL a bien été exécutée
2. Déconnectez-vous et reconnectez-vous
3. Vérifiez que votre user_id est correct dans la table `user_roles`
4. Consultez la console du navigateur pour d'éventuelles erreurs

## Notes techniques

- Table: `user_roles`
- Fonction de vérification: `is_admin(uuid)` et `is_current_user_admin()`
- Views: `admin_user_stats`, `admin_partnership_stats`
- Component: `src/pages/Admin.tsx`
- Route: `/admin` via `App.tsx`
