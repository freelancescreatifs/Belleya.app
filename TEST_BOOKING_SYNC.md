# Test de Synchronisation des Horaires d'Ouverture et Réservations

## Préambule

Ce document décrit les tests à effectuer pour valider la synchronisation entre les horaires d'ouverture et la page de réservation publique.

## Préparation

### 1. Accéder aux Paramètres

1. Se connecter en tant que **Pro**
2. Aller dans **Paramètres**
3. Localiser la section **Horaires d'Ouverture** (WeeklySchedule)

### 2. Configurer des Horaires Test

**Configuration de test suggérée :**

- **Lundi** : 10h00-18h00 (avec pause 12h30-14h00)
- **Mardi** : 9h00-17h00
- **Mercredi** : Fermé
- **Jeudi** : 10h00-19h00
- **Vendredi** : 9h00-20h00
- **Samedi** : 9h00-16h00
- **Dimanche** : Fermé

## Tests à Effectuer

### ✅ Test 1 : Vérification des Horaires d'Ouverture

**Objectif :** Valider que les créneaux affichés respectent les horaires d'ouverture

**Étapes :**
1. Configurer les horaires du Lundi : 10h00-18h00
2. Sauvegarder
3. Accéder à la page de réservation publique (via le slug de réservation)
4. Sélectionner un service
5. Choisir un Lundi dans le calendrier

**Résultat attendu :**
- ❌ Pas de créneaux avant 10h00
- ✅ Créneaux disponibles de 10h00 à 18h00
- ❌ Pas de créneaux après 18h00

**Verdict :** ⬜ Réussi / ⬜ Échoué

---

### ✅ Test 2 : Pause Déjeuner

**Objectif :** Valider que les pauses (créneaux désactivés) bloquent les réservations

**Étapes :**
1. Configurer le Lundi avec une pause : 12h30-14h00 (désactiver ces créneaux)
2. Sauvegarger
3. Accéder à la page de réservation publique
4. Sélectionner un Lundi

**Résultat attendu :**
- ✅ Créneaux disponibles avant 12h30
- ❌ Créneaux bloqués de 12h30 à 14h00 (avec tooltip "Salon fermé")
- ✅ Créneaux disponibles après 14h00

**Verdict :** ⬜ Réussi / ⬜ Échoué

---

### ✅ Test 3 : Jour Fermé

**Objectif :** Valider qu'un jour fermé ne propose aucun créneau

**Étapes :**
1. Laisser le Mercredi sans horaires (tous les créneaux désactivés)
2. Accéder à la page de réservation publique
3. Essayer de sélectionner un Mercredi

**Résultat attendu :**
- ❌ Aucun créneau disponible pour le Mercredi
- 💬 Message : "Aucun créneau disponible" ou similaire

**Verdict :** ⬜ Réussi / ⬜ Échoué

---

### ✅ Test 4 : Rendez-vous Client Existant

**Objectif :** Valider qu'un rendez-vous client bloque le créneau

**Étapes :**
1. Créer un rendez-vous client dans l'agenda pour Mardi 14h00-15h00
2. Accéder à la page de réservation publique
3. Essayer de réserver Mardi à 14h00

**Résultat attendu :**
- ❌ Créneau 14h00 bloqué (grisé)
- 💬 Tooltip : "Créneau déjà réservé"

**Verdict :** ⬜ Réussi / ⬜ Échoué

---

### ✅ Test 5 : Rendez-vous Personnel

**Objectif :** Valider qu'un rendez-vous personnel bloque le créneau

**Étapes :**
1. Créer un événement personnel dans l'agenda pour Jeudi 11h00-12h00
2. Accéder à la page de réservation publique
3. Essayer de réserver Jeudi à 11h00

**Résultat attendu :**
- ❌ Créneau 11h00 bloqué (grisé)
- 💬 Tooltip : "Créneau déjà réservé"

**Verdict :** ⬜ Réussi / ⬜ Échoué

---

### ✅ Test 6 : Tâche dans l'Agenda

**Objectif :** Valider qu'une tâche NE bloque PAS le créneau

**Étapes :**
1. Créer une tâche dans l'agenda pour Vendredi 15h00-16h00
2. Accéder à la page de réservation publique
3. Essayer de réserver Vendredi à 15h00

**Résultat attendu :**
- ✅ Créneau 15h00 DISPONIBLE (fond rose clair)
- ✅ Réservation possible

**Verdict :** ⬜ Réussi / ⬜ Échoué

---

### ✅ Test 7 : Contenu Réseaux Sociaux

**Objectif :** Valider qu'un post réseau social NE bloque PAS le créneau

**Étapes :**
1. Créer un post Instagram dans l'agenda pour Samedi 10h00
2. Accéder à la page de réservation publique
3. Essayer de réserver Samedi à 10h00

**Résultat attendu :**
- ✅ Créneau 10h00 DISPONIBLE
- ✅ Réservation possible

**Verdict :** ⬜ Réussi / ⬜ Échoué

---

### ✅ Test 8 : Vue Pro vs Vue Cliente

**Objectif :** Valider que la vue pro voit tout, la cliente seulement les disponibilités

**Étapes :**
1. En tant que Pro, vérifier l'agenda avec tous les événements
2. Vérifier que les tâches, contenus, etc. sont visibles
3. Accéder à la page de réservation publique (vue cliente)
4. Vérifier que seuls les créneaux respectant les horaires et non bloqués sont visibles

**Résultat attendu :**
- ✅ Agenda Pro : Tous les événements visibles (rendez-vous, tâches, contenus, etc.)
- ✅ Page Réservation : Seulement les créneaux disponibles selon les règles

**Verdict :** ⬜ Réussi / ⬜ Échoué

---

### ✅ Test 9 : Changement d'Horaires en Direct

**Objectif :** Valider que les modifications d'horaires sont immédiatement prises en compte

**Étapes :**
1. Ouvrir la page de réservation publique dans un onglet
2. Dans un autre onglet, modifier les horaires du Lundi (passer de 10h-18h à 10h-16h)
3. Sauvegarder
4. Rafraîchir la page de réservation publique
5. Vérifier les créneaux disponibles

**Résultat attendu :**
- ✅ Les créneaux après 16h00 ne sont plus disponibles
- ✅ Mise à jour immédiate après rafraîchissement

**Verdict :** ⬜ Réussi / ⬜ Échoué

---

### ✅ Test 10 : Message Informatif

**Objectif :** Valider que l'utilisateur comprend pourquoi certains créneaux sont indisponibles

**Étapes :**
1. Accéder à la page de réservation publique
2. Sélectionner un service et une date
3. Arriver à l'étape de sélection de l'heure

**Résultat attendu :**
- ℹ️ Message visible : "Les horaires affichés correspondent aux heures d'ouverture du salon"
- 💬 Tooltip au survol des créneaux grisés : "Salon fermé" ou "Créneau déjà réservé"

**Verdict :** ⬜ Réussi / ⬜ Échoué

---

## Résumé des Tests

| # | Test | Statut |
|---|------|--------|
| 1 | Horaires d'ouverture | ⬜ |
| 2 | Pause déjeuner | ⬜ |
| 3 | Jour fermé | ⬜ |
| 4 | Rendez-vous client | ⬜ |
| 5 | Rendez-vous personnel | ⬜ |
| 6 | Tâche (ne bloque pas) | ⬜ |
| 7 | Contenu (ne bloque pas) | ⬜ |
| 8 | Vue Pro vs Cliente | ⬜ |
| 9 | Changement en direct | ⬜ |
| 10 | Message informatif | ⬜ |

---

## Bugs ou Problèmes Rencontrés

_Laisser cette section vide si tout fonctionne. Sinon, décrire les problèmes._

---

## Date de Test

**Date :** ___________
**Testeur :** ___________
**Environnement :** Production / Développement

---

## Checklist Post-Test

Après validation de tous les tests :

- [ ] Informer l'équipe que la synchronisation fonctionne
- [ ] Documenter les horaires types pour les nouveaux utilisateurs
- [ ] Créer un guide utilisateur pour gérer les horaires
- [ ] Vérifier la performance sur mobile

---

**Note :** Ces tests sont critiques pour garantir une expérience utilisateur fluide et éviter les doubles réservations.
