# Guide de configuration Mapbox

## Vue d'ensemble

La carte des prestataires dans l'espace client utilise Mapbox GL JS avec un style gris et blanc minimaliste (`light-v11`).

## Configuration du token Mapbox

### 1. Créer un compte Mapbox

1. Rendez-vous sur [https://account.mapbox.com/auth/signup/](https://account.mapbox.com/auth/signup/)
2. Créez un compte gratuit (le plan gratuit inclut 50 000 chargements de carte par mois)

### 2. Obtenir votre token d'accès

1. Une fois connecté, allez sur [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
2. Copiez votre **Default public token** (commence par `pk.`)
3. Ou créez un nouveau token en cliquant sur "Create a token"

### 3. Configurer le token dans l'application

#### Option A : Fichier .env (Développement)

Ajoutez la ligne suivante dans votre fichier `.env` :

```env
VITE_MAPBOX_TOKEN=pk.votre_token_ici
```

#### Option B : Variables d'environnement de production

Pour déployer en production (Netlify, Vercel, etc.), ajoutez la variable d'environnement :

**Nom** : `VITE_MAPBOX_TOKEN`
**Valeur** : `pk.votre_token_ici`

## Style de la carte

Le style utilisé est `mapbox://styles/mapbox/light-v11`, qui offre :
- Design gris et blanc minimaliste
- Excellente lisibilité
- Design professionnel et épuré
- Compatible avec tous les thèmes d'application

### Autres styles disponibles

Vous pouvez modifier le style dans `src/pages/client/ClientMap.tsx` :

```typescript
mapStyle="mapbox://styles/mapbox/light-v11"  // Style actuel (gris et blanc)
// Alternatives :
// mapStyle="mapbox://styles/mapbox/streets-v12"  // Classique avec couleurs
// mapStyle="mapbox://styles/mapbox/dark-v11"     // Mode sombre
// mapStyle="mapbox://styles/mapbox/satellite-v9" // Vue satellite
```

### Créer un style personnalisé

1. Allez sur [Mapbox Studio](https://studio.mapbox.com/)
2. Cliquez sur "New style"
3. Choisissez "Blank" ou un template
4. Personnalisez votre style (couleurs, typographie, etc.)
5. Publiez le style
6. Copiez l'URL du style (format : `mapbox://styles/username/style-id`)
7. Remplacez le `mapStyle` dans le code

## Fonctionnalités de la carte

### Markers personnalisés
- Photo du prestataire en rond
- Badge gris foncé en bas
- Effet hover avec scale
- Clicable pour ouvrir la popup

### Popup
- Affiche les informations du prestataire
- Bouton "Voir le profil"
- Design cohérent avec l'UI de l'app
- Fermeture automatique au clic extérieur

### Contrôles
- **Navigation** : Zoom +/-, boussole, rotation
- **Géolocalisation** : Bouton pour centrer sur la position utilisateur
- Design minimaliste avec bordures grises

### Recherche
- Recherche par adresse ou ville
- Géocodage automatique
- Centrage automatique sur le résultat

## Compatibilité

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Chrome Android)
- ✅ Tablette (iPad, Android)
- ✅ Responsive design

## Performance

### Optimisations appliquées
- Chargement des tuiles à la demande
- Mise en cache automatique des tuiles
- Rendering optimisé avec WebGL
- Touch gestures natifs sur mobile

### Limites du plan gratuit Mapbox
- **50 000** chargements de carte par mois
- **100 000** requêtes de géocodage par mois
- Au-delà : 0,50 $ pour 1 000 chargements supplémentaires

## Dépannage

### La carte ne s'affiche pas

1. **Vérifier le token**
   - Ouvrez la console développeur (F12)
   - Cherchez des erreurs Mapbox
   - Vérifiez que `VITE_MAPBOX_TOKEN` est bien défini

2. **Token invalide**
   ```
   Error: Invalid access token
   ```
   → Vérifiez que votre token commence par `pk.` et est valide sur Mapbox

3. **Quota dépassé**
   ```
   Error: Rate limit exceeded
   ```
   → Vérifiez votre usage sur [https://account.mapbox.com/](https://account.mapbox.com/)

### Les markers ne s'affichent pas

Vérifiez que les prestataires ont :
- `latitude` non null
- `longitude` non null
- `profile_photo` définie
- `address` définie

### La géolocalisation ne fonctionne pas

1. **Permission refusée** : L'utilisateur doit autoriser la géolocalisation dans son navigateur
2. **HTTPS requis** : La géolocalisation nécessite une connexion sécurisée (https://)
3. **Mobile** : Vérifier que les services de localisation sont activés

## Migration depuis Leaflet

### Changements principaux

| Leaflet | Mapbox |
|---------|--------|
| `react-leaflet` | `react-map-gl` |
| `TileLayer` | Style intégré |
| `L.icon()` | Composants React natifs |
| `position={[lat, lng]}` | `latitude={lat} longitude={lng}` |

### Avantages de Mapbox

- ✅ Meilleure performance (WebGL)
- ✅ Styles intégrés professionnels
- ✅ Meilleures animations et transitions
- ✅ Support natif des gestures mobiles
- ✅ Meilleure qualité des tuiles
- ✅ API plus moderne

## Support

Pour toute question ou problème :
- Documentation Mapbox : [https://docs.mapbox.com/](https://docs.mapbox.com/)
- Support Mapbox : [https://support.mapbox.com/](https://support.mapbox.com/)
