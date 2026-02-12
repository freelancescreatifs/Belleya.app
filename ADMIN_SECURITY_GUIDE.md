# Guide de Sécurité - Système d'Administration

## Vue d'ensemble

Le système d'administration de Belleya est entièrement sécurisé avec Row Level Security (RLS) au niveau de la base de données. Toutes les vérifications sont faites côté backend, pas seulement dans l'interface.

## Architecture de Sécurité

### 1. Rôles disponibles

La table `user_profiles` contient un champ `role` avec 3 valeurs possibles :
- `client` : Utilisateur client (accès limité)
- `pro` : Professionnel/Prestataire (accès standard)
- `admin` : Administrateur (accès complet)

### 2. Row Level Security (RLS)

#### Policies pour les utilisateurs normaux (client/pro)

```sql
-- SELECT : Voir uniquement son propre profil
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- UPDATE : Modifier uniquement son propre profil
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### Policies pour les administrateurs

```sql
-- SELECT : Voir TOUS les profils
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- UPDATE : Modifier TOUS les profils
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- DELETE : Supprimer TOUS les profils
CREATE POLICY "Admins can delete all profiles"
  ON user_profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );
```

### 3. Fonction RPC Sécurisée

Une fonction `is_admin()` est disponible pour vérifier le rôle depuis le frontend :

```typescript
const { data, error } = await supabase.rpc('is_admin');
// data === true si l'utilisateur est admin, false sinon
```

Cette fonction est `SECURITY DEFINER`, ce qui signifie qu'elle s'exécute avec les privilèges du propriétaire de la fonction, garantissant que la vérification ne peut pas être contournée.

## Protection des Routes Frontend

### Composant AdminRoute

Le composant `AdminRoute` protège l'accès aux pages admin :

```tsx
import { AdminRoute } from './components/shared/AdminRoute';

function App() {
  return (
    <AdminRoute>
      <AdminPage />
    </AdminRoute>
  );
}
```

Ce composant :
1. Vérifie si l'utilisateur est connecté
2. Appelle la fonction RPC `is_admin()` côté backend
3. Affiche un message d'erreur si l'accès est refusé
4. Affiche le contenu si l'utilisateur est admin

## Comment créer le premier administrateur

### Option 1 : Depuis Supabase Dashboard (Recommandé)

1. Connectez-vous à votre Supabase Dashboard
2. Allez dans `SQL Editor`
3. Exécutez cette requête en remplaçant l'email :

```sql
-- Trouver l'ID de l'utilisateur
SELECT id, email FROM auth.users WHERE email = 'votre-email@example.com';

-- Mettre à jour le rôle en admin
UPDATE user_profiles
SET role = 'admin'
WHERE user_id = 'UUID_DE_LUTILISATEUR';
```

### Option 2 : Depuis le code (pour le premier déploiement)

Créez une migration qui définit le premier admin :

```sql
-- Dans une nouvelle migration
UPDATE user_profiles
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@belleya.com'
);
```

### Option 3 : Depuis la console Supabase Table Editor

1. Allez dans `Table Editor`
2. Sélectionnez la table `user_profiles`
3. Trouvez votre ligne utilisateur
4. Modifiez la colonne `role` de `pro` à `admin`
5. Sauvegardez

## Permissions des Admins

Les administrateurs ont accès complet à :

### user_profiles
- SELECT : Voir tous les utilisateurs
- UPDATE : Modifier les informations de tous les utilisateurs
- DELETE : Supprimer des utilisateurs
- INSERT : Créer de nouveaux utilisateurs

### subscriptions
- SELECT : Voir tous les abonnements
- UPDATE : Modifier tous les abonnements
- DELETE : Supprimer des abonnements
- INSERT : Créer de nouveaux abonnements

### company_profiles
- SELECT : Voir tous les profils d'entreprise
- UPDATE : Modifier tous les profils d'entreprise
- DELETE : Supprimer des profils d'entreprise

## Fonctionnalités de la page Admin

La page `/admin` permet aux administrateurs de :

1. **Tableau de bord**
   - Voir les KPI des abonnements (Start, Studio, Empire, VIP)
   - Voir les statistiques utilisateurs
   - Analyser les revenus et commissions
   - Consulter les graphiques mensuels

2. **Gestion des utilisateurs**
   - Voir tous les utilisateurs (pros et clients)
   - Modifier les abonnements
   - Supprimer des utilisateurs
   - Exporter les données en CSV

3. **Gestion des clients**
   - Voir tous les clients
   - Modifier les informations client
   - Supprimer des clients

4. **Gestion des partenariats**
   - Voir tous les partenariats
   - Analyser les commissions
   - Suivre les revenus par partenariat

## Sécurité - Points importants

1. **Vérification côté backend** : Toutes les vérifications de permissions sont faites au niveau de la base de données via RLS. Même si quelqu'un modifie le code frontend, il ne pourra pas contourner la sécurité.

2. **Pas de confiance du frontend** : Le frontend ne peut jamais forcer l'accès. Les policies RLS bloquent toute tentative non autorisée.

3. **Fonction SECURITY DEFINER** : La fonction `is_admin()` ne peut pas être manipulée car elle s'exécute avec les privilèges de la base de données.

4. **Audit trail** : Utilisez la colonne `modified_by_admin_id` dans `subscriptions` pour tracer qui a modifié quoi.

## Tests de Sécurité

### Tester qu'un utilisateur normal ne peut pas accéder aux données admin

```typescript
// En tant qu'utilisateur normal (role = 'pro')
const { data, error } = await supabase
  .from('user_profiles')
  .select('*');

// Résultat : Vous ne verrez QUE votre propre profil, pas les autres
```

### Tester qu'un admin peut tout voir

```typescript
// En tant qu'admin (role = 'admin')
const { data, error } = await supabase
  .from('user_profiles')
  .select('*');

// Résultat : Vous verrez TOUS les profils
```

## Maintenance

### Ajouter un nouvel admin

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE user_id = 'UUID_DU_NOUVEL_ADMIN';
```

### Révoquer les droits admin

```sql
UPDATE user_profiles
SET role = 'pro'
WHERE user_id = 'UUID_DE_LANCIEN_ADMIN';
```

### Lister tous les admins

```sql
SELECT
  up.id,
  up.user_id,
  up.first_name,
  up.last_name,
  au.email,
  up.created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE up.role = 'admin';
```

## Migration SQL Complète

La migration `create_admin_system_with_rls` contient :
- Mise à jour de la contrainte CHECK pour autoriser 'admin'
- Index sur la colonne role
- Policies RLS pour users et admins
- Fonction `is_admin()` sécurisée
- Policies pour subscriptions et company_profiles
- Fonction `get_user_role()` helper

Toutes les vérifications sont au niveau de la base de données, garantissant une sécurité maximale.
