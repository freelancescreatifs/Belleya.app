# 📋 Système de Facturation / Récaps Client - Guide Complet

## Vue d'ensemble

Le système de facturation permet aux prestataires de créer des récaps de prestations avec **plusieurs services**, de les envoyer par **email et SMS**, et de les rendre accessibles aux clientes dans leur espace personnel.

## 🗄️ Base de données

### Tables créées

#### 1. `invoices` (Factures/Récaps)
- **id**: UUID (PK)
- **provider_id**: UUID (FK → user_profiles)
- **client_id**: UUID (FK → clients)
- **appointment_id**: UUID nullable (FK → events) - Lien avec un RDV
- **title**: text - Titre du récap
- **notes**: text nullable - Notes optionnelles
- **subtotal**: numeric(10,2) - Sous-total des services
- **discount_total**: numeric(10,2) - Remise globale
- **total**: numeric(10,2) - Total final
- **created_at**, **updated_at**: timestamptz

#### 2. `invoice_items` (Lignes de service)
- **id**: UUID (PK)
- **invoice_id**: UUID (FK → invoices)
- **service_id**: UUID nullable (FK → services) - Service référencé ou null si "Autre"
- **label**: text - Nom du service (snapshot)
- **price**: numeric(10,2) - Prix unitaire
- **quantity**: int - Quantité (défaut: 1)
- **duration_minutes**: int nullable - Durée optionnelle
- **discount**: numeric(10,2) - Remise sur la ligne
- **line_total**: numeric(10,2) - Total de la ligne (calculé automatiquement)
- **created_at**: timestamptz

#### 3. `invoice_sends` (Historique des envois)
- **id**: UUID (PK)
- **invoice_id**: UUID (FK → invoices)
- **provider_id**: UUID (FK → user_profiles)
- **client_id**: UUID (FK → clients)
- **channel**: enum('email', 'sms')
- **payload**: jsonb - Contenu envoyé
- **status**: enum('sent', 'failed')
- **error_message**: text nullable - Message d'erreur si échec
- **sent_at**: timestamptz

### Règles automatiques

- ✅ **Calcul automatique du `line_total`**: (price × quantity) - discount
- ✅ **Mise à jour automatique du `subtotal` et `total`** de la facture quand les items changent
- ✅ **RLS activé** : Providers gèrent leurs factures, clients voient uniquement les leurs (lecture seule)

## 📱 Utilisation côté Prestataire

### 1. Créer un récap depuis un RDV

Dans l'**Agenda** (EventDrawer) :

1. Ouvrir un rendez-vous de type "Professionnel" (avec cliente)
2. Cliquer sur **"Créer un récap"** (bouton bleu en bas)
3. Le formulaire s'ouvre pré-rempli avec :
   - Titre automatique : "Récap RDV du [date]"
   - Service(s) du RDV (si renseigné)

### 2. Formulaire de création

Le formulaire `InvoiceForm` permet :

#### Services facturés (multi-services obligatoire)
- **Sélectionner un service existant** : liste déroulante avec nom et prix
- **Ou "Autre"** : saisie manuelle du nom et du prix
- **Ajouter plusieurs services** : bouton "+ Ajouter un service"
- Pour chaque ligne :
  - Prix unitaire (€)
  - Quantité
  - Durée (minutes, optionnel)
  - Remise individuelle (€, optionnel)
  - **Total ligne calculé automatiquement**

#### Autres champs
- **Remise globale** (€) : s'applique sur le sous-total
- **Notes** (optionnel) : texte libre pour la cliente
- **Total calculé en temps réel**

### 3. Voir / Envoyer un récap

Une fois créé, le RDV affiche un badge **"Récap disponible"** (vert).

Cliquer sur **"Voir le récap"** ouvre le `InvoiceDetailDrawer` :
- Détails complets : titre, cliente, date, services, totaux, notes
- **Bouton "Envoyer le récap"** : ouvre la modale d'envoi

#### Modale d'envoi (`SendInvoiceModal`)

Options :
- ☑️ **Email** : si l'adresse email de la cliente est renseignée
- ☑️ **SMS** : si le téléphone de la cliente est renseigné
- **Message personnalisé** (optionnel) : remplace le message par défaut
- **Aperçu du message** avant envoi

**Message par défaut** :
```
Bonjour {prénom}, merci d'être venue chez {nom_prestataire} le {date}.
Voici votre récap : {liste des services}. Total : {total}€. À bientôt ! 💗
```

⚠️ **SMS limité à 160 caractères** : le message sera tronqué si trop long.

### 4. Supprimer un récap

Dans le drawer de détail, bouton 🗑️ (rouge) pour supprimer.

---

## 👤 Utilisation côté Cliente

### Affichage dans l'espace client

**Actuellement intégré** :
- Les clientes peuvent voir leurs factures/récaps via le système de RLS (lecture seule)
- À étendre : ajouter un onglet "Mes reçus" dans ClientBookings

**Badge sur les RDV** :
- Si un récap existe pour un RDV, badge "Récap disponible" affiché
- Clic sur le badge ouvre le détail du récap (InvoiceDetailDrawer en mode client)

---

## 🔌 Edge Functions (Email & SMS)

### 1. `send-invoice-email`

**Endpoint** : `/functions/v1/send-invoice-email`

**Payload** :
```json
{
  "invoiceId": "uuid",
  "clientEmail": "email@example.com",
  "clientName": "Prénom",
  "providerName": "Nom prestataire",
  "appointmentDate": "12/02/2026",
  "items": [
    {
      "label": "Pose complète",
      "quantity": 1,
      "price": 50,
      "lineTotal": 50
    }
  ],
  "total": 50,
  "notes": "Notes optionnelles",
  "customMessage": "Message personnalisé (optionnel)"
}
```

**Statut** : ✅ Déployée - Intégrée avec Resend

### 2. `send-invoice-sms`

**Endpoint** : `/functions/v1/send-invoice-sms`

**Payload** :
```json
{
  "invoiceId": "uuid",
  "clientPhone": "+33612345678",
  "clientName": "Prénom",
  "providerName": "Nom prestataire",
  "appointmentDate": "12/02/2026",
  "total": 50,
  "customMessage": "Message personnalisé (optionnel)"
}
```

**Statut** : ✅ Déployée - Prête à brancher avec un service SMS (Twilio, Vonage, etc.)

---

## 📚 Helpers disponibles (`invoiceHelpers.ts`)

### Fonctions principales

```typescript
// Créer une facture avec items
createInvoice(invoice, items)

// Récupérer une facture avec détails
getInvoiceById(invoiceId)

// Récupérer les factures d'un prestataire
getProviderInvoices(providerId)

// Récupérer les factures d'une cliente
getClientInvoices(clientId)

// Récupérer la facture d'un RDV
getInvoiceByAppointment(appointmentId)

// Mettre à jour une facture
updateInvoice(invoiceId, updates)

// Supprimer une facture
deleteInvoice(invoiceId)

// Envoyer par email
sendInvoiceEmail(invoiceId, customMessage?)

// Envoyer par SMS
sendInvoiceSMS(invoiceId, customMessage?)

// Calculer les totaux
calculateInvoiceTotals(items, discountTotal)

// Calculer le total d'une ligne
calculateLineTotal(price, quantity, discount)
```

---

## 🔒 Sécurité (RLS)

### Providers (prestataires)
- ✅ Créer, lire, modifier, supprimer leurs propres factures
- ✅ Gérer les items de leurs factures
- ✅ Historiser les envois

### Clients (clientes)
- ✅ Lire uniquement leurs propres factures
- ✅ Lire les items de leurs factures
- ✅ Voir l'historique des envois pour leurs factures
- ❌ Aucune modification possible

---

## 🎨 Composants UI créés

### 1. `InvoiceForm`
**Emplacement** : `src/components/client/InvoiceForm.tsx`

Formulaire de création de facture avec :
- Multi-services obligatoire
- Sélection service existant ou "Autre"
- Calculs automatiques en temps réel
- Validation complète des champs

### 2. `SendInvoiceModal`
**Emplacement** : `src/components/client/SendInvoiceModal.tsx`

Modale d'envoi avec :
- Choix Email/SMS
- Message personnalisé
- Aperçu avant envoi
- Gestion des erreurs

### 3. `InvoiceDetailDrawer`
**Emplacement** : `src/components/client/InvoiceDetailDrawer.tsx`

Drawer de détail avec :
- Affichage complet de la facture
- Bouton "Envoyer" (mode provider)
- Bouton "Supprimer" (mode provider)
- Mode lecture seule pour clients

### 4. Integration dans `EventDrawer`
**Emplacement** : `src/components/agenda/EventDrawer.tsx`

- Badge "Récap disponible" si facture existe
- Bouton "Créer un récap" si pas de facture
- Bouton "Voir le récap" si facture existe
- Intégration seamless dans le flux agenda

---

## 🚀 Points d'extension futurs

### Court terme
- [x] Intégrer Resend dans `send-invoice-email`
- [ ] Intégrer un service SMS (Twilio/Vonage) dans `send-invoice-sms`
- [ ] Ajouter onglet "Mes reçus" dans l'espace client

### Moyen terme
- [ ] Export PDF des factures
- [ ] Templates personnalisables
- [ ] Statistiques de facturation
- [ ] Rappels automatiques de paiement

---

## ✅ Checklist de validation

- [x] Migration base de données appliquée
- [x] RLS policies créées et testées
- [x] Edge Functions déployées
- [x] Helpers créés et fonctionnels
- [x] Composants UI créés
- [x] Intégration dans EventDrawer
- [x] Calculs automatiques (line_total, subtotal, total)
- [x] Gestion des erreurs avec messages Supabase détaillés
- [x] Build du projet réussi

---

## 📝 Notes importantes

1. **Une facture peut être créée** :
   - Liée à un RDV (appointment_id) → pré-remplissage automatique
   - Indépendante (pas de RDV) → saisie manuelle complète

2. **Validation stricte** :
   - Au moins 1 service requis
   - Tous les services doivent avoir un nom et un prix > 0
   - Calculs vérifiés côté client ET côté DB (triggers)

3. **Gestion des erreurs** :
   - Messages d'erreur détaillés depuis Supabase (message, details, hint, code)
   - Historisation des envois échoués dans `invoice_sends`

4. **Performance** :
   - Index sur toutes les FK
   - Index sur les colonnes de recherche (created_at, sent_at)
   - Policies RLS optimisées

---

## 🆘 Support

Pour toute question ou problème :
- Vérifier les logs Supabase pour les erreurs RLS
- Vérifier les logs Edge Functions pour les envois
- Consulter la table `invoice_sends` pour l'historique d'envoi
- Utiliser les helpers fournis dans `invoiceHelpers.ts`

**Bon travail ! Le système de facturation est opérationnel. 🎉**
