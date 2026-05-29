import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

type Action =
  | "generateBio"
  | "generateVoiceTone"
  | "generateModelingAnalysis";

interface PersonaInput {
  name?: string;
  codename?: string;
  niche?: string;
  bigIdea?: string;
  archetype?: string;
  personality?: string[];
  preferredWords?: string[];
  forbiddenWords?: string[];
  visualStyle?: string;
  dressStyle?: string;
}

interface ModelingProfileInput {
  name?: string;
  socialNetwork?: string;
  country?: string;
  niche?: string;
  category?: string;
  tags?: string[];
  notes?: string;
  examples?: Array<{ title?: string; url?: string; analysis?: string }>;
}

function pickProvider() {
  if (process.env.OPENAI_API_KEY) return { provider: openai, model: "gpt-4o-mini" };
  if (process.env.ANTHROPIC_API_KEY)
    return { provider: anthropic, model: "claude-3-5-sonnet-20240620" };
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY)
    return { provider: google, model: "gemini-1.5-flash" };
  return null;
}

function buildModelingPrompt(profile: ModelingProfileInput) {
  const ctx = [
    profile.name && `Perfil: ${profile.name}`,
    profile.socialNetwork && `Rede: ${profile.socialNetwork}`,
    profile.country && `País: ${profile.country}`,
    profile.niche && `Nicho: ${profile.niche}`,
    profile.category && `Categoria: ${profile.category}`,
    profile.tags?.length ? `Tags: ${profile.tags.join(", ")}` : null,
    profile.notes ? `Notas coletadas:\n${profile.notes}` : null,
    profile.examples?.length
      ? `Conteúdos analisados:\n${profile.examples
          .map(
            (e, i) =>
              `${i + 1}. ${e.title ?? "(sem título)"} — ${e.url ?? ""}${
                e.analysis ? ` — ${e.analysis}` : ""
              }`,
          )
          .join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `Você é um estrategista de conteúdo fazendo engenharia reversa do perfil abaixo.
Devolva entre 4 e 6 INSIGHTS acionáveis em português, um por linha, no formato:
- <insight curto e direto, focado em padrão observado, hipótese ou ação testável>

Sem títulos, sem numeração com ponto, sem introdução, apenas os bullets com "- " no começo.
Cada insight deve ter no máximo 160 caracteres.
Foque em: hook usado, padrão de roteiro, estética, frequência, posicionamento, oferta.
Evite generalidades.

Contexto:
${ctx}`;
}

function buildPrompt(action: Action, persona: PersonaInput) {
  const ctx = [
    persona.name && `Nome: ${persona.name}`,
    persona.codename && `Codinome: ${persona.codename}`,
    persona.niche && `Nicho: ${persona.niche}`,
    persona.bigIdea && `Big idea: ${persona.bigIdea}`,
    persona.archetype && `Arquétipo: ${persona.archetype}`,
    persona.personality?.length
      ? `Personalidade: ${persona.personality.join(", ")}`
      : null,
    persona.preferredWords?.length
      ? `Palavras preferidas: ${persona.preferredWords.join(", ")}`
      : null,
    persona.forbiddenWords?.length
      ? `Palavras proibidas: ${persona.forbiddenWords.join(", ")}`
      : null,
    persona.visualStyle && `Estilo visual: ${persona.visualStyle}`,
    persona.dressStyle && `Estilo de vestimenta: ${persona.dressStyle}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (action === "generateBio") {
    return `Você é especialista em copy de posicionamento para creators e empresas.
Com base no contexto da persona abaixo, escreva UMA bio curta (máximo 220 caracteres) em português, em primeira pessoa, com tom alinhado às palavras preferidas e respeitando as proibidas. Sem emojis, sem hashtags, uma frase ou no máximo duas. Devolva apenas o texto da bio, nada mais.

Contexto da persona:
${ctx}`;
  }

  return `Você é especialista em desenvolver guidelines de voz para creators e empresas.
Descreva o TOM DE VOZ ideal para a persona em UMA frase de no máximo 180 caracteres (em português). Use estilo descritivo (ex: "direto, provocador, intelectual, com humor seco"). Sem listas, sem aspas, sem prefixos. Use palavras preferidas e evite as proibidas.

Contexto da persona:
${ctx}`;
}

function deterministicFallback(action: Action, persona: PersonaInput) {
  if (action === "generateBio") {
    const niche = persona.niche || "mercado";
    const idea = persona.bigIdea || "transformar como pessoas pensam sobre o tema";
    const archetype = persona.archetype || "criador";
    return `${persona.name || "Persona"} — ${archetype} no espaço de ${niche}. ${idea}.`.slice(0, 220);
  }
  const traits = persona.personality?.slice(0, 3).join(", ") || "direto e provocador";
  const archetype = persona.archetype ? `, arquétipo ${persona.archetype.toLowerCase()}` : "";
  return `Tom ${traits}${archetype}. Frases curtas, evidência primeiro, sem clichês.`.slice(0, 180);
}

function deterministicModelingFallback(profile: ModelingProfileInput) {
  const niche = profile.niche || "nicho";
  const social = profile.socialNetwork || "rede social";
  const bullets = [
    `- Mapear hook recorrente desse criador no ${social}`,
    `- Hipótese: público de ${niche} responde melhor a prova social explícita`,
    `- Testar variação de pillar copy desse perfil no nosso fluxo`,
    `- Avaliar frequência (posts/semana) versus engajamento médio`,
  ];
  if (profile.examples?.length) {
    bullets.push(
      `- Reusar estrutura de roteiro do conteúdo "${profile.examples[0].title ?? "exemplo"}"`,
    );
  }
  return bullets.join("\n");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !body.action) {
    return Response.json({ error: "action é obrigatório" }, { status: 400 });
  }
  const action = body.action as Action;
  if (
    action !== "generateBio" &&
    action !== "generateVoiceTone" &&
    action !== "generateModelingAnalysis"
  ) {
    return Response.json({ error: "action inválida" }, { status: 400 });
  }

  const picked = pickProvider();

  if (action === "generateModelingAnalysis") {
    const profile = (body.profile ?? {}) as ModelingProfileInput;
    if (!picked) {
      return Response.json({
        text: deterministicModelingFallback(profile),
        provider: "deterministic",
      });
    }
    try {
      const { text } = await generateText({
        model: picked.provider(picked.model),
        prompt: buildModelingPrompt(profile),
        maxOutputTokens: 400,
      });
      return Response.json({ text: text.trim(), provider: picked.model });
    } catch (err: any) {
      return Response.json({
        text: deterministicModelingFallback(profile),
        provider: "fallback",
        error: err?.message ?? "erro desconhecido",
      });
    }
  }

  const persona = (body.persona ?? {}) as PersonaInput;
  if (!picked) {
    return Response.json({
      text: deterministicFallback(action, persona),
      provider: "deterministic",
    });
  }

  try {
    const { text } = await generateText({
      model: picked.provider(picked.model),
      prompt: buildPrompt(action, persona),
      maxOutputTokens: 200,
    });
    const cleaned = text.trim().replace(/^["“'\s]+|["”'\s]+$/g, "");
    return Response.json({ text: cleaned, provider: picked.model });
  } catch (err: any) {
    return Response.json({
      text: deterministicFallback(action, persona),
      provider: "fallback",
      error: err?.message ?? "erro desconhecido",
    });
  }
}
