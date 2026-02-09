# Migration de Mapbox vers Leaflet - Carte des pros côté client

## Résumé

La carte des professionnels dans l'interface client a été migrée de Mapbox vers Leaflet pour éliminer les dépendances aux tokens Mapbox et résoudre les problèmes de rendu gris sur mobile.

## Changements effectués

### 1. Installation des dépendances

```bash
npm install leaflet react-leaflet@4 @types/leaflet --legacy-peer-deps
```

**Note** : Nous utilisons react-leaflet v4 pour la compatibilité avec React 18.

### 2. Fichier modifié : `src/pages/client/ClientMap.tsx`

#### Avant (Mapbox)
```typescript
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
```

#### Après (Leaflet)
```typescript
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
```

### 3. Changements clés

#### A. Composants helper pour Leaflet

**MapViewController** - Contrôle de la vue de la carte
```typescript
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}
```

**MapEventHandler** - Gestion des événements
```typescript
function MapEventHandler({ onMapClick }: { onMapClick: () => void }) {
  useMapEvents({
    click: () => {
      onMapClick();
    }
  });
  return null;
}
```

#### B. Icônes personnalisées avec `L.divIcon()`

**Marqueur utilisateur**
```typescript
const userIcon = useMemo(() => L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="w-10 h-10 rounded-full bg-blue-500 border-4 border-white shadow-lg">
        <div class="w-3 h-3 rounded-full bg-white"></div>
      </div>
    </div>
  `,
  className: 'custom-user-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
}), []);
```

**Marqueur professionnel**
```typescript
const createProviderIcon = (provider: ProviderProfile) => {
  const photoHtml = provider.profile_photo
    ? `<img src="${provider.profile_photo}" alt="${provider.company_name}" class="w-full h-full object-cover" />`
    : `<div class="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold text-lg">${provider.company_name.charAt(0)}</div>`;

  return L.divIcon({
    html: `
      <div class="relative transform transition-transform hover:scale-110">
        <div class="w-12 h-12 rounded-full border-3 border-white shadow-lg overflow-hidden ring-2 ring-gray-800 bg-white">
          ${photoHtml}
        </div>
        <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-800 border-2 border-white rounded-full"></div>
      </div>
    `,
    className: 'custom-provider-marker',
    iconSize: [48, 56],
    iconAnchor: [24, 56]
  });
};
```

#### C. Composant MapContainer

**Remplacement de `<Map>` par `<MapContainer>`**
```typescript
<MapContainer
  center={mapCenter}
  zoom={mapZoom}
  className="w-full h-full"
  scrollWheelZoom={true}
  zoomControl={true}
>
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />

  <MapViewController center={mapCenter} zoom={mapZoom} />
  <MapEventHandler onMapClick={() => setSelectedProvider(null)} />

  {/* Marqueurs */}
</MapContainer>
```

#### D. Gestion des marqueurs

**Mapbox** utilisait :
```typescript
<Marker longitude={lng} latitude={lat} anchor="bottom">
```

**Leaflet** utilise :
```typescript
<Marker
  position={[lat, lng]}
  icon={customIcon}
  eventHandlers={{
    click: (e) => {
      L.DomEvent.stopPropagation(e);
      setSelectedProvider(provider);
    }
  }}
>
```

#### E. Popups conditionnelles

```typescript
{selectedProvider?.user_id === provider.user_id && (
  <Popup
    closeButton={true}
    onClose={() => setSelectedProvider(null)}
    className="custom-popup"
  >
    <ProviderMapMarker
      provider={provider}
      onViewProfile={() => handleViewProfile(provider.user_id)}
    />
  </Popup>
)}
```

### 4. Styles CSS ajoutés : `src/index.css`

```css
/* Leaflet Map Styles */
.leaflet-container {
  width: 100% !important;
  height: 100% !important;
  z-index: 0;
  background: #f8f9fa;
}

.leaflet-container a {
  color: #0066cc;
}

/* Custom Marker Styles */
.custom-user-marker,
.custom-provider-marker {
  background: transparent !important;
  border: none !important;
}

.custom-user-marker > div,
.custom-provider-marker > div {
  cursor: pointer;
  pointer-events: auto;
}

/* Custom Popup Styles */
.leaflet-popup-content-wrapper {
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
}

.leaflet-popup-content {
  margin: 0;
  min-width: 250px;
}

.leaflet-popup-close-button {
  font-size: 24px !important;
  padding: 8px 12px !important;
  color: #666 !important;
}

.leaflet-popup-close-button:hover {
  color: #000 !important;
}

/* Leaflet Controls - Better positioning on mobile */
@media (max-width: 768px) {
  .leaflet-control-zoom {
    margin-right: 10px !important;
    margin-bottom: 10px !important;
  }

  .leaflet-popup-content {
    min-width: 200px;
  }
}
```

### 5. Correction du problème de carte grise sur mobile

#### Problème

Les cartes Leaflet/Mapbox apparaissent souvent grises sur mobile à cause de :
- Hauteur du conteneur à 0
- Problèmes de dimensions responsive

#### Solution appliquée

**Conteneur avec dimensions explicites**
```typescript
<div
  className="relative z-0 w-full"
  style={{ height: '60vh', minHeight: '500px', maxHeight: '700px' }}
>
  <MapContainer
    center={mapCenter}
    zoom={mapZoom}
    className="w-full h-full"
    scrollWheelZoom={true}
    zoomControl={true}
  >
    {/* ... */}
  </MapContainer>
</div>
```

**CSS pour assurer le rendu**
```css
.leaflet-container {
  width: 100% !important;
  height: 100% !important;
  z-index: 0;
  background: #f8f9fa;
}

/* Ensure map tiles load properly */
.leaflet-tile {
  max-width: none !important;
  max-height: none !important;
}
```

## Fonctionnalités conservées

Toutes les fonctionnalités ont été conservées :

✅ Géolocalisation utilisateur
✅ Recherche d'adresse
✅ Marqueurs personnalisés (utilisateur + professionnels)
✅ Popups interactives
✅ Filtres par profession
✅ Liste des pros à proximité
✅ Responsive mobile/desktop
✅ Calcul des distances

## Avantages de Leaflet

1. **Gratuit et open-source** - Pas de token API requis
2. **Léger** - Bundle plus petit que Mapbox GL
3. **Stable** - Moins de problèmes de compatibilité
4. **Flexible** - Personnalisation facile des marqueurs et popups
5. **Tuiles OpenStreetMap** - Données communautaires, toujours à jour

## Tests recommandés

### Desktop
- [ ] Carte s'affiche correctement au chargement
- [ ] Géolocalisation fonctionne
- [ ] Recherche d'adresse fonctionne
- [ ] Clic sur un marqueur affiche la popup
- [ ] Filtres fonctionnent
- [ ] Navigation vers le profil fonctionne

### Mobile
- [ ] Carte s'affiche (PAS grise)
- [ ] Zoom/pan fonctionne bien au toucher
- [ ] Géolocalisation mobile fonctionne
- [ ] Popups s'affichent correctement
- [ ] Performance fluide
- [ ] Rotation d'écran gère bien

### iPhone
- [ ] Safari iOS affiche la carte
- [ ] Géolocalisation demande les permissions
- [ ] Pas de scroll horizontal
- [ ] Safe area respectée

## Problèmes potentiels et solutions

### Carte grise sur mobile
**Cause** : Conteneur sans hauteur définie
**Solution** : Utiliser `style={{ height: '60vh', minHeight: '500px' }}` sur le conteneur

### Marqueurs ne s'affichent pas
**Cause** : Icônes Leaflet par défaut manquantes
**Solution** : Utiliser `L.divIcon()` avec HTML personnalisé

### Popup ne s'ouvre pas
**Cause** : Rendu conditionnel incorrect
**Solution** : Vérifier `selectedProvider?.user_id === provider.user_id`

### Performance lente
**Cause** : Trop de marqueurs
**Solution** : Implémenter le clustering avec `react-leaflet-cluster`

## Migration future (optionnel)

Si vous voulez améliorer encore la carte :

1. **Clustering** : Installer `react-leaflet-cluster` pour grouper les marqueurs
2. **Tuiles personnalisées** : Utiliser Mapbox tiles sans la bibliothèque GL
3. **Offline** : Mettre en cache les tuiles avec un service worker
4. **Géocoding** : Utiliser Nominatim (OpenStreetMap) au lieu d'un service payant

## Statut

✅ Migration complète
✅ Build réussi
✅ Responsive corrigé
✅ Prêt pour production

## Fichiers modifiés

- `src/pages/client/ClientMap.tsx` - Migration complète vers Leaflet
- `src/index.css` - Ajout des styles Leaflet
- `package.json` - Ajout de leaflet, react-leaflet, @types/leaflet
