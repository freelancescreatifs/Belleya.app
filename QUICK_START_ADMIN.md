# Quick Start - Créer votre premier Admin

## Étape 1 : Créer le premier compte administrateur

### Option A : Depuis Supabase Dashboard (Recommandé)

1. Connectez-vous à votre [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet Belleya
3. Allez dans **SQL Editor** (dans le menu de gauche)
4. Exécutez cette requête SQL :

```sql
-- Remplacez 'votre-email@example.com' par votre email
UPDATE user_profiles
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'votre-email@example.com'
);
```

5. Vérifiez que la mise à jour a fonctionné :

```sql
SELECT
  up.user_id,
  up.role,
  au.email
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE up.role = 'admin';
```

### Option B : Depuis Table Editor

1. Allez dans **Table Editor**
2. Sélectionnez la table `user_profiles`
3. Trouvez votre utilisateur dans la liste
4. Cliquez sur la ligne pour l'éditer
5. Changez la valeur de `role` de `pro` à `admin`
6. Cliquez sur **Save**

## Étape 2 : Vérifier l'accès

1. Déconnectez-vous de l'application
2. Reconnectez-vous avec le compte que vous venez de promouvoir admin
3. Accédez à `/admin` dans votre navigateur
4. Vous devriez voir le tableau de bord d'administration

## Étape 3 : Tester les permissions

### Test 1 : Vérifier que vous êtes admin

Ouvrez la console du navigateur (F12) et exécutez :

```javascript
const { data } = await supabase.rpc('is_admin');
console.log('Je suis admin:', data);
// Résultat attendu : true
```

### Test 2 : Voir tous les utilisateurs

```javascript
const { data } = await supabase
  .from('user_profiles')
  .select('*');

console.log('Nombre d\'utilisateurs visibles:', data.length);
// Résultat attendu : TOUS les utilisateurs (pas juste vous)
```

### Test 3 : Modifier un autre utilisateur

```javascript
// Remplacez USER_ID par l'ID d'un autre utilisateur
const { error } = await supabase
  .from('user_profiles')
  .update({ first_name: 'Test Admin' })
  .eq('user_id', 'USER_ID');

console.log('Erreur?', error);
// Résultat attendu : null (pas d'erreur)
```

## Étape 4 : Créer un deuxième admin (optionnel)

Une fois connecté en tant qu'admin, vous pouvez créer d'autres admins :

### Via l'interface admin

1. Allez sur `/admin`
2. Cliquez sur l'onglet **Utilisateurs**
3. Trouvez l'utilisateur que vous voulez promouvoir
4. Cliquez sur le bouton **Modifier** (icône crayon)
5. Dans la modale, vous pourriez ajouter une option pour changer le rôle

### Via SQL

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE user_id = 'UUID_DU_NOUVEL_ADMIN';
```

## Étape 5 : Tester la sécurité

### Avec un compte non-admin

1. Créez un nouveau compte ou connectez-vous avec un compte non-admin
2. Essayez d'accéder à `/admin`
3. Vous devriez voir le message "Accès refusé"

### Dans la console

Avec un compte non-admin, testez :

```javascript
const { data } = await supabase.rpc('is_admin');
console.log('Je suis admin:', data);
// Résultat attendu : false
```

```javascript
const { data } = await supabase
  .from('user_profiles')
  .select('*');

console.log('Utilisateurs visibles:', data.length);
// Résultat attendu : 1 (seulement votre profil)
```

## Commandes SQL Utiles

### Voir tous les admins

```sql
SELECT
  up.id,
  up.user_id,
  up.first_name,
  up.last_name,
  up.role,
  au.email,
  au.created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE up.role = 'admin'
ORDER BY up.created_at DESC;
```

### Voir tous les utilisateurs avec leur rôle

```sql
SELECT
  up.role,
  COUNT(*) as count
FROM user_profiles up
GROUP BY up.role
ORDER BY count DESC;
```

### Promouvoir plusieurs utilisateurs en admin

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN (
    'admin1@example.com',
    'admin2@example.com',
    'admin3@example.com'
  )
);
```

### Révoquer les droits admin

```sql
UPDATE user_profiles
SET role = 'pro'
WHERE user_id = 'UUID_DE_LANCIEN_ADMIN';
```

## Fonctionnalités Admin Disponibles

Une fois connecté en tant qu'admin, vous avez accès à :

### Tableau de bord
- KPI des abonnements (Start, Studio, Empire, VIP)
- Statistiques utilisateurs (total, nouveaux, actifs)
- KPI revenus (MRR, ARR, ARPA)
- KPI partenariats (commissions, top partenariats)
- Graphiques mensuels

### Gestion des Utilisateurs
- Voir tous les utilisateurs professionnels
- Modifier leurs abonnements
- Supprimer des utilisateurs
- Filtrer par type d'abonnement
- Exporter en CSV

### Gestion des Clients
- Voir tous les clients
- Modifier leurs informations
- Supprimer des clients
- Exporter en CSV

### Gestion des Partenariats
- Voir tous les partenariats
- Analyser les commissions
- Suivre les revenus
- Exporter en CSV

## Dépannage

### Je ne peux pas accéder à /admin

1. Vérifiez que vous êtes connecté
2. Vérifiez votre rôle dans la base de données :

```sql
SELECT role FROM user_profiles WHERE user_id = auth.uid();
```

3. Vérifiez que la fonction `is_admin()` fonctionne :

```javascript
const { data, error } = await supabase.rpc('is_admin');
console.log('Data:', data, 'Error:', error);
```

### J'ai une erreur RLS

Si vous obtenez des erreurs de type "row-level security policy", c'est normal si vous n'êtes pas admin. Assurez-vous que :

1. Votre rôle est bien `admin` dans `user_profiles`
2. Vous êtes connecté avec le bon compte
3. Les policies RLS ont été créées (vérifiez la migration)

### Je ne vois pas tous les utilisateurs

Si vous êtes admin mais ne voyez que votre profil :

1. Vérifiez les policies RLS :

```sql
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

2. Vérifiez que la policy "Admins can view all profiles" existe
3. Re-exécutez la migration si nécessaire

## Sécurité - Rappels Importants

1. **Ne partagez jamais vos credentials admin**
2. **Limitez le nombre d'admins** au strict nécessaire
3. **Auditez régulièrement** les actions admin
4. **Utilisez des mots de passe forts** pour les comptes admin
5. **Activez l'authentification à deux facteurs** si disponible

## Support

Si vous rencontrez des problèmes :

1. Consultez `ADMIN_SECURITY_GUIDE.md` pour plus de détails sur l'architecture
2. Consultez `ADMIN_USAGE_EXAMPLE.md` pour des exemples de code
3. Vérifiez les logs Supabase dans le Dashboard
4. Testez avec la console du navigateur pour identifier les erreurs

## Résumé des Fichiers Importants

- `supabase/migrations/*_create_admin_system_with_rls.sql` : Migration RLS
- `src/components/shared/AdminRoute.tsx` : Protection de route
- `src/hooks/useIsAdmin.ts` : Hook pour vérifier le rôle
- `src/pages/Admin.tsx` : Page d'administration
- `ADMIN_SECURITY_GUIDE.md` : Documentation complète de sécurité
- `ADMIN_USAGE_EXAMPLE.md` : Exemples de code

Vous êtes maintenant prêt à utiliser le système d'administration sécurisé de Belleya !
