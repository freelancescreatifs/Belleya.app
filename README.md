# Belleya - Plateforme de Gestion pour Professionnels de la Beauté

Application complète de gestion pour les professionnels de la beauté et leurs clients.

## Prérequis

- Node.js 18+ et npm
- Compte Supabase (gratuit)
- Git

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/belleya.git
cd belleya
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos vraies clés Supabase
```

Récupérez vos clés Supabase :
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Settings → API
4. Copiez `URL` et `anon public` key

### 4. Configuration de la base de données

Les migrations SQL sont dans `supabase/migrations/`. Pour les appliquer :

1. Via l'interface Supabase :
   - Dashboard → SQL Editor
   - Exécutez les migrations dans l'ordre chronologique

2. Ou via la CLI Supabase (si installée) :
   ```bash
   supabase db push
   ```

## Développement

```bash
# Démarrer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## Build Production

```bash
# Créer le build optimisé
npm run build

# Prévisualiser le build
npm run preview
```

## Structure du Projet

```
belleya/
├── src/
│   ├── components/      # Composants réutilisables
│   ├── pages/          # Pages de l'application
│   ├── contexts/       # Context API React
│   ├── lib/            # Utilitaires et helpers
│   ├── i18n/           # Traductions (FR/EN)
│   └── types/          # Types TypeScript
├── supabase/
│   ├── migrations/     # Migrations SQL
│   └── functions/      # Edge Functions
└── public/             # Assets statiques
```

## Fonctionnalités Principales

### Pour les Professionnels
- Gestion d'agenda synchronisé
- Gestion de clientèle
- Gestion financière et comptabilité
- Studio de contenu et réseaux sociaux
- Gestion des stocks
- Système de réservation en ligne
- Marketing automatisé

### Pour les Clients
- Recherche de professionnels
- Réservation en ligne
- Suivi des rendez-vous
- Galerie de résultats
- Système de favoris

## Technologies

- **Frontend** : React 18 + TypeScript + Vite
- **Styling** : Tailwind CSS
- **Backend** : Supabase (PostgreSQL + Auth + Storage)
- **Maps** : Leaflet / Mapbox
- **Internationalisation** : i18next

## Accès Supabase pour l'Équipe

### Donner accès à un membre

1. Dans Supabase Dashboard :
   - Settings → Team Settings
   - Invite team member
   - Entrez l'email du membre

2. Le membre aura accès à :
   - Database
   - Storage
   - Edge Functions
   - Logs et monitoring

### Niveaux d'accès

- **Owner** : Accès complet (facturation, suppression)
- **Admin** : Gestion projet sans facturation
- **Developer** : Accès développement

## Variables d'Environnement

```env
VITE_SUPABASE_URL=          # URL de votre projet Supabase
VITE_SUPABASE_ANON_KEY=     # Clé publique (anon) Supabase
```

## Documentation Complémentaire

- `BELLEYA_QUICKSTART.md` - Guide de démarrage rapide
- `BELLEYA_FILES_INDEX.md` - Index des fichiers du projet
- `ADMIN_SETUP.md` - Configuration du système admin
- `PAYMENT_SYSTEM_GUIDE.md` - Intégration des paiements

## Support

Pour toute question :
- Email : contact@belleya.fr
- WhatsApp : https://chat.whatsapp.com/FkLVwP6EDMNCOO4PkASezY

## Sécurité

- Ne committez JAMAIS le fichier `.env`
- Utilisez toujours les Row Level Security (RLS) policies
- Les clés API doivent rester secrètes
- Validez toutes les entrées utilisateur

## Licence

Propriété de Belleya - Tous droits réservés
