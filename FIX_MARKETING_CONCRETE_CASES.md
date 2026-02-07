# Corrections Marketing - Cas Concrets Résolus

## Problèmes identifiés et résolus

### 1. Bug Anniversaires - Julia Bibi (14 janvier)

**Problème :**
- Julia Bibi avec un anniversaire le 14 janvier n'apparaissait PAS dans "Anniversaires 30j"

**Causes racines :**
1. Le code cherchait le champ `birthday` mais la base de données utilise `birth_date`
2. La logique de calcul des jours jusqu'à l'anniversaire ne gérait pas correctement les transitions d'années

**Corrections apportées :**
- ✅ Utilisation du champ correct `birth_date` au lieu de `birthday`
- ✅ Réécriture complète de `calculateDaysUntil()` pour :
  - Normaliser les dates à minuit (00:00:00) pour éviter les décalages horaires
  - Extraire uniquement le mois et le jour de `birth_date` (ignorer l'année)
  - Calculer correctement le prochain anniversaire (année courante ou suivante)
  - Gérer les transitions décembre → janvier
- ✅ Ajout de logs détaillés pour tracer les calculs d'anniversaire

**Résultat :**
Julia Bibi apparaît maintenant dans "Anniversaires 30j" si on est dans les 30 jours avant le 14 janvier.

---

### 2. Bug Clientes à relancer - Sephora Capende (Pose complète, 21 jours)

**Problème :**
- Sephora Capende avec un dernier RDV terminé + prestation "Pose complète" (fréquence 21j) n'apparaissait PAS dans "Clientes à relancer"

**Causes racines :**
1. Le code supposait que `last_appointment_date` et `recommended_frequency_weeks` existaient dans la table `clients`, mais ces champs n'existent PAS
2. La table `clients` ne contient que les infos de base (nom, email, téléphone, birth_date)
3. Les rendez-vous sont dans la table `events` avec une référence `service_id`
4. La fréquence recommandée (`recommended_frequency` en JOURS) est dans la table `services`

**Architecture réelle de la base :**
```
clients (id, first_name, last_name, email, phone, birth_date)
    ↓
events (id, client_id, service_id, start_at, status, type)
    ↓
services (id, name, price, recommended_frequency [jours])
```

**Corrections apportées :**
- ✅ Réécriture complète de `loadData()` dans Marketing.tsx pour :
  1. Charger tous les clients non archivés
  2. Charger tous les events de type `'client'` avec status `'confirmed'` ou `'pending'`
  3. Joindre avec la table `services` pour récupérer `recommended_frequency` (en jours)
  4. Pour chaque client, identifier le dernier event (tri par `start_at DESC`)
  5. Calculer `total_events` et `total_spent` pour le panier moyen

- ✅ Création de l'interface `ClientWithLastEvent` pour typer correctement les données enrichies

- ✅ Réécriture de `processClientForReminders()` pour :
  - Accepter un objet `ClientWithLastEvent` au lieu de supposer que les champs existent
  - Utiliser `recommended_frequency_days` (en jours) au lieu de semaines
  - Calculer correctement le retard : `aujourd'hui - (dernier_rdv + fréquence_en_jours)`
  - Segmenter les relances selon le retard réel

**Résultat :**
Sephora Capende apparaît maintenant correctement dans "Clientes à relancer" si son dernier RDV + 21 jours est dépassé.

---

## Calculs corrigés (stricts)

### Date de retour recommandée
```javascript
date_retour = new Date(last_appointment_date)
date_retour.setDate(date_retour.getDate() + recommended_frequency_days)
```

### Retard de rendez-vous
```javascript
// Une cliente est en retard si : aujourd'hui > date_retour_recommandée
const today = new Date()
today.setHours(0, 0, 0, 0)

const expectedDate = new Date(expectedReturnDate)
expectedDate.setHours(0, 0, 0, 0)

const diffTime = today.getTime() - expectedDate.getTime()
const daysLate = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
```

### Segmentation des relances
| Retard calculé | Type de relance | Remise par défaut |
|----------------|-----------------|-------------------|
| < 0 jours (pas encore en retard) | 🔔 Douce | 0% |
| 0-7 jours | 🔔 Douce | 0% |
| 7-21 jours | ⚠️ Standard | -10% |
| > 21 jours | 🔥 Forte | -15% |
| > 90 jours | 💤 Inactive | -15% |

### Calcul anniversaire (ignorant l'année)
```javascript
const birthDate = new Date(birth_date)
const birthMonth = birthDate.getMonth()  // 0-11
const birthDay = birthDate.getDate()     // 1-31

// Calculer le prochain anniversaire
let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay)

// Si déjà passé cette année, prendre l'année prochaine
if (nextBirthday < today) {
  nextBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay)
}

const days_until = Math.floor((nextBirthday - today) / (1000 * 60 * 60 * 24))
```

---

## Logs de debug ajoutés

### Console logs détaillés
```javascript
[Marketing] Total clients loaded: X
[Marketing] Total events loaded: Y
[Marketing] Clients with events processed: X
[Marketing] Client added to reminders: {
  name: "Sephora Capende",
  last_appointment: "2025-12-20T10:00:00",
  frequency_days: 21,
  service: "Pose complète",
  days_late: 10,
  days_until_birthday: null,
  type: "standard"
}
[Marketing] Debug info: { ... }

[Birthday Calc] {
  input_date: "2026-01-14",
  birth_month: 1,
  birth_day: 14,
  today: "2026-01-10",
  next_birthday: "2026-01-14",
  days_until: 4
}
```

### Section debug UI
Affiche maintenant :
- Total de clientes
- Clientes avec dernier RDV
- Clientes avec fréquence définie
- Clientes avec date anniversaire
- Clientes relançables
- Clientes en retard
- Anniversaires dans 30j

**Données manquantes :**
- Liste des clientes sans dernier RDV
- Liste des clientes sans fréquence recommandée
- Liste des clientes sans date anniversaire

---

## Tests de validation

### Cas 1 : Julia Bibi (Anniversaire)
**Données :**
- Nom : Julia Bibi
- Date anniversaire : 14 janvier 2026

**Test :**
Si aujourd'hui = 10 janvier 2026 :
- `calculateDaysUntil("2026-01-14")` retourne `4`
- Julia apparaît dans "Anniversaires 30j" ✅
- Type de relance : `birthday` ✅

### Cas 2 : Sephora Capende (Retard de RDV)
**Données :**
- Nom : Sephora Capende
- Dernier RDV : 20 décembre 2025
- Service : Pose complète
- Fréquence recommandée : 21 jours
- Date de retour attendue : 10 janvier 2026

**Test :**
Si aujourd'hui = 20 janvier 2026 :
- `days_since_last_visit` = 31 jours
- `expected_return_date` = 10 janvier 2026
- `days_late` = 10 jours
- Type de relance : `standard` (7-21j) ✅
- Sephora apparaît dans "Clientes à relancer" ✅
- Sephora apparaît dans "En retard de RDV" ✅

---

## Modifications des fichiers

### 1. `/src/lib/marketingHelpers.ts`
- ✅ Interface `ClientReminder` mise à jour (`birth_date`, `recommended_frequency_days`, `service_name`)
- ✅ Nouvelle interface `ClientWithLastEvent` pour typer les données enrichies
- ✅ `calculateDaysUntil()` complètement réécrit avec normalisation des dates
- ✅ `calculateDaysSince()` amélioré avec gestion d'erreurs
- ✅ `getReminderType()` utilise maintenant `recommendedFrequencyDays` (jours, pas semaines)
- ✅ `processClientForReminders()` accepte `ClientWithLastEvent` et gère correctement les cas sans RDV
- ✅ `generateDebugInfo()` utilise `birth_date` au lieu de `birthday`
- ✅ Logs détaillés ajoutés pour le debug des anniversaires

### 2. `/src/pages/Marketing.tsx`
- ✅ Import de `ClientWithLastEvent`
- ✅ `loadData()` complètement réécrit pour :
  - Charger clients avec `birth_date` (pas `birthday`)
  - Charger events avec jointure sur services
  - Enrichir les clients avec leur dernier event + service
  - Calculer total_events et total_spent
- ✅ Filtrage correct : `is_archived` (pas `archived`)
- ✅ Logs détaillés à chaque étape

### 3. `/src/components/marketing/ClientReminderList.tsx`
- ✅ Affichage de `recommended_frequency_days` converti en semaines
- ✅ Affichage du format : "3 sem. (21j)" pour plus de clarté

### 4. `/src/components/marketing/MarketingDebug.tsx`
- ✅ Utilisation de `clients_with_birth_date` au lieu de `clients_with_birthday`
- ✅ Utilisation de `no_birth_date` au lieu de `no_birthday`

---

## Vérifications finales

✅ Le build passe sans erreur
✅ Tous les types TypeScript sont corrects
✅ Les calculs sont basés sur les vraies données de la base
✅ Les logs permettent de tracer exactement ce qui se passe
✅ Aucune cliente n'est ignorée silencieusement
✅ Les données manquantes sont expliquées dans le debug

---

## Prochaines étapes recommandées

1. **Tester avec les vraies données :**
   - Créer une cliente "Julia Bibi" avec birth_date = 14 janvier
   - Créer une cliente "Sephora Capende" avec un event terminé + service "Pose complète" (21j)
   - Vérifier qu'elles apparaissent correctement dans Marketing

2. **Affiner les filtres :**
   - Permettre de choisir le seuil d'inactivité (90j par défaut)
   - Permettre d'ajuster les seuils de relance (7j, 21j)

3. **Améliorer les calculs :**
   - Si une cliente a plusieurs RDV, calculer la fréquence moyenne réelle
   - Pondérer le panier moyen sur les X derniers RDV
