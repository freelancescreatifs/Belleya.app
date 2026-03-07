import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestPayload {
  mode: "ideas" | "produce";
  title?: string;
  content_type: string;
  platform: string;
  objective: string;
  editorial_pillar?: string;
  profession: string;
  target_audience?: string;
  awareness_level?: string;
}

function getProfessionLabel(profession: string): string {
  const labels: Record<string, string> = {
    nail_artist: "Prothésiste ongulaire / Nail Artist",
    estheticienne: "Esthéticienne",
    coiffeuse: "Coiffeuse / Coiffeur",
    lash_artist: "Technicienne cils / Lash Artist",
    brow_artist: "Brow Artist / Technicienne sourcils",
    facialiste: "Facialiste / Spécialiste soins du visage",
    prothesiste_ongulaire: "Prothésiste ongulaire",
    multi_metiers: "Professionnelle de la beauté multi-services",
    coach: "Coach / Consultante",
    freelance: "Freelance créatif",
    photographe: "Photographe",
    maquilleuse: "Maquilleuse professionnelle",
    masseuse: "Masseuse / Praticienne bien-être",
  };
  return labels[profession] || "Professionnelle indépendante";
}

function getTargetAudienceLabel(audience: string): string {
  const labels: Record<string, string> = {
    freelances_debutants: "Freelances débutants",
    freelances_experimentes: "Freelances expérimentés",
    entrepreneurs: "Entrepreneurs",
    createurs_contenu: "Créateurs de contenu",
    independants_creatifs: "Indépendants créatifs",
    dirigeants_pme: "Dirigeants / PME",
    etudiants_reconversion: "Étudiants / Reconversion",
  };
  return labels[audience] || audience;
}

function getAwarenessLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    probleme_inconscient: "Problème inconscient (ne sait pas qu'il a un problème)",
    conscient_probleme: "Conscient du problème (sait qu'il a un souci)",
    conscient_solution: "Conscient de la solution (sait comment le résoudre)",
    conscient_produit: "Conscient du produit (connaît ta solution)",
    pret_acheter: "Prêt à acheter (décision imminente)",
  };
  return labels[level] || level;
}

function buildIdeasSystemPrompt(params: RequestPayload): string {
  const profLabel = getProfessionLabel(params.profession);
  const pillarContext = params.editorial_pillar
    ? `\n- Pilier éditorial : "${params.editorial_pillar}"`
    : "";

  const contentTypeContext = getContentTypeContext(params.content_type);
  const platformContext = getPlatformContext(params.platform);
  const objectiveContext = getObjectiveContext(params.objective);
  const awarenessContext = params.awareness_level
    ? `\n- Conscience : ${getAwarenessLevelLabel(params.awareness_level)}`
    : "";

  const titleContext = params.title
    ? `\n- Titre de post suggéré : "${params.title}". Les idées doivent s'inspirer de cet angle.`
    : "";

  return `Tu es un expert en création de contenu viral, en acquisition et en conversion.

CONTEXTE DE GÉNÉRATION :
- Profession : ${profLabel}
- Plateforme : ${params.platform} ${platformContext}
- Format : ${params.content_type} ${contentTypeContext}
- Objectif : ${params.objective} ${objectiveContext}${pillarContext}${awarenessContext}${titleContext}
- Cible : ${params.target_audience || "audience générale"}

MISSION PRÉCISE :
Génère exactement 5 idées de contenu ultra-spécifiques et exploitables IMMÉDIATEMENT.
Chaque idée doit être différente, avec un angle unique, adaptée au format ${params.content_type}.
ZÉRO contenu générique. ZÉRO redondance.

ADAPTATION PAR FORMAT :
${getFormatAdaptationGuide(params.content_type, params.platform)}

RÈGLES CRITIQUES :
1. Format ${params.content_type.toUpperCase()} : respecte la structure exacte du format
2. Plateforme ${params.platform.toUpperCase()} : adapte le ton, le langage, la longueur
3. Objectif "${params.objective}" : chaque idée doit servir cet objectif
4. Métier "${profLabel}" : vocabulaire, exemples, contexte professionnel
5. Cible "${params.target_audience || 'générale'}" : parle à cette personne précise
6. Niveau de conscience : utilise les bons déclencheurs psychologiques${params.title ? `\n7. Angle similaire à "${params.title}" : inspire-toi mais reste différent` : ""}

FORMAT DE RÉPONSE (JSON strict, tableau à 5 éléments) :
[
  {
    "title": "Hook exemple (phrase accrocheuse spécifique au métier et à l'angle)",
    "hooks_alternatives": ["Hook alternatif 1", "Hook alternatif 2", "Hook alternatif 3"],
    "psychological_triggers": ["Déclencheur 1", "Déclencheur 2", "Déclencheur 3", "Déclencheur 4", "Déclencheur 5"],
    "content_angle": "Angle stratégique unique - pourquoi cet angle fonctionne précisément pour cette cible",
    "retention_structure": ["Élément 1", "Élément 2", "Élément 3", "Élément 4", "Élément 5"],
    "conversion_version": "Texte conversion complet : bénéfice, résultat, urgence, CTA",
    "visual_alignment": ["Recommandation 1", "Recommandation 2", "Recommandation 3"],
    "story_ideas": [
      "Story 1 : approche + slides détaillés",
      "Story 2 : angle différent + slides détaillés",
      "Story 3 : preuve sociale ou coulisses + slides"
    ],
    "pro_tip": "Conseil ultra-actionnable spécifique à cet angle",
    "script_short": "Script court (30-45s) pour ce contenu",
    "script_long": "Script long (45-90s) version détaillée"
  }
]`;
}

function getContentTypeContext(contentType: string): string {
  const contexts: Record<string, string> = {
    reel: "(Vertical 9:16, 15-60s, hook 0-3s, rythme rapide, visuels dynamiques)",
    carrousel: "(Slides 5-10, hook impactant slide 1, progression logique, CTA slide finale)",
    post: "(500-2000 car, paragraphes courts, texte hook en haut, ligne de séparation, CTA bas)",
    story: "(Slides 1-3, hook immédiat, texte court, stickers interactifs, CTA direct)",
    live: "(Conversationnel, engagement direct, Q&A, création de tension progressive)"
  };
  return contexts[contentType] || "";
}

function getPlatformContext(platform: string): string {
  const contexts: Record<string, string> = {
    instagram: "(Plateforme algorithme, hashtags stratégiques, stories en complément, réels privilégiés)",
    tiktok: "(Tendances, sons populaires, hook en 1-2s, suite logique, viralité max)",
    linkedin: "(Professionnel, storytelling business, bénéfice chiffré, engagement commentaires)",
    facebook: "(Audience mature, narratif long acceptable, hook modéré, vidéo autoplay)",
    pinterest: "(Visual-first, longs contenus acceptés, descriptions SEO, clés stratégiques)"
  };
  return contexts[platform] || "";
}

function getObjectiveContext(objective: string): string {
  const contexts: Record<string, string> = {
    attirer: "Créer curiosité, awareness, rupture de croyance. Hook très fort.",
    engager: "Créer interaction, commentaires, partages. Questions, dilemmes, points de vue.",
    vendre: "Conversion directe, urgence, CTA, bénéfice concret, preuve sociale.",
    fideliser: "Renforcer communauté, exclusivité, insider content, coulisses, remerciements."
  };
  return contexts[objective] || "";
}

function getFormatAdaptationGuide(contentType: string, platform: string): string {
  if (contentType === "reel") {
    return `FORMAT REEL (${platform === "instagram" ? "Instagram" : "TikTok"}):
- 0-3s : Hook visuel + textuel fort (pattern interrupt)
- 3-8s : Problème / Situation relatable
- 8-15s : Révélation / Coulisses / Démonstration
- 15-25s : Résultat / Transformation / Bénéfice
- 25-30s : CTA clair + Urgence douce
- Structure : Tension → Solution → Résultat → Action
- Musicque : Tendance, sans voix (texte sur écran)`;
  } else if (contentType === "carrousel") {
    return `FORMAT CARROUSEL :
- Slide 1 : Hook visuel + textuel très percutant (ce slide détermine le taux d'ouverture)
- Slide 2-4 : Développement, valeur progressive
- Slide 5-7 : Preuve, démonstration, résultat
- Slide 8-9 : Bénéfice utilisateur final
- Slide finale : CTA fort + Urgence + Lien/DM
- Stratégie : Chaque slide donne envie de glisser pour découvrir`;
  } else if (contentType === "post") {
    return `FORMAT POST :
- Ligne 1-2 : Hook textuel (première chose vue avant "Lire la suite")
- Ligne 3-5 : Histoire / Contexte / Rapport personnel
- Ligne 6-10 : Valeur principale (conseil, révélation, leçon)
- Ligne 11-15 : Preuve, chiffre, exemple concret
- Dernier ligne : CTA clair (Réserve / DM / Lien)
- Emojis : Modérés, stratégiques (break paragraphes)`;
  } else if (contentType === "story") {
    return `FORMAT STORY (3-5 slides max) :
- Slide 1 : Hook + Question / Sondage sticker
- Slide 2-3 : Contenu court + Engagement
- Slide finale : CTA + Sticker lien / Code promo`;
  } else {
    return "";
  }
}

function buildProduceSystemPrompt(params: RequestPayload): string {
  const profLabel = getProfessionLabel(params.profession);
  const pillarContext = params.editorial_pillar
    ? `\n- Pilier éditorial : "${params.editorial_pillar}"`
    : "";

  const targetAudienceContext = params.target_audience
    ? `\n- Cible audience : ${getTargetAudienceLabel(params.target_audience)}`
    : "";

  const awarenessContext = params.awareness_level
    ? `\n- Niveau de conscience : ${getAwarenessLevelLabel(params.awareness_level)}`
    : "";

  return `Tu es un expert en copywriting court format (Reels / TikTok / Shorts) spécialisé en ${profLabel}, avec une expertise en psychologie comportementale et acquisition.

CONTEXTE STRATÉGIQUE :
- Profession : ${profLabel}
- Plateforme : ${params.platform}
- Format : ${params.content_type}
- Objectif : ${params.objective}${pillarContext}${targetAudienceContext}${awarenessContext}
- Titre / Sujet : ${params.title || "À adapter librement"}

MISSION : Générer du contenu viral prêt à tourner, concret, dense, émotionnel, hautement ciblé sans explication stratégique.

RÈGLES OBLIGATOIRES :
✓ Donne UNIQUEMENT du texte prêt à être dit face caméra
✓ Écriture naturelle, orale, fluide, conversationnelle
✓ Ton direct, impactant, crédible, sans artifice
✓ Pas de phrases molles ni de banalités
✓ Pas de structure théorique, pas de conseils génériques
✓ Pas d'explication marketing ou d'analyse
✓ Adapte le langage et les références à la cible mentionnée
✓ Utilise des déclencheurs psychologiques adaptés au niveau de conscience
✓ Chaque script doit être différent en tone et approche
✓ Aucun contenu générique : chaque ligne doit être spécifique au métier et à la cible

STRUCTURE DE RÉPONSE OBLIGATOIRE :

---

🔥 3 HOOKS PERCUTANTS

Courts. Directs. Impact immédiat.

1️⃣ [Hook 1 : première version percutante]
2️⃣ [Hook 2 : approche différente]
3️⃣ [Hook 3 : angle différent]

---

🎬 SCRIPT COMPLET — VERSION 1

[Format: Reel de 30-45 secondes maximum]

→ 0-3s HOOK
[Texte exact à dire]

→ 3-8s PROBLÈME
[Identification du vrai problème]

→ 8-15s DÉSAMORÇAGE
[Déconstruire une croyance]

→ 15-22s SOLUTION
[Illustration concrète ou avant/après]

→ 22-30s RÉSULTAT
[Résultat tangible émotionnel ou chiffré]

→ 30-38s CTA
[Appel à l'action simple]

---

🎬 SCRIPT COMPLET — VERSION 2

Ton DIFFÉRENT (si V1 était éducative, celle-ci est confrontante ou empathique). Même qualité de détail.

→ 0-3s HOOK
[Texte exact à dire]

→ 3-8s PROBLÈME
[Identification du vrai problème]

→ 8-15s DÉSAMORÇAGE
[Déconstruire une croyance]

→ 15-22s SOLUTION
[Illustration concrète ou avant/après]

→ 22-30s RÉSULTAT
[Résultat tangible émotionnel ou chiffré]

→ 30-38s CTA
[Appel à l'action simple]

---

💡 BONUS (Optionnel)

Conseil ultra pratique pour maximiser la performance (non marketing, juste utile).

---

IMPORTANT :
- Tout en français
- Naturel et oral
- Prêt à tourner immédiatement
- Pas de théorie, uniquement du contenu actif
- Aligné 100% avec le sujet fourni
- Contexte métier : ${profLabel} sur ${params.platform}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: RequestPayload = await req.json();
    const { mode } = payload;

    if (!mode || !["ideas", "produce"].includes(mode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid mode. Use "ideas" or "produce".' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt: string;
    let userMessage: string;

    if (mode === "ideas") {
      systemPrompt = buildIdeasSystemPrompt(payload);
      userMessage = payload.title
        ? `Génère 5 idées de contenu sur le thème : "${payload.title}"`
        : `Génère 5 idées de contenu adaptées à mon profil et mes paramètres.`;
    } else {
      systemPrompt = buildProduceSystemPrompt(payload);
      userMessage = `Produis le script complet et détaillé pour ce sujet : "${payload.title}"`;
    }

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.8,
          max_tokens: mode === "ideas" ? 2000 : 4000,
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errorText);
      let errorMsg = "AI generation failed";

      if (openaiResponse.status === 401) {
        errorMsg = "OpenAI API key invalid or expired. Please check configuration.";
      } else if (openaiResponse.status === 429) {
        errorMsg = "OpenAI rate limit exceeded. Please try again in a moment.";
      } else if (openaiResponse.status === 500) {
        errorMsg = "OpenAI service error. Please try again later.";
      }

      return new Response(
        JSON.stringify({ error: errorMsg, details: errorText.substring(0, 200) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty response from AI" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let responseData: unknown;

    if (mode === "ideas") {
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        responseData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
      } catch {
        responseData = [
          {
            title: content.substring(0, 100),
            description: content,
            angle: "Généré par IA",
          },
        ];
      }
    } else {
      responseData = { script: content };
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
