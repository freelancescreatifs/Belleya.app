# Fix Booking Acceptance - Solution Finale

## DIAGNOSTIC - Erreur identifiée

**Erreur:** "Erreur lors de l'acceptation de la réservation" quand j'accepte un booking

**Cause root:** La fonction `accept_booking` essayait d'insérer une colonne `source` qui **n'existe PAS** dans la table `clients`.

### Schéma réel de `clients`:
```sql
CREATE TABLE clients (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) NOT NULL, -- ⚠️ Référence profiles, pas auth.users!
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  email text,
  -- ... autres colonnes ...
  company_id uuid REFERENCES company_profiles(id),
  status text DEFAULT 'regular',
  notes text,
  -- PAS de colonne "source" ❌
);
```

### Point clé - Relations FK:
- `bookings.client_id` → `auth.users.id`
- `clients.user_id` → `profiles.id` (qui est = `auth.users.id`)
- `profiles.id` = `auth.users.id` (pas de FK explicite, c'est une table extension)

---

## SOLUTION APPLIQUÉE

### Migration 1: `fix_accept_booking_rpc_robust`
- Amélioration de la gestion d'erreur
- Ajout de fallback entre user_profiles et profiles
- Meilleure robustesse générale

### Migration 2: `fix_accept_booking_remove_source_column`
**Migration finale qui corrige le vrai problème:**

```sql
CREATE OR REPLACE FUNCTION accept_booking(p_booking_id uuid)
RETURNS jsonb
AS $$
DECLARE
  v_booking record;
  v_client_id uuid;
  v_event_id uuid;
  v_company_id uuid;
  v_first_name text;
  v_last_name text;
  v_phone text;
  v_email text;
BEGIN
  -- 1. Vérifier booking pending
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
    AND status = 'pending'
    AND pro_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking not found or not pending',
      'message', 'Réservation introuvable ou déjà traitée'
    );
  END IF;

  -- 2. Obtenir company_id du pro
  SELECT id INTO v_company_id
  FROM company_profiles
  WHERE user_id = auth.uid();

  -- 3. Obtenir infos client depuis user_profiles
  SELECT
    COALESCE(first_name, ''),
    COALESCE(last_name, ''),
    phone
  INTO v_first_name, v_last_name, v_phone
  FROM user_profiles
  WHERE user_id = v_booking.client_id;

  -- 4. Obtenir email depuis auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_booking.client_id;

  -- Fallback si pas de nom
  IF v_first_name = '' THEN
    v_first_name := COALESCE(SPLIT_PART(v_email, '@', 1), 'Client');
  END IF;

  IF v_last_name = '' THEN
    v_last_name := COALESCE(SPLIT_PART(v_email, '@', 2), '');
  END IF;

  -- 5. Upsert client
  SELECT id INTO v_client_id
  FROM clients
  WHERE company_id = v_company_id
    AND (
      user_id = v_booking.client_id
      OR (email = v_email AND v_email IS NOT NULL)
      OR (phone = v_phone AND v_phone IS NOT NULL)
    )
  LIMIT 1;

  IF v_client_id IS NULL THEN
    -- ✅ INSERT sans la colonne "source"
    INSERT INTO clients (
      company_id,
      user_id,
      first_name,
      last_name,
      email,
      phone,
      status,  -- ✅ Utiliser 'regular' au lieu de 'active'
      notes
    ) VALUES (
      v_company_id,
      v_booking.client_id,  -- ✅ user_id = booking.client_id (= auth.users.id = profiles.id)
      v_first_name,
      v_last_name,
      COALESCE(v_email, ''),
      v_phone,
      'regular',  -- ✅ Valeur par défaut correcte pour status
      'Client créé automatiquement lors de l''acceptation de la réservation'
    )
    RETURNING id INTO v_client_id;
  END IF;

  -- 6. Update booking → confirmed (trigger crée l'event)
  UPDATE bookings
  SET status = 'confirmed', updated_at = now()
  WHERE id = p_booking_id;

  -- 7. Récupérer l'event créé par le trigger
  SELECT id INTO v_event_id
  FROM events
  WHERE user_id = auth.uid()
    AND service_id = v_booking.service_id
    AND start_at = v_booking.appointment_date
    AND type = 'client'
  ORDER BY created_at DESC
  LIMIT 1;

  -- 8. Link event au client
  IF v_event_id IS NOT NULL THEN
    UPDATE events
    SET client_id = v_client_id
    WHERE id = v_event_id;
  END IF;

  -- 9. Retour JSON
  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'client_id', v_client_id,
    'event_id', v_event_id,
    'message', 'Réservation acceptée avec succès'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE,
      'message', 'Erreur lors de l''acceptation: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## CODE FRONTEND - Debugging amélioré

**Fichier modifié:** `src/components/dashboard/BookingNotifications.tsx`

```typescript
const handleAcceptBooking = async (notificationId: string, bookingId: string) => {
  setProcessing(bookingId);

  try {
    console.log('Calling accept_booking RPC with booking_id:', bookingId);

    const { data, error: rpcError } = await supabase.rpc('accept_booking', {
      p_booking_id: bookingId
    });

    console.log('RPC Response:', { data, error: rpcError });

    if (rpcError) {
      console.error('RPC Error details:', {
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code
      });
      throw rpcError;
    }

    if (!data || !data.success) {
      const errorMsg = data?.error || data?.message || 'Erreur lors de l\'acceptation';
      console.error('RPC returned failure:', data);
      throw new Error(errorMsg);
    }

    console.log('Booking accepted successfully:', data);

    // Marquer notification comme lue
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

  } catch (error: any) {
    console.error('Error accepting booking:', error);
    const errorMessage = error?.message || error?.details || 'Erreur lors de l\'acceptation de la réservation';
    alert(`Erreur: ${errorMessage}`);
  } finally {
    setProcessing(null);
  }
};
```

**Changements:**
- Ajout de `console.log` pour tracer l'appel RPC
- Log des erreurs détaillées (message, details, hint, code)
- Affichage de l'erreur SQL exacte dans l'alert pour debug
- Log du retour JSON complet

---

## TEST - Comment vérifier que ça marche

### 1. Ouvrir la console navigateur
```
F12 → Console
```

### 2. Créer une réservation côté client

### 3. Côté pro, cliquer sur "Accepter"

### 4. Observer les logs console:
```
Calling accept_booking RPC with booking_id: xxxx-xxxx-xxxx
RPC Response: { data: { success: true, ... }, error: null }
Booking accepted successfully: { success: true, booking_id: ..., client_id: ..., event_id: ... }
```

### 5. Vérifier en base:
```sql
-- Le client a été créé
SELECT * FROM clients WHERE email = 'email-du-client';

-- L'event a été créé
SELECT * FROM events WHERE client_id = 'uuid-du-client' AND type = 'client';

-- Le booking est confirmé
SELECT * FROM bookings WHERE id = 'uuid-du-booking' AND status = 'confirmed';
```

---

## EN CAS D'ERREUR

Si tu vois encore une erreur, regarde les logs console qui afficheront maintenant:

1. **L'erreur SQL exacte** (`SQLERRM`)
2. **Le code d'erreur** (`SQLSTATE`)
3. **Les détails PostgREST** (details, hint)

**Exemple de debug:**
```
RPC Error details: {
  message: "column \"source\" of relation \"clients\" does not exist",
  details: null,
  hint: null,
  code: "42703"
}
```

Avec ces informations, on peut identifier précisément le problème.

---

## RÉSUMÉ DES CORRECTIONS

✅ **Suppression de la colonne `source`** dans l'INSERT (n'existe pas)
✅ **Utilisation de `status = 'regular'`** au lieu de `'active'`
✅ **Mapping correct:** `clients.user_id = bookings.client_id`
✅ **Gestion d'erreur robuste** avec EXCEPTION et retour JSON détaillé
✅ **Logs frontend** pour tracer l'exécution et identifier les erreurs
✅ **Build réussi** sans erreur

---

## SCHÉMA DES RELATIONS

```
auth.users (id)
    ↓
    = profiles.id (extension de auth.users)
    ↓
    ← clients.user_id (FK vers profiles.id)
    ↓
    ← bookings.client_id (FK vers auth.users.id)

Donc:
bookings.client_id = auth.users.id = profiles.id = clients.user_id ✅
```

**Conclusion:** Le problème était simplement que la colonne `source` n'existait pas dans la table `clients`. La fonction essayait de l'insérer, ce qui causait une erreur SQL "column does not exist".
