# Guide : Onglet Statistiques Contenu 📊

## Vue d'ensemble

L'onglet **Statistiques** dans la page Contenu offre une vision complète et organisée de votre stratégie éditoriale, sans dépendre des données externes (Instagram, TikTok, etc.).

## Structure

### 1. Chiffres clés (toujours visibles en haut)

Ces KPIs sont affichés en cartes au-dessus de toutes les autres vues :

- **📊 Nombre de contenus** : Total de contenus dans la période
- **📅 Régularité de publication** : Semaines actives sur le total
- **🎯 Objectif principal** : Objectif dominant avec pourcentage
- **🎥 Format dominant** : Type de contenu le plus utilisé
- **🔁 Contenus recyclés** : Pourcentage de contenu réutilisé
- **⚠️ Blocage principal** : Point de blocage le plus fréquent

### 2. Filtres de période

**Important** : Les filtres de date sont **indépendants** du calendrier éditorial.
- Ils n'impactent **que** les statistiques
- Le calendrier éditorial reste inchangé

**Filtres rapides** :
- Mois en cours
- 3 derniers mois
- Année en cours
- Période personnalisée (début/fin)

### 3. Statistiques détaillées (onglet dédié)

#### A. Répartition par type de contenu 📱
Graphique en camembert montrant :
- Reels
- Carrousels
- Posts statiques
- Stories
- Vidéos
- Lives

#### B. Répartition par objectif 🎯
- **Visibilité** (attirer)
- **Éducation** (éduquer)
- **Conversion** (convertir)
- **Engagement** (fidéliser)

#### C. Répartition par pilier de contenu 📚
Affiche la distribution de vos piliers éditoriaux personnalisés.

#### D. Valeur vs Promotion ⚖️
Compare le ratio entre :
- Contenu valeur (80%)
- Contenu promotionnel (20%)

**Recommandation** : Visez 80/20 pour maximiser l'engagement.

#### E. Répartition par réseaux 🌐
- Instagram
- TikTok
- LinkedIn
- Facebook
- YouTube
- Twitter

#### F. Temps de production estimé ⏱️
- Production courte (< 30 min)
- Production moyenne (30 min - 2h)
- Production longue (> 2h)

#### G. Type de contenu (origine) 🔄
- **🆕 Nouveau** : Contenu original créé from scratch
- **🔁 Recyclé** : Contenu dupliqué/republié
- **🔀 Adapté** : Contenu adapté d'un autre format

**Ratio effort / volume** : % de réutilisation pour optimiser le temps.

#### H. Thématiques & messages 💬

**Top 5 thématiques** : Les sujets les plus traités

**Messages clés** : Les messages récurrents

**Taux de répétition** : Nombre de thématiques répétées 3+ fois

**💡 Insight clé** :
- Si répétition élevée → "Excellent ! Vous martelez vos messages"
- Si répétition faible → "Attention au papillonnage, concentrez-vous sur 3-5 messages"

#### I. Workflow & organisation 📋

**Avancement** : Barres de progression par statut
- Idée
- En cours
- Programmé
- Publié

**Contenus publiés vs en retard** :
- ✅ Publiés
- ❌ En retard (date de publication passée mais statut ≠ publié)

#### J. Goulots d'étranglement 🚧

Identifie les points de blocage dans la production :
- Idée
- Script
- Montage vidéo
- Validation
- etc.

Affiche le nombre de contenus bloqués par point et le pourcentage.

---

## Nouveaux champs ajoutés à la base de données

Pour calculer ces statistiques, les champs suivants ont été ajoutés à la table `content_calendar` :

| Champ | Type | Valeurs possibles | Description |
|-------|------|-------------------|-------------|
| `is_recycled` | boolean | true/false | Indique si le contenu est recyclé |
| `content_nature` | text | 'valeur', 'promo' | Nature du contenu |
| `production_time` | text | 'court', 'moyen', 'long' | Temps de production estimé |
| `blocking_point` | text | Texte libre | Point de blocage actuel |
| `theme` | text | Texte libre | Thématique principale |
| `key_message` | text | Texte libre | Message clé du contenu |
| `adaptation_source` | text | Texte libre | Source si adapté d'un autre format |

---

## Composants créés

### 1. ContentStats.tsx
Affiche les 6 KPIs principaux en haut de page.

### 2. ContentDetailedStats.tsx
Affiche toutes les statistiques détaillées avec graphiques et insights.

### 3. PieChart.tsx
Composant réutilisable pour les graphiques en camembert (SVG natif, pas de librairie externe).

---

## Comment utiliser

### 1. Accéder aux statistiques

Dans la page **Contenu**, cliquez sur l'onglet **📊 Statistiques**.

### 2. Choisir une période

Utilisez les filtres rapides ou définissez une période personnalisée.

### 3. Analyser vos données

- **Chiffres clés** : Vue d'ensemble rapide
- **Graphiques** : Visualisation des répartitions
- **Insights** : Recommandations automatiques

### 4. Optimiser votre stratégie

- Identifiez les formats qui fonctionnent le mieux pour vous
- Vérifiez que votre ratio valeur/promo est bon
- Détectez les points de blocage dans votre production
- Assurez-vous de répéter vos messages clés

---

## Recommandations

### Pour maximiser l'efficacité :

1. **Régularité** : Visez 3/4 semaines actives minimum
2. **Ratio valeur/promo** : 80% valeur, 20% promo
3. **Recyclage** : 30-40% de contenu recyclé/adapté pour optimiser le temps
4. **Messages** : 3-5 messages clés à marteler régulièrement
5. **Blocages** : Identifiez et résolvez les goulots d'étranglement

### Évitez :

- ❌ Le papillonnage thématique (trop de sujets différents)
- ❌ Trop de contenu promotionnel (lassitude de l'audience)
- ❌ Production 100% nouveau (épuisement)
- ❌ Manque de répétition des messages (pas de mémorisation)

---

## Évolutions futures possibles

- Export des statistiques en PDF
- Comparaison période vs période
- Prédictions basées sur les tendances
- Intégration des stats de performance (likes, vues, etc.)
- Calcul automatique du temps de production réel

---

## Notes techniques

- Les graphiques sont en SVG natif (pas de dépendance externe)
- Les calculs sont faits côté client (performant)
- Les filtres de dates n'affectent que les stats, pas le calendrier
- Les données sont mises à jour en temps réel
