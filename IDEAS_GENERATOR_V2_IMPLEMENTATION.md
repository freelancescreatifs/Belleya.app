# Générateur d'Idées IA - Version 2 Optimisée

## Vue d'ensemble
Le générateur d'idées a été complètement restructuré pour générer du contenu ultra-stratégique et directement exploitable, avec une adaptation fine aux paramètres du utilisateur.

---

## 1. Architecture Nouvelle - Boîte à Idées

### Système en deux étapes:
```
Générer 5 idées → Boîte à idées → Cliquer "À produire" → Calendrier éditorial
```

### Table `content_ideas` (Staging)
- Stocke les idées générées par l'IA
- Indépendante du calendrier éditorial
- Permet de réviser avant de produire
- Statut: `saved` ou `archived`

### Flux:
1. **Générer** → idées sauvegardées dans `content_ideas`
2. **Réviser** → Voir toutes les idées dans l'onglet "Boîte à idées"
3. **À produire** → Cliquer bouton "À produire" → transfert vers `content_calendar`
4. **Archiver** → Suppression ou marquage comme `archived`

---

## 2. Paramètres Complètement Adaptables

### Interface utilisateur:
| Paramètre | Type | Impact sur la génération |
|-----------|------|-------------------------|
| **Thème/Sujet** | Input libre | Oriente l'angle du contenu |
| **Format** | Select | Reel, Carrousel, Post, Story, Live |
| **Plateforme** | Select | Instagram, TikTok, LinkedIn, Facebook, Pinterest |
| **Objectif** | Select | Attirer, Engager, Vendre, Fidéliser |
| **Pilier éditorial** | Select | Aligne le contenu au pilier (si défini) |
| **Cible audience** | **Input LIBRE** | Description précise de la cible |
| **Conscience** | Select | Problème inconscient → Prêt à acheter |

### Le changement clé: "Cible audience" est maintenant **un input libre en texte**
Exemples acceptés:
- "Femmes 25-40 ans, propriétaires de salon"
- "Débutantes en nail art, créatives"
- "PME du secteur beauté, Instagram-first"
- "Parents stressés, cherchant solutions rapides"

---

## 3. Structure Complète de Chaque Idée Générée

Chaque idée inclut maintenant:

### ✅ Hook exemple
Phrase accrocheuse spécifique au métier et à l'angle (pattern interrupt, rupture de croyance).

### ✅ 3 Hooks alternatifs
Trois variantes percutantes du même concept, testables.

### ✅ Déclencheurs psychologiques (5+)
Liste des éléments psychologiques utilisés:
- Curiosité / Soulagement / Autorité / Désir / Urgence / Peur...

### ✅ Angle stratégique
Pourquoi cet angle fonctionne PRÉCISÉMENT pour la cible + niveau de conscience.

### ✅ Structure de rétention (5+ éléments)
Comment garder l'attention à chaque seconde/slide/ligne.

### ✅ Version conversion
Texte complet orienté vente:
- Bénéfice concret
- Résultat attendu
- Urgence douce
- CTA simplifié

### ✅ Alignment visuel
3 recommandations techniques pour le design:
- Plans (rapproché, large, détail)
- Texte à l'écran
- Musique / Couleurs / Pacing

### ✅ 3 Idées de Stories
Variantes pour complémenter le contenu principal:
- Story 1: Interaction (sondage, question)
- Story 2: Coulisses (processus, préparation)
- Story 3: Preuve sociale (avis, résultats)

### ✅ Conseil Pro (ultra-actionnable)
Astuce spécifique à cet angle pour maximiser:
- Viralité
- Rétention
- Conversion

### ✅ Scripts détaillés (NOUVEAU)
**2 scripts complets:**
1. **Script court** (30-45s): Version ultra-rapide
2. **Script long** (45-90s): Version détaillée avec timing

---

## 4. Adaptation au Format de Contenu

### Reel (Instagram / TikTok)
```
0-3s   : Hook visuel + textuel (pattern interrupt)
3-8s   : Problème / Situation relatable
8-15s  : Révélation / Coulisses / Démonstration
15-25s : Résultat / Bénéfice
25-30s : CTA clair + Urgence douce
```

### Carrousel
```
Slide 1   : Hook visuel + textuel très fort (détermine l'ouverture)
Slides 2-4: Développement progressif
Slides 5-7: Preuve, résultat, transformation
Slide 8   : Bénéfice final
Slide 9+  : CTA fort + Urgence + Lien
```

### Post Classique
```
Ligne 1-2  : Hook textuel (avant "Lire la suite")
Ligne 3-5  : Histoire / Contexte
Ligne 6-10 : Valeur principale
Ligne 11-15: Preuve / Chiffres / Exemples
Dernière   : CTA clair
```

### Story (3-5 slides)
```
Slide 1    : Hook + Sondage/Question sticker
Slide 2-3  : Contenu court + Engagement
Slide 4    : CTA + Sticker lien / Code promo
```

---

## 5. Adaptation à la Profession

Le prompt utilise `getProfessionLabel()` pour adapter:
- Le vocabulaire spécifique au métier
- Les exemples et cas d'usage
- Le contexte professionnel
- Les déclencheurs pertinents

Exemple pour "Prothésiste ongulaire":
- Mentionne préparation plaque, adhérence, décollement
- Parle de tenue 3-4 semaines, retouches
- Utilise le langage du métier

---

## 6. Adaptation à l'Objectif

| Objectif | Approche | Déclencheur |
|----------|----------|-------------|
| **Attirer** | Curiosité, rupture de croyance | Hook très fort, pattern interrupt |
| **Engager** | Interaction, débat | Questions, dilemmes, points de vue |
| **Vendre** | Urgence, bénéfice, preuve | CTA direct, chiffres, résultats |
| **Fidéliser** | Exclusivité, insider content | Coulisses, remerciements, communauté |

---

## 7. Adaptation au Niveau de Conscience

La structure et les déclencheurs changent selon le niveau:

### Problème inconscient
- Focus sur révélation du problème
- Hook très fort qui crée la prise de conscience
- Éducation progressive

### Conscient du problème
- Focus sur la solution
- Démontre comment on la résout
- Comparative avant/après

### Conscient de la solution
- Focus sur ton expertise
- Preuve sociale: autres clientes
- Différenciation vs concurrence

### Conscient du produit
- Focus sur bénéfices uniques
- Témoignages spécifiques
- Urgence (places limitées, promo expire)

### Prêt à acheter
- Focus sur conversion
- CTA direct et simple
- Objections rapidement levées

---

## 8. Optimisation de la Vitesse

### ✅ Appel IA unique
- **Avant**: Appel pour chaque idée (5 appels)
- **Après**: 1 appel qui génère 5 idées complètes
- **Gain**: Environ **80% plus rapide**

### ✅ Structure JSON préformatée
- L'IA génère directement la structure attendue
- Pas de parsing complexe
- Réponse immédiate

### ✅ Affichage quasi-instantané
- Les 5 idées apparaissent d'un coup
- Pas de loading intermédiaire
- UX fluide

---

## 9. Intégration à la Base de Données

### Tables impliquées:
```
content_ideas (nouvelle - boîte à idées)
├── id, user_id, company_id
├── title, hooks_alternatives, psychological_triggers
├── content_angle, retention_structure
├── conversion_version, visual_alignment
├── story_ideas, pro_tip
├── script_short, script_long (nouveaux)
├── content_type, platform, objective
├── target_audience, awareness_level
├── editorial_pillar, status (saved/archived)
└── created_at, updated_at

content_calendar (calendrier - après "À produire")
├── Reçoit les idées transférées depuis content_ideas
└── Intègre le workflow de production normal
```

### RLS (Row Level Security)
- ✅ Utilisateurs voir/modifier leurs idées uniquement
- ✅ Admin peut gérer toutes les idées
- ✅ Données sécurisées par défaut

---

## 10. Fonctionnalités Supplémentaires

### Boutons d'action:
- ✅ **À produire**: Transfère l'idée vers le calendrier
- ✅ **Favori**: Marque les meilleures idées
- ✅ **Supprimer**: Archive ou supprime l'idée

### Tabs:
- **Manual**: Ajouter des idées manuellement (workflow existant)
- **IA**: Générateur d'idées stratégiques
- **Boîte à idées**: Voir toutes les idées générées/sauvegardées

---

## 11. Exemple Concret - Nail Artist

**Paramètres:**
- Profession: Prothésiste ongulaire
- Format: Reel (Instagram)
- Plateforme: Instagram
- Objectif: Attirer
- Cible: Femmes 25-40 ans, propriétaires de salon
- Conscience: Conscient du problème
- Pilier: Technique
- Sujet: Tenue des ongles

**Idée générée exemple:**

```json
{
  "title": "Si tes ongles ne tiennent pas 3 semaines... ce n'est pas le gel.",
  "hooks_alternatives": [
    "Le problème, c'est pas tes ongles. C'est ce que tu fais avant.",
    "Tu crois que ça ne tient pas à cause de ta nature d'ongle ? Faux.",
    "Avant de poser du gel, il faut faire 3 choses que tu ne fais pas."
  ],
  "psychological_triggers": [
    "Rupture de croyance (pas le gel!)",
    "Soulagement émotionnel (ce n'est pas ta nature)",
    "Désir d'amélioration (tenue longue)",
    "Autorité implicite (je sais pourquoi)",
    "Projection résultat (3-4 semaines sans décollement)"
  ],
  "content_angle": "Révéler que la vraie cause est la préparation, pas le produit. Positionner ton expertise comme la différence expert vs amateur.",
  "retention_structure": [
    "Hook choc (0-3s crée micro-tension)",
    "Croyance détruite (ça change rien que ce soit le gel)",
    "Désignation du vrai problème (préparation plaque)",
    "Démonstration visuelle (avant/après plaque)",
    "Résultat clair (3-4 semaines sans stress)"
  ],
  "conversion_version": "Moins de retouches. Moins de perte de temps. Moins d'argent gaspillé en gel qui ne tient pas. Réserve maintenant, places limitées cette semaine.",
  "visual_alignment": [
    "Plan serré mains avec ongles imparfaits",
    "Texte à l'écran: 'C'est la préparation'",
    "Avant/après rapide en 3 secondes"
  ],
  "story_ideas": [
    "Story 1 - Sondage: 'Tes ongles se décollent avant 3 semaines?' OUI/TOUJOURS → Slide 2: 'Je vais te montrer pourquoi' → Slide 3: Partage du Reel",
    "Story 2 - Coulisses: Vidéo préparation plaque en gros plan → 'La partie que personne ne montre' → 'C'est ici que tout se joue'",
    "Story 3 - Preuve: Capture avis cliente '3 semaines et toujours nickel' → Photo ongles jour 21 → 'Prochaine dispo: jeudi & samedi'"
  ],
  "pro_tip": "Ne montre pas juste le geste. Montre la CONSÉQUENCE du geste. Elle achète pas une 'préparation', elle achète la TRANQUILLITÉ. Plus tu réponds à 'Pourquoi ça ne tient pas?', plus ça convertit.",
  "script_short": "0-3s HOOK: 'Si tes ongles ne tiennent pas... c'est pas le gel.' [Plan ongles] 3-8s PROBLÈME: [Texte] 'C'est la préparation.' 8-15s SOLUTION: Je nettoie la plaque, je repousse les cuticules, je matifie. Rien n'est laissé au hasard. 15-20s RÉSULTAT: 3 à 4 semaines sans décollement. 20-30s CTA: Réserve maintenant. Lien en bio.",
  "script_long": "Détail complet avec timing, transitions, suggestions musicales..."
}
```

---

## 12. Avantages Finaux

✅ **Contenu ZÉRO générique**: Chaque idée est unique et spécifique
✅ **Stratégiquement adapté**: Tous les paramètres influencent la génération
✅ **Prêt à produire immédiatement**: Structure complète avec scripts
✅ **Ultra-rapide**: 5 idées en 1 appel IA
✅ **Flexibilité totale**: Réviser avant de produire
✅ **UX professionnelle**: Comme Notion AI, Copy.ai, Jasper
✅ **Conversion optimisée**: Chaque idée a une version orientée vente

---

## 13. Prochaines étapes possibles

- [ ] Affichage visuel des idées avec preview
- [ ] Éditeur intégré pour modifier les idées
- [ ] Historique des idées générées
- [ ] Templates personnalisés par profession
- [ ] Intégration calendrier (drag & drop vers calendrier)
- [ ] Export en PDF / Google Docs
- [ ] Feedback et notes personnelles sur chaque idée
