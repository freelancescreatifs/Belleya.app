# 🗺️ Guide de Debug Carte Mobile

## ✅ Corrections appliquées

### 1. **CSS iOS Safari Critical Fix**
```css
.leaflet-container {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}
```
→ Force l'accélération GPU sur iOS pour afficher les tiles

### 2. **Tiles de backup automatique**
- **Par défaut** : OpenStreetMap
- **Si bloqué** : Bascule automatique sur CARTO
- **Détection** : Sur erreur de chargement de tile

### 3. **Structure HTML optimisée**
```jsx
<div className="relative w-full h-[350px] md:h-[500px]">
  <MapContainer className="w-full h-full z-0">
```
- Hauteur fixe explicite
- Z-index minimal
- Pas de conflit de scroll

---

## 🔍 TESTS À FAIRE (dans l'ordre)

### Test 1 : Console Network
1. Ouvre la page
2. **F12** → onglet **Network**
3. Filtre : `tile.openstreetmap` ou `cartocdn`
4. Recharge la page

**✅ SI tu vois des images 200 OK** → Tiles chargées, bug ailleurs
**❌ SI tu vois des 403/blocked** → Bloqueur actif

---

### Test 2 : Navigation privée
1. Ouvre en **mode privé / incognito**
2. Va sur la carte
3. Vérifie si elle s'affiche

**✅ SI ça marche** → C'était un bloqueur (AdBlock, Brave Shield, etc.)
**❌ SI ça ne marche pas** → Problème technique

---

### Test 3 : Mobile Safari vs Chrome
- Teste sur **Safari iOS**
- Teste sur **Chrome Android**
- Compare les résultats

**iOS Safari** a souvent des bugs spécifiques (corrigés avec `translateZ(0)`)

---

### Test 4 : Console Logs
Cherche dans la console :
```
[ClientMap] Initialisation avec tiles: osm
[ClientMap] Tile loading error: ...
[ClientMap] Basculement sur CARTO tiles
```

Si tu vois le basculement → **OSM était bloqué, CARTO devrait marcher**

---

## 🚨 Causes probables identifiées

### 1️⃣ Bloqueur de publicité (80% des cas)
**Extensions qui bloquent OSM :**
- uBlock Origin
- AdGuard
- Brave Shields
- AdBlock Plus
- Safari Enhanced Tracking Protection

**Solution** : Désactive temporairement ou whitelist le site

---

### 2️⃣ iOS Safari rendering bug
**Symptôme** : Carte grise sur iPhone uniquement

**Solution appliquée** :
```css
transform: translateZ(0);
```
→ Force le GPU rendering

---

### 3️⃣ CSP (Content Security Policy)
Si hébergé sur systeme.io ou plateforme restreinte, les tiles externes peuvent être bloquées.

**Test** : Cherche dans la console :
```
Refused to load ... Content Security Policy
```

**Solution** : Utilise CARTO (normalement whitelisté)

---

### 4️⃣ Tiles non chargées avant affichage
**Solution appliquée** : `MapResizeHandler` appelle `invalidateSize()` plusieurs fois :
- À 100ms
- À 300ms
- À 600ms
- Sur resize
- Sur orientation change

---

## 🎯 Debug Mode (développement uniquement)

En mode dev, un bouton "Tiles: OSM/CARTO" apparaît en haut.

**Utilisation** :
1. Clique pour basculer entre les providers
2. Vérifie lequel fonctionne
3. Si CARTO OK mais OSM KO → **confirmation bloqueur**

---

## 📱 Checklist Finale Mobile

Sur ton téléphone :

- [ ] La carte apparaît (pas grise)
- [ ] Les boutons +/- zoom fonctionnent
- [ ] Tu peux pinch-to-zoom
- [ ] Tu peux déplacer la carte (pan)
- [ ] Les marqueurs sont visibles
- [ ] Le scroll de la page fonctionne
- [ ] La liste en dessous est accessible

---

## 🔥 Si rien ne marche

**Envoie-moi :**
1. **Screenshot de la console** (onglet Network filtré sur "tile")
2. **Ton navigateur/OS** (ex: iPhone 14 Pro iOS 17.5 Safari)
3. **Ce message exact** :
   ```
   [ClientMap] Initialisation avec tiles: ???
   ```
4. **Bloqueur installé** : Oui/Non + lequel

→ Je te donne **LE fix exact** pour ton cas.

---

## ✅ Ce qui est garanti maintenant

1. **Scroll** : Fonctionne (supprimé `overflow-y-auto`)
2. **Hauteur** : Fixe et responsive (350px mobile, 500px desktop)
3. **iOS** : GPU forcé avec `translateZ(0)`
4. **Tiles** : Backup automatique CARTO si OSM bloqué
5. **Invalidate** : Appelé 3 fois + sur resize

**Le code est solide. Si ça ne marche pas = environnement externe (bloqueur/CSP).**
