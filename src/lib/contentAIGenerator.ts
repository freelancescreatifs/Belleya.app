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

function generateAuthenticScript(
  title: string,
  contentType: ContentType,
  platform: Platform,
  description?: string,
  objective?: string,
  pillar?: string,
  profession?: string
): string {
  const randomSeed = Math.random();
  const scenarios = getScenariosByContext(profession, objective, platform, randomSeed);
  const selectedScenario = scenarios[Math.floor(randomSeed * scenarios.length) % scenarios.length];

  const script = buildConcreteScript(
    selectedScenario,
    title,
    contentType,
    platform,
    description,
    profession,
    objective,
    pillar,
    randomSeed
  );

  return script;
}

function getScenariosByContext(
  profession?: string,
  objective?: string,
  platform?: string,
  seed: number = Math.random()
): Array<{type: string, emotion: string, structure: string}> {
  const baseScenarios = [
    { type: 'doute_transformation', emotion: 'soulagement', structure: 'doubt_to_confidence' },
    { type: 'frustration_declic', emotion: 'revelation', structure: 'problem_to_solution' },
    { type: 'croyance_limitante', emotion: 'liberation', structure: 'myth_to_truth' },
    { type: 'parcours_client', emotion: 'identification', structure: 'client_journey' },
    { type: 'erreur_commune', emotion: 'empathie', structure: 'mistake_awareness' },
    { type: 'moment_cle', emotion: 'celebration', structure: 'pivotal_moment' },
    { type: 'realite_vs_attente', emotion: 'surprise', structure: 'expectation_vs_reality' },
  ];

  return baseScenarios;
}

function buildConcreteScript(
  scenario: {type: string, emotion: string, structure: string},
  title: string,
  contentType: ContentType,
  platform: Platform,
  description?: string,
  profession?: string,
  objective?: string,
  pillar?: string,
  seed: number = Math.random()
): string {
  const professionContext = getProfessionContext(profession);
  const platformTone = getPlatformTone(platform);
  const lengthGuide = getContentLength(contentType);

  const openings = getContextualOpenings(scenario.type, professionContext, platform, seed);
  const developments = getContextualDevelopments(scenario.structure, professionContext, objective, seed);
  const closings = getContextualClosings(platform, objective, seed);

  const openingIndex = Math.floor(seed * openings.length) % openings.length;
  const developmentIndex = Math.floor((seed * 17 + 11) * developments.length) % developments.length;
  const closingIndex = Math.floor((seed * 23 + 19) * closings.length) % closings.length;

  const selectedOpening = openings[openingIndex];
  const selectedDevelopment = developments[developmentIndex];
  const selectedClosing = closings[closingIndex];

  let script = '';

  script += selectedOpening.replace(/{title}/g, title.toLowerCase()).replace(/{topic}/g, description || title.toLowerCase());
  script += '\n\n';
  script += selectedDevelopment.replace(/{title}/g, title.toLowerCase()).replace(/{topic}/g, description || title.toLowerCase());
  script += '\n\n';
  script += selectedClosing.replace(/{title}/g, title.toLowerCase());

  if (platformTone === 'professional') {
    script = script.replace(/\.\.\./g, '.');
    script = script.replace(/!/g, '.');
    script = script.replace(/😱|🔥|✨|💕/g, '');
  }

  return script;
}

function getProfessionContext(profession?: string): string {
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

function getPlatformTone(platform: Platform): string {
  const tones: Record<Platform, string> = {
    'linkedin': 'professional',
    'facebook': 'conversational',
    'instagram': 'authentic',
    'tiktok': 'raw',
    'youtube': 'conversational',
    'twitter': 'concise'
  };
  return tones[platform] || 'authentic';
}

function getContentLength(contentType: ContentType): string {
  const lengths: Record<ContentType, string> = {
    'post': 'medium',
    'reel': 'short',
    'carrousel': 'structured',
    'story': 'very_short',
    'video': 'long',
    'live': 'interactive'
  };
  return lengths[contentType] || 'medium';
}

function getContextualOpenings(scenarioType: string, professionContext: string, platform: Platform, seed: number): string[] {
  const openings = [
    `Mes clientes ont souvent 2x mon âge\nPourtant… elles m'adorent\n\nAu début, ça me mettait une pression de fou.\n\nJe me disais :\n"Mais pourquoi elles feraient confiance à une fille de 23 ans ?"\n"Et s'ils pensent que je suis trop jeune ?"\n"Et si je ne suis pas assez crédible face à 20 ans d'expérience ?"`,

    `J'ai failli arrêter ${professionContext} il y a 6 mois\n\nPas parce que ça marchait pas\nMais parce que je me sentais invisible\n\nJ'avais beau bosser comme une dingue\nPoster tous les jours\nFaire de super prestations\n\nRien\nPas de nouveaux clients\nPas d'engagement\nJuste… le silence`,

    `"Tu devrais peut-être baisser tes prix"\n\nOn m'a dit ça 47 fois cette année\nOui, j'ai compté\n\nÀ chaque fois, j'ai senti ce truc bizarre dans le ventre\nCe mélange de doute et de colère\n\n"Peut-être qu'ils ont raison ?"\n"Peut-être que je demande trop ?"\n"Peut-être que je ne vaux pas ce prix ?"`,

    `Elle arrive dans mon salon, tendue\nLes épaules crispées\nLe regard fatigué\n\n"J'ai essayé 4 salons avant toi"\n"Personne ne comprend ce que je veux"\n"Je commence à croire que c'est moi le problème"\n\nJ'ai entendu ça tellement de fois que j'ai perdu le compte`,

    `Ce matin, une cliente m'a dit un truc qui m'a retournée\n\n"Tu sais… je viens plus vraiment pour {topic}"\n"Je viens parce qu'ici, je me sens comprise"\n\nEt là, j'ai réalisé quelque chose de fou`,

    `Il y a 2 ans, je regardais les autres pros de ${professionContext}\nLeurs résultats incroyables\nLeurs clients qui défilent\nLeur succès apparent\n\nEt je me disais : "Comment ils font ?"\n\nSpoiler : j'ai compris\nEt c'est pas du tout ce que tu crois`,

    `"C'est trop cher pour {topic}"\n\nQuand j'entends ça, avant je paniquais\nJe me justifiais\nJ'expliquais ma technique, mes produits, mon expérience\n\nMaintenant ?\nJ'ai juste compris un truc`,

    `Cette cliente revient tous les mois depuis 3 ans\nSans exception\nMême quand elle a déménagé à 50 km\n\nCe matin elle m'a dit pourquoi\nEt j'ai réalisé que je ne vendais pas ce que je croyais`,

    `J'ai pleuré dans ma voiture hier\nAprès une journée de ouf\n8 clientes\nDes résultats incroyables\nDes compliments partout\n\nMais je me sentais… vide\n\nC'est là que j'ai compris ce qui clochait`,

    `"Comment tu fais pour avoir autant de clientes fidèles ?"\n\nOn me pose cette question au moins 3 fois par semaine\n\nLa vraie réponse ?\nElle va te surprendre`,

    `Il y a 18 mois, j'ai failli tout lâcher\nMon salon était vide la moitié du temps\nMes posts ne marchaient pas\nJe me comparais aux autres\n\nAujourd'hui je refuse des rendez-vous\n\nVoici ce qui a changé`,

    `Une cliente m'a annulé 3 fois de suite\nÀ chaque fois, une "urgence"\nÀ chaque fois, je me suis dit "tant pis"\n\nPuis elle a réservé une 4ème fois\nEt elle m'a dit un truc que je n'oublierai jamais`,

    `Mon premier mois en solo\nJ'ai fait 800€\n800€ pour 30 jours de stress\nDe doutes\nD'insomnies\n\nJe me souviens m'être dit :\n"J'aurais peut-être dû rester salariée"`,

    `"Tu as quel diplôme ?"\n\nCette question me paralysait\nParce que je n'ai pas LE diplôme parfait\nPas LA formation ultra prestigieuse\n\nJuste mes mains\nMon apprentissage\nMa passion\n\nEt tu sais quoi ?\nÇa n'a jamais été un problème\nVoici pourquoi`,

    `Hier, une cliente s'est endormie pendant sa prestation\n\nPas de fatigue\nMais de soulagement\n\nElle m'a dit après :\n"C'est la première fois en 6 mois que je me sens safe"\n\nEt j'ai compris ce que je créais vraiment ici`,

    `J'ai passé 2 ans à copier ce que je voyais ailleurs\nLes mêmes posts\nLes mêmes offres\nLa même communication\n\nRésultat ?\nJe me noyais dans la masse\n\nPuis j'ai tout cassé\nEt là… tout a décollé`,

    `"Pourquoi tu es si chère ?"\n\nAvant, cette question me blessait\nJe prenais ça personnellement\nJe me sentais illégitime\n\nAujourd'hui je souris\nParce que j'ai compris quelque chose`,

    `Ma mère m'a dit :\n"Tu devrais te trouver un vrai travail"\n\nÇa fait mal quand ça vient de ta propre mère\nSurtout quand tu bosses 60h par semaine\nQue tu y crois à fond\nQue tu construis quelque chose\n\nMais j'ai tenu bon\nEt voilà où j'en suis`,

    `Elle est arrivée 20 minutes en avance\nElle marchait de long en large dans la rue\nVisiblement stressée\n\n"C'est mon premier rendez-vous depuis le confinement"\n"J'ai peur de sortir"\n"Mais je ne pouvais plus rester comme ça"\n\nCe jour-là, j'ai vraiment compris mon rôle`,
  ];

  return openings;
}

function getContextualDevelopments(structure: string, professionContext: string, objective?: string, seed: number = Math.random()): string[] {
  const developments = [
    `Parce qu'on grandit avec cette idée que l'âge = la légitimité\nQue tu dois avoir plus d'expérience avant de te lancer\n\nSauf que dans la vraie vie\nça ne fonctionne pas comme ça\n\nMes clientes les plus fidèles\ncelles qui me recommandent\ncelles qui m'envoient des vocaux adorables\ncelles qui me disent "merci, tu m'as changée"\nont souvent l'âge de mes parents\n\nEn réalité, les gens ne cherchent pas quelqu'un de plus âgé\nIls cherchent quelqu'un de com-pé-tent\n\nIls regardent ta vision\nTa manière de penser\nTa capacité à simplifier, à expliquer, à créer\nTa maturité émotionnelle\nTon professionnalisme`,

    `Et puis un jour, j'ai testé quelque chose de différent\n\nJ'ai arrêté de faire "comme tout le monde"\nJ'ai arrêté de copier ce que je voyais ailleurs\nJ'ai arrêté d'essayer d'être parfaite\n\nJ'ai juste commencé à être moi\nAvec ma personnalité\nMes convictions\nMa façon de voir ${professionContext}\n\nEt là…\nTout a changé\n\nLes bonnes personnes ont commencé à venir\nCelles qui vibrent avec mon énergie\nCelles qui comprennent ma valeur\nCelles avec qui je KIFFE bosser`,

    `J'ai testé\n\nPendant 3 mois, j'ai baissé mes prix de 30%\nPour voir\nPour "être plus accessible"\nPour "attirer plus de monde"\n\nRésultat ?\n\nPlus de clients… oui\nMais pas les bons\nDes annulations de dernière minute\nDes retards constants\nDes gens qui négocient encore\nDes prestations où je me sentais pas respectée\n\nAlors j'ai tout remis comme avant\nEt même… j'ai augmenté\n\nEt tu sais quoi ?\nJ'ai perdu les clients qui me bouffaient l'énergie\nEt j'ai gagné ceux qui valorisent mon travail`,

    `Ce que personne ne dit, c'est que 80% du résultat\nça se joue dans l'écoute\n\nPas dans la technique parfaite\nPas dans les produits les plus chers\nPas dans les formations les plus prestigieuses\n\nMais dans ta capacité à VRAIMENT entendre ce que ta cliente ne dit pas\n\nSes peurs\nSes doutes\nSes attentes cachées\nSon histoire avec {topic}\n\nQuand tu comprends ça\nTu ne fais plus "juste" une prestation\nTu crées une expérience\nUne transformation\nUn moment où elle se sent vue`,

    `Que je ne vendais pas {topic}\nJe vendais un refuge\n\nUn endroit où mes clientes peuvent poser leur armure\nOù elles n'ont pas besoin d'être parfaites\nOù elles peuvent juste… être\n\nEt c'est là que j'ai compris pourquoi certaines reviennent\nalors qu'elles habitent à 40 minutes\nalors qu'il y a 10 salons plus proches\nalors que je suis pas la moins chère\n\nParce qu'elles cherchent pas juste une prestation\nElles cherchent leur lieu safe`,

    `Ils ne vendent pas {topic}\nIls vendent une vision\n\nIls ne parlent pas de technique\nIls parlent de transformation\n\nIls ne montrent pas la perfection\nIls montrent l'humain derrière le pro\n\nAlors j'ai commencé à faire pareil\nÀ ma façon\n\nJ'ai arrêté de me cacher derrière "le professionnel parfait"\nJ'ai commencé à montrer qui j'étais vraiment\nMes doutes, mes victoires, mon parcours\n\nEt bizarrement\nC'est là que les gens ont commencé à se connecter vraiment`,

    `Que ceux qui disent "c'est trop cher"\nne sont juste pas mes clients\n\nPas par snobisme\nPas par mépris\nMais parce qu'on ne valorise pas la même chose\n\nMes vrais clients\nils me disent jamais que c'est cher\nParce qu'ils voient la valeur\nParce qu'ils comprennent le résultat\nParce qu'ils cherchent pas le moins cher\n\nIls cherchent le meilleur pour eux\n\nEt quand tu assumes tes prix\nQuand tu portes ta valeur avec confiance\nTu attires exactement ce type de personnes`,

    `J'ai changé UNE chose\nLittéralement une seule\n\nJ'ai arrêté de vendre une prestation\nJ'ai commencé à raconter des histoires\n\nLes histoires de mes clientes\nLeurs transformations\nLeurs émotions\nCe qu'elles ressentent en sortant\n\nEt d'un coup\nLes gens ont arrêté de comparer mes prix\nIls ont commencé à VOULOIR cette expérience\n\nParce que tu vois\nOn n'achète pas un service\nOn achète un ressenti\nUne promesse\nUn moment qu'on veut vivre`,

    `La vérité c'est que j'étais épuisée\n\nPas physiquement\nMais mentalement\n\nJe disais oui à tout\nJe prenais tous les créneaux\nToutes les demandes\nMême celles qui ne me convenaient pas\n\nPar peur\nPeur de refuser\nPeur de perdre\nPeur de ne pas être assez\n\nPuis j'ai compris\nQue moins c'est plus\n\nMoins de clients\nMais les BONS\nCeux qui respectent mon temps\nCeux qui valorisent mon expertise\nCeux qui reviennent\n\nEt là… j'ai retrouvé ma passion`,

    `Ce qu'on ne m'a jamais dit en formation\nC'est que la technique c'est 30% du job\n\nLe reste ?\n\nC'est l'ambiance que tu crées\nLa playlist que tu mets\nL'odeur de ton salon\nLa façon dont tu accueilles\nLe temps que tu prends pour écouter\nCe petit café que tu offres\n\nC'est ÇA qui fait que les clientes reviennent\nPas juste parce que tu es techniquement bonne\nMais parce que tu crées une EXPÉRIENCE\n\nEt ça… personne ne te l'enseigne`,

    `Pendant 2 ans, j'ai posté tous les jours\nDes photos parfaites\nDes légendes travaillées\nDes hashtags optimisés\n\nRésultat : 200 abonnés\nDont la moitié sont d'autres pros\n\nPuis un jour, j'ai posté une photo floue\nDe moi en train de pleurer de rire avec une cliente\nAvec juste : "Ces moments là 💕"\n\n500 likes\n30 commentaires\n5 nouveaux rendez-vous\n\nJ'ai tout compris ce jour-là\nLes gens ne veulent pas voir ta perfection\nIls veulent voir ton HUMANITÉ`,

    `Elle m'a regardée droit dans les yeux\nEt elle m'a dit :\n"Avec toi, je n'ai pas l'impression d'être juste un numéro"\n\nCette phrase\nElle résume tout\n\nDans un monde où tout va trop vite\nOù on enchaîne les clients comme des machines\nOù l'efficacité prime sur l'humain\n\nPrendre le temps\nVraiment écouter\nS'intéresser sincèrement\n\nÇa devient un luxe\nUn luxe que les gens sont prêts à payer`,

    `J'ai compris que mes "concurrents"\nne sont pas mes ennemis\n\nOn ne se bat pas pour les mêmes clients\n\nCeux qui viennent chez moi\nCherchent quelque chose de spécifique\nMa personnalité\nMa vision\nMon approche\n\nCeux qui vont chez les autres\nCherchent autre chose\n\nEt c'est OK\n\nQuand tu l'acceptes vraiment\nTu arrêtes de te comparer\nTu arrêtes de douter\nTu assumes pleinement qui tu es\n\nEt là… tout devient plus simple`,

    `Le déclic ça a été ce commentaire :\n"Tu as transformé ma relation avec {topic}"\n\nJe ne savais même pas que c'était possible\nQue mon travail puisse avoir cet impact\n\nMais c'est là que j'ai réalisé\nQue je ne faisais pas QUE ${professionContext}\n\nJe redonnais confiance\nJe créais des moments de pause dans des vies speed\nJe permettais à des femmes de se retrouver\n\nEt d'un coup\nMon métier a pris un sens complètement différent\nPlus profond\nPlus beau`,

    `J'ai arrêté de chercher LA technique miracle\nLE produit parfait\nLA formation ultime\n\nPour me concentrer sur l'essentiel :\nÊtre présente\nVraiment présente\n\nQuand une cliente est sur ma chaise\nJe ne pense pas au prochain rendez-vous\nJe ne check pas mon téléphone\nJe ne suis pas ailleurs\n\nJe suis LÀ\nAvec elle\nComplètement\n\nEt ça change absolument tout\nPour elle\nEt pour moi`,
  ];

  return developments;
}

function getContextualClosings(platform: Platform, objective?: string, seed: number = Math.random()): string[] {
  const closings = [
    `Alors si tu lis ça et que tu doutes parce que tu es jeune\nLaisse-moi te dire un truc très simple\n\nOn n'achète pas ton âge\nOn achète ton taff, ta personnalité et ton cœur\n\nthat's it`,

    `Aujourd'hui, je sais une chose\n\nLe bon prix\nC'est celui qui attire les bonnes personnes\n\nPas le plus de personnes\nLes bonnes\n\nCelles qui te respectent\nCelles qui valorisent ton travail\nCelles avec qui tu crées de la magie\n\nEt ces personnes-là ?\nElles existent\nIl suffit d'avoir le courage de les attendre`,

    `Ce que je sais maintenant\nc'est qu'être authentique\nça fait peur au début\n\nMais c'est le seul moyen de créer un business qui te ressemble\nAvec des clients qui vibrent avec toi\nEt un quotidien qui te nourrit\n\nAlors arrête d'essayer d'être comme les autres\nDeviens la meilleure version de toi-même\n\nC'est ça qui change tout`,

    `Si tu te reconnais dans ce que je raconte\nSi toi aussi tu doutes parfois\nSi toi aussi tu te demandes si tu es "assez"\n\nLaisse-moi te dire quelque chose\n\nTu l'es\nLargement\n\nIl te manque juste de le croire vraiment`,

    `Construire un business qui te ressemble\nC'est pas copier ce qui marche ailleurs\n\nC'est oser être toi\nCrûment\nPleinement\nSans filtre\n\nEt attirer les personnes qui kiffent exactement ça`,

    `Plus d'une fois, on m'a dit :\n"Tu es jeune, oui… mais tu es brillante"\n\nEt à chaque fois\nça me rappelle que l'âge, l'expérience, le diplôme\nce sont juste des détails\n\nCe qui compte vraiment :\nC'est ce que tu apportes\nComment tu le fais\nEt qui tu es quand tu le fais`,

    `Donc voilà\n\nSi aujourd'hui tu hésites\nSi tu te demandes si tu peux y arriver\nSi tu as peur de te lancer\n\nRegarde-moi\nJe suis la preuve vivante que c'est possible\n\nPas parfaite\nPas surhumaine\nJuste une personne qui a décidé d'essayer\n\nEt toi aussi tu peux`,

    `À toutes celles qui doutent\nQui se comparent\nQui pensent qu'elles n'y arriveront jamais\n\nVotre moment viendra\nMais pas en copiant les autres\nEn étant pleinement vous\n\nC'est la seule voie\nEt c'est la plus belle`,

    `Aujourd'hui je peux te dire\nQue chaque doute\nChaque échec\nChaque moment difficile\n\nM'a construite\n\nEt je ne changerais rien\nParce que c'est exactement ce chemin\nQui m'a amenée où je suis\n\nAlors embrace ton parcours\nMême les parties moches\nSurtout les parties moches`,

    `Et si tu te demandes "par où commencer ?"\n\nCommence par être toi\nVraiment toi\n\nLe reste suivra\nPromis`,

    `Ce que je voudrais que tu retiennes\nC'est qu'il n'y a pas UNE bonne façon de faire\n\nIl y a TA façon\nCelle qui te correspond\nCelle qui te rend heureuse\nCelle qui fait sens pour toi\n\nEt c'est celle-là qu'il faut cultiver`,

    `Alors oui\nC'est pas toujours facile\nOui il y a des jours difficiles\nOui tu vas douter\n\nMais bordel\nQuelle fierté quand tu réalises\nQue tu as créé quelque chose qui te ressemble\n\nÇa vaut tous les sacrifices`,

    `Si je peux te donner un seul conseil\nCe serait celui-là :\n\nArrête de chercher la validation des autres\nCherche la tienne\n\nQuand TU es fière de ton travail\nQuand TU te sens alignée\nQuand TU kiffes ce que tu fais\n\nLe reste se met en place\nTout seul`,

    `Et rappelle-toi\n\nChaque pro que tu admires\nA commencé exactement où tu es\n\nAvec les mêmes doutes\nLes mêmes peurs\nLes mêmes questions\n\nLa seule différence ?\nIls ont continué\n\nAlors toi aussi\nContinue`,

    `Voilà ce que j'avais envie de te dire\n\nMaintenant à toi de jouer\nÀ toi d'écrire ton histoire\nÀ ta manière\n\nEt je te promets\nCe sera magnifique`,
  ];

  return closings;
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
  return generateAuthenticScript(title, contentType, platform, description, objective, pillar, profession);
}

function generateSlayScript(
  title: string,
  contentType: ContentType,
  description?: string,
  objective?: string,
  pillar?: string
): string {
  const intro = description || `Mon approche unique pour ${title.toLowerCase()}`;

  return `📝 FRAMEWORK SLAY

🎬 STORY (Lignes 1-3) - Accroche narrative
"${getStoryHook(title, contentType)}"

Exemple développé :
"Il y a 6 mois, je voyais le même problème chez 8 clientes sur 10.
J'ai décidé de creuser pour comprendre pourquoi.
Et ce que j'ai découvert a tout changé..."

📚 LESSON (Ligne 4) - La leçon principale
"Voici ce que j'ai appris : ${intro}"

Développement de la leçon :
→ Le problème principal que ça résout
→ Pourquoi c'est important maintenant
→ Ce que ça change concrètement

📋 ACTIONABLE ADVICE (Lignes 5+) - Conseils concrets

${getActionableSteps(contentType, objective)}

💬 YOU (Dernière ligne) - Question engagement
"Et toi, tu as déjà testé cette approche ? Raconte-moi en commentaire 👇"

${pillar ? `\n🎯 Pilier éditorial : ${pillar}` : ''}
${objective ? `🎯 Objectif : ${objective}` : ''}

BONUS : Pense toujours à la LEÇON en premier, puis à l'HISTOIRE qui l'illustre.
Ton but = ÉDUQUER en utilisant les histoires comme véhicule.`;
}

function generateAidaScript(
  title: string,
  contentType: ContentType,
  description?: string,
  objective?: string,
  pillar?: string
): string {
  const intro = description || `Découvre comment ${title.toLowerCase()}`;

  return `📝 FRAMEWORK AIDA

🔔 ATTENTION (0-3 secondes) - Capter l'attention immédiatement
Hook visuel + Texte choc :
"${getAttentionHook(title, contentType)}"

Exemples de hooks :
→ "ATTENDS... regarde ça ! 😱"
→ "Tu fais ENCORE cette erreur ? ⚠️"
→ "POV : Tu découvres enfin le secret... 👀"

❤️ INTEREST (4-8 secondes) - Créer l'intérêt
"${intro}"

Pourquoi c'est pertinent MAINTENANT :
→ Le problème que ça résout pour ton audience
→ Pourquoi elles ont besoin de ça aujourd'hui
→ Ce qui rend cette approche unique

🎯 DESIRE (9-15 secondes) - Créer le désir

${getDesireElements(contentType, objective)}

Montrer le résultat/transformation :
→ "Imagine pouvoir [bénéfice concret]..."
→ "Tes clientes/clients vont adorer [résultat]"
→ "En seulement [temps], tu vas voir [changement]"

🚀 ACTION (16-20 secondes) - Appel à l'action fort

${getCtaStrategy(contentType)}

${pillar ? `\n🎯 Pilier éditorial : ${pillar}` : ''}
${objective ? `🎯 Objectif : ${objective}` : ''}

💡 ASTUCE PRO : Les 3 premières secondes décident de TOUT.
Si tu ne captes pas l'attention immédiatement, le reste ne sera jamais vu.`;
}

function getStoryHook(title: string, contentType: ContentType): string {
  const hooks = [
    `Ma cliente arrive et me dit : "J'ai tout essayé, rien ne marche." Spoiler : j'ai trouvé le problème en 30 secondes.`,
    `Il y a 2 ans, je ne savais pas ça. Aujourd'hui, c'est devenu ma technique signature.`,
    `Cette semaine, une cliente m'a dit : "Pourquoi personne ne m'a expliqué ça avant ?" Bonne question.`,
    `Le jour où j'ai découvert cette technique, j'ai compris pourquoi mes résultats n'étaient pas au top.`
  ];
  return hooks[Math.floor(Math.random() * hooks.length)];
}

function getAttentionHook(title: string, contentType: ContentType): string {
  const hooks = [
    `❌ Arrête de faire ça avec ${title.toLowerCase()} !`,
    `🚨 Cette erreur ruine TOUT - et tu la fais sûrement...`,
    `👀 POV : Tu découvres pourquoi ${title.toLowerCase()} ne marchait pas`,
    `⚡ En 60 secondes, ta vision de ${title.toLowerCase()} va changer`
  ];
  return hooks[Math.floor(Math.random() * hooks.length)];
}

function getActionableSteps(contentType: ContentType, objective?: string): string {
  return `Voici les étapes concrètes (format liste numérotée) :

1️⃣ ÉTAPE 1 : [Action précise]
   → Pourquoi ça marche
   → Exemple concret
   → Erreur à éviter

2️⃣ ÉTAPE 2 : [Deuxième action]
   → Le détail qui fait la différence
   → Résultat attendu
   → Astuce de pro

3️⃣ ÉTAPE 3 : [Action finale]
   → Ce que ça change
   → Comment vérifier que c'est bon
   → Le piège à éviter absolument

💡 BONUS : [Un dernier conseil exclusif]`;
}

function getDesireElements(contentType: ContentType, objective?: string): string {
  const elements = {
    attirer: `→ Montre le AVANT/APRÈS spectaculaire
→ Partage les chiffres (temps gagné, résultats)
→ Révèle le "secret" que les pros gardent`,

    éduquer: `→ Explique le "pourquoi" scientifique
→ Démonte les idées reçues
→ Donne les 3 règles d'or à retenir`,

    convertir: `→ Présente ton offre/solution
→ Montre ce qu'elle inclut concrètement
→ Ajoute un élément de rareté/urgence`,

    fidéliser: `→ Partage une exclusivité pour ta communauté
→ Raconte les coulisses
→ Crée un sentiment d'appartenance`
  };

  return elements[objective as keyof typeof elements] || elements.attirer;
}

function getCtaStrategy(contentType: ContentType): string {
  const strategies = {
    post: `→ "Sauvegarde ce post pour le retrouver 💾"
→ "Partage à quelqu'un qui en a besoin 💬"
→ "Dis-moi en commentaire si tu vas tester 👇"`,

    reel: `→ "SAUVEGARDE pour réessayer chez toi 💾"
→ "PARTAGE à ta BFF qui a besoin de voir ça 💕"
→ "Écris GO en commentaire pour la suite 📩"`,

    carrousel: `→ "SWIPE pour tout découvrir ➡️"
→ "SAUVEGARDE ce carrousel 💾"
→ "TAG quelqu'un qui doit voir ça 👥"`,

    story: `→ "RÉPONDS à cette story 💬"
→ "PARTAGE en story si ça t'aide 📲"
→ "SWIPE UP pour réserver 👆"`,

    video: `→ "LIKE si c'est utile ❤️"
→ "ABONNE-TOI pour plus de conseils 🔔"
→ "COMMENTE tes questions 👇"`
  };

  return strategies[contentType as keyof typeof strategies] || strategies.post;
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

function generateCarrousel(title: string, platform: Platform, description?: string, context?: string): GeneratedContent {
  const contextHeader = context ? `\n🎯 ${context}\n\n---\n\n` : '';

  const isProfessional = platform === 'linkedin';
  const hookStyle = isProfessional ? 'professionnel et direct' : 'accrocheur et émotionnel';

  const contentStructure = `${contextHeader}📍 SLIDE 1 - HOOK (Couverture)
${getCarrouselHook(title, platform)}

💡 Design : Titre percutant + visuel fort
🎯 Objectif : Arrêter le scroll en 0.5 seconde

📍 SLIDE 2 - CONTEXTE / PROBLÈME
${isProfessional
  ? `→ Identifie le problème principal de ton audience\n→ Crée l'identification immédiate\n→ Montre que tu comprends leur situation`
  : `→ "Tu connais ce moment où..."\n→ Crée l'empathie et l'identification\n→ Raconte une situation concrète`}

📍 SLIDE 3 - POINT CLÉ 1
→ Premier élément de solution
→ Explique le "pourquoi" avant le "comment"
→ Une idée = un slide (clarté maximale)

📍 SLIDE 4 - POINT CLÉ 2
→ Deuxième élément de solution
→ Ajoute de la valeur concrète
→ Exemple ou donnée pour renforcer

📍 SLIDE 5 - POINT CLÉ 3
→ Troisième élément de solution
→ L'astuce ou le secret qui fait la différence
→ Ce qui va surprendre ton audience

📍 SLIDE 6 - ERREUR À ÉVITER
❌ Ce qu'il NE faut surtout PAS faire
→ Pourquoi c'est contre-productif
→ L'alternative correcte

📍 SLIDE 7 - RÉCAPITULATIF
✓ Résumé des 3 points clés en format liste
→ Facile à sauvegarder et à retenir
→ Renforce l'apprentissage

📍 SLIDE FINALE - CALL TO ACTION
${isProfessional
  ? `→ "Prêt(e) à passer à l'action ?"\n→ Invitation à échanger / contacter\n→ Offre de valeur claire`
  : `→ "Tu veux essayer ? Lien en bio !"\n→ Incitation à sauvegarder le carrousel\n→ Question pour engagement en commentaires`}

${platform === 'instagram' ? '💾 Sauvegarde ce carrousel\n💬 Tag quelqu\'un qui doit voir ça\n❤️ Double tap si c\'est utile' : ''}`;

  const caption = generateCarrouselCaption(title, platform);
  const hashtags = generateHashtags(title, 'carrousel', platform);

  return { contentStructure, caption, hashtags };
}

function getCarrouselHook(title: string, platform: Platform): string {
  const isPro = platform === 'linkedin';
  const hooks = isPro ? [
    `"${title}" - Voici ce que personne ne vous dit`,
    `Les 3 vérités sur ${title.toLowerCase()} que j'aurais aimé connaître plus tôt`,
    `${title} : Guide complet pour éviter les erreurs courantes`,
    `Ce que ${title.toLowerCase()} révèle sur votre stratégie`,
  ] : [
    `${title} 👀\nTu vas kiffer ce carrousel`,
    `STOP ❌\nAvant de ${title.toLowerCase()}, lis ça`,
    `${title}\nLes 7 slides qui changent tout 🔥`,
    `POV : Tu découvres enfin ${title.toLowerCase()} 💡`,
  ];
  return hooks[Math.floor(Math.random() * hooks.length)];
}

function generateReel(title: string, platform: Platform, description?: string, context?: string): GeneratedContent {
  const contextHeader = context ? `\n🎯 ${context}\n\n---\n\n` : '';
  const isTikTok = platform === 'tiktok';
  const isInstagram = platform === 'instagram';

  const contentStructure = isTikTok ? `${contextHeader}🔥 TIKTOK - STRUCTURE RYTHMÉE

⚡ HOOK (0-3 sec) - CRITIQUE !
${getTikTokHook(title)}

📌 Pattern Interrupt obligatoire :
• Mouvement brusque / Changement de plan
• Son choc / Effet sonore marquant
• Texte qui apparaît en gros
• Début en pleine action (pas de intro)

💥 DÉVELOPPEMENT (3-15 sec)
${description || 'Montrer l\'action / la transformation'}

Structure TikTok :
• RYTHME RAPIDE : Changement tous les 2-3 secondes
• 3-4 POINTS MAX : Pas de long discours
• VISUEL > ORAL : Ce qu'on voit doit suffire
• TRENDING SOUND : Utilise un son populaire si possible

💬 PUNCHLINE (15-18 sec)
→ Phrase choc finale qui résume tout
→ Moment "AH!" de réalisation
→ Ce qui va faire commenter

🎯 CTA (18-20 sec)
→ "Partage si ça t'aide"
→ "Commente GO pour la suite"
→ "Follow pour plus d'astuces"

🎵 AUDIO : Choisis un son trending ou voix off énergique`

: `${contextHeader}🎬 INSTAGRAM REEL - STRUCTURE ENGAGEANTE

💫 HOOK (0-3 sec) - ARRÊTE LE SCROLL
${getInstagramHook(title)}

Techniques qui marchent :
• POV (Point of View) + situation relatable
• "Attends... regarde ça" + reveal
• Avant/Après immédiat
• Question directe qui interpelle

🎨 DÉVELOPPEMENT (3-12 sec)
${description || 'Montrer le processus ou la transformation'}

Structure Instagram :
• STORYTELLING RAPIDE : Raconte en montrant
• ESTHÉTIQUE SOIGNÉE : Beau + utile = viral
• SOUS-TITRES : 80% regardent sans son
• TRANSITIONS FLUIDES : Garder l'attention

✨ VALEUR AJOUTÉE (12-16 sec)
→ L'astuce / le secret / le détail qui tue
→ Ce qui rend ton contenu unique
→ Le "pourquoi ça marche"

💡 CONCLUSION (16-20 sec)
→ Récap rapide ou punchline
→ Incite à l'action sans forcer
→ Crée l'envie de revoir

🎯 CTA (écrit + audio)
💾 "Sauvegarde pour plus tard"
💬 "Tag qui doit voir ça"
📩 "DM 'INFO' pour en savoir plus"

🎵 AUDIO : Trending ou musique qui colle à l'ambiance`;

  const caption = generateReelCaption(title, platform);
  const hashtags = generateHashtags(title, 'reel', platform);

  return { contentStructure, caption, hashtags };
}

function getTikTokHook(title: string): string {
  const hooks = [
    `ATTENDS ❌ avant ${title.toLowerCase()}, regarde ça !`,
    `POV : Tu découvres ${title.toLowerCase()} 😱`,
    `${title} ? JE VAIS TE CHOQUER 🤯`,
    `Personne te dit ça sur ${title.toLowerCase()} 👀`,
  ];
  return hooks[Math.floor(Math.random() * hooks.length)];
}

function getInstagramHook(title: string): string {
  const hooks = [
    `${title} ✨\nCe que tu vas voir va te surprendre...`,
    `STOP 🛑\nRegarde comment je fais ${title.toLowerCase()}`,
    `${title}\nLa méthode que j'aurais aimé connaître avant 💡`,
    `POV : ${title.toLowerCase()}\nEt le résultat est fou 🔥`,
  ];
  return hooks[Math.floor(Math.random() * hooks.length)];
}

function generateStory(title: string, platform: Platform, description?: string, context?: string): GeneratedContent {
  const contextHeader = context ? `\n🎯 ${context}\n\n---\n\n` : '';

  const contentStructure = `${contextHeader}📱 STORY 1 - ACCROCHE
${getHook(title)}
Exemple : "Question pour toi 👇" ou "Mini-conseil du jour"

📱 STORY 2 - MESSAGE PRINCIPAL
${description || 'Exemple : "Saviez-vous que [fait surprenant] ? C\'est pour ça que je recommande toujours..."'}

📱 STORY 3 - DÉTAILS/PREUVE
Exemple : "Regarde ce résultat sur ma dernière cliente"
ou "Voici exactement comment je procède..."

📱 STORY 4 - INTERACTION
${platform === 'instagram' ? '📊 SONDAGE : "Tu connaissais cette astuce ?" Oui / Non\n❓ QUESTION : "C\'est quoi ton plus gros problème avec [sujet] ?"\n🔗 LIEN : "Réserve ton RDV" (swipe up)' : 'Question interactive pour engager'}

💡 ASTUCE PRO :
• Utilise des GIFs et stickers pour dynamiser
• Alterne texte court et visuel impactant
• Mets ta personnalité en avant`;

  const caption = `📱 ${title}\n\n${description || 'Contexte et message principal'}`;
  const hashtags = generateHashtags(title, 'story', platform);

  return { contentStructure, caption, hashtags };
}

function generatePost(title: string, platform: Platform, description?: string, context?: string): GeneratedContent {
  const contextHeader = context ? `\n🎯 ${context}\n\n---\n\n` : '';

  const contentStructure = `${contextHeader}🎯 ACCROCHE (première ligne - 125 caractères max)
${getHook(title)}
Exemple : "Tu fais cette erreur sans le savoir... et ça change TOUT 👇"

📝 DÉVELOPPEMENT
${description || 'Raconte une histoire ou partage ton expertise :'}

Exemple de structure :

🔸 LE PROBLÈME
"Il y a 3 ans, je voyais 8 clientes sur 10 avec ce même souci..."

🔸 CE QUI NE MARCHE PAS
"Pendant longtemps, on pensait qu'il fallait [croyance commune]"
"Mais en réalité, ça ne fait qu'empirer les choses"

🔸 LA SOLUTION
"Voici les 3 étapes que j'applique maintenant :"
1️⃣ [Action concrète + pourquoi ça marche]
2️⃣ [Deuxième technique précise avec exemple]
3️⃣ [Astuce finale qui fait toute la différence]

🔸 LE RÉSULTAT
"Mes clientes voient maintenant [résultat mesurable] et ça dure [durée]"

💬 CTA (Call to Action)
${getCTA(platform)}
Exemple : "Tag quelqu'un qui a besoin de voir ça 💕"
ou "Enregistre ce post pour ne pas l'oublier 💾"`;

  const caption = generatePostCaption(title, platform, description);
  const hashtags = generateHashtags(title, 'post', platform);

  return { contentStructure, caption, hashtags };
}

function getHook(title: string): string {
  const hooks = [
    `🚀 ${title}`,
    `⚠️ Attention : ${title}`,
    `💡 ${title} (et tu vas être surpris·e)`,
    `🔥 ${title}`,
    `❌ Arrête de faire ça : ${title}`,
    `✨ Le secret pour ${title.toLowerCase()}`,
    `👀 POV : ${title}`,
    `🎯 ${title} - Voici comment faire`,
    `💬 On parle de ${title.toLowerCase()} ?`,
    `🤫 Ce que personne ne te dit sur ${title.toLowerCase()}`,
  ];
  return hooks[Math.floor(Math.random() * hooks.length)];
}

function getCTA(platform: Platform): string {
  const ctas: Record<Platform, string[]> = {
    instagram: [
      'Sauvegarde ce post pour ne pas l\'oublier 💾',
      'Partage à quelqu\'un qui en a besoin 💬',
      'Dis-moi en commentaire ce que tu en penses 👇',
      'Double tap si tu es d\'accord ❤️',
    ],
    linkedin: [
      'Votre avis en commentaire ?',
      'Partagez votre expérience 👇',
      'Qu\'en pensez-vous ?',
    ],
    tiktok: [
      'Partage si ça t\'aide !',
      'Commente "OUI" si tu veux la suite',
      'Follow pour plus de conseils',
    ],
    facebook: [
      'Taguez quelqu\'un qui devrait voir ça',
      'Partagez si vous êtes d\'accord',
      'Votre avis en commentaire',
    ],
    youtube: [
      'Likez et abonnez-vous pour plus de contenu',
      'Commentez vos questions ci-dessous',
    ],
    twitter: [
      'RT si vous êtes d\'accord',
      'Votre avis ?',
    ],
  };

  const platformCTAs = ctas[platform] || ctas.instagram;
  return platformCTAs[Math.floor(Math.random() * platformCTAs.length)];
}

function generateCarrouselCaption(title: string, platform: Platform): string {
  if (platform === 'instagram') {
    return `📚 ${title}

Je reçois cette question TOUT LE TEMPS... alors j'ai décidé de tout te révéler dans ce carrousel 👉

Ce que tu vas découvrir :
✨ Les étapes exactes que j'utilise avec mes clientes
✨ L'erreur n°1 qui ruine tout (et comment l'éviter)
✨ Mes astuces de pro pour un résultat qui dure

💾 Sauvegarde maintenant, tu me remercieras plus tard !

👇 Dis-moi en commentaire : tu connaissais déjà ces secrets ?`;
  }

  return `📚 ${title}\n\nDécouvre tous les détails dans ce carrousel 👉\nSwipe pour tout savoir !`;
}

function generateReelCaption(title: string, platform: Platform): string {
  if (platform === 'instagram') {
    return `🎬 ${title}

J'aurais aimé connaître ça il y a 5 ans... ça m'aurait évité tellement d'erreurs !

Alors aujourd'hui je te montre EXACTEMENT :
→ Ce qui marche vraiment (testé sur +100 clientes)
→ L'astuce que les pros gardent secrète
→ Comment avoir le même résultat chez toi

💾 SAUVEGARDE ce reel pour ne pas l'oublier !
❤️ PARTAGE à ta meilleure amie qui en a besoin
💬 Écris "GO" en commentaire si tu veux la suite

#astucepro #conseils #transformation`;
  }

  if (platform === 'tiktok') {
    return `🎬 ${title}\n\nCe secret va tout changer ! 🔥\n\n#pourtoi #fyp #astuce`;
  }

  return `🎬 ${title}\n\nLa technique que tout le monde devrait connaître !`;
}

function generatePostCaption(title: string, platform: Platform, description?: string): string {
  const baseCaption = `${title}

${description || 'Il y a quelques mois, je ne savais pas ça...\n\nEt pourtant, ça a COMPLÈTEMENT changé ma façon de travailler.\n\nAujourd\'hui, je te partage cette découverte qui a transformé mes résultats (et ceux de mes clientes) :\n\n➡️ [Partage ton expertise ici]\n➡️ [Donne un conseil actionnable]\n➡️ [Ajoute un exemple concret]\n\nLe résultat ? Des clientes plus satisfaites et des résultats qui durent vraiment.'}

✨ Et toi, tu connaissais cette astuce ?

${getCTA(platform)}

PS : Si ce post t'aide, sauvegarde-le pour y revenir plus tard 💾`;

  return baseCaption;
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

function enhanceIdeaWithHook(
  title: string,
  format: string,
  platform: string,
  objective: string,
  pillar?: string
): string {
  const hooks = generateHooksForIdea(title, format, platform);
  const selectedHook = hooks[Math.floor(Math.random() * hooks.length)];

  const objectiveGuidance = getObjectiveGuidance(objective);
  const platformTone = getPlatformToneDescription(platform);

  return `🎯 HOOK PROPOSÉ :
"${selectedHook}"

✨ ANGLE STRATÉGIQUE :
${objectiveGuidance}

📱 TON ${platform.toUpperCase()} :
${platformTone}

${pillar ? `🎨 PILIER ÉDITORIAL : ${pillar}\n\n` : ''}💡 STRUCTURE RECOMMANDÉE :
${getStructureForFormat(format, platform)}

🔥 POURQUOI ÇA MARCHE :
→ Hook qui capte l'attention immédiatement
→ Angle ${objective} clairement identifié
→ Adapté aux codes de ${platform}
→ Crée l'engagement naturellement`;
}

function generateHooksForIdea(title: string, format: string, platform: string): string[] {
  const isTikTok = platform === 'tiktok';
  const isLinkedIn = platform === 'linkedin';

  if (isLinkedIn) {
    return [
      `${title} : Ce que personne ne vous dit`,
      `La vérité sur ${title.toLowerCase()} (d'après 5 ans d'expérience)`,
      `${title} - Mon retour d'expérience franc`,
      `Les 3 erreurs que je vois sur ${title.toLowerCase()}`,
    ];
  }

  if (isTikTok) {
    return [
      `POV : Tu découvres ${title.toLowerCase()} 😱`,
      `ATTENDS ❌ ${title} ? Regarde ça !`,
      `${title} - JE VAIS TE CHOQUER 🤯`,
      `Personne te dit ça sur ${title.toLowerCase()} 👀`,
    ];
  }

  return [
    `${title} ✨ Ce que tu vas voir...`,
    `STOP 🛑 ${title.toLowerCase()} - La vraie méthode`,
    `${title} : Le guide que j'aurais aimé avoir 💡`,
    `Tu fais ${title.toLowerCase()} ? Évite ces erreurs 🔥`,
  ];
}

function getObjectiveGuidance(objective: string): string {
  const guidance: Record<string, string> = {
    'attirer': 'Capturer l\'attention avec un résultat spectaculaire ou une promesse forte. Créer la curiosité et l\'envie de découvrir.',
    'éduquer': 'Apporter une vraie valeur éducative. Expliquer le pourquoi avant le comment. Rendre l\'apprentissage facile et actionnable.',
    'convertir': 'Montrer la transformation possible. Créer l\'urgence ou la rareté. CTA clair vers action concrète.',
    'fidéliser': 'Créer de la proximité et de l\'authenticité. Montrer les coulisses. Remercier et impliquer la communauté.',
  };
  return guidance[objective] || 'Créer du contenu de valeur qui résonne avec ton audience.';
}

function getPlatformToneDescription(platform: string): string {
  const tones: Record<string, string> = {
    'instagram': 'Esthétique + Authentique + Storytelling visuel',
    'tiktok': 'Rythmé + Direct + Trending + Fun',
    'linkedin': 'Professionnel + Insights + Valeur business',
    'facebook': 'Conversationnel + Accessible + Communautaire',
    'youtube': 'Approfondi + Pédagogique + Format long',
  };
  return tones[platform] || 'Adapté à ta communauté';
}

function getStructureForFormat(format: string, platform: string): string {
  const isTikTok = platform === 'tiktok';

  const structures: Record<string, string> = {
    'reel': isTikTok
      ? '0-3s : Hook choc → 3-15s : Action/Transformation → 15-20s : Punchline + CTA'
      : '0-3s : Hook visuel → 3-12s : Développement → 12-20s : Valeur + CTA',
    'carrousel': 'Slide 1 : Hook → Slides 2-6 : Contenu valeur → Slide 7 : Récap + CTA',
    'post': 'Visuel fort → Légende accrocheuse → Storytelling → CTA',
    'story': 'Story 1 : Hook → Stories 2-3 : Contenu → Story 4 : Interaction',
    'video': 'Intro (0-30s) → Développement (1-8min) → Conclusion + CTA',
  };
  return structures[format] || 'Structure adaptée au format choisi';
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
    const idea = generateSingleStrategicIdea(
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

function generateSingleStrategicIdea(
  professionContext: string,
  format: string,
  platform: string,
  objective: string,
  pillar: string | undefined,
  customTitle: string | undefined,
  index: number,
  seed: number
): ContentIdea {
  const hookExamples = generateStrategicHooks(format, platform, objective, professionContext, seed);
  const selectedHook = hookExamples[index % hookExamples.length];

  const angle = generateContentAngle(format, platform, objective, professionContext, index, seed);
  const whyItWorks = explainWhyItWorks(format, platform, objective, index, seed);

  const formatGuidance = getFormatSpecificGuidance(format, platform);
  const objectiveStrategy = getObjectiveStrategy(objective);

  const ideaTitle = customTitle || generateIdeaTitle(format, objective, professionContext, index, seed);

  const description = `📌 HOOK EXEMPLE

"${selectedHook}"

🎯 ANGLE DU CONTENU

${angle}

✨ POURQUOI ÇA MARCHE

${whyItWorks}

${formatGuidance}

${objectiveStrategy}

${pillar ? `🎨 PILIER ÉDITORIAL : ${pillar}\n\n` : ''}💡 CONSEIL PRO

${getProTip(format, platform, objective, seed + index)}`;

  return {
    title: ideaTitle,
    description,
    content_type: format,
    platform,
    angle,
    objective,
    type: 'content'
  };
}

function generateStrategicHooks(
  format: string,
  platform: string,
  objective: string,
  professionContext: string,
  seed: number
): string[] {
  const hooks: string[] = [];

  if (platform === 'tiktok') {
    hooks.push(
      `ATTENDS ❌ Avant de faire ça... regarde !`,
      `POV : Tu découvres enfin le secret des pros 😱`,
      `Je vais te CHOQUER avec cette technique 🤯`,
      `Personne ne te dit ça en ${professionContext} 👀`,
      `Cette erreur... presque TOUT LE MONDE la fait ⚠️`
    );
  } else if (platform === 'linkedin') {
    hooks.push(
      `Après 5 ans en ${professionContext}, voici ce que j'ai appris`,
      `La dure réalité du métier de ${professionContext} (et personne n'en parle)`,
      `3 leçons que ${professionContext} m'a apprises sur l'entrepreneuriat`,
      `Comment j'ai transformé ma pratique de ${professionContext} en 6 mois`,
      `Ce que mes clients m'ont appris sur ${professionContext}`
    );
  } else if (platform === 'instagram') {
    if (objective === 'attirer' || objective === 'visibilité') {
      hooks.push(
        `Cette transformation... 😍 Tu ne vas pas y croire`,
        `STOP 🛑 Regarde ce qui se passe quand tu fais ça correctement`,
        `Le secret que tous les pros de ${professionContext} gardent 🤫`,
        `Avant VS Après... Le résultat est DINGUE 🔥`,
        `Tu vois cette différence ? C'est la bonne technique ✨`
      );
    } else if (objective === 'vente' || objective === 'convertir') {
      hooks.push(
        `Elle pensait que c'était impossible... Regarde maintenant 💕`,
        `Ce moment où tu réalises que tu méritais mieux ✨`,
        `3 signes que tu as besoin de ça (et tu ne le sais pas encore)`,
        `Voilà ce qui change VRAIMENT la donne 🎯`,
        `Le problème que 8 personnes sur 10 ont (sans le savoir)`
      );
    } else if (objective === 'engagement' || objective === 'fidéliser') {
      hooks.push(
        `Question pour toi : tu es plutôt A ou B ? 👇`,
        `On en parle ? Ce truc que PERSONNE n'ose dire sur ${professionContext}`,
        `Tag quelqu'un qui a besoin de voir ça immédiatement 💬`,
        `Qui est d'accord avec moi ? 🙋‍♀️`,
        `Raconte-moi en commentaire : tu as déjà vécu ça ?`
      );
    } else {
      hooks.push(
        `Ce que j'aurais aimé savoir AVANT de commencer 💡`,
        `Les 3 erreurs qui ruinent tout (et comment les éviter)`,
        `Le guide complet que tu n'as jamais eu en ${professionContext}`,
        `Pourquoi ça ne marche pas ? Voici la vraie raison`,
        `La méthode que j'utilise avec TOUTES mes clientes`
      );
    }
  } else {
    hooks.push(
      `Le secret bien gardé des professionnels`,
      `Voici ce qui fait VRAIMENT la différence`,
      `La transformation qui va te surprendre`,
      `Ce que personne ne te dit sur ${professionContext}`,
      `Ma méthode signature pour des résultats incroyables`
    );
  }

  return hooks;
}

function generateContentAngle(
  format: string,
  platform: string,
  objective: string,
  professionContext: string,
  index: number,
  seed: number
): string {
  const angles = [
    `Transformation spectaculaire qui capte l'attention immédiatement et crée l'envie de découvrir le processus.`,
    `Démystification d'une croyance limitante commune en ${professionContext}, positionnant ton expertise unique.`,
    `Storytelling authentique basé sur une expérience réelle de cliente, créant identification et émotion.`,
    `Révélation d'une erreur courante avec solution actionnable, apportant de la valeur éducative immédiate.`,
    `Coulisses et authenticité montrant l'humain derrière le professionnel, renforçant la connexion.`
  ];

  return angles[index % angles.length];
}

function explainWhyItWorks(
  format: string,
  platform: string,
  objective: string,
  index: number,
  seed: number
): string {
  const explanations: Record<string, string[]> = {
    'attirer': [
      `→ Capte l'attention dans les 3 premières secondes grâce au pattern interrupt visuel\n→ Crée la curiosité avec une promesse de transformation claire\n→ Format optimisé pour le scroll rapide et la viralité`,
      `→ Joue sur l'identification immédiate de ton audience cible\n→ Promet une solution à un problème qu'ils rencontrent tous\n→ Le format génère naturellement des partages et des saves`,
      `→ Utilise la preuve sociale et le résultat visuel pour convaincre\n→ Crée l'envie de vivre la même expérience\n→ Optimisé pour maximiser la portée organique`,
      `→ S'appuie sur l'effet surprise et la révélation pour capter l'attention\n→ Positionne ton expertise de façon naturelle et crédible\n→ Génère des interactions grâce à la valeur apportée`,
      `→ L'authenticité crée une connexion émotionnelle forte\n→ Se démarque dans un feed saturé de contenu parfait\n→ Favorise l'engagement naturel et les commentaires`
    ],
    'vente': [
      `→ Identifie un problème spécifique que ton audience ressent\n→ Montre la transformation possible de façon tangible\n→ Crée le désir d'obtenir le même résultat`,
      `→ Utilise la preuve sociale pour rassurer et convaincre\n→ Positionne ton offre comme la solution évidente\n→ CTA naturel qui découle logiquement du contenu`,
      `→ Crée l'urgence émotionnelle sans être agressif\n→ Montre la valeur avant de présenter le prix\n→ Réduit les objections en anticipant les questions`,
      `→ S'appuie sur le storytelling pour vendre sans "vendre"\n→ Démontre l'expertise à travers des résultats concrets\n→ Crée un pont naturel vers la prise de rendez-vous`,
      `→ Utilise la scarcité perçue pour déclencher l'action\n→ Présente une opportunité claire et limitée dans le temps\n→ Facilite le passage à l'action avec un CTA direct`
    ],
    'engagement': [
      `→ Pose une question qui invite naturellement à la réponse\n→ Crée le débat positif dans les commentaires\n→ Augmente drastiquement le taux d'interaction`,
      `→ Utilise un format interactif qui demande la participation\n→ Crée un sentiment de communauté et d'appartenance\n→ Les interactions boostent la visibilité algorithmique`,
      `→ S'appuie sur l'opinion et l'identification personnelle\n→ Encourage le partage et le tag entre amis\n→ Génère des conversations authentiques`,
      `→ Crée de la controverse positive qui fait réagir\n→ Invite à partager son expérience personnelle\n→ Favorise les échanges dans les commentaires`,
      `→ Utilise l'interactivité native de la plateforme\n→ Crée du contenu qui demande une réponse immédiate\n→ Augmente le temps passé sur le contenu`
    ],
    'éduquer': [
      `→ Apporte une valeur concrète et actionnable immédiatement\n→ Explique le pourquoi avant le comment pour créer la compréhension\n→ Format digestible qui facilite l'apprentissage`,
      `→ Démonte les idées reçues avec preuves et clarté\n→ Positionne ton expertise de façon pédagogique\n→ Contenu sauvegardable qui génère des retours`,
      `→ Structure claire et progressive qui facilite la mémorisation\n→ Exemples concrets qui rendent l'apprentissage pratique\n→ Crée de l'autorité et de la crédibilité`,
      `→ Simplifie un sujet complexe sans le dénaturer\n→ Donne des étapes actionnables que l'audience peut appliquer\n→ Format optimisé pour la rétention d'information`,
      `→ S'appuie sur des cas réels et des situations concrètes\n→ Anticipe et répond aux questions avant qu'elles soient posées\n→ Crée une ressource de référence partageable`
    ],
    'fidéliser': [
      `→ Montre les coulisses et l'authenticité pour créer proximité\n→ Fait sentir ta communauté privilégiée et importante\n→ Renforce le lien émotionnel avec ton audience`,
      `→ Crée un sentiment d'exclusivité pour ta communauté\n→ Récompense la fidélité par du contenu de valeur\n→ Encourage l'appartenance et la loyauté`,
      `→ Implique directement ton audience dans tes décisions\n→ Montre que leur avis compte vraiment\n→ Crée de la co-création et de l'engagement profond`,
      `→ Partage des moments personnels qui humanisent ta marque\n→ Crée des inside jokes et références communautaires\n→ Favorise le sentiment d'appartenance au groupe`,
      `→ Célèbre ta communauté et ses membres\n→ Crée des rituels et habitudes de consommation\n→ Transforme les followers en véritables fans`
    ]
  };

  const objectiveKey = objective === 'attirer' ? 'attirer'
    : objective === 'convertir' ? 'vente'
    : objective === 'éduquer' ? 'éduquer'
    : objective === 'fidéliser' ? 'fidéliser'
    : 'engagement';

  const relevantExplanations = explanations[objectiveKey];
  return relevantExplanations[index % relevantExplanations.length];
}

function getFormatSpecificGuidance(format: string, platform: string): string {
  if (format === 'carrousel') {
    return `📚 FORMAT CARROUSEL

→ SLIDE 1 : Hook visuel fort avec promesse claire
→ SLIDES 2-6 : Une idée de valeur par slide (max 2-3 lignes)
→ SLIDE 7 : Récapitulatif + CTA fort
→ Design cohérent et lisible en 2 secondes par slide
→ CTA suggéré : "Sauvegarde pour ne pas oublier 💾"`;
  }

  if (format === 'reel' || format === 'video') {
    if (platform === 'tiktok') {
      return `🎬 FORMAT TIKTOK

→ 0-3 SEC : Pattern interrupt CHOC (mouvement brusque, son marquant)
→ 3-15 SEC : Action rapide avec changements toutes les 2-3 secondes
→ 15-18 SEC : Punchline mémorable
→ 18-20 SEC : CTA direct ("Partage", "Follow", "Commente GO")
→ Utilise un son trending pour maximiser la portée`;
    } else {
      return `🎬 FORMAT REEL INSTAGRAM

→ 0-3 SEC : Hook visuel + texte qui arrête le scroll
→ 3-12 SEC : Développement avec storytelling ou démonstration
→ 12-18 SEC : Valeur ajoutée (l'astuce, le secret)
→ 18-20 SEC : Conclusion + CTA doux
→ Sous-titres obligatoires (80% regardent sans son)
→ Esthétique soignée et transitions fluides`;
    }
  }

  if (format === 'post') {
    return `📸 FORMAT POST

→ VISUEL : Photo impactante qui fonctionne seule
→ LÉGENDE : Hook première ligne (125 caractères visibles)
→ STRUCTURE : Problème → Storytelling → Solution → CTA
→ LONGUEUR : 150-300 mots idéalement
→ CTA suggéré : Tag, Sauvegarde, ou Question`;
  }

  if (format === 'story') {
    return `📱 FORMAT STORY

→ STORY 1 : Hook ou question directe
→ STORIES 2-3 : Contenu de valeur segmenté
→ STORY 4 : Interaction (sondage, question, quiz)
→ Durée : 15 secondes max par story
→ Utilise stickers interactifs natifs de la plateforme`;
  }

  return `💡 Adapte le format à ton style et aux codes de ${platform}`;
}

function getObjectiveStrategy(objective: string): string {
  const strategies: Record<string, string> = {
    'attirer': `🎯 STRATÉGIE VISIBILITÉ

→ Focus sur le résultat spectaculaire et la transformation
→ Optimise pour la shareability (contenu facilement partageable)
→ Crée de la relatabilité (ton audience doit se reconnaître)
→ Utilise des éléments visuels forts et impactants`,

    'vente': `🎯 STRATÉGIE VENTE/CONVERSION

→ Identifie le problème spécifique de ton client idéal
→ Montre la transformation de manière tangible et désirable
→ Crée l'urgence émotionnelle sans agressivité
→ CTA clair vers une action concrète (réserver, DM, lien bio)`,

    'convertir': `🎯 STRATÉGIE VENTE/CONVERSION

→ Identifie le problème spécifique de ton client idéal
→ Montre la transformation de manière tangible et désirable
→ Crée l'urgence émotionnelle sans agressivité
→ CTA clair vers une action concrète (réserver, DM, lien bio)`,

    'engagement': `🎯 STRATÉGIE ENGAGEMENT

→ Pose des questions ouvertes qui invitent à la réponse
→ Crée des sondages et interactions natives
→ Utilise les formats participatifs (tag, partage, avis)
→ Lance des débats positifs qui font réagir`,

    'éduquer': `🎯 STRATÉGIE ÉDUCATION

→ Apporte de la valeur actionnable immédiatement
→ Explique simplement sans jargon technique
→ Donne des étapes claires et applicables
→ Crée du contenu de référence sauvegardable`,

    'fidéliser': `🎯 STRATÉGIE FIDÉLISATION

→ Montre les coulisses et ton authenticité
→ Crée des rituels et moments récurrents
→ Implique ta communauté dans tes décisions
→ Célèbre tes membres et crée un sentiment d'appartenance`
  };

  return strategies[objective] || strategies['attirer'];
}

function getProTip(format: string, platform: string, objective: string, seed: number): string {
  const tips = [
    `Les 3 premières secondes décident de TOUT. Si tu ne captes pas l'attention immédiatement, le reste ne sera jamais vu. Teste toujours plusieurs hooks.`,
    `L'algorithme favorise les contenus qui génèrent des interactions rapides. Pose une question ou crée l'émotion dès le début pour maximiser l'engagement.`,
    `La cohérence bat la perfection. Mieux vaut publier régulièrement du contenu authentique que d'attendre le post "parfait" qui ne vient jamais.`,
    `Analyse ce qui marche déjà dans ta niche, mais adapte-le à TA personnalité. La copie ne fonctionne jamais aussi bien que l'inspiration personnalisée.`,
    `Les sauvegardes (saves) sont LE signal le plus fort pour l'algorithme. Crée du contenu de référence que ton audience voudra retrouver.`
  ];

  return tips[Math.floor(seed) % tips.length];
}

function generateIdeaTitle(
  format: string,
  objective: string,
  professionContext: string,
  index: number,
  seed: number
): string {
  const titles = [
    `Transformation ${professionContext} spectaculaire`,
    `L'erreur à éviter en ${professionContext}`,
    `Ma méthode signature révélée`,
    `Coulisses d'une journée pro`,
    `Le secret des résultats durables`
  ];

  return titles[index % titles.length];
}
