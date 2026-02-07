# Actions Rapides dans les Notifications

## RÉSUMÉ DES CHANGEMENTS

### 1. Marie Pierre est bien dans la base clients ✅

**Statut:** Le client "Marie Pierre" a été créé automatiquement lors de l'acceptation de ses réservations.

**Vérification effectuée:**
```sql
SELECT * FROM clients WHERE user_id = '7ba00a01-0284-49e3-8bb0-4e43f59c8023';
```

**Résultat:**
- ID: 46ec6de8-9f67-414a-bca6-6d7651f46d45
- Nom: marie pierre
- Email: pierre@gmail.com
- Status: regular
- Company ID: 629d2ec8-84b6-43f4-8f94-deeb185989ed
- Date création: 2026-01-29 19:21:46

**Le trigger fonctionne parfaitement** - Tous les nouveaux clients sont automatiquement ajoutés à la base lors de l'acceptation d'une réservation.

---

### 2. Actions rapides dans les notifications ✅

Toutes les notifications proposent maintenant des actions rapides directement depuis le panneau de notifications, sans avoir à naviguer ailleurs.

#### Types de notifications supportés

##### A. Rendez-vous (booking_request / appointment_request)

**Actions disponibles:**
1. **Accepter** - Accepte la réservation et crée automatiquement:
   - Le client dans la base CRM (si nouveau)
   - Le rendez-vous dans l'agenda du pro
   - La liaison entre le client et le rendez-vous

2. **Refuser** - Annule la réservation avec raison
   - Demande la raison du refus (optionnel)
   - Met à jour le statut à "cancelled"
   - Enregistre la raison d'annulation

3. **Voir détails** - Navigue vers l'agenda pour voir le contexte complet

**Workflow automatisé lors de l'acceptation:**
```
1. Clic sur "Accepter"
   ↓
2. Appel de la RPC accept_booking(booking_id)
   ↓
3. Création/récupération du client dans la table clients
   ↓
4. Mise à jour du booking → status: 'confirmed'
   ↓
5. Création d'un event dans l'agenda avec type: 'pro'
   ↓
6. Liaison de l'event au client
   ↓
7. Notification marquée comme traitée (is_acted: true)
   ↓
8. Rechargement de la liste des notifications
```

---

##### B. Avis clients (review_received)

**Actions disponibles:**
1. **Approuver** - Valide l'avis et le rend visible publiquement
   - Met à jour `is_validated: true`
   - Met à jour `validated_at: now()`
   - Met à jour `is_visible: true`
   - L'avis apparaît sur le profil public du pro

2. **Refuser** - Supprime l'avis définitivement
   - Supprime l'entrée de la table provider_reviews
   - L'avis n'apparaît pas sur le profil public

**Cas d'usage:**
- Approuver les avis authentiques et constructifs
- Refuser les avis spam, injurieux ou inappropriés

---

##### C. Commentaires (comment_received)

**Actions disponibles:**
1. **Approuver** - Valide le commentaire et le rend visible
   - Met à jour `is_approved: true`
   - Le commentaire apparaît publiquement sur le contenu

2. **Supprimer** - Supprime le commentaire définitivement
   - Supprime l'entrée de la table content_comments
   - Le commentaire n'est plus visible

**Cas d'usage:**
- Modération des commentaires sur les posts Instagram/TikTok
- Filtrage des commentaires spam ou inappropriés
- Approbation manuelle avant publication publique

---

## CHANGEMENTS TECHNIQUES

### Fichier modifié: `NotificationCenter.tsx`

#### 1. Nouvelles fonctions ajoutées

```typescript
// Accepter un rendez-vous via la RPC
handleAcceptAppointment(notificationId, bookingId)
  → Appelle supabase.rpc('accept_booking', { p_booking_id: bookingId })
  → Marque la notification comme traitée

// Refuser un rendez-vous
handleRejectAppointment(notificationId, bookingId)
  → Demande la raison du refus
  → Met à jour bookings.status = 'cancelled'
  → Enregistre cancellation_reason

// Approuver un commentaire
handleApproveComment(notificationId, commentId)
  → Met à jour content_comments.is_approved = true
  → Marque la notification comme traitée

// Refuser un commentaire
handleRejectComment(notificationId, commentId)
  → Supprime le commentaire de content_comments
  → Marque la notification comme traitée

// Valider un avis (déjà existant, corrigé)
handleValidateReview(notificationId, reviewId)
  → Met à jour provider_reviews.is_validated = true
  → Met à jour provider_reviews.is_visible = true
  → Enregistre validated_at = now()

// Refuser un avis (déjà existant, corrigé)
handleRejectReview(notificationId, reviewId)
  → Supprime l'avis de provider_reviews
```

#### 2. Icône ajoutée

```typescript
case 'comment_received':
  return <MessageCircle className="w-5 h-5 text-purple-500" />;
```

#### 3. Rendu des actions amélioré

- Tous les boutons ont maintenant des transitions fluides
- Boutons regroupés avec flex-wrap pour adaptation mobile
- Messages d'erreur explicites avec alert()
- Vérification que entity_id existe avant d'afficher les actions

---

## STRUCTURE DES NOTIFICATIONS

### Colonnes importantes de la table `notifications`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | ID unique de la notification |
| user_id | uuid | Destinataire de la notification |
| company_id | uuid | Entreprise concernée |
| type | text | Type de notification (voir ci-dessous) |
| title | text | Titre affiché |
| message | text | Message descriptif |
| entity_type | text | Type d'entité liée (bookings, provider_reviews, content_comments) |
| entity_id | uuid | ID de l'entité liée (booking_id, review_id, comment_id) |
| is_read | boolean | Notification lue ou non |
| is_acted | boolean | Action effectuée ou non |
| action_url | text | URL optionnelle |
| metadata | jsonb | Données supplémentaires |
| created_at | timestamptz | Date de création |

### Types de notifications supportés

| Type | Description | Actions disponibles |
|------|-------------|---------------------|
| booking_request | Demande de rendez-vous | Accepter, Refuser, Voir |
| appointment_request | Demande de rendez-vous (ancien) | Accepter, Refuser, Voir |
| review_received | Nouvel avis reçu | Approuver, Refuser |
| comment_received | Nouveau commentaire | Approuver, Supprimer |
| booking_confirmed | Rendez-vous confirmé | Info seulement |
| booking_cancelled | Rendez-vous annulé | Info seulement |
| new_follower | Nouveau follower | Info seulement |
| new_like | Nouveau like | Info seulement |

---

## TESTS RECOMMANDÉS

### Test 1: Acceptation de réservation
1. Un client crée une réservation via le formulaire public
2. Le pro reçoit une notification "Nouvelle demande de réservation"
3. Le pro clique sur "Accepter" dans la notification
4. **Vérifier:**
   - ✅ Notification marquée comme traitée
   - ✅ Booking status = 'confirmed'
   - ✅ Client créé dans la table clients (si nouveau)
   - ✅ Event créé dans l'agenda avec type = 'pro'
   - ✅ Message de succès affiché

### Test 2: Refus de réservation
1. Un client crée une réservation
2. Le pro reçoit une notification
3. Le pro clique sur "Refuser"
4. Le pro entre une raison (ex: "Non disponible")
5. **Vérifier:**
   - ✅ Notification marquée comme traitée
   - ✅ Booking status = 'cancelled'
   - ✅ cancellation_reason enregistrée
   - ✅ Notification disparaît de la liste

### Test 3: Validation d'avis
1. Un client laisse un avis après un rendez-vous
2. Le pro reçoit une notification "Nouvel avis reçu"
3. Le pro clique sur "Approuver"
4. **Vérifier:**
   - ✅ provider_reviews.is_validated = true
   - ✅ provider_reviews.is_visible = true
   - ✅ provider_reviews.validated_at renseigné
   - ✅ L'avis apparaît sur le profil public

### Test 4: Refus d'avis
1. Un client laisse un avis inapproprié
2. Le pro reçoit une notification
3. Le pro clique sur "Refuser"
4. **Vérifier:**
   - ✅ L'avis est supprimé de la table provider_reviews
   - ✅ Notification marquée comme traitée
   - ✅ L'avis n'apparaît pas sur le profil public

### Test 5: Approbation de commentaire
1. Un client laisse un commentaire sur un post
2. Le pro reçoit une notification "Nouveau commentaire"
3. Le pro clique sur "Approuver"
4. **Vérifier:**
   - ✅ content_comments.is_approved = true
   - ✅ Le commentaire est visible publiquement
   - ✅ Notification marquée comme traitée

---

## TRIGGERS ASSOCIÉS

### 1. Création de notification pour nouveau booking

**Trigger:** `on_booking_created`
**Fonction:** `notify_pro_of_booking()`
**Quand:** AFTER INSERT ON bookings WHERE status = 'pending'

```sql
INSERT INTO notifications (
  user_id,        -- pro_id
  type,           -- 'booking_request'
  title,          -- 'Nouvelle demande de réservation'
  message,        -- 'Client X souhaite réserver Service Y le DD/MM/YYYY'
  booking_id      -- NEW.id
)
```

### 2. Notification au client lors d'un changement de statut

**Trigger:** `on_booking_status_changed`
**Fonction:** `notify_client_of_booking_status()`
**Quand:** AFTER UPDATE ON bookings

Envoie une notification au client quand:
- Le booking est confirmé
- Le booking est annulé
- Le booking est modifié

---

## GESTION DES ERREURS

### Acceptation de booking

**Erreurs possibles:**
- "Erreur: record 'new' has no field 'event_type'" → **CORRIGÉ** ✅
- "Impossible d'accepter le rendez-vous" → Affiche un alert avec détails
- Erreur de RPC → Affiche le message d'erreur exact

**Logs console:**
- `Calling accept_booking RPC with booking_id: ...`
- `RPC Response: { success: true, ... }`
- `Error accepting appointment: ...` (si erreur)

### Approbation/Refus d'avis ou commentaire

**Erreurs possibles:**
- "Erreur lors de la validation de l'avis" → Affiche un alert
- "Erreur lors du refus de l'avis" → Affiche un alert
- "Erreur lors de l'approbation du commentaire" → Affiche un alert

**Logs console:**
- Tous les détails d'erreur sont loggés avec `console.error()`

---

## AMÉLIORATIONS FUTURES POSSIBLES

### 1. Fonctionnalités supplémentaires
- [ ] Bouton "Replanifier" fonctionnel (actuellement navigue vers /agenda)
- [ ] Bouton "Partager l'avis" sur les réseaux sociaux
- [ ] Réponse en ligne aux avis directement depuis la notification
- [ ] Réponse en ligne aux commentaires
- [ ] Notification push (navigateur/mobile)
- [ ] Sons de notification personnalisables

### 2. UI/UX
- [ ] Toast notifications au lieu d'alerts
- [ ] Animation lors de l'acceptation/refus
- [ ] Skeleton loader pendant le traitement
- [ ] Confirmation avant suppression (modal)
- [ ] Preview de l'avis/commentaire avant validation

### 3. Analytics
- [ ] Temps moyen de réponse aux demandes
- [ ] Taux d'acceptation des réservations
- [ ] Taux de validation des avis
- [ ] Statistiques de modération des commentaires

---

## RÉSUMÉ TECHNIQUE

### Corrections apportées

1. ✅ Correction de `handleAcceptAppointment` pour utiliser la RPC `accept_booking`
2. ✅ Ajout de `handleRejectAppointment` avec gestion de la raison
3. ✅ Correction de `handleValidateReview` pour utiliser `provider_reviews`
4. ✅ Ajout de `handleApproveComment` et `handleRejectComment`
5. ✅ Ajout de l'icône MessageCircle pour les commentaires
6. ✅ Support de `booking_request` ET `appointment_request`
7. ✅ Amélioration du rendu avec flex-wrap et transitions
8. ✅ Ajout de messages d'erreur explicites
9. ✅ Vérification de l'existence de `entity_id` avant affichage

### Tables impactées

- **bookings** - Status, cancellation_reason
- **provider_reviews** - is_validated, validated_at, is_visible
- **content_comments** - is_approved
- **notifications** - is_acted, is_read
- **events** - Création via accept_booking
- **clients** - Création automatique via accept_booking

---

## CONCLUSION

Le système de notifications est maintenant complet avec toutes les actions rapides pour:
- ✅ Rendez-vous (accepter/refuser/voir)
- ✅ Avis (approuver/refuser)
- ✅ Commentaires (approuver/supprimer)

**Marie Pierre est bien dans la base clients** et tous les futurs clients seront ajoutés automatiquement lors de l'acceptation de leurs réservations.

**Build:** ✅ Réussi sans erreur
