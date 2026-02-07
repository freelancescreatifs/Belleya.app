# DEBUG — CLIENT DETAIL DRAWER UI AUDIT

## ÉTAT ACTUEL : CE QUI EST AFFICHÉ

### ✅ SECTIONS TOUJOURS VISIBLES (peu importe les données)

#### 1. HEADER
- ✅ Nom + Prénom de la cliente
- ✅ Badge de statut (regular/VIP/à risque)
- ✅ Bouton "Modifier" (icône crayon)
- ✅ Bouton "Archiver" ou "Désarchiver" (icône poubelle)
- ✅ Bouton "Fermer" (croix)

#### 2. PHOTO + STATS PRINCIPALES
- ✅ Photo cliente (ou initiales si pas de photo)
- ✅ Bouton upload photo (icône upload sur la photo)
- ✅ **4 cartes stats** (TOUJOURS affichées) :
  - Cliente depuis : `stats.clientSince` ou "—"
  - Total dépensé : `stats.totalSpent` (0.00 € par défaut)
  - Dernier RDV : `stats.lastAppointment` ou "—"
  - Prochain RDV : `stats.nextAppointment` ou "—"

#### 3. STATS SECONDAIRES
- ✅ **3 cartes** (TOUJOURS affichées) :
  - RDV réalisés : `stats.completedAppointments`
  - Fréquence moy. : `stats.averageFrequencyDays` ou "—"
  - Points fidélité : `client.loyalty_points` ou 0

#### 4. ONGLETS
- ✅ **3 onglets** (TOUJOURS affichés) :
  - Informations (`revenues.length` dans le compteur si vide affiche "0")
  - Recettes (`revenues.length`)
  - Rendez-vous (`appointments.length`)

---

### ⚠️ SECTIONS CONDITIONNELLES (affichées SEULEMENT si conditions remplies)

#### A) PROGRAMME DE FIDÉLITÉ
**Condition** : `stats.completedAppointments >= 3` OU `stats.clientStatus === 'loyal'`

Si condition = FALSE → **Section masquée complètement**

Si condition = TRUE → Affiche :
- Badge "Cliente fidèle" (si loyale)
- Barre de progression vers récompense (sur 10 RDV)
- Texte "Plus que X RDV pour débloquer..."

**CODE** : `src/components/client/ClientDetailDrawer.tsx:551`
```tsx
{(stats.clientStatus === 'loyal' || stats.completedAppointments >= 3) && (
  <div className="bg-gradient-to-r from-yellow-50 to-amber-50...">
    Programme de fidélité...
  </div>
)}
```

#### B) BOUTON "AJOUTER UNE RECETTE"
**Condition** : Prop `onAddRevenue` passée depuis Clients.tsx

Si prop absente → **Bouton masqué**
Si prop présente → Bouton affiché

**Actuellement** : Bouton affiché mais ne fait qu'un `console.log` (non fonctionnel)

**CODE** : `src/pages/Clients.tsx:984`
```tsx
onAddRevenue={(clientId) => {
  console.log('Add revenue for client:', clientId);
}}
```

#### C) BOUTON "PRENDRE RDV"
**Condition** : Prop `onAddAppointment` passée depuis Clients.tsx

Si prop absente → **Bouton masqué**
Si prop présente → Bouton affiché

**Actuellement** : ✅ Fonctionnel — ouvre le modal CreateAppointmentModal

---

### 📊 CONTENU DES ONGLETS

#### ONGLET "INFORMATIONS"
Affiche les champs NON-VIDES :
- Téléphone (si renseigné)
- Email (si renseigné)
- Instagram (si renseigné)
- Date de naissance + âge (si renseigné)
- Type de peau (si renseigné)
- Type d'ongles (si renseigné)
- Notes (si renseignées)

**Si TOUS les champs sont vides** → L'onglet affiche un espace blanc (pas d'empty state)

#### ONGLET "RECETTES"
**Si `revenues.length > 0`** :
- Bloc "Dépenses par prestation" avec breakdown
- Liste des recettes chronologique

**Si `revenues.length === 0`** :
- Empty state : "Aucune recette enregistrée pour cette cliente"

#### ONGLET "RENDEZ-VOUS"
**Si `appointments.length > 0`** :
- Liste des RDV avec badges (Terminé/À venir/Annulé)

**Si `appointments.length === 0`** :
- Empty state : "Aucun rendez-vous enregistré pour cette cliente"

---

## 🔍 DIAGNOSTIC : POURQUOI "TOUT NE S'AFFICHE PAS" ?

### CAUSE 1 : DONNÉES MANQUANTES (le plus probable)
Si la cliente n'a :
- Aucune recette → `totalSpent = 0€`, stats vides
- Aucun RDV → `lastAppointment = "—"`, `nextAppointment = "—"`
- Moins de 3 RDV complétés → **Programme fidélité masqué**

**→ Sections affichées : Header + Photo + Stats (avec "—") + Onglets vides**

### CAUSE 2 : ERREURS SILENCIEUSES DE FETCH
Si une requête Supabase échoue (RLS, permissions, etc.) :
- `revenues` reste à `[]`
- `appointments` reste à `[]`
- `stats` reste à valeurs par défaut

**Solution** : Ouvrir la console navigateur et chercher :
- `[ClientDetailDrawer] Client loaded: {...}`
- `[ClientDetailDrawer] Revenues loaded: X items`
- `[ClientDetailDrawer] Appointments loaded: X items`
- `[ClientDetailDrawer] Stats calculated: {...}`

Si ces logs n'apparaissent pas → problème de fetch

### CAUSE 3 : BOUTON "AJOUTER RECETTE" NON FONCTIONNEL
Actuellement le bouton existe mais ne fait rien (juste console.log).

**Pour le rendre fonctionnel**, deux options :
1. Rediriger vers la page Finances avec client pré-sélectionné
2. Créer un modal "Ajouter recette" dans la fiche cliente

---

## 🧪 TEST À FAIRE

### Étape 1 : Vérifier les logs console
Ouvrir une fiche cliente et chercher dans la console :
```
[ClientDetailDrawer] Loading data for client: <id>
[ClientDetailDrawer] Client loaded: {...}
[ClientDetailDrawer] Revenues loaded: X items
[ClientDetailDrawer] Appointments loaded: X items
[ClientDetailDrawer] Stats calculated: {...}
[ClientDetailDrawer] Rendering with: {...}
```

### Étape 2 : Créer des données de test
**Cliente avec données complètes** :
- Créer une cliente
- Ajouter 5 recettes (via page Finances)
- Créer 3 RDV passés + 1 RDV futur (via Agenda)
- Retourner sur la fiche cliente

**Résultat attendu** :
- Stats remplies (total dépensé, dates RDV)
- Programme fidélité visible (car >= 3 RDV)
- Onglets Recettes et Rendez-vous avec contenu

### Étape 3 : Vérifier que TOUT s'affiche
Checklist visuelle :
- [ ] Header avec nom + badge
- [ ] Photo + bouton upload
- [ ] 4 cartes stats (avec valeurs ou "—")
- [ ] 3 cartes secondaires
- [ ] Programme fidélité (si >= 3 RDV)
- [ ] 2 boutons actions (Ajouter recette + Prendre RDV)
- [ ] 3 onglets cliquables
- [ ] Contenu des onglets (ou empty state)

---

## ✅ PROCHAINES ACTIONS

### Action 1 : Rendre le bouton "Ajouter recette" fonctionnel
Modifier `src/pages/Clients.tsx:984` pour rediriger vers Finances :

```tsx
onAddRevenue={(clientId) => {
  // Option 1 : Redirection
  window.location.href = `/finances?clientId=${clientId}`;

  // Option 2 : Modal (à créer)
  setShowAddRevenueModal(true);
  setSelectedClientId(clientId);
}}
```

### Action 2 : Améliorer l'onglet Info quand vide
Si tous les champs sont vides, afficher un message :
```tsx
{activeTab === 'info' && (
  <div className="space-y-4">
    {!client.phone && !client.email && !client.instagram_handle && !client.notes ? (
      <div className="text-center py-12 text-gray-500">
        Aucune information complémentaire renseignée
      </div>
    ) : (
      // Champs existants...
    )}
  </div>
)}
```

### Action 3 : Retirer les logs console (production)
Une fois le debug terminé, supprimer tous les `console.log('[ClientDetailDrawer]...`

---

## 📝 RÉSUMÉ POUR L'UTILISATEUR

**CE QUI EST DÉJÀ AFFICHÉ** :
- ✅ Toutes les sections principales (header, photo, stats, onglets)
- ✅ Empty states pour recettes et RDV vides
- ✅ Bouton "Prendre RDV" fonctionnel

**CE QUI PEUT MANQUER** :
- ⚠️ Programme fidélité (masqué si < 3 RDV)
- ⚠️ Bouton "Ajouter recette" non fonctionnel (juste un log)
- ⚠️ Stats vides si aucune donnée (affichent "—" ou "0€")

**DIAGNOSTIC RECOMMANDÉ** :
1. Ouvrir la console navigateur
2. Cliquer sur une cliente
3. Vérifier les logs `[ClientDetailDrawer]`
4. Si les logs montrent 0 recettes/RDV → créer des données de test
5. Si les logs n'apparaissent pas → problème de requête/permissions

**FIX NÉCESSAIRE** :
- Rendre le bouton "Ajouter recette" fonctionnel (redirection ou modal)
