# Correction Import Manquant - CompanyProfileForm

## Problème

Erreur lors du changement de statut dans les paramètres :
```
convertweeklyavailabilitytoschedule is not defined
```

## Cause

La fonction `convertWeeklyAvailabilityToSchedule` était utilisée dans le composant `CompanyProfileForm.tsx` mais l'import était manquant.

### Utilisation de la fonction

Dans `CompanyProfileForm.tsx` ligne 212, la fonction est utilisée lors de la sauvegarde du profil :

```tsx
const weekSchedule = convertWeeklyAvailabilityToSchedule(profile.weekly_availability);
```

Cette fonction convertit le format détaillé `weekly_availability` (avec tous les créneaux horaires) en format simplifié `week_schedule` (juste heures d'ouverture/fermeture par jour).

## Solution

Ajout de l'import manquant dans `CompanyProfileForm.tsx` :

```tsx
import { convertWeeklyAvailabilityToSchedule } from '../../lib/availabilityHelpers';
```

## Fichier Modifié

- `src/components/settings/CompanyProfileForm.tsx` - Ligne 7

## Tests

- ✅ Build du projet réussi
- ✅ Pas d'erreur TypeScript
- ✅ La fonction est maintenant accessible

## Note

La fonction `convertWeeklyAvailabilityToSchedule` existe dans `src/lib/availabilityHelpers.ts` et est utilisée pour :
1. Convertir le format détaillé des disponibilités en format simplifié
2. Stocker les deux formats dans la base de données pour différents usages
3. Le format simplifié (`week_schedule`) est utilisé pour l'affichage public
4. Le format détaillé (`weekly_availability`) est utilisé pour la gestion des réservations

Cette conversion est essentielle pour le système de réservation et le profil public.
