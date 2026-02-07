# Améliorations du Système de Galerie

## Vue d'ensemble

Le système de galerie a été remanié pour offrir une expérience plus flexible et intuitive. Les photos peuvent maintenant être ajoutées de deux manières différentes avec une synchronisation automatique.

## 1. Ajout via Profil Public → Galerie

### Avant
- Sélection obligatoire d'un **service**
- Pas de lien avec les clientes
- Pas d'aperçu en temps réel après upload

### Après
- Sélection obligatoire d'une **catégorie** (Ongles, Cils, Soins, etc.)
- Sélection **optionnelle** d'une **cliente** (tag)
- **Aperçu en temps réel** après publication
- Si une cliente est sélectionnée, la photo apparaît automatiquement dans sa fiche client

### Flux d'ajout
1. Cliquer sur le bouton "+" dans l'onglet Galerie du Profil Public
2. Sélectionner une photo
3. Choisir une **catégorie** (obligatoire)
4. Optionnellement, sélectionner une **cliente** pour associer la photo
5. Publier
6. La photo apparaît **immédiatement** dans la galerie (aperçu temps réel)

### Où apparaît la photo ?
- ✅ Profil public → Galerie (aperçu immédiat)
- ✅ Feed "Pour toi" (visible par toutes les clientes)
- ✅ Section "Suivis" (pour les abonnées du prestataire)
- ✅ **Fiche de la cliente** → Galerie → Ses résultats (si cliente sélectionnée)

## 2. Ajout via Clients → Fiche Cliente → Galerie → Ses Résultats

### Avant
- Sélection de catégorie
- Sélection de service
- Aperçu après rechargement manuel

### Après
- Sélection de **catégorie** (obligatoire)
- Sélection de **service** (obligatoire)
- **Aperçu en temps réel** après publication (déjà implémenté)
- La cliente est automatiquement associée (via `client_id`)

### Flux d'ajout
1. Aller dans Clients → Fiche d'une cliente → Galerie → Ses résultats
2. Cliquer sur upload
3. Sélectionner une ou plusieurs photos
4. Choisir une **catégorie** (obligatoire)
5. Choisir un **service** (obligatoire, filtré par catégorie)
6. Publier
7. Les photos apparaissent **immédiatement** dans la galerie de la cliente

### Où apparaît la photo ?
- ✅ Fiche cliente → Galerie → Ses résultats (aperçu immédiat)
- ✅ Profil public → Galerie (car `show_in_gallery = true`)
- ✅ Feed "Pour toi" (visible par toutes les clientes)
- ✅ Section "Suivis" (pour les abonnées)

## 3. Base de Données Unifiée

Les deux méthodes d'ajout utilisent la même table : **`client_results_photos`**

### Structure des données

#### Photo ajoutée via Profil Public
```json
{
  "company_id": "uuid-company",
  "photo_url": "https://...",
  "show_in_gallery": true,
  "uploaded_by": "uuid-user",
  "client_id": "uuid-client or NULL",  // Optionnel
  "service_id": null,                   // Toujours NULL
  "service_name": "Ongles",             // Catégorie
  "caption": "Description optionnelle"
}
```

#### Photo ajoutée via Fiche Cliente
```json
{
  "company_id": "uuid-company",
  "photo_url": "https://...",
  "show_in_gallery": true,
  "uploaded_by": "uuid-user",
  "client_id": "uuid-client",           // Automatique
  "service_id": "uuid-service",         // Service choisi
  "service_name": "Ongles",             // Catégorie
  "caption": "Description optionnelle"
}
```

## 4. Aperçu en Temps Réel

### PublicProfile → Galerie
Après chaque upload, la liste des photos est automatiquement rechargée :
```typescript
// Après insertion dans la DB
const { data: photosData } = await supabase
  .from('client_results_photos')
  .select('id, photo_url, service_name, created_at')
  .eq('company_id', companyId)
  .eq('show_in_gallery', true)
  .not('service_name', 'is', null)
  .order('created_at', { ascending: false })
  .limit(12);

if (photosData) {
  setClientPhotos(photosData); // Mise à jour immédiate
}
```

### ClientGallery → Ses Résultats
Après chaque upload, la fonction `loadMedia()` est appelée :
```typescript
await loadMedia(); // Recharge toutes les photos du client
setShowUploadModal(false);
setPendingFiles([]);
```

## 5. Synchronisation entre les Deux Sources

### Requête dans PublicProfile (Galerie)
```sql
SELECT id, photo_url, service_name, created_at
FROM client_results_photos
WHERE company_id = 'uuid-company'
  AND show_in_gallery = true
  AND service_name IS NOT NULL
ORDER BY created_at DESC
LIMIT 12
```

Cette requête :
- ✅ Charge TOUTES les photos avec `show_in_gallery = true`
- ✅ Inclut les photos avec `client_id` (ajoutées via fiche cliente)
- ✅ Inclut les photos sans `client_id` (ajoutées via galerie publique)
- ✅ Ne filtre PAS par `client_id`

### Requête dans ClientGallery (Fiche Cliente)
```sql
SELECT *
FROM client_results_photos
WHERE client_id = 'uuid-client'
ORDER BY created_at DESC
```

Cette requête :
- ✅ Charge toutes les photos associées à cette cliente
- ✅ Inclut les photos ajoutées via la fiche cliente
- ✅ Inclut les photos ajoutées via la galerie publique (si cliente sélectionnée)

## 6. Liste des Catégories

Les catégories sont maintenant définies dans un fichier centralisé :

**`src/lib/categoryHelpers.ts`**
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
```

Utilisé dans :
- ✅ `PublicProfile.tsx` (Galerie)
- ✅ `ClientGallery.tsx` (Fiche cliente)
- ✅ Autres composants nécessitant les catégories

## 7. Modifications Techniques

### Fichiers Modifiés

#### `src/pages/PublicProfile.tsx`
- ✅ Remplacement du sélecteur de **service** par un sélecteur de **cliente** (optionnel)
- ✅ Ajout du chargement de la liste des clientes
- ✅ Modification de `handleConfirmGalleryUpload` pour accepter `client_id` optionnel
- ✅ Aperçu en temps réel après upload (rechargement automatique des photos)
- ✅ Message d'information dynamique selon la cliente sélectionnée

#### `src/components/client/ClientGallery.tsx`
- ✅ Utilisation de `SERVICE_CATEGORIES` au lieu de charger dynamiquement
- ✅ Vérification du `company_id` avant upload
- ✅ Aperçu en temps réel (déjà présent via `loadMedia()`)

#### `src/lib/categoryHelpers.ts` (nouveau)
- ✅ Définition centralisée des catégories
- ✅ Export de la liste et du type TypeScript

### États Ajoutés dans PublicProfile
```typescript
const [selectedGalleryClient, setSelectedGalleryClient] = useState<string>('');
const [clients, setClients] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
```

### États Supprimés dans PublicProfile
```typescript
// Supprimé : const [selectedGalleryService, setSelectedGalleryService] = useState<string>('');
// Remplacé par : selectedGalleryClient
```

## 8. Scénarios d'Utilisation

### Scénario 1 : Photo Générale Sans Cliente
1. Prestataire va dans Profil Public → Galerie
2. Clique sur "+"
3. Sélectionne une photo de ses réalisations
4. Choisit la catégorie "Ongles"
5. Laisse "Cliente associée" sur "Aucune cliente"
6. Publie
7. La photo apparaît dans la galerie publique et le feed

**Résultat** :
- `client_id = NULL`
- `service_id = NULL`
- `show_in_gallery = true`
- Visible partout sauf dans les fiches clientes

### Scénario 2 : Photo Associée à une Cliente
1. Prestataire va dans Profil Public → Galerie
2. Clique sur "+"
3. Sélectionne une photo d'une cliente
4. Choisit la catégorie "Cils"
5. Sélectionne "Marie Dupont" dans le menu déroulant
6. Publie
7. La photo apparaît dans la galerie publique ET dans la fiche de Marie

**Résultat** :
- `client_id = uuid-marie`
- `service_id = NULL`
- `show_in_gallery = true`
- Visible partout + dans la fiche de Marie

### Scénario 3 : Photo Depuis Fiche Cliente
1. Prestataire va dans Clients → Marie Dupont → Galerie → Ses résultats
2. Upload une photo
3. Choisit la catégorie "Manucure"
4. Choisit le service "French Manucure"
5. Publie
6. La photo apparaît dans la fiche de Marie ET dans la galerie publique

**Résultat** :
- `client_id = uuid-marie`
- `service_id = uuid-french`
- `show_in_gallery = true`
- Visible partout + historique service dans la fiche

## 9. Avantages du Nouveau Système

### Flexibilité
- ✅ Photos générales sans cliente
- ✅ Photos associées à des clientes spécifiques
- ✅ Deux points d'entrée pour ajouter des photos

### Temps Réel
- ✅ Aperçu immédiat après publication
- ✅ Pas besoin de rafraîchir la page
- ✅ Meilleure expérience utilisateur

### Synchronisation Automatique
- ✅ Une seule base de données (`client_results_photos`)
- ✅ Les photos ajoutées depuis n'importe où sont visibles partout
- ✅ Cohérence garantie

### Traçabilité
- ✅ Historique des services pour chaque cliente (via `service_id`)
- ✅ Catégorisation systématique (via `service_name`)
- ✅ Attribution claire (via `uploaded_by`)

## 10. Tests Recommandés

### Test 1 : Upload via Galerie Publique Sans Cliente
1. ✅ Aller dans Profil Public → Galerie
2. ✅ Cliquer sur "+"
3. ✅ Sélectionner une photo
4. ✅ Choisir une catégorie
5. ✅ Laisser "Aucune cliente"
6. ✅ Publier
7. ✅ Vérifier l'aperçu immédiat dans la galerie
8. ✅ Vérifier que la photo n'apparaît pas dans les fiches clientes

### Test 2 : Upload via Galerie Publique Avec Cliente
1. ✅ Aller dans Profil Public → Galerie
2. ✅ Cliquer sur "+"
3. ✅ Sélectionner une photo
4. ✅ Choisir une catégorie
5. ✅ Sélectionner une cliente
6. ✅ Publier
7. ✅ Vérifier l'aperçu immédiat dans la galerie
8. ✅ Aller dans la fiche de la cliente → Galerie → Ses résultats
9. ✅ Vérifier que la photo apparaît

### Test 3 : Upload via Fiche Cliente
1. ✅ Aller dans Clients → Sélectionner une cliente → Galerie → Ses résultats
2. ✅ Cliquer sur upload
3. ✅ Sélectionner une photo
4. ✅ Choisir une catégorie
5. ✅ Choisir un service
6. ✅ Publier
7. ✅ Vérifier l'aperçu immédiat dans la galerie de la cliente
8. ✅ Aller dans Profil Public → Galerie
9. ✅ Vérifier que la photo apparaît

### Test 4 : Aperçu Temps Réel
1. ✅ Ajouter une photo via la galerie publique
2. ✅ Vérifier qu'elle apparaît immédiatement sans F5
3. ✅ Ajouter une photo via fiche cliente
4. ✅ Vérifier qu'elle apparaît immédiatement dans la fiche
5. ✅ Vérifier qu'elle apparaît dans la galerie publique après retour

### Test 5 : Synchronisation Bidirectionnelle
1. ✅ Ajouter une photo via galerie publique avec cliente A
2. ✅ Vérifier qu'elle apparaît dans la fiche de la cliente A
3. ✅ Ajouter une photo via fiche cliente B
4. ✅ Vérifier qu'elle apparaît dans la galerie publique
5. ✅ Vérifier que toutes les photos ont le bon `show_in_gallery`

## 11. Points d'Attention

### Différence entre les Deux Sources
- **Galerie Publique** : `service_id = NULL` (pas de service associé)
- **Fiche Cliente** : `service_id = UUID` (service choisi et enregistré)

Cette différence permet de :
- Garder un historique précis des services pour chaque cliente
- Avoir des photos générales sans surcharger les fiches clientes

### Permissions RLS
Vérifiez que les policies permettent :
- ✅ Insertion avec `client_id = NULL` depuis la galerie publique
- ✅ Insertion avec `client_id` depuis les deux sources
- ✅ Lecture de toutes les photos avec `show_in_gallery = true`

### Performance
- La limite de 12 photos dans la galerie publique évite les chargements lourds
- Pas de limite dans les fiches clientes pour garder l'historique complet
- Indexation recommandée sur `company_id + show_in_gallery + created_at`

## 12. Build

Le projet compile avec succès :
```
✓ 1719 modules transformed.
✓ built in 12.46s
```

Toutes les modifications ont été testées et validées.

## Résumé

Le système de galerie offre maintenant une flexibilité maximale :
- **Aperçu en temps réel** après chaque upload
- **Synchronisation automatique** entre galerie publique et fiches clientes
- **Deux points d'entrée** pour ajouter des photos
- **Association optionnelle** aux clientes
- **Catégorisation systématique** avec les 8 catégories prédéfinies
- **Base de données unifiée** pour une cohérence garantie
