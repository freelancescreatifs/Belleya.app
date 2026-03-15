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
    nail_artist: "Prothesiste ongulaire / Nail Artist",
    estheticienne: "Estheticienne",
    coiffeuse: "Coiffeuse / Coiffeur",
    lash_artist: "Technicienne cils / Lash Artist",
    brow_artist: "Brow Artist / Technicienne sourcils",
    facialiste: "Facialiste / Specialiste soins du visage",
    prothesiste_ongulaire: "Prothesiste ongulaire",
    multi_metiers: "Professionnelle de la beaute multi-services",
    makeup_artist: "Maquilleuse professionnelle / Makeup Artist",
    coach: "Coach / Consultante",
    freelance: "Freelance creatif",
    photographe: "Photographe",
    maquilleuse: "Maquilleuse professionnelle",
    masseuse: "Masseuse / Praticienne bien-etre",
  };
  return labels[profession] || "Professionnelle independante";
}

function getAwarenessLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    probleme_inconscient: "Probleme inconscient",
    conscient_probleme: "Conscient du probleme",
    conscient_solution: "Conscient de la solution",
    conscient_produit: "Conscient du produit",
    pret_acheter: "Pret a acheter",
  };
  return labels[level] || level;
}

function normalizeContentType(ct: string): string {
  const map: Record<string, string> = {
    video: "reel",
    reel: "reel",
    carousel: "carrousel",
    carrousel: "carrousel",
    post: "post",
    story: "story",
    live: "reel",
  };
  return map[ct] || "reel";
}

function getContentTypeLabel(ct: string): string {
  const normalized = normalizeContentType(ct);
  const labels: Record<string, string> = {
    reel: "Reel / TikTok",
    carrousel: "Carrousel",
    post: "Post classique",
    story: "Story",
  };
  return labels[normalized] || ct;
}

function buildIdeasSystemPrompt(params: RequestPayload): string {
  const profLabel = getProfessionLabel(params.profession);
  const pillarContext = params.editorial_pillar
    ? `\n- Pilier editorial : "${params.editorial_pillar}"`
    : "";
  const awarenessContext = params.awareness_level
    ? `\n- Conscience : ${getAwarenessLevelLabel(params.awareness_level)}`
    : "";
  const titleContext = params.title
    ? `\n- Theme suggere : "${params.title}"`
    : "";
  const contentTypeLabel = getContentTypeLabel(params.content_type);

  return `Tu es un stratege contenu social media specialise en ${profLabel}.

CONTEXTE :
- Profession : ${profLabel}
- Plateforme : ${params.platform}
- Format : ${contentTypeLabel}
- Objectif : ${params.objective}${pillarContext}${awarenessContext}${titleContext}
- Cible : ${params.target_audience || "audience generale"}

Genere 3 idees de contenu strategiques en francais. Chaque idee doit etre unique, non generique, adaptee au metier.

REPONSE JSON STRICTE (array de 3 objets) :
[
  {
    "title": "Hook pattern interrupt accrocheur (titre de l'idee)",
    "hooks_alternatives": ["Hook 1", "Hook 2", "Hook 3"],
    "psychological_triggers": ["Declencheur 1", "Declencheur 2"],
    "content_angle": "Explication strategique courte : croyance brisee, probleme revele, comment ca convertit",
    "pro_tip": "1 conseil pro actionnable"
  }
]

REGLES :
- Tout en francais, ton naturel et oral
- Hooks percutants qui arretent le scroll
- Angles specifiques au metier ${profLabel}
- Objectif "${params.objective}" doit guider chaque idee
- Declencheurs parmi : rupture de croyance, curiosite immediate, autorite implicite, soulagement emotionnel, desir d'amelioration, peur de faire faux, projection du resultat
- Retourne UNIQUEMENT le JSON, rien d'autre`;
}

function buildProduceSystemPrompt(params: RequestPayload): string {
  const profLabel = getProfessionLabel(params.profession);
  const pillarContext = params.editorial_pillar
    ? `\n- Pilier editorial : "${params.editorial_pillar}"`
    : "";
  const awarenessContext = params.awareness_level
    ? `\n- Niveau de conscience : ${getAwarenessLevelLabel(params.awareness_level)}`
    : "";
  const normalized = normalizeContentType(params.content_type);
  const contentTypeLabel = getContentTypeLabel(params.content_type);

  let formatInstructions = "";

  if (normalized === "reel") {
    formatInstructions = `STRUCTURE DE REPONSE OBLIGATOIRE :

---

HOOK EXEMPLE (Pattern Interrupt)
1 phrase choc qui cree une micro-tension mentale immediate.

---

3 HOOKS PERCUTANTS

1. [Hook 1 : premiere version percutante]
2. [Hook 2 : approche differente]
3. [Hook 3 : angle different]

---

DECLENCHEURS PSYCHOLOGIQUES UTILISES
Liste les declencheurs utilises.

---

ANGLE DU CONTENU
Quelle croyance est brisee, quel probleme est revele, comment ca mene a la reservation.

---

SCRIPT PROPOSITION 1 -- Angle autorite professionnelle

[Format: Reel de 30-45 secondes maximum]

-> 0-3s HOOK
[Texte exact a dire]
[Suggestion visuelle entre crochets]

-> 3-8s PROBLEME
[Identification du vrai probleme]

-> 8-15s COULISSES / EXPERTISE
[Montrer le savoir-faire avec details concrets]

-> 15-22s RESULTAT
[Preuve tangible, avant/apres]

-> 22-28s BENEFICE
[Ce que le client gagne]

-> 28-35s CTA
[Appel a l'action simple et direct]

---

SCRIPT PROPOSITION 2 -- Angle emotion client

Ton DIFFERENT. Meme qualite de detail.

-> 0-3s HOOK
[Texte exact a dire]

-> 3-8s IDENTIFICATION
[Le spectateur se reconnait]

-> 8-14s RUPTURE
[Deconstruire une croyance]

-> 14-22s EXPLICATION
[Montrer la vraie raison/solution visuellement]

-> 22-30s TRANSFORMATION
[Resultat concret et emotionnel]

-> 30-38s CTA
[Action simple]

---

VERSION ORIENTEE CONVERSION
- Resultat tangible
- Benefice concret
- Urgence douce
- Action simplifiee
- Option DM

---

CONSEIL PRO STRATEGIQUE
1 insight avance en strategie de contenu.`;
  } else if (normalized === "carrousel") {
    formatInstructions = `STRUCTURE DE REPONSE OBLIGATOIRE :

---

HOOK EXEMPLE (Pattern Interrupt)
1 phrase choc qui donne envie de swiper.

---

3 HOOKS PERCUTANTS

1. [Hook 1 percutant pour slide 1]
2. [Hook 2 approche differente]
3. [Hook 3 angle different]

---

DECLENCHEURS PSYCHOLOGIQUES UTILISES
Liste les declencheurs utilises.

---

ANGLE DU CONTENU
Quelle croyance est brisee, quel probleme est revele, comment ca mene a la reservation.

---

CARROUSEL COMPLET -- Slide par slide

Slide 1 -- HOOK
Texte : [Texte exact sur la slide]
Visuel : [Suggestion visuelle detaillee]

Slide 2 -- PROBLEME
Texte : [Texte exact sur la slide]
Visuel : [Suggestion visuelle]

Slide 3 -- RUPTURE DE CROYANCE
Texte : [Texte exact sur la slide]
Visuel : [Suggestion visuelle]

Slide 4 -- EXPLICATION
Texte : [Texte exact sur la slide]
Visuel : [Suggestion visuelle]

Slide 5 -- INSIGHT PROFESSIONNEL
Texte : [Texte exact sur la slide]
Visuel : [Suggestion visuelle]

Slide 6 -- TRANSFORMATION
Texte : [Texte exact sur la slide]
Visuel : [Suggestion visuelle]

Slide 7 -- RESULTAT
Texte : [Texte exact sur la slide]
Visuel : [Suggestion visuelle]

Slide 8 -- CTA
Texte : [Texte exact sur la slide]
Visuel : [Suggestion visuelle]

---

VERSION ORIENTEE CONVERSION
Resultat tangible, benefice, urgence, CTA.

---

CONSEIL PRO STRATEGIQUE
1 insight avance.`;
  } else if (normalized === "post") {
    formatInstructions = `STRUCTURE DE REPONSE OBLIGATOIRE :

---

HOOK EXEMPLE (Pattern Interrupt)
1 ligne d'accroche qui arrete le scroll.

---

3 HOOKS PERCUTANTS

1. [Hook 1 pour les 2 premieres lignes]
2. [Hook 2 approche differente]
3. [Hook 3 angle different]

---

DECLENCHEURS PSYCHOLOGIQUES UTILISES
Liste les declencheurs utilises.

---

ANGLE DU CONTENU
Strategie du post et comment il convertit.

---

POST COMPLET -- VERSION 1

ACCROCHE (2 premieres lignes visibles) :
[Texte hook percutant]

PARAGRAPHE EMOTIONNEL :
[2-3 lignes qui creent identification]

MESSAGE PRINCIPAL :
[3-5 lignes de valeur, conseil, revelation]

AUTORITE :
[1-2 lignes montrant l'expertise]

CTA :
[Question ou invitation a l'action]

HASHTAGS :
[5-10 hashtags strategiques]

---

POST COMPLET -- VERSION 2 (ton different)

[Meme structure, approche differente]

---

VERSION ORIENTEE CONVERSION
Post optimise pour la conversion avec urgence et CTA.

---

CONSEIL PRO STRATEGIQUE
1 insight avance.`;
  } else if (normalized === "story") {
    formatInstructions = `STRUCTURE DE REPONSE OBLIGATOIRE :

---

HOOK EXEMPLE (Pattern Interrupt)
1 accroche pour la premiere story.

---

3 HOOKS PERCUTANTS

1. [Hook 1 pour story d'ouverture]
2. [Hook 2 approche differente]
3. [Hook 3 angle different]

---

DECLENCHEURS PSYCHOLOGIQUES UTILISES
Liste les declencheurs utilises.

---

ANGLE DU CONTENU
Strategie et comment les stories convertissent.

---

SEQUENCE DE STORIES COMPLETE -- VERSION 1 (Interaction)

Slide 1 :
[Texte + sticker sondage/question]
Visuel : [Suggestion]

Slide 2 :
[Texte teaser ou revelation]
Visuel : [Suggestion]

Slide 3 :
[CTA + sticker lien]
Visuel : [Suggestion]

---

SEQUENCE DE STORIES COMPLETE -- VERSION 2 (Coulisses)

Slide 1 :
[Texte + video coulisses]
Visuel : [Suggestion]

Slide 2 :
[Zoom detail + texte]
Visuel : [Suggestion]

Slide 3 :
[CTA reservation]
Visuel : [Suggestion]

---

SEQUENCE DE STORIES COMPLETE -- VERSION 3 (Preuve sociale)

Slide 1 :
[Avis client/temoignage]
Visuel : [Suggestion]

Slide 2 :
[Photo resultat]
Visuel : [Suggestion]

Slide 3 :
[Disponibilites + sticker lien]
Visuel : [Suggestion]

---

VERSION ORIENTEE CONVERSION
Comment optimiser les stories pour generer des reservations.

---

CONSEIL PRO STRATEGIQUE
1 insight avance.`;
  }

  return `Tu es un expert en creation de contenu social media de haut niveau, specialise en ${profLabel}, avec une expertise en psychologie comportementale et acquisition de clients.

CONTEXTE STRATEGIQUE :
- Profession : ${profLabel}
- Plateforme : ${params.platform}
- Format : ${contentTypeLabel}
- Objectif : ${params.objective}${pillarContext}${awarenessContext}
- Titre / Sujet : ${params.title || "A adapter librement"}

MISSION : Generer du contenu pret a produire, concret, dense, emotionnel, hautement cible.

REGLES OBLIGATOIRES :
- Ecriture naturelle, orale, fluide, conversationnelle
- Ton direct, impactant, credible, sans artifice
- Pas de phrases molles ni de banalites
- Pas de contenu generique
- Adapte le langage et les references a la cible mentionnee
- Tout en francais
- Chaque section doit etre specifique au metier ${profLabel}

${formatInstructions}

IMPORTANT :
- Tout en francais
- Naturel et oral
- Pret a produire immediatement
- Contexte metier : ${profLabel} sur ${params.platform}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "Cle API Claude non configuree. Contactez le support." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: RequestPayload = await req.json();
    const { mode } = payload;

    if (!mode || !["ideas", "produce"].includes(mode)) {
      return new Response(
        JSON.stringify({ error: "Mode invalide. Utilisez 'ideas' ou 'produce'." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt: string;
    let userMessage: string;
    let model: string;
    let maxTokens: number;

    if (mode === "ideas") {
      systemPrompt = buildIdeasSystemPrompt(payload);
      model = "claude-3-5-haiku-20241022";
      maxTokens = 4096;
      userMessage = payload.title
        ? `Genere 3 idees de contenu strategiques sur le theme : "${payload.title}". Format: ${getContentTypeLabel(payload.content_type)}.`
        : `Genere 3 idees de contenu strategiques adaptees a mon profil. Format: ${getContentTypeLabel(payload.content_type)}.`;
    } else {
      systemPrompt = buildProduceSystemPrompt(payload);
      model = "claude-sonnet-4-20250514";
      maxTokens = 8192;
      userMessage = `Produis le contenu complet et detaille pour ce sujet : "${payload.title}". Format obligatoire : ${getContentTypeLabel(payload.content_type)}. Inclus TOUTES les sections obligatoires.`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);

    let claudeResponse: Response;
    try {
      claudeResponse = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [
              { role: "user", content: userMessage },
            ],
          }),
          signal: controller.signal,
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "La generation a pris trop de temps. Veuillez reessayer." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw fetchError;
    }

    clearTimeout(timeoutId);

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", claudeResponse.status, errorText);
      let errorMsg = "Erreur de generation IA. Veuillez reessayer.";

      if (claudeResponse.status === 401) {
        errorMsg = "Cle API Claude invalide ou expiree. Contactez le support.";
      } else if (claudeResponse.status === 429) {
        errorMsg = "Limite de requetes atteinte. Veuillez reessayer dans quelques instants.";
      } else if (claudeResponse.status === 500) {
        errorMsg = "Service Claude temporairement indisponible. Reessayez dans un moment.";
      }

      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content?.[0]?.text;

    if (!content) {
      console.error("Claude empty response:", JSON.stringify(claudeData));
      return new Response(
        JSON.stringify({ error: "Reponse vide de l'IA. Veuillez reessayer." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
            hooks_alternatives: [],
            psychological_triggers: [],
            content_angle: content,
            pro_tip: "",
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
      JSON.stringify({ error: "Erreur interne. Veuillez reessayer." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
