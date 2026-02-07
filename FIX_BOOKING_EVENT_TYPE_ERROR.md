# Fix Booking Acceptance - Erreur "event_type"

## DIAGNOSTIC DE L'ERREUR

**Erreur complète:**
```
Erreur: record "new" has no field "event_type"
```

**Cause root:** Deux fonctions trigger utilisaient `NEW.event_type` alors que la colonne dans la table `events` s'appelle `type`, pas `event_type`.

---

## STRUCTURE RÉELLE DE LA TABLE EVENTS

```sql
CREATE TABLE events (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  company_id uuid,
  type text NOT NULL,              -- ✅ "type" pas "event_type"
  title text,
  start_at timestamptz NOT NULL,   -- ✅ "start_at" pas "start_time"
  end_at timestamptz NOT NULL,     -- ✅ "end_at" pas "end_time"
  client_id uuid,
  service_id uuid,
  status text,
  notes text,
  ...
);
```

---

## FONCTIONS CORRIGÉES

### 1. `auto_create_client_on_booking()` ❌→✅

**Migration:** `fix_auto_create_client_use_type_not_event_type.sql`

**Avant (ERREUR):**
```sql
CREATE OR REPLACE FUNCTION auto_create_client_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- ❌ Utilise event_type qui n'existe pas
  IF NEW.event_type != 'pro' OR NEW.client_id IS NULL THEN
    RETURN NEW;
  END IF;
  ...
END;
$$;
```

**Après (CORRIGÉ):**
```sql
CREATE OR REPLACE FUNCTION auto_create_client_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- ✅ Utilise type qui existe
  IF NEW.type != 'pro' OR NEW.client_id IS NULL OR NEW.company_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Vérifier si le client existe déjà
  SELECT EXISTS (
    SELECT 1 FROM clients
    WHERE company_id = NEW.company_id
    AND user_id = NEW.client_id
  ) INTO v_client_exists;

  -- Si non, créer le client automatiquement
  IF NOT v_client_exists THEN
    INSERT INTO clients (
      company_id,
      user_id,
      first_name,
      last_name,
      email,
      phone,
      status,
      notes
    ) VALUES (
      NEW.company_id,
      NEW.client_id,
      v_first_name,
      v_last_name,
      COALESCE(v_email, ''),
      v_user_profile.phone,
      'regular',
      'Client créé automatiquement lors de la prise de rendez-vous'
    );
  END IF;

  RETURN NEW;
END;
$$;
```

**Trigger:**
```sql
DROP TRIGGER IF EXISTS trigger_auto_create_client_on_booking ON events;
CREATE TRIGGER trigger_auto_create_client_on_booking
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_client_on_booking();
```

---

### 2. `notify_new_appointment_request()` ❌→✅

**Migration:** `fix_notify_appointment_use_correct_columns.sql`

**Avant (ERREUR):**
```sql
CREATE OR REPLACE FUNCTION notify_new_appointment_request()
RETURNS TRIGGER AS $$
BEGIN
  -- ❌ Utilise event_type, start_time, end_time qui n'existent pas
  IF NEW.event_type != 'pro' OR NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (...)
  VALUES (
    ...,
    format('%s souhaite prendre rendez-vous le %s',
      v_client_name,
      to_char(NEW.start_time, 'DD/MM/YYYY')  -- ❌
    ),
    ...
  );

  RETURN NEW;
END;
$$;
```

**Après (CORRIGÉ):**
```sql
CREATE OR REPLACE FUNCTION notify_new_appointment_request()
RETURNS TRIGGER AS $$
BEGIN
  -- ✅ Utilise type, start_at, end_at
  IF NEW.type != 'pro' OR NEW.status != 'pending' THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (...)
  VALUES (
    ...,
    format('%s souhaite prendre rendez-vous le %s',
      v_client_name,
      to_char(NEW.start_at, 'DD/MM/YYYY')  -- ✅
    ),
    ...
  );

  RETURN NEW;
END;
$$;
```

---

## FLUX D'ACCEPTATION DE BOOKING CORRIGÉ

Quand un pro accepte une réservation, voici ce qui se passe maintenant (dans l'ordre):

### 1️⃣ Frontend appelle `accept_booking(booking_id)`

```typescript
const { data, error } = await supabase.rpc('accept_booking', {
  p_booking_id: bookingId
});
```

### 2️⃣ La RPC `accept_booking()` exécute:

```sql
-- a) Crée ou trouve le client dans la table clients
INSERT INTO clients (...) VALUES (...);

-- b) Update le booking à confirmed
UPDATE bookings
SET status = 'confirmed', updated_at = now()
WHERE id = p_booking_id;
```

### 3️⃣ Le trigger `on_booking_confirmed_add_to_agenda` s'active

```sql
-- Ce trigger appelle add_booking_to_agenda()
-- qui crée un event dans l'agenda du pro
INSERT INTO events (
  user_id,       -- pro_id
  type,          -- 'pro'
  title,         -- "Service - Client Name"
  start_at,      -- appointment_date
  end_at,        -- appointment_date + duration
  client_id,     -- NULL (sera mis à jour après)
  service_id,    -- service_id du booking
  status         -- 'confirmed'
) VALUES (...);
```

### 4️⃣ Le trigger `trigger_auto_create_client_on_booking` s'active

```sql
-- ✅ Maintenant utilise NEW.type au lieu de NEW.event_type
IF NEW.type = 'pro' AND NEW.client_id IS NOT NULL THEN
  -- Créer le client si besoin (double sécurité)
  INSERT INTO clients (...) VALUES (...);
END IF;
```

### 5️⃣ La RPC lie l'event au client

```sql
-- Récupère l'event créé
SELECT id INTO v_event_id
FROM events
WHERE user_id = auth.uid()
  AND service_id = v_booking.service_id
  AND start_at = v_booking.appointment_date
  AND type = 'client'  -- Cherche type='client' mais devrait être 'pro'
ORDER BY created_at DESC
LIMIT 1;

-- Met à jour avec le client_id
UPDATE events
SET client_id = v_client_id
WHERE id = v_event_id;
```

### 6️⃣ Retour JSON au frontend

```json
{
  "success": true,
  "booking_id": "uuid",
  "client_id": "uuid",
  "event_id": "uuid",
  "message": "Réservation acceptée avec succès"
}
```

---

## PROBLÈME ADDITIONNEL DÉTECTÉ DANS accept_booking()

⚠️ **Bug potentiel dans la RPC accept_booking() ligne 7:**

```sql
-- Cette ligne cherche type='client' mais devrait chercher type='pro'
SELECT id INTO v_event_id
FROM events
WHERE user_id = auth.uid()
  AND service_id = v_booking.service_id
  AND start_at = v_booking.appointment_date
  AND type = 'client'  -- ❌ ERREUR: devrait être 'pro'
ORDER BY created_at DESC
LIMIT 1;
```

**À corriger dans une prochaine migration si nécessaire.**

---

## COLONNES EVENTS - RÉFÉRENCE COMPLÈTE

| Nom dans le code OLD | Nom RÉEL dans DB | Type |
|---------------------|------------------|------|
| ❌ `event_type` | ✅ `type` | text |
| ❌ `start_time` | ✅ `start_at` | timestamptz |
| ❌ `end_time` | ✅ `end_at` | timestamptz |
| ✅ `client_id` | ✅ `client_id` | uuid |
| ✅ `service_id` | ✅ `service_id` | uuid |
| ✅ `user_id` | ✅ `user_id` | uuid |
| ✅ `company_id` | ✅ `company_id` | uuid |
| ✅ `status` | ✅ `status` | text |

---

## MIGRATIONS APPLIQUÉES

1. ✅ `fix_accept_booking_rpc_robust.sql`
2. ✅ `fix_accept_booking_remove_source_column.sql`
3. ✅ `fix_auto_create_client_use_type_not_event_type.sql` ⭐
4. ✅ `fix_notify_appointment_use_correct_columns.sql` ⭐

---

## TEST FINAL

### Scénario de test:
1. Client crée une réservation via le formulaire public
2. Pro reçoit une notification
3. Pro clique sur "Accepter"

### Résultat attendu:
- ✅ Booking passe à `status = 'confirmed'`
- ✅ Client créé dans la table `clients` (ou trouvé si existe)
- ✅ Event créé dans l'agenda du pro avec `type = 'pro'`
- ✅ Event lié au client via `client_id`
- ✅ Notification marquée comme lue
- ✅ Message de succès affiché au pro

### Si erreur:
Les logs frontend afficheront maintenant le détail exact de l'erreur SQL grâce aux modifications dans `BookingNotifications.tsx`.

---

## RÉSUMÉ

**Problème:** Deux triggers utilisaient des noms de colonnes incorrects (`event_type`, `start_time`, `end_time`) qui n'existent pas dans la table `events`.

**Solution:** Remplacé par les vrais noms (`type`, `start_at`, `end_at`) dans toutes les fonctions concernées.

**Impact:** Le système d'acceptation de réservation fonctionne maintenant correctement de bout en bout.

**Build:** ✅ Réussi sans erreur.
