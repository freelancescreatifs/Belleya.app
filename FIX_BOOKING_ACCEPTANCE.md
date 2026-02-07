# Fix Booking Acceptance - Solution Complète

## A) DIAGNOSTIC DU 400 - CAUSE ROOT

### Causes identifiées:
1. **Erreur de relation PostgREST**: `user_profiles!bookings_client_id_fkey`
   - PostgREST ne reconnaît pas cette syntaxe de hint FK explicite
   - La relation implicite fonctionne: `user_profiles(first_name, last_name, phone)`

2. **Trigger incomplet**:
   - `add_booking_to_agenda` créait l'event MAIS PAS le client
   - `auto_create_client_on_booking` écoutait `event_type='pro'` mais le trigger insère `type='client'`

3. **Schema cache**: Pas de problème - les relations existent bien

### Requête SELECT corrigée:
```typescript
// ❌ AVANT (erreur 400)
.select(`
  id,
  service:services(name),
  client:user_profiles!bookings_client_id_fkey(first_name, last_name, phone)
`)

// ✅ APRÈS (fonctionne)
.select(`
  id,
  service:services(name),
  client:user_profiles(first_name, last_name, phone)
`)
```

---

## B) IMPLÉMENTATION - RPC TRANSACTIONNELLE

### Migration appliquée: `fix_booking_acceptance_system.sql`

Cette migration crée une fonction PostgreSQL `accept_booking` qui fait TOUT en 1 seul appel:

#### Fonction RPC `accept_booking(p_booking_id uuid)`

**Ce qu'elle fait:**
1. Vérifie que le booking existe, est `pending`, et appartient au pro connecté
2. Obtient le `company_id` du pro depuis `company_profiles`
3. Récupère les infos client depuis `user_profiles` + `auth.users`
4. **Upsert intelligent du client** dans table `clients`:
   - Cherche par `user_id`, `email` OU `phone`
   - Si trouvé: met à jour `user_id` si manquant
   - Si pas trouvé: crée le client avec `source='booking'`
5. Update booking → `status='confirmed'` (déclenche le trigger qui crée l'event)
6. Récupère l'event créé par le trigger
7. Link l'event au client (update `events.client_id`)
8. Retourne JSON avec IDs et succès

**Signature:**
```sql
accept_booking(p_booking_id uuid) RETURNS jsonb
```

**Retour JSON:**
```json
{
  "success": true,
  "booking_id": "uuid",
  "client_id": "uuid",
  "event_id": "uuid",
  "message": "Réservation acceptée avec succès"
}
```

**En cas d'erreur:**
```json
{
  "success": false,
  "error": "message d'erreur SQL",
  "message": "Erreur lors de l'acceptation de la réservation"
}
```

---

### Code Frontend - Appel de la RPC

**Fichier modifié:** `src/components/dashboard/BookingNotifications.tsx`

```typescript
const handleAcceptBooking = async (notificationId: string, bookingId: string) => {
  setProcessing(bookingId);

  try {
    // ✅ APPEL RPC UNIQUE
    const { data, error: rpcError } = await supabase.rpc('accept_booking', {
      p_booking_id: bookingId
    });

    if (rpcError) throw rpcError;

    if (!data || !data.success) {
      throw new Error(data?.message || 'Erreur lors de l\'acceptation');
    }

    // Marquer la notification comme lue
    const { error: notifError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (notifError) throw notifError;

    // Update UI
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const newDetails = { ...bookingDetails };
    delete newDetails[bookingId];
    setBookingDetails(newDetails);

    alert('Réservation acceptée avec succès ! Le client et le rendez-vous ont été ajoutés automatiquement.');
  } catch (error) {
    console.error('Error accepting booking:', error);
    alert('Erreur lors de l\'acceptation de la réservation');
  } finally {
    setProcessing(null);
  }
};
```

**Bénéfices:**
- 1 seul appel au lieu de 3+ requêtes
- Transaction atomique (tout passe ou rien)
- Pas de race conditions
- Gestion d'erreur centralisée

---

## C) SCHÉMA BASE DE DONNÉES

### Tables impliquées:

#### `bookings`
```sql
CREATE TABLE bookings (
  id uuid PRIMARY KEY,
  client_id uuid REFERENCES auth.users(id),
  pro_id uuid REFERENCES auth.users(id),
  service_id uuid REFERENCES services(id),
  appointment_date timestamptz NOT NULL,
  duration integer NOT NULL,
  price decimal(10, 2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### `clients` (schéma attendu)
```sql
CREATE TABLE clients (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  status text DEFAULT 'active',
  source text, -- 'booking', 'manual', etc.
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**✅ Colonne `company_id` ajoutée automatiquement** par la migration si manquante.

#### `events` (agenda)
```sql
CREATE TABLE events (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES company_profiles(id) ON DELETE CASCADE,
  type text CHECK (type IN ('client', 'personal', 'google', 'planity')),
  title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  status text DEFAULT 'confirmed',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**✅ `events.end_at` existe déjà** - pas de migration nécessaire.

---

## D) RLS POLICIES

### Policies créées/vérifiées par la migration:

#### Sur `bookings` (existantes):
```sql
-- Les pros peuvent voir leurs bookings
CREATE POLICY "Pros can view bookings for their services"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = pro_id);

-- Les pros peuvent update leurs bookings
CREATE POLICY "Pros can update bookings for their services"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = pro_id)
  WITH CHECK (auth.uid() = pro_id);
```

#### Sur `clients` (nouvelles):
```sql
-- Les pros peuvent voir les clients de leur company
CREATE POLICY "Pros can view own company clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );

-- Les pros peuvent créer des clients pour leur company
CREATE POLICY "Pros can insert clients for their company"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT id FROM company_profiles WHERE user_id = auth.uid()
    )
  );
```

#### Sur `events` (existantes):
```sql
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

**✅ Toutes les policies nécessaires sont en place.**

---

## E) VÉRIFICATIONS SQL

### Pour confirmer les relations:

```sql
-- 1. Vérifier la FK bookings → auth.users
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name='bookings' AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name='client_id';

-- 2. Vérifier que company_id existe dans clients
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN ('company_id', 'user_id', 'email', 'phone');

-- 3. Tester la RPC
SELECT accept_booking('uuid-test-booking-id');
```

---

## F) RELOAD SCHEMA CACHE (si nécessaire)

Si PostgREST ne voit pas la nouvelle RPC:

```bash
# Via Supabase CLI
supabase db reset --linked

# Ou forcer le reload PostgREST (pas nécessaire sur Supabase Cloud - fait auto)
curl -X POST https://your-project.supabase.co/rest/v1/rpc/accept_booking \
  -H "apikey: YOUR_ANON_KEY"
```

**Sur Supabase Cloud**: Le schema cache se recharge automatiquement après une migration.

---

## RÉSUMÉ - CE QUI A ÉTÉ FAIT

✅ **Migration SQL appliquée avec succès**
- RPC `accept_booking` créée
- Colonne `company_id` ajoutée à `clients`
- Policies RLS créées
- Trigger `auto_create_client_on_booking` corrigé (désactivé)
- Fonction helper `get_company_id_for_user` ajoutée

✅ **Code frontend mis à jour**
- Fix de la requête SELECT (suppression du hint FK explicite)
- Remplacement de l'UPDATE par l'appel RPC
- Gestion d'erreur améliorée
- Message de confirmation ajouté

✅ **Build réussi** - projet compilé sans erreur

---

## TESTING - CHECKLIST

Pour tester l'acceptation de réservation:

1. **Créer une réservation test** (côté client)
2. **Côté prestataire, cliquer sur "Accepter"**
3. **Vérifier:**
   - ✅ Notification disparaît
   - ✅ Client créé dans table `clients`
   - ✅ Event créé dans l'agenda (table `events`)
   - ✅ Event lié au client (`events.client_id` renseigné)
   - ✅ Booking passé à `status='confirmed'`
   - ✅ Message de succès affiché

4. **Tester un double clic** → pas de doublon client (upsert intelligent)

---

## AVANTAGES DE LA SOLUTION

1. **Atomicité** - Transaction SQL garantit la cohérence
2. **Performance** - 1 seul round-trip au lieu de 3+
3. **Sécurité** - Tout le code métier côté serveur (SECURITY DEFINER)
4. **Maintenabilité** - Logique centralisée dans la RPC
5. **Réutilisabilité** - La RPC peut être appelée depuis n'importe où
6. **Robustesse** - Gestion d'erreur complète avec rollback automatique
