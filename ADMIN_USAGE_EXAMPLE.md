# Exemple d'Utilisation - Protection Route Admin

## Comment protéger la route /admin

### Dans App.tsx

```tsx
import { AdminRoute } from './components/shared/AdminRoute';
import Admin from './pages/Admin';

// Dans votre système de routing
<Route path="/admin" element={
  <AdminRoute>
    <Admin />
  </AdminRoute>
} />
```

## Vérification du rôle admin dans n'importe quel composant

### Exemple 1 : Vérifier si l'utilisateur est admin

```tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function MyComponent() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data } = await supabase.rpc('is_admin');
    setIsAdmin(data === true);
  };

  return (
    <div>
      {isAdmin && (
        <button>Action réservée aux admins</button>
      )}
    </div>
  );
}
```

### Exemple 2 : Afficher un bouton conditionnel

```tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield } from 'lucide-react';

function Header() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data } = await supabase.rpc('is_admin');
    setIsAdmin(data === true);
  };

  return (
    <nav>
      {/* Autres liens */}

      {isAdmin && (
        <a href="/admin" className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Administration
        </a>
      )}
    </nav>
  );
}
```

### Exemple 3 : Récupérer le rôle d'un utilisateur spécifique

```tsx
const getUserRole = async (userId: string) => {
  const { data } = await supabase.rpc('get_user_role', {
    target_user_id: userId
  });

  return data; // 'admin', 'pro', ou 'client'
};
```

## Opérations Admin depuis le Frontend

### Modifier le rôle d'un utilisateur

```tsx
const promoteToAdmin = async (userId: string) => {
  // Cette opération ne fonctionnera QUE si l'utilisateur connecté est admin
  const { error } = await supabase
    .from('user_profiles')
    .update({ role: 'admin' })
    .eq('user_id', userId);

  if (error) {
    console.error('Erreur:', error);
    // Si vous n'êtes pas admin, vous obtiendrez une erreur RLS
  }
};
```

### Modifier un abonnement

```tsx
const updateSubscription = async (companyId: string, planType: string) => {
  // Cette opération ne fonctionnera QUE si l'utilisateur connecté est admin
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan_type: planType,
      subscription_status: 'active'
    })
    .eq('company_id', companyId);

  if (error) {
    console.error('Erreur:', error);
  }
};
```

### Voir tous les utilisateurs

```tsx
const getAllUsers = async () => {
  // Cette requête ne retournera TOUS les utilisateurs QUE si vous êtes admin
  // Sinon, vous ne verrez que votre propre profil
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      company_profiles(*)
    `);

  return data;
};
```

### Supprimer un utilisateur

```tsx
const deleteUser = async (userId: string) => {
  // Suppression via l'API Admin de Supabase
  // Cette fonction nécessite les credentials service_role
  // À utiliser uniquement côté backend ou dans un contexte sécurisé
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error('Erreur lors de la suppression:', error);
  }
};
```

## Hook Custom pour la vérification Admin

### useIsAdmin.ts

```tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase.rpc('is_admin');
      setIsAdmin(data === true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading };
}
```

### Utilisation du hook

```tsx
import { useIsAdmin } from '../hooks/useIsAdmin';

function MyComponent() {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      {isAdmin ? (
        <AdminPanel />
      ) : (
        <UserPanel />
      )}
    </div>
  );
}
```

## Protection Multiple Niveaux

### Sidebar avec liens conditionnels

```tsx
import { useIsAdmin } from '../hooks/useIsAdmin';
import { Shield, Users, Settings } from 'lucide-react';

function Sidebar() {
  const { isAdmin } = useIsAdmin();

  return (
    <aside>
      <nav>
        <a href="/dashboard">
          <Settings />
          Tableau de bord
        </a>

        <a href="/clients">
          <Users />
          Clients
        </a>

        {/* Lien visible uniquement pour les admins */}
        {isAdmin && (
          <a href="/admin" className="bg-red-50 border-red-200">
            <Shield />
            Administration
          </a>
        )}
      </nav>
    </aside>
  );
}
```

## Tests de Sécurité Frontend

### Test 1 : Vérifier que is_admin() fonctionne

```tsx
const testIsAdmin = async () => {
  const { data, error } = await supabase.rpc('is_admin');
  console.log('Is admin?', data);
  console.log('Error?', error);
};
```

### Test 2 : Tenter d'accéder aux données admin sans être admin

```tsx
const testUnauthorizedAccess = async () => {
  // Si vous n'êtes pas admin, cette requête ne retournera que VOTRE profil
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*');

  console.log('Data accessible:', data);
  // Résultat attendu : 1 seul résultat (votre propre profil)
};
```

### Test 3 : Tenter de modifier un autre utilisateur

```tsx
const testUnauthorizedUpdate = async (otherUserId: string) => {
  // Si vous n'êtes pas admin, cette requête échouera
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ first_name: 'Hacker' })
    .eq('user_id', otherUserId);

  console.log('Error:', error);
  // Résultat attendu : Error avec message RLS policy violation
};
```

## Résumé

1. **Protection de route** : Utilisez `<AdminRoute>` pour protéger les pages admin
2. **Vérification conditionnelle** : Utilisez `supabase.rpc('is_admin')` pour vérifier le rôle
3. **Hook custom** : Créez `useIsAdmin()` pour réutiliser la logique
4. **Opérations sécurisées** : Toutes les opérations sont protégées par RLS côté backend
5. **Aucune confiance du frontend** : Même si le frontend est modifié, RLS bloque les accès non autorisés

La sécurité est garantie au niveau de la base de données, pas seulement dans l'interface.
