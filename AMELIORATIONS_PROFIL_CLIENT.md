# Améliorations suggérées pour le Profil Client

## ÉTAT ACTUEL

### Informations modifiables actuellement
Le client peut actuellement modifier sur son profil:
- ✅ Prénom (first_name)
- ✅ Nom (last_name)
- ✅ Téléphone (phone)
- ✅ Photo de profil (photo_url)

### Page: `/client/profile` (ClientProfile.tsx)

---

## AMÉLIORATIONS PROPOSÉES

### 1. Informations personnelles enrichies

#### A. Date d'anniversaire
**Champ:** `birth_date` (existe dans la table `clients`)

**Avantages:**
- Le pro peut envoyer un message d'anniversaire personnalisé
- Offres spéciales pour l'anniversaire du client
- Calcul de l'âge pour services adaptés (ex: soins anti-âge)
- Segmentation marketing par tranche d'âge

**UI suggérée:**
```tsx
<div>
  <label>Date d'anniversaire (optionnel)</label>
  <input
    type="date"
    value={formData.birth_date}
    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
  />
  <p className="text-xs text-gray-500">
    Pour recevoir des offres spéciales le jour de votre anniversaire
  </p>
</div>
```

---

#### B. Instagram
**Champ:** `instagram_handle` (existe dans la table `clients`)

**Avantages:**
- Identifier les clients influenceurs
- Partage de photos avant/après
- Taguer le client sur les posts Instagram du pro
- Marketing via les réseaux sociaux

**UI suggérée:**
```tsx
<div>
  <label>Instagram (optionnel)</label>
  <input
    type="text"
    placeholder="@votre_pseudo"
    value={formData.instagram_handle}
    onChange={(e) => setFormData({...formData, instagram_handle: e.target.value})}
  />
  <p className="text-xs text-gray-500">
    Pour être tagué(e) sur nos publications
  </p>
</div>
```

---

#### C. Méthode de contact préférée
**Champ:** `preferred_contact` (existe dans la table `clients`)

**Valeurs possibles:**
- email
- phone
- sms
- whatsapp
- instagram

**Avantages:**
- Respecter les préférences de communication du client
- Optimiser le taux de réponse aux rappels
- Expérience client personnalisée

**UI suggérée:**
```tsx
<div>
  <label>Comment préférez-vous être contacté(e) ?</label>
  <select
    value={formData.preferred_contact}
    onChange={(e) => setFormData({...formData, preferred_contact: e.target.value})}
  >
    <option value="email">Email</option>
    <option value="sms">SMS</option>
    <option value="phone">Téléphone</option>
    <option value="whatsapp">WhatsApp</option>
    <option value="instagram">Instagram</option>
  </select>
</div>
```

---

#### D. Ville
**Champ:** `city` (existe dans la table `user_profiles`)

**Avantages:**
- Trouver des pros à proximité
- Filtrer les offres locales
- Statistiques géographiques pour le pro

**UI suggérée:**
```tsx
<div>
  <label>Ville</label>
  <input
    type="text"
    placeholder="Paris"
    value={formData.city}
    onChange={(e) => setFormData({...formData, city: e.target.value})}
  />
</div>
```

---

### 2. Préférences de services (pour pros beauté)

#### A. Partage Instagram
**Champ:** `is_instagrammable` (existe dans la table `clients`)

**Question:**
"Acceptez-vous que vos photos soient partagées sur Instagram ?"

**Avantages:**
- Consentement RGPD pour partage de photos
- Sélection automatique des photos autorisées
- Marketing authentique avec vrais clients

**UI suggérée:**
```tsx
<div className="flex items-center gap-3 p-4 bg-pink-50 rounded-lg">
  <input
    type="checkbox"
    id="instagrammable"
    checked={formData.is_instagrammable}
    onChange={(e) => setFormData({...formData, is_instagrammable: e.target.checked})}
  />
  <label htmlFor="instagrammable" className="flex-1">
    <div className="font-medium">Partage sur Instagram</div>
    <div className="text-xs text-gray-600">
      J'accepte que mes photos soient partagées sur le compte Instagram du professionnel
    </div>
  </label>
</div>
```

---

#### B. Informations spécifiques beauté

Pour les **pros ongles**:
- `nail_type`: Type d'ongles (courts, longs, cassants, etc.)

Pour les **coiffeurs**:
- `hair_type`: Type de cheveux (lisses, bouclés, crépus, etc.)
- `scalp_type`: Type de cuir chevelu (gras, sec, normal, etc.)

Pour les **esthéticiennes**:
- `skin_type`: Type de peau (sèche, grasse, mixte, sensible)
- `skin_conditions`: Problèmes de peau (acné, rosacée, etc.)

Pour les **lash artists**:
- `lash_type`: Type de cils (courts, longs, clairsemés, etc.)
- `brow_type`: Type de sourcils (fins, épais, clairsemés, etc.)

**Avantages:**
- Personnalisation des prestations
- Mémorisation des préférences client
- Conseil automatisé selon le type
- Historique des soins

**UI suggérée:**
```tsx
{profession === 'nails' && (
  <div>
    <label>Type d'ongles</label>
    <select
      value={formData.nail_type}
      onChange={(e) => setFormData({...formData, nail_type: e.target.value})}
    >
      <option value="">Non renseigné</option>
      <option value="short">Courts</option>
      <option value="long">Longs</option>
      <option value="fragile">Cassants/Fragiles</option>
      <option value="normal">Normaux</option>
    </select>
  </div>
)}
```

---

### 3. Préférences de notification

**Nouveaux champs suggérés:**
- `email_notifications`: boolean (recevoir emails)
- `sms_notifications`: boolean (recevoir SMS)
- `push_notifications`: boolean (recevoir notifs push)

**Avantages:**
- Respect des préférences de communication
- Conformité RGPD
- Réduction du spam perçu
- Meilleure satisfaction client

**UI suggérée:**
```tsx
<div className="space-y-3">
  <h3 className="font-semibold">Notifications</h3>

  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={formData.email_notifications}
      onChange={(e) => setFormData({...formData, email_notifications: e.target.checked})}
    />
    <span>Recevoir les rappels par email</span>
  </label>

  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={formData.sms_notifications}
      onChange={(e) => setFormData({...formData, sms_notifications: e.target.checked})}
    />
    <span>Recevoir les rappels par SMS</span>
  </label>

  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={formData.push_notifications}
      onChange={(e) => setFormData({...formData, push_notifications: e.target.checked})}
    />
    <span>Recevoir les notifications push</span>
  </label>
</div>
```

---

### 4. Informations de paiement (optionnel)

**Nouveaux champs suggérés:**
- Carte de crédit enregistrée (via Stripe)
- Méthode de paiement préférée
- Historique des paiements

**Note:** Cette fonctionnalité nécessite l'intégration complète de Stripe.

---

## IMPLÉMENTATION RECOMMANDÉE

### Étape 1: Mise à jour du formulaire ClientProfile.tsx

```typescript
// Ajouter les nouveaux champs dans formData
const [formData, setFormData] = useState({
  // Existant
  first_name: profile?.first_name || '',
  last_name: profile?.last_name || '',
  phone: profile?.phone || '',
  photo_url: profile?.photo_url || '',

  // Nouveau - user_profiles
  city: profile?.city || '',

  // Nouveau - clients (nécessite fetch séparé)
  birth_date: '',
  instagram_handle: '',
  preferred_contact: 'email',
  is_instagrammable: false,
  nail_type: '',
  hair_type: '',
  skin_type: '',
});
```

### Étape 2: Charger les données de la table clients

```typescript
useEffect(() => {
  const loadClientData = async () => {
    if (!user) return;

    const { data: clientData } = await supabase
      .from('clients')
      .select('birth_date, instagram_handle, preferred_contact, is_instagrammable, nail_type, hair_type, skin_type')
      .eq('user_id', user.id)
      .single();

    if (clientData) {
      setFormData(prev => ({
        ...prev,
        ...clientData
      }));
    }
  };

  loadClientData();
}, [user]);
```

### Étape 3: Enregistrer dans les deux tables

```typescript
const handleSaveProfile = async () => {
  if (!user) return;

  try {
    // Mise à jour user_profiles
    await supabase
      .from('user_profiles')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        photo_url: formData.photo_url,
        city: formData.city,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    // Mise à jour clients (si existe)
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clientData) {
      await supabase
        .from('clients')
        .update({
          birth_date: formData.birth_date || null,
          instagram_handle: formData.instagram_handle || null,
          preferred_contact: formData.preferred_contact,
          is_instagrammable: formData.is_instagrammable,
          nail_type: formData.nail_type || null,
          hair_type: formData.hair_type || null,
          skin_type: formData.skin_type || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientData.id);
    }

    alert('Profil mis à jour avec succès!');
    setShowEditModal(false);
    window.location.reload();
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Erreur lors de la mise à jour du profil');
  }
};
```

---

## BÉNÉFICES POUR LES PROS

### Marketing personnalisé
- Envoyer des offres ciblées selon l'âge, le type de peau, etc.
- Campagnes d'anniversaire automatisées
- Segmentation précise des clients

### Expérience client améliorée
- Le pro connaît les préférences du client avant le RDV
- Pas besoin de redemander les mêmes informations
- Service plus personnalisé

### Croissance sur les réseaux sociaux
- Identification des clients influenceurs
- Partage de photos avec consentement
- Augmentation de la visibilité

### Fidélisation
- Communication adaptée aux préférences
- Offres personnalisées
- Reconnaissance des clients VIP

---

## BÉNÉFICES POUR LES CLIENTS

### Expérience personnalisée
- Services adaptés à leurs besoins spécifiques
- Rappels via leur canal préféré
- Offres pertinentes

### Gain de temps
- Informations pré-remplies lors des RDV
- Historique accessible
- Réservation plus rapide

### Contrôle des données
- Choix des informations partagées
- Gestion des préférences de communication
- Consentement explicite pour le partage de photos

---

## PRIORITÉS SUGGÉRÉES

### Phase 1 - Essentiel (à implémenter maintenant)
1. ✅ Ville
2. ✅ Date d'anniversaire
3. ✅ Instagram handle
4. ✅ Méthode de contact préférée
5. ✅ Autorisation partage Instagram

### Phase 2 - Beauté spécifique
6. Type de peau/cheveux/ongles selon profession
7. Conditions spéciales (allergies, sensibilités)
8. Préférences de style

### Phase 3 - Avancé
9. Préférences de notification détaillées
10. Informations de paiement
11. Programme de fidélité

---

## RESPECT DE LA VIE PRIVÉE

### Principes RGPD
- ✅ Toutes les informations sont **optionnelles**
- ✅ Le client peut modifier ou supprimer ses données à tout moment
- ✅ Consentement explicite pour le partage de photos
- ✅ Transparence sur l'utilisation des données
- ✅ Droit à l'oubli (suppression de compte)

### Messages de transparence suggérés

```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
  <h3 className="font-semibold text-blue-900 mb-2">
    🔒 Vos données sont protégées
  </h3>
  <p className="text-sm text-blue-800">
    Toutes ces informations sont optionnelles et ne seront utilisées que pour
    personnaliser votre expérience. Vous pouvez les modifier ou les supprimer
    à tout moment.
  </p>
</div>
```

---

## CONCLUSION

L'enrichissement du profil client permet:
- Une **meilleure personnalisation** des services
- Une **communication plus efficace**
- Une **fidélisation accrue**
- Un **marketing plus ciblé**

Tout en respectant la **vie privée** et les **préférences** de chaque client.

**Prochaine étape suggérée:** Implémenter les champs de la Phase 1 dans ClientProfile.tsx.
