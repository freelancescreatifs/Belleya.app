import { Lightbulb, Plus, Sparkles, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SubGoalTemplate {
  title: string;
  start_date?: string;
  end_date?: string;
}

interface GoalTemplate {
  title: string;
  type: string;
  subgoals: SubGoalTemplate[];
}

interface GoalSuggestionsProps {
  category: string;
  onAddGoal: (title: string, type: string, subgoals: SubGoalTemplate[]) => void;
}

export default function GoalSuggestions({ category, onAddGoal }: GoalSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const suggestionsByCategory: Record<string, GoalTemplate[]> = {
    content: [
      {
        title: 'Publier 3 posts/semaine pendant 4 semaines',
        type: 'content',
        subgoals: [
          { title: 'Créer une banque de 12 idées de posts' },
          { title: 'Photographier/créer le contenu pour semaine 1' },
          { title: 'Publier posts semaine 1 (3 posts)' },
          { title: 'Publier posts semaine 2 (3 posts)' },
          { title: 'Publier posts semaine 3 (3 posts)' },
          { title: 'Publier posts semaine 4 (3 posts)' },
        ]
      },
      {
        title: 'Créer 12 Reels ce mois-ci',
        type: 'content',
        subgoals: [
          { title: 'Lister 12 idées de Reels tendances' },
          { title: 'Créer et publier Reels 1-3' },
          { title: 'Créer et publier Reels 4-6' },
          { title: 'Créer et publier Reels 7-9' },
          { title: 'Créer et publier Reels 10-12' },
          { title: 'Analyser les performances' },
        ]
      },
      {
        title: 'Atteindre 2000 vues moyennes par Reel',
        type: 'content',
        subgoals: [
          { title: 'Analyser mes 10 meilleurs Reels' },
          { title: 'Identifier les hooks performants' },
          { title: 'Tester 5 nouveaux formats' },
          { title: 'Optimiser les heures de publication' },
          { title: 'Utiliser des sons tendances' },
        ]
      },
      {
        title: 'Optimiser 10 hooks pour mes posts',
        type: 'content',
        subgoals: [
          { title: 'Analyser les hooks qui fonctionnent' },
          { title: 'Créer 10 templates de hooks' },
          { title: 'Tester hooks 1-3' },
          { title: 'Tester hooks 4-7' },
          { title: 'Tester hooks 8-10' },
        ]
      },
      {
        title: 'Créer une banque de 50 idées de contenu',
        type: 'content',
        subgoals: [
          { title: 'Brainstorming 20 idées éducatives' },
          { title: 'Brainstorming 15 idées avant/après' },
          { title: 'Brainstorming 10 idées coulisses' },
          { title: 'Brainstorming 5 idées clients satisfaits' },
          { title: 'Organiser dans un calendrier éditorial' },
        ]
      },
      {
        title: 'Publier 1 carrousel par semaine',
        type: 'content',
        subgoals: [
          { title: 'Créer templates Canva' },
          { title: 'Publier carrousel semaine 1' },
          { title: 'Publier carrousel semaine 2' },
          { title: 'Publier carrousel semaine 3' },
          { title: 'Publier carrousel semaine 4' },
        ]
      },
    ],
    loyalty: [
      {
        title: 'Recontacter 10 clientes dormantes',
        type: 'loyalty',
        subgoals: [
          { title: 'Identifier les clientes inactives depuis 3+ mois' },
          { title: 'Préparer message personnalisé type' },
          { title: 'Contacter clientes 1-3' },
          { title: 'Contacter clientes 4-7' },
          { title: 'Contacter clientes 8-10' },
          { title: 'Proposer offre de retour exclusive' },
        ]
      },
      {
        title: 'Obtenir 5 avis Google ce mois-ci',
        type: 'loyalty',
        subgoals: [
          { title: 'Créer un script de demande d\'avis' },
          { title: 'Demander avis après chaque prestation' },
          { title: 'Envoyer SMS de rappel si besoin' },
          { title: 'Remercier chaque avis obtenu' },
          { title: 'Partager les avis sur les réseaux' },
        ]
      },
      {
        title: 'Mettre en place une offre fidélité',
        type: 'loyalty',
        subgoals: [
          { title: 'Définir le système (carte, points, réduction)' },
          { title: 'Créer les visuels et supports' },
          { title: 'Annoncer sur les réseaux sociaux' },
          { title: 'Former l\'équipe au programme' },
          { title: 'Inscrire les premiers clients' },
        ]
      },
      {
        title: 'Envoyer 20 messages personnalisés d\'anniversaire',
        type: 'loyalty',
        subgoals: [
          { title: 'Mettre à jour les dates d\'anniversaire clients' },
          { title: 'Créer template message anniversaire' },
          { title: 'Définir offre anniversaire spéciale' },
          { title: 'Envoyer messages chaque semaine' },
          { title: 'Suivre le taux de réservation' },
        ]
      },
      {
        title: 'Créer un programme de parrainage',
        type: 'loyalty',
        subgoals: [
          { title: 'Définir la récompense (parrain + filleul)' },
          { title: 'Créer visuels explicatifs' },
          { title: 'Annoncer le programme' },
          { title: 'Suivre les parrainages' },
          { title: 'Récompenser les meilleurs parrains' },
        ]
      },
      {
        title: 'Organiser un événement client VIP',
        type: 'loyalty',
        subgoals: [
          { title: 'Définir concept et date' },
          { title: 'Lister invités VIP (top clientes)' },
          { title: 'Envoyer invitations personnalisées' },
          { title: 'Préparer animations et surprises' },
          { title: 'Réaliser l\'événement' },
          { title: 'Faire bilan et suivi' },
        ]
      },
    ],
    financial: [
      {
        title: 'Atteindre 5 000€ de CA ce mois-ci',
        type: 'financial',
        subgoals: [
          { title: 'Définir objectif hebdomadaire (1250€)' },
          { title: 'Optimiser le planning (réduire créneaux vides)' },
          { title: 'Proposer upsells systématiquement' },
          { title: 'Lancer offre flash mi-mois' },
          { title: 'Relancer clientes pour rebooking' },
          { title: 'Faire bilan fin de mois' },
        ]
      },
      {
        title: 'Mettre de côté 10% de chaque recette',
        type: 'financial',
        subgoals: [
          { title: 'Ouvrir compte épargne dédié' },
          { title: 'Automatiser virement hebdomadaire' },
          { title: 'Suivre montant épargné chaque semaine' },
          { title: 'Définir objectif d\'épargne à 6 mois' },
        ]
      },
      {
        title: 'Signer 3 nouveaux clients premium',
        type: 'financial',
        subgoals: [
          { title: 'Créer offre premium attractive' },
          { title: 'Identifier prospects qualifiés' },
          { title: 'Présenter offre à 5 prospects' },
          { title: 'Assurer suivi personnalisé' },
          { title: 'Convertir 3 ventes' },
        ]
      },
      {
        title: 'Augmenter mon prix moyen de 15%',
        type: 'financial',
        subgoals: [
          { title: 'Analyser prix actuels vs marché' },
          { title: 'Créer nouvelle grille tarifaire' },
          { title: 'Annoncer changement 2 semaines avant' },
          { title: 'Appliquer nouveaux tarifs' },
          { title: 'Mesurer impact sur conversions' },
        ]
      },
      {
        title: 'Réduire mes charges de 500€/mois',
        type: 'financial',
        subgoals: [
          { title: 'Lister toutes les charges mensuelles' },
          { title: 'Identifier 3 postes de réduction' },
          { title: 'Négocier avec fournisseurs' },
          { title: 'Changer abonnements coûteux' },
          { title: 'Mesurer économies réalisées' },
        ]
      },
      {
        title: 'Atteindre 10 000€ de CA mensuel',
        type: 'financial',
        subgoals: [
          { title: 'Définir stratégie commerciale' },
          { title: 'Augmenter fréquence publications' },
          { title: 'Lancer campagne acquisition' },
          { title: 'Optimiser taux de conversion' },
          { title: 'Suivre CA hebdomadaire (2500€)' },
          { title: 'Ajuster actions selon résultats' },
        ]
      },
    ],
    business: [
      {
        title: 'Lancer un nouveau service',
        type: 'business',
        subgoals: [
          { title: 'Définir concept et positionnement' },
          { title: 'Tester auprès de 5 clientes pilotes' },
          { title: 'Finaliser prix et durée' },
          { title: 'Créer visuels et communication' },
          { title: 'Lancer officiellement' },
          { title: 'Analyser premiers retours' },
        ]
      },
      {
        title: 'Créer 3 partenariats stratégiques',
        type: 'business',
        subgoals: [
          { title: 'Identifier partenaires potentiels' },
          { title: 'Préparer proposition de partenariat' },
          { title: 'Contacter 5 professionnels' },
          { title: 'Négocier termes gagnant-gagnant' },
          { title: 'Formaliser 3 partenariats' },
          { title: 'Lancer actions communes' },
        ]
      },
      {
        title: 'Optimiser mon process de réservation',
        type: 'business',
        subgoals: [
          { title: 'Analyser points de friction actuels' },
          { title: 'Tester 2 outils de réservation' },
          { title: 'Paramétrer outil choisi' },
          { title: 'Former équipe au nouveau process' },
          { title: 'Communiquer changement aux clientes' },
          { title: 'Mesurer taux de réservation' },
        ]
      },
      {
        title: 'Former mon équipe sur une nouvelle technique',
        type: 'business',
        subgoals: [
          { title: 'Choisir technique à maîtriser' },
          { title: 'Trouver formateur ou formation' },
          { title: 'Organiser session formation' },
          { title: 'Pratiquer en équipe' },
          { title: 'Intégrer au catalogue services' },
        ]
      },
      {
        title: 'Refaire mon identité visuelle',
        type: 'business',
        subgoals: [
          { title: 'Définir brief et univers souhaité' },
          { title: 'Sélectionner graphiste ou faire soi-même' },
          { title: 'Créer logo et charte graphique' },
          { title: 'Décliner sur supports (cartes, réseaux)' },
          { title: 'Lancer nouvelle identité' },
        ]
      },
      {
        title: 'Développer une offre de formation',
        type: 'business',
        subgoals: [
          { title: 'Définir thème et public cible' },
          { title: 'Structurer programme pédagogique' },
          { title: 'Créer supports de formation' },
          { title: 'Fixer tarif et modalités' },
          { title: 'Lancer première session test' },
          { title: 'Ajuster et commercialiser' },
        ]
      },
    ],
    clients: [
      {
        title: 'Acquérir 15 nouveaux clients ce mois-ci',
        type: 'clients',
        subgoals: [
          { title: 'Lancer offre découverte attractive' },
          { title: 'Publier 4 posts acquisition par semaine' },
          { title: 'Faire 2 campagnes publicités ciblées' },
          { title: 'Demander parrainages actifs' },
          { title: 'Suivre conversions hebdomadaires' },
        ]
      },
      {
        title: 'Augmenter le taux de rebooking de 20%',
        type: 'clients',
        subgoals: [
          { title: 'Analyser taux de rebooking actuel' },
          { title: 'Proposer RDV suivant fin prestation' },
          { title: 'Envoyer rappel SMS 3 semaines après' },
          { title: 'Créer offre fidélité rebooking' },
          { title: 'Mesurer amélioration mensuelle' },
        ]
      },
      {
        title: 'Créer une base de données de 100 prospects',
        type: 'clients',
        subgoals: [
          { title: 'Mettre en place lead magnet (guide gratuit)' },
          { title: 'Créer formulaire capture email' },
          { title: 'Promouvoir sur réseaux sociaux' },
          { title: 'Organiser jeu concours' },
          { title: 'Atteindre 100 contacts qualifiés' },
        ]
      },
      {
        title: 'Convertir 30% de mes consultations en ventes',
        type: 'clients',
        subgoals: [
          { title: 'Améliorer script de consultation' },
          { title: 'Créer offres irrésistibles' },
          { title: 'Former à techniques closing' },
          { title: 'Suivre taux conversion chaque semaine' },
          { title: 'Ajuster approche selon résultats' },
        ]
      },
      {
        title: 'Améliorer ma satisfaction client à 4.8/5',
        type: 'clients',
        subgoals: [
          { title: 'Mesurer satisfaction actuelle' },
          { title: 'Identifier points d\'amélioration' },
          { title: 'Former équipe aux standards qualité' },
          { title: 'Mettre en place suivi post-prestation' },
          { title: 'Mesurer évolution mensuelle' },
        ]
      },
    ],
    personal: [
      {
        title: 'Suivre une formation pro par trimestre',
        type: 'personal',
        subgoals: [
          { title: 'Lister compétences à développer' },
          { title: 'Rechercher formations adaptées' },
          { title: 'Budgéter formation T1' },
          { title: 'S\'inscrire et bloquer dates' },
          { title: 'Suivre formation et appliquer' },
        ]
      },
      {
        title: 'Améliorer mon équilibre vie pro/perso',
        type: 'personal',
        subgoals: [
          { title: 'Définir horaires fixes travail' },
          { title: 'Bloquer 2 jours off par semaine' },
          { title: 'Désactiver notifs pro le soir' },
          { title: 'Planifier activités perso hebdo' },
          { title: 'Faire bilan mensuel équilibre' },
        ]
      },
      {
        title: 'Lire 2 livres business par mois',
        type: 'personal',
        subgoals: [
          { title: 'Créer liste lecture business' },
          { title: 'Bloquer 30min lecture quotidienne' },
          { title: 'Lire livre 1' },
          { title: 'Lire livre 2' },
          { title: 'Appliquer 1 conseil par livre' },
        ]
      },
      {
        title: 'Participer à 3 événements networking',
        type: 'personal',
        subgoals: [
          { title: 'Rechercher événements pros locaux' },
          { title: 'S\'inscrire à événement 1' },
          { title: 'S\'inscrire à événement 2' },
          { title: 'S\'inscrire à événement 3' },
          { title: 'Faire suivi contacts rencontrés' },
        ]
      },
      {
        title: 'Définir et respecter mes jours de repos',
        type: 'personal',
        subgoals: [
          { title: 'Choisir jours fixes (ex: dim + lun)' },
          { title: 'Bloquer agenda ces jours' },
          { title: 'Communiquer aux clientes' },
          { title: 'Respecter 1er mois' },
          { title: 'Ajuster si besoin' },
        ]
      },
    ],
  };

  const suggestions = category === 'all'
    ? Object.values(suggestionsByCategory).flat().slice(0, 6)
    : suggestionsByCategory[category] || [];

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              Idées d'objectifs recommandés
              <Sparkles className="w-4 h-4 text-purple-500" />
            </h3>
            {!isExpanded && (
              <p className="text-sm text-gray-600">Suggestions adaptées à votre activité</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 bg-white rounded-lg hover:bg-purple-50 transition-all border border-purple-200"
        >
          {isExpanded ? 'Voir moins' : 'Voir plus'}
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <p className="text-sm font-medium text-gray-800 mb-2">{suggestion.title}</p>
              <p className="text-xs text-gray-500 mb-3">
                {suggestion.subgoals.length} sous-objectifs inclus
              </p>
              <button
                onClick={() => onAddGoal(suggestion.title, suggestion.type, suggestion.subgoals)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Ajouter cet objectif
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
