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
}

interface GeneratedContent {
  contentStructure: string;
  caption: string;
  hashtags: string;
  script?: string;
}

export function generateContentAI(params: GenerationParams): GeneratedContent {
  const { title, contentType, platform, description, objective, pillar, profession } = params;

  const context = buildContext(objective, pillar, profession);
  const script = generateDetailedScript(title, contentType, platform, description, objective, pillar, profession);

  let baseContent: GeneratedContent;
  switch (contentType) {
    case 'carrousel':
      baseContent = generateCarrousel(title, platform, description, context);
      break;
    case 'reel':
    case 'video':
      baseContent = generateReel(title, platform, description, context);
      break;
    case 'story':
      baseContent = generateStory(title, platform, description, context);
      break;
    case 'post':
    default:
      baseContent = generatePost(title, platform, description, context);
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

function generateDetailedScript(
  title: string,
  contentType: ContentType,
  platform: Platform,
  description?: string,
  objective?: string,
  pillar?: string,
  profession?: string
): string {
  return `Script généré pour: ${title}`;
}

function generateCarrousel(title: string, platform: Platform, description?: string, context?: string): GeneratedContent {
  const contextHeader = context ? `\n🎯 ${context}\n\n---\n\n` : '';

  const contentStructure = `${contextHeader}📍 SLIDE 1 - HOOK
→ Titre percutant qui arrête le scroll

📍 SLIDES 2-7 - CONTENU
→ Une idée de valeur par slide`;

  const caption = generateProfessionalCaption({
    title,
    contentType: 'carrousel',
    platform,
    description,
    context
  });

  const hashtags = generateHashtags(title, 'carrousel', platform);

  return { contentStructure, caption, hashtags };
}

function generateReel(title: string, platform: Platform, description?: string, context?: string): GeneratedContent {
  const contentStructure = `🎬 REEL - ${title}`;

  const caption = generateProfessionalCaption({
    title,
    contentType: 'reel',
    platform,
    description,
    context
  });

  const hashtags = generateHashtags(title, 'reel', platform);

  return { contentStructure, caption, hashtags };
}

function generateStory(title: string, platform: Platform, description?: string, context?: string): GeneratedContent {
  const contentStructure = `📱 STORY - ${title}`;

  const caption = generateProfessionalCaption({
    title,
    contentType: 'story',
    platform,
    description,
    context
  });

  const hashtags = generateHashtags(title, 'story', platform);

  return { contentStructure, caption, hashtags };
}

function generatePost(title: string, platform: Platform, description?: string, context?: string): GeneratedContent {
  const contentStructure = `📸 POST - ${title}`;

  const caption = generateProfessionalCaption({
    title,
    contentType: 'post',
    platform,
    description,
    context
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
}

function generateProfessionalCaption(params: CaptionParams): string {
  const { title, contentType, platform, description, context } = params;

  const objective = extractObjective(context);
  const profession = extractProfession(context);

  const hook = generateCaptionHook(title, platform, contentType);
  const emotionalParagraph = generateEmotionalParagraph(title, platform, profession);
  const coreMessage = generateCoreMessage(title, platform, contentType, profession);
  const authorityPositioning = generateAuthorityPositioning(platform, profession);
  const cta = generateStrategicCTA(platform, objective, contentType);

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
  const hooks = [
    `${title} ? Ce n'est pas ce que tu crois.`,
    `Parlons de ${title.toLowerCase()} (sans filtre).`,
    `${title}. Voilà ce que personne ne dit.`,
    `La vérité sur ${title.toLowerCase()}.`,
    `${title} : arrêtons les fausses croyances.`,
    `Tu te demandes comment ${title.toLowerCase()} ? Voici la réalité.`,
    `${title}. Et si on en parlait vraiment ?`,
    `Tout ce qu'on ne t'a jamais dit sur ${title.toLowerCase()}.`,
  ];

  const seed = title.length + (platform === 'instagram' ? 0 : platform === 'linkedin' ? 10 : 20);
  return hooks[seed % hooks.length];
}

function generateEmotionalParagraph(title: string, platform: Platform, profession: string): string {
  const paragraphs = [
    `La plupart des clientes pensent que c'est compliqué, irréversible, ou hors de portée.\nEn réalité, ce n'est ni une question de chance… ni une question de budget.`,

    `Beaucoup me disent qu'elles ont essayé, que ça n'a pas marché, qu'elles ont abandonné.\nMais voici ce qu'on ne leur a jamais expliqué.`,

    `Tu sais ce moment où tu te dis "pourquoi ça ne fonctionne jamais pour moi" ?\nCe n'est pas toi. C'est juste qu'on ne t'a pas donné les bonnes clés.`,

    `Pendant longtemps, j'ai cru que c'était normal.\nQue c'était "comme ça" et qu'il fallait faire avec.\nPuis j'ai compris que non.`,

    `Si tu te reconnais dans cette situation, sache une chose :\nCe n'est pas une fatalité. Et ce n'est pas de ta faute.`,

    `J'entends souvent cette phrase : "Je ne sais pas si c'est pour moi".\nEt à chaque fois, ma réponse est la même : si tu te poses la question, c'est que tu en as besoin.`,

    `Ce que je vais te dire va peut-être te surprendre.\nMais c'est exactement ce que mes clientes me disent après coup : "Pourquoi personne ne m'a dit ça avant ?"`,
  ];

  const seed = title.length + profession.length;
  return paragraphs[seed % paragraphs.length];
}

function generateCoreMessage(title: string, platform: Platform, contentType: ContentType, profession: string): string {
  const messages = [
    `Voici ce que la plupart des gens ne comprennent pas :

Ce n'est pas une question de technique parfaite.
Ce n'est pas une question de produit magique.
C'est une question de méthode adaptée à TOI.

Quand c'est fait correctement :
✔️ Le résultat tient dans le temps
✔️ Tu te sens en confiance
✔️ Tu n'as plus besoin de corriger ou de cacher

Et surtout… tu retrouves ce sentiment de bien-être que tu cherchais.`,

    `Ce que personne ne te dit :

Plus tu essaies de "réparer" seule, plus tu risques d'aggraver.
Plus c'est mal fait, plus c'est difficile à rattraper.
Et plus tu attends, plus tu perds confiance.

Avec la bonne approche :
✔️ On comprend d'abord ton besoin réel
✔️ On adapte la solution à ta situation
✔️ On obtient un résultat durable et naturel

La différence ne se voit pas que dans le résultat.\nElle se voit dans la posture, dans le regard, dans la confiance retrouvée.`,

    `Pourquoi ça fonctionne quand c'est bien fait :

1️⃣ Parce qu'on ne force rien
2️⃣ Parce qu'on respecte ce qui est déjà là
3️⃣ Parce qu'on travaille AVEC toi, pas contre toi

Le résultat ?
→ Plus besoin de stresser
→ Plus besoin de tout surveiller
→ Juste profiter du résultat

Et c'est exactement ce que mes clientes me disent à chaque fois.`,

    `Voici la réalité que beaucoup ignorent :

Ce n'est pas "grave" ou "perdu d'avance".\nC'est juste qu'il faut la bonne méthode.

Quand c'est adapté à toi :
✔️ Ça tient beaucoup plus longtemps
✔️ C'est beaucoup plus confortable
✔️ Tu retrouves une vraie sérénité

Et ça… ça change tout.

Pas seulement au niveau du résultat visible.\nMais surtout au niveau de ce que TU ressens.`,

    `Ce qui fait toute la différence :

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

function generateStrategicCTA(platform: Platform, objective: string, contentType: ContentType): string {
  const ctas: Record<string, string[]> = {
    attirer: [
      `Si ce post résonne pour toi :\n💬 Commente "OUI" ou partage-le en story\n📌 Sauvegarde-le pour le relire plus tard`,
      `Tu te reconnais dans ce post ?\n💾 Sauvegarde-le\n📤 Partage-le à quelqu'un qui en a besoin`,
      `Ce post t'a parlé ?\n💬 Dis-moi en commentaire\n📩 Ou partage-le avec une amie`,
    ],
    éduquer: [
      `Tu veux en savoir plus ?\n💬 Pose-moi tes questions en commentaire\n📩 Ou envoie-moi un DM, je te réponds avec plaisir`,
      `Des questions sur ce sujet ?\n💬 Écris-les en commentaire\n📌 Et sauvegarde ce post pour ne pas l'oublier`,
      `Besoin de plus de détails ?\n📩 DM-moi, je t'explique tout\n💾 Sauvegarde ce post pour le retrouver facilement`,
    ],
    convertir: [
      `Si tu te reconnais dans ce post :\n📍 Prends rendez-vous maintenant (lien en bio)\n💬 Ou écris-moi "RDV" en commentaire`,
      `Prête à passer à l'action ?\n📲 Réserve ton créneau (lien en bio)\n💬 Ou DM-moi "RÉSERVATION" pour qu'on en parle`,
      `Tu veux vivre cette transformation ?\n📍 Clique sur le lien en bio\n💬 Ou commente "GO" et je t'explique tout`,
    ],
    fidéliser: [
      `Tu fais déjà partie de mes clientes ?\n💬 Dis-moi en commentaire ce que tu as préféré lors de ton dernier RDV\n📌 Et n'oublie pas de réserver ton prochain créneau`,
      `Mes clientes régulières, ce post est pour vous :\n💬 Partagez votre expérience en commentaire\n📩 Et n'hésitez pas à me DM si besoin`,
      `Si tu es déjà passée entre mes mains :\n💬 Raconte-moi ce qui a changé pour toi\n📌 Et pense à réserver ton prochain RDV (lien en bio)`,
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
  const hookExample = generatePatternInterruptHook(format, platform, objective, professionContext, index, seed);
  const psychologicalTriggers = getPsychologicalTriggers(objective, format, index, seed);
  const contentAngle = generateStrategicAngle(format, platform, objective, professionContext, index, seed);
  const fullScript = generateCompleteScript(format, platform, objective, professionContext, index, seed);
  const retentionStructure = getRetentionStructure(format, platform, index, seed);
  const conversionVersion = getConversionVersion(format, platform, objective, professionContext, index, seed);
  const alignment = getAlignmentNote(format, platform, objective, pillar, professionContext);

  const ideaTitle = customTitle || generateIdeaTitle(format, objective, professionContext, index, seed);

  const description = `📌 HOOK EXEMPLE (Pattern Interrupt)

"${hookExample}"

🧠 DÉCLENCHEURS PSYCHOLOGIQUES UTILISÉS

${psychologicalTriggers}

🎯 ANGLE DU CONTENU

${contentAngle}

📚 FORMAT SCRIPT COMPLET

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
