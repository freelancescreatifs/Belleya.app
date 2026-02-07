# Synchronisation Horaires d'Ouverture ↔ Réservations Client

## Ce qui a été mis en place

### Source de Vérité Unique

Les **horaires d'ouverture** définis dans vos **Paramètres** sont maintenant la référence absolue pour :
- ✅ Votre agenda professionnel
- ✅ La page de réservation publique de vos clientes

### Règles Automatiques

**Les clientes NE PEUVENT PAS réserver :**
- ❌ En dehors de vos horaires d'ouverture
- ❌ Sur des créneaux déjà occupés par :
  - Rendez-vous client
  - Rendez-vous personnel
  - Rendez-vous professionnel
  - Formation
  - Événements Google/Planity

**Les clientes PEUVENT réserver :**
- ✅ Même si vous avez une tâche prévue
- ✅ Même si vous avez un post réseau social à publier

**Pourquoi ?** Les tâches et contenus sont flexibles et peuvent être déplacés si besoin.

---

## Comment ça marche

### 1. Configuration de vos Horaires

**Chemin :** Paramètres > Profil Personnel > Horaires d'Ouverture

- Définissez vos jours et heures d'ouverture
- Désactivez les créneaux de pause (ex: pause déjeuner)
- Fermez les jours où vous ne travaillez pas

**Exemple :**
```
Lundi : 9h-12h30 / 14h-19h
Mardi : 9h-19h
Mercredi : Fermé
...
```

### 2. Synchronisation Automatique

Dès que vous modifiez vos horaires :
- ✅ Votre agenda se met à jour
- ✅ La page de réservation publique se met à jour
- ✅ Les clientes voient immédiatement les nouveaux créneaux disponibles

### 3. Vue Cliente (Page Publique)

Sur votre page de réservation publique, les clientes voient :

**Créneaux DISPONIBLES :**
- Fond rose clair
- Cliquables
- Correspondent à vos horaires d'ouverture

**Créneaux INDISPONIBLES :**
- Fond gris
- Non cliquables
- Tooltip au survol : "Salon fermé" ou "Créneau réservé"

**Message informatif :**
> "Les horaires affichés correspondent aux heures d'ouverture du salon. Les créneaux grisés sont déjà réservés ou indisponibles."

### 4. Vue Pro (Votre Agenda)

Dans votre agenda, vous voyez **TOUT** :
- ✅ Rendez-vous clients
- ✅ Rendez-vous personnels
- ✅ Tâches
- ✅ Contenus réseaux sociaux
- ✅ Formations
- ✅ Événements Google/Planity

Vous pouvez créer des événements en dehors de vos horaires d'ouverture (préparation, ménage, comptabilité), mais ces créneaux restent bloqués pour les clientes.

---

## Avantages

### Pour Vous (Pro)

✅ **Plus de doubles réservations** : Les créneaux occupés sont automatiquement bloqués

✅ **Respect de vos horaires** : Les clientes ne peuvent pas réserver quand vous êtes fermée

✅ **Flexibilité** : Les tâches et contenus ne bloquent pas les réservations

✅ **Gain de temps** : Plus besoin de gérer manuellement les disponibilités

### Pour Vos Clientes

✅ **Transparence** : Elles voient directement les créneaux disponibles

✅ **Simplicité** : Pas de confusion sur les horaires

✅ **Feedback clair** : Elles comprennent pourquoi un créneau n'est pas disponible

---

## Cas d'Usage Concrets

### Cas 1 : Pause Déjeuner

**Situation :** Vous voulez une pause de 12h30 à 14h

**Solution :**
1. Dans Paramètres > Horaires, désactivez les créneaux 12h30-14h
2. Les clientes ne pourront plus réserver sur ces créneaux
3. Vous pouvez toujours créer des événements personnels ou tâches sur ces horaires

---

### Cas 2 : Journée Formation

**Situation :** Vous avez une formation le Jeudi

**Solution :**
1. Créez un événement "Formation" dans votre agenda le Jeudi
2. Type : "Formation"
3. Les clientes ne pourront pas réserver le Jeudi
4. Votre agenda affiche clairement la formation

---

### Cas 3 : Tâche Administrative

**Situation :** Vous avez de la comptabilité à faire le Vendredi 15h-16h

**Solution :**
1. Créez une tâche "Comptabilité" dans votre agenda
2. Les clientes PEUVENT quand même réserver à 15h
3. Si une cliente réserve, vous déplacez votre tâche

**Rationale :** La comptabilité peut attendre, un rendez-vous client est prioritaire.

---

### Cas 4 : Post Instagram à Publier

**Situation :** Vous devez publier un post Instagram le Lundi 10h

**Solution :**
1. Créez un événement "Post Instagram" dans votre agenda
2. Les clientes PEUVENT quand même réserver à 10h
3. Si une cliente réserve, vous publiez votre post avant ou après

**Rationale :** La publication peut être flexible, un rendez-vous client est prioritaire.

---

## Fichiers Créés

### Documentation Technique

📄 **BOOKING_AVAILABILITY_RULES.md**
- Règles détaillées
- Logique technique
- Configuration recommandée

### Tests

📋 **TEST_BOOKING_SYNC.md**
- Checklist de tests
- Scénarios de validation
- Résultats attendus

### Code

📁 **src/lib/availabilityHelpers.ts**
- Fonctions de vérification des horaires
- Logique de blocage des créneaux
- Génération des créneaux disponibles

📁 **src/pages/PublicBooking.tsx** (mis à jour)
- Chargement des horaires d'ouverture
- Affichage des créneaux disponibles
- Feedback visuel pour les clientes

---

## Comment Tester

1. **Allez dans Paramètres** > Profil Personnel > Horaires d'Ouverture
2. **Configurez vos horaires** (ex: Lundi 10h-18h)
3. **Accédez à votre page de réservation publique** (via votre slug de réservation)
4. **Vérifiez** que seuls les créneaux 10h-18h sont disponibles
5. **Créez un rendez-vous client** à 14h dans votre agenda
6. **Rafraîchissez** la page de réservation
7. **Vérifiez** que le créneau 14h est maintenant bloqué

---

## Support

Si vous rencontrez un problème :

1. ✅ Vérifiez que vos horaires d'ouverture sont bien configurés
2. ✅ Vérifiez que les événements dans votre agenda ont le bon type
3. ✅ Rafraîchissez la page de réservation publique
4. ✅ Consultez **BOOKING_AVAILABILITY_RULES.md** pour les règles détaillées

---

**Date de mise en place :** 2026-01-21
**Version :** 1.0

---

**Résumé en une phrase :**

> Vos horaires d'ouverture sont maintenant synchronisés avec votre agenda et votre page de réservation. Les clientes ne peuvent réserver que sur les créneaux disponibles, sans bloquer vos tâches et contenus flexibles.
