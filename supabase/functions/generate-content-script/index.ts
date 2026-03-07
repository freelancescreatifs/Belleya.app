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

  return `Tu es un expert en copywriting court format (Reels / TikTok / Shorts) spécialisé en ${profLabel}.

CONTEXTE MÉTIER :
- Profession : ${profLabel}
- Plateforme : ${params.platform}
- Format : ${params.content_type}
- Objectif : ${params.objective}${pillarContext}

MISSION : Générer du contenu vidéo prêt à tourner, concret, dense, émotionnel, sans explication stratégique.

RÈGLES OBLIGATOIRES :
✓ Donne UNIQUEMENT du texte prêt à être dit face caméra
✓ Écriture naturelle, orale, fluide
✓ Ton direct, impactant, crédible
✓ Pas de phrases molles ni de banalités
✓ Pas de structure théorique, pas de conseils génériques
✓ Pas d'explication marketing ou d'analyse

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
