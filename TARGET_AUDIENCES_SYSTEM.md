# Système de Profils Cibles (Target Audiences)

## Vue d'ensemble
Les profils cibles fonctionnent exactement comme les **piliers éditoriaux** - ce sont des profils de cible audience pré-définis que tu peux créer et réutiliser.

---

## Structure

### Table `target_audiences`
```
id          → UUID unique
company_id  → Lien vers ton entreprise
audience_name  → Ex: "Freelances débutants"
keywords    → Array de mots-clés personnalisés
created_at  → Date de création
```

### Exemple concret
```json
{
  "id": "uuid-123",
  "company_id": "uuid-456",
  "audience_name": "Freelances débutants",
  "keywords": ["Premium", "Créatif", "En formation"],
  "created_at": "2026-03-07T10:00:00Z"
}
```

---

## Comment ça fonctionne

### 1️⃣ Créer un profil cible

**Dans le générateur d'idées IA:**

1. Clique sur le bouton **"+"** à côté de "Profil cible"
2. Un modal s'ouvre avec deux champs:
   - **Nom du profil** (obligatoire): Ex "Freelances débutants"
   - **Mots-clés** (optionnel): Ex "Premium, Créatif, Économe"
3. Clique "Créer"

Le profil est maintenant **disponible dans la sélection** pour les générations d'idées futures.

### 2️⃣ Utiliser un profil cible pour générer des idées

**Dans le formulaire IA:**

1. Sélectionne un profil cible dans le dropdown "Profil cible"
2. Ajoute optionnellement des **mots-clés personnalisés** (champ séparé)
3. Clique "Générer 5 idées strategiques"

L'IA reçoit: `"Freelances débutants (Premium, Économe)"`

### 3️⃣ Ce qui est envoyé à l'IA

```javascript
target_audience: "Freelances débutants (Keyword1, Keyword2)"
```

L'IA utilise ce texte complet pour adapter:
- Le tone du contenu
- Les déclencheurs psychologiques
- Les exemples et cas d'usage
- La structure de l'offre

---

## Avantages vs Input Libre

| Aspect | Avant (Input libre) | Après (Profils cibles) |
|--------|-------------------|----------------------|
| **Réutilisabilité** | Écrire à chaque fois | Créer 1x, réutiliser ∞ |
| **Cohérence** | Variable | Contrôlée |
| **Temps** | 30s à taper | 2s à sélectionner |
| **Mots-clés** | Mélangés | Séparés et organisés |
| **Évolutivité** | Difficile | Facile à modifier |

---

## Cas d'usage

### Beauté (Prothésiste ongulaire)
```
Profil 1: Freelances débutants
Keywords: Perfectionnisme, Pas encore rentable, Cherche reconnaissance

Profil 2: Salons établis
Keywords: Volume, Fidélisation, Marges maximales

Profil 3: Reconversion
Keywords: Investissement de départ, Motivation, Flexibilité
```

Résultat → 3 profils réutilisables à l'infini pour 3 stratégies différentes.

### Service (Coach)
```
Profil 1: Startups en phase 0
Keywords: Budget limité, Besoin urgent, Croissance

Profil 2: PME consolidées
Keywords: Professionnalisation, ROI, Team coaching
```

---

## Détails techniques

### RLS (Row Level Security)
- ✅ Tu vois/modifies **uniquement** les profils de **ton entreprise**
- ✅ Admin peut gérer tous les profils
- ✅ Données complètement sécurisées

### API
```javascript
// Créer
await supabase
  .from('target_audiences')
  .insert({ company_id, audience_name, keywords })

// Récupérer
await supabase
  .from('target_audiences')
  .select('*')
  .eq('company_id', companyId)

// Modifier
await supabase
  .from('target_audiences')
  .update({ audience_name, keywords })
  .eq('id', audienceId)

// Supprimer
await supabase
  .from('target_audiences')
  .delete()
  .eq('id', audienceId)
```

---

## Pour aller plus loin

### À venir (optionnel)
- [ ] Bouton "Gérer les profils cibles" dans les Settings
- [ ] Interface de CRUD complète (Create, Read, Update, Delete)
- [ ] Tri par fréquence d'utilisation
- [ ] Partage de profils entre team members
- [ ] Modèles de mots-clés suggérés par profession

---

## FAQ

### Q: Puis-je modifier un profil après l'avoir créé?
**R:** Pas encore via l'interface. Code à venir dans les Settings. Pour l'instant: ContactSupport.

### Q: Les keywords sont-ils obligatoires?
**R:** Non. Tu peux créer un profil avec juste le nom.

### Q: Puis-je supprimer un profil?
**R:** Pas encore via l'interface. Code à venir. Les idées générées avec ce profil resteront intactes.

### Q: Les profils apparaissent dans le calendrier?
**R:** Non. Ils sont **uniquement** pour l'IA. Le calendrier reste identique.

### Q: Combien de profils puis-je créer?
**R:** Illimité! Plus tu as de profils, plus l'IA peut générer d'idées spécifiques.

---

## Exemple Complet

**Scenario: Nail Artist avec 3 profils**

### Profil 1: "Salons Instagram"
- Keywords: Viral, Trending, Aesthetics
- Idée générée: Reel court, hook visuel, couleurs vibrantes

### Profil 2: "Mamas occupées"
- Keywords: Rapide, Pratique, Longue tenue
- Idée générée: Post parental, bénéfice temps/stress, CTA direct

### Profil 3: "Ultra premium"
- Keywords: Luxe, Exclusif, Premium pricing
- Idée générée: Carrousel détaillé, technique avancée, prestige

**Résultat:** 3 angles complètement différents, 3 audiences différentes, 3 stratégies différentes.

Mais tu n'as créé que 3 profils une seule fois! 🚀
