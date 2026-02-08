# Guide : Statut automatique "Publié" vs "Non publié"

## Vue d'ensemble

Le système applique automatiquement le statut "Publié" ou "Non publié" à chaque post en fonction de sa date et heure de publication par rapport à l'heure actuelle.

## Règle de calcul

### Logique simple
```
Si (date_publication + heure_publication) <= maintenant
  → Statut = "Publié" (is_published = true)

Si (date_publication + heure_publication) > maintenant
  → Statut = "Non publié" (is_published = false)
```

## Exemples concrets

Supposons qu'on est le **8 février 2026 à 15:30**

| Post | Date | Heure | Statut | Explication |
|------|------|-------|--------|-------------|
| Post A | 07/02/2026 | 14:00 | **Publié** | Hier, donc passé |
| Post B | 08/02/2026 | 14:00 | **Publié** | Aujourd'hui, mais heure passée (14h < 15h30) |
| Post C | 08/02/2026 | 16:00 | **Non publié** | Aujourd'hui, mais heure future (16h > 15h30) |
| Post D | 09/02/2026 | 10:00 | **Non publié** | Demain, donc futur |
| Post E | 05/02/2026 | (vide) | **Publié** | Date passée, heure = minuit par défaut |

## Fonctionnement technique

### 1. Calcul automatique
- Le statut est calculé automatiquement via la fonction PostgreSQL `calculate_is_published()`
- Cette fonction est appelée par un trigger à chaque INSERT ou UPDATE sur `content_calendar`
- Aucune action manuelle n'est nécessaire

### 2. Trigger
```sql
CREATE TRIGGER trigger_auto_calculate_is_published
  BEFORE INSERT OR UPDATE ON content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_is_published();
```

### 3. Champ utilisé
- **Table** : `content_calendar`
- **Champ** : `is_published` (boolean)
- **Mise à jour** : Automatique à chaque modification

## Comportement dans l'interface

### Vue Calendrier (EditorialCalendar)
- Les posts affichent leur statut "Publié" ou "Non publié"
- Badge vert avec icône ✓ = Publié
- Badge gris avec icône calendrier = Non publié
- Possibilité de basculer manuellement le statut (via checkbox)

### Feed Instagram (InstagramFeed)
- Par défaut, masque les posts publiés
- Bouton "Afficher les posts publiés" pour voir tous les posts
- Les posts publiés ont un indicateur visuel distinct

## Points importants

### Fuseau horaire
- Le système utilise le fuseau horaire du serveur (UTC)
- La comparaison se fait avec `now()` qui est en UTC

### Heure par défaut
- Si `publication_time` est NULL ou vide, l'heure par défaut est **00:00** (minuit)
- Cela signifie qu'un post sans heure sera publié dès que la date est atteinte

### Format de l'heure
- Format attendu : `HH:MM` ou `HH:MM:SS`
- Exemples valides : `14:00`, `09:30`, `23:59:00`

## Tests de validation

Les tests suivants ont été effectués et sont réussis :

1. **Post date passée** : 07/02 10:00 → ✅ Publié
2. **Post aujourd'hui heure passée** : 08/02 01:00 (heure actuelle 01:55) → ✅ Publié
3. **Post aujourd'hui heure future** : 08/02 23:00 (heure actuelle 01:55) → ✅ Non publié
4. **Post date future** : 10/02 14:00 → ✅ Non publié

## Migration appliquée

**Fichier** : `simplify_published_status_datetime_only.sql`

Cette migration :
- Modifie la fonction `calculate_is_published()` pour utiliser uniquement date+heure
- Ignore complètement les étapes de production (script, tournage, etc.)
- Recalcule automatiquement le statut de tous les posts existants

## Compatibilité

- ✅ Desktop
- ✅ Mobile
- ✅ Tous les navigateurs modernes
- ✅ Compatible avec le système de glisser-déposer du feed Instagram

## Dépannage

### Le statut ne se met pas à jour automatiquement
1. Vérifier que le trigger existe :
```sql
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_calculate_is_published';
```

2. Forcer un recalcul manuel :
```sql
UPDATE content_calendar
SET is_published = calculate_is_published(
  content_type, date_script, date_shooting, date_editing,
  date_scheduling, publication_date, publication_time
);
```

### Un post a le mauvais statut
1. Vérifier la date et l'heure du post
2. Vérifier l'heure actuelle du serveur :
```sql
SELECT now() as heure_serveur;
```

3. Comparer manuellement :
```sql
SELECT
  title,
  publication_date,
  publication_time,
  now() as maintenant,
  (publication_date::text || ' ' || publication_time || ':00')::timestamp as datetime_post,
  is_published
FROM content_calendar
WHERE id = 'votre-post-id';
```

## Améliorations futures possibles

1. **Recalcul périodique** : Créer un job qui recalcule automatiquement `is_published` toutes les 5 minutes pour les posts proches de leur heure de publication

2. **Notification** : Envoyer une notification lorsqu'un post passe automatiquement en "Publié"

3. **Fuseau horaire utilisateur** : Permettre à chaque utilisateur de définir son fuseau horaire préféré
