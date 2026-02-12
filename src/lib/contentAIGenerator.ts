type ContentType = 'post' | 'reel' | 'carrousel' | 'story' | 'video' | 'live';
type Platform = 'instagram' | 'tiktok' | 'linkedin' | 'facebook' | 'youtube' | 'twitter';

interface GenerationParams {
  title: string;
  contentType: ContentType;
  platform: Platform;
  description?: string;
  objective?: 'attirer' | 'éduquer' | 'convertir' | 'fidéliser';
  pillar?: string;
  profession?: string;
  developTitle?: boolean;
}

interface GeneratedContent {
  contentStructure: string;
  caption: string;
  hashtags: string;
  script?: string;
}

export function generateContentAI(params: GenerationParams): GeneratedContent {
  const { title, contentType, platform, description, objective, pillar, profession, developTitle = false } = params;

  const context = buildContext(objective, pillar, profession);
  const script = generateDetailedScript(title, contentType, platform, description, objective, pillar, profession);

  let baseContent: GeneratedContent;
  switch (contentType) {
    case 'carrousel':
      baseContent = generateCarrousel(title, platform, description, context, developTitle);
      break;
    case 'reel':
    case 'video':
      baseContent = generateReel(title, platform, description, context, developTitle);
      break;
    case 'story':
      baseContent = generateStory(title, platform, description, context, developTitle);
      break;
    case 'post':
    default:
      baseContent = generatePost(title, platform, description, context, developTitle);
  }

  return { ...baseContent, script };
}

function buildContext(objective?: string, pillar?: string, profession?: string): string {
  const parts: string[] = [];

  if (profession) {
    const professionLabels: Record<string, string> = {
      'nail_artist': 'nail art',
      'estheticienne': 'esthétique',
      'coiffeuse': 'coiffure',
      'lash_artist': 'extensions de cils',
      'brow_artist': 'sourcils',
      'facialiste': 'soins du visage',
      'prothesiste_ongulaire': 'prothésie ongulaire',
      'multi_metiers': 'beauté et bien-être'
    };
    parts.push(`Contexte professionnel : ${professionLabels[profession] || profession}`);
  }

  if (pillar) {
    parts.push(`Pilier éditorial : ${pillar}`);
  }

  if (objective) {
    const objectiveLabels: Record<string, string> = {
      'attirer': 'attirer de nouveaux clients',
      'éduquer': 'éduquer et informer',
      'convertir': 'convertir en rendez-vous',
      'fidéliser': 'fidéliser la clientèle'
    };
    parts.push(`Objectif : ${objectiveLabels[objective] || objective}`);
  }

  return parts.join(' • ');
}

function generate3HookProposals(title: string, contentType: ContentType, platform: Platform, seed: number): string {
  const titleLower = title.toLowerCase();
  const proposals = [
    [
      `"Tu ${titleLower}… mais ce n'est pas contre ça que tu luttes vraiment."`,
      `"Si tu n'arrives pas à arrêter ${titleLower}, ce n'est PAS un manque de volonté."`,
      `"${title}. Ce n'est pas le vrai problème."`
    ],
    [
      `"${title} ? Ce que personne ne t'a jamais dit."`,
      `"Tu crois que ${titleLower}, c'est ta faute. Mais si ce n'était pas toi le problème ?"`,
      `"${title}. Arrête de culpabiliser."`
    ],
    [
      `"${title}… ce n'est pas une mauvaise habitude. C'est une réponse."`,
      `"Si ${titleLower} te concerne : ce n'est pas une fatalité."`,
      `"En 2026, ${titleLower} n'est plus un tabou. C'est un signal."`
    ]
  ];

  const selected = proposals[seed % proposals.length];

  return `1️⃣ Hook émotionnel (identification forte)

${selected[0]}

⸻

2️⃣ Hook confrontation douce

${selected[1]}

⸻

3️⃣ Hook choc silencieux

${selected[2]}`;
}

function generateRetentionStructure(title: string, seed: number): string {
  return `1. Micro-choc émotionnel dès la première phrase
2. Identification immédiate
3. Déconstruction d'une croyance
4. Explication claire et concrète
5. Opposition "ce qui ne marche pas / ce qui marche"
6. Projection émotionnelle
7. CTA simple et naturel`;
}

function generatePsychologicalTriggers(title: string, seed: number): string {
  return `✓ Identification personnelle
✓ Déculpabilisation
✓ Révélation d'une cause cachée
✓ Projection positive
✓ Solution concrète`;
}

function generateContentAngle(title: string, profession: string, objective: string, seed: number): string {
  const angles = [
    `Angle éducatif + émotionnel.\n\nOn ne juge pas.\nOn explique.\nOn rassure.\nOn propose une méthode réelle.\n\nObjectif : créer confiance + crédibilité + envie de passer à l'action.`,
    `Angle transformation.\n\nPartir de la frustration réelle.\nDéconstruire les croyances limitantes.\nProposer une solution experte et personnalisée.\n\nObjectif : positionner l'expertise et créer la prise de rendez-vous.`,
    `Angle expertise bienveillante.\n\nMontrer qu'on comprend le vécu.\nApporter une explication claire et rassurante.\nProposer une solution concrète et accessible.\n\nObjectif : créer la confiance et déclencher l'action.`
  ];
  return angles[seed % angles.length];
}

function generateConversionVersion(title: string, profession: string, objective: string, seed: number): string {
  return `→ Problème identifié : "Tu n'arrives pas à ${title.toLowerCase()} malgré tes promesses."
→ Solution proposée : "Un accompagnement + renforcement professionnel."
→ Bénéfice tangible : "Des résultats solides en quelques semaines."
→ Transformation visible : "Des résultats que tu n'as plus besoin de cacher."
→ CTA : "Réserve ton diagnostic personnalisé."`;
}

function generateProTip(title: string, contentType: ContentType, seed: number): string {
  const tips = [
    `Les 3 premières secondes doivent créer une rupture :\n\n❌ "Aujourd'hui on parle de ${title.toLowerCase()}"\n✅ "Ce n'est pas un problème de volonté."\n\nLa différence ?\nLe cerveau veut comprendre la contradiction.`,
    `La structure qui retient :\n\n1. Accroche qui casse une croyance\n2. Identification émotionnelle forte\n3. Explication concrète\n4. Solution crédible\n5. Projection du résultat\n\nChaque étape doit créer l'envie de lire la suivante.`,
    `Le secret d'un carrousel qui convertit :\n\nNe pas vendre dans les slides.\nApporter de la valeur pure.\nLaisser le CTA final faire le travail.\n\nPlus tu éduques, plus tu convertis.`
  ];
  return tips[seed % tips.length];
}

function generate3SimilarTopics(title: string, profession: string, seed: number): string {
  return `1️⃣ "Pourquoi tu recommences toujours ${title.toLowerCase()} (même après avoir arrêté)"
2️⃣ "${title} : combien de temps pour vraiment voir un résultat ?"
3️⃣ "${title} : les 4 erreurs qui empêchent le progrès"`;
}

function generateDetailedScript(
  title: string,
  contentType: ContentType,
  platform: Platform,
  description?: string,
  objective?: string,
  pillar?: string,
  profession?: string
): string {
  const professionContext = getProfessionContext(profession || 'multi_metiers');
  const seed = title.length + (profession?.length || 0);

  const developedTitle = `${title}: ce que tu dois absolument comprendre`;
  const hooks = generate3HookProposals(title, contentType, platform, seed);

  const hook = generateStrategicHook(title, contentType, platform, seed);
  const identification = generateIdentification(title, professionContext, seed);
  const mechanism = generateMechanism(title, professionContext, seed);
  const commonError = generateCommonError(title, professionContext, seed);
  const concreteSolution = generateConcreteSolution(title, professionContext, seed);
  const emotionalProjection = generateEmotionalProjection(title, professionContext, seed);
  const strategicCTA = generateStrategicCTAForScript(objective || 'éduquer', title, seed);

  const retentionStructure = generateRetentionStructure(title, seed);
  const psychologicalTriggers = generatePsychologicalTriggers(title, seed);
  const contentAngle = generateContentAngle(title, professionContext, objective || 'éduquer', seed);
  const conversionVersion = generateConversionVersion(title, professionContext, objective || 'éduquer', seed);
  const proTip = generateProTip(title, contentType, seed);
  const similarTopics = generate3SimilarTopics(title, professionContext, seed);

  const longCaption = generateLongCaption(title, professionContext, seed);
  const shortCaption = generateShortCaption(title, professionContext, seed);
  const scriptHashtags = generateProfessionHashtags(professionContext, contentType, platform);

  if (contentType === 'carrousel') {
    return `📌 SUJET DÉVELOPPÉ À PARTIR DU THÈME

Thème brut fourni : "${title}"
✅ Sujet développé : "${developedTitle}"

⸻

🔥 3 PROPOSITIONS DE HOOK

${hooks}

⸻

🔥 SCRIPT DÉVELOPPÉ — prêt à publier

🎯 Thème : ${title}
📱 Format : Carrousel ${platform === 'instagram' ? 'Instagram' : platform.charAt(0).toUpperCase() + platform.slice(1)}

⸻

SLIDE 1

${hook}

⸻

SLIDE 2

${identification}

⸻

SLIDE 3

${mechanism}

⸻

SLIDE 4

${commonError}

⸻

SLIDE 5

${concreteSolution}

⸻

SLIDE 6

${emotionalProjection}

⸻

SLIDE 7

${strategicCTA}

⸻

📈 STRUCTURE RÉTENTION 3 SECONDES

${retentionStructure}

⸻

🧠 DÉCLENCHEURS PSYCHOLOGIQUES UTILISÉS

${psychologicalTriggers}

⸻

🎯 ANGLE DU CONTENU

${contentAngle}

⸻

💰 VERSION ORIENTÉE CONVERSION (ADAPTÉE AU SUJET)

${conversionVersion}

⸻

💡 CONSEIL PRO STRATÉGIQUE

${proTip}

⸻

💡 3 SUJETS SIMILAIRES STRATÉGIQUES

${similarTopics}

⸻

✨ LÉGENDE DÉVELOPPÉE

${longCaption}

⸻

💬 VERSION COURTE

${shortCaption}

⸻

🏷️ HASHTAGS

${scriptHashtags}`;
  }

  if (contentType === 'reel' || contentType === 'video') {
    return `📌 SUJET DÉVELOPPÉ À PARTIR DU THÈME

Thème brut fourni : "${title}"
✅ Sujet développé : "${developedTitle}"

⸻

🔥 3 PROPOSITIONS DE HOOK

${hooks}

⸻

🔥 SCRIPT DÉVELOPPÉ — prêt à publier

🎯 Thème : ${title}
📱 Format : ${contentType === 'reel' ? 'Reel' : 'Vidéo'}

⸻

⏱️ 0-3s — HOOK

${hook}

⸻

⏱️ 3-8s

${identification}

⸻

⏱️ 8-12s

${mechanism}

⸻

⏱️ 12-15s

${concreteSolution}

⸻

⏱️ 15-18s

${emotionalProjection}

⸻

⏱️ 18-20s

${strategicCTA}

⸻

📈 STRUCTURE RÉTENTION 3 SECONDES

${retentionStructure}

⸻

🧠 DÉCLENCHEURS PSYCHOLOGIQUES UTILISÉS

${psychologicalTriggers}

⸻

🎯 ANGLE DU CONTENU

${contentAngle}

⸻

💰 VERSION ORIENTÉE CONVERSION (ADAPTÉE AU SUJET)

${conversionVersion}

⸻

💡 CONSEIL PRO STRATÉGIQUE

${proTip}

⸻

💡 3 SUJETS SIMILAIRES STRATÉGIQUES

${similarTopics}

⸻

✨ LÉGENDE DÉVELOPPÉE

${longCaption}

⸻

💬 VERSION COURTE

${shortCaption}

⸻

🏷️ HASHTAGS

${scriptHashtags}`;
  }

  return `📌 SUJET DÉVELOPPÉ À PARTIR DU THÈME

Thème brut fourni : "${title}"
✅ Sujet développé : "${developedTitle}"

⸻

🔥 3 PROPOSITIONS DE HOOK

${hooks}

⸻

🔥 SCRIPT DÉVELOPPÉ — prêt à publier

🎯 Thème : ${title}
📱 Format : ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}

⸻

${hook}

⸻

${identification}

⸻

${mechanism}

⸻

${commonError}

⸻

${concreteSolution}

⸻

${emotionalProjection}

⸻

${strategicCTA}

⸻

📈 STRUCTURE RÉTENTION 3 SECONDES

${retentionStructure}

⸻

🧠 DÉCLENCHEURS PSYCHOLOGIQUES UTILISÉS

${psychologicalTriggers}

⸻

🎯 ANGLE DU CONTENU

${contentAngle}

⸻

💰 VERSION ORIENTÉE CONVERSION (ADAPTÉE AU SUJET)

${conversionVersion}

⸻

💡 CONSEIL PRO STRATÉGIQUE

${proTip}

⸻

💡 3 SUJETS SIMILAIRES STRATÉGIQUES

${similarTopics}

⸻

✨ LÉGENDE DÉVELOPPÉE

${longCaption}

⸻

💬 VERSION COURTE

${shortCaption}

⸻

🏷️ HASHTAGS

${scriptHashtags}`;
}

function generateStrategicHook(title: string, contentType: ContentType, platform: Platform, seed: number): string {
  const hooks = [
    `${title} ?\nCe n'est pas "juste une mauvaise habitude".\n\nCe n'est pas un caprice.\nCe n'est pas un manque de discipline.\n\nC'est un mécanisme.`,

    `En 2026…\n${title} n'est plus "juste un problème".\n\nC'est souvent un signal silencieux.`,

    `${title}.\n\nTu crois que c'est ta faute.\n\nMais si le problème n'était pas toi ?`,

    `Si tu vis ${title.toLowerCase()}…\nce n'est pas un manque de volonté.\n\nC'est une réponse automatique\nque ton corps a apprise.`,

    `${title}.\nCe que personne ne t'a jamais expliqué.\n\nEt pourtant, ça change tout.`
  ];

  return hooks[seed % hooks.length];
}

function generateIdentification(title: string, profession: string, seed: number): string {
  const identifications = [
    `Tu te dis :\n"C'est la dernière fois."\n"Demain j'arrête, promis."\n\nMais au moindre stress…\nà la moindre attente…\nà la moindre pensée envahissante…\n\nTout recommence\nsans même que tu t'en rendes compte.`,

    `Tu te reconnais ?\n\nTu essaies.\nTu promets.\nTu recommences.\n\nEt au fond, tu te demandes :\n"Pourquoi je n'y arrive pas ?"\n\nMais ce n'est pas toi le problème.`,

    `La plupart des clientes me disent :\n\n"J'ai tout essayé."\n"Ça ne marche jamais pour moi."\n"Je pense que c'est normal."\n\nNon.\nCe n'est pas normal.\nEt surtout : ce n'est pas une fatalité.`,

    `Ce moment où :\n\nTu regardes tes mains.\nTu les caches.\nTu évites les regards.\n\nEt tu te dis :\n"Pourquoi je n'arrive pas à arrêter ?"\n\nCe n'est pas un manque de volonté.`
  ];

  return identifications[seed % identifications.length];
}

function generateMechanism(title: string, profession: string, seed: number): string {
  const mechanisms = [
    `Ce n'est pas un manque de volonté.\n\nC'est une réponse automatique du cerveau face :\n\n• au stress\n• à l'ennui\n• à l'anxiété\n• au besoin de contrôle\n• à une émotion que tu ne sais pas gérer\n\nTon cerveau cherche un apaisement rapide.\nUne micro-décharge.\nUn soulagement immédiat.`,

    `Voici ce que la plupart des gens ne comprennent pas :\n\nCe n'est pas une question de technique parfaite.\nCe n'est pas une question de produit magique.\n\nC'est une réponse automatique.\n\nEt une réponse, ça se comprend.\nÇa se travaille.\nÇa se transforme.`,

    `La vraie cause :\n\nCe n'est pas le manque de volonté.\nCe n'est pas une fatalité génétique.\nCe n'est pas "dans ta tête".\n\nC'est un mécanisme automatique\nque ton corps a appris.\n\nEt ce qu'on apprend,\non peut le désapprendre.`,

    `Ce que personne ne te dit :\n\nPlus tu culpabilises,\nplus le stress monte.\n\nPlus le stress monte,\nplus le mécanisme se renforce.\n\nC'est un cercle.\n\nEt la lutte frontale ne fait qu'aggraver.`
  ];

  return mechanisms[seed % mechanisms.length];
}

function generateCommonError(title: string, profession: string, seed: number): string {
  const errors = [
    `Le vrai piège ?\n\nPlus tu culpabilises…\nPlus tu stresses.\n\nPlus tu stresses…\nPlus tu recommences.\n\nEt plus tu recommences…\nPlus tu te juges.\n\nC'est un cercle invisible\nqui s'auto-alimente.`,

    `Ce qui ne fonctionne PAS :\n\n❌ Se forcer brutalement\n❌ Se répéter "j'arrête demain"\n❌ Mettre un pansement sans comprendre pourquoi\n❌ Cacher par honte\n❌ Attendre "le bon moment"\n\nLa lutte frontale renforce le mécanisme.`,

    `L'erreur que tout le monde fait :\n\nEssayer de forcer.\n\nMais ton corps, ta situation, ton vécu…\nsont UNIQUES.\n\nCe qui marche pour les autres\nne marchera pas forcément pour toi.\n\nIl faut une vraie stratégie.\nPas une promesse.`,

    `Pourquoi les solutions classiques échouent :\n\nElles ne traitent que le symptôme.\nPas la cause.\n\nElles ignorent le déclencheur.\nElles forcent l'arrêt sans créer l'alternative.\n\nRésultat : ça revient.\nEncore et encore.`
  ];

  return errors[seed % errors.length];
}

function generateConcreteSolution(title: string, profession: string, seed: number): string {
  const solutions = [
    `Ce qui fonctionne vraiment :\n\n✔ Renforcer physiquement pour créer une barrière\n✔ Soigner l'aspect esthétique (le cerveau protège ce qui est beau)\n✔ Identifier ton déclencheur émotionnel\n✔ Remplacer le geste par une alternative consciente\n✔ Installer un cadre progressif\n\nQuand c'est structuré, protégé, valorisé…\nle réflexe diminue naturellement.`,

    `En institut, on agit sur deux choses :\n\n– Le renforcement physique\n– Le déclencheur émotionnel\n\nParce que casser une habitude,\nce n'est pas se battre contre soi.\n\nC'est changer l'environnement du geste.\n\nEt ça, ça change tout.`,

    `La méthode que j'applique :\n\n1. On comprend TON vécu\n2. On identifie le déclencheur réel\n3. On renforce physiquement\n4. On crée une alternative au geste\n5. On suit l'évolution\n\nPas de recette magique.\nJuste une stratégie adaptée.`,

    `Ce qui change vraiment :\n\n❌ Pas de solution générique\n❌ Pas de promesse miracle\n✔️ Une écoute réelle\n✔️ Une technique adaptée\n✔️ Un accompagnement progressif\n\nQuand c'est bien fait,\nle résultat tient.\nEt tu reprends confiance.`
  ];

  return solutions[seed % solutions.length];
}

function generateEmotionalProjection(title: string, profession: string, seed: number): string {
  const projections = [
    `Imagine regarder tes mains\nsans les cacher.\n\nSans honte.\nSans gêne.\nSans cette petite voix qui te critique.\n\nJuste des mains que tu assumes.`,

    `Le résultat ?\n\nPlus besoin de stresser.\nPlus besoin de cacher.\nJuste profiter.\n\nEt retrouver cette confiance\nque tu croyais perdue.`,

    `Avant : tu évitais.\nTu cachais.\nTu espérais que personne ne remarque.\n\nAprès : tu montres.\nTu assumes.\nTu es fière.\n\nC'est souvent là que le vrai changement se voit.`,

    `Imagine ne plus avoir à cacher.\n\nNe plus avoir à t'excuser.\nNe plus avoir honte.\n\nJuste être toi.\nAvec des résultats que tu assumes.\n\nC'est possible.`
  ];

  return projections[seed % projections.length];
}

function generateStrategicCTAForScript(objective: string, title: string, seed: number): string {
  const titleLower = title.toLowerCase();

  const ctas: Record<string, string[]> = {
    éduquer: [
      `Si tu veux en savoir plus :\n\n📌 Sauvegarde ce post\n💬 Pose tes questions en commentaire\n📩 Ou DM-moi pour en discuter`,

      `Des questions sur ${titleLower} ?\n\n💬 Écris-les en commentaire\n📩 Ou envoie-moi un DM\nJe te réponds avec plaisir`,

      `${title}.\nSi ça te parle :\n\n💬 Écris "OUI" en commentaire\n📩 Ou DM-moi pour échanger`,
    ],
    convertir: [
      `Si ${titleLower} te concerne :\n\n📍 Réserve maintenant (lien en bio)\n💬 Ou écris "RDV" en DM`,

      `Arrêter ${titleLower},\nce n'est pas une question de force.\n\nC'est une stratégie.\nUn accompagnement.\nUn système.\n\n💬 Écris "STOP" en commentaire si tu veux en parler.\nJe te réponds en privé.`,

      `Tu veux résoudre ${titleLower} ?\n\n📲 Réserve ton diagnostic (lien en bio)\n💬 Ou commente "GO"`,
    ],
    attirer: [
      `Ce post résonne pour toi ?\n\n💬 Commente "OUI"\n📌 Sauvegarde-le\n📤 Partage-le à quelqu'un qui en a besoin`,

      `Tu te reconnais ?\n\n💾 Sauvegarde ce post\n📩 Partage-le en story\n💬 Dis-moi en commentaire ce que tu en penses`,
    ],
    fidéliser: [
      `Tu fais déjà partie de mes clientes ?\n\n💬 Raconte-moi ton expérience en commentaire\n📍 Et pense à réserver ton prochain RDV`,

      `Mes clientes régulières :\n\n💬 Partagez votre transformation\n📩 Et n'oubliez pas de réserver (lien en bio)`,
    ],
  };

  const objectiveCTAs = ctas[objective] || ctas['éduquer'];
  return objectiveCTAs[seed % objectiveCTAs.length];
}

function generateLongCaption(title: string, profession: string, seed: number): string {
  const titleLower = title.toLowerCase();
  const captions = [
    `Tu crois que tu manques de volonté.\n\nMais si le problème n'était pas ta volonté ?\n\n${title} est souvent lié à un mécanisme automatique du cerveau face au stress ou à l'anxiété. Ce n'est pas "bête". Ce n'est pas "sale". C'est une réponse.\n\nEt une réponse, ça se comprend.\n\nEn institut, on agit sur deux choses :\n– Le renforcement physique\n– Le déclencheur émotionnel\n\nParce que casser une habitude, ce n'est pas se battre contre soi.\nC'est changer l'environnement du geste.\n\nSi tu veux arrêter pour de bon cette année,\nil faut une stratégie, pas juste une promesse.\n\nJe peux t'aider 🤍`,

    `${title}. Ce n'est pas ce que tu crois.\n\nLa plupart des clientes pensent que ${titleLower}, c'est compliqué ou hors de portée.\nEn réalité, ce n'est ni une question de chance… ni une question de budget.\n\nCe n'est pas une fatalité.\nC'est un mécanisme qu'on peut comprendre et traiter.\n\nQuand c'est fait correctement :\n✔️ Le résultat tient dans le temps\n✔️ Tu te sens en confiance\n✔️ Tu n'as plus besoin de cacher\n\nEt surtout… tu retrouves ce sentiment de bien-être que tu cherchais.\n\nJ'ai accompagné des dizaines de clientes dans cette transformation.\nEt chaque fois, c'est la même chose : ce n'est pas juste le résultat qui change.\nC'est la confiance qui revient.`,

    `Parlons de ${title.toLowerCase()} (sans filtre).\n\nBeaucoup me disent qu'elles ont essayé, que ça n'a pas marché, qu'elles ont abandonné.\nMais voici ce qu'on ne leur a jamais expliqué.\n\nCe n'est pas une question de technique parfaite.\nCe n'est pas une question de produit magique.\nC'est une question de méthode adaptée à TOI.\n\nPlus tu essaies de "réparer" seule, plus tu risques d'aggraver.\nPlus c'est mal fait, plus c'est difficile à rattraper.\nEt plus tu attends, plus tu perds confiance.\n\nAvec la bonne approche :\n✔️ On comprend d'abord ton besoin réel\n✔️ On adapte la solution à ta situation\n✔️ On obtient un résultat durable et naturel\n\nLa différence ne se voit pas que dans le résultat.\nElle se voit dans la posture, dans le regard, dans la confiance retrouvée.`
  ];

  return captions[seed % captions.length];
}

function generateShortCaption(title: string, profession: string, seed: number): string {
  const shortCaptions = [
    `${title} ? Ce n'est pas une fatalité.\n\nAvec la bonne méthode, tout change.\n\n✔️ Résultat durable\n✔️ Confiance retrouvée\n✔️ Bien-être garanti\n\n📍 Réserve maintenant (lien en bio)`,

    `${title}. La vérité.\n\nCe n'est pas toi le problème.\nC'est la méthode.\n\nAvec la bonne approche :\n✔️ Ça tient\n✔️ C'est confortable\n✔️ Tu retrouves confiance\n\n📩 DM-moi "RDV" pour réserver`
  ];

  return shortCaptions[seed % shortCaptions.length];
}

function generateProfessionHashtags(profession: string, contentType: ContentType, platform: Platform): string {
  const baseHashtags: Record<string, string[]> = {
    'onglerie': ['#onglerie', '#ongles', '#nailart', '#beautedesongles', '#prothesisteongulaire'],
    'esthétique': ['#esthetique', '#beaute', '#soinsvisage', '#skincare', '#estheticienne'],
    'coiffure': ['#coiffure', '#cheveux', '#coiffeuseproductrice', '#hair', '#hairstyle'],
    'extensions de cils': ['#cils', '#extensionsdecils', '#lashartist', '#beauty', '#regard'],
    'sourcils': ['#sourcils', '#browartist', '#microblading', '#beauteduregard', '#brows'],
    'soins du visage': ['#soinsvisage', '#facialiste', '#skincare', '#beautebienetre', '#peauparfaite'],
    'beauté': ['#beaute', '#beauty', '#bienetre', '#selfcare', '#beautypro']
  };

  const professionTags = baseHashtags[profession] || baseHashtags['beauté'];
  return professionTags.join(' ');
}

function generateCarrousel(title: string, platform: Platform, description?: string, context?: string, developTitle: boolean = false): GeneratedContent {
  const contextHeader = context ? `\n🎯 ${context}\n\n---\n\n` : '';

  const finalTitle = developTitle ? developContentTitle(title, 'carrousel', platform, context) : title;
  const showDevelopedSection = developTitle && finalTitle !== title;

  const developedSection = showDevelopedSection
    ? `📌 SUJET DÉVELOPPÉ\n\n"${finalTitle}"\n\n---\n\n`
    : '';

  const contentStructure = `${contextHeader}${developedSection}📍 SLIDE 1 - HOOK
→ Titre percutant qui arrête le scroll

📍 SLIDES 2-7 - CONTENU
→ Une idée de valeur par slide`;

  const caption = generateProfessionalCaption({
    title: finalTitle,
    contentType: 'carrousel',
    platform,
    description,
    context,
    originalTheme: developTitle ? title : undefined
  });

  const hashtags = generateHashtags(title, 'carrousel', platform);

  return { contentStructure, caption, hashtags };
}

function generateReel(title: string, platform: Platform, description?: string, context?: string, developTitle: boolean = false): GeneratedContent {
  const finalTitle = developTitle ? developContentTitle(title, 'reel', platform, context) : title;
  const showDevelopedSection = developTitle && finalTitle !== title;

  const developedSection = showDevelopedSection
    ? `📌 SUJET DÉVELOPPÉ\n\n"${finalTitle}"\n\n---\n\n`
    : '';

  const contentStructure = `🎬 REEL

${developedSection}Script adapté pour format vidéo court avec hook visuel fort`;

  const caption = generateProfessionalCaption({
    title: finalTitle,
    contentType: 'reel',
    platform,
    description,
    context,
    originalTheme: developTitle ? title : undefined
  });

  const hashtags = generateHashtags(title, 'reel', platform);

  return { contentStructure, caption, hashtags };
}

function generateStory(title: string, platform: Platform, description?: string, context?: string, developTitle: boolean = false): GeneratedContent {
  const finalTitle = developTitle ? developContentTitle(title, 'story', platform, context) : title;
  const showDevelopedSection = developTitle && finalTitle !== title;

  const developedSection = showDevelopedSection
    ? `📌 SUJET DÉVELOPPÉ\n\n"${finalTitle}"\n\n---\n\n`
    : '';

  const contentStructure = `📱 STORY

${developedSection}Format story : court, direct, authentique`;

  const caption = generateProfessionalCaption({
    title: finalTitle,
    contentType: 'story',
    platform,
    description,
    context,
    originalTheme: developTitle ? title : undefined
  });

  const hashtags = generateHashtags(title, 'story', platform);

  return { contentStructure, caption, hashtags };
}

function generatePost(title: string, platform: Platform, description?: string, context?: string, developTitle: boolean = false): GeneratedContent {
  const finalTitle = developTitle ? developContentTitle(title, 'post', platform, context) : title;
  const showDevelopedSection = developTitle && finalTitle !== title;

  const developedSection = showDevelopedSection
    ? `📌 SUJET DÉVELOPPÉ\n\n"${finalTitle}"\n\n---\n\n`
    : '';

  const contentStructure = `📸 POST

${developedSection}Contenu statique avec légende engageante`;

  const caption = generateProfessionalCaption({
    title: finalTitle,
    contentType: 'post',
    platform,
    description,
    context,
    originalTheme: developTitle ? title : undefined
  });

  const hashtags = generateHashtags(title, 'post', platform);

  return { contentStructure, caption, hashtags };
}

interface CaptionParams {
  title: string;
  contentType: ContentType;
  platform: Platform;
  description?: string;
  context?: string;
  originalTheme?: string;
}

function extractTopicKeywords(rawTitle: string): string[] {
  const stopWords = ['en', 'de', 'la', 'le', 'les', 'un', 'une', 'des', 'du', 'et', 'ou', 'à', 'au', 'pour', 'dans', 'sur', 'avec', 'sans', 'par', '2024', '2025', '2026', '2027'];
  const words = rawTitle.toLowerCase().split(/\s+/);
  return words.filter(w => w.length > 2 && !stopWords.includes(w));
}

function developContentTitle(rawTitle: string, contentType: ContentType, platform: Platform, context?: string): string {
  const objective = extractObjective(context);
  const profession = extractProfession(context);

  const titlePatterns = {
    attirer: [
      `Pourquoi ${rawTitle} (et ce que tu dois savoir)`,
      `${rawTitle} : ce que personne ne te dit`,
      `La vérité sur ${rawTitle}`,
      `${rawTitle} : arrête de faire ces erreurs`,
      `Ce que tu ignores sur ${rawTitle}`,
      `${rawTitle} : le guide que j'aurais aimé avoir`,
      `Tout ce qu'on ne t'a jamais dit sur ${rawTitle}`,
      `${rawTitle} : les 3 erreurs les plus courantes`,
    ],
    éduquer: [
      `Comment ${rawTitle} (la bonne méthode)`,
      `${rawTitle} : le guide complet`,
      `Comprendre ${rawTitle} en 5 points`,
      `${rawTitle} : explications et solutions`,
      `Pourquoi ${rawTitle} et comment y remédier`,
      `${rawTitle} : ce que tu dois absolument savoir`,
      `Les bases de ${rawTitle} expliquées simplement`,
      `${rawTitle} : décryptage et conseils pratiques`,
    ],
    convertir: [
      `${rawTitle} : la solution que tu cherchais`,
      `${rawTitle} : comment je peux t'aider`,
      `${rawTitle} : la transformation que mes clientes adorent`,
      `${rawTitle} : réserve maintenant pour un résultat garanti`,
      `${rawTitle} : pourquoi mes clientes ne vont plus ailleurs`,
      `La méthode ${rawTitle} qui change tout`,
      `${rawTitle} : arrête de souffrir, j'ai la solution`,
      `${rawTitle} : voici comment obtenir un résultat durable`,
    ],
    fidéliser: [
      `${rawTitle} : pourquoi mes clientes reviennent toujours`,
      `${rawTitle} : l'expérience que tu mérites`,
      `${rawTitle} : ce qui fait la différence chez moi`,
      `Mes clientes adorent ${rawTitle} (voici pourquoi)`,
      `${rawTitle} : le secret de mes clientes fidèles`,
      `${rawTitle} : ton moment rien qu'à toi`,
      `${rawTitle} : l'attention que je porte à chaque détail`,
      `${rawTitle} : ce que tu vis vraiment pendant ta séance`,
    ],
  };

  const patterns = titlePatterns[objective as keyof typeof titlePatterns] || titlePatterns['éduquer'];
  const seed = rawTitle.length + contentType.length + profession.length;
  return patterns[seed % patterns.length];
}

function generateProfessionalCaption(params: CaptionParams): string {
  const { title, contentType, platform, description, context, originalTheme } = params;

  const objective = extractObjective(context);
  const profession = extractProfession(context);

  const hook = generateCaptionHook(title, platform, contentType);
  const emotionalParagraph = generateEmotionalParagraph(title, platform, profession, originalTheme);
  const coreMessage = generateCoreMessage(title, platform, contentType, profession, originalTheme);
  const authorityPositioning = generateAuthorityPositioning(platform, profession);
  const cta = generateStrategicCTA(platform, objective, contentType, originalTheme);

  let caption = '';

  if (platform === 'instagram') {
    caption = `${hook}

${emotionalParagraph}

${coreMessage}

${authorityPositioning}

${cta}`;
  } else if (platform === 'linkedin') {
    caption = `${hook}

${coreMessage}

${authorityPositioning}

${emotionalParagraph}

${cta}`;
  } else if (platform === 'tiktok') {
    caption = `${hook}

${emotionalParagraph}

${coreMessage}

${cta}`;
  } else {
    caption = `${hook}

${emotionalParagraph}

${coreMessage}

${authorityPositioning}

${cta}`;
  }

  return caption;
}

function extractObjective(context?: string): string {
  if (!context) return 'éduquer';
  if (context.includes('attirer')) return 'attirer';
  if (context.includes('convertir')) return 'convertir';
  if (context.includes('fidéliser')) return 'fidéliser';
  return 'éduquer';
}

function extractProfession(context?: string): string {
  if (!context) return 'beauté';
  if (context.includes('nail')) return 'onglerie';
  if (context.includes('esthétique')) return 'esthétique';
  if (context.includes('coiffure')) return 'coiffure';
  if (context.includes('cils')) return 'extensions de cils';
  if (context.includes('sourcils')) return 'sourcils';
  if (context.includes('visage')) return 'soins du visage';
  return 'beauté';
}

function generateCaptionHook(title: string, platform: Platform, contentType: ContentType): string {
  const extractCoreTheme = (developedTitle: string): string => {
    const lower = developedTitle.toLowerCase();
    if (lower.includes('pourquoi')) {
      const match = lower.match(/pourquoi (.+?)(?:\(| et | : |$)/);
      if (match) return match[1].trim();
    }
    if (lower.includes(':')) {
      const parts = developedTitle.split(':');
      if (parts[0].length > 10) return parts[0].trim();
    }
    return developedTitle.substring(0, 80);
  };

  const coreTheme = extractCoreTheme(title);

  const hooks = [
    `${coreTheme.charAt(0).toUpperCase() + coreTheme.slice(1)} ? Ce n'est pas ce que tu crois.`,
    `Parlons de ${coreTheme} (sans filtre).`,
    `${coreTheme.charAt(0).toUpperCase() + coreTheme.slice(1)}. Voilà ce que personne ne dit.`,
    `La vérité sur ${coreTheme}.`,
    `${coreTheme.charAt(0).toUpperCase() + coreTheme.slice(1)} : arrêtons les fausses croyances.`,
    `Tu te demandes pourquoi ${coreTheme} ? Voici la réalité.`,
    `${coreTheme.charAt(0).toUpperCase() + coreTheme.slice(1)}. Et si on en parlait vraiment ?`,
    `Tout ce qu'on ne t'a jamais dit sur ${coreTheme}.`,
  ];

  const seed = title.length + (platform === 'instagram' ? 0 : platform === 'linkedin' ? 10 : 20);
  return hooks[seed % hooks.length];
}

function generateEmotionalParagraph(title: string, platform: Platform, profession: string, originalTheme?: string): string {
  const theme = originalTheme || title;

  const paragraphs = [
    `La plupart des clientes pensent que ${theme.toLowerCase()}, c'est compliqué ou hors de portée.\nEn réalité, ce n'est ni une question de chance… ni une question de budget.`,

    `Beaucoup me disent qu'elles ont essayé avec ${theme.toLowerCase()}, que ça n'a pas marché, qu'elles ont abandonné.\nMais voici ce qu'on ne leur a jamais expliqué.`,

    `Tu sais ce moment où tu te dis "pourquoi ${theme.toLowerCase()} ne fonctionne jamais pour moi" ?\nCe n'est pas toi. C'est juste qu'on ne t'a pas donné les bonnes clés.`,

    `Pendant longtemps, j'ai cru que ${theme.toLowerCase()} était normal.\nQue c'était "comme ça" et qu'il fallait faire avec.\nPuis j'ai compris que non.`,

    `Si ${theme.toLowerCase()} te concerne, sache une chose :\nCe n'est pas une fatalité. Et ce n'est pas de ta faute.`,

    `J'entends souvent cette phrase au sujet de ${theme.toLowerCase()} : "Je ne sais pas si c'est pour moi".\nEt à chaque fois, ma réponse est la même : si tu te poses la question, c'est que tu en as besoin.`,

    `Ce que je vais te dire sur ${theme.toLowerCase()} va peut-être te surprendre.\nMais c'est exactement ce que mes clientes me disent après coup : "Pourquoi personne ne m'a dit ça avant ?"`,
  ];

  const seed = title.length + profession.length;
  return paragraphs[seed % paragraphs.length];
}

function generateCoreMessage(title: string, platform: Platform, contentType: ContentType, profession: string, originalTheme?: string): string {
  const theme = originalTheme || title;

  const messages = [
    `Voici ce que la plupart des gens ne comprennent pas concernant ${theme.toLowerCase()} :

Ce n'est pas une question de technique parfaite.
Ce n'est pas une question de produit magique.
C'est une question de méthode adaptée à TOI.

Quand ${theme.toLowerCase()} est traité correctement :
✔️ Le résultat tient dans le temps
✔️ Tu te sens en confiance
✔️ Tu n'as plus besoin de corriger ou de cacher

Et surtout… tu retrouves ce sentiment de bien-être que tu cherchais.`,

    `Ce que personne ne te dit sur ${theme.toLowerCase()} :

Plus tu essaies de "réparer" seule, plus tu risques d'aggraver.
Plus c'est mal fait, plus c'est difficile à rattraper.
Et plus tu attends, plus tu perds confiance.

Avec la bonne approche pour ${theme.toLowerCase()} :
✔️ On comprend d'abord ton besoin réel
✔️ On adapte la solution à ta situation
✔️ On obtient un résultat durable et naturel

La différence ne se voit pas que dans le résultat.\nElle se voit dans la posture, dans le regard, dans la confiance retrouvée.`,

    `Pourquoi ${theme.toLowerCase()} fonctionne quand c'est bien fait :

1️⃣ Parce qu'on ne force rien
2️⃣ Parce qu'on respecte ce qui est déjà là
3️⃣ Parce qu'on travaille AVEC toi, pas contre toi

Le résultat avec ${theme.toLowerCase()} ?
→ Plus besoin de stresser
→ Plus besoin de tout surveiller
→ Juste profiter du résultat

Et c'est exactement ce que mes clientes me disent à chaque fois.`,

    `Voici la réalité que beaucoup ignorent concernant ${theme.toLowerCase()} :

Ce n'est pas "grave" ou "perdu d'avance".\nC'est juste qu'il faut la bonne méthode.

Quand ${theme.toLowerCase()} est traité de manière adaptée :
✔️ Ça tient beaucoup plus longtemps
✔️ C'est beaucoup plus confortable
✔️ Tu retrouves une vraie sérénité

Et ça… ça change tout.

Pas seulement au niveau du résultat visible.\nMais surtout au niveau de ce que TU ressens.`,

    `Ce qui fait toute la différence avec ${theme.toLowerCase()} :

❌ Penser que "c'est comme ça" et qu'on ne peut rien y faire
✔️ Comprendre qu'avec la bonne approche, tout change

❌ Essayer des solutions génériques qui ne fonctionnent pas
✔️ Avoir une solution personnalisée, adaptée à TOI

❌ Perdre du temps et de l'argent dans des options inadaptées
✔️ Investir intelligemment dans ce qui fonctionne vraiment

Le résultat ? Mes clientes reviennent.\nPas par obligation. Par choix.`,
  ];

  const seed = title.length * contentType.length;
  return messages[seed % messages.length];
}

function generateAuthorityPositioning(platform: Platform, profession: string): string {
  const positionings = [
    `J'ai accompagné des dizaines de clientes dans cette transformation.\nEt chaque fois, c'est la même chose : ce n'est pas juste le résultat qui change.\nC'est la confiance qui revient.`,

    `Après des années dans ce métier, je peux te dire une chose :\nLa technique, tout le monde peut l'apprendre.\nCe qui fait la différence, c'est l'écoute et l'adaptation.`,

    `Ce que j'ai appris avec le temps :\nChaque personne est différente.\nChaque situation demande une approche unique.\nEt c'est exactement ce que je fais.`,

    `Mon approche est simple :\nJe ne propose jamais la même chose à tout le monde.\nParce que tu n'es pas "tout le monde".`,

    `Ce qui me passionne dans mon métier ?\nCe n'est pas le geste technique.\nC'est le moment où ma cliente réalise que oui, c'est possible pour elle aussi.`,
  ];

  const seed = profession.length + platform.length;
  return positionings[seed % positionings.length];
}

function generateStrategicCTA(platform: Platform, objective: string, contentType: ContentType, originalTheme?: string): string {
  const themeContext = originalTheme ? ` concernant ${originalTheme.toLowerCase()}` : '';

  const ctas: Record<string, string[]> = {
    attirer: [
      `Si ce post${themeContext} résonne pour toi :\n💬 Commente "OUI" ou partage-le en story\n📌 Sauvegarde-le pour le relire plus tard`,
      `Tu te reconnais dans ce post${themeContext} ?\n💾 Sauvegarde-le\n📤 Partage-le à quelqu'un qui en a besoin`,
      `Ce post${themeContext} t'a parlé ?\n💬 Dis-moi en commentaire\n📩 Ou partage-le avec une amie`,
    ],
    éduquer: [
      `Tu veux en savoir plus${themeContext} ?\n💬 Pose-moi tes questions en commentaire\n📩 Ou envoie-moi un DM, je te réponds avec plaisir`,
      `Des questions sur ce sujet${themeContext} ?\n💬 Écris-les en commentaire\n📌 Et sauvegarde ce post pour ne pas l'oublier`,
      `Besoin de plus de détails${themeContext} ?\n📩 DM-moi, je t'explique tout\n💾 Sauvegarde ce post pour le retrouver facilement`,
    ],
    convertir: [
      `Si${themeContext} te concerne :\n📍 Prends rendez-vous maintenant (lien en bio)\n💬 Ou écris-moi "RDV" en commentaire`,
      `Prête à passer à l'action${themeContext} ?\n📲 Réserve ton créneau (lien en bio)\n💬 Ou DM-moi "RÉSERVATION" pour qu'on en parle`,
      `Tu veux résoudre ${originalTheme || 'ce problème'} ?\n📍 Clique sur le lien en bio\n💬 Ou commente "GO" et je t'explique tout`,
    ],
    fidéliser: [
      `Tu fais déjà partie de mes clientes ?\n💬 Dis-moi en commentaire ce que tu as préféré lors de ton dernier RDV\n📌 Et n'oublie pas de réserver ton prochain créneau`,
      `Mes clientes régulières, ce post${themeContext} est pour vous :\n💬 Partagez votre expérience en commentaire\n📩 Et n'hésitez pas à me DM si besoin`,
      `Si tu es déjà passée entre mes mains :\n💬 Raconte-moi ce qui a changé pour toi${themeContext}\n📌 Et pense à réserver ton prochain RDV (lien en bio)`,
    ],
  };

  const objectiveCTAs = ctas[objective] || ctas['éduquer'];
  const seed = objective.length + contentType.length;
  return objectiveCTAs[seed % objectiveCTAs.length];
}

export function generateHashtags(
  title: string,
  contentType: ContentType,
  platform: Platform
): string {
  const words = title.toLowerCase().split(' ');
  const relevantWords = words.filter(w => w.length > 4);

  const baseHashtags: string[] = [];

  if (relevantWords.length > 0) {
    baseHashtags.push(`#${relevantWords[0].replace(/[^a-z]/g, '')}`);
  }

  const platformSpecific: Record<Platform, string[]> = {
    instagram: ['#reelsinstagram', '#explorepage', '#instadaily', '#instabeauty', '#beautytips', '#probeauty'],
    linkedin: ['#linkedin', '#business', '#professionnel', '#entrepreneur', '#expertise', '#formation'],
    tiktok: ['#fyp', '#pourtoi', '#viral', '#tiktokfrance', '#astuce', '#tutoriel'],
    facebook: ['#conseils', '#communaute', '#partage', '#astucedujour'],
    youtube: ['#youtube', '#video', '#tutoriel', '#guide', '#formation'],
    twitter: ['#twitter', '#thread', '#conseils', '#astuce'],
  };

  const contentTypeHashtags: Record<ContentType, string[]> = {
    post: ['#conseil', '#astuce', '#tips', '#transformation', '#avantapres'],
    reel: ['#reel', '#reels', '#reelsinstagram', '#tutoriel', '#transformation'],
    carrousel: ['#carrousel', '#guide', '#tuto', '#conseils', '#astucespro'],
    story: ['#story', '#stories', '#coulisses', '#quotidien'],
    video: ['#video', '#tutoriel', '#howto', '#pasapas', '#formation'],
    live: ['#live', '#direct', '#qa', '#session', '#questions'],
  };

  const industryHashtags = [
    '#beauty', '#beaute', '#beautyaddict', '#beautypro',
    '#entrepreneurbeaute', '#bienetrepro', '#artisan',
    '#france', '#savoirfaire', '#expertise'
  ];

  const selectedPlatformTags = platformSpecific[platform]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const selectedContentTags = contentTypeHashtags[contentType]
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const selectedIndustryTags = industryHashtags
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const allHashtags = [
    ...baseHashtags,
    ...selectedContentTags,
    ...selectedPlatformTags,
    ...selectedIndustryTags,
  ];

  return allHashtags.slice(0, 15).join(' ');
}

export function enhanceHashtags(existingHashtags: string, title: string, platform: Platform): string {
  const existing = existingHashtags.split(' ').filter(h => h.startsWith('#'));
  const newHashtags = generateHashtags(title, 'post', platform);
  const newTags = newHashtags.split(' ').filter(h => !existing.includes(h));

  return [...existing, ...newTags].join(' ');
}

import { type ProfessionKey } from './professionHelpers';

interface ContentIdea {
  title: string;
  description: string;
  content_type: string;
  platform: string[] | string;
  angle: string;
  objective: string;
  type: 'content' | 'event';
  structure?: string;
}

function getProfessionContext(profession: string): string {
  const contexts: Record<string, string> = {
    'nail_artist': 'onglerie',
    'estheticienne': 'esthétique',
    'coiffeuse': 'coiffure',
    'lash_artist': 'extensions de cils',
    'brow_artist': 'sourcils',
    'facialiste': 'soins du visage',
    'prothesiste_ongulaire': 'prothésie ongulaire',
    'multi_metiers': 'beauté'
  };
  return contexts[profession || ''] || 'mon métier';
}

export function generateContentIdeas(
  profession: ProfessionKey | null,
  format: string,
  platform: string,
  objective: string,
  pillar?: string,
  customTitle?: string
): ContentIdea[] {
  return generateStrategicIdeas(profession, format, platform, objective, pillar, customTitle);
}

function generateStrategicIdeas(
  profession: ProfessionKey | null,
  format: string,
  platform: string,
  objective: string,
  pillar?: string,
  customTitle?: string
): ContentIdea[] {
  const ideas: ContentIdea[] = [];
  const professionContext = getProfessionContext(profession || 'multi_metiers');
  const seed = Math.random() * 1000;

  for (let i = 0; i < 5; i++) {
    const ideaSeed = seed + i * 17;
    const idea = generateUltraStrategicIdea(
      professionContext,
      format,
      platform,
      objective,
      pillar,
      customTitle,
      i,
      ideaSeed
    );
    ideas.push(idea);
  }

  return ideas;
}

function generateTopicAlignedScript(
  customTitle: string,
  format: string,
  platform: string,
  objective: string,
  professionContext: string
): string {
  const keywords = extractTopicKeywords(customTitle);
  const mainTopic = customTitle;

  if (format === 'carrousel') {
    return `→ SLIDE 1 (Hook - DOIT mentionner "${mainTopic}")
"${mainTopic} ?"
Ce n'est pas ce que tu crois.

→ SLIDE 2 (Problème - reste sur le sujet)
La plupart des gens pensent que ${mainTopic.toLowerCase()}…
Mais voici la vérité.

→ SLIDE 3 (Cause réelle)
Ce n'est pas une fatalité.
C'est une question de méthode.

→ SLIDE 4 (Solution concrète)
Voici ce qui fonctionne vraiment pour ${mainTopic.toLowerCase()} :
✔️ Comprendre la cause
✔️ Adapter la solution
✔️ Obtenir un résultat durable

→ SLIDE 5 (Résultat)
Imagine ne plus avoir à gérer ${mainTopic.toLowerCase()}.
Juste profiter du résultat.

→ SLIDE 6 (Preuve)
Mes clientes me disent :
"Pourquoi personne ne m'a dit ça avant ?"

→ SLIDE 7 (CTA)
Si ${mainTopic.toLowerCase()} te concerne :
Réserve maintenant (lien en bio)`;
  }

  if (format === 'reel' || format === 'video') {
    return `→ 0-3s HOOK (DOIT mentionner "${mainTopic}")
"${mainTopic}"
[Arrêt brutal]

→ 3-8s PROBLÈME
Tu te reconnais ?
[Montrer la situation]

→ 8-13s SOLUTION
Voici ce qui change tout pour ${mainTopic.toLowerCase()}
[Montrer la méthode]

→ 13-17s RÉSULTAT
Le résultat : mes clientes ne revivent plus ${mainTopic.toLowerCase()}
[Avant/après]

→ 17-20s CTA
Tu veux la même chose ?
→ Réserve (lien en bio)`;
  }

  return `HOOK : ${mainTopic} ? Voici la vérité.

CONTENU : Explication détaillée qui reste 100% alignée avec ${mainTopic}.

CTA : Si ${mainTopic.toLowerCase()} te concerne, réserve maintenant.`;
}

function verifyTopicCoherence(customTitle: string, script: string): { aligned: boolean; issues: string[] } {
  const keywords = extractTopicKeywords(customTitle);
  const scriptLower = script.toLowerCase();
  const issues: string[] = [];

  const keywordMatches = keywords.filter(kw => scriptLower.includes(kw.toLowerCase()));

  if (keywordMatches.length === 0) {
    issues.push(`❌ AUCUN mot-clé du thème "${customTitle}" trouvé dans le script`);
  }

  const mainTopicMentioned = scriptLower.includes(customTitle.toLowerCase().substring(0, 15));
  if (!mainTopicMentioned) {
    issues.push(`❌ Le thème "${customTitle}" n'est pas mentionné explicitement`);
  }

  const genericTopics = ['annulation', 'réservation', 'planning', 'communication'];
  const hasGenericDrift = genericTopics.some(topic =>
    scriptLower.includes(topic) && !customTitle.toLowerCase().includes(topic)
  );

  if (hasGenericDrift) {
    issues.push(`⚠️ Possible dérive vers un sujet générique non lié à "${customTitle}"`);
  }

  return {
    aligned: issues.length === 0,
    issues
  };
}

function generateUltraStrategicIdea(
  professionContext: string,
  format: string,
  platform: string,
  objective: string,
  pillar: string | undefined,
  customTitle: string | undefined,
  index: number,
  seed: number
): ContentIdea {
  let ideaTitle: string;
  let fullScript: string;
  let coherenceCheck = '';

  if (customTitle) {
    const contextForTitle = buildContext(objective, pillar, professionContext);
    ideaTitle = developContentTitle(customTitle, format as ContentType, platform as Platform, contextForTitle);

    fullScript = generateTopicAlignedScript(customTitle, format, platform, objective, professionContext);

    const verification = verifyTopicCoherence(customTitle, fullScript);
    coherenceCheck = `
✅ VÉRIFICATION DE COHÉRENCE (OBLIGATOIRE)

Thème source : "${customTitle}"
${verification.aligned ? '✅ Alignement : 100% CONFORME' : '❌ Alignement : NON CONFORME'}

${verification.issues.length > 0 ? verification.issues.join('\n') : '✅ Le script reste 100% aligné avec le thème fourni'}
${verification.aligned ? '✅ Le sujet n\'a PAS dérivé vers des sujets génériques' : ''}
${verification.aligned ? `✅ Les mots-clés "${extractTopicKeywords(customTitle).join(', ')}" sont présents` : ''}

IMPORTANT : Ce contenu parle UNIQUEMENT de "${customTitle}",
et ne dérive PAS vers d'autres sujets (annulations, communication, etc.)

---

`;
  } else {
    ideaTitle = generateIdeaTitle(format, objective, professionContext, index, seed);
    fullScript = generateCompleteScript(format, platform, objective, professionContext, index, seed);
  }

  const hookExample = customTitle
    ? `${customTitle} ? Ce n'est pas ce que tu crois.`
    : generatePatternInterruptHook(format, platform, objective, professionContext, index, seed);

  const psychologicalTriggers = getPsychologicalTriggers(objective, format, index, seed);
  const contentAngle = customTitle
    ? `Rester 100% aligné avec "${customTitle}" tout en créant l'identification, amplifier la frustration liée à ce sujet précis, puis présenter la solution experte adaptée à ce problème spécifique.`
    : generateStrategicAngle(format, platform, objective, professionContext, index, seed);

  const retentionStructure = getRetentionStructure(format, platform, index, seed);
  const conversionVersion = getConversionVersion(format, platform, objective, professionContext, index, seed);
  const alignment = getAlignmentNote(format, platform, objective, pillar, professionContext);

  const developedTitleSection = customTitle && ideaTitle !== customTitle
    ? `📌 SUJET DÉVELOPPÉ À PARTIR DE TON THÈME

Thème brut fourni : "${customTitle}"
✅ Sujet développé : "${ideaTitle}"

⚠️ RÈGLE ABSOLUE : Le contenu ci-dessous parle UNIQUEMENT de "${customTitle}"
Le sujet ne dérive PAS vers d'autres thèmes.

---

`
    : '';

  const description = `${developedTitleSection}${coherenceCheck}📌 HOOK EXEMPLE (Pattern Interrupt)

"${hookExample}"

🧠 DÉCLENCHEURS PSYCHOLOGIQUES UTILISÉS

${psychologicalTriggers}

🎯 ANGLE DU CONTENU

${contentAngle}

📚 FORMAT SCRIPT COMPLET${customTitle ? ` (100% aligné avec "${customTitle}")` : ''}

${fullScript}

📈 STRUCTURE RÉTENTION 3 SECONDES

${retentionStructure}

💰 VERSION ORIENTÉE CONVERSION

${conversionVersion}

${alignment}

💡 CONSEIL PRO (Ultra stratégique)

${getUltraProTip(format, platform, objective, index, seed)}`;

  return {
    title: ideaTitle,
    description,
    content_type: format,
    platform,
    angle: contentAngle,
    objective,
    type: 'content'
  };
}

function generatePatternInterruptHook(
  format: string,
  platform: string,
  objective: string,
  professionContext: string,
  index: number,
  seed: number
): string {
  const hooks = [
    `Si ta pose ne tient pas 3 semaines… ce n'est PAS normal.`,
    `Arrête de perdre des clientes sans le savoir.`,
    `Cette erreur coûte 200€ par mois à 80% des pros.`,
    `Tes clientes annulent ? Ce n'est pas leur faute.`,
    `Le secret des pros qui affichent complet toute l'année.`,
    `Pourquoi tes posts ne marchent pas (la vraie raison).`,
    `Ce que les formations ne te disent JAMAIS.`,
    `3 semaines d'attente ? Voici comment j'y suis arrivée.`,
    `Le pricing qui a doublé mon CA (sans perdre de clientes).`,
    `Cette technique change TOUT (et personne ne la connaît).`,
    `J'ai failli tout arrêter… puis j'ai découvert ça.`,
    `La différence entre 800€ et 3000€ par mois.`,
    `Ce moment où tu réalises que tu faisais tout à l'envers.`,
    `Les clientes fidèles ne viennent pas par hasard.`,
    `Voilà pourquoi tu te sens invisible sur Instagram.`,
  ];

  return hooks[Math.floor(seed + index * 7) % hooks.length];
}

function getPsychologicalTriggers(
  objective: string,
  format: string,
  index: number,
  seed: number
): string {
  const allTriggers = [
    '✓ Rupture de croyance (contradiction directe avec une idée acceptée)',
    '✓ Curiosité gap (question ouverte qui demande une réponse)',
    '✓ Autorité implicite (expertise démontrée, pas affichée)',
    '✓ Preuve sociale indirecte (témoignage client, résultat concret)',
    '✓ Peur de perte (temps, argent, opportunité manquée)',
    '✓ Projection du résultat (visualisation du bénéfice)',
    '✓ Identification immédiate (situation vécue par l\'audience)',
    '✓ Urgence émotionnelle (besoin de résoudre maintenant)',
    '✓ Exclusivité perçue (accès privilégié à l\'information)',
    '✓ Contraste avant/après (transformation visible)',
    '✓ Révélation (secret enfin dévoilé)',
    '✓ Empathie (compréhension profonde du problème)',
  ];

  const selectedCount = 3 + (index % 2);
  const startIndex = Math.floor(seed + index * 3) % allTriggers.length;
  const selected = [];

  for (let i = 0; i < selectedCount; i++) {
    selected.push(allTriggers[(startIndex + i) % allTriggers.length]);
  }

  return selected.join('\n');
}

function generateStrategicAngle(
  format: string,
  platform: string,
  objective: string,
  professionContext: string,
  index: number,
  seed: number
): string {
  const angles = [
    `Déstabiliser une croyance acceptée pour créer une prise de conscience, puis proposer une solution experte qui mène naturellement à la réservation.`,
    `Créer l'identification immédiate avec un problème vécu, amplifier la frustration, puis présenter la transformation comme évidente et désirable.`,
    `Révéler une erreur courante qui coûte cher (temps/argent), créer l'urgence émotionnelle, puis positionner l'expertise comme la seule solution viable.`,
    `Utiliser la preuve sociale et le résultat tangible pour créer l'envie, puis faciliter le passage à l'action avec un CTA irrésistible.`,
    `Montrer les coulisses d'un résultat exceptionnel, créer l'aspiration, puis inviter à vivre la même expérience de manière exclusive.`,
    `Démontrer l'autorité par l'explication pédagogique, créer la compréhension, puis proposer l'accompagnement personnalisé comme suite logique.`,
    `Créer la controverse positive sur une idée reçue, susciter le débat, puis se positionner comme l'expert qui a la vraie réponse.`,
    `Raconter une transformation client spectaculaire, créer la projection émotionnelle, puis rendre l'action immédiate avec un bénéfice clair.`,
  ];

  return angles[Math.floor(seed + index * 5) % angles.length];
}

function generateCompleteScript(
  format: string,
  platform: string,
  objective: string,
  professionContext: string,
  index: number,
  seed: number
): string {
  if (format === 'carrousel') {
    return generateCarrouselFullScript(platform, objective, professionContext, index, seed);
  }

  if (format === 'reel' || format === 'video') {
    return generateReelFullScript(platform, objective, professionContext, index, seed);
  }

  if (format === 'post') {
    return generatePostFullScript(platform, objective, professionContext, index, seed);
  }

  return 'Script adapté au format choisi avec contenu complet prêt à poster.';
}

function generateCarrouselFullScript(
  platform: string,
  objective: string,
  professionContext: string,
  index: number,
  seed: number
): string {
  const scripts = [
    `→ SLIDE 1 (Pattern interrupt visuel)
Si ta pose ne tient pas 3 semaines…
ce n'est PAS normal.

→ SLIDE 2 (Amplification du problème)
Ce n'est pas "ta nature d'ongle".
Ce n'est pas "le gel".
C'est la technique.

→ SLIDE 3 (Autorité)
Une préparation mal faite =
❌ Décollement
❌ Bulles
❌ Ongles fragilisés

→ SLIDE 4 (Éducation rapide)
Voici ce qui fait TOUTE la différence :
✔️ Cuticules parfaitement travaillées
✔️ Surface équilibrée
✔️ Produits adaptés à TON type d'ongle

→ SLIDE 5 (Projection positive)
Imagine une pose brillante,
solide,
qui tient 3-4 semaines sans bouger.

→ SLIDE 6 (Preuve + crédibilité)
Mes clientes reviennent toutes les 3 semaines.
Aucune casse.
Aucun décollement.

→ SLIDE 7 (Conversion forte)
Si tu veux une pose qui tient vraiment :
Prends rendez-vous maintenant 💅
(Lien en bio)`,

    `→ SLIDE 1 (Choc émotionnel)
Tes clientes annulent ?
Ce n'est pas leur faute.
C'est ta communication.

→ SLIDE 2 (Identification problème)
Tu envoies le RDV par SMS.
Pas de rappel.
Pas de lien direct.
Elles oublient.

→ SLIDE 3 (Amplification)
Chaque annulation =
❌ Créneau perdu
❌ Manque à gagner
❌ Planning troué

→ SLIDE 4 (Solution concrète)
La solution :
✔️ Confirmation automatique
✔️ Rappel 48h avant
✔️ Lien réservation direct

→ SLIDE 5 (Bénéfice tangible)
Résultat :
-70% d'annulations
Planning rempli
Zéro stress

→ SLIDE 6 (Preuve sociale)
Mes clientes reçoivent :
→ Confirmation immédiate
→ Rappel personnalisé
→ Lien pour modifier facilement

→ SLIDE 7 (CTA fort)
Tu veux un planning plein ?
Commence par ta communication.
Réserve maintenant (lien en bio)`,

    `→ SLIDE 1 (Rupture)
Tu postes tous les jours…
et personne ne réserve.
Normal.

→ SLIDE 2 (Diagnostic)
Tu montres :
- Tes ongles
- Tes produits
- Ta technique

Mais tu ne racontes RIEN.

→ SLIDE 3 (Vérité)
Les gens n'achètent pas :
❌ Une technique
❌ Un produit
❌ Un résultat

Ils achètent une ÉMOTION.

→ SLIDE 4 (Solution)
Raconte :
✔️ Pourquoi cette cliente vient
✔️ Ce qu'elle ressent en partant
✔️ Ce que ça change pour elle

→ SLIDE 5 (Exemple concret)
Au lieu de :
"Pose gel nude"

Écris :
"Elle arrive stressée du boulot.
Elle repart apaisée, confiante.
C'est ça que je vends."

→ SLIDE 6 (Impact)
Quand tu racontes des histoires :
→ Les gens se projettent
→ Ils se reconnaissent
→ Ils réservent

→ SLIDE 7 (CTA conversion)
Prête à raconter TON histoire ?
Commence maintenant.
Réserve ta séance (lien en bio)`,
  ];

  return scripts[Math.floor(seed + index * 11) % scripts.length];
}

function generateReelFullScript(
  platform: string,
  objective: string,
  professionContext: string,
  index: number,
  seed: number
): string {
  const scripts = [
    `→ 0-3s HOOK (Pattern interrupt)
"Si tes ongles tiennent pas 3 semaines…"
[Visuel : Main avec ongles parfaits]

→ 3-8s PROBLÈME
"C'est pas ta nature d'ongle"
[Texte qui s'affiche : "C'est la préparation"]

→ 8-12s SOLUTION
"Voici les 3 étapes que je fais TOUJOURS"
[Montrer rapidement : cuticules, surface, application]

→ 12-17s RÉSULTAT
"Résultat : 3-4 semaines, zéro décollement"
[Avant/Après rapide]

→ 17-20s CTA
"Tu veux la même chose ?"
[Texte : "Réserve maintenant → Lien en bio"]`,

    `→ 0-3s HOOK (Choc)
"Cette erreur te coûte 200€ par mois"
[Visuel arrêt brutal]

→ 3-9s RÉVÉLATION
"Tu acceptes les annulations de dernière minute"
[Montrer notification d'annulation]

→ 9-14s IMPACT
"Créneau perdu = Argent perdu"
[Chiffres qui défilent]

→ 14-18s SOLUTION
"J'ai mis une politique d'annulation claire"
[Montrer le système]

→ 18-20s RÉSULTAT + CTA
"Depuis : +200€/mois"
[CTA : "Réserve maintenant"]`,

    `→ 0-3s HOOK (Curiosité)
"Le secret des pros toujours complètes"
[Visuel : Planning rempli]

→ 3-10s ERREUR COMMUNE
"La plupart attendent que les clientes les trouvent"
[Montrer compte Instagram vide]

→ 10-15s VÉRITÉ
"Les meilleures CRÉENT la demande"
[Transition : avant/après du compte]

→ 15-19s MÉTHODE
"Stories quotidiennes + Preuves sociales + CTA clair"
[Montrer les 3 éléments rapidement]

→ 19-20s CTA
"À toi de jouer → Lien en bio"`,
  ];

  return scripts[Math.floor(seed + index * 13) % scripts.length];
}

function generatePostFullScript(
  platform: string,
  objective: string,
  professionContext: string,
  index: number,
  seed: number
): string {
  const scripts = [
    `VISUEL : Photo avant/après spectaculaire

LÉGENDE :

Si ta pose ne tient pas 3 semaines… ce n'est PAS normal.

Ce n'est pas "ta nature d'ongle".
Ce n'est pas "le gel".
C'est la technique.

Une préparation mal faite = décollement, bulles, ongles fragilisés.

Voici ce qui fait TOUTE la différence :
✔️ Cuticules parfaitement travaillées
✔️ Surface équilibrée sans sur-limage
✔️ Produits adaptés à ton type d'ongle spécifique

Le résultat ?
Mes clientes reviennent toutes les 3 semaines.
Aucune casse. Aucun décollement.

Juste une pose qui tient. Vraiment.

Si tu veux la même chose :
📍 Réserve maintenant (lien en bio)
💬 Ou DM-moi "POSE" pour + d'infos

#ongles #beaute #nailart`,

    `VISUEL : Screenshot de planning complet

LÉGENDE :

Tes clientes annulent ? Ce n'est pas leur faute.

Pendant des mois, j'ai cru que mes clientes étaient irresponsables.
Annulations. No-show. Planning troué.

Puis j'ai compris : le problème c'était MOI.

Ma communication était nulle :
❌ SMS basique sans rappel
❌ Pas de lien direct
❌ Elles oubliaient, tout simplement

J'ai tout changé :
✔️ Confirmation automatique
✔️ Rappel 48h avant
✔️ Lien pour modifier facilement

Résultat : -70% d'annulations.

Aujourd'hui mon planning est plein.
Mes clientes sont heureuses.
Et moi beaucoup moins stressée.

La différence ? Une vraie communication.

Tu galères avec les annulations ?
📍 DM-moi "PLANNING"
Je te montre mon système

#entrepreneurbeaute #planning`,
  ];

  return scripts[Math.floor(seed + index * 19) % scripts.length];
}

function getRetentionStructure(
  format: string,
  platform: string,
  index: number,
  seed: number
): string {
  const structures = [
    `1. Choc initial (contradiction directe)
2. Identification du problème vécu
3. Désignation du vrai responsable
4. Solution simple et actionnable
5. Projection émotionnelle positive
6. Preuve sociale tangible
7. CTA immédiat et irrésistible`,

    `1. Pattern interrupt visuel + textuel
2. Amplification de la frustration
3. Révélation de la cause cachée
4. Démonstration de l'expertise
5. Bénéfice concret et mesurable
6. Témoignage ou résultat client
7. Invitation à l'action claire`,

    `1. Question qui interpelle directement
2. Réponse surprenante qui brise la croyance
3. Explication pédagogique courte
4. Démonstration par l'exemple
5. Résultat spectaculaire montré
6. Autorité établie naturellement
7. CTA qui découle logiquement`,
  ];

  return structures[Math.floor(seed + index * 7) % structures.length];
}

function getConversionVersion(
  format: string,
  platform: string,
  objective: string,
  professionContext: string,
  index: number,
  seed: number
): string {
  const versions = [
    `Même si l'objectif principal est la visibilité, voici la version conversion :

→ CTA clair et direct : "Réserve maintenant (lien en bio)"
→ Mise en avant du résultat tangible : "3-4 semaines sans décollement"
→ Focus sur le bénéfice concret : "Économise temps et argent"
→ Urgence douce : "Places limitées cette semaine"
→ Facilitation de l'action : "DM-moi RÉSERVATION pour réserver"

La clé : Le contenu crée le désir, le CTA facilite l'action.`,

    `Version orientée conversion (applicable à tout objectif) :

→ Problème identifié : "Tu perds des clientes sans le savoir"
→ Solution présentée : "Mon système de confirmation automatique"
→ Bénéfice chiffré : "-70% d'annulations = +200€/mois"
→ Preuve sociale : "Mes clientes adorent ce système"
→ CTA irrésistible : "Tu veux le même résultat ? Réserve maintenant"

Pas besoin d'être agressif. Juste clair sur la valeur.`,

    `Transformation du contenu en outil de conversion :

→ Montrer le AVANT (problème vécu)
→ Révéler le PENDANT (méthode/expertise)
→ Prouver le APRÈS (résultat tangible)
→ Créer l'urgence émotionnelle (pas de pression)
→ Faciliter l'action (CTA ultra simple)

Exemple : "Si tu vis ça → Je peux t'aider → Voici comment → Réserve ici"

La conversion n'est jamais forcée. Elle est facilitée.`,
  ];

  return versions[Math.floor(seed + index * 23) % versions.length];
}

function getAlignmentNote(
  format: string,
  platform: string,
  objective: string,
  pillar: string | undefined,
  professionContext: string
): string {
  return `🎨 ALIGNMENT

Format ${format} optimisé pour ${platform}
Objectif ${objective} respecté dans la structure
${pillar ? `Pilier "${pillar}" intégré dans l'angle` : 'Adaptable à tout pilier éditorial'}
Métier ${professionContext} ancré dans les exemples

Le contenu est prêt à adapter avec tes visuels et ton ton personnel.`;
}

function getUltraProTip(
  format: string,
  platform: string,
  objective: string,
  index: number,
  seed: number
): string {
  const tips = [
    `Les posts orientés conversion doivent créer une frustration légère, apporter une micro-solution, puis terminer par une action immédiate. La clé n'est pas d'expliquer. La clé est de faire RESSENTIR.`,

    `Le secret des contenus viraux : ils ne montrent pas ta perfection, ils montrent le problème de ton audience. Plus tu parles d'EUX (pas de toi), plus ils écoutent.`,

    `L'algorithme favorise les 3 premières secondes. Si ton hook ne crée pas un micro-choc émotionnel (curiosité, surprise, identification), le reste ne sera JAMAIS vu. Teste 5 hooks différents.`,

    `La différence entre un contenu qui informe et un contenu qui convertit : l'émotion. Ne dis pas "je fais des poses qui tiennent". Dis "imagine ne plus avoir peur que tes ongles cassent".`,

    `Les meilleurs contenus ne vendent pas un service. Ils vendent une transformation émotionnelle. Tes clientes n'achètent pas des ongles. Elles achètent la confiance, l'apaisement, le moment pour elles.`,

    `Si tu veux des réservations, arrête de montrer tes techniques. Montre ce que tes clientes RESSENTENT en partant. L'émotion vend. La technique informe. Ne confonds pas les deux.`,

    `Le contenu qui performe répond à UNE question précise que ton audience se pose. Pas 3. Pas 5. UNE. Plus c'est précis, plus c'est puissant. "Comment faire durer ses ongles" bat "Tout sur les ongles".`,
  ];

  return tips[Math.floor(seed + index * 31) % tips.length];
}

function generateIdeaTitle(
  format: string,
  objective: string,
  professionContext: string,
  index: number,
  seed: number
): string {
  const titles = [
    `Pourquoi ta pose ne tient pas (et comment y remédier)`,
    `Le secret des pros qui affichent complet`,
    `Cette erreur te coûte 200€ par mois`,
    `La vérité sur les annulations de dernière minute`,
    `Comment doubler tes réservations sans publicité`,
    `Ce que tes clientes attendent vraiment de toi`,
    `La technique que les formations ne t'enseignent pas`,
    `Pourquoi tes posts ne convertissent pas`,
    `Le pricing qui a changé mon business`,
    `Comment créer des clientes fidèles (qui reviennent)`,
  ];

  return titles[Math.floor(seed + index * 41) % titles.length];
}
