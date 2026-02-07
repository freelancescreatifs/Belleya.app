# Module Marketing - Documentation

## Vue d'ensemble

Le module Marketing aide les professionnels de la beauté à remplir leur planning en relançant automatiquement les clientes au bon moment.

## Source de vérité : Table `clients`

Le module utilise directement les données de la table `clients` avec les champs suivants :

### Champs requis pour les relances
- `last_appointment_date` : Date du dernier rendez-vous
- `recommended_frequency_weeks` : Fréquence recommandée de la prestation (en semaines)
- `birthday` : Date d'anniversaire (jour/mois, l'année est ignorée)
- `average_basket` : Panier moyen de la cliente (€)
- `email` / `phone` : Coordonnées pour l'envoi

## Calculs des relances

### Date de retour recommandée
```
date_retour_recommandée = last_appointment_date + (recommended_frequency_weeks × 7 jours)
```

### Retard de rendez-vous
Une cliente est en retard si : `date_retour_recommandée < aujourd'hui`

Le retard est calculé en jours :
```
retard = aujourd'hui - date_retour_recommandée
```

### Segmentation des relances

| Retard | Type de relance | Remise par défaut |
|--------|----------------|-------------------|
| < 7 jours | 🔔 Douce | 0% |
| 7-21 jours | ⚠️ Standard | -10% |
| > 21 jours | 🔥 Forte | -15% |
| > 90 jours | 💤 Inactive | -15% |

### Anniversaires
- Calcul sur jour et mois uniquement (année ignorée)
- Détection dans les 30 prochains jours
- Gestion correcte des transitions d'année (décembre → janvier)
- Remise par défaut : -20%

## KPI Header (avec tooltips)

### 1. Clientes à relancer
Clientes dont la date de retour estimée est atteinte ou imminente.

**Calcul :**
- Clientes avec retard 0-7 jours OU
- Anniversaires dans les 7 prochains jours

### 2. En retard de RDV
Clientes ayant dépassé leur date de retour recommandée.

**Calcul :**
- `retard > 0` basé sur `last_appointment_date + recommended_frequency_weeks`

### 3. Anniversaires 30j
Clientes dont l'anniversaire est dans les 30 prochains jours.

**Calcul :**
- Ignorer l'année de naissance
- Compter jours jusqu'au prochain anniversaire
- Inclure si ≤ 30 jours

### 4. Taux de retour
Estimation du taux de rétention des clientes.

**Calcul :**
```
taux_retour = ((clientes_actives - clientes_inactives) / clientes_actives) × 100
```
- Cliente active : a un `last_appointment_date`
- Cliente inactive : retard > 90 jours

### 5. CA potentiel
Chiffre d'affaires récupérable si les clientes relancées reviennent.

**Calcul :**
```
CA_potentiel = Σ(panier_moyen de chaque cliente relançable)
```

## Section Debug (transparence)

Le module affiche automatiquement :
- Total de clientes
- Clientes avec dernier RDV
- Clientes avec fréquence recommandée
- Clientes avec anniversaire
- Clientes relançables
- Clientes en retard
- Anniversaires 30j

### Données manquantes
Le debug liste les clientes qui n'apparaissent pas car :
- Pas de dernier RDV enregistré
- Pas de fréquence recommandée
- Pas de date anniversaire

## Workflows

### 1. Relance par fréquence
1. Le système calcule qui devrait revenir
2. Segmente par type de relance (douce/standard/forte)
3. Propose le template et la remise adaptés
4. Permet l'envoi par SMS ou Email

### 2. Offre anniversaire
1. Détecte les anniversaires dans les 30 jours
2. Propose automatiquement -20%
3. Template personnalisé avec le prénom

### 3. Clientes inactives
1. Détecte les clientes absentes > 90 jours
2. Propose une offre de reconquête
3. Message adapté pour réengager

## Templates par défaut

### SMS (courts, humains)
- Relance douce
- Relance standard
- Relance forte
- Anniversaire
- Cliente fidèle
- Cliente inactive

### Email (détaillés)
- Relance douce
- Anniversaire

Variables disponibles :
- `{{prenom}}` : Prénom de la cliente
- `{{nom}}` : Nom de la cliente
- `{{offre}}` : Texte de l'offre (ex: "-15%")
- `{{date}}` : Date de validité de l'offre

## Logs de debug

En mode développement, les logs affichent :
```javascript
[Marketing] Total clients loaded: X
[Marketing] Client added to reminders: {
  name: "Julia Bibi",
  last_appointment: "2024-12-15",
  frequency: 4,
  days_late: 21,
  type: "standard"
}
[Marketing] Debug info: { ... }
```

## Notes importantes

1. **Aucune cliente ignorée silencieusement** : Si des données manquent, la section debug l'explique
2. **Calculs stricts** : Toujours basés sur `last_appointment_date + recommended_frequency_weeks`
3. **Symbole € partout** : Tous les montants affichent le symbole euro
4. **Transparence totale** : Le système explique pourquoi certaines clientes n'apparaissent pas
