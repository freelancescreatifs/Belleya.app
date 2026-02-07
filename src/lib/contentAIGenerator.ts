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

  const contentStructure = `${contextHeader}📍 SLIDE 1 - HOOK
${getHook(title)}

📍 SLIDE 2 - POINT CLÉ 1
${description || 'Exemple : "La préparation c\'est 70% de la réussite - voici pourquoi..."'}

📍 SLIDE 3 - POINT CLÉ 2
Exemple : "L'erreur n°1 que je vois chez 90% de mes clientes"

📍 SLIDE 4 - POINT CLÉ 3
Exemple : "Ma technique secrète pour un résultat qui dure 3x plus longtemps"

📍 SLIDE 5 - ERREUR COURANTE
❌ Exemple : "Ne jamais faire ça - ça ruine tout le travail"

📍 SLIDE FINALE - CTA
👉 Prête à essayer ? Réserve ton RDV en bio !
${platform === 'instagram' ? '💬 Sauvegarde ce carrousel pour ne pas l\'oublier' : ''}`;

  const caption = generateCarrouselCaption(title, platform);
  const hashtags = generateHashtags(title, 'carrousel', platform);

  return { contentStructure, caption, hashtags };
}

function generateReel(title: string, platform: Platform, description?: string, context?: string): GeneratedContent {
  const contextHeader = context ? `\n🎯 ${context}\n\n---\n\n` : '';

  const contentStructure = `${contextHeader}🎬 HOOK (0-3 sec)
${getHook(title)}
Exemple : "Arrête tout, regarde ça..." ou "POV : Tu découvres enfin le secret des pros"

📖 DÉVELOPPEMENT (4-12 sec)
${description || 'Montre la transformation ou le processus étape par étape'}

Structure suggérée :
• PROBLÈME : "Tu as déjà eu ce souci ? Normal, 95% de mes clientes l'ont..."
• SOLUTION : "Voici exactement ce que je fais pour l'éviter"
• AVANT/APRÈS : Montrer le résultat visuel spectaculaire

💡 PUNCHLINE (13-17 sec)
Exemple : "Et voilà pourquoi tu ne referas plus jamais cette erreur !"
ou "C'est ça le secret que les pros ne disent jamais"

🎯 CTA (18-20 sec)
${platform === 'instagram' ? '💾 Sauvegarde pour réessayer chez toi !\n📩 Envoie "INFO" en DM pour en savoir plus' : 'Partage à quelqu\'un qui en a besoin !'}`;

  const caption = generateReelCaption(title, platform);
  const hashtags = generateHashtags(title, 'reel', platform);

  return { contentStructure, caption, hashtags };
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
  platform: string;
  angle: string;
  objective: string;
  type: 'content' | 'event';
  structure?: string;
}

const professionIdeasDatabase: Record<ProfessionKey, Record<string, ContentIdea[]>> = {
  nail_artist: {
    'reel-attirer': [
      {
        title: 'Transformation avant/après',
        description: 'Montrer un avant/après spectaculaire de ongles abîmés transformés en œuvre d\'art',
        content_type: 'reel',
        platform: 'instagram',
        angle: 'POV : Tu regardes la magie opérer en 60 secondes',
        objective: 'attirer',
        type: 'content',
        structure: '0-2s : Ongles abîmés → 3-15s : Processus accéléré → 16-20s : Résultat final + CTA'
      },
      {
        title: 'L\'erreur que toutes les clientes font',
        description: 'Révéler une erreur courante qui abîme les ongles',
        content_type: 'reel',
        platform: 'instagram',
        angle: 'Arrête de faire ça avec tes ongles !',
        objective: 'attirer',
        type: 'content',
        structure: '0-3s : Hook choc → 4-12s : Explication problème → 13-18s : Solution simple'
      },
      {
        title: 'Coulisses d\'une pose technique',
        description: 'Montrer les coulisses d\'une pose complexe étape par étape',
        content_type: 'reel',
        platform: 'instagram',
        angle: 'Regarde comment je crée des ongles parfaits',
        objective: 'attirer',
        type: 'content',
        structure: 'Immersion complète : préparation → pose → finition'
      }
    ],
    'carrousel-éduquer': [
      {
        title: '5 signes que tes ongles ont besoin d\'aide',
        description: 'Carrousel éducatif sur les signaux d\'alerte pour la santé des ongles',
        content_type: 'carrousel',
        platform: 'instagram',
        angle: 'Guide expert : reconnaître les problèmes avant qu\'il soit trop tard',
        objective: 'éduquer',
        type: 'content',
        structure: 'Slide 1: Titre accrocheur → Slides 2-6: 1 signe + explication/slide → Slide 7: Solutions'
      },
      {
        title: 'Gel vs Résine vs Semi-permanent',
        description: 'Comparaison complète des différentes techniques de pose',
        content_type: 'carrousel',
        platform: 'instagram',
        angle: 'Quelle technique choisir pour TES ongles ?',
        objective: 'éduquer',
        type: 'content',
        structure: 'Slide 1: Question → Slides 2-4: 1 technique détaillée/slide → Slide 5: Tableau comparatif'
      },
      {
        title: 'Comment faire durer tes ongles 4 semaines',
        description: 'Les secrets pour une tenue longue durée',
        content_type: 'carrousel',
        platform: 'instagram',
        angle: 'Mes astuces de pro pour des ongles impeccables',
        objective: 'éduquer',
        type: 'content'
      }
    ],
    'story-fideliser': [
      {
        title: 'Sondage : Ta couleur préférée du moment',
        description: 'Story interactive avec sondage sur les tendances couleurs',
        content_type: 'story',
        platform: 'instagram',
        angle: 'Aide-moi à choisir mes prochains vernis !',
        objective: 'fideliser',
        type: 'content'
      },
      {
        title: 'Mini-tour de mon salon',
        description: 'Visite rapide et authentique de ton espace de travail',
        content_type: 'story',
        platform: 'instagram',
        angle: 'Viens découvrir mon petit cocon nail',
        objective: 'fideliser',
        type: 'content'
      }
    ],
    'reel-convertir': [
      {
        title: 'Nouvelle promo du mois',
        description: 'Annoncer une offre spéciale de façon créative',
        content_type: 'reel',
        platform: 'instagram',
        angle: 'Cette semaine seulement : offre spéciale',
        objective: 'convertir',
        type: 'content',
        structure: '0-3s : Accroche promo → 4-10s : Détails offre → 11-15s : CTA fort'
      }
    ]
  },
  estheticienne: {
    'reel-attirer': [
      {
        title: 'Transformation peau avant/après soin',
        description: 'Résultat impressionnant d\'un soin visage signature',
        content_type: 'reel',
        platform: 'instagram',
        angle: 'L\'effet glow immédiat après mon soin visage',
        objective: 'attirer',
        type: 'content',
        structure: 'Avant : peau fatiguée → Pendant : extraits du soin → Après : peau éclatante'
      },
      {
        title: '3 erreurs qui ruinent ta peau',
        description: 'Les erreurs les plus courantes en routine beauté',
        content_type: 'reel',
        platform: 'instagram',
        angle: 'Arrête de faire ça si tu veux une belle peau',
        objective: 'attirer',
        type: 'content',
        structure: '0-3s : Hook → 4-15s : 3 erreurs courantes → 16-20s : Ce qu\'il faut faire'
      }
    ],
    'carrousel-éduquer': [
      {
        title: 'Ta routine selon ton type de peau',
        description: 'Guide personnalisé pour chaque type de peau',
        content_type: 'carrousel',
        platform: 'instagram',
        angle: 'La routine parfaite adaptée à TON type de peau',
        objective: 'éduquer',
        type: 'content',
        structure: 'Slide 1: Les 4 types → Slides 2-5: 1 routine complète/type → Slide 6: Erreurs à éviter'
      },
      {
        title: 'Décoder les ingrédients cosmétiques',
        description: 'Comprendre ce qu\'il y a vraiment dans tes produits',
        content_type: 'carrousel',
        platform: 'instagram',
        angle: 'Guide des ingrédients à chercher (et à éviter)',
        objective: 'éduquer',
        type: 'content'
      }
    ]
  },
  coiffeuse: {
    'reel-attirer': [
      {
        title: 'Transformation coloration spectaculaire',
        description: 'Avant/après d\'une transformation capillaire impressionnante',
        content_type: 'reel',
        platform: 'instagram',
        angle: 'De brune à blonde platine en une séance',
        objective: 'attirer',
        type: 'content',
        structure: 'Avant → Processus (décoloration, soin, coloration) → Résultat final'
      },
      {
        title: 'La coupe tendance du moment',
        description: 'Démonstration de LA coupe que tout le monde demande',
        content_type: 'reel',
        platform: 'instagram',
        angle: 'LA coupe que toutes mes clientes veulent',
        objective: 'attirer',
        type: 'content'
      }
    ],
    'carrousel-éduquer': [
      {
        title: 'Comment choisir sa couleur selon son teint',
        description: 'Guide complet pour trouver la couleur qui te va',
        content_type: 'carrousel',
        platform: 'instagram',
        angle: 'Quelle couleur pour sublimer TON teint ?',
        objective: 'éduquer',
        type: 'content',
        structure: 'Slide 1: Intro colorimétrie → Slides 2-5: Conseils par teint → Slide 6: Nuancier'
      }
    ]
  },
  lash_artist: {
    'reel-attirer': [
      {
        title: 'Transformation regard avec extensions',
        description: 'Avant/après extensions de cils spectaculaire',
        content_type: 'reel',
        platform: 'instagram',
        angle: 'Ce regard de rêve... sans mascara !',
        objective: 'attirer',
        type: 'content',
        structure: 'Avant : cils naturels → Pose en accéléré → Résultat final close-up'
      }
    ],
    'carrousel-éduquer': [
      {
        title: 'Les différents styles d\'extensions',
        description: 'Comparaison des styles : naturel, volume, mega volume',
        content_type: 'carrousel',
        platform: 'instagram',
        angle: 'Quel style d\'extensions correspond à ta personnalité ?',
        objective: 'éduquer',
        type: 'content',
        structure: 'Slide 1: Intro → Slides 2-4: 1 style détaillé + photo → Slide 5: Comparatif'
      }
    ]
  },
  brow_artist: {
    'reel-attirer': [
      {
        title: 'Transformation sourcils',
        description: 'Avant/après restructuration complète des sourcils',
        content_type: 'reel',
        platform: 'instagram',
        angle: 'Des sourcils parfaits qui changent tout le visage',
        objective: 'attirer',
        type: 'content'
      }
    ]
  },
  facialiste: {
    'reel-attirer': [
      {
        title: 'Routine soin visage apaisante',
        description: 'Démonstration d\'un soin signature relaxant',
        content_type: 'reel',
        platform: 'instagram',
        angle: '30 minutes de pur bonheur pour ta peau',
        objective: 'attirer',
        type: 'content'
      }
    ]
  },
  prothesiste_ongulaire: {
    'reel-attirer': [
      {
        title: 'Pose technique ultra-précise',
        description: 'Démonstration d\'une technique de pose avancée',
        content_type: 'reel',
        platform: 'instagram',
        angle: 'Regarde-moi créer ces ongles parfaits au millimètre',
        objective: 'attirer',
        type: 'content'
      }
    ]
  },
  multi_metiers: {
    'reel-attirer': [
      {
        title: 'Ma journée multi-casquettes',
        description: 'Une journée type avec différentes prestations',
        content_type: 'reel',
        platform: 'instagram',
        angle: 'Une journée dans ma vie de pro multi-talents',
        objective: 'attirer',
        type: 'content'
      }
    ]
  }
};

export function generateContentIdeas(
  profession: ProfessionKey | null,
  format: string,
  platform: string,
  objective: string,
  pillar?: string,
  customTitle?: string
): ContentIdea[] {
  const key = `${format}-${objective}`;
  const professionSpecificIdeas = profession ? (professionIdeasDatabase[profession]?.[key] || []) : [];

  if (professionSpecificIdeas.length > 0) {
    const ideasWithPillar = professionSpecificIdeas.map(idea => ({
      ...idea,
      title: customTitle || idea.title,
      description: customTitle ? `Créer du contenu sur : ${customTitle}` : idea.description,
      pillarContext: pillar ? `Axé sur le pilier: ${pillar}` : undefined
    }));
    return ideasWithPillar;
  }

  const genericIdeas: ContentIdea[] = [];

  if (format === 'reel') {
    genericIdeas.push(
      {
        title: 'Coulisses de mon quotidien pro',
        description: `Montrer une journée typique dans ton métier`,
        content_type: format,
        platform,
        angle: 'Immersion authentique dans le quotidien d\'un(e) professionnel(le)',
        objective,
        type: 'content',
        structure: 'Matin → Midi → Après-midi → Bilan de la journée'
      },
      {
        title: 'Mes 3 indispensables',
        description: 'Les 3 outils/produits sans lesquels tu ne peux pas travailler',
        content_type: format,
        platform,
        angle: 'Ce que j\'utilise tous les jours',
        objective,
        type: 'content'
      }
    );
  }

  if (format === 'carrousel') {
    genericIdeas.push(
      {
        title: '5 erreurs de débutant',
        description: 'Les erreurs classiques que tu vois chez tes clientes/clients',
        content_type: format,
        platform,
        angle: 'Guide pratique pour éviter les pièges',
        objective,
        type: 'content',
        structure: 'Slide 1: Titre → Slides 2-6: 1 erreur + solution/slide → Slide 7: Récap'
      },
      {
        title: 'Avant/Après : mes transformations',
        description: 'Sélection de tes plus beaux résultats',
        content_type: format,
        platform,
        angle: 'Ces résultats qui me rendent fière',
        objective,
        type: 'content'
      }
    );
  }

  if (format === 'story') {
    genericIdeas.push(
      {
        title: 'Sondage : Ton avis compte',
        description: 'Demander l\'avis de ta communauté sur un sujet pro',
        content_type: format,
        platform,
        angle: 'J\'ai besoin de ton avis !',
        objective,
        type: 'content'
      },
      {
        title: 'Question du jour',
        description: 'Répondre aux questions fréquentes de façon spontanée',
        content_type: format,
        platform,
        angle: 'Vous m\'avez posé cette question 100 fois',
        objective,
        type: 'content'
      }
    );
  }

  if (format === 'live') {
    genericIdeas.push({
      title: 'Session Q&A en direct',
      description: 'Répondre aux questions de ta communauté en live',
      content_type: format,
      platform,
      angle: 'Pose-moi toutes tes questions !',
      objective,
      type: 'event'
    });
  }

  if (format === 'post') {
    genericIdeas.push(
      {
        title: 'Transformation du jour',
        description: 'Partager un beau résultat client',
        content_type: format,
        platform,
        angle: 'Ce résultat qui m\'a fait vibrer cette semaine',
        objective,
        type: 'content'
      },
      {
        title: 'Conseil de la semaine',
        description: 'Un conseil pratique et actionnable',
        content_type: format,
        platform,
        angle: 'Le conseil que je donne à toutes mes clientes',
        objective,
        type: 'content'
      }
    );
  }

  if (genericIdeas.length === 0) {
    return [
      {
        title: customTitle || 'Contenu personnalisé',
        description: customTitle ? `Créer du contenu sur : ${customTitle}` : `Créer un contenu adapté à ton audience`,
        content_type: format,
        platform,
        angle: 'Partage ton expertise unique',
        objective,
        type: 'content',
        pillarContext: pillar ? `Axé sur le pilier: ${pillar}` : undefined
      }
    ];
  }

  const ideasWithCustomTitle = genericIdeas.map(idea => ({
    ...idea,
    title: customTitle || idea.title,
    description: customTitle ? `Créer du contenu sur : ${customTitle}` : idea.description,
    pillarContext: pillar ? `Axé sur le pilier: ${pillar}` : undefined
  }));

  return ideasWithCustomTitle;
}
