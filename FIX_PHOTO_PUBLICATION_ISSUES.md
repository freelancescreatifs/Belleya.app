# Corrections des Problèmes de Publication de Photos

## Problèmes Identifiés

### 1. Photos non visibles dans la galerie du profil public
**Problème** : Les photos ajoutées via "Clients → Fiche cliente → Galerie → Ses résultats" n'apparaissaient pas dans le profil public du prestataire.

**Cause** : Le `company_id` passé à `ClientGallery` via les props (`profile.company_id`) pouvait ne pas être défini ou incorrect.

**Solution** :
- Ajout d'une fonction `loadCompanyId()` dans `ClientGallery`
- Si `company_id` n'est pas fourni via props, on le charge automatiquement depuis `company_profiles` basé sur `user.id`
- Ajout de vérifications pour s'assurer que `company_id` est défini avant toute insertion
- État local `companyId` maintenu dans le composant pour garantir la cohérence

**Fichier modifié** : `src/components/client/ClientGallery.tsx`

```typescript
const [companyId, setCompanyId] = useState<string | null>(propCompanyId);

const loadCompanyId = async () => {
  if (!user) return;

  if (propCompanyId) {
    setCompanyId(propCompanyId);
    return;
  }

  const { data } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (data) {
    setCompanyId(data.id);
  }
};
```

### 2. Superposition des éléments dans le modal d'ajout de photo
**Problème** : Lors de l'ajout d'une photo depuis le profil public, le modal avait un problème de z-index et les éléments d'arrière-plan se superposaient.

**Solution** :
- Augmentation du z-index du modal de `z-50` à `z-[100]`
- Ajout de `max-h-[90vh] overflow-y-auto` pour gérer le contenu long
- Le modal est maintenant toujours au-dessus de tous les autres éléments

**Fichier modifié** : `src/pages/PublicProfile.tsx`

```typescript
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
```

### 3. Catégories incorrectes (types de prestation au lieu des vraies catégories)
**Problème** : Le système utilisait les `service_type` dynamiques des services au lieu des catégories prédéfinies (Ongles, Cils, Soins, etc.).

**Solution** :
- Création d'un fichier helper : `src/lib/categoryHelpers.ts`
- Définition d'une constante `SERVICE_CATEGORIES` avec les 8 catégories officielles
- Utilisation de cette liste fixe dans tous les composants au lieu de charger dynamiquement depuis les services
- Suppression de la logique qui extrayait les catégories des services

**Nouveau fichier** : `src/lib/categoryHelpers.ts`

```typescript
export const SERVICE_CATEGORIES = [
  'Ongles',
  'Cils',
  'Soins',
  'Manucure',
  'Pédicure',
  'Pose',
  'Remplissage',
  'Autre'
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];
```

**Fichiers modifiés** :
- `src/components/client/ClientGallery.tsx` : Import et utilisation de `SERVICE_CATEGORIES`
- `src/pages/PublicProfile.tsx` : Import et utilisation de `SERVICE_CATEGORIES`

## Changements Détaillés

### ClientGallery.tsx

**Avant** :
- Chargeait les catégories dynamiquement depuis les services
- Utilisait `serviceCategories` state
- Pas de vérification du `company_id`

**Après** :
- Utilise la liste fixe `SERVICE_CATEGORIES`
- Charge le `company_id` automatiquement si non fourni
- Vérifie que `company_id` existe avant upload
- Messages d'erreur clairs si `company_id` manquant

### PublicProfile.tsx

**Avant** :
- Extrayait les catégories des services actifs
- `serviceCategories` calculé dynamiquement
- Modal avec z-index potentiellement insuffisant

**Après** :
- Utilise la liste fixe `SERVICE_CATEGORIES`
- Suppression de la logique d'extraction des catégories
- Modal avec z-index élevé (100)
- Meilleure gestion du défilement avec `max-h-[90vh]`

## Liste des Catégories Officielles

Les 8 catégories disponibles pour la publication de photos :

1. **Ongles** - Travaux sur les ongles en général
2. **Cils** - Extensions et travaux sur les cils
3. **Soins** - Soins esthétiques divers
4. **Manucure** - Soins des mains et ongles
5. **Pédicure** - Soins des pieds et ongles
6. **Pose** - Pose d'extensions (ongles, cils)
7. **Remplissage** - Remplissage d'extensions existantes
8. **Autre** - Autres prestations

## Validation

### Règles de Validation Renforcées

1. **Catégorie** : Obligatoire, doit être l'une des 8 catégories prédéfinies
2. **Service** : Obligatoire, doit être un service actif du prestataire
3. **Company ID** : Vérifié automatiquement avant toute insertion
4. **Photo** : Fichier obligatoire avec prévisualisation

### Messages d'Erreur

- "Erreur: Company ID non défini. Veuillez rafraîchir la page." → Si `company_id` manquant
- "Veuillez sélectionner une catégorie" → Si catégorie non sélectionnée
- "Veuillez sélectionner un service" → Si service non sélectionné

## Flux de Publication Mis à Jour

### Source 1 : Galerie Cliente (Clients → Fiche → Galerie → Ses résultats)

1. Prestataire sélectionne des photos
2. Modal s'ouvre avec :
   - Prévisualisation des photos
   - **Sélecteur de catégorie** (liste fixe de 8 catégories)
   - **Sélecteur de service** (filtré par catégorie, tous les services actifs)
   - Description optionnelle
   - Message d'information sur la publication
3. Validation :
   - ✅ Vérification du `company_id`
   - ✅ Vérification de la catégorie
   - ✅ Vérification du service
4. Upload et insertion avec :
   - `company_id` : Chargé automatiquement si nécessaire
   - `service_name` : Catégorie sélectionnée (ex: "Ongles")
   - `service_id` : ID du service choisi
   - `show_in_gallery` : `true`
5. Photo visible dans les 3 emplacements

### Source 2 : Galerie Profil Public (Profil Public → Galerie → Bouton +)

1. Prestataire clique sur "+"
2. Sélectionne une photo
3. Modal s'ouvre avec **z-index 100** :
   - Prévisualisation de la photo
   - **Sélecteur de catégorie** (liste fixe de 8 catégories)
   - **Sélecteur de service** (filtré par catégorie)
   - Message d'information
4. Validation identique à Source 1
5. Upload et insertion
6. Photo visible dans les 3 emplacements

## Impact sur les Données Existantes

### Rétrocompatibilité

- Les photos existantes avec `service_name` défini continueront à s'afficher
- Si une photo a un `service_name` qui ne correspond pas aux nouvelles catégories, elle restera affichée mais ne pourra pas être créée via les nouveaux formulaires
- Les services existants gardent leur `service_type` actuel
- Seules les nouvelles photos utilisent les catégories prédéfinies

### Migration Recommandée (Optionnelle)

Si vous souhaitez normaliser les données existantes, vous pouvez :

1. Mapper les anciens `service_type` vers les nouvelles catégories
2. Mettre à jour les `service_name` dans `client_results_photos`
3. Standardiser les `service_type` dans la table `services`

Exemple de mapping :
- "Nail art" → "Ongles"
- "Extensions de cils" → "Cils"
- "Soin du visage" → "Soins"
- etc.

## Tests Recommandés

### Test 1 : Upload depuis Galerie Cliente
1. ✅ Aller dans Clients → Sélectionner une cliente → Galerie → Ses résultats
2. ✅ Cliquer sur upload
3. ✅ Sélectionner une photo
4. ✅ Vérifier que les 8 catégories s'affichent
5. ✅ Sélectionner une catégorie
6. ✅ Vérifier que les services se filtrent
7. ✅ Sélectionner un service
8. ✅ Publier
9. ✅ Vérifier que la photo apparaît dans :
   - Galerie de la cliente
   - Profil public du prestataire → Galerie
   - Feed "Pour toi" (côté client)
   - Section "Suivis" si la cliente suit le prestataire

### Test 2 : Upload depuis Profil Public
1. ✅ Aller dans Profil Public → Onglet Galerie
2. ✅ Cliquer sur le bouton "+"
3. ✅ Sélectionner une photo
4. ✅ Vérifier que le modal s'affiche correctement (pas de superposition)
5. ✅ Sélectionner catégorie et service
6. ✅ Publier
7. ✅ Vérifier la présence dans les 3 emplacements

### Test 3 : Validation des Champs
1. ✅ Essayer de publier sans catégorie → Message d'erreur
2. ✅ Essayer de publier sans service → Message d'erreur
3. ✅ Vérifier que le service selector est désactivé sans catégorie
4. ✅ Vérifier que les services se filtrent correctement par catégorie

### Test 4 : Modal Z-index
1. ✅ Ouvrir le modal d'upload depuis profil public
2. ✅ Vérifier qu'aucun élément d'arrière-plan n'est cliquable
3. ✅ Vérifier que le fond noir semi-transparent couvre tout
4. ✅ Vérifier que le contenu du modal est scrollable si long

## Points d'Attention

1. **Services sans service_type** : Si un service n'a pas de `service_type` défini, il n'apparaîtra pas dans la liste filtrée. Assurez-vous que tous vos services ont un `service_type` correspondant à l'une des 8 catégories.

2. **Cohérence des données** : Pour une meilleure expérience, vérifiez que les `service_type` dans votre table `services` correspondent aux catégories prédéfinies.

3. **Company ID** : Le système charge maintenant automatiquement le `company_id` si nécessaire, mais il est recommandé de s'assurer que `user_profiles.company_id` est bien renseigné pour chaque prestataire.

4. **Permissions RLS** : Vérifiez que les policies RLS sur `client_results_photos` permettent :
   - Aux prestataires d'insérer des photos avec leur `company_id`
   - Aux clientes de lire les photos avec `show_in_gallery = true`

## Résumé des Fichiers Modifiés

- ✅ `src/lib/categoryHelpers.ts` - Nouveau fichier avec les catégories
- ✅ `src/components/client/ClientGallery.tsx` - Catégories fixes + chargement company_id
- ✅ `src/pages/PublicProfile.tsx` - Catégories fixes + z-index modal
- ✅ `PHOTO_PUBLICATION_SYSTEM.md` - Documentation mise à jour

## Build

Le projet compile avec succès :
```
✓ 1719 modules transformed.
✓ built in 13.23s
```

Toutes les corrections ont été appliquées et le système est prêt pour les tests en conditions réelles.
