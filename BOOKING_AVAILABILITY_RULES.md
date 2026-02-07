# Règles de Disponibilité des Réservations Client

## Source de Vérité : Horaires d'Ouverture

Les horaires d'ouverture du salon sont définis dans **Paramètres > Profil Personnel > Horaires d'Ouverture**.

Ces horaires sont la **source unique de vérité** pour la disponibilité client.

## Synchronisation Automatique

Les horaires d'ouverture sont automatiquement synchronisés avec :
- L'agenda professionnel
- La page de réservation publique

## Règles de Blocage pour les Clientes

### ❌ Créneaux BLOQUÉS (non sélectionnables)

Les clientes **NE PEUVENT PAS** réserver un créneau si :

1. **Le créneau est en dehors des horaires d'ouverture**
   - Salon fermé
   - Pause déjeuner
   - Jours de fermeture

2. **Le créneau est déjà occupé par un événement bloquant :**
   - Rendez-vous client (`type: 'client'`)
   - Rendez-vous personnel (`type: 'personal'`)
   - Rendez-vous professionnel (`type: 'pro'`)
   - Formation (`type: 'formation'`)
   - Événements Google Calendar (`type: 'google'`)
   - Événements Planity (`type: 'planity'`)

### ✅ Créneaux DISPONIBLES (restent réservables)

Les éléments suivants **NE BLOQUENT PAS** la prise de rendez-vous :

- ✅ Tâches
- ✅ Contenus / réseaux sociaux
- ✅ Plages de production
- ✅ Planification de posts

**Rationale :** Ces activités sont flexibles et peuvent être déplacées si nécessaire.

## Affichage Visuel

### Pour la Cliente (Page Publique)

- ✅ **Créneaux disponibles** : Fond rose clair, cliquables
- ❌ **Créneaux indisponibles** : Fond gris, non cliquables
- 💬 **Tooltip au survol** : Affiche la raison ("Salon fermé", "Créneau réservé", etc.)
- ℹ️ **Message informatif** : "Les horaires affichés correspondent aux heures d'ouverture du salon"

### Pour la Pro (Agenda)

- 👁️ **Vue complète** : Tous les événements (rendez-vous, tâches, contenus, etc.)
- 🔒 **Indication visuelle** : Les créneaux bloqués pour les clientes sont clairement identifiés

## Logique Technique

### Fichier : `src/lib/availabilityHelpers.ts`

**Fonction `isTimeInOpeningHours()`**
- Vérifie si un créneau est dans les horaires d'ouverture
- Compare avec `weekly_availability` de `company_profiles`

**Fonction `isSlotBlocked()`**
- Vérifie si un créneau est occupé par un événement bloquant
- Liste des types bloquants : `['client', 'personal', 'pro', 'formation', 'google', 'planity']`

**Fonction `generateTimeSlots()`**
- Génère tous les créneaux possibles (par intervalles de 30 min)
- Filtre selon les horaires d'ouverture
- Marque les créneaux bloqués avec une raison (`'closed'`, `'booked'`, `'past'`)

## Tests à Effectuer

### Test 1 : Modification des Horaires d'Ouverture
1. ✅ Aller dans **Paramètres > Horaires d'Ouverture**
2. ✅ Modifier les horaires d'un jour (ex: Lundi 9h-17h au lieu de 9h-19h)
3. ✅ Vérifier sur la page de réservation publique
4. ✅ **Résultat attendu :** Les créneaux après 17h ne sont plus disponibles

### Test 2 : Créneau Hors Horaires
1. ✅ Définir des horaires restreints (ex: 10h-16h)
2. ✅ Accéder à la page de réservation publique
3. ✅ Essayer de sélectionner un créneau avant 10h ou après 16h
4. ✅ **Résultat attendu :** Créneaux grisés avec tooltip "Salon fermé"

### Test 3 : Créneau avec Rendez-vous Pro/Perso
1. ✅ Créer un rendez-vous personnel dans l'agenda à 14h
2. ✅ Accéder à la page de réservation publique
3. ✅ Essayer de réserver à 14h
4. ✅ **Résultat attendu :** Créneau bloqué avec tooltip "Créneau déjà réservé"

### Test 4 : Créneau avec Tâche ou Contenu
1. ✅ Créer une tâche ou un post réseau social à 15h dans l'agenda
2. ✅ Accéder à la page de réservation publique
3. ✅ Essayer de réserver à 15h
4. ✅ **Résultat attendu :** Créneau DISPONIBLE (les tâches ne bloquent pas)

### Test 5 : Vue Pro vs Vue Cliente
1. ✅ Vue Pro : Voir tous les événements (rendez-vous, tâches, contenus)
2. ✅ Vue Cliente : Voir seulement les créneaux autorisés
3. ✅ **Résultat attendu :** La pro voit tout, la cliente seulement les créneaux disponibles

## Configuration Initiale Recommandée

### Paramètres > Horaires d'Ouverture

**Exemple pour un salon de beauté type :**

- **Lundi** : 9h00-19h00
- **Mardi** : 9h00-19h00
- **Mercredi** : Fermé
- **Jeudi** : 9h00-19h00
- **Vendredi** : 9h00-20h00
- **Samedi** : 9h00-18h00
- **Dimanche** : Fermé

**Pause déjeuner (optionnel) :**
- 12h00-14h00 : Désactiver ces créneaux pour forcer une pause

## Impact sur l'Agenda

Les horaires d'ouverture sont **visibles mais non contraignants** pour la pro :
- ✅ La pro peut créer des événements en dehors des horaires
- ✅ Utile pour la préparation, le ménage, la comptabilité, etc.
- ❌ Ces créneaux restent BLOQUÉS pour les clientes

## Support et Questions

Si des créneaux ne s'affichent pas correctement :

1. **Vérifier les horaires d'ouverture** dans Paramètres
2. **Vérifier les événements existants** dans l'agenda
3. **Vérifier le type d'événement** (client, personal, pro, etc.)
4. **Recharger la page de réservation**

---

**Date de mise en place :** 2026-01-21
**Version :** 1.0
