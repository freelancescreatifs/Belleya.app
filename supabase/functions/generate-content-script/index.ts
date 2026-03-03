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

function buildIdeasSystemPrompt(params: RequestPayload): string {
  const profLabel = getProfessionLabel(params.profession);
  const pillarContext = params.editorial_pillar
    ? `\n- Pilier éditorial actif : "${params.editorial_pillar}". Chaque sujet DOIT s'inscrire dans ce pilier.`
    : "";

  return `Tu es une IA experte en stratégie de contenu pour les réseaux sociaux, spécialisée dans le secteur de la beauté et des services indépendants.

CONTEXTE MÉTIER :
- Profession : ${profLabel}
- Plateforme cible : ${params.platform}
- Format de contenu : ${params.content_type}
- Objectif marketing : ${params.objective}${pillarContext}

MISSION : Génère exactement 5 idées de contenu sous forme de sujets ultra-précis.

RÈGLES STRICTES :
1. Chaque sujet doit être SPÉCIFIQUE et centré sur UN SEUL problème concret
2. Les sujets doivent être DIFFÉRENTS les uns des autres (angles variés)
3. AUCUN sujet vague ou générique (ex: interdit "Conseils beauté")
4. Chaque sujet doit être ACTIONNABLE et exploitable immédiatement
5. Adapte le vocabulaire et les exemples au métier de ${profLabel}
6. Adapte le ton à la plateforme ${params.platform}
7. Aligne chaque sujet avec l'objectif "${params.objective}"

FORMAT DE RÉPONSE (JSON strict) :
Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ou après :
[
  {
    "title": "Titre du sujet (phrase accrocheuse, pas un mot-clé)",
    "description": "2-3 phrases décrivant l'angle précis et pourquoi ce sujet fonctionne",
    "angle": "L'angle stratégique en une phrase"
  }
]`;
}

function buildProduceSystemPrompt(params: RequestPayload): string {
  const profLabel = getProfessionLabel(params.profession);
  const pillarContext = params.editorial_pillar
    ? `\n- Pilier éditorial : "${params.editorial_pillar}"`
    : "";

  return `Tu es une IA experte en stratégie de contenu et génération de scripts courts pour les réseaux sociaux.

CONTEXTE MÉTIER :
- Profession : ${profLabel}
- Plateforme : ${params.platform}
- Format : ${params.content_type}
- Objectif : ${params.objective}${pillarContext}

MISSION : Produis un script COMPLET et DÉTAILLÉ pour le sujet fourni.

Tu DOIS respecter EXACTEMENT cette structure dans ta réponse (utilise les titres de section tels quels) :

---

HOOK EXEMPLE (Pattern Interrupt)

Une phrase forte qui casse une croyance. Directe, percutante, en lien avec le sujet.

---

3 PROPOSITIONS DE HOOKS PERCUTANTS

1. [Hook court et direct]
2. [Hook différent, autre angle]
3. [Hook émotionnel ou confrontant]

---

DÉCLENCHEURS PSYCHOLOGIQUES UTILISÉS

✓ [Trigger 1 — ex: Identification personnelle]
✓ [Trigger 2 — ex: Déculpabilisation]
✓ [Trigger 3 — ex: Révélation d'une cause cachée]
✓ [Trigger 4 — ex: Projection positive]
✓ [Trigger 5 — ex: Solution concrète]

---

ANGLE DU CONTENU

Décris l'angle stratégique choisi en 3-4 phrases. Explique pourquoi cet angle fonctionne pour ${profLabel} sur ${params.platform} avec l'objectif "${params.objective}".

---

FORMAT SCRIPT COMPLET — PROPOSITION 1

Script détaillé avec minutage. Ton naturel, oral, prêt à tourner. Non générique. Adapté au métier de ${profLabel}.

→ 0-3s HOOK
[Texte exact à dire face caméra]

→ 3-8s PROBLÈME
[Texte exact — identifier la douleur du spectateur]

→ 8-15s RÉVÉLATION
[Texte exact — déconstruire la croyance]

→ 15-22s SOLUTION
[Texte exact — la méthode/approche concrète]

→ 22-30s RÉSULTAT
[Texte exact — projection du résultat]

→ 30-38s CTA
[Texte exact — appel à l'action clair]

---

FORMAT SCRIPT COMPLET — PROPOSITION 2

Même niveau de détail, ton DIFFÉRENT (si Proposition 1 était éducative, celle-ci est confrontante ou émotionnelle). Adapté au métier de ${profLabel}.

→ 0-3s HOOK
[Texte exact]

→ 3-8s PROBLÈME
[Texte exact]

→ 8-15s RÉVÉLATION
[Texte exact]

→ 15-22s SOLUTION
[Texte exact]

→ 22-30s RÉSULTAT
[Texte exact]

→ 30-38s CTA
[Texte exact]

---

STRUCTURE RÉTENTION 3 SECONDES

1. [Technique de rétention #1]
2. [Technique de rétention #2]
3. [Technique de rétention #3]
4. [Technique de rétention #4]
5. [Technique de rétention #5]

---

VERSION ORIENTÉE CONVERSION

→ CTA clair : [action précise]
→ Résultat tangible : [ce que le spectateur obtient]
→ Bénéfice concret : [transformation visible]
→ Urgence douce : [raison d'agir maintenant]
→ Action simplifiée : [étape simple pour passer à l'action]

---

ALIGNMENT

Format recommandé pour ${params.platform} : [recommandation technique — ratio, durée, style]

---

3 PROPOSITIONS DE STORIES AUTOUR DU REEL

STORY 1 — [Thème de la story]
• Slide 1 — Direction visuelle : [ex: Vidéo selfie avec texte superposé]
  Texte/Script : "[Texte exact de la slide]"
• Slide 2 — Direction visuelle : [ex: Sticker sondage]
  Texte/Script : "[Question du sondage + options]"
• Slide 3 — Direction visuelle : [ex: Partage du Reel avec sticker lien]
  Texte/Script : "[Texte d'accroche + CTA]"

STORY 2 — [Thème différent]
• Slide 1 — Direction visuelle : [description]
  Texte/Script : "[Texte exact]"
• Slide 2 — Direction visuelle : [description]
  Texte/Script : "[Texte exact]"
• Slide 3 — Direction visuelle : [description]
  Texte/Script : "[Texte exact]"

STORY 3 — [Thème différent]
• Slide 1 — Direction visuelle : [description]
  Texte/Script : "[Texte exact]"
• Slide 2 — Direction visuelle : [description]
  Texte/Script : "[Texte exact]"
• Slide 3 — Direction visuelle : [description]
  Texte/Script : "[Texte exact]"

---

CONSEIL PRO (Ultra stratégique)

Un conseil avancé, spécifique au métier de ${profLabel}, que seul un expert donnerait. Concret et actionnable.

---

RÈGLES :
- Tout le contenu DOIT être en français
- Le ton doit être naturel et oral (pas corporate)
- AUCUNE explication théorique — uniquement du contenu actionnable
- Le script doit être 100% aligné avec le sujet fourni, sans dériver vers d'autres thèmes
- Adapte les exemples et le vocabulaire au métier de ${profLabel}`;
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
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI generation failed", details: errorText }),
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
