# Dépannage Mapbox - Carte grise

## Problème résolu

La carte Mapbox affichait une page grise car plusieurs vérifications critiques manquaient.

## Corrections appliquées

### 1. Vérification du token au démarrage
```typescript
useEffect(() => {
  if (!MAPBOX_TOKEN) {
    console.error('MAPBOX TOKEN MANQUANT');
    setMapError('Token Mapbox manquant...');
    return;
  }

  if (!MAPBOX_TOKEN.startsWith('pk.')) {
    console.error('TOKEN MAPBOX INVALIDE');
    setMapError('Token Mapbox invalide...');
    return;
  }
}, []);
```

### 2. Hauteur explicite du conteneur
**Avant** :
```tsx
<div className="h-[60dvh] min-h-[500px] max-h-[700px]">
```

**Après** :
```tsx
<div style={{ height: '60vh', minHeight: '500px', maxHeight: '700px' }}>
```

### 3. Gestion des erreurs avec UI
```tsx
{mapError ? (
  <div className="h-full w-full flex items-center justify-center bg-gray-100">
    <AlertCircle className="w-12 h-12 text-red-500" />
    <p>{mapError}</p>
    <a href="https://account.mapbox.com/access-tokens/">
      Obtenir un token Mapbox
    </a>
  </div>
) : (
  <Map ... />
)}
```

### 4. Callbacks onLoad et onError
```tsx
<Map
  onLoad={() => {
    console.log('Carte chargée');
    setMapLoaded(true);
    mapRef.current?.resize();
  }}
  onError={(e) => {
    console.error('Erreur Mapbox:', e);
    if (e.error?.message?.includes('401')) {
      setMapError('Token invalide (401)');
    }
  }}
/>
```

### 5. ResizeObserver pour mobile
```tsx
useEffect(() => {
  if (!mapRef.current || !mapLoaded) return;

  const handleResize = () => {
    requestAnimationFrame(() => {
      mapRef.current?.resize();
    });
  };

  const resizeObserver = new ResizeObserver(handleResize);
  if (containerRef.current) {
    resizeObserver.observe(containerRef.current);
  }

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  return () => {
    resizeObserver.disconnect();
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  };
}, [mapLoaded]);
```

### 6. Centre et zoom par défaut
```typescript
const DEFAULT_CENTER: { lng: number; lat: number } = { lng: 2.3522, lat: 48.8566 }; // Paris
const DEFAULT_ZOOM = 11;
```

### 7. Propriété reuseMaps
```tsx
<Map
  reuseMaps
  // Évite de recréer une instance à chaque rendu
/>
```

## Checklist de diagnostic

Si la carte reste grise, vérifiez dans l'ordre :

### 1. Token Mapbox présent
```bash
# Dans le terminal
echo $VITE_MAPBOX_TOKEN

# Ou dans la console navigateur (F12)
console.log(import.meta.env.VITE_MAPBOX_TOKEN);
```

**Attendu** : `pk.eyJ...` (commence par `pk.`)

### 2. Fichier .env configuré
```env
VITE_MAPBOX_TOKEN=pk.votre_token_ici
```

**Important** : Après modification du .env, redémarrer le serveur de dev !

### 3. Console navigateur (F12)
Recherchez ces messages :

**✅ Succès** :
```
Mapbox token OK: pk.eyJ...
Carte Mapbox chargée avec succès
```

**❌ Erreurs courantes** :
```
MAPBOX TOKEN MANQUANT
→ Vérifier .env et redémarrer le serveur

TOKEN MAPBOX INVALIDE
→ Vérifier que le token commence par "pk."

Error: 401 Unauthorized
→ Token expiré ou invalide sur Mapbox

Style not found
→ Vérifier mapStyle="mapbox://styles/mapbox/light-v11"
```

### 4. Network (onglet Réseau)
Recherchez les requêtes vers `api.mapbox.com`

**✅ Status 200** : Token valide, tuiles chargées
**❌ Status 401** : Token invalide
**❌ Status 404** : Style introuvable

### 5. Hauteur du conteneur
Dans la console :
```javascript
document.querySelector('.mapboxgl-map').offsetHeight
```

**Attendu** : > 0 (ex: 500, 600)
**Erreur** : 0 → Le conteneur n'a pas de hauteur

### 6. CSS Mapbox chargé
```javascript
document.querySelector('link[href*="mapbox-gl.css"]')
```

**Attendu** : Un élément `<link>`
**Erreur** : `null` → CSS non importé

## Solutions rapides

### Carte grise après déploiement

**Problème** : Le token n'est pas dans les variables d'environnement de production

**Solution** :
1. Aller dans les paramètres de déploiement (Netlify, Vercel, etc.)
2. Ajouter la variable : `VITE_MAPBOX_TOKEN=pk.votre_token_ici`
3. Redéployer l'application

### Carte grise sur mobile uniquement

**Problème** : Hauteur du conteneur non calculée sur mobile

**Solution déjà appliquée** :
- Style inline avec hauteur fixe : `style={{ height: '60vh' }}`
- ResizeObserver pour les changements d'orientation
- Callback `onLoad` avec `resize()`

### Token valide mais carte grise

**Problème** : Le style n'est pas trouvé

**Solution** :
Vérifier que le style est bien :
```typescript
mapStyle="mapbox://styles/mapbox/light-v11"
```

Styles valides :
- `mapbox://styles/mapbox/light-v11` (gris/blanc) ✅
- `mapbox://styles/mapbox/streets-v12` (classique)
- `mapbox://styles/mapbox/dark-v11` (sombre)
- `mapbox://styles/mapbox/satellite-v9` (satellite)

### Erreur "Invalid LatLng"

**Problème** : Coordonnées invalides

**Solution déjà appliquée** :
- Centre par défaut sur Paris : `[2.3522, 48.8566]`
- Vérification des coordonnées des providers

## Logs de débogage

Les logs suivants apparaissent maintenant dans la console :

**Au chargement** :
```
Mapbox token OK: pk.eyJ1IjoiYmVs...
```

**Carte chargée** :
```
Carte Mapbox chargée avec succès
```

**Prévisualisation adresse** :
```
Carte prévisualisation chargée
```

**Erreurs** :
```
MAPBOX TOKEN MANQUANT: { token: '', env: undefined }
TOKEN MAPBOX INVALIDE: abc123...
Erreur Mapbox: { error: { message: '401 Unauthorized' } }
```

## Test de validation

Pour tester que tout fonctionne :

1. **Ouvrir la console** (F12)
2. **Aller sur l'onglet Carte** (espace client)
3. **Vérifier les logs** :
   - ✅ "Mapbox token OK"
   - ✅ "Carte Mapbox chargée avec succès"
4. **Vérifier visuellement** :
   - ✅ Carte visible avec fond gris clair
   - ✅ Contrôles de zoom visibles (coin supérieur droit)
   - ✅ Markers visibles (si prestataires présents)

## Support

Si la carte reste grise malgré ces corrections :

1. Vérifier la version de `react-map-gl` : `7.1.7`
2. Vérifier la version de `mapbox-gl` : `3.x`
3. Consulter les logs dans la console (F12)
4. Tester avec un token Mapbox fraîchement créé
5. Tester sur un autre navigateur

## Token Mapbox gratuit

Plan gratuit Mapbox :
- ✅ 50 000 chargements de carte/mois
- ✅ 100 000 requêtes de géocodage/mois
- ✅ Pas de carte bancaire requise

Créer un token : [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
